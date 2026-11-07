import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";

/**
 * Read model for the /audit page. Deliberately NOT in a "use server" file:
 * every export of a server-action module is callable from the client, and
 * this query must never run without the page's requireRole("admin") guard
 * and the org id derived server-side (never from caller input).
 */
export async function listAuditEvents(orgId: string, page: number) {
  const pageSize = 50;
  return db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      metadata: auditLog.metadata,
      ipAddress: auditLog.ipAddress,
      createdAt: auditLog.createdAt,
      actorEmail: users.email,
      actorName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.userId))
    .where(eq(auditLog.organizationId, orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize + 1)
    .offset((page - 1) * pageSize)
    .then((rows) => ({ rows: rows.slice(0, pageSize), hasMore: rows.length > pageSize }));
}
