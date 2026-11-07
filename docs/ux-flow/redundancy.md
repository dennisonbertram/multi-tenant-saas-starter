# Redundancy & information architecture — 2026-11-07

Evidence: walker screenshots (docs/ux-walker/shots/), DOM snapshots, journey files.

## Duplicate paths
- **Create project**: UI form (`/projects`) and `POST /api/v1/projects`. Same result, different audiences (humans vs integrators). Recommendation: **keep both** — this is the intended API/UI duality.
- **Reach projects page**: header nav and dashboard empty-state link. Complementary (empty state only renders when empty). **Keep both.**
- **Auth redirect enforcement**: middleware bounce + `requireOrg()` redirect. Invisible to users; defense in depth. **Keep.**

## Duplicate information
- **Organization name — 4 surfaces**: header label, dashboard `<h1>`, members page `<h1>`, projects card title ("All projects in Acme Holdings"). Each marks a scope boundary, which has real value in a multi-tenant app. Recommendation: **keep header + page-level h1; drop the card-title repetition** ("All projects" suffices — the page is already org-scoped).
- **User's role — 3 surfaces**: dashboard ("your role here: owner"), members page hint, settings ("your role: owner"). Role is context for permissions, not a fact users need everywhere. Recommendation: **one canonical surface — the members page** (next to the people it governs); drop from dashboard and settings.
- **Verification status — 2 surfaces** on the post-signup dashboard (banner + welcome card). Recommendation: **banner is canonical**; remove the welcome-card sentence (F-002-001).

## Overlapping features
- None found. Roles vs invitations vs org settings are cleanly separated. The app is small enough that no two features collide.

## Hierarchy & IA
- Navigation (Dashboard / Projects / Members / Settings) matches tenant-SaaS priorities; nothing important is buried; nothing trivial is top-level.
- One concept, one name: "organization" everywhere (slug, UI, docs). No workspace/team/site drift.
- Members page IA (Team → Pending invitations → Invite someone) matches the admin's task order.
- The developer-facing copy on user surfaces ("Example tenant-scoped data. Replace the projects table…", the role-change hint) is intentional starter scaffolding — flag for removal when the real domain lands.

## Verdict
The IA is clean for an app this size. The only real redundancies are repeated facts (org name, role, verification), and each has an obvious canonical surface.
