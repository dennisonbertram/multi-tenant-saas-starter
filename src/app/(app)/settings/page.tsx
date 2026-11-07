import { requireRole } from "@/lib/tenancy";
import { createOrgAction } from "../actions";
import { Card } from "@/components/ui";
import { CreateOrgForm, RenameOrgForm } from "../forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { org } = await requireRole("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card title="Organization" description={`Slug: ${org.slug} · your role: ${org.role}`}>
        <RenameOrgForm name={org.name} />
      </Card>

      <Card
        title="Create another organization"
        description="You become its owner and switch to it immediately."
      >
        <CreateOrgForm />
      </Card>
    </div>
  );
}
