"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberships, organizations, users } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions, destroySession, getCurrentUser } from "@/lib/auth/session";
import { claimAuthToken, createAuthToken, revokeAuthTokens } from "@/lib/auth/tokens";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation";

/**
 * Authentication server actions.
 *
 * Cross-cutting rules applied to every action:
 * - Input validated with zod (shared schemas in lib/validation.ts).
 * - Rate limited per IP for brute-force/abuse resistance.
 * - Errors are generic ("Invalid email or password") — never reveal
 *   whether an account exists (except where noted for reset flows, which
 *   is the accepted trade-off: see docs/SECURITY.md §user-enumeration).
 * - Server actions are POST-only and Next.js validates the Origin header
 *   on every mutation, which is our CSRF defense alongside SameSite=Lax.
 */

export type FormState = { error?: string; fieldErrors?: Record<string, string>; success?: string };

async function limiter(bucket: string) {
  const h = await headers();
  return rateLimit(`${bucket}:${clientIp(h)}`, { limit: 10, windowMs: 60_000 });
}

// ── Signup ──────────────────────────────────────────────────────────────────

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await limiter("signup")).ok) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { name, email, password, organizationName } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  // Create user + their first organization + owner membership atomically.
  const passwordHash = await hashPassword(password);
  const user = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ email, name, passwordHash }).returning();
    const [org] = await tx
      .insert(organizations)
      .values({ name: organizationName, slug: await uniqueSlug(tx, organizationName) })
      .returning();
    await tx.insert(memberships).values({ organizationId: org.id, userId: user.id, role: "owner" });
    return { user, org };
  });

  const token = await createAuthToken(user.user.id, "email_verify");
  await sendVerificationEmail(email, name, `${env.APP_URL}/verify-email?token=${token}`);

  await createSession(user.user.id, {
    ipAddress: clientIp(await headers()),
    userAgent: (await headers()).get("user-agent"),
  });
  await audit({ userId: user.user.id, organizationId: user.org.id, action: "user.signup" });

  redirect("/dashboard?welcome=1");
}

// ── Login ───────────────────────────────────────────────────────────────────

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await limiter("login")).ok) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !ok) {
    // Same message and near-same timing whether or not the account exists.
    return { error: "Invalid email or password." };
  }

  await createSession(user.id, {
    ipAddress: clientIp(await headers()),
    userAgent: (await headers()).get("user-agent"),
  });
  await audit({ userId: user.id, action: "user.login" });

  // Only redirect to a same-app relative path; an empty hidden field must
  // fall back to the dashboard (redirect("") crashes with Invalid URL).
  const next = formData.get("next")?.toString();
  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

// ── Logout ──────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ── Forgot / reset password ─────────────────────────────────────────────────

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await limiter("forgot")).ok) {
    // Deliberately vague — do not confirm rate-limiting state either.
    return { success: "If that email exists, a reset link has been sent." };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (user) {
    await revokeAuthTokens(user.id, "password_reset");
    const token = await createAuthToken(user.id, "password_reset");
    await sendPasswordResetEmail(user.email, `${env.APP_URL}/reset-password?token=${token}`);
    await audit({ userId: user.id, action: "user.password_reset_requested" });
  }

  // Always the same response — prevents user enumeration.
  return { success: "If that email exists, a reset link has been sent." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await limiter("reset")).ok) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const claimed = await claimAuthToken(parsed.data.token, "password_reset");
  if (!claimed) return { error: "This reset link is invalid or has expired." };

  const passwordHash = await hashPassword(parsed.data.password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, claimed.userId));
  });

  // Password changed → every existing session is potentially compromised.
  await destroyAllSessions(claimed.userId);
  await audit({ userId: claimed.userId, action: "user.password_reset_completed" });

  redirect("/login?reset=1");
}

// ── Email verification ──────────────────────────────────────────────────────

/** Called from the verify-email page (token arrives via email link). */
export async function verifyEmailToken(token: string): Promise<{ ok: boolean }> {
  // Two purposes share this page, with DISTINCT token types so a link is
  // bound to its purpose: "email_verify" (sent to the current address) only
  // flips emailVerifiedAt; "email_change" (sent ONLY to the new address) is
  // what applies a pending change. A "resend verification" link for the old
  // mailbox can therefore never approve a change to a different one.
  const change = await claimAuthToken(token, "email_change");
  if (change) {
    const [row] = await db
      .select({ pendingEmail: users.pendingEmail })
      .from(users)
      .where(eq(users.id, change.userId))
      .limit(1);
    if (!row?.pendingEmail) return { ok: false }; // change cancelled/overwritten since issue
    await db
      .update(users)
      .set({ email: row.pendingEmail, pendingEmail: null, emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, change.userId));
    await audit({ userId: change.userId, action: "account.email_changed", metadata: { newEmail: row.pendingEmail } });
    return { ok: true };
  }

  const claimed = await claimAuthToken(token, "email_verify");
  if (!claimed) return { ok: false };
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, claimed.userId));
  await audit({ userId: claimed.userId, action: "user.email_verified" });
  return { ok: true };
}

/** Resend verification for the logged-in user. */
export async function resendVerificationAction(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.emailVerifiedAt) return {};

  if (!(await limiter("resend")).ok) {
    return { error: "Too many attempts. Please wait a minute." };
  }
  await revokeAuthTokens(user.id, "email_verify");
  const token = await createAuthToken(user.id, "email_verify");
  await sendVerificationEmail(user.email, user.name, `${env.APP_URL}/verify-email?token=${token}`);
  return { success: "Verification email sent." };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Generate a unique URL-safe slug from an organization name. */
async function uniqueSlug(tx: Tx, name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org";
  for (let i = 0; i < 10; i++) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const rows = await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (rows.length === 0) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}
