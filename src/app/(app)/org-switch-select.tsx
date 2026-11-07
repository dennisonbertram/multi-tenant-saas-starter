"use client";

import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

/**
 * Org switcher that submits on change — removes the extra "Switch" click.
 * Keyboard-accessible (Radix Select supports full keyboard navigation).
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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <Select
        name="organizationId"
        defaultValue={currentOrgId}
        onValueChange={() => formRef.current?.requestSubmit()}
      >
        <SelectTrigger aria-label="Switch organization" className="w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
