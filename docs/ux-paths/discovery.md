# App Discovery: SaaS Starter

## Application Type
Web application (multi-tenant SaaS starter), server-rendered Next.js App Router with server actions and a small JSON API.

## Tech Stack
Next.js 15 (App Router, TS), Tailwind v4, Drizzle ORM + PostgreSQL, nodemailer SMTP, custom session auth (scrypt + hashed DB tokens). Deploy: Docker Compose / systemd.

## User Roles
- **Guest**: view landing page, sign up, sign in, reset password, accept invitation, verify email.
- **member**: view org data, create projects (example resource), see members list (read-only).
- **admin**: everything a member can, plus rename org, invite members, revoke invites, remove members (non-owner), delete projects.
- **owner**: everything an admin can, plus invite admins, change roles, remove owners, create/demote owners (last-owner protected).

## Feature Map
### Landing & entry
- Marketing landing page with signup/login links; dashboard link when signed in.

### Accounts & auth
- Signup (name, email, password, organization name → creates user + org + owner membership in one transaction).
- Login (rate-limited, generic errors, honors `?next=` relative redirect).
- Logout (destroys session row + cookie).
- Forgot password (always-same response), reset with 1h single-use token.
- Email verification via emailed token link; resend from in-app banner.

### Organizations
- Create additional organization (becomes owner, auto-switch).
- Rename organization (admin+).
- Switch active organization (cookie, membership-verified).

### Members & invitations
- View member list (name/email/role/joined).
- Invite by email with role (member for admin+; admin role owner-only).
- Revoke pending invitation (admin+).
- Remove member (admin+, not owners unless owner; not last owner).
- Change member role (owner only; cannot demote last owner).

### Projects (example tenant-scoped resource)
- Create project (any member).
- List projects for active org.
- Delete project (admin+).

### API
- `GET /api/health` — liveness + DB check.
- `GET/POST /api/v1/projects` — session-authenticated, org-scoped.

### Cross-cutting
- Unverified-email banner with resend (all authenticated pages).
- Security headers, redirects for logged-out visitors to protected pages.

## Navigation Structure
- Public: `/` → `/signup`, `/login`, `/forgot-password`, `/reset-password?token=`, `/verify-email?token=`, `/accept-invite?token=`.
- Authenticated shell (header nav): Dashboard `/dashboard`, Projects `/projects`, Members `/members`, Settings `/settings`; org switcher (only when >1 org); Sign out.

## Data Entities
- user: create (signup), read (own), update (password via reset; email verification flag)
- organization: create (signup, settings), read, update (rename)
- membership: create (invite accept), read, update (role change), delete (remove member)
- invitation: create, read, delete-ish (revoke), consume (accept)
- project: create, read, delete (example resource)
- session: create (login/signup), delete (logout, reset)
- audit_log: create (system), read (not yet surfaced in UI)

## Integrations
- SMTP (nodemailer): verification, reset, invitation emails. Dev fallback logs to console.

## Error / empty / loading states
- Form field errors + form-level alerts on all auth/org forms.
- Empty states: no projects (dashboard + projects page), no pending invitations.
- Error surfaces: invalid/expired tokens (verify, reset, invite), forbidden-role redirect (`/dashboard?error=forbidden`), mismatched invite email, wrong-invitee signup.
- Pending buttons during action submission.

## Feature flags / permission-gated UI
- Members page: invite form + revoke only for admin+; role dropdown hides "admin" option for non-owners.
- Projects delete button hidden for members.
- Settings page requires admin (redirects with error otherwise).
- Org switcher only rendered with >1 org.

## Recommended Story Topics
1. **signup-onboarding** — first contact to verified, oriented user (the money path).
2. **authentication** — login, logout, password recovery.
3. **email-verification** — verify and resend flows.
4. **organization-lifecycle** — create, rename, switch organizations.
5. **membership-management** — invites, roles, removal.
6. **projects** — the example tenant-scoped CRUD surface.
7. **api-consumption** — programmatic client journeys.
8. **error-recovery** — bad tokens, forbidden roles, wrong invitee, empty states.
