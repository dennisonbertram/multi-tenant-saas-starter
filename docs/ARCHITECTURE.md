# Architecture

## Big picture

```
Browser ── HTTPS ── Caddy (TLS, auto certs) ── Next.js server (Node)
                                                  │
                                                  ├── PostgreSQL (app data)
                                                  └── SMTP (outbound email)
```

One process serves UI and API. Next.js **server components** render pages;
**server actions** handle mutations from forms; **route handlers**
(`src/app/api/**`) serve JSON for programmatic clients. All three share the
same `src/lib` layer, so authorization logic exists exactly once.

## Layers

### 1. Environment (`src/lib/env.ts`)
Parsed once per process with zod; the process exits immediately with a
readable message on misconfiguration. During `next build` a placeholder
`DATABASE_URL` is tolerated (there is no database at build time); every other
phase requires the real value.

### 2. Database (`src/lib/db/`)
- `schema.ts` is the single source of truth. Column types, indexes, and the
  `member_role` enum live here.
- Migrations are generated SQL (`drizzle/`), committed to git, and applied
  with `npm run db:migrate` on every deploy. Never edit generated SQL; change
  the schema and regenerate.
- One shared postgres.js client per process (pooled, `max: 10`).

### 3. Auth (`src/lib/auth/`)
- `password.ts` — scrypt hashing with embedded parameters; no native deps.
- `session.ts` — opaque random session tokens; only SHA-256 hashes stored;
  HttpOnly/SameSite=Lax/Secure cookies; helpers to destroy one or all sessions.
- `tokens.ts` — single-use hashed tokens for email verification, password
  reset and invitations; atomic claim prevents replay.
- `rate-limit.ts` — fixed-window limiter (in-memory; swap for Redis when
  scaling horizontally).

### 4. Tenancy guard (`src/lib/tenancy.ts`)
`requireOrg()` / `requireRole()` / `requireOrgApi()` resolve the current user,
verify the active organization from the cookie against the `memberships`
table, and hand back `{ user, org }`. **All tenant data access goes through
these.** Details and rules: `docs/MULTI-TENANCY.md`.

### 5. Actions & API routes
- Server actions (`"use server"` files) validate with zod, rate-limit
  sensitive flows, write audit entries, and revalidate paths.
- API routes follow the same pattern via `requireOrgApi()`.

### 6. Middleware (`src/middleware.ts`)
Edge-runtime, so it cannot touch the database. It only: sets security
headers, redirects logged-out visitors away from protected prefixes (based on
cookie *presence*), and bounces logged-in users away from auth pages. Real
authorization always happens server-side.

## Rendering & data flow

- Pages under `(app)` call `requireOrg()` first, then query with Drizzle
  scoped by `org.id`, and render server-side. No client data fetching in the
  starter — add TanStack Query or SWR only if/when you need it.
- Forms use React 19 `useActionState` + server actions; validation errors
  round-trip as `{ fieldErrors }` and render inline.
- The active organization is stored in an httpOnly cookie (`active_org`) and
  **re-verified against memberships on every request** — a user can never
  claim an org they don't belong to by editing the cookie.

## Deployment topologies

1. **Docker Compose** (default): app + Postgres + Caddy on one box.
   `docker compose up -d --build`. Migrations run as a one-shot service.
2. **Bare metal**: build here or on the server (`npm run build` →
   `.next/standalone`), run under systemd behind Caddy/nginx. Postgres
   installed locally or remote. See `docs/DEPLOYMENT.md`.
3. **PaaS** (Vercel/Fly/Railway): works as-is; set env vars, run migrations
   as a release step. Nothing in the code assumes self-hosting.

## Scaling notes

- The app is stateless except for the DB — run multiple replicas behind a
  load balancer freely.
- The in-memory rate limiter is per-process; move it to Redis at >1 replica.
- Postgres on the same box is fine up to thousands of active tenants; add
  read replicas / PgBouncer only when metrics say so.

## Extension points

- **Billing**: no payment code is included by design. Add a `subscriptions`
  table keyed by `organizationId` and a webhook route; keep provider SDKs
  isolated in one module (e.g. `src/lib/billing.ts`).
- **Background jobs**: start with `pg` + a cron/systemd timer, or add a
  queue later — nothing in the core depends on one.
- **File storage**: S3-compatible object stores (MinIO self-hosted) drop in
  cleanly; keep credentials in env like everything else.
