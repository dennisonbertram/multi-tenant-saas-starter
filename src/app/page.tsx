import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui";

export default async function LandingPage() {
  const user = await getCurrentUser();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Multi-tenant SaaS Starter
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        A self-hosted, dependency-free starting point: built-in authentication,
        organization-based multi-tenancy, invitations, roles and an audit log —
        deployable to any server with Node and PostgreSQL.
      </p>
      <div className="flex gap-3">
        {user ? (
          <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
        ) : (
          <>
            <ButtonLink href="/signup">Create an account</ButtonLink>
            <ButtonLink href="/login" variant="secondary">
              Sign in
            </ButtonLink>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Read the docs in <code>docs/</code> — start with README.md
      </p>
    </main>
  );
}
