import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

/**
 * Edge middleware: security headers + cheap auth redirects.
 *
 * IMPORTANT: the session cookie's *presence* is checked here, not its
 * validity (the edge runtime cannot query the database). Actual
 * authorization always happens server-side in layouts/pages/actions via
 * requireOrg().
 *
 * Deliberately does NOT redirect signed-in-looking users away from auth
 * pages: a stale/invalid cookie (e.g. left over from another app on the
 * same host) would cause an infinite login<->dashboard redirect loop.
 * Auth pages that need it do a REAL session check server-side instead
 * (see login/signup pages calling getCurrentUser()).
 */

const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/members", "/projects"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  let res: NextResponse;

  if (!hasSessionCookie && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", req.url);
    if (pathname !== "/dashboard") url.searchParams.set("next", pathname);
    res = NextResponse.redirect(url);
  } else {
    res = NextResponse.next();
  }

  // Defense-in-depth headers (also set statically in next.config for pages
  // the middleware doesn't cover; these apply to everything).
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return res;
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
