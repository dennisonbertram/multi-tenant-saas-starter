# UX Flow Critique — 2026-11-07

## Run Summary
| Metric | Value |
|--------|-------|
| Journeys critiqued | 8 |
| Evidence source | ux-walker artifacts (run of 2026-11-07, same session) |
| Verdicts | 6 minimal, 1 acceptable, 1 convoluted |

## Friction Scorecard
| Journey | Steps (actual/ideal) | Needless decisions | Re-entry | Dead ends | Verdict |
|---------|----------------------|--------------------|----------|-----------|---------|
| J1 signup | 5/5 | 0 | 0 | 0 | minimal |
| J2 password recovery | 5/5 | 0 | 0 | 0 | minimal |
| J3 org lifecycle | 4/4, 3/3, 2/2 | 1 (Switch button) | 0 | 0 | minimal |
| J4 invitations | 3/3 + 3/3 | 0 | 0 | 0 | minimal |
| J5 member management | 2/2 (remove); ∞/2 (role) | 0 | 0 | 0 | **convoluted** |
| J6 projects | 3/3; delete 1/2 | 0 | 0 | 0 | acceptable |
| J7 API | 2/2 | 0 | 0 | 0 | minimal |
| J8 email verification | 2/2 | 0 | 0 | 0 | minimal |

## Redundancy Map
- Org name on 4 surfaces → keep header + h1, drop card-title repetition.
- User's role on 3 surfaces → canonical surface: members page.
- Verification ×2 on post-signup dashboard → banner canonical.
- UI/API project creation duality → deliberate, keep both.
Full analysis: redundancy.md.

## Simplification Proposals (ranked)
### 1. Build the role-change UI (resolves the only convoluted journey)
- **Now**: role changes exist only as `changeMemberRoleAction`; the UI says "via the API or a management script" (STORY-020, issue #1).
- **Proposed**: owner-only role dropdown per member row; last-owner protection already server-side.
- **Saves**: turns an impossible workflow (∞ steps) into 2; unblocks owner onboarding.
- **Effort**: S
- **Evidence**: journeys/J5, shots/STORY-020/members-role-hint.png.
### 2. Guard destructive actions (delete project, remove member)
- **Now**: one click destroys, no confirm/undo (issue #2).
- **Proposed**: shared two-step confirm button; server actions unchanged.
- **Saves**: prevents irreversible mis-clicks on the two most destructive actions.
- **Effort**: S
- **Evidence**: journeys/J5, J6; shots/STORY-024/project-deleted.png.
### 3. Deduplicate facts on the post-signup dashboard
- **Now**: verification ×2, org name ×3, no primary CTA (F-002-001).
- **Proposed**: banner is the single verification mention; welcome card gains a primary "Create your first project" button; drop card-title org repetition.
- **Saves**: 2 repeated statements; gives the money-path screen one dominant action.
- **Effort**: S
- **Evidence**: journeys/J1; shots/STORY-001/step-3-dashboard.png.
### 4. Auto-submitting org switcher
- **Now**: select + separate "Switch" button.
- **Proposed**: submit onChange; removes one click and one decision per switch.
- **Saves**: 1 step per switch (low-frequency action — ranked last deliberately).
- **Effort**: S
- **Evidence**: journeys/J3; shots/STORY-016/switched-back-acme.png.

## Already Minimal
Signup, password recovery, invitations, email verification, API journeys passed clean — re-runs can skip their step-economy analysis and only re-check for regressions.
