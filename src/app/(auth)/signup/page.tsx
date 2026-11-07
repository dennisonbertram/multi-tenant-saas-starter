import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Create your account</h1>
        <SignupForm />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
