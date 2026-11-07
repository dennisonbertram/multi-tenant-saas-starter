# Design system

One place for every UI primitive: **`src/components/ui.tsx`**. Dependency-free
by design (no component library) — the value is that every button, input and
table in the app shares one accessible, consistent implementation.

## The rule

**Never build ad-hoc components. Never hand-roll Tailwind for an interactive
element.** If `ui.tsx` lacks what you need, extend `ui.tsx` first, then use it.
This is a hard project rule (see `/AGENTS.md`).

## Components

| Component | Purpose | Notes |
|-----------|---------|-------|
| `Button` | Actions in forms | `variant`: `primary` / `secondary` / `danger` |
| `ButtonLink` | Navigations that must look like buttons | Same variants; renders `<a>` |
| `ConfirmSubmit` | Two-step guard for destructive submits | Client component in `src/components/confirm-button.tsx`; arms to "Confirm delete?" |
| `Input` | Text/email/password inputs | Full-width, consistent focus ring |
| `Select` | Dropdowns | Full-width by default; `!w-auto` for inline uses |
| `Field` | Label + control + inline error | Wraps Input/Select |
| `ErrorText` | Inline error outside a `Field` | Same styling as Field errors |
| `Alert` | Feedback messages | `kind`: `info` / `error` / `success` |
| `Card` | Page sections | Optional `title` / `description` |
| `Muted` | Supporting/hint text | `text-[var(--muted)]` |
| `Table` / `Th` / `Td` | Data tables | Used by `/audit`; add wrappers here, not per-page |

## Building blocks

- **`buttonStyles(variant)`** — the single source of truth for button visuals.
  `Button`, `ButtonLink` and `ConfirmSubmit` all consume it, so the three can
  never drift apart. Use it directly only for rare state-dependent buttons.
- **CSS variables** (in `src/app/globals.css`): `--primary`, `--primary-hover`,
  `--danger`, `--border`, `--card`, `--muted`, `--foreground`. Never hardcode
  hex values in components; if you need a new token, add it to `globals.css`.

## Patterns

- **Forms**: server action + `useActionState` in a client component
  (see `src/app/(app)/forms.tsx`), `Field` + `Input`/`Select` + `Button`,
  `Alert` for success/error feedback.
- **Destructive actions**: wrap the submit in `ConfirmSubmit` — never a bare
  danger button, never `window.confirm`.
- **Owner/admin-only inline controls**: follow `role-select.tsx` (renders only
  for authorized roles, hides on the viewer's own row).
