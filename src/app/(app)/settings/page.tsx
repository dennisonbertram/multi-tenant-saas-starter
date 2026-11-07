import { requireRole } from "@/lib/tenancy";
import { createOrgAction } from "../actions";
import { Card } from "@/components/ui";
import { CreateOrgForm, DeleteOrgForm, RenameOrgForm } from "../forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { org } = await requireRole("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card title="Organization" description={`Slug: ${org.slug}`}>
        <RenameOrgForm name={org.name} />
      </Card>

      <Card
        title="Create another organization"
        description="You become its owner and switch to it immediately."
      >
        <CreateOrgForm />
      </Card>

      <Card
        title="Danger zone"
        description="Deletes this organization, all its projects, members, invitations and audit history. This cannot be undone."
      >
        <DeleteOrgForm orgName={org.name} />
      </Card>
    </div>
  );
}
