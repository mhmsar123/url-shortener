import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "qs_session";
const CSRF_COOKIE = "qs_csrf";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is missing. Set a long random value in production.");
    }
    return new TextEncoder().encode("dev-only-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

type SessionPayload = { id?: string; email?: string; role?: string };

async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // ===== كوكيز CSRF =====
  if (!req.cookies.get(CSRF_COOKIE)) {
    const token =
      typeof crypto !== "undefined" && "getRandomValues" in crypto
        ? (() => {
            const buf = new Uint8Array(24);
            crypto.getRandomValues(buf);
            return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
          })()
        : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    res.cookies.set(CSRF_COOKIE, token, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const user = await getSession(req);

  // ===== مسارات محمية (تتطلب تسجيل دخول) =====
  const protectedPrefixes = ["/dashboard", "/create", "/settings", "/analytics"];
  const needsAuth = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (needsAuth && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ===== لوحة الأدمن (تتطلب دور ADMIN) =====
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "ADMIN") {
      const home = req.nextUrl.clone();
      home.pathname = "/";
      return NextResponse.redirect(home);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.svg|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
