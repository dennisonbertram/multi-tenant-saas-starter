import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";

/**
 * Single-use, hashed, expiring tokens for email verification, password
 * reset and invitations.
 *
 * Design rules (do not break them when extending):
 * - The raw token is shown to the user exactly once (in a link) and stored
 *   ONLY as a SHA-256 hash in the database.
 * - Tokens are single-use: claiming sets `usedAt`; verification rejects
 *   tokens that are already used, expired or revoked.
 * - Consumers must delete/invalidate all of a user's outstanding tokens of
 *   the same type when issuing a new one.
 */

export type TokenType = "email_verify" | "password_reset" | "invite";

const TTL_MS: Record<TokenType, number> = {
  email_verify: 24 * 60 * 60 * 1000, // 24h
  password_reset: 60 * 60 * 1000, // 1h
  invite: 7 * 24 * 60 * 60 * 1000, // 7d
};

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Persist a new token and return the raw value to embed in a link. */
export async function createAuthToken(
  userId: string,
  type: TokenType,
): Promise<string> {
  const raw = generateToken();
  await db.insert(authTokens).values({
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + TTL_MS[type]),
  });
  return raw;
}

/**
 * Atomically claim a token: returns the row's userId if the token is valid
 * (exists, correct type, unused, unexpired), marks it used, otherwise null.
 * The conditional UPDATE makes concurrent reuse impossible.
 */
export async function claimAuthToken(
  raw: string,
  type: TokenType,
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(raw);
  const rows = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: authTokens.userId });
  return rows[0] ?? null;
}

/** Invalidate all outstanding tokens of a type for a user (e.g. on reset). */
export async function revokeAuthTokens(userId: string, type: TokenType) {
  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type)));
}

/** Constant-time string comparison helper for anything secret-ish. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
