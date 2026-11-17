import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/session-token";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Optimistic auth check for admin pages: bounce unauthenticated visitors to
 * the login page before rendering. The authoritative check (signature + DB
 * session version) still runs in the admin layout and in every admin API route.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The login page does its own DB-backed check (a signed but revoked cookie
  // must not bounce between login and dashboard).
  if (pathname === "/admin/login") return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = new URL("/admin/login", req.url);
    if (pathname !== "/admin" && pathname !== "/admin/dashboard") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
