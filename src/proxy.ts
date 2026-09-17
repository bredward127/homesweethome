import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Edge proxy (formerly the `middleware` convention).
 *
 * Two jobs:
 *  1. Refresh the Supabase auth cookie on every request so sessions stay
 *     valid and expire predictably.
 *  2. Turn away unauthenticated requests to /app/* before they reach a
 *     server component.
 *
 * This is a first line of defence and a redirect convenience — NOT the
 * authorization boundary. Every protected page and server action re-checks
 * the session with `requireUser()`/`requirePermission()`, and Row Level
 * Security enforces record access in the database regardless of what the
 * middleware concluded.
 */

/** Routes that require a signed-in staff member. */
const PROTECTED_PREFIXES = ["/app"];

/** Auth screens a signed-in user should be bounced away from. */
const AUTH_ROUTES = ["/login", "/forgot-password"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Internal surfaces must never be indexed or cached by a shared cache.
  if (isProtected(pathname) || pathname === "/forbidden") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase configured there is no session to refresh. Protected
  // routes still fail closed: the server component redirects to /login.
  if (!supabaseUrl || !supabaseAnonKey) {
    return applySecurityHeaders(response, pathname);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Revalidates the token against Supabase rather than trusting the cookie.
  // Also refreshes it, which is what keeps sessions alive across navigations.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return applySecurityHeaders(NextResponse.redirect(loginUrl), pathname);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/app/dashboard";
    appUrl.search = "";
    return applySecurityHeaders(NextResponse.redirect(appUrl), pathname);
  }

  return applySecurityHeaders(response, pathname);
}

export const config = {
  matcher: [
    /*
     * Run on every path except Next.js internals and static assets, so the
     * auth cookie is refreshed on ordinary navigations too.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2)$).*)",
  ],
};
