import { prisma } from "@/lib/prisma";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRateLimitSettings } from "@/lib/settings";
import { reportSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const REASONS = ["scam", "malware", "illegal", "spam", "other"];

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limits = await getRateLimitSettings();

    const rl = rateLimit(`report:${ip}`, limits.report, limits.windowMs);
    if (!rl.ok) {
      return jsonError("لقد أرسلت عددًا كبيرًا من البلاغات، حاول لاحقًا.", 429, { retryAfter: rl.retryAfterSeconds });
    }

    await assertCsrf(req);

    const body = reportSchema.parse(await req.json());

    if (!REASONS.includes(body.reason)) {
      return jsonError("سبب غير صالح", 422);
    }

    const link = await prisma.link.findFirst({
      where: { OR: [{ shortCode: body.code }, { customAlias: body.code }] },
      select: { id: true },
    });
    if (!link) return jsonError("الرابط غير موجود", 404);

    const report = await prisma.report.create({
      data: {
        linkId: link.id,
        reason: body.reason,
        details: body.details?.trim() || null,
      },
    });

    return jsonOk({ reportId: report.id });
  } catch (e) {
    return handleApiError(e);
  }
}
