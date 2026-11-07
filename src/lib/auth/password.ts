import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with Node's built-in scrypt — no native dependencies
 * (no bcrypt/argon2 compilation), yet cryptographically sound.
 *
 * Stored format:  scrypt$N$r$p$<salt-hex>$<hash-hex>
 * The algorithm/parameters are embedded in the string so they can be
 * strengthened later without invalidating existing hashes (rehash-on-login
 * support is trivial to add: parse params, compare, if weaker than current
 * policy re-hash and update).
 */

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// OWASP-recommended scrypt parameters (2024): N=2^17, r=8, p=1 (~64 MiB).
const PARAMS = { N: 1 << 17, r: 8, p: 1 } as const;
const KEY_LENGTH = 32;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    ...PARAMS,
    maxmem: 256 * 1024 * 1024,
  });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("hex"),
    hash.toString("hex"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const N = parseInt(nStr, 10);
  const r = parseInt(rStr, 10);
  const p = parseInt(pStr, 10);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = await scrypt(
      password.normalize("NFKC"),
      Buffer.from(saltHex, "hex"),
      expected.length,
      { N, r, p, maxmem: 256 * 1024 * 1024 },
    );
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Minimum policy enforced at signup and password change. */
export function passwordPolicyError(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (password.length > 200) return "Password must be at most 200 characters.";
  return null;
}
