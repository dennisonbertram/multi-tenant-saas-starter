# Topic: authentication

## STORY-010: Returning user signs in

**Type**: short
**Topic**: authentication
**Persona**: Maria, returning daily.
**Goal**: Sign in and land on her dashboard.
**Preconditions**: Account exists.
**Ideal path**: 3 — open /login, fill 2 fields, submit, land on dashboard.
**Alternate paths**: Land on `/login?next=/members` after being bounced from a protected page; login then continues to `/members`.

### Steps
1. Open `/login` -> email + password fields, links to forgot-password and signup.
2. Fill credentials -> submit ("Sign in" button shows "Signing in…" while pending).
3. Land on `/dashboard`.

### Variations
- Arrived via redirect: after login lands on the originally requested page.
- Just reset password: `/login?reset=1` shows "Password updated." success alert.

### Edge Cases
- Wrong password: "Invalid email or password." — identical for unknown email.
- 11th login attempt in a minute: rate-limit message.

## STORY-011: User signs out

**Type**: short
**Topic**: authentication
**Persona**: any signed-in user on a shared machine.
**Goal**: End the session.
**Preconditions**: signed in.
**Ideal path**: 2 — click "Sign out" in header, land on /login.
**Alternate paths**: none found.

### Steps
1. Click "Sign out" in the header -> redirected to `/login`.
2. Press back / revisit `/dashboard` -> bounced to login (session destroyed server-side, not just cookie).

### Variations
- none.

### Edge Cases
- Session already expired: sign out still lands cleanly on /login.

## STORY-012: User forgot their password and resets it

**Type**: medium
**Topic**: authentication
**Persona**: Maria, locked out.
**Goal**: Regain access.
**Preconditions**: Account exists; SMTP or dev-console email available.
**Ideal path**: 5 — forgot form (email), open emailed link, set new password, sign in.
**Alternate paths**: none found.

### Steps
1. Click "Forgot your password?" on /login -> email form.
2. Submit email -> success message regardless of whether the account exists.
3. Open reset link from email -> `/reset-password?token=…` with new-password field.
4. Submit new password (≥10 chars) -> redirected to `/login?reset=1`.
5. Sign in with the new password -> dashboard.

### Variations
- Unknown email submitted: identical success message, no email sent.

### Edge Cases
- Reuse the same reset link after success: "invalid or has expired".
- Token older than 1 hour: same rejection.
- Reset while signed in on another device: that session dies (all sessions revoked).

## STORY-013: Logged-out user tries to open a protected page

**Type**: short
**Topic**: authentication
**Persona**: Maria with an expired session.
**Goal**: Reach /members.
**Preconditions**: no valid session.
**Ideal path**: 2 — visit /members, bounced to /login with next=/members, sign in once.
**Alternate paths**: none found.

### Steps
1. Visit `/members` -> redirected to `/login?next=%2Fmembers`.
2. Sign in -> lands on `/members` directly.

### Variations
- Visiting `/dashboard` while logged out: redirect without `next` param.

### Edge Cases
- `?next=` pointing off-site (`https://evil.com`): ignored, goes to dashboard.

## STORY-014: Signed-in user opens a login page

**Type**: short
**Topic**: authentication
**Persona**: signed-in user who clicks an old bookmark.
**Goal**: Not get confused.
**Preconditions**: valid session.
**Ideal path**: 1 — visiting /login redirects straight to /dashboard.
**Alternate paths**: none found.

### Steps
1. Visit `/login` while signed in -> redirected to `/dashboard`.

### Variations
- Same for /signup, /forgot-password, /reset-password.

### Edge Cases
- Expired session cookie: login page renders normally.
