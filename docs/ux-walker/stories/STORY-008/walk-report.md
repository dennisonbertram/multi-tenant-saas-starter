# STORY-008 — forgot + reset password
Forgot form → generic success (anti-enumeration verified live: unknown address dana@acme.test produced the identical message and no email). Reset link (1h token) → new password → /login?reset=1 → success alert → sign-in with new password works. Screenshots: shots/STORY-008/*. Geometry: clean.
Flow log: ideal 5, actual 5 — as designed. Finding: reset page renders a live form even for used/expired tokens (F-030-001, fixed).
