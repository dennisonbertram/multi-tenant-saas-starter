# Guide for AI coding tools

Paste this file (or link it) when you use a coding assistant — Claude,
Cursor, Aider, Copilot Workspace, etc. — to build on this codebase. It gives
the tool the rules that keep the starter secure as it grows.

> **Agents**: see also `/AGENTS.md` (root) — the short, hard-rule version of
> this guide, including the design-system rule
> (`docs/DESIGN-SYSTEM.md`): never build ad-hoc UI components, always use
> the primitives in `src/components/ui.tsx`.

## Project intent

Multi-tenant SaaS starter, fully self-hosted, **no third-party platform
dependencies** (no Clerk/Auth0/Supabase/Vercel-specific features). Keep it
that way: if a feature tempts you to add a SaaS dependency, implement it
locally instead (SMTP email, Postgres, etc.).

## Hard rules — never violate

1. **Tenant isolation.** Any query on a table with an `organizationId`
   column MUST include `eq(table.organizationId, org.id)` where `org` came
   from `requireOrg()` / `requireOrgApi()` / `requireRole()` in
   `src/lib/tenancy.ts`. Never accept an organizationId from client input.
   For single-row reads/writes, filter by id AND organizationId.
2. **Authorization only via the tenancy helpers.** New pages start with
   `await requireOrg()`; privileged actions use `await requireRole("admin" | "owner")`.
   Don't read the session cookie directly in routes/pages.
3. **Validate all input** with zod schemas from `src/lib/validation.ts`
   (add new schemas there — don't inline ad-hoc validation).
4. **Never store raw secret tokens** (sessions, resets, invites) — hash with
   SHA-256 via `src/lib/auth/tokens.ts` helpers and reuse those flows.
5. **No new auth/crypto code.** Reuse `src/lib/auth/*`. Don't add
   jsonwebtoken/passport/next-auth/bcrypt/argon2.
6. **Audit security-relevant mutations** with `src/lib/audit.ts`.
7. **Schema changes** go through `src/lib/db/schema.ts` + `npm run
   db:generate`. Never edit files in `drizzle/` by hand; never use
   `drizzle-kit push` against production.
8. **Secrets only from `src/lib/env.ts`** — no `process.env` elsewhere.

## Conventions

- Server components by default; client components only for interactivity
  (`"use client"` at the top, colocated `*-form.tsx` next to the page).
- Mutations are server actions colocated with their route group
  (`src/app/(app)/actions.ts`, etc.) using React 19 `useActionState`.
- Return `{ fieldErrors }` / `{ error }` / `{ success }` from actions — see
  `FormState` in `src/app/(auth)/actions.ts`.
- Styling: Tailwind v4 utility classes + the CSS variables in
  `globals.css`; use the primitives in `src/components/ui.tsx` before
  writing new ones.
- TypeScript is strict; `npm run typecheck` must pass.
- Comments explain *why*, not *what*.

## Workflow for a new feature

1. Read `docs/MULTI-TENANCY.md` "Adding a new tenant-scoped resource" and
   follow the recipe exactly.
2. Schema → migration → validation → action → page → (optional) API route.
3. Run `npm run typecheck && npm run build` before declaring done.
4. If you touch auth, tenancy, or sessions, re-read `docs/SECURITY.md` and
   note any checklist item that becomes relevant.

## Known simplifications (fine to inherit, don't "fix" blindly)

- In-memory rate limiting (per-process) — swap to Redis only when
  multi-replica, at the seam in `src/lib/auth/rate-limit.ts`.
- No RLS — the discriminator-column pattern plus code review is the shipped
  isolation strategy; see the RLS section in MULTI-TENANCY.md before adding it.
- No billing — add a `subscriptions` table keyed by organizationId and keep
  any provider isolated in one module.
- The `projects` example (table, page, API, actions) is scaffolding to be
  deleted once real domain entities exist.
