import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { listAuditEvents } from "@/lib/audit-queries";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

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
          <p className="text-sm text-muted-foreground">No events recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When (UTC)</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatWhen(e.createdAt)}
                  </TableCell>
                  <TableCell>{e.actorEmail ?? "—"}</TableCell>
                  <TableCell className="font-mono">{e.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.metadata ? JSON.stringify(e.metadata) : "—"}
                    {e.ipAddress ? ` · ${e.ipAddress}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
