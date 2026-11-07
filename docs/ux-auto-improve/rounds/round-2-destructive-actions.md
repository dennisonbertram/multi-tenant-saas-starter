# Round 2 — Destructive actions (2026-11-07)

## Review (evidence: STORY-024 walk, shots/STORY-024/project-deleted.png, GitHub issue #2)
1. **Project delete executes on one click** (medium) — irreversible, no confirm, no undo.
2. **Member removal executes on one click** (medium) — same pattern, same fix.
3. (Reviewer note) An undo toast would be nicer UX than a confirm, but requires soft-delete infrastructure the starter deliberately lacks. Rejected for now; confirm is the right-sized guard.

## Judge (adversarial check)
- Verified in code: `deleteProjectAction` and `removeMemberAction` are plain form actions with no client-side gate. Claim real.
- Approved with tightened spec:
  - Two-step inline confirm: first click turns the button into "Confirm delete?" (danger style); clicking again submits; clicking elsewhere/timeout resets to the original label. No `window.confirm` dialogs (jarring, blocks automation, poor mobile).
  - One shared client component used by BOTH forms — no per-page copies.
  - Must NOT change: the server actions, the row layout, the role select from round 1.
  - Regression: typecheck + build + browser (delete flow shows two-step; second click deletes; Escape/timeout resets).

## Work package
- WP1: `ConfirmSubmit` client component + wire into projects and members pages.
  - Files: src/components/confirm-button.tsx (new), src/app/(app)/projects/page.tsx, src/app/(app)/members/page.tsx.

## Result
- Implemented and browser-verified (see commits).
