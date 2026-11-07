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
    .where(eq(projects.organizationId, org.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      <Card title="New project">
        <CreateProjectForm />
      </Card>

      <Card title={`All projects in ${org.name}`}>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  {p.description ? (
                    <p className="text-xs text-[var(--muted)]">{p.description}</p>
                  ) : null}
                </div>
                {org.role !== "member" ? (
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <ConfirmSubmit>Delete</ConfirmSubmit>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
