/**
 * Fixed-window in-memory rate limiter for auth-sensitive endpoints.
 *
 * Good enough for a single-server deployment (the stated target). If you
 * scale to multiple instances, swap the store for Redis (e.g. a small
 * INCR/EXPIRE helper) — the call sites stay identical.
 *
 * Note: in-memory limits are per process and reset on deploy. They are a
 * brake, not a fortress; the real protection against credential stuffing is
 * strong password hashing + the option to add CAPTCHA later.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Periodically evict expired buckets so the map cannot grow unbounded.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

/** Extract a best-effort client IP from proxy headers (set by Caddy/nginx). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
