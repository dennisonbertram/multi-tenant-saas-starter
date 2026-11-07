# UX Path Catalog: SaaS Starter

Generated: 2026-11-07
Total Stories: 33
Coverage: 10 / 10 feature areas (100%); 4 known product gaps noted below.

Note: full story text (steps, variations, edge cases) lives in `topics/*.md`.
This catalog holds the numbering, dependency graph, coverage and redundancy
analysis. The ux-walker reads topic files using this id map.

## Summary
| Type | Count |
|------|-------|
| Short | 28 |
| Medium | 4 |
| Long | 1 |

## Story id map
| Id | Topic | Title | Type |
|----|-------|-------|------|
| STORY-001 | signup-onboarding | Maria signs up and creates her company's workspace | long |
| STORY-002 | signup-onboarding | Maria explores the dashboard right after signup | short |
| STORY-003 | signup-onboarding | Founder signs up with a weak password | short |
| STORY-004 | signup-onboarding | Maria tries to sign up twice with the same email | short |
| STORY-005 | signup-onboarding | New user orients using the header navigation | short |
| STORY-006 | authentication | Returning user signs in | short |
| STORY-007 | authentication | User signs out | short |
| STORY-008 | authentication | User forgot their password and resets it | medium |
| STORY-009 | authentication | Logged-out user tries to open a protected page | short |
| STORY-010 | authentication | Signed-in user opens a login page | short |
| STORY-011 | email-verification | New user verifies their email from the emailed link | short |
| STORY-012 | email-verification | User requests a fresh verification email | short |
| STORY-013 | email-verification | User pastes a verification URL without a token | short |
| STORY-014 | organization-lifecycle | Owner creates a second organization from Settings | medium |
| STORY-015 | organization-lifecycle | Admin renames the organization | short |
| STORY-016 | organization-lifecycle | Member of two orgs switches context | short |
| STORY-017 | organization-lifecycle | Fresh user has exactly one organization and no switcher | short |
| STORY-018 | membership-management | Owner invites a teammate as member | medium |
| STORY-019 | membership-management | Admin revokes a pending invitation | short |
| STORY-020 | membership-management | Owner changes a member's role to admin | short |
| STORY-021 | membership-management | Admin removes a member | short |
| STORY-022 | membership-management | Invited person opens the link from the wrong account | short |
| STORY-023 | projects | Member creates their first project | short |
| STORY-024 | projects | Admin deletes a project | short |
| STORY-025 | projects | Member sees projects only from their own organization | short |
| STORY-026 | projects | User hits the dashboard empty state | short |
| STORY-027 | api-consumption | Integration developer reads projects over the API | medium |
| STORY-028 | api-consumption | Integration creates a project via the API | short |
| STORY-029 | api-consumption | Ops checks service health | short |
| STORY-030 | error-recovery | User follows an expired password-reset link | short |
| STORY-031 | error-recovery | Member opens an admin-only page | short |
| STORY-032 | error-recovery | User opens a reused invitation link | short |
| STORY-033 | error-recovery | Guest hits unknown routes and protected APIs | short |

## Coverage Matrix
| Feature Area | Stories | Gaps |
|--------------|---------|------|
| Landing & entry | 001, 006 | — |
| Signup & onboarding | 001–005 | — |
| Login/logout/redirects | 006, 007, 009, 010 | — |
| Password reset | 008, 030 | — |
| Email verification | 011–013 | — |
| Organization create/rename/switch | 014–017 | — |
| Invitations | 018, 019, 022, 032 | — |
| Roles | 020, 021 | **No UI to change roles** (STORY-020) |
| Projects (example resource) | 023–026 | — |
| JSON API | 027–029 | — |
| Error/empty states | 026, 030–033 | — |

## Story Dependency Graph
```text
STORY-001 (signup)
├── STORY-002 (explore dashboard)
├── STORY-011 (verify email)
├── STORY-005 (orient header)
└── STORY-026 (empty state)
STORY-006 (login)
├── STORY-015 (rename org)      [needs admin+]
├── STORY-018 (invite)          [needs admin+]
│   ├── STORY-019 (revoke invite)
│   └── STORY-022 (wrong-account invite)
├── STORY-023 (create project)
│   └── STORY-024 (delete project)
└── STORY-014 (second org)
    └── STORY-016 (switch org)
        └── STORY-025 (cross-org isolation)
```

## Redundancy Candidates
### Duplicate paths (same goal, multiple routes)
- Create project: UI form (`/projects`) and `POST /api/v1/projects`; same result — deliberate (API for integrations), keep both.
- Reach projects page: header nav link and dashboard empty-state link; same result, complementary (empty state only when empty) — keep both.
### Duplicate information (same fact, multiple surfaces)
- **Organization name**: header label, dashboard `<h1>`, members page `<h1>`, projects list card title — 4 surfaces.
- **User's role in org**: dashboard ("your role here: owner"), members page hint text, settings page ("your role: owner") — 3 surfaces.
- **Email address**: members list rows and (implicitly) header only shows name/org — acceptable.
### Overlapping features/tools
- None found (small app; roles vs invitations are distinct).

## Gaps & Recommendations
1. **No UI to change a member's role** — owner-only action exists only in code; the members page even says so in a hint. (Fed to ux-flow.)
2. **No account/profile settings** — a user cannot change their own password (while signed in), name, or email anywhere in the UI.
3. **Audit log is write-only** — recorded but not viewable by owners/admins.
4. **No pending-invite re-send** — a lost invite email requires revoke + re-invite.
