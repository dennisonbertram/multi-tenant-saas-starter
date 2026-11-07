"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, invitations, memberships, organizations, projects, users } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyOtherSessions } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { createAuthToken, hashToken, revokeAuthTokens } from "@/lib/auth/tokens";
import { sendInviteEmail, sendVerificationEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import {
  ACTIVE_ORG_COOKIE,
  hasRole,
  requireOrg,
  requireRole,
  verifyMembership,
} from "@/lib/tenancy";
import {
  changeEmailSchema,
  changePasswordSchema,
  createOrganizationSchema,
  createProjectSchema,
  fieldErrors,
  inviteMemberSchema,
  roleChangeSchema,
  updateNameSchema,
  updateOrganizationSchema,
} from "@/lib/validation";
import type { FormState } from "../(auth)/actions";

/**
 * Organization & member management actions. Every action:
 * 1. authenticates the user (getCurrentUser / requireOrg / requireRole),
 * 2. scopes every query by the verified organizationId,
 * 3. writes an audit entry for anything security-relevant.
 */

// ── Org switching & creation ────────────────────────────────────────────────

export async function switchOrgAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const organizationId = formData.get("organizationId")?.toString() ?? "";
  const membership = await verifyMembership(user.id, organizationId);
  if (!membership) return; // not a member — ignore silently

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/dashboard");
}

export async function createOrgAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createOrganizationSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const base =
    parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "org";
  const slug = `${base}-${Date.now().toString(36)}`;

  const org = await db.transaction(async (tx) => {
    const [org] = await tx.insert(organizations).values({ name: parsed.data.name, slug }).returning();
    await tx.insert(memberships).values({ organizationId: org.id, userId: user.id, role: "owner" });
    return org;
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, org.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  await audit({ userId: user.id, organizationId: org.id, action: "org.created" });
  redirect("/dashboard");
}

// ── Org settings ────────────────────────────────────────────────────────────

export async function updateOrgAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, org } = await requireRole("admin");

  const parsed = updateOrganizationSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await db
    .update(organizations)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(organizations.id, org.id));
  await audit({ userId: user.id, organizationId: org.id, action: "org.renamed", metadata: { name: parsed.data.name } });
  revalidatePath("/settings");
  return { success: "Organization updated." };
}

// ── Members & invitations ───────────────────────────────────────────────────

export async function inviteMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, org } = await requireRole("admin");

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "member",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // Only owners may create admins.
  const role = parsed.data.role === "admin" && !hasRole(org.role, "owner") ? "member" : parsed.data.role;

  // Already a member?
  const existingMember = await db
    .select({ id: users.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.organizationId, org.id), eq(users.email, parsed.data.email)))
    .limit(1);
  if (existingMember.length > 0) {
    return { fieldErrors: { email: "This person is already a member." } };
  }

  const token = createAuthToken(user.id, "invite"); // reuse hashed-token storage
  const [invitation] = await db
    .insert(invitations)
    .values({
      organizationId: org.id,
      email: parsed.data.email,
      role,
      tokenHash: hashToken(await token),
      invitedByUserId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();

  await sendInviteEmail(
    parsed.data.email,
    org.name,
    user.name ?? user.email,
    `${env.APP_URL}/accept-invite?token=${await token}`,
  );
  await audit({
    userId: user.id,
    organizationId: org.id,
    action: "member.invited",
    metadata: { email: parsed.data.email, role, invitationId: invitation.id },
    ipAddress: clientIp(await headers()),
  });
  revalidatePath("/members");
  return { success: `Invitation sent to ${parsed.data.email}.` };
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const { user, org } = await requireRole("admin");
  const invitationId = formData.get("invitationId")?.toString() ?? "";

  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitations.id, invitationId), eq(invitations.organizationId, org.id), sql`${invitations.acceptedAt} IS NULL`));
  await audit({ userId: user.id, organizationId: org.id, action: "member.invite_revoked", metadata: { invitationId } });
  revalidatePath("/members");
}

export async function changeMemberRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, org } = await requireRole("owner");

  const parsed = roleChangeSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // Guard: the organization must always keep at least one owner.
  if (parsed.data.role !== "owner") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(memberships)
      .where(and(eq(memberships.organizationId, org.id), eq(memberships.role, "owner")));
    const target = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.id, parsed.data.membershipId), eq(memberships.organizationId, org.id)))
      .limit(1);
    if (target[0]?.role === "owner" && count <= 1) {
      return { error: "Cannot demote the last owner. Promote another owner first." };
    }
  }

  await db
    .update(memberships)
    .set({ role: parsed.data.role })
    .where(and(eq(memberships.id, parsed.data.membershipId), eq(memberships.organizationId, org.id)));
  await audit({
    userId: user.id,
    organizationId: org.id,
    action: "member.role_changed",
    metadata: { membershipId: parsed.data.membershipId, role: parsed.data.role },
  });
  revalidatePath("/members");
  return { success: "Role updated." };
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const { user, org } = await requireRole("admin");
  const membershipId = formData.get("membershipId")?.toString() ?? "";

  const [target] = await db
    .select({ userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organizationId, org.id)))
    .limit(1);
  if (!target) return;

  // Admins cannot remove owners; nobody can remove the last owner.
  if (target.role === "owner" && !hasRole(org.role, "owner")) return;
  if (target.role === "owner") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(memberships)
      .where(and(eq(memberships.organizationId, org.id), eq(memberships.role, "owner")));
    if (count <= 1) return;
  }

  await db.delete(memberships).where(eq(memberships.id, membershipId));
  await audit({
    userId: user.id,
    organizationId: org.id,
    action: "member.removed",
    metadata: { removedUserId: target.userId },
  });
  revalidatePath("/members");
}

