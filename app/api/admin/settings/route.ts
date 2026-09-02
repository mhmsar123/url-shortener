import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { invalidateSettingsCache } from "@/lib/settings";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "rate_limit_create",
  "rate_limit_lookup",
  "rate_limit_auth",
  "rate_limit_report",
  "rate_limit_global",
  "window_seconds",
];

export async function GET() {
  try {
    const session = await getSession();
    requireAdmin(session);

    const settings = await prisma.adminSetting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return jsonOk({ settings: map });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    requireAdmin(session);
    await assertCsrf(req);

    const body = (await req.json()) as Record<string, unknown>;

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0 || num > 100000) {
        return jsonError(`قيمة غير صالحة للمفتاح ${key}`, 422);
      }
      await prisma.adminSetting.upsert({
        where: { key },
        update: { value: String(num) },
        create: { key, value: String(num) },
      });
    }

    invalidateSettingsCache();
    return jsonOk({ updated: true });
  } catch (e) {
    return handleApiError(e);
  }
}
