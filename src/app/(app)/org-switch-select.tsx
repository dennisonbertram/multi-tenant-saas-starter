"use client";

/**
 * Org switcher that submits on change — removes the extra "Switch" click.
 * Falls back to a visible Switch button if JS is disabled? No: this is a
 * client component; without JS the whole app's server actions don't run
 * anyway. Keep the select keyboard-accessible (native element).
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
      <select
        name="organizationId"
        defaultValue={currentOrgId}
        aria-label="Switch organization"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm"
      >
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </form>
  );
}
