# STORY-031 — member opens admin-only page
Dana (member) visited /settings → redirected to /dashboard?error=forbidden with "You don't have permission for that action." Follow-up fix: the Settings nav link is now hidden for members (F-031-001, commit 2d22316) so they are not invited to click something that bounces. Screenshot: shots/STORY-031/forbidden.png.
