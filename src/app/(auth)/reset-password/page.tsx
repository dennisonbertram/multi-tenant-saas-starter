import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Choose a new password</h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            This link is missing its token. Request a new one from{" "}
            <Link href="/forgot-password" className="underline">
              forgot password
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
