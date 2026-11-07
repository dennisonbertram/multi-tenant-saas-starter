# J2 — Password recovery (STORY-008/030)

## Friction Scorecard
- Steps: 5 actual / 5 ideal (forgot form → email → reset form → sign in).
- Decisions: 1 (new password). Re-entry: none (email carried in link flow).
- Confirmations: none guarding non-destructive steps — correct.
- Dead ends: reset success → /login?reset=1 with success alert and the form right there. Good.
- Hesitations: "Signing you out everywhere for safety." preempts the "why was I logged out?" question — good copy.

## Take-away pass
- Reset page now rejects used/expired tokens up front (fixed during walk) — no wasted form fill.
- Forgot page: single email field, single button. Nothing removable.

## The simpler version
Current flow is already the 5-step minimum for email-based recovery. No change.

## Clarity issues
- None measured. Generic success message is deliberate (anti-enumeration, documented in SECURITY.md).

Verdict: minimal
