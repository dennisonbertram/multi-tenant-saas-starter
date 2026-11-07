"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, memberships, users } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { createSession, getCurrentUser } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { claimAuthToken } from "@/lib/auth/tokens";
import { findValidInvitation } from "@/lib/invitations";
import { fieldErrors, signupSchema } from "@/lib/validation";
import type { FormState } from "../actions";

/**
 * Invitation acceptance. Two paths:
 * - Logged in as the invited email → one-click accept.
 * - Logged out → sign up (no personal org created), then accept.
 * A logged-in user with a *different* email is rejected — invitations are
 * addressed to a specific mailbox.
 */

export async function acceptInviteAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const inv = await findValidInvitation(formData.get("token")?.toString() ?? "");
  if (!inv) redirect("/accept-invite?error=invalid");
  if (inv.email !== user.email.toLowerCase()) {
    redirect("/accept-invite?error=mismatch&token=" + encodeURIComponent(formData.get("token")!.toString()));
  }

  await db.transaction(async (tx) => {
    // Mark accepted first (conditional) so a double-submit can't double-join.
    const claimed = await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(and(eq(invitations.id, inv.id), isNull(invitations.acceptedAt)))
      .returning({ id: invitations.id });
    if (claimed.length === 0) return;
    await tx
      .insert(memberships)
      .values({ organizationId: inv.organizationId, userId: user.id, role: inv.role })
      .onConflictDoNothing();
  });

  await audit({
    userId: user.id,
    organizationId: inv.organizationId,
    action: "member.invite_accepted",
    metadata: { role: inv.role },
  });
  redirect("/dashboard");
}

export async function signupViaInviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!rateLimit(`invite-signup:${clientIp(await headers())}`, { limit: 10, windowMs: 60_000 }).ok) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const rawToken = formData.get("token")?.toString() ?? "";
  const inv = await findValidInvitation(rawToken);
  if (!inv) return { error: "This invitation is invalid or has expired." };

  const parsed = signupSchema.omit({ organizationName: true }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.email !== inv.email) {
    return { fieldErrors: { email: `This invitation was sent to ${inv.email}. Sign up with that address.` } };
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, inv.email)).limit(1);
  if (existing.length > 0) {
    return { error: "An account with this email already exists — sign in, then open the invitation link again." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [user] = await db
    .insert(users)
    .values({ email: inv.email, name: parsed.data.name, passwordHash, emailVerifiedAt: new Date() })
    .returning();

  await db.transaction(async (tx) => {
    const claimed = await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(and(eq(invitations.id, inv.id), isNull(invitations.acceptedAt)))
      .returning({ id: invitations.id });
    if (claimed.length === 0) throw new Error("Invitation already accepted");
    await tx.insert(memberships).values({ organizationId: inv.organizationId, userId: user.id, role: inv.role });
  });

  // The invitation email proved mailbox ownership.
  await claimAuthToken(rawToken, "email_verify").catch(() => null);
  await createSession(user.id, {
    ipAddress: clientIp(await headers()),
    userAgent: (await headers()).get("user-agent"),
  });
  await audit({
    userId: user.id,
    organizationId: inv.organizationId,
    action: "member.invite_accepted",
    metadata: { role: inv.role, via: "signup" },
  });
  redirect("/dashboard");
}
