# STORY-006 — returning user signs in
Login form (email+password+links) → submit → /dashboard. First attempt exposed F-006-001: with no ?next param the hidden next field is "" and redirect("") crashed server-side AFTER the session cookie was set — user saw "Application error" though signed in. Fixed (commit 441a4b0); re-walk: clean redirect to /dashboard (shots/STORY-006/login-fixed-clean-redirect.png).
Flow log: ideal 3, actual 3 after fix. Geometry: clean.
