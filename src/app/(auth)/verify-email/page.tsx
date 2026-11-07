import Link from "next/link";
import { verifyEmailToken } from "../actions";
import { Alert } from "@/components/ui";

export const metadata = { title: "Verify email" };

/**
 * Email links point here with ?token=… . The token is claimed (single-use)
 * during this server render, then the user is told the outcome. There is no
 * sensitive action beyond flipping `emailVerifiedAt`, so handling it on GET
 * is acceptable; the token is random, single-use and short-lived.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailToken(token) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Email verification</h1>
        {result === null ? (
          <p className="text-sm text-[var(--muted)]">
            No token provided. Use the link from your verification email.
          </p>
        ) : result.ok ? (
          <Alert kind="success">
            Email verified. You can close this tab or head to your{" "}
            <Link href="/dashboard" className="underline">
              dashboard
            </Link>
            .
          </Alert>
        ) : (
          <Alert kind="error">
            This verification link is invalid or has expired. You can request a new
            one from your dashboard.
          </Alert>
        )}
      </div>
    </div>
  );
}
