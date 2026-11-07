# Round 1 — Members & roles (2026-11-07)

## Review (evidence: STORY-020 walk, shots/STORY-020/members-role-hint.png, GitHub issue #1)
1. **No role-change UI** (high) — core owner workflow exists only as `changeMemberRoleAction`; the page tells users to use "the API or a management script". Change: owner-only role select per member row. User effect: promotion/demotion becomes a 2-step UI task. Risk: low (server rules exist). Size: S.
2. **Developer hint text in a user surface** (low) — the "via the API…" sentence goes away once (1) ships. Size: S.
3. **Role-change failures have nowhere to render** (medium) — e.g. demoting the last owner returns an error string with no UI surface today. Change: render the action's error inline. Size: S.

Rejected by reviewer: inviter/date columns on pending invitations (speculative), pagination (no scale evidence).

## Judge (adversarial check)
- Proposal 1 **approved**. Code check: `changeMemberRoleAction` exists with a last-owner guard (src/app/(app)/actions.ts) — the gap is real and purely UI-side. Tightened spec:
  - Role select renders **only for owners** and **never on the viewer's own row** (self-demote of the last owner is exactly the bug class the server guards; hiding the control removes the trap).
  - On change → submit immediately (no extra Save button — decision economy).
  - Server error (e.g. last-owner race) renders inline, red, next to the row.
  - Must NOT change: the server action, the role enum, the remove-member flow.
  - Regression check: `npm run typecheck && npm run build`, then browser: invite a member, promote to admin, verify the DB role, verify a non-owner sees no select.
- Proposal 2 **approved** (consequence of 1).
- Proposal 3 **approved** (folded into the select component).

## Work packages
- WP1: `RoleSelect` client component + members page wiring.
  - Files owned: src/app/(app)/members/page.tsx (edit), src/app/(app)/role-select.tsx (new).
  - Regression check that must fail first: none exists (no test runner in repo) — typecheck + build + browser walk serve as the regression gate for this starter.

## Result
- Implemented WP1 (commit recorded in git log).
- Browser verification: owner sees selects on other members' rows; changing member→admin persists (DB checked); member view has no selects; own row has no select.
