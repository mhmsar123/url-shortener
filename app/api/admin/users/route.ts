import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { containsFilter } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    requireAdmin(session);

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();
    const type = url.searchParams.get("type") || "all"; // all | admin | user

    const where: Record<string, unknown> = {};
    if (type === "admin") where.role = "ADMIN";
    if (type === "user") where.role = "USER";
    if (search) where.OR = [{ email: containsFilter(search) }];

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { links: true } },
      },
    });

    return jsonOk({ users });
  } catch (e) {
    return handleApiError(e);
  }
}