// ── Example tenant-scoped resource (projects) ───────────────────────────────
// Delete these two actions along with the projects table when you build your
// real domain — they exist to demonstrate the scoping pattern.

export async function createProjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, org } = await requireOrg();

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await db.insert(projects).values({
    organizationId: org.id, // ← the tenant scope, always from requireOrg()
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  await audit({ userId: user.id, organizationId: org.id, action: "project.created", metadata: { name: parsed.data.name } });
  revalidatePath("/projects");
  return { success: "Project created." };
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const { user, org } = await requireRole("admin");
  const projectId = formData.get("projectId")?.toString() ?? "";

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, org.id)));
  await audit({ userId: user.id, organizationId: org.id, action: "project.deleted", metadata: { projectId } });
  revalidatePath("/projects");
}

// ── Account settings (issue #3) ─────────────────────────────────────────────

/** Update the signed-in user's display name. */
export async function updateNameAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = updateNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await db.update(users).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(users.id, user.id));
  await audit({ userId: user.id, action: "account.name_changed", metadata: { name: parsed.data.name } });
  revalidatePath("/settings/account");
  revalidatePath("/members");
  return { success: "Name updated." };
}

/** Change password: verify current, re-hash, log out every OTHER device. */
export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const h = await headers();
  if (!rateLimit(`pw-change:${clientIp(h)}`, { limit: 5, windowMs: 60_000 }).ok) {
    return { error: "Too many attempts. Please wait a minute." };
  }
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Log out other devices; keep the current session alive.
  const currentToken = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  if (currentToken) await destroyOtherSessions(user.id, currentToken);

  await audit({
    userId: user.id,
    action: "account.password_changed",
    ipAddress: clientIp(h),
  });
  return { success: "Password changed. Other devices have been signed out." };
}

/**
 * Request an email change: verify password, store the new address as
 * pendingEmail and send a verification link to the NEW address. The address
 * only takes effect when that link is claimed (see verifyEmailToken).
 */
export async function requestEmailChangeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const h = await headers();
  if (!rateLimit(`email-change:${clientIp(h)}`, { limit: 5, windowMs: 60_000 }).ok) {
    return { error: "Too many attempts. Please wait a minute." };
  }
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = changeEmailSchema.safeParse({
    newEmail: formData.get("newEmail"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }
  if (parsed.data.newEmail === user.email) {
    return { fieldErrors: { newEmail: "That is already your email address." } };
  }
  const taken = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.newEmail)).limit(1);
  if (taken.length > 0) {
    return { fieldErrors: { newEmail: "That email address is already in use." } };
  }

  await db.update(users).set({ pendingEmail: parsed.data.newEmail }).where(eq(users.id, user.id));
  await revokeAuthTokens(user.id, "email_change");
  const token = await createAuthToken(user.id, "email_change");
  await sendVerificationEmail(
    parsed.data.newEmail,
    user.name,
    `${env.APP_URL}/verify-email?token=${token}`,
  );
  await audit({
    userId: user.id,
    action: "account.email_change_requested",
    metadata: { newEmail: parsed.data.newEmail },
    ipAddress: clientIp(h),
  });
  revalidatePath("/settings/account");
  return { success: `Verification link sent to ${parsed.data.newEmail}. The change takes effect once you open it.` };
}

// ── Audit log viewer (issue #4) ── moved to src/lib/audit-queries.ts ──────
// (a "use server" file exports every function as a callable action; the
// audit read model must only run behind the page's requireRole guard)

// ── Invitation re-send (issue #5) ───────────────────────────────────────────

/**
 * Re-send an invitation email. Raw tokens are never stored (only hashes),
 * so a re-send REGENERATES the token: the old link stops working, the new
 * email carries a fresh one with the same 7-day expiry window.
 */
export async function resendInvitationAction(formData: FormData): Promise<void> {
  const { user, org } = await requireRole("admin");
  const invitationId = formData.get("invitationId")?.toString() ?? "";

  // Look the invitation up FIRST: Postgres canonicalizes the UUID (case,
  // braces, hyphen variants all match), so the rate limit below keys on the
  // canonical id — equivalent-but-different spellings cannot mint separate
  // limit buckets.
  const [invitation] = await db
    .select({ id: invitations.id, email: invitations.email, role: invitations.role, expiresAt: invitations.expiresAt })
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.organizationId, org.id),
        sql`${invitations.acceptedAt} IS NULL AND ${invitations.revokedAt} IS NULL AND ${invitations.expiresAt} > now()`,
      ),
    )
    .limit(1);
  if (!invitation) return;

  if (!rateLimit(`invite-resend:${invitation.id}`, { limit: 1, windowMs: 60_000 }).ok) {
    return; // at most one re-send per invitation per minute
  }

  const raw = await createAuthToken(user.id, "invite");
  await db
    .update(invitations)
    .set({ tokenHash: hashToken(raw) })
    .where(and(eq(invitations.id, invitation.id), eq(invitations.organizationId, org.id)));

  await sendInviteEmail(invitation.email, org.name, user.name ?? user.email, `${env.APP_URL}/accept-invite?token=${raw}`);
  await audit({
    userId: user.id,
    organizationId: org.id,
    action: "member.invite_resent",
    metadata: { invitationId, email: invitation.email },
    ipAddress: clientIp(await headers()),
  });
  revalidatePath("/members");
}
