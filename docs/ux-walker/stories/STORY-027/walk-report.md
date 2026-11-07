# STORY-027 — read projects over the API (curl)
GET /api/v1/projects with a valid session cookie → 200 {"data":[…]} scoped to the active org (Beta-only project returned with its organizationId). Without a cookie → 401 {"error":"Unauthorized"}. Flow log: ideal 2, actual 2. No findings.
