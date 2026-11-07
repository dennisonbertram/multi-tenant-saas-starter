# Topic: api-consumption

## STORY-060: Integration developer reads projects over the API

**Type**: medium
**Topic**: api-consumption
**Persona**: Priya, building an internal dashboard against the API.
**Goal**: Fetch the org's projects with a session cookie.
**Preconditions**: valid session (cookie), projects exist.
**Ideal path**: 2 — GET /api/v1/projects with cookie, receive JSON array.
**Alternate paths**: none found.

### Steps
1. `GET /api/v1/projects` with a valid session cookie -> 200 `{ data: [...] }` scoped to the active org.
2. Without a cookie -> 401 `{"error":"Unauthorized"}`.

### Variations
- Member of several orgs: response follows the active-org cookie.

### Edge Cases
- Expired session: 401.
- No org membership (should not happen): 403 "No organization".

## STORY-061: Integration creates a project via the API

**Type**: short
**Topic**: api-consumption
**Persona**: Priya automating project creation.
**Goal**: Create a project programmatically.
**Preconditions**: valid session.
**Ideal path**: 2 — POST JSON {name}, receive 201 with the created project.
**Alternate paths**: UI form (STORY-050).

### Steps
1. `POST /api/v1/projects` with `{"name":"From API"}` -> 201, project created in the active org.
2. `GET` again -> the new project appears.

### Variations
- Invalid body (missing name): 422 with field errors.
- Non-JSON body: 400.

### Edge Cases
- 31st request in a minute: 429 rate limited.

## STORY-062: Ops checks service health

**Type**: short
**Topic**: api-consumption
**Persona**: ops engineer / uptime monitor.
**Goal**: Know the app and DB are alive.
**Preconditions**: app running.
**Ideal path**: 1 — GET /api/health returns status ok.
**Alternate paths**: none found.

### Steps
1. `GET /api/health` -> `{"status":"ok","database":"up"}`.
2. With the DB stopped -> 503 with `database:"down"`.

### Variations
- none.

### Edge Cases
- None.
