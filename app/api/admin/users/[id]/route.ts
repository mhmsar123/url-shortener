import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const admin = requireAdmin(session);
    await assertCsrf(req);

    const { id } = await params;

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) return jsonError("المستخدم غير موجود", 404);
    if (target.role === "ADMIN") return jsonError("لا يمكن حذف حساب أدمن", 403);
    if (target.id === admin.id) return jsonError("لا يمكنك حذف حسابك", 403);

    await prisma.user.delete({ where: { id } });

    return jsonOk({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
