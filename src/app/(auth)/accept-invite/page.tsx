import { getCurrentUser } from "@/lib/auth/session";
import { findValidInvitation } from "@/lib/invitations";
import { Alert, Button, Card } from "@/components/ui";
import { acceptInviteAction } from "./actions";
import { InviteSignupForm } from "./invite-signup-form";

export const metadata = { title: "Accept invitation" };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <Card title="Invitation">
        <Alert kind="error">This invitation link is missing its token.</Alert>
      </Card>
    );
  }

  const invitation = await findValidInvitation(token);
  if (!invitation) {
    return (
      <Card title="Invitation">
        <Alert kind="error">This invitation is invalid or has expired.</Alert>
      </Card>
    );
  }

  const user = await getCurrentUser();

  return (
    <Card
      title={`Join ${invitation.organizationName}`}
      description={`You were invited as ${invitation.role}.`}
    >
      <div className="space-y-4">
        {error === "mismatch" ? (
          <Alert kind="error">
            This invitation was sent to a different email address. Sign in with the
            invited account, or open the link from that mailbox.
          </Alert>
        ) : null}

        {user ? (
          user.email.toLowerCase() === invitation.email ? (
            <>
              <p className="text-sm text-muted-foreground">
                You are signed in as <strong>{user.email}</strong>. Accept below to join.
              </p>
              <form action={acceptInviteAction}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit">Accept invitation</Button>
              </form>
            </>
          ) : (
            <Alert kind="error">
              You are signed in as {user.email}, but this invitation was sent to{" "}
              {invitation.email}. Sign out and open the link from the right mailbox.
            </Alert>
          )
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Create your account below to join {invitation.organizationName}. Use the
              invited address ({invitation.email}).
            </p>
            <InviteSignupForm token={token} email={invitation.email} />
          </>
        )}
      </div>
    </Card>
  );
}
