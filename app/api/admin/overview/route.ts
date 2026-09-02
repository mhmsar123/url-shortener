import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    requireAdmin(session);

    const [totalLinks, totalClicks, totalUsers, totalReports, pendingReports, activeLinks, expiredLinks] =
      await Promise.all([
        prisma.link.count(),
        prisma.click.count(),
        prisma.user.count(),
        prisma.report.count(),
        prisma.report.count({ where: { status: "PENDING" } }),
        prisma.link.count({ where: { isActive: true } }),
        prisma.link.count({ where: { expiresAt: { lte: new Date() } } }),
      ]);

    const topLinks = await prisma.link.findMany({
      orderBy: { clickCount: "desc" },
      take: 5,
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        customAlias: true,
        clickCount: true,
      },
    });

    return jsonOk({
      overview: {
        totalLinks,
        totalClicks,
        totalUsers,
        totalReports,
        pendingReports,
        activeLinks,
        expiredLinks,
        topLinks,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
