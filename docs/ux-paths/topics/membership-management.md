# Topic: membership-management

## STORY-040: Owner invites a teammate as member

**Type**: medium
**Topic**: membership-management
**Persona**: Maria, owner, hiring her first engineer.
**Goal**: Get Dana into the org.
**Preconditions**: signed in as owner/admin; Dana has no account yet.
**Ideal path**: 4 — Members page, enter email, send, Dana accepts from the email link.
**Alternate paths**: none found.

### Steps
1. Click "Members" -> team list plus "Invite someone" card (admin+ only).
2. Enter dana@example.com, role "Member" -> "Send invitation".
3. See "Invitation sent to dana@example.com." and the pending-invitations list gains a row.
4. Dana opens the emailed `/accept-invite?token=…` link -> "Join Acme Inc." card with a signup form (name, email prefilled read-only, password).
5. Dana submits -> signed in and lands on `/dashboard` inside Acme Inc. as member.

### Variations
- Invitee already has an account: accept page shows "Accept invitation" button for the matching signed-in user instead of a signup form.
- Owner invites with role "Admin": option only present for owners.

### Edge Cases
- Inviting someone already a member: "This person is already a member."
- Invite link used twice: second attempt rejected.
- Invite expired (7 days): "invalid or has expired".

## STORY-041: Admin revokes a pending invitation

**Type**: short
**Topic**: membership-management
**Persona**: admin, invited the wrong address.
**Goal**: Cancel the invite.
**Preconditions**: pending invitation exists.
**Ideal path**: 2 — Members page, Revoke on the row, row disappears.
**Alternate paths**: none found.

### Steps
1. Open `/members` -> pending invitations list shows email + role.
2. Click "Revoke" -> row disappears; the old link now rejects.

### Variations
- none.

### Edge Cases
- Revoking an already-accepted invitation: not possible (accepted invites are not listed).

## STORY-042: Owner changes a member's role to admin

**Type**: short
**Topic**: membership-management
**Persona**: owner promoting a trusted teammate.
**Goal**: Grant admin rights.
**Preconditions**: owner; target membership exists.
**Ideal path**: 2 — change role, see confirmation. (As shipped, the members page lists roles but has no inline role selector; the owner uses the API/action surface — this gap is itself a finding.)
**Alternate paths**: none found.

### Steps
1. Open `/members` -> note the hint text that role changes are done via API/script, not the UI.
2. (Gap) No UI control exists to change a role.

### Variations
- none.

### Edge Cases
- Demoting the last owner must be refused (protected in the action layer).

## STORY-043: Admin removes a member

**Type**: short
**Topic**: membership-management
**Persona**: admin offboarding a contractor.
**Goal**: Remove access.
**Preconditions**: member to remove; actor is admin+.
**Ideal path**: 2 — Members page, Remove on the row, member gone.
**Alternate paths**: none found.

### Steps
1. Open `/members` -> each other-member row has a "Remove" button.
2. Click "Remove" -> member disappears from the list; they lose access immediately.

### Variations
- Member viewing the page: no Remove buttons at all.

### Edge Cases
- Removing an owner as an admin: silently refused (button not shown to admins for owners).
- Removing yourself: no Remove button on your own row.

## STORY-044: Invited person opens the link from the wrong account

**Type**: short
**Topic**: membership-management
**Persona**: Dana, signed in as her personal account, invite sent to work email.
**Goal**: Join the org.
**Preconditions**: invite for dana@work.com; signed in as dana@home.com.
**Ideal path**: 2 — accept page explains the mismatch clearly.
**Alternate paths**: sign out and use the link again as the right user.

### Steps
1. Open the invite link while signed in as the wrong user -> error: invitation was sent to a different email address, with guidance.

### Variations
- Logged out entirely: signup form shown, email locked to the invited address.

### Edge Cases
- None.
