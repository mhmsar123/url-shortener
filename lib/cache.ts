import { prisma } from "./prisma";

const CACHE_TTL = 30_000; // 30 ثانية
const cache = new Map<string, { link: unknown; exp: number }>();

type CachedLink = {
  id: string;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  expiresAt: Date | null;
  isActive: boolean;
};

/**
 * بحث سريع عن الرابط مع تخزين مؤقت قصير لتسريع التحويل.
 * على المنصات Serverless يكون التخزين لكل نسخة، ويكفي كتسريع أولي.
 */
export async function lookupLinkByCode(code: string): Promise<CachedLink | null> {
  const hit = cache.get(code);
  if (hit && hit.exp > Date.now()) return hit.link as CachedLink | null;

  try {
    const row = await prisma.link.findFirst({
      where: { OR: [{ shortCode: code }, { customAlias: code }] },
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        customAlias: true,
        expiresAt: true,
        isActive: true,
      },
    });
    if (row) {
      cache.set(code, { link: row, exp: Date.now() + CACHE_TTL });
    }
    return row;
  } catch {
    return null;
  }
}

export function invalidateLinkCache(code: string) {
  cache.delete(code);
}

export function invalidateAllLinkCache() {
  cache.clear();
}
