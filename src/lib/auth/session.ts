import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { SESSION_COOKIE } from "./cookies";

/**
 * DB-backed session cookies.
 *
 * - Token: 32 random bytes (base64url) — high entropy, unguessable.
 * - Storage: only the SHA-256 hash is stored; a stolen database cannot be
 *   replayed as sessions.
 * - Cookie: HttpOnly (no JS access), Secure in production, SameSite=Lax
 *   (blocks cross-site POST CSRF), Path=/, 30-day expiry.
 * - Rotation: a fresh session row is created on every login; old ones are
 *   deleted, so reused/leaked pre-login cookies die immediately.
 */

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: Date | null;
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Create a session row + set the cookie. Call after credential checks pass. */
export async function createSession(
  userId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<void> {
  const raw = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/** Delete the current session row and clear the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Resolve the current user from the session cookie.
 * Returns null when there is no valid, unexpired session.
 * Cheap enough to call at the top of every page/action.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(raw)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

/** Delete every session for a user — used after password reset / email change. */
export async function destroyAllSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
