"use client";

import { useActionState } from "react";
import { signupViaInviteAction } from "./actions";
import type { FormState } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";

const initial: FormState = {};

export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(signupViaInviteAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <input type="hidden" name="token" value={token} />
      <Field label="Your name" error={state.fieldErrors?.name}>
        <Input name="name" autoComplete="name" required autoFocus />
      </Field>
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" defaultValue={email} readOnly className="bg-slate-50" />
      </Field>
      <Field label="Choose a password" error={state.fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="new-password" required minLength={10} />
        <span className="mt-1 block text-xs text-muted-foreground">At least 10 characters.</span>
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Join the organization"}
      </Button>
    </form>
  );
}
