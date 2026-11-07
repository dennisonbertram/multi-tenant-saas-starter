import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireOrg } from "@/lib/tenancy";
import { ButtonLink, Card } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; error?: string }>;
}) {
  const { user, org } = await requireOrg();
  const params = await searchParams;

  // Example tenant-scoped query: always filtered by the verified org id.
  const recentProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.organizationId, org.id), eq(projects.archived, false)))
    .orderBy(desc(projects.createdAt))
    .limit(5);

  return (
    <div className="space-y-6">
      {params.welcome ? (
        <Card title={`Welcome, ${user.name ?? user.email}!`}>
          {user.emailVerifiedAt ? null : (
            <p className="text-sm text-muted-foreground">
              We sent a verification link to your email — verify to unlock the full
              experience.
            </p>
          )}
          <ButtonLink href="/projects">Create your first project</ButtonLink>
        </Card>
      ) : null}
      {params.error === "forbidden" ? (
        <Card>
          <p className="text-sm text-red-700">You don&apos;t have permission for that action.</p>
        </Card>
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold">{org.name}</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      </div>

      <Card
        title="Recent projects"
        description="Example tenant-scoped data. Replace the 'projects' table and this page with your real domain."
      >
        {recentProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No projects yet.{" "}
            <Link href="/projects" className="underline">
              Create one
            </Link>{" "}
            to see tenant scoping in action.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentProjects.map((p) => (
              <li key={p.id} className="py-2 text-sm">
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
