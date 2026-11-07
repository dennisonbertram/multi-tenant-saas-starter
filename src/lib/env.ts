import { z } from "zod";

/**
 * Fail-fast environment validation.
 *
 * Every process that starts (next build, next start, migrate, seed) parses
 * this once. If a required variable is missing or malformed the process
 * exits immediately with a readable error instead of failing later at
 * runtime in a harder-to-debug way.
 */

// During `next build` there is no database yet — allow a placeholder so the
// build can complete. Every other phase (dev, start, migrate, seed) requires
// the real value.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const schema = z.object({
  DATABASE_URL: isBuildPhase
    ? z.string().optional().default("postgresql://build-time-placeholder")
    : z
        .string()
        .min(1, "DATABASE_URL is required")
        .refine(
          (v) => v.startsWith("postgresql://") || v.startsWith("postgres://"),
          "DATABASE_URL must be a postgresql:// connection string",
        ),
  APP_URL: z
    .string()
    .url("APP_URL must be an absolute URL, e.g. https://app.example.com")
    .default("http://localhost:3000"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  EMAIL_FROM: z.string().min(1).default("SaaS Starter <no-reply@example.com>"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\nCopy .env.example to .env and fill in the values.");
  process.exit(1);
}

export const env = parsed.data;

/**
 * True when SMTP is not configured — emails are logged to console instead.
 * Deliberately environment-independent: a bare-bones production deploy
 * without SMTP must still work (signup sends a verification email); it
 * logs the link instead of crashing.
 */
export const emailDevMode = !env.SMTP_HOST;
