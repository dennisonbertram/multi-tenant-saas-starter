# Topic: signup-onboarding

## STORY-001: Maria signs up and creates her company's workspace

**Type**: long
**Topic**: signup-onboarding
**Persona**: Maria, a founder evaluating the starter for her 5-person team.
**Goal**: Create an account and have a working organization to build in.
**Preconditions**: Fresh database; Maria has no account.
**Ideal path**: 5 — fill one signup form (4 fields), land on dashboard already signed in; verification handled asynchronously via banner.
**Alternate paths**: Signup via invitation link (`/accept-invite?token=`) creates the account without a personal org; none found otherwise.

### Steps
1. Open `/` -> landing page shows "Create an account" and "Sign in" buttons.
2. Click "Create an account" -> signup form with name, work email, password, organization name.
3. Fill all four fields (Maria types "Acme Inc." as org) -> submit button enabled.
4. Submit -> redirected to `/dashboard?welcome=1`, already signed in, welcome card names her and "Acme Inc.".
5. Read the unverified-email banner at the top -> notes the "resend the verification email" link.

### Variations
- Signing up from an invitation link instead: no organization-name field; lands in the inviter's org.
- Weak password (9 chars): inline field error before submit.

### Edge Cases
- Email already registered: inline "An account with this email already exists." on the email field.
- Duplicate organization name: allowed; slug gets a random suffix.
- Double-click submit: only one account/org created.

## STORY-002: Maria explores the dashboard right after signup

**Type**: short
**Topic**: signup-onboarding
**Persona**: Maria, just signed up.
**Goal**: Understand where she is and what to do first.
**Preconditions**: STORY-001 completed.
**Ideal path**: 1 — dashboard already shows org name, her role, and next-step hints.
**Alternate paths**: none found.

### Steps
1. Land on `/dashboard?welcome=1` -> welcome card, org name in header, "your role here: owner", empty "Recent projects" with a link to create one.

### Variations
- Returning later (welcome param absent): plain dashboard.

### Edge Cases
- Banner for unverified email overlaps the welcome card content on small screens.

## STORY-003: Founder signs up with a weak password

**Type**: short
**Topic**: signup-onboarding
**Persona**: hasty user.
**Goal**: Sign up quickly.
**Preconditions**: none.
**Ideal path**: 2 — type short password, see inline minimum-length error, fix it, continue.
**Alternate paths**: none found.

### Steps
1. Fill signup with a 8-character password -> submit.
2. See "Password must be at least 10 characters" under the password field -> no account created.

### Variations
- Empty org name: inline error on that field.

### Edge Cases
- All fields empty: multiple field errors shown at once.

## STORY-004: Maria tries to sign up twice with the same email

**Type**: short
**Topic**: signup-onboarding
**Persona**: Maria, forgot she already signed up.
**Goal**: Create an account.
**Preconditions**: Account exists for her email.
**Ideal path**: 2 — submit, see "already exists" error with a sign-in pointer.
**Alternate paths**: none found.

### Steps
1. Submit signup with existing email -> inline email error "An account with this email already exists."
2. Click through to `/login` (link exists on the page footer) -> sign in instead.

### Variations
- none.

### Edge Cases
- Error does not reveal whether other accounts exist (only her exact email).

## STORY-005: New user orients using the header navigation

**Type**: short
**Topic**: signup-onboarding
**Persona**: any new user.
**Goal**: Find the main areas of the app.
**Preconditions**: signed in.
**Ideal path**: 1 — four labeled nav links visible in the header.
**Alternate paths**: none found.

### Steps
1. Look at the header -> Dashboard, Projects, Members, Settings links; org name; Sign out.

### Variations
- Second org joined: a select + Switch button appears instead of the plain org name.

### Edge Cases
- None.
