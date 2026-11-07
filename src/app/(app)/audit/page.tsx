import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { listAuditEvents } from "../actions";
import { Card } from "@/components/ui";

export const metadata = { title: "Audit log" };

function formatWhen(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

/**
 * Read-only audit trail for the active organization. Owner/admin only
 * (requireRole). The audit log is forensic evidence, not authorization —
 * never gate permissions on it.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { org } = await requireRole("admin");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { rows, hasMore } = await listAuditEvents(org.id, page);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>

      <Card title={`Security events in ${org.name}`}>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)]">
                  <th className="py-2 pr-4 font-medium">When (UTC)</th>
                  <th className="py-2 pr-4 font-medium">Actor</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap py-2 pr-4 text-xs text-[var(--muted)]">
                      {formatWhen(e.createdAt)}
                    </td>
                    <td className="py-2 pr-4 text-xs">{e.actorEmail ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{e.action}</td>
                    <td className="py-2 text-xs text-[var(--muted)]">
                      {e.metadata ? JSON.stringify(e.metadata) : "—"}
                      {e.ipAddress ? ` · ${e.ipAddress}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-4 text-sm">
        {page > 1 ? (
          <Link href={`/audit?page=${page - 1}`} className="underline">
            ← Newer
          </Link>
        ) : null}
        {hasMore ? (
          <Link href={`/audit?page=${page + 1}`} className="underline">
            Older →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
