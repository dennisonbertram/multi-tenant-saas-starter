import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, organizations } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";

/**
 * Shared invitation lookup used by the accept-invite page and actions.
 * Returns null for unknown, already-accepted, revoked or expired tokens.
 */
export async function findValidInvitation(rawToken: string) {
  if (!rawToken) return null;
  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      organizationId: invitations.organizationId,
      organizationName: organizations.name,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .innerJoin(organizations, eq(organizations.id, invitations.organizationId))
    .where(
      and(
        eq(invitations.tokenHash, hashToken(rawToken)),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    )
    .limit(1);
  const inv = rows[0];
  if (!inv || inv.expiresAt < new Date()) return null;
  return inv;
}
