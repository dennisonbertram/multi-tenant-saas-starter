"use client";

import { Select } from "@/components/ui";

/**
 * Org switcher that submits on change — removes the extra "Switch" click.
 * Keep the select keyboard-accessible (native element).
 */
export function OrgSwitchSelect({
  organizations,
  currentOrgId,
  action,
}: {
  organizations: { id: string; name: string }[];
  currentOrgId: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action}>
      <Select
        name="organizationId"
        defaultValue={currentOrgId}
        aria-label="Switch organization"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="!w-auto px-2 py-1.5 text-sm"
      >
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </form>
  );
}
