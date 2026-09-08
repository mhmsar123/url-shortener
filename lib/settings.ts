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
  const [windowSecondsRaw, create, lookup, auth, report, global] = await Promise.all([
    getSetting("window_seconds", "60"),
    getSetting("rate_limit_create", "10"),
    getSetting("rate_limit_lookup", "120"),
    getSetting("rate_limit_auth", "5"),
    getSetting("rate_limit_report", "5"),
    getSetting("rate_limit_global", "600"),
  ]);
  const windowSeconds = Number(windowSecondsRaw) || 60;
  return {
    windowMs: windowSeconds * 1000,
    create: Number(create) || 10,
    lookup: Number(lookup) || 120,
    auth: Number(auth) || 5,
    report: Number(report) || 5,
    global: Number(global) || 600,
  };
}

export function invalidateSettingsCache() {
  cache.clear();
}
