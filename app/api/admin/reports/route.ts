import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    requireAdmin(session);

    const reports = await prisma.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        link: {
          select: {
            id: true,
            shortCode: true,
            customAlias: true,
            originalUrl: true,
            isActive: true,
          },
        },
      },
    });

    return jsonOk({ reports });
  } catch (e) {
    return handleApiError(e);
  }
}
