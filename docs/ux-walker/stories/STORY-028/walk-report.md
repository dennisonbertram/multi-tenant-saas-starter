# STORY-028 — create a project via the API
POST {"name":"From API"} → 201 with the created row (org-scoped); invalid body {} → 422 {"error":"Validation failed","fields":{"name":"Required"}}. Flow log: ideal 2, actual 2. No findings.
