import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** تغيير حالة البلاغ (مقبول/مرفوض/قيد المراجعة) أو حذفه. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    requireAdmin(session);
    await assertCsrf(req);

    const { id } = await params;
    const { adminReportPatchSchema } = await import("@/lib/validation");
    const parsed = adminReportPatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonError("حالة غير صالحة", 422);
    }
    const status = parsed.data.status;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return jsonError("البلاغ غير موجود", 404);

    const updated = await prisma.report.update({ where: { id }, data: { status } });

    return jsonOk({ report: updated });
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
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return jsonError("البلاغ غير موجود", 404);

    await prisma.report.delete({ where: { id } });

    return jsonOk({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
