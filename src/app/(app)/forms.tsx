"use client";

import { useActionState } from "react";
import {
  createOrgAction,
  createProjectAction,
  inviteMemberAction,
  updateOrgAction,
} from "./actions";
import type { FormState } from "../(auth)/actions";
import { Alert, Button, Field, Input } from "@/components/ui";

const initial: FormState = {};

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Name" error={state.fieldErrors?.name}>
        <Input name="name" required maxLength={100} autoFocus />
      </Field>
      <Field label="Description (optional)" error={state.fieldErrors?.description}>
        <Input name="description" maxLength={500} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}

export function InviteMemberForm({ canInviteAdmins }: { canInviteAdmins: boolean }) {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.success ? <Alert kind="success">{state.success}</Alert> : null}
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" required />
      </Field>
      <Field label="Role" error={state.fieldErrors?.role}>
        <select
          name="role"
          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
        >
          <option value="member">Member</option>
          {canInviteAdmins ? <option value="admin">Admin</option> : null}
        </select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}

export function RenameOrgForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateOrgAction, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.success ? <Alert kind="success">{state.success}</Alert> : null}
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Organization name" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={name} required maxLength={100} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

export function CreateOrgForm() {
  const [state, formAction, pending] = useActionState(createOrgAction, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Organization name" error={state.fieldErrors?.name}>
        <Input name="name" required maxLength={100} autoFocus />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
