"use client";

import { useActionState } from "react";
import { signupAction, type FormState } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";

const initial: FormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Your name" error={state.fieldErrors?.name}>
        <Input name="name" autoComplete="name" required autoFocus />
      </Field>
      <Field label="Work email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label="Password"
        error={state.fieldErrors?.password}
      >
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
        <span className="mt-1 block text-xs text-[var(--muted)]">
          At least 10 characters.
        </span>
      </Field>
      <Field label="Organization name" error={state.fieldErrors?.organizationName}>
        <Input name="organizationName" required placeholder="Acme Inc." />
        <span className="mt-1 block text-xs text-[var(--muted)]">
          You&apos;ll be the owner. You can create more organizations later.
        </span>
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
