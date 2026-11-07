import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireOrg } from "@/lib/tenancy";
import { deleteProjectAction } from "../actions";
import { Card } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-button";
import { CreateProjectForm } from "../forms";

export const metadata = { title: "Projects" };

/**
 * Example tenant-scoped resource. This page demonstrates the full pattern:
 * requireOrg() → org-scoped query → org-scoped mutation → audit entry.
 * Delete it (and the projects table + its two actions) when adding your
 * real domain — see docs/MULTI-TENANCY.md.
 */
export default async function ProjectsPage() {
  const { org } = await requireOrg();

  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.organizationId, org.id), eq(projects.archived, false)))
    .orderBy(desc(projects.createdAt));

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const list = (
    <Card title="All projects">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                {p.description ? (
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span>
                {org.role !== "member" ? (
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <ConfirmSubmit>Delete</ConfirmSubmit>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const create = (
    <Card title="New project">
      <CreateProjectForm />
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>
      {rows.length === 0 ? (
        <>
          {create}
          {list}
        </>
      ) : (
        <>
          {list}
          {create}
        </>
      )}
    </div>
  );
}
