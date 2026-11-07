"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, memberships, organizations, projects, users } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { clientIp } from "@/lib/auth/rate-limit";
import { createAuthToken, hashToken } from "@/lib/auth/tokens";
import { sendInviteEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import {
  ACTIVE_ORG_COOKIE,
  hasRole,
  requireOrg,
  requireRole,
  verifyMembership,
} from "@/lib/tenancy";
import {
  createOrganizationSchema,
  createProjectSchema,
  fieldErrors,
  inviteMemberSchema,
  roleChangeSchema,
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
