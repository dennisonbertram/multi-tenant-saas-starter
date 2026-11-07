# Topic: error-recovery

## STORY-070: User follows an expired password-reset link

**Type**: short
**Topic**: error-recovery
**Persona**: Maria, slow to open her email.
**Goal**: Reset password.
**Preconditions**: reset token older than 1h or already used.
**Ideal path**: 2 — clear rejection message plus a pointer back to forgot-password.
**Alternate paths**: none found.

### Steps
1. Open `/reset-password?token=<used>` -> "This reset link is invalid or has expired."
2. Follow the "forgot password" link in the message -> request a fresh one.

### Variations
- Missing token entirely: "This link is missing its token." with a forgot-password link.

### Edge Cases
- None.

## STORY-071: Member opens an admin-only page

**Type**: short
**Topic**: error-recovery
**Persona**: Dana, member, curious about Settings.
**Goal**: See org settings.
**Preconditions**: member role.
**Ideal path**: 2 — redirected to dashboard with a clear "you don't have permission" message.
**Alternate paths**: none found.

### Steps
1. Visit `/settings` as a member -> redirected to `/dashboard?error=forbidden`.
2. Dashboard shows "You don't have permission for that action."

### Variations
- none.

### Edge Cases
- None.

## STORY-072: User opens a reused invitation link

**Type**: short
**Topic**: error-recovery
**Persona**: second teammate forwarding an invite.
**Goal**: Join the org.
**Preconditions**: invitation already accepted.
**Ideal path**: 2 — "This invitation is invalid or has expired."
**Alternate paths**: ask an admin for a fresh invite.

### Steps
1. Open `/accept-invite?token=<used>` -> invalid/expired alert.

### Variations
- Token revoked by an admin: same rejection.

### Edge Cases
- None.

## STORY-073: Guest hits unknown routes and protected APIs

**Type**: short
**Topic**: error-recovery
**Persona**: user with a stale bookmark.
**Goal**: Understand what happened.
**Preconditions**: none.
**Ideal path**: 2 — sensible 404 page; protected API returns 401 JSON.
**Alternate paths**: none found.

### Steps
1. Visit `/nonexistent` -> Next.js default 404 page.
2. `GET /api/v1/projects` without session -> 401 JSON error.

### Variations
- none.

### Edge Cases
- None.
