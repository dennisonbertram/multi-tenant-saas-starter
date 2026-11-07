import Link from "next/link";
import { Alert } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const params = await searchParams;
  // Open-redirect guard: only allow same-app relative paths.
  const next = params.next?.startsWith("/") ? params.next : undefined;

  return (
    <div className="space-y-4">
      {params.reset ? (
        <Alert kind="success">Password updated. Sign in with your new password.</Alert>
      ) : null}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
        <LoginForm next={next} />
      </div>
      <p className="text-center text-sm text-[var(--muted)]">
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
