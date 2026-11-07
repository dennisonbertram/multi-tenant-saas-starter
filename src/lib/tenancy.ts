import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberships, organizations } from "@/lib/db/schema";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/**
 * Tenancy guard layer — the ONLY sanctioned way to reach tenant data.
 *
 * Rules (enforced by review; see docs/MULTI-TENANCY.md):
 * 1. Never read an organizationId from the client (params, body, headers)
 *    and trust it. The active org comes from a cookie, then is re-verified
 *    against the memberships table on every request.
 * 2. Every query touching tenant-owned rows must include an
 *    `eq(table.organizationId, org.id)` predicate.
 * 3. Mutations that change access (roles, membership) require `owner`/`admin`
 *    via requireRole() — never hand-roll role checks inline.
 */

export const ACTIVE_ORG_COOKIE = "active_org";

export type MemberRole = "owner" | "admin" | "member";

export type ActiveOrg = {
  id: string;
  name: string;
  slug: string;
  role: MemberRole;
};

const ROLE_RANK: Record<MemberRole, number> = { member: 0, admin: 1, owner: 2 };

export function hasRole(role: MemberRole, min: MemberRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** All organizations the user is a member of (for the switcher UI). */
export async function listUserOrganizations(userId: string) {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(organizations.name));
}

/**
 * Resolve the user's active organization: the cookie value, verified
 * against memberships. Falls back to the first org alphabetically.
 * Returns null when the user has no orgs (should not happen post-signup).
 */
export async function getActiveOrg(user: SessionUser): Promise<ActiveOrg | null> {
  const orgs = await listUserOrganizations(user.id);
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const active = orgs.find((o) => o.id === wanted) ?? orgs[0];
  return active;
}

/**
 * Page-level guard: current user + active org, or redirect to login.
 * Use in every authenticated page/layout:
 *
 *   const { user, org } = await requireOrg();
 */
export async function requireOrg(): Promise<{ user: SessionUser; org: ActiveOrg }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const org = await getActiveOrg(user);
  if (!org) redirect("/login");
  return { user, org };
}

/**
 * Same as requireOrg but with a minimum role; redirects (not throws) so
 * pages degrade gracefully. For API routes use requireOrgApi instead.
 */
export async function requireRole(min: MemberRole): Promise<{
  user: SessionUser;
  org: ActiveOrg;
}> {
  const { user, org } = await requireOrg();
  if (!hasRole(org.role, min)) redirect("/dashboard?error=forbidden");
  return { user, org };
}

/**
 * API-route guard: same checks, but returns a Response you can return
 * directly on failure. Example:
 *
 *   const auth = await requireOrgApi(req, "admin");
 *   if (!auth.ok) return auth.response;
 *   const { user, org } = auth;
 */
export async function requireOrgApi(
  req: Request,
  min: MemberRole = "member",
): Promise<
  { ok: true; user: SessionUser; org: ActiveOrg } | { ok: false; response: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const org = await getActiveOrg(user);
  if (!org) {
    return { ok: false, response: Response.json({ error: "No organization" }, { status: 403 }) };
  }
  if (!hasRole(org.role, min)) {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, user, org };
}

/** Verify membership for a specific org id (used when switching orgs). */
export async function verifyMembership(userId: string, organizationId: string) {
  const rows = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .limit(1);
  return rows[0] ?? null;
}
