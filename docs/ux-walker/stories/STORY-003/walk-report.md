# STORY-003 — weak password rejected
Signup form: 7-char password + submit → browser-native minLength=10 validation blocked submission (no server round-trip needed); field keeps value, no account created (user count unchanged). Screenshot: shots/STORY-003/weak-password.png. Geometry: clean.
Flow log: ideal 2 steps, actual 2 — as designed. Inline server-side zod error exists as fallback for API-level bypass. No findings.
