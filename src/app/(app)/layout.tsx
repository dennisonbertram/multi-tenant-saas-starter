import { requireOrg, listUserOrganizations } from "@/lib/tenancy";
import { switchOrgAction } from "./actions";
import { AppSidebar } from "./app-sidebar";
import { VerifyEmailBanner } from "./verify-banner";
import { SidebarInset, SidebarProvider, SidebarTrigger, Separator } from "@/components/ui";

/**
 * Authenticated shell — classic two-column dashboard: fixed sidebar on the
 * left (nav, org switcher, user), content column on the right. requireOrg()
 * is the single authorization gate: nothing under this layout renders
 * without a valid session + org. On mobile the sidebar collapses into a
 * sheet; SidebarTrigger toggles it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrg();
  const orgs = await listUserOrganizations(user.id);

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ name: user.name, email: user.email }}
        org={{ id: org.id, name: org.name, role: org.role }}
        orgs={orgs}
        switchAction={switchOrgAction}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-semibold">{org.name}</span>
        </header>
        <VerifyEmailBanner verified={Boolean(user.emailVerifiedAt)} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
