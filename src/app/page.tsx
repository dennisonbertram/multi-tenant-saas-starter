import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Multi-tenant SaaS Starter
      </h1>
      <p className="max-w-xl text-lg text-[var(--muted)]">
        A self-hosted, dependency-free starting point: built-in authentication,
        organization-based multi-tenancy, invitations, roles and an audit log —
        deployable to any server with Node and PostgreSQL.
      </p>
      <div className="flex gap-3">
        {user ? (
          <Link
            href="/dashboard"
            className="rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
      <p className="text-xs text-slate-400">
        Read the docs in <code>docs/</code> — start with README.md
      </p>
    </main>
  );
}
