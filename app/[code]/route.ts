import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupLinkByCode } from "@/lib/cache";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRateLimitSettings } from "@/lib/settings";
import { parseDevice } from "@/lib/device";
import { resolveCountry } from "@/lib/geo";
import { isValidShortCode } from "@/lib/shortcode";

export const dynamic = "force-dynamic";

// ===== صفحة رسالة بسيطة (مفقود / منتهي / معطل) =====
function messagePage(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} | قَصَّار</title>
<meta name="robots" content="noindex, nofollow" />
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;text-align:center;padding:24px}
  .card{max-width:420px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:40px 28px;box-shadow:0 10px 40px rgba(15,23,42,.06)}
  .icon{width:56px;height:56px;margin:0 auto 20px;border-radius:16px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-size:28px}
  h1{font-size:22px;margin:0 0 8px;color:#0f172a}
  p{margin:0 0 24px;color:#64748b;line-height:1.8}
  a{display:inline-block;padding:12px 24px;border-radius:12px;background:#6366f1;color:#fff;text-decoration:none;font-weight:600}
  a:hover{background:#4f46e5}
</style>
</head>
<body>
  <div class="card">
    <div class="icon">${status === 404 ? "🔍" : "⏰"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">الصفحة الرئيسية</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

async function recordClick(
  linkId: string,
  userAgent: string | null,
  referrer: string | null,
  ip: string
) {
  const device = parseDevice(userAgent);
  const click = await prisma.click.create({
    data: {
      linkId,
      userAgent,
      referrer,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
    },
    select: { id: true },
  });
  await prisma.link.update({
    where: { id: linkId },
    data: { clickCount: { increment: 1 } },
  });
  // تحديد الدولة بشكل تقريبي — غير مُعطِّل للتحويل
  resolveCountry(ip).then((country) => {
    if (country) {
      prisma.click
        .update({ where: { id: click.id }, data: { country } })
        .catch(() => undefined);
    }
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!isValidShortCode(code)) {
    return messagePage("الرابط غير موجود", "عذرًا، هذا الرابط غير موجود أو غير صالح.", 404);
  }

  const ip = getClientIp(req);
  const limits = await getRateLimitSettings();
  const rl = rateLimit(`lookup:${ip}`, limits.lookup, limits.windowMs);
  if (!rl.ok) {
    return messagePage("طلبات كثيرة", "أنت ترسل طلبات كثيرة، حاول بعد قليل.", 429);
  }

  const link = await lookupLinkByCode(code);

  if (!link) {
    return messagePage("الرابط غير موجود", "عذرًا، هذا الرابط غير موجود أو تم حذفه.", 404);
  }

  if (!link.isActive) {
    return messagePage("هذا الرابط معطّل", "تم تعطيل هذا الرابط بواسطة الإدارة.", 410);
  }

  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
    return messagePage("هذا الرابط منتهي الصلاحية", "انتهت صلاحية هذا الرابط ولم يعد متاحًا.", 410);
  }

  const userAgent = req.headers.get("user-agent");
  const referrer = req.headers.get("referer");

  // تسجيل الزيارة بشكل غير متزامن حتى لا يتباطأ التحويل
  void recordClick(link.id, userAgent, referrer, ip).catch(() => undefined);

  return NextResponse.redirect(link.originalUrl, { status: 302 });
}
