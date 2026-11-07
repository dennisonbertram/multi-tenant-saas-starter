# AGENTS.md

Instructions for AI coding agents working in this repository. Read this file
first; it exists so agents keep the codebase consistent and secure.

## Project intent

Multi-tenant SaaS starter, fully self-hosted, **no third-party platform
dependencies** (no Clerk/Auth0/Supabase/Vercel-specific features). If a
feature tempts you to add a SaaS dependency, implement it locally instead.

## Hard rules — never violate

1. **Tenant isolation.** Any query on a table with an `organizationId` column
   MUST include `eq(table.organizationId, org.id)` where `org` came from
   `requireOrg()` / `requireOrgApi()` / `requireRole()` in
   `src/lib/tenancy.ts`. Never accept an organizationId from client input.
2. **Authorization only via the tenancy helpers.** Pages start with
   `await requireOrg()`; privileged pages/actions use
   `await requireRole("admin" | "owner")`. Note: every export of a
   `"use server"` file is a client-callable server action — never export a
   function from one that isn't itself fully authorized and tenant-scoped.
3. **Design system only.** Never build ad-hoc UI components and never
   hand-roll Tailwind for buttons, inputs, selects, tables, cards, alerts or
   link-buttons. The system is built on **shadcn/ui**: primitives live in
   `src/components/ui/*.tsx` (added via `npx shadcn@latest add <name>`), and
   pages import only from the facade `src/components/ui.tsx` (see
   `docs/DESIGN-SYSTEM.md`). Missing something? Add the shadcn component and
   re-export it through the facade — do not inline styles in pages.
4. **Validate all input** with zod schemas from `src/lib/validation.ts`
   (add new schemas there — don't inline ad-hoc validation).
5. **Never store raw secret tokens** (sessions, resets, invites, email
   changes) — hash with SHA-256 via `src/lib/auth/tokens.ts`. Token types
   bind a link to its purpose (e.g. `email_change` vs `email_verify`) —
   keep it that way when adding flows.
6. **No new auth/crypto code.** Reuse `src/lib/auth/*`. Don't add
   jsonwebtoken/passport/next-auth/bcrypt/argon2.
7. **Audit security-relevant mutations** with `src/lib/audit.ts`.
8. **Rate-limit abuse-sensitive actions** with `src/lib/auth/rate-limit.ts`,
   keying on canonical values (Postgres-normalized ids, client IP), never on
   raw user input that has spelling variants.

## Before you finish

- `npm run typecheck` and `npm run build` must pass.
- New user-facing surfaces: walk them in a browser, not just in code.
- Destructive actions get a `ConfirmSubmit` guard and an audit entry.
