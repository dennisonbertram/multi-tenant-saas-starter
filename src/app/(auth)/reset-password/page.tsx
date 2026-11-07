import Link from "next/link";
import { peekAuthToken } from "@/lib/auth/tokens";
import { ResetPasswordForm } from "./reset-form";
import { Alert } from "@/components/ui";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  // Reject used/expired/unknown tokens up front — otherwise the user fills
  // the form only to be rejected on submit (walkthrough STORY-030).
  const tokenValid = token ? Boolean(await peekAuthToken(token, "password_reset")) : false;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Choose a new password</h1>
        {!token ? (
          <p className="text-sm text-muted-foreground">
            This link is missing its token. Request a new one from{" "}
            <Link href="/forgot-password" className="underline">
              forgot password
            </Link>
            .
          </p>
        ) : !tokenValid ? (
          <Alert kind="error">
            This reset link is invalid or has expired. Request a new one from{" "}
            <Link href="/forgot-password" className="underline">
              forgot password
            </Link>
            .
          </Alert>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
    </div>
  );
}
