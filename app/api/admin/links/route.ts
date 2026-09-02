import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";
import { containsFilter } from "@/lib/db";
import { getBaseUrl, buildShortUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    requireAdmin(session);

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();
    const status = url.searchParams.get("status") || "all"; // all | active | expired | disabled

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { originalUrl: containsFilter(search) },
        { shortCode: containsFilter(search) },
        { customAlias: containsFilter(search) },
      ];
    }
    if (status === "active") where.isActive = true;
    if (status === "disabled") where.isActive = false;
    if (status === "expired") where.expiresAt = { lte: new Date() };

    const links = await prisma.link.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
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
        user: { select: { email: true } },
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
