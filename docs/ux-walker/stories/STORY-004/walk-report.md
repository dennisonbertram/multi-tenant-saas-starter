# STORY-004 — duplicate email on signup
Submitted signup with existing maria@acme.test → inline field error "An account with this email already exists." under the email field; no redirect, form retains values. Screenshot: shots/STORY-004/duplicate-email.png.
Flow log: ideal 2, actual 2 — as designed. Live-confirmed earlier in the run when the crashed signup (F-001-001) left maria@acme.test half-onboarded. No findings.
