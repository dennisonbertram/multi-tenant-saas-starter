import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserOrganizations } from "@/lib/tenancy";
import { Card } from "@/components/ui";
import { CreateOrgForm } from "../(app)/forms";

export const metadata = { title: "Create an organization" };

/**
 * Landing spot for signed-in users who belong to no organization (e.g. they
 * were removed from their only org). Without this page they would bounce
 * between /login (middleware) and requireOrg's redirect — an invisible
 * lockout loop found during walkthrough STORY-021's follow-up.
 */
export default async function NoOrgPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orgs = await listUserOrganizations(user.id);
  if (orgs.length > 0) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Card
        title="You're not in any organization"
        description="Create one to start working — you'll be its owner."
      >
        <CreateOrgForm />
      </Card>
    </main>
  );
}
