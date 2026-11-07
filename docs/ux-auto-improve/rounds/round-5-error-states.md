# Round 5 — Error & empty states (2026-11-07)

## Review (evidence: walk reports STORY-004/011/027; catalog gaps; grep of error surfaces)
1. **Unbranded 404** (low) — Next's default black 404 on a wrong URL; everything else is branded. Change: `src/app/not-found.tsx` with the app's card style + "Go to dashboard" link (unauthenticated → home). Size: S.
2. **API 429 has no Retry-After header** (low, integrator-facing) — `POST /api/v1/projects` returns `{error:"Too many requests"}` with no guidance on when to retry. Change: include `Retry-After: 60` (matches the fixed-window limiter). Size: S.
3. **Login 429 copy lacks specificity** — "wait a minute" matches the limiter's 60s window; fine as-is. Rejected: dynamic countdown (over-engineering for a starter).

## Judge (adversarial check)
- 1 approved: keep it to one file, reuse existing Card/Link, no new deps.
- 2 approved: Retry-After is the standard header; hardcode 60 to match the limiter window (documented in rate-limit.ts). Must NOT change limiter logic.
- 3 rejected: agreed with reviewer.

## Work package
- WP1: not-found.tsx + Retry-After header on the 429 response.
  - Files: src/app/not-found.tsx (new), src/app/api/v1/projects/route.ts.

## Result
- Implemented; browser-verified 404 (branded page with onward link) and header present on 429.
