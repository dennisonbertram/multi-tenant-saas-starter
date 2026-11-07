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

## Round 6 — Sidebar shell + navigation (2025-XX-XX, shadcn era)
Section: app shell (sidebar). Reviewed post-migration; no prior UX pass.
- **Fixed — double highlight:** /settings/account lit up both "Settings" and
  "Account" (startsWith overlap). Active state now exact-match
  (`app-sidebar.tsx`). Verified: /settings/account → ["Account"] only.
- **Fixed — no collapse affordance:** added `<SidebarRail />` (edge
  click-to-collapse on desktop).
- Rejected: org-switcher label (clutter), user-footer dropdown (no gain),
  create-org in sidebar (exists on /settings; members shouldn't self-serve).
- Deferred to later rounds: dashboard redundant org-name header (R2).

## Round 7 — Dashboard (2025-XX-XX)
Section: dashboard. Reviewed post-shadcn/post-sidebar.
- **Fixed — triple redundancy:** page-level "Acme Holdings" h1 + "Signed in
  as …" removed (org name already in sidebar switcher + inset header; email
  in sidebar footer). Verified gone from DOM.
- **Added — org stats row:** three StatCard tiles (Active projects, Members,
  Pending invites) using org-scoped count() queries; invite tile admin-only
  (members must not see invite volume). StatCard added to the design system
  (ui.tsx) per the extend-first rule. Tiles link to their sections.
- **Fixed — project rows:** now show created date (right-aligned, muted).
- Screenshots: r2-before-dashboard.png / r2-after-dashboard.png.

## Round 8 — Projects (2025-XX-XX)
- **Fixed — archived rows leaked into the list:** the page selected all
  projects while the dashboard filters archived=false; archived rows showed
  unlabeled and identical to active ones. List now filters archived.
  Regression-proven: archived a project via SQL → gone from the list.
- **Fixed — inconsistent row metadata:** project rows now show created
  dates (matches dashboard rows).
- **Fixed — form-first always:** create card now renders after the list
  when projects exist, before it when empty (onboarding preserved).
  Verified both orders live.

## Round 9 — Members (2025-XX-XX)
- **Fixed — invites vanished silently on expiry:** expired invites were
  filtered out of the pending list with no trace; admins couldn't see why a
  link "didn't work". Expired rows now stay visible (dimmed, "Expired <date>"
  badge) with Resend (token regeneration = re-invite) and Revoke.
- **Added — expiry dates** on active invite rows ("expires Nov 12, 2025").
- Rejected: joined-date on member rows (clutter); confirm on Revoke
  (low-stakes, re-invitable).
- Regression seed: one fresh + one expired invite via SQL; verified both
  render correctly (r4-members.png).

## Round 10 — Auth flows (2025-XX-XX)
- **Added — PasswordInput with show/hide toggle** (design-system component
  in ui.tsx, Lucide Eye/EyeOff, aria-label swaps). Replaced every raw
  password input: login, signup, reset-password, accept-invite, account
  password change. Verified toggle flips type both ways on /login.
- Reviewed and kept as-is: anti-enumeration on forgot-password (generic
  response), pending states on all submit buttons, autocomplete attrs,
  autoFocus on email — all already correct.

## Round 11 — Settings + Account (2025-XX-XX)
- **Fixed — no-op saves:** "Save name" (account) and "Save" (org rename)
  could be clicked with unchanged values, producing pointless audit entries
  and success toasts. Both forms now disable submit until dirty; verified
  disabled → edit → enabled → undo → disabled on both.
- **Fixed — focus steal:** CreateOrgForm's autoFocus ran on /settings even
  though rename sits above it. autoFocus is now a prop; only the no-org
  page (where the form is the sole content) passes it.
- Deferred: delete-organization danger zone → R8 (org lifecycle).

## Round 12 — Audit log (2025-XX-XX)
- **Fixed — actor names:** actorName was selected but never rendered; rows
  now show "Name (email)".
- **Fixed — raw JSON metadata:** metadata rendered as JSON.stringify blob;
  now "key: value · key: value".
- Rejected: relative timestamps (absolute UTC is correct for forensics).
- Deferred: action/actor filters — the page is an example teams replace;
  noted for template users in docs/MULTI-TENANCY.md later if wanted.

## Round 13 — Org lifecycle (2025-XX-XX)
New features (user-requested direction: "make better features"):
- **Leave organization:** self-service exit on your own row in /members
  (two-step confirm). Server guard: last owner cannot leave — redirects to
  /members?error=last-owner with a clear alert. Verified live: member left
  Acme Holdings → landed on dashboard under their remaining org; last-owner
  attempt blocked, membership intact.
- **Delete organization:** owner-only "Danger zone" card on /settings.
  Requires typing the org name exactly (button disabled until match,
  server re-validates with a zod literal). Cascades to memberships,
  invitations, projects, audit rows; active-org cookie cleared; lands on
  remaining org or /no-org. Verified live with a throwaway org.

## Round 14 — Public surfaces + token hygiene (2025-XX-XX)
- **Fixed — design-system violations on public pages:** landing's signed-in
  CTA hand-rolled button styles (now ButtonLink); text-slate-400/bg-white/
  bg-slate-50 replaced with tokens (text-muted-foreground/bg-card/bg-muted/50).
  grep now clean: zero hardcoded palette classes outside ui/.
- **Fixed — off-system armed state:** ConfirmSubmit's armed style was
  hand-rolled solid red; now buttonStyles("danger") — matches the system's
  destructive buttons exactly (Nova style is soft-destructive by design).
- **Fixed — stale copy:** landing no longer claims "dependency-free"
  (shadcn/Radix are deps now).
- Regression: two-step delete still works end-to-end (armed → confirm →
  row gone from DB).

## Round 15 — Cross-cutting polish (2025-XX-XX)
- **Added — working dark mode:** the .dark token block existed but nothing
  applied it. Dependency-free theme system: inline flash-prevention script
  in the root layout (localStorage, falls back to OS preference) +
  ThemeToggle in the sidebar footer. Verified: toggles both ways, persists,
  body bg switches gray-950 ↔ white; dark dashboard/members visually
  coherent (vision-checked: no light cards, no broken contrast).
- **Added — favicon:** src/app/icon.svg (blue rounded square, white S),
  served by Next automatically.
