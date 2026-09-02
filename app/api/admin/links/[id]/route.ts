import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { invalidateLinkCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

/** تعطيل/تفعيل رابط (PATCH) أو حذفه (DELETE) بواسطة الأدمن. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    requireAdmin(session);
    await assertCsrf(req);

    const { id } = await params;
    const body = (await req.json()) as { isActive?: boolean };

    const link = await prisma.link.findUnique({
      where: { id },
      select: { shortCode: true, customAlias: true },
    });
    if (!link) return jsonError("الرابط غير موجود", 404);

    if (link.shortCode) invalidateLinkCache(link.shortCode);
    if (link.customAlias) invalidateLinkCache(link.customAlias);

    const updated = await prisma.link.update({
      where: { id },
      data: { isActive: body.isActive === undefined ? true : Boolean(body.isActive) },
    });

    return jsonOk({ link: updated });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    requireAdmin(session);
    await assertCsrf(req);

    const { id } = await params;

    const link = await prisma.link.findUnique({
      where: { id },
      select: { shortCode: true, customAlias: true },
    });
    if (!link) return jsonError("الرابط غير موجود", 404);

    if (link.shortCode) invalidateLinkCache(link.shortCode);
    if (link.customAlias) invalidateLinkCache(link.customAlias);

    await prisma.link.delete({ where: { id } });

    return jsonOk({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
