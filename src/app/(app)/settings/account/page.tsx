import { requireOrg } from "@/lib/tenancy";
import { Card } from "@/components/ui";
import { ChangeEmailForm, ChangePasswordForm, UpdateNameForm } from "../../forms";

export const metadata = { title: "Account settings" };

export default async function AccountSettingsPage() {
  const { user } = await requireOrg();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Account settings</h1>

      <Card title="Your name" description="Shown on member lists and welcome screens.">
        <UpdateNameForm name={user.name} />
      </Card>

      <Card title="Change password" description="Signing out other devices keeps this session.">
        <ChangePasswordForm />
      </Card>

      <Card
        title="Change email"
        description="Verified via a link to the new address before it takes effect."
      >
        <ChangeEmailForm currentEmail={user.email} pendingEmail={user.pendingEmail ?? null} />
      </Card>
    </div>
  );
}
