import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  // Real session check (DB-backed). Signed-in users skip the form; a stale
  // cookie just renders the form instead of looping (middleware no longer
  // bounces auth pages on cookie presence alone).
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  // Open-redirect guard: only allow same-app relative paths.
  const next = params.next?.startsWith("/") ? params.next : undefined;

  return (
    <div className="space-y-4">
      {params.reset ? (
        <Alert kind="success">Password updated. Sign in with your new password.</Alert>
      ) : null}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
        <LoginForm next={next} />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline">
          Forgot your password?
        </Link>
        {" · "}
        <Link href="/signup" className="underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
