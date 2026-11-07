# Multi-tenancy

## Model

**Shared database, shared schema, discriminator column.** Every tenant-owned
row has an `organizationId` column referencing `organizations`. Users are
global; they participate in organizations through `memberships` with a role
(`owner` > `admin` > `member`).

This model was chosen because it is the simplest one that is safe when the
rules below are followed, and it scales to very large tenant counts. (Row
Level Security is a possible hardening layer — see the end of this doc.)

```
users ──< memberships >── organizations ──< projects (any tenant resource)
                │
                └─ role: owner | admin | member
```

## The rules (non-negotiable)

1. **The org id never comes from the client.** It comes from
   `requireOrg()` / `requireOrgApi()`, which read the `active_org` cookie and
   re-verify it against the `memberships` table on every request.
2. **Every query touching a tenant-owned table includes the scope.**
   ```ts
   // ✅ correct
   await db.select().from(projects).where(eq(projects.organizationId, org.id));
   // ❌ never
   await db.select().from(projects).where(eq(projects.id, someIdFromInput));
   ```
   For point lookups, filter by **both** id and organizationId:
   ```ts
   await db.delete(projects).where(and(eq(projects.id, id), eq(projects.organizationId, org.id)));
   ```
3. **Role checks go through the helpers.** `requireRole("admin")` for
   management pages/actions, `requireRole("owner")` for role changes.
   Never hand-roll `role === "admin"` checks in new code paths.
4. **Every tenant mutation writes an audit entry** via `src/lib/audit.ts`.

## Adding a new tenant-scoped resource (recipe)

Using a `documents` table as an example:

1. **Schema** (`src/lib/db/schema.ts`) — copy the `projects` pattern:
   ```ts
   export const documents = pgTable("documents", {
     id: uuid("id").defaultRandom().primaryKey(),
     organizationId: uuid("organization_id")
       .notNull()
       .references(() => organizations.id, { onDelete: "cascade" }),
     name: text("name").notNull(),
     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
   }, (t) => [index("documents_org_idx").on(t.organizationId)]);
   ```
   Always index `organizationId` — every query starts from it.
2. **Migration**: `npm run db:generate`, commit the SQL, `npm run db:migrate`.
3. **Validation**: add a zod schema in `src/lib/validation.ts`.
4. **Actions**: server action in `src/app/(app)/actions.ts` (or a colocated
   file): `const { user, org } = await requireOrg();` → insert with
   `organizationId: org.id` → `audit(...)` → `revalidatePath(...)`.
5. **Page**: under `src/app/(app)/`, call `requireOrg()`, query scoped,
   render. Reuse the `forms.tsx` client-form pattern for the UI.
6. **API** (optional): follow `src/app/api/v1/projects/route.ts`.

## Roles — what each can do (as shipped)

| Action                    | member | admin | owner |
|---------------------------|:------:|:-----:|:-----:|
| View org data             | ✅     | ✅    | ✅    |
| Create tenant resources   | ✅     | ✅    | ✅    |
| Delete tenant resources   | ❌     | ✅    | ✅    |
| Rename org                | ❌     | ✅    | ✅    |
| Invite members            | ❌     | ✅    | ✅    |
| Invite admins             | ❌     | ❌    | ✅    |
| Remove members            | ❌     | ✅    | ✅    |
| Remove owners / change roles | ❌  | ❌    | ✅    |

Invariants enforced in code: the **last owner cannot be demoted or removed**;
admins cannot touch owners; only owners can create admins.

## Org switching

The active org lives in an httpOnly cookie set only by `switchOrgAction` /
`createOrgAction`, which verify membership first. A user with multiple orgs
sees a switcher in the app header. Every request re-validates, so stale
cookies are harmless.

## Invitations

Invitations are per-org, per-email, role-bearing, 7-day, single-use, hashed
tokens. Accepting requires being signed in **as the invited email** (or
signing up with it). Invited-by-signup users skip personal-org creation and
are marked email-verified (the invite email proved mailbox ownership).

## Optional hardening: PostgreSQL Row Level Security

If you want the database itself to enforce isolation (defense in depth),
enable RLS per tenant table with a session variable:

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON projects
  USING (organization_id = current_setting('app.current_org')::uuid);
```

Then set `app.current_org` per connection/transaction from the app
(`SET LOCAL app.current_org = $1` inside a transaction scoped to the
verified org). This protects against a *forgotten WHERE clause* but adds
connection-management complexity. The starter ships without it on purpose;
add it when the codebase grows beyond a few contributors.
