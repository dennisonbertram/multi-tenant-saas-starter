/**
 * The design system — a thin facade over shadcn/ui (see docs/DESIGN-SYSTEM.md).
 *
 * Rule: pages and feature components import from HERE, never from
 * `@/components/ui/*` directly, and never hand-roll Tailwind for an
 * interactive element. To change how the app looks, change this file (or the
 * shadcn primitives it wraps) — not the pages.
 *
 * The facade keeps our project-specific API (Card with title/description,
 * Alert with info/success/error kinds, primary/secondary/danger variants)
 * so page code stays stable while the underlying primitives evolve.
 */

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert as ShadcnAlert,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export { cn } from "@/lib/utils";

// ── Buttons ─────────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "danger";

/** Map our semantic variants onto shadcn's button variants. */
function toShadcnVariant(v: Variant) {
  return { primary: "default", secondary: "outline", danger: "destructive" }[v] as
    | "default"
    | "outline"
    | "destructive";
}

/** Single source of truth for button visuals — shared by Button, ButtonLink
 * and ConfirmSubmit so the three can never drift apart. */
export function buttonStyles(variant: Variant = "primary"): string {
  return buttonVariants({ variant: toShadcnVariant(variant) });
}

export function Button({
  variant = "primary",
  size,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "xs" | "sm" | "default" | "lg";
}) {
  return (
    <ShadcnButton
      variant={toShadcnVariant(variant)}
      size={size}
      className={className}
      {...(props as Record<string, unknown>)}
    />
  );
}

/** Anchor styled as a button — for navigations that must look like the
 * page's primary action ("Create your first project", "Go home"). */
export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a className={`${buttonStyles(variant)} ${className}`} {...props} />;
}

// ── Form controls ───────────────────────────────────────────────────────────

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <ShadcnInput className={className} {...props} />;
}

export { Label };

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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  );
}

/** Inline error text for controls that don't sit in a Field (e.g. selects
 * that submit on change). Same styling as Field's error. */
export function ErrorText({ children }: { children: ReactNode }) {
  return <span className="text-xs text-destructive">{children}</span>;
}

/** Muted supporting text — the standard for helper/hint lines. */
export function Muted({ className = "", children }: { className?: string; children: ReactNode }) {
  return <span className={`text-muted-foreground ${className}`}>{children}</span>;
}

// ── Feedback ────────────────────────────────────────────────────────────────

/** Alert with our info/success/error kinds on top of shadcn's Alert. */
export function Alert({
  kind = "info",
  children,
}: {
  kind?: "info" | "error" | "success";
  children: ReactNode;
}) {
  const kindStyles = {
    info: "",
    error: "border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 [&>svg]:text-emerald-600",
  }[kind];
  const title = { info: "Info", error: "Error", success: "Success" }[kind];
  return (
    <ShadcnAlert className={kindStyles}>
      <AlertTitle>{title}</AlertTitle>
      <div className="text-sm font-normal [&_p]:leading-relaxed">{children}</div>
    </ShadcnAlert>
  );
}

// ── Surfaces ────────────────────────────────────────────────────────────────

/** Card with our title/description/children API on shadcn's compound Card. */
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
    <ShadcnCard>
      {title || description ? (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </ShadcnCard>
  );
}

// ── Stat tile ── dashboard summary numbers ──────────────────────────────────

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const body = (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
  return href ? (
    <a href={href} className="block transition-colors hover:border-ring/40">
      {body}
    </a>
  ) : (
    body
  );
}

// ── Tables ──────────────────────────────────────────────────────────────────

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// ── Select (Radix) ── re-exported so pages never import ui/* directly ──────

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Sidebar (shadcn) ── app-shell two-column layout ─────────────────────────

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export { Separator } from "@/components/ui/separator";
