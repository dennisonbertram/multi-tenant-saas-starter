# ux-auto-improve ledger

| Round | Section | Date | Changes | Verification | Video |
|-------|---------|------|---------|--------------|-------|
| 1 | Members & roles | 2026-11-07 | role-change UI (issue #1) | browser + typecheck + build | skipped (code+UX; no TTS key) |
| 2 | Destructive actions | 2026-11-07 | confirm guard (issue #2) | browser + typecheck + build | skipped |
| 3 | Post-signup dashboard | 2026-11-07 | dedupe facts, primary CTA | browser + typecheck + build | skipped |
| 4 | Org switcher + settings | 2026-11-07 | auto-submit select, dedupe role | browser + typecheck + build | skipped |
| 5 | Error/empty states | 2026-11-07 | branded 404, Retry-After, forbidden copy | browser + typecheck + build | skipped |

Deferred proposals and new user stories are recorded per round in docs/ux-auto-improve/rounds/.

## Notes
- Subagents unavailable in this environment; review/judge/implement roles ran inline in one session with the same gates (proposal → adversarial code check → tightened spec → implement → typecheck+build+browser verification → commit).
- Round 3 first commit shipped with a type error (emailVerified); caught by the typecheck gate, fixed in the follow-up commit. Gate order corrected afterwards (commit only after tsc+build pass).
- Round 2 browser verification required a scripted two-step click (React flushes state async; agent-browser refs went stale between shell calls). The app behavior was correct; the tooling needed an atomic eval.

## External review (codex exec, read-only sandbox, 2026-11-07)
| Severity | Finding | Verdict | Fix |
|----------|---------|---------|-----|
| P1 | ConfirmSubmit swapped button→submit element on arm click; retargeted click could submit on first press | real (hazard) | single persistent type=submit + preventDefault when arming; verified: 1 click arms only, 2nd deletes |
| P2 | RoleSelect defaultValue goes stale after role change | real | `key={role}` remounts select with current role |
| P2 | `--accent` CSS variable undefined → new CTAs invisible (transparent bg + white text) | real | replaced with `--primary`; computed bg verified rgb(37,99,235) |
| — | server actions, tenancy, Retry-After | clean | — |
