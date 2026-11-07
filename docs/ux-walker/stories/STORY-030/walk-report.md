# STORY-030 — expired/used reset link
Used token: page initially rendered a live form (F-030-001); submit-time rejection message correct ("This reset link is invalid or has expired."). After fix (commit 2d22316): the used token is rejected up front with a forgot-password pointer. Screenshot: shots/STORY-030/fixed-upfront-rejection.png.
