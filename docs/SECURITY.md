# Security

This document explains what the starter does for you, what it deliberately
does *not* do, and what you must check before going live.

## What's implemented

### Password storage
- scrypt (Node built-in, no native deps), OWASP parameters (N=2¹⁷, r=8, p=1),
  per-password random salt, parameters embedded in the stored hash so they
  can be strengthened later without breaking existing logins.
- Comparison via `timingSafeEqual`.

### Sessions
- 32-byte random tokens (base64url), stored **hashed** (SHA-256). A stolen
  database dump cannot be replayed as sessions.
- Cookie: `HttpOnly` (invisible to JS), `SameSite=Lax` (blocks cross-site
  POSTs), `Secure` in production, 30-day expiry.
- Session fixed lifetime (no silent sliding extension) — re-login monthly.
  Extend `SESSION_TTL_MS` in `src/lib/auth/session.ts` if you want longer.
- Password reset destroys **all** sessions for the user.

### Single-use tokens (verify email, reset password, invites)
- Random 32-byte tokens, SHA-256 hashed at rest, short TTL (24h/1h/7d),
  single-use with an **atomic conditional UPDATE** so concurrent reuse
  fails, revocable.

### CSRF
- Mutations go through Next.js **server actions** (POST-only, Next validates
  the `Origin` header) or same-origin API routes.
- Cookies are `SameSite=Lax`, so cross-site requests don't carry them.
- If you add cookie-authenticated write endpoints called from *other*
  origins, add an explicit `Origin` allowlist check in those routes.

### User enumeration
- Login errors are identical for unknown email and wrong password.
- Password reset always returns the same response whether or not the email
  exists (the accepted trade-off: reset emails confirm existence to the
  mailbox owner only).

### Rate limiting
- 10 req/min per IP on signup, login, forgot-password, reset, resend.
- In-memory; per process. Move to Redis when running >1 replica
  (`src/lib/auth/rate-limit.ts` is the single seam).

### Headers & transport
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy` (middleware) and HSTS (Caddy).
- TLS terminates at Caddy with automatic certificates; the app sets `Secure`
  cookies when `NODE_ENV=production`.

### Input validation & tenancy
- Every input is zod-validated through shared schemas (`src/lib/validation.ts`).
- Tenant isolation is enforced by construction: the org id always comes from
  the verified session, never from client input. See `docs/MULTI-TENANCY.md`.

### Audit log
- Logins, signups, invites, role changes, removals, deletions are recorded
  with actor, org, IP (when available) and metadata.

## What's deliberately NOT included (add when you need it)

- 2FA/MFA — recommended before you have real customers.
- Email change flow — copy the reset flow pattern.
- CAPTCHA on signup — add when you see bot signups.
- Content-Security-Policy — Next needs a nonce-based CSP configured
  carefully; start with the defaults here and add one before launch if your
  app renders user content.
- Password strength meter / breached-password checks.

## Pre-launch checklist

- [ ] `APP_URL` set to the real HTTPS URL (email links break otherwise).
- [ ] SMTP configured and tested (verification + reset + invite emails).
- [ ] Run `npm run typecheck` and `npm run build` in CI on every PR.
- [ ] Database backups running **off-box** (`deploy/backup.sh` + rclone or similar).
- [ ] Restore tested — an untested backup is not a backup.
- [ ] Postgres listens only on localhost/Docker network, never the public internet.
- [ ] `.env` not committed; secrets managed by the deployment (systemd
      EnvironmentFile, docker secrets, or your PaaS's env settings).
- [ ] Seeded admin password changed; seed not run in production again.
- [ ] `GET /api/health` wired to your uptime monitor.
- [ ] Dependabot/Renovate enabled for dependency updates.
- [ ] Reviewed `docs/MULTI-TENANCY.md` rules with whoever writes new queries.

## Reporting & response

Add a `SECURITY.md` with a contact address before you have users. For the
starter itself: treat any tenancy-isolation bug as critical and fix within
24h — it is the one class of bug your customers cannot forgive.
