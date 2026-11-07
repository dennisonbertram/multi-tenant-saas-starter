"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";

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

  return (
    <form
      action={formAction}
      className="flex items-center gap-2"
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      <input type="hidden" name="membershipId" value={membershipId} />
      <select
        key={role}
        name="role"
        defaultValue={role}
        disabled={pending}
        aria-label="Member role"
        className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs"
      >
        <option value="member">member</option>
        <option value="admin">admin</option>
        <option value="owner">owner</option>
      </select>
      {state.error ? <span className="text-xs text-[var(--danger)]">{state.error}</span> : null}
    </form>
  );
}
