# STORY-019 — revoke a pending invitation
Clicked "Revoke" on the first pending row — it revoked the WRONG invitation (the list has no deterministic order; rows render in arbitrary DB order). Fixed: newest-first ordering (commit c6bdccd). Re-verified implicitly on later member visits. Screenshot: shots/STORY-019/invite-revoked.png.
