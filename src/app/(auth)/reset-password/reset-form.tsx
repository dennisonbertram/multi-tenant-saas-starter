"use client";

import { useActionState } from "react";
import { resetPasswordAction, type FormState } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";

const initial: FormState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <input type="hidden" name="token" value={token} />
      <Field label="New password" error={state.fieldErrors?.password}>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          autoFocus
        />
        <span className="mt-1 block text-xs text-[var(--muted)]">
          At least 10 characters. Signing you out everywhere for safety.
        </span>
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
