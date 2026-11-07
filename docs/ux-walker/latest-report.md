# UX Walker Report — 2026-11-07

- URL: http://localhost:3210 (production build, `npm start`, Postgres 16 in Docker)
- Session: ux-walker-localhost · Catalog: docs/ux-paths/catalog.md (33 stories)
- Walked: 33 · Re-verified after fixes: 3 · Skipped: 0
- **Passed: 26 · Failed-then-fixed: 5 · Open issues: 2**

## Findings by severity
| Severity | Count | Outcome |
|----------|-------|---------|
| critical | 2 | both fixed in-run (F-001-001, F-021-001) |
| high | 2 | 1 fixed (F-006-001), 1 filed (F-020-001) |
| medium | 3 | 2 fixed (F-019-001, F-030-001), 1 filed (F-024-001) |
| low | 2 | 1 fixed (F-031-001), 1 report-only (F-002-001) |

## Quick fixes applied (all verified in browser, typecheck+build pass)
| Finding | Fix | Commit |
|---------|-----|--------|
| F-001-001 signup crashed without SMTP | email fallback to console logging when SMTP unconfigured | 11ee0d0 |
| F-006-001 every plain login showed an error page | empty `next` field treated as absent before redirect | 441a4b0 |
| F-019-001 wrong invite revocable (unordered list) | newest-first ordering for pending invitations | c6bdccd |
| F-021-001 org-less user lockout | `/no-org` page with create-organization form; requireOrg redirects there | (see git log) |
| F-030-001 reset page accepted used tokens | `peekAuthToken` up-front rejection | 2d22316 |
| F-031-001 Settings nav shown to members | link hidden for members (server rule unchanged) | 2d22316 |

## Issues filed (no git remote → local files)
- docs/ux-walker/issues/F-020-001.md — no UI to change member roles (high)
- docs/ux-walker/issues/F-024-001.md — destructive actions lack confirmation/undo (medium)

## UX audit summary
- **Systemic**: destructive actions without confirmation appear on two screens (projects, members) — one root fix needed (F-024-001).
- **Systemic**: role-gated surfaces leak into nav for lower roles (Settings) — fixed; audit other gates when adding pages.
- Empty states, error states and token rejection copy are consistently good across verify/reset/invite flows.
- The unverified-email banner is clear and actionable (resend works inline).

## Flow friction table
| Story | Actual vs ideal | Hesitations |
|-------|-----------------|-------------|
| STORY-001 signup | 5 / 5 | none |
| STORY-008 reset | 5 / 5 | none |
| STORY-014 second org | 4 / 4 | none |
| STORY-018 invite+accept | 7 / 7 | none |
| STORY-016 switch org | 2 / 2 | select+button could be one control (suggestion) |

Information shown in more than one place: org name ×3 and verification ×2 on the post-signup dashboard (F-002-001, low).

## Top 5 recommendations
1. Build the role-change UI (F-020-001) — core owner workflow missing.
2. Add a shared confirm for destructive actions (F-024-001).
3. Keep the new `/no-org` pattern in mind for future "no X" states (e.g. no data).
4. Add a branded 404 page (Next default is unbranded; suggestion-level).
5. Re-run ux-walker after implementing ux-flow's simplification proposals.

## Stories still failing
- STORY-020 (role change UI missing — issue filed).
- STORY-024 (no confirmation on delete — issue filed).

## Not verified
- Real SMTP delivery (no SMTP server in the test environment; console fallback verified).
- Dark mode, mobile devices beyond a 390×844 spot check (no layout issues found in audits run).
- Long-running session expiry behaviour (30-day TTL asserted by code, not by waiting).
