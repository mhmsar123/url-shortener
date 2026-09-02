import { prisma } from "@/lib/prisma";
import { getSession, requireUser } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { getBaseUrl, buildShortUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const user = requireUser(session);
    const { id } = await params;

    const link = await prisma.link.findFirst({
      where: { id },
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
        userId: true,
      },
    });
    if (!link) return jsonError("الرابط غير موجود", 404);
    if (link.userId !== user.id && user.role !== "ADMIN") {
      return jsonError("غير مصرح", 403);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

    // ===== الزيارات اليومية (آخر 30 يومًا) — تجميع في الذاكرة ليكون متوافقًا مع كل قواعد البيانات
    const recentClicks = await prisma.click.findMany({
      where: { linkId: id, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const dayMap = new Map<string, number>();
    for (const c of recentClicks) {
      const key = c.createdAt.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const byDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      byDay.push({ date: key, count: dayMap.get(key) ?? 0 });
    }

    // ===== توزيعات عامة
    async function breakdown(field: "deviceType" | "browser" | "os" | "referrer" | "country") {
      const rows = await prisma.click.groupBy({
        by: [field],
        where: { linkId: id },
        _count: { _all: true },
        orderBy: { _count: { [field]: "desc" } },
        take: 10,
      });
      return rows
        .filter((r) => r[field] !== null)
        .map((r) => ({ label: r[field] as string, count: r._count._all }));
    }

    const [byDevice, byBrowser, byOs, byReferrer, byCountry] = await Promise.all([
      breakdown("deviceType"),
      breakdown("browser"),
      breakdown("os"),
      breakdown("referrer"),
      breakdown("country"),
    ]);

    const firstLast = await prisma.click.aggregate({
      where: { linkId: id },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    const base = getBaseUrl(req);
    const code = link.customAlias ?? link.shortCode;

    return jsonOk({
      link: {
        id: link.id,
        originalUrl: link.originalUrl,
        code,
        shortUrl: buildShortUrl(base, code),
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        clickCount: link.clickCount,
        isActive: link.isActive,
      },
      stats: {
        total: link.clickCount,
        firstClickAt: firstLast._min?.createdAt ?? null,
        lastClickAt: firstLast._max?.createdAt ?? null,
        byDay,
        byDevice,
        byBrowser,
        byOs,
        byReferrer,
        byCountry,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
