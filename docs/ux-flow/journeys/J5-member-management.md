# J5 — Member management (STORY-020/021/031)

## Friction Scorecard
- Remove member: 2 actual / 2 ideal — but zero guard on an irreversible action (issue #2).
- Change role: **∞ actual / 2 ideal** — impossible in the UI (issue #1). This is the one convoluted verdict in the app: the workflow exists only as code.
- Member view: read-only list is right; Settings nav hidden after F-031-001 fix.

## Take-away pass
- Members page structure (Team / Pending invitations / Invite someone) matches task order: see who's in, what's pending, add someone. Good hierarchy.
- The role-change hint text is developer-facing copy in a user surface — disappears once issue #1 is built.

## The simpler version
1. Members → 2. row menu: change role (owner-only) / remove (with confirm). That is the standard pattern; the server actions already exist.

## Clarity issues
- "via the API or a management script in this starter" — starter-appropriate, but it IS the product gap.

Verdict: convoluted (role change impossible in UI; removal unguarded)
