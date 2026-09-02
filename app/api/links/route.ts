import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRateLimitSettings } from "@/lib/settings";
import { createLinkSchema, isSafeUrl, isSameHost } from "@/lib/validation";
import { generateShortCode } from "@/lib/shortcode";
import { getBaseUrl, buildShortUrl } from "@/lib/base-url";
import { EXTRA_RESERVED } from "@/lib/constants";
import { verifyTurnstile } from "@/lib/turnstile";
import { containsFilter, isCodeTakenCaseInsensitive } from "@/lib/db";

export const dynamic = "force-dynamic";

const ANON_COOKIE = "qs_anon";

function normalizeAlias(alias: string | undefined): string | null {
  const a = (alias || "").trim().toLowerCase();
  if (!a) return null;
  return a;
}

async function isAliasTaken(alias: string): Promise<boolean> {
  return isCodeTakenCaseInsensitive(alias);
}

async function isReservedAlias(alias: string): Promise<boolean> {
  if (EXTRA_RESERVED.includes(alias)) return true;
  const row = await prisma.reservedAlias.findUnique({ where: { alias } });
  return Boolean(row);
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limits = await getRateLimitSettings();

    const global = rateLimit(`global:${ip}`, limits.global, limits.windowMs);
    if (!global.ok) {
      return jsonError("عدد الطلبات كبير جدًا، حاول لاحقًا.", 429, { retryAfter: global.retryAfterSeconds });
    }
    const rl = rateLimit(`create:${ip}`, limits.create, limits.windowMs);
    if (!rl.ok) {
      return jsonError("لقد أنشأت عددًا كبيرًا من الروابط، حاول بعد قليل.", 429, { retryAfter: rl.retryAfterSeconds });
    }

    await assertCsrf(req);

    const body = createLinkSchema.parse(await req.json());
    const session = await getSession();

    if (!isSafeUrl(body.originalUrl)) {
      return jsonError("الرابط غير صالح أو غير آمن. يجب أن يكون رابطًا http/https حقيقيًا.", 422);
    }

    const base = getBaseUrl(req);
    if (isSameHost(body.originalUrl, base)) {
      return jsonError("لا يمكن اختصار رابط من هذا الموقع نفسه.", 422);
    }

    const alias = normalizeAlias(body.alias);
    if (alias && (await isReservedAlias(alias))) {
      return jsonError("هذا الاسم مستخدم بالفعل، اختر اسمًا آخر.", 409);
    }
    if (alias && (await isAliasTaken(alias))) {
      return jsonError("هذا الاسم مستخدم بالفعل، اختر اسمًا آخر.", 409);
    }

    // CAPTCHA اختياري (Turnstile) إن كان مفعلًا
    const captchaOk = await verifyTurnstile(req.headers.get("x-turnstile") || null);
    if (!captchaOk) {
      return jsonError("التحقق الأمني فشل، حاول مجددًا.", 400);
    }

    let shortCode = "";
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = generateShortCode(6);
      if ((await isCodeTakenCaseInsensitive(candidate)) || candidate.toLowerCase() === (alias ?? "").toLowerCase()) {
        continue;
      }
      shortCode = candidate;
      break;
    }
    if (!shortCode) {
      return jsonError("تعذّر توليد رمز فريد، حاول مجددًا.", 500);
    }

    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      const d = new Date(body.expiresAt);
      if (!Number.isNaN(d.getTime())) {
        if (d.getTime() <= Date.now()) {
          return jsonError("تاريخ الانتهاء يجب أن يكون في المستقبل.", 422);
        }
        expiresAt = d;
      }
    }

    let userId: string | null = null;
    let anonId: string | null = null;
    const reqCookies = req.headers.get("cookie");
    const cookieMatch = reqCookies?.match(/(?:^|;\s*)qs_anon=([^;]+)/);

    if (session) {
      userId = session.id;
    } else if (cookieMatch) {
      anonId = decodeURIComponent(cookieMatch[1]);
    } else {
      anonId = randomUUID();
    }

    const link = await prisma.link.create({
      data: {
        originalUrl: body.originalUrl,
        shortCode,
        customAlias: alias,
        title: body.title || null,
        expiresAt,
        userId,
        anonId,
      },
    });

    const code = alias ?? shortCode;
    const shortUrl = buildShortUrl(base, code);

    const res = jsonOk({
      id: link.id,
      shortUrl,
      code,
      originalUrl: link.originalUrl,
      expiresAt: link.expiresAt,
    });

    // كوكيز للمستخدم المجهول حتى نربط روابطه بالجلسة (بدون الاعتماد عليه كأمان)
    if (!session && !cookieMatch) {
      res.cookies.set(ANON_COOKIE, anonId!, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        sameSite: "lax",
      });
    }

    return res;
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("يجب تسجيل الدخول", 401);

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();

    const where: Record<string, unknown> = {
      userId: session.id,
    };
    if (search) {
      where.OR = [
        { originalUrl: containsFilter(search) },
        { shortCode: containsFilter(search) },
        { customAlias: containsFilter(search) },
      ];
    }

    const links = await prisma.link.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        customAlias: true,
        title: true,
        createdAt: true,
        expiresAt: true,
        clickCount: true,
        isActive: true,
      },
    });

    const base = getBaseUrl(req);
    const items = links.map((l) => ({
      ...l,
      code: l.customAlias ?? l.shortCode,
      shortUrl: buildShortUrl(base, l.customAlias ?? l.shortCode),
    }));

    return jsonOk({ links: items });
  } catch (e) {
    return handleApiError(e);
  }
}
