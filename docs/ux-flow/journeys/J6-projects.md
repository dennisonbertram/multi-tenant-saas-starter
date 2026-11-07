# J6 — Projects CRUD (STORY-023/024/025)

## Friction Scorecard
- Create: 3 / 3 (nav → name → submit; list updates in place).
- Delete: 1 actual / 2 ideal — FASTER than ideal, which is the problem: no guard on an irreversible delete (issue #2).
- Cross-org isolation: verified (STORY-025); switching is the only extra step and it is necessary.

## Take-away pass
- "All projects in {org}" card title repeats the org name already in the header and page context — one of the 4 org-name surfaces (redundancy map).
- Empty state ("Nothing here yet.") is fine; dashboard empty state links here — complementary, keep.

## The simpler version
Current flow + a confirm guard on delete. Nothing else to remove.

## Clarity issues
- None.

Verdict: acceptable (create/list minimal; delete under-guarded)
