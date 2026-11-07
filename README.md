# SaaS Starter — self-hosted, multi-tenant

A complete, working starting point for a multi-tenant SaaS application.
**No third-party platforms required** — no Clerk, Auth0, Supabase, Vercel or
Stripe. Everything (auth, tenancy, email, billing-ready structure) runs on
your own server with PostgreSQL. You *may* still deploy it to Vercel/Railway/
Fly — nothing prevents that — but it doesn't depend on any of them.

## Stack (chosen for zero-vendor-lock-in and cheap hosting)

| Concern         | Choice                                          | Why |
|-----------------|--------------------------------------------------|-----|
| Framework       | Next.js 15 (App Router) + TypeScript             | one codebase for UI + API, self-hosts anywhere Node runs |
| Database        | PostgreSQL + Drizzle ORM                         | typed SQL, plain migrations, no hosted service needed |
| Auth            | Built-in (scrypt + DB-backed session cookies)    | no auth vendor; see `docs/SECURITY.md` for the design |
| Tenancy         | Organizations + memberships (shared schema)      | see `docs/MULTI-TENANCY.md` |
| Email           | Any SMTP server (nodemailer)                     | dev mode logs emails to console instead |
| Styling         | Tailwind CSS v4                                  | no component library to fight with |
| Deploy          | Docker Compose **or** systemd + Caddy/nginx      | see `docs/DEPLOYMENT.md` |

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
Without SMTP configured, verification/reset emails are printed to the dev
server console; copy the link from there.

## What's included

- **Authentication**: signup, login, logout, email verification, password
  reset (invalidates all sessions), invitations. Hashed tokens, rate
  limiting, generic error messages. See `src/lib/auth/`.
- **Multi-tenancy**: organizations, roles (owner/admin/member), org switcher,
  invites, guarded data access helpers. See `src/lib/tenancy.ts`.
- **Example tenant-scoped resource**: the `projects` table + `/projects` page
  + `/api/v1/projects` endpoint demonstrate the full pattern end to end.
  Delete them when you add your real domain.
- **Audit log**: security-relevant events recorded per org (`audit_log` table).
- **Health endpoint**: `GET /api/health` for uptime monitors/load balancers.
- **Deployment**: Dockerfile, docker-compose (app + Postgres + Caddy with
  automatic HTTPS), systemd unit, nightly backup script.
- **Docs**: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`,
  `docs/DEPLOYMENT.md`, `docs/MULTI-TENANCY.md`, and
  `docs/GUIDE-FOR-AI-TOOLS.md` — the last one is written to be pasted/linked
  into a coding assistant so it follows the project's rules.

## Project structure

```
src/
  app/
    (auth)/            # login, signup, forgot/reset, verify, accept-invite
    (app)/             # authenticated shell: dashboard, projects, members, settings
    api/
      health/          # liveness probe
      v1/projects/     # example org-scoped JSON API
    actions.ts         # server actions live next to the routes that use them
  components/ui.tsx    # minimal Button/Input/Card/Alert primitives
  lib/
    auth/              # password hashing, sessions, tokens, rate limiting
    db/                # drizzle client + schema (the source of truth for data)
    env.ts             # fail-fast environment validation
    tenancy.ts         # requireOrg/requireRole — the tenancy guard layer
    mail.ts, audit.ts, invitations.ts, validation.ts
  middleware.ts        # security headers + cheap auth redirects
  scripts/             # migrate.ts, seed.ts
drizzle/               # generated SQL migrations (committed)
deploy/                # Caddyfile, systemd unit, backup script
docs/                  # architecture, security, deployment, tenancy, AI guide
```

## Scripts

| Command              | Purpose                                  |
|----------------------|------------------------------------------|
| `npm run dev`        | dev server with hot reload               |
| `npm run build`      | production build (standalone output)     |
| `npm start`          | run the production build                 |
| `npm run typecheck`  | strict TypeScript check                  |
| `npm run db:generate`| generate SQL migration from schema changes |
| `npm run db:migrate` | apply migrations (idempotent)            |
| `npm run db:seed`    | create an initial admin user             |

## Before you build your real product

1. Change the **session cookie name** and app name/branding.
2. Read `docs/SECURITY.md` and complete the pre-launch checklist.
3. Delete the example `projects` table/page/API and follow
   `docs/MULTI-TENANCY.md` to add your first real entity.
4. Set up SMTP (or wire your transactional provider of choice — only
   `src/lib/mail.ts` needs to change).
5. Set up off-box database backups (`deploy/backup.sh` has a hook for it).

## License

MIT — do whatever you want with it.
