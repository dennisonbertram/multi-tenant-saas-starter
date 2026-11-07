import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

/**
 * Append an entry to the audit log. Fire-and-forget: logging failures must
 * never break the user-facing action, but we still surface them in logs.
 *
 * Usage:  await audit({ organizationId, userId, action: "member.removed", metadata: {...} })
 */
export async function audit(entry: {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await db.insert(auditLog).values({
      organizationId: entry.organizationId ?? null,
      userId: entry.userId ?? null,
      action: entry.action,
      metadata: entry.metadata ?? null,
      ipAddress: entry.ipAddress ?? null,
    });
  } catch (error) {
    console.error("audit log write failed:", error);
  }
}
