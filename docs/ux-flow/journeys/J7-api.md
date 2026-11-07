# J7 — API integration (STORY-027/028/029)

## Friction Scorecard
- Steps: 2 / 2 for both read and write (session cookie + one call).
- Decisions: none. Errors are structured (401/422 with field map) — integrator-friendly.
- Dead ends: none; health endpoint gives ops a probe.

## Take-away pass
- n/a (non-UI journey). API surface is minimal by design; the org-scoping follows the active-org cookie, which is the right default for session-authenticated scripts.

## The simpler version
Already minimal.

## Clarity issues
- 422 error body names fields — good. No rate-limit header on 429 (Retry-After would help integrators; suggestion only).

Verdict: minimal
