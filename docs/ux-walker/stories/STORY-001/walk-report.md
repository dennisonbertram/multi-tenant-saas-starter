# STORY-001 walk report — Maria signs up and creates her workspace

URL base: http://localhost:3210 · Session: ux-walker-localhost

## Steps walked
1. Landing page (`step-1-landing.png`): heading + "Create an account" / "Sign in" links. Geometry: clean.
2. Signup form (`step-2-signup-form.png`): 4 labeled fields + "Create account" button + sign-in link. Geometry: clean.
3. Submitted → `/dashboard?welcome=1` (`step-3-dashboard.png`). Geometry: clean (one benign nav-width variance).
   - look_at_image: all elements aligned; **no strong primary action** on the dashboard; verification mentioned twice (banner + welcome card); org name appears 3×.
4. Verification email logged to server console (SMTP unconfigured) — link captured for STORY-011.

## Deviations from the catalog
- First submission attempt crashed the server action (F-001-001, fixed mid-run, commit 11ee0d0). The crash left the user row created but no session — user stranded on an error page. After the fix, a second email worked first try.
- One automation quirk: after an inline validation error, a re-click on the submit button did not fire until a page reload. Not reproducible manually; logged as suspected, not a finding.

## Flow log
- Steps actual vs ideal: 5 actual vs 5 ideal — **as designed**. ✔
- Hesitation points: none — labels are plain ("Your name", "Work email", "Organization name").
- Re-entry: none.
- Duplication seen: verification message ×2 on the welcome screen.

## Findings
See findings.json. F-001-001 (critical) fixed during the run.
