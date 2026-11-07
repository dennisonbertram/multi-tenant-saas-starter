"use client";

import { useActionState, useRef } from "react";
import {
  ErrorText,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

type FormState = { error?: string; fieldErrors?: Record<string, string>; success?: string };

/**
 * Owner-only inline role selector for a membership row.
 * Submits on change (no extra Save step); server errors (e.g. the
 * last-owner guard) render inline. The viewer's own row never renders this
 * component — self-demotion of the last owner is refused server-side and
 * hiding the control avoids the trap entirely.
 */
export function RoleSelect({
  membershipId,
  role,
  action,
}: {
  membershipId: string;
  role: "owner" | "admin" | "member";
  /** changeMemberRoleAction — signature (prevState, formData) so useActionState surfaces server errors. */
  action: (
    prev: FormState,
    formData: FormData,
  ) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="membershipId" value={membershipId} />
      {/* key={role} remounts the select when the saved role changes, so the
          displayed value always matches the DB (uncontrolled defaultValue). */}
      <Select
        key={role}
        name="role"
        defaultValue={role}
        disabled={pending}
        onValueChange={() => formRef.current?.requestSubmit()}
      >
        <SelectTrigger size="sm" aria-label="Member role" className="w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">member</SelectItem>
          <SelectItem value="admin">admin</SelectItem>
          <SelectItem value="owner">owner</SelectItem>
        </SelectContent>
      </Select>
      {state.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}
