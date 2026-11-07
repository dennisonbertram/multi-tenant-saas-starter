# SaaS Starter — self-hosted, multi-tenant

A complete, working starting point for a multi-tenant SaaS application.
**No third-party platforms required** — no Clerk, Auth0, Supabase, Vercel or
Stripe. Everything (auth, tenancy, email, deployment) runs on your own server
with PostgreSQL. You *may* still deploy it to Vercel/Railway/Fly — nothing
prevents that — but it doesn't depend on any of them.

This repo is a **GitHub template repository**: click *Use this template* (or
`gh repo clone <you>/multi-tenant-saas-starter`) and you have a running,
production-shaped app with authentication, organizations, and an example
tenant-scoped resource — not a toy, and not a pile of placeholders.

## Stack (chosen for zero-vendor-lock-in and cheap hosting)

| Concern   | Choice                                        | Why |
|-----------|-----------------------------------------------|-----|
| Framework | Next.js 15 (App Router) + TypeScript          | one codebase for UI + API, self-hosts anywhere Node runs |
| Database  | PostgreSQL + Drizzle ORM                      | typed SQL, plain SQL migration files, no hosted service needed |
| Auth      | Built-in (scrypt + DB-backed session cookies) | no auth vendor; see `docs/SECURITY.md` for the design |
| Tenancy   | Organizations + memberships (shared schema)   | see `docs/MULTI-TENANCY.md` |
| Email     | Any SMTP server (nodemailer)                  | dev mode logs emails to the console instead |
| Styling   | Tailwind CSS v4 + shadcn/ui design system     | Radix-based accessible primitives, owned source |
| Deploy    | Docker Compose **or** systemd + Caddy/nginx   | see `docs/DEPLOYMENT.md` |

## Quickstart (5 minutes)

Prerequisites: Node 20+, Docker (for the database).

```bash
npm install
docker run -d --name saas-pg \
  -e POSTGRES_USER=saas -e POSTGRES_PASSWORD=saas -e POSTGRES_DB=saas_starter \
  -p 5432:5432 postgres:16-alpine

cp .env.example .env          # defaults match the docker command above
npm run db:migrate            # create tables
npm run db:seed               # optional: admin@example.com / change-me-please-123
npm run dev                   # http://localhost:3000
```

Sign up at `/signup` — the account becomes **owner** of a new organization.
Without SMTP configured, verification/reset/invite emails are printed to the
dev server console; copy the link from there.

## What's included

### Authentication (built from scratch, `src/lib/auth/`)
- Signup, login, logout, email verification, password reset, invitations.
- scrypt password hashing; DB-backed sessions (HttpOnly cookie, 30-day TTL).
- Tokens (verify / reset / invite / email-change) are stored **hashed**
  (SHA-256), single-use, with purpose-bound types.
- Rate limiting on all auth-sensitive endpoints; generic error messages
  (anti-enumeration); audit entries on every security-relevant mutation.
- Password change signs out all **other** devices; email change requires
  verifying the **new** address before it takes effect.

### Multi-tenancy (`src/lib/tenancy.ts`)
- Organizations with roles: **owner / admin / member**.
- `requireOrg()` / `requireRole()` / `requireOrgApi()` guards — every page and
  action derives its tenant scope from the session, never from client input.
- Org switcher (submits on change), create/switch/rename flows, and a
  dedicated `/no-org` page so org-less users are never silently locked out.
- Members page: invite (email + role), re-send pending invitations, revoke,
  remove members, and owner-only inline role changes — all with server-side
  last-owner protection.

### Example tenant-scoped resource (delete when you build your real domain)
- `projects` table + `/projects` page + `POST/GET /api/v1/projects`
  demonstrate the full pattern end to end: schema → guarded query → UI →
  session-cookie-authenticated JSON API with structured errors.

### Operational surfaces
- **Audit log** — append-only `audit_log` table, viewable at `/audit`
  (owner/admin only, org-scoped, paginated).
- **Account settings** — `/settings/account`: display name, password change
  (invalidates other sessions), email change (re-verified via link).
- **Health endpoint** — `GET /api/health` for uptime monitors/load balancers.
- **UX hardening** — two-step confirmation on all destructive actions
  (delete project, remove member), branded 404, forbidden-access feedback.

### Design system (`src/components/ui.tsx`, `docs/DESIGN-SYSTEM.md`)
- Built on **shadcn/ui** (Radix primitives + Tailwind v4 tokens), with a thin
  facade keeping a stable project API: `Button`, `ButtonLink`,
  `ConfirmSubmit`, `Input`, `Select`, `Field`, `Alert`, `Card`, `Table`,
  `Sidebar` (two-column app shell with mobile sheet).
