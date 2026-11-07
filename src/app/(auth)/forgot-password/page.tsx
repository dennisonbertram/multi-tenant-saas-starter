import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Reset your password</h1>
        <p className="mb-4 text-sm text-[var(--muted)]">
          We&apos;ll email you a link to set a new password.
        </p>
        <ForgotPasswordForm />
      </div>
      <p className="text-center text-sm text-[var(--muted)]">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
