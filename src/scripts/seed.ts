import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashPassword } from "../lib/auth/password";
import { organizations, memberships, users } from "../lib/db/schema";

/**
 * Seeds an initial admin user + organization so a fresh deployment is
 * usable immediately:  npm run db:seed
 *
 * Reads credentials from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars
 * (falls back to admin@example.com / change-me-please-123). CHANGE THE
 * PASSWORD AFTER FIRST LOGIN on any real deployment.
 */

config({ path: ".env", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me-please-123";
const orgName = process.env.SEED_ORG_NAME ?? "Acme Inc.";

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function main() {
  try {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`User ${email} already exists — nothing to do.`);
  } else {
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, name: "Admin", passwordHash, emailVerifiedAt: new Date() })
      .returning();
    const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Date.now().toString(36)}`;
    const [org] = await db.insert(organizations).values({ name: orgName, slug }).returning();
    await db.insert(memberships).values({ organizationId: org.id, userId: user.id, role: "owner" });
    console.log(`✅ Seeded admin ${email} as owner of ${org.name}`);
    console.log("   ⚠️  Change this password after first login.");
  }
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
