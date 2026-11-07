"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type FormState } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";

const initial: FormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.success ? <Alert kind="success">{state.success}</Alert> : null}
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
