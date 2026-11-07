import Link from "next/link";
import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, memberships, projects } from "@/lib/db/schema";
import { requireOrg } from "@/lib/tenancy";
import { ButtonLink, Card, StatCard } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; error?: string }>;
}) {
  const { user, org } = await requireOrg();
  const params = await searchParams;

  // Example tenant-scoped queries: always filtered by the verified org id.
  const recentProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.organizationId, org.id), eq(projects.archived, false)))
    .orderBy(desc(projects.createdAt))
    .limit(5);

  const [projectCount] = await db
    .select({ value: count() })
    .from(projects)
    .where(and(eq(projects.organizationId, org.id), eq(projects.archived, false)));
  const [memberCount] = await db
    .select({ value: count() })
    .from(memberships)
    .where(eq(memberships.organizationId, org.id));

  // Pending invites are an admin concern — members don't get this tile.
  const isAdmin = org.role !== "member";
  let pendingInvites = 0;
  if (isAdmin) {
    const [inviteCount] = await db
      .select({ value: count() })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, org.id),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      );
    pendingInvites = inviteCount.value;
  }

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active projects" value={projectCount.value} href="/projects" />
        <StatCard label="Members" value={memberCount.value} href="/members" />
        {isAdmin ? (
          <StatCard
            label="Pending invites"
            value={pendingInvites}
            href={pendingInvites > 0 ? "/members" : undefined}
          />
        ) : null}
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
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
