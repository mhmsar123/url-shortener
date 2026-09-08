import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const SESSION_COOKIE = "qs_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 يوم

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is missing. Set a long random value in production.");
    }
    return new TextEncoder().encode("dev-only-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.id || !payload.email || !payload.role) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

/** يقرأ الجلسة من كوكيز (يُستخدم في Server Components و API). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function createSession(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** نسخة للميدل وير (Edge Runtime). */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** يتأكد أن المستخدم مسجل وإلا يرمي خطأ 401. */
export function requireUser(session: SessionUser | null): SessionUser {
  if (!session) {
    const err = new Error("يجب تسجيل الدخول") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return session;
}

/** يتأكد أن المستخدم أدمن وإلا يرمي خطأ 403. */
export function requireAdmin(session: SessionUser | null): SessionUser {
  const user = requireUser(session);
  if (user.role !== "ADMIN") {
    const err = new Error("غير مصرح") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return user;
}

/** جلب مستخدم كامل من قاعدة البيانات مع صلاحيات حديثة. */
export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
