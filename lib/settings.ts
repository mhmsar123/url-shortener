import { prisma } from "./prisma";

const TTL = 60_000; // 60 ثانية
const cache = new Map<string, { value: string; exp: number }>();

/** قراءة إعدادات الأدمن مع تخزين مؤقت قصير لتقليل ضغط قاعدة البيانات. */
export async function getSetting(key: string, fallback: string): Promise<string> {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  try {
    const row = await prisma.adminSetting.findUnique({ where: { key } });
    const value = row?.value ?? fallback;
    cache.set(key, { value, exp: Date.now() + TTL });
    return value;
  } catch {
    return fallback;
  }
}

export async function getRateLimitSettings() {
  const windowSeconds = Number(await getSetting("window_seconds", "60")) || 60;
  return {
    windowMs: windowSeconds * 1000,
    create: Number(await getSetting("rate_limit_create", "10")) || 10,
    lookup: Number(await getSetting("rate_limit_lookup", "120")) || 120,
    auth: Number(await getSetting("rate_limit_auth", "5")) || 5,
    report: Number(await getSetting("rate_limit_report", "5")) || 5,
    global: Number(await getSetting("rate_limit_global", "600")) || 600,
  };
}

export function invalidateSettingsCache() {
  cache.clear();
}
