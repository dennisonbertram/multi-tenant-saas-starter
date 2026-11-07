/**
 * Tiny UI primitives — the design system (see docs/DESIGN-SYSTEM.md).
 * Intentionally dependency-free (no component library). Every button, input,
 * select, table and link-button in the app MUST render through these — never
 * hand-roll Tailwind for a new interactive element.
 */

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  TableHTMLAttributes,
} from "react";

/** Single source of truth for button visuals — reused by Button, ButtonLink
 * and ConfirmSubmit so the three can never drift apart. */
export function buttonStyles(
  variant: "primary" | "secondary" | "danger" = "primary",
): string {
  const styles = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50",
    secondary:
      "bg-white text-[var(--foreground)] border border-[var(--border)] hover:bg-slate-50 disabled:opacity-50",
    danger:
      "bg-[var(--danger)] text-white hover:bg-red-700 disabled:opacity-50",
  }[variant];
  return `inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${styles}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return <button className={`${buttonStyles(variant)} ${className}`} {...props} />;
}

/** Anchor styled as a button — for navigations that must look like the
 * page's primary action ("Create your first project", "Go home"). */
export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return <a className={`${buttonStyles(variant)} ${className}`} {...props} />;
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-blue-100 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}

/** Inline error text for controls that don't sit in a Field (e.g. selects
 * that submit on change). Same styling as Field's error. */
export function ErrorText({ children }: { children: ReactNode }) {
  return <span className="text-xs text-[var(--danger)]">{children}</span>;
}

/** Muted supporting text — the standard for helper/hint lines. */
export function Muted({ className = "", children }: { className?: string; children: ReactNode }) {
  return <span className={`text-[var(--muted)] ${className}`}>{children}</span>;
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-blue-100 ${className}`}
      {...props}
    />
  );
}

// ── Table primitives (audit log, future list views) ─────────────────────────

export function Table(props: TableHTMLAttributes<HTMLTableElement>) {
  return <table className="w-full text-sm" {...props} />;
}

export function Th({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`py-2 pr-4 text-left text-xs font-medium text-[var(--muted)] ${className}`}
      {...props}
    />
  );
}

export function Td({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`py-2 pr-4 align-top text-xs ${className}`} {...props} />;
}

export function Card({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Alert({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-800",
  }[kind];
  return (
    <div role="alert" className={`rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}
