# Topic: projects

## STORY-050: Member creates their first project

**Type**: short
**Topic**: projects
**Persona**: Dana, new member.
**Goal**: Add a project to track work.
**Preconditions**: signed in as any role.
**Ideal path**: 3 — Projects page, fill name, submit, project appears in the list.
**Alternate paths**: `POST /api/v1/projects` (programmatic).

### Steps
1. Click "Projects" -> "New project" card + list (possibly empty).
2. Fill name "Website refresh", optional description -> "Create project".
3. Project appears in "All projects in {org}" list.

### Variations
- Dashboard path: create from `/projects` after clicking the empty-state link on the dashboard.

### Edge Cases
- Empty name: inline "Name is required".
- 101+ chars: rejected by maxLength/validation.

## STORY-051: Admin deletes a project

**Type**: short
**Topic**: projects
**Persona**: admin cleaning up.
**Goal**: Remove a stale project.
**Preconditions**: project exists; actor admin+.
**Ideal path**: 2 — Projects page, Delete on the row, gone.
**Alternate paths**: none found.

### Steps
1. Open `/projects` -> each row has "Delete" (admin+ only).
2. Click "Delete" -> row disappears immediately (no confirmation dialog).

### Variations
- Member viewing: no Delete buttons.

### Edge Cases
- Deletion is immediate and unrecoverable — no undo/confirm (potential finding).

## STORY-052: Member sees projects only from their own organization

**Type**: short
**Topic**: projects
**Persona**: consultant in two orgs.
**Goal**: Confirm data separation.
**Preconditions**: projects exist in org A; user switches to org B.
**Ideal path**: 2 — switch org, project list shows only org B's projects.
**Alternate paths**: none found.

### Steps
1. Note org A's project list.
2. Switch to org B via header -> `/projects` shows only org B's projects.

### Variations
- none.

### Edge Cases
- Direct API call with org-B session for an org-A project id: 404/empty (isolation holds).

## STORY-053: User hits the dashboard empty state

**Type**: short
**Topic**: projects
**Persona**: brand-new user.
**Goal**: Know what to do next.
**Preconditions**: no projects in the org.
**Ideal path**: 2 — dashboard shows an empty-state line with a link to create.
**Alternate paths**: none found.

### Steps
1. Open `/dashboard` -> "No projects yet." with a link to /projects.
2. Click the link -> projects page with the create form.

### Variations
- With projects: top-5 list shown instead.

### Edge Cases
- None.
