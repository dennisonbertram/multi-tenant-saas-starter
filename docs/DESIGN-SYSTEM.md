# Design system

Built on **[shadcn/ui](https://ui.shadcn.com)** (Radix primitives + Tailwind
CSS v4), with a thin project facade in **`src/components/ui.tsx`**.

## The rule

**Never build ad-hoc components. Never hand-roll Tailwind for an interactive
element.** Pages import from `@/components/ui` (the facade) — if something is
missing, either add the shadcn component (`npx shadcn@latest add <name>`) and
re-export it through `ui.tsx`, or extend the facade. This is a hard project
rule (see `/AGENTS.md`).

## How it's layered

```
pages / feature components
        ↓ import only this
src/components/ui.tsx        ← the facade (project API: variants, Card props, Alert kinds)
        ↓ wraps
src/components/ui/*.tsx      ← shadcn/ui primitives (committed source, editable)
        ↓ built on
Radix primitives + Tailwind CSS v4 tokens (globals.css)
```

## Facade API

| Component | Purpose | Notes |
|-----------|---------|-------|
| `SidebarProvider`, `Sidebar`, `SidebarHeader/Content/Footer`, `SidebarGroup*`, `SidebarMenu*`, `SidebarInset`, `SidebarTrigger` | Two-column app shell | Composed in `src/app/(app)/app-sidebar.tsx`; collapses to a sheet on mobile |
| `Button` | Actions in forms | `variant`: `primary` / `secondary` / `danger`; `size`: `xs`/`sm`/`default`/`lg` |
| `ButtonLink` | Navigations that look like buttons | Same variants; renders `<a>` |
| `ConfirmSubmit` | Two-step guard for destructive submits | `src/components/confirm-button.tsx`; arms to "Confirm delete?" |
| `Input` | Text/email/password inputs | Re-export of shadcn Input |
| `Select` + `SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` | Dropdowns (Radix) | Use `name` prop for form submission; `onValueChange` + `requestSubmit()` for auto-submit patterns |
| `Field` | Label + control + inline error | Uses shadcn `Label` |
| `ErrorText` | Inline error outside a `Field` | |
| `Alert` | Feedback messages | `kind`: `info` / `error` / `success` |
| `Card` | Page sections | Our `title`/`description` props over shadcn's compound Card |
| `Muted` | Supporting/hint text | `text-muted-foreground` |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Data tables | Re-exports of shadcn table |

## Theming

- Tokens live in `src/app/globals.css` (shadcn Tailwind v4 format:
  `@theme inline` + oklch variables, light + `.dark`).
- Grays are shadcn's **gray** base palette (subtle cool-gray, hue ~264);
  brand `--primary` is overridden to blue (`oklch(0.55 0.22 262)` light,
  `oklch(0.65 0.2 262)` dark), mirrored on `--sidebar-primary`. Change those
  two variables to rebrand the whole app.
- Use Tailwind utilities that reference theme tokens (`bg-primary`,
  `text-muted-foreground`, `border-border`, `text-destructive`) — never
  hardcode hex values or raw `var(--…)` in pages.

## Adding more shadcn components

```bash
npx shadcn@latest add <component>
```

Then re-export through `src/components/ui.tsx` and use the facade in pages.
Config lives in `components.json`; the `cn` helper is in `src/lib/utils.ts`.
