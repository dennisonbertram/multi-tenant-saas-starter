import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, memberships, users } from "@/lib/db/schema";
import { requireOrg } from "@/lib/tenancy";
import { changeMemberRoleAction, removeMemberAction, revokeInvitationAction } from "../actions";
import { RoleSelect } from "../role-select";
import { Alert, Button, Card } from "@/components/ui";
import { InviteMemberForm } from "../forms";

export const metadata = { title: "Members" };

export default async function MembersPage() {
  const { user, org } = await requireOrg();
  const isAdmin = org.role === "admin" || org.role === "owner";

  const members = await db
    .select({
      membershipId: memberships.id,
      userId: users.id,
      email: users.email,
      name: users.name,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, org.id))
    .orderBy(desc(memberships.createdAt));

  const pendingInvites = isAdmin
    ? await db
        .select({
          id: invitations.id,
          email: invitations.email,
          role: invitations.role,
          expiresAt: invitations.expiresAt,
        })
        .from(invitations)
        // Newest first: a deterministic order so admins revoke the row they
        // are looking at (unordered list caused revoking the wrong invite
        // during walkthrough STORY-019).
        .orderBy(desc(invitations.createdAt))
        .where(
          and(
            eq(invitations.organizationId, org.id),
            isNull(invitations.acceptedAt),
            isNull(invitations.revokedAt),
          ),
        )
    : [];

  const visibleInvites = pendingInvites.filter((i) => i.expiresAt > new Date());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Members of {org.name}</h1>

      <Card title="Team">
        <ul className="divide-y divide-[var(--border)]">
          {members.map((m) => (
            <li key={m.membershipId} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {m.name ?? m.email} {m.userId === user.id ? <span className="text-xs text-[var(--muted)]">(you)</span> : null}
                </p>
                <p className="text-xs text-[var(--muted)]">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {org.role === "owner" && m.userId !== user.id ? (
                  <RoleSelect
                    membershipId={m.membershipId}
                    role={m.role}
                    action={changeMemberRoleAction}
                  />
                ) : (
                  <span className="text-xs text-[var(--muted)]">{m.role}</span>
                )}
                {isAdmin && m.userId !== user.id ? (
                  <form action={removeMemberAction}>
                    <input type="hidden" name="membershipId" value={m.membershipId} />
                    <Button variant="danger" className="px-3 py-1.5 text-xs">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {isAdmin ? (
        <>
          <Card title="Pending invitations">
            {visibleInvites.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No pending invitations.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {visibleInvites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm">
                      {i.email} · {i.role}
                    </span>
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="invitationId" value={i.id} />
                      <Button variant="secondary" className="px-3 py-1.5 text-xs">
                        Revoke
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Invite someone" description="They receive an email with a 7-day invitation link.">
            <InviteMemberForm canInviteAdmins={org.role === "owner"} />
          </Card>
        </>
      ) : (
        <Alert kind="info">Only admins and owners can manage members.</Alert>
      )}
    </div>
  );
}
