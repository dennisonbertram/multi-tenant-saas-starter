# UX Flow plan — 2026-11-07

Evidence source: fresh ux-walker artifacts (run of 2026-11-07, this session).
No UI commits since the walk except the walker's own fixes (re-walked live).

## Selected journeys (8)
| Journey | Stories | Why |
|---------|---------|-----|
| J1 signup + onboarding | STORY-001/002/005/026 | the money path |
| J2 password recovery | STORY-008/030 | high-stakes, infrequent |
| J3 org lifecycle | STORY-014/015/016/017 | tenancy core |
| J4 invitations | STORY-018/019/022 | team growth path |
| J5 member management | STORY-020/021/031 | admin core (has filed issue #1) |
| J6 projects CRUD | STORY-023/024/025 | example resource, deletion issue #2 |
| J7 API integration | STORY-027/028/029 | programmatic users |
| J8 email verification | STORY-011/012/013 | gate on the money path |

## Redundancy candidates (from catalog)
- Create project: UI form vs POST /api/v1/projects — deliberate duality, keep both.
- Reach projects page: nav link + dashboard empty-state link — complementary, keep.
- **Org name shown on 4 surfaces** (header, dashboard h1, members h1, projects card title).
- **User's role shown on 3 surfaces** (dashboard, members hint, settings).
- Verification message ×2 on the post-signup dashboard (banner + welcome card).
- Login redirect enforced twice (middleware bounce + requireOrg) — code-level, invisible to users.
