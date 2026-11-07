"use client";

import { useActionState } from "react";
import { resendVerificationAction, type FormState } from "../(auth)/actions";
import { Alert, Button } from "@/components/ui";

const initial: FormState = {};

/**
 * Client banner shown while the user's email is unverified. Client-side so
 * the resend action can report success/failure inline.
 */
export function VerifyEmailBanner({ verified }: { verified: boolean }) {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initial);
  if (verified) return null;

  return (
    <form action={formAction} className="mx-auto max-w-5xl px-6 pt-4">
      <Alert kind="info">
        {state.error ? (
          state.error
        ) : state.success ? (
          state.success
        ) : (
          <>
            Your email isn&apos;t verified yet. Check your inbox — or{" "}
            <button type="submit" disabled={pending} className="underline">
              resend the verification email
            </button>
            .
          </>
        )}
      </Alert>
    </form>
  );
}
