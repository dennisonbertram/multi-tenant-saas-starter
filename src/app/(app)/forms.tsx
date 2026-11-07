"use client";

import { useActionState, useState } from "react";
import {
  changePasswordAction,
  createOrgAction,
  deleteOrgAction,
  createProjectAction,
  inviteMemberAction,
  requestEmailChangeAction,
  updateNameAction,
  updateOrgAction,
} from "./actions";
import type { FormState } from "../(auth)/actions";
import {
  Alert,
  Button,
  Field,
  Input,
  PasswordInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

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
        <Select name="role" defaultValue="member">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            {canInviteAdmins ? <SelectItem value="admin">Admin</SelectItem> : null}
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}

export function DeleteOrgForm({ orgName }: { orgName: string }) {
  const [state, formAction, pending] = useActionState(deleteOrgAction, initial);
  const [value, setValue] = useState("");
  const matches = value === orgName;
  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field
        label={`Type "${orgName}" to confirm`}
        error={state.fieldErrors?.confirmName}
      >
        <Input
          name="confirmName"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          required
        />
      </Field>
      <Button type="submit" variant="danger" disabled={pending || !matches}>
        {pending ? "Deleting…" : "Delete organization forever"}
      </Button>
    </form>
  );
}

export function RenameOrgForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateOrgAction, initial);
  const [value, setValue] = useState(name);
  const dirty = value !== name;
  return (
    <form action={formAction} className="space-y-3">
      {state.success ? <Alert kind="success">{state.success}</Alert> : null}
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Organization name" error={state.fieldErrors?.name}>
        <Input
          name="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          maxLength={100}
        />
      </Field>
      <Button type="submit" disabled={pending || !dirty}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

export function CreateOrgForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const [state, formAction, pending] = useActionState(createOrgAction, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Organization name" error={state.fieldErrors?.name}>
        <Input name="name" required maxLength={100} autoFocus={autoFocus} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}

export function UpdateNameForm({ name }: { name: string | null }) {
  const [state, formAction, pending] = useActionState(updateNameAction, initial);
  const original = name ?? "";
  const [value, setValue] = useState(original);
  const dirty = value !== original;
  return (
    <form action={formAction} className="space-y-3">
      {state.success ? <Alert kind="success">{state.success}</Alert> : null}
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Display name" error={state.fieldErrors?.name}>
        <Input
          name="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          maxLength={100}
        />
      </Field>
      <Button type="submit" disabled={pending || !dirty}>
        {pending ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.success ? <Alert kind="success">{state.success}</Alert> : null}
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      <Field label="Current password" error={state.fieldErrors?.currentPassword}>
        <PasswordInput name="currentPassword" autoComplete="current-password" required />
      </Field>
      <Field label="New password" error={state.fieldErrors?.newPassword}>
        <PasswordInput name="newPassword" minLength={10} autoComplete="new-password" required />
      </Field>
      <p className="text-xs text-muted-foreground">At least 10 characters. Other devices are signed out.</p>
      <Button type="submit" disabled={pending}>
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  );
}

export function ChangeEmailForm({ currentEmail, pendingEmail }: { currentEmail: string; pendingEmail: string | null }) {
  const [state, formAction, pending] = useActionState(requestEmailChangeAction, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.success ? <Alert kind="success">{state.success}</Alert> : null}
      {state.error ? <Alert kind="error">{state.error}</Alert> : null}
      {pendingEmail ? (
        <Alert kind="error">
          A change to <strong>{pendingEmail}</strong> is pending — open the verification link we
          sent to that address to complete it.
        </Alert>
      ) : null}
      <Field label="New email" error={state.fieldErrors?.newEmail}>
        <Input name="newEmail" type="email" required autoComplete="email" />
      </Field>
      <Field label="Current password" error={state.fieldErrors?.currentPassword}>
        <PasswordInput name="currentPassword" autoComplete="current-password" required />
      </Field>
      <p className="text-xs text-muted-foreground">
        We send a verification link to the new address; the change takes effect when you open it.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request email change"}
      </Button>
      <p className="text-xs text-muted-foreground">Current email: {currentEmail}</p>
    </form>
  );
}
