import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Database schema — the multi-tenant data model.
 *
 * Tenancy model: shared database, shared schema, every tenant-owned row
 * carries an `organizationId` column ("discriminator column"). Isolation is
 * enforced in the data-access layer: every query touching tenant data must
 * go through a helper that injects the caller's verified organizationId.
 * See docs/MULTI-TENANCY.md for the rules and how to add new tenant tables.
 *
 * Security notes:
 * - We never store raw session/verification/reset tokens — only their
 *   SHA-256 hashes. A database leak therefore cannot be replayed as a
 *   valid session or used to take over an account.
 * - Passwords are scrypt hashes (see src/lib/auth/password.ts).
 */

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);

// ── Users & sessions ────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    /** scrypt hash — format: scrypt$N$r$p$salt$hash (see auth/password.ts) */
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    /** Set while an email change is awaiting verification of the new address. */
    pendingEmail: text("pending_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 of the random session token; the raw token lives only in the cookie */
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_id_idx").on(t.userId),
  ],
);

/**
 * Single-use tokens for email verification and password reset.
 * `type` discriminates the two flows; both hash the token before storing.
 */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    type: text("type").notNull(), // "email_verify" | "password_reset"
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("auth_tokens_token_hash_unique").on(t.tokenHash),
    index("auth_tokens_user_id_type_idx").on(t.userId, t.type),
  ],
);

// ── Tenancy: organizations & membership ─────────────────────────────────────

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    /** URL-safe identifier used in paths, e.g. /settings under the active org */
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("organizations_slug_unique").on(t.slug)],
);

/** Join table: a user can belong to many organizations with different roles. */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_org_user_unique").on(t.organizationId, t.userId),
    index("memberships_user_id_idx").on(t.userId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRoleEnum("role").notNull().default("member"),
    tokenHash: text("token_hash").notNull(),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invitations_token_hash_unique").on(t.tokenHash),
    index("invitations_org_email_idx").on(t.organizationId, t.email),
  ],
);

// ── Audit log ───────────────────────────────────────────────────────────────

/**
 * Append-only trail of security-relevant events, scoped to an org where one
 * applies. Keep writes cheap and never trust it for authorization — it is
 * for forensics, not enforcement.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id"),
    userId: uuid("user_id"),
    action: text("action").notNull(), // e.g. "user.login", "member.removed"
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_org_created_idx").on(t.organizationId, t.createdAt)],
);

// ── Example tenant-scoped resource ──────────────────────────────────────────
//
// Delete this table once you add your own domain entities — it exists to
// demonstrate the tenant-scoping pattern end to end (schema → query → UI → API).

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_org_idx").on(t.organizationId)],
);

// ── Inferred types ──────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];
