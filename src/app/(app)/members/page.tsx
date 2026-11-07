import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, memberships, users } from "@/lib/db/schema";
import { requireOrg } from "@/lib/tenancy";
import { changeMemberRoleAction, removeMemberAction, resendInvitationAction, revokeInvitationAction, leaveOrgAction } from "../actions";
import { RoleSelect } from "../role-select";
import { ConfirmSubmit } from "@/components/confirm-button";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { InviteMemberForm } from "../forms";

export const metadata = { title: "Members" };

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, org } = await requireOrg();
  const params = await searchParams;
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

  // Expired invites stay visible (muted + badge) instead of vanishing
  // silently — an admin should see WHY a link stopped working.
  const activeInvites = pendingInvites.filter((i) => i.expiresAt > new Date());
  const expiredInvites = pendingInvites.filter((i) => i.expiresAt <= new Date());
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Members of {org.name}</h1>

      {params.error === "last-owner" ? (
        <Alert kind="error">
          You are the last owner — transfer ownership to someone else before leaving.
        </Alert>
      ) : null}

      <Card title="Team">
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.membershipId} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {m.name ?? m.email} {m.userId === user.id ? <span className="text-xs text-muted-foreground">(you)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {org.role === "owner" && m.userId !== user.id ? (
                  <RoleSelect
                    membershipId={m.membershipId}
                    role={m.role}
                    action={changeMemberRoleAction}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">{m.role}</span>
                )}
                {isAdmin && m.userId !== user.id ? (
                  <form action={removeMemberAction}>
                    <input type="hidden" name="membershipId" value={m.membershipId} />
                    <ConfirmSubmit confirmLabel="Confirm remove?">Remove</ConfirmSubmit>
                  </form>
                ) : null}
                {m.userId === user.id ? (
                  <form action={leaveOrgAction}>
                    <ConfirmSubmit confirmLabel="Confirm leave?">Leave</ConfirmSubmit>
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
            {activeInvites.length === 0 && expiredInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activeInvites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm">
                      {i.email} · {i.role}
                      <span className="ml-2 text-xs text-muted-foreground">
                        expires {fmtDate(i.expiresAt)}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <form action={resendInvitationAction}>
                        <input type="hidden" name="invitationId" value={i.id} />
                        <Button variant="secondary" size="sm">
                          Resend
                        </Button>
                      </form>
                      <form action={revokeInvitationAction}>
                        <input type="hidden" name="invitationId" value={i.id} />
                        <Button variant="secondary" size="sm">
                          Revoke
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
                {expiredInvites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 py-2 opacity-60">
                    <span className="text-sm">
                      {i.email} · {i.role}
                      <Badge variant="outline" className="ml-2">
                        Expired {fmtDate(i.expiresAt)}
                      </Badge>
                    </span>
                    <div className="flex items-center gap-2">
                      <form action={resendInvitationAction}>
                        <input type="hidden" name="invitationId" value={i.id} />
                        <Button variant="secondary" size="sm">
                          Resend
                        </Button>
                      </form>
                      <form action={revokeInvitationAction}>
                        <input type="hidden" name="invitationId" value={i.id} />
                        <Button variant="secondary" size="sm">
                          Revoke
                        </Button>
                      </form>
                    </div>
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
