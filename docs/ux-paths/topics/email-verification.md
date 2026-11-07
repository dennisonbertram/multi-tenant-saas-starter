# Topic: email-verification

## STORY-020: New user verifies their email from the emailed link

**Type**: short
**Topic**: email-verification
**Persona**: Maria after signup.
**Goal**: Confirm her email address.
**Preconditions**: STORY-001 done; access to the emailed link (dev console email in dev).
**Ideal path**: 2 — open link, see success, banner gone.
**Alternate paths**: none found.

### Steps
1. Open `/verify-email?token=…` from the email -> "Email verified" success alert with a dashboard link.
2. Return to any authenticated page -> unverified banner no longer shown.

### Variations
- none.

### Edge Cases
- Token already used: "invalid or has expired" error alert.
- Token older than 24h: same rejection.

## STORY-021: User requests a fresh verification email

**Type**: short
**Topic**: email-verification
**Persona**: Maria, lost the first email.
**Goal**: Get a new verification link.
**Preconditions**: signed in, unverified.
**Ideal path**: 2 — click "resend the verification email" in the banner, see confirmation in place.
**Alternate paths**: none found.

### Steps
1. Click "resend the verification email" in the unverified banner -> banner text becomes "Verification email sent."

### Variations
- none.

### Edge Cases
- Rapid re-clicks: rate-limited ("Too many attempts") after several within a minute.
- Old links remain valid (new token does not revoke the previous one) — both work within 24h.

## STORY-022: User pastes a verification URL without a token

**Type**: short
**Topic**: email-verification
**Persona**: user who copy-pasted a truncated link.
**Goal**: Verify email.
**Preconditions**: none.
**Ideal path**: 2 — see a clear "no token provided" message with guidance.
**Alternate paths**: none found.

### Steps
1. Open `/verify-email` (no query) -> message: "No token provided. Use the link from your verification email."

### Variations
- none.

### Edge Cases
- None.
