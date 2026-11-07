# J3 — Organization lifecycle (STORY-014/015/016/017)

## Friction Scorecard
- Create second org: 4 actual / 4 ideal (Settings → name → submit → auto-switch). Auto-switch is the right default.
- Rename: 3 / 3. Switch: 2 / 2.
- Decisions: org name only. Re-entry: none.
- Dead ends: none.

## Take-away pass
- Switching uses a select + a separate "Switch" button (measured, STORY-016). The button exists because the switch is a server action form; a same-origin auto-submit onChange would remove one click and one decision. Small win; not worth churn in a starter (suggestion).
- Settings page hosts both rename and create-org — the two org-level actions live in one place. Good IA.

## The simpler version
Same steps; optionally drop the "Switch" button via auto-submit select.

## Clarity issues
- "Create another organization" is clear. No naming drift (org everywhere, never "workspace"/"team").

Verdict: minimal
