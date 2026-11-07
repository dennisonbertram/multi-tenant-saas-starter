import Link from "next/link";
import { requireOrg, listUserOrganizations } from "@/lib/tenancy";
import { logoutAction } from "../(auth)/actions";
import { switchOrgAction } from "./actions";
import { VerifyEmailBanner } from "./verify-banner";
import { Button } from "@/components/ui";

/**
 * Authenticated shell. requireOrg() is the single authorization gate:
 * nothing under this layout renders without a valid session + org.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrg();
  const orgs = await listUserOrganizations(user.id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <Link href="/dashboard" className="font-semibold">
            SaaS Starter
          </Link>

          <nav className="flex gap-1 text-sm">
            <Link href="/dashboard" className="rounded-md px-3 py-1.5 hover:bg-slate-100">
              Dashboard
            </Link>
            <Link href="/projects" className="rounded-md px-3 py-1.5 hover:bg-slate-100">
              Projects
            </Link>
            <Link href="/members" className="rounded-md px-3 py-1.5 hover:bg-slate-100">
              Members
            </Link>
            {org.role !== "member" ? (
              <Link href="/settings" className="rounded-md px-3 py-1.5 hover:bg-slate-100">
                Settings
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {orgs.length > 1 ? (
              <form action={switchOrgAction}>
                <select
                  name="organizationId"
                  defaultValue={org.id}
                  className="rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <Button variant="secondary" className="ml-1 px-2 py-1.5 text-xs">
                  Switch
                </Button>
              </form>
            ) : (
              <span className="text-sm font-medium text-[var(--muted)]">{org.name}</span>
            )}
            <form action={logoutAction}>
              <Button variant="secondary" className="px-3 py-1.5 text-xs">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <VerifyEmailBanner verified={Boolean(user.emailVerifiedAt)} />

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
