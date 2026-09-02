import { getClientIp } from "./ip";

export type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds?: number;
};

const buckets = new Map<string, number[]>();

function sweep(windowMs: number) {
  const now = Date.now();
  for (const [key, arr] of buckets) {
    const filtered = arr.filter((t) => now - t < windowMs);
    if (filtered.length === 0) buckets.delete(key);
    else buckets.set(key, filtered);
  }
}

/**
 * Rate Limiting بسيط داخل الذاكرة (نافذة زمنية منزلقة).
 * ملاحظة: على المنصات Serverless يكون لكل نسخة ذاكرة مستقلة،
 * وهو كافٍ لمنع إساءة الاستخدام الأساسية، ويمكن استبداله بـ Redis لاحقًا.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  if (limit <= 0) return { ok: true };
  const now = Date.now();
  sweep(windowMs);

  let hits = buckets.get(key) ?? [];
  hits = hits.filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const oldest = hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, hits);
    return { ok: false, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true };
}

export { getClientIp };
