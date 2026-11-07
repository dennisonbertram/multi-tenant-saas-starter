# Topic: organization-lifecycle

## STORY-030: Owner creates a second organization from Settings

**Type**: medium
**Topic**: organization-lifecycle
**Persona**: Maria, owner of Acme Inc., starting a second venture.
**Goal**: Keep two ventures separate under one login.
**Preconditions**: signed in, owner of one org.
**Ideal path**: 4 — Settings, fill name, submit, land in the new org's dashboard.
**Alternate paths**: none found.

### Steps
1. Click "Settings" in the header -> settings page with rename card and "Create another organization" card.
2. Fill the new org name -> submit "Create organization".
3. Land on `/dashboard` switched to the new org (header shows it; role: owner).
4. Use the header org switcher (select + "Switch") -> back to Acme Inc.

### Variations
- none.

### Edge Cases
- Same name as existing org: allowed (slug gets a timestamp suffix).

## STORY-031: Admin renames the organization

**Type**: short
**Topic**: organization-lifecycle
**Persona**: admin rebranding after a merger.
**Goal**: Update the org name everywhere.
**Preconditions**: signed in as admin or owner.
**Ideal path**: 3 — Settings, edit name, Save, header reflects it.
**Alternate paths**: none found.

### Steps
1. Open `/settings` -> "Organization" card with current name in an input.
2. Change the name -> "Save".
3. See "Organization updated." and the header/heading show the new name.

### Variations
- Member tries: redirected to `/dashboard?error=forbidden`.

### Edge Cases
- Empty name: inline "Organization name is required".

## STORY-032: Member of two orgs switches context

**Type**: short
**Topic**: organization-lifecycle
**Persona**: consultant in Client A and Client B.
**Goal**: See the right org's data.
**Preconditions**: member of ≥2 orgs.
**Ideal path**: 2 — pick org in the switcher, click Switch, all data re-scopes.
**Alternate paths**: Creating a new org also switches to it.

### Steps
1. Pick the other org in the header select -> click "Switch".
2. Dashboard/Projects/Members now show the chosen org's data.

### Variations
- Single-org user: no switcher, just the org name label.

### Edge Cases
- Cookie manually edited to an org id the user doesn't belong to: silently falls back to first org (no leak).

## STORY-033: Fresh user has exactly one organization and no switcher

**Type**: short
**Topic**: organization-lifecycle
**Persona**: new user.
**Goal**: Not be confused by unnecessary controls.
**Preconditions**: one org only.
**Ideal path**: 1 — header shows the org name as plain text, no select.
**Alternate paths**: none found.

### Steps
1. Look at the header -> org name shown, no switcher UI.

### Variations
- none.

### Edge Cases
- None.