- Tokens use shadcn's **gray** base palette; brand `--primary` is blue by
  default (two variables in `globals.css` to rebrand).
- **Project rule** (`/AGENTS.md`): never build ad-hoc components — use the
  facade / shadcn primitives, so the UI stays consistent as the app grows.

### Deployment (`deploy/`, `docs/DEPLOYMENT.md`)
- `Dockerfile` (multi-stage, standalone output) and `docker-compose.yml`
  (app + Postgres + Caddy with automatic HTTPS).
- systemd unit + nightly `backup.sh` for bare-metal deploys.
- Fail-fast env validation (`src/lib/env.ts`) — the app refuses to boot with
  a broken config.

## Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | public | landing page |
| `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, `/accept-invite` | public | auth flows |
| `/dashboard` | signed in | post-login home, org-scoped |
| `/projects` | signed in | example tenant-scoped resource |
| `/members` | signed in | team roster, invitations, roles |
| `/settings` | admin+ | organization settings |
| `/settings/account` | signed in | personal account settings |
| `/audit` | admin+ | org audit log |
| `/no-org` | signed in | recovery page for users with no organization |
| `/api/health` | public | liveness probe |
| `/api/v1/projects` | session cookie, member+ | example org-scoped JSON API |

## Configuration (`.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `APP_URL` | public base URL used to build links in emails |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | any SMTP server; leave `SMTP_HOST` empty in dev to log emails to the console |
| `EMAIL_FROM` | From address for transactional email |

See `.env.example` with inline comments.

## Project structure

```
AGENTS.md             # rules for AI coding agents (read this first)
src/
  app/
    (auth)/            # login, signup, forgot/reset, verify, accept-invite
    (app)/             # authenticated shell: dashboard, projects, members,
                       #   settings, settings/account, audit, no-org
    api/
      health/          # liveness probe
      v1/projects/     # example org-scoped JSON API
    actions.ts         # server actions live next to the routes that use them
  components/
    ui.tsx             # the design system — all UI primitives
    confirm-button.tsx # two-step destructive-action guard
  lib/
    auth/              # password hashing, sessions, tokens, rate limiting
    db/                # drizzle client + schema (the source of truth for data)
    env.ts             # fail-fast environment validation
    tenancy.ts         # requireOrg/requireRole — the tenancy guard layer
    audit.ts           # audit write helper
    audit-queries.ts   # audit read model (kept out of server-action scope)
    mail.ts, invitations.ts, validation.ts
  middleware.ts        # security headers + cheap auth redirects
  scripts/             # migrate.ts, seed.ts
drizzle/               # generated SQL migrations (committed)
deploy/                # Caddyfile, systemd unit, backup script
docs/                  # see below
```

## Documentation

| Doc | Contents |
|-----|----------|
| `docs/ARCHITECTURE.md` | how the pieces fit: request lifecycle, session model, tenancy |
| `docs/SECURITY.md` | auth design, threat model, pre-launch checklist |
| `docs/MULTI-TENANCY.md` | the org/membership model and how to add a tenant-scoped entity |
| `docs/DEPLOYMENT.md` | Docker Compose and systemd/Caddy deployment, backups |
| `docs/DESIGN-SYSTEM.md` | the UI primitives and the rules for using them |
| `docs/GUIDE-FOR-AI-TOOLS.md` | paste into any coding assistant so it follows the project's rules |
| `docs/ux-paths/` | user-journey catalog (33 stories) generated by a UX audit |
| `docs/ux-walker/`, `docs/ux-flow/`, `docs/ux-auto-improve/` | browser walkthrough findings, flow critique, and the improvement ledger behind the current UI |

The `ux-*` directories are this template's own QA history — useful examples of
the process, safe to delete when you start your real product.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | dev server with hot reload |
| `npm run build` | production build (standalone output) |
| `npm start` | run the production build |
| `npm run typecheck` | strict TypeScript check |
| `npm run db:generate` | generate SQL migration from schema changes |
| `npm run db:migrate` | apply migrations (idempotent) |
| `npm run db:seed` | create an initial admin user |

## Before you build your real product

1. Change the **session cookie name** (`src/lib/auth/cookies.ts`) and the
   app name/branding.
2. Read `docs/SECURITY.md` and complete the pre-launch checklist.
3. Delete the example `projects` table/page/API and follow
   `docs/MULTI-TENANCY.md` to add your first real entity.
4. Set up SMTP (or wire your transactional provider of choice — only
   `src/lib/mail.ts` needs to change).
5. Set up off-box database backups (`deploy/backup.sh` has a hook for it).
6. Delete the `docs/ux-*` QA artifacts once you've skimmed them.

## License

MIT — do whatever you want with it.
