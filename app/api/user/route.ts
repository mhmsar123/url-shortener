import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, requireUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** تغيير كلمة المرور أو البريد الإلكتروني. */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const user = requireUser(session);
    await assertCsrf(req);

    const body = changePasswordSchema.parse(await req.json());

    const record = await prisma.user.findUnique({ where: { id: user.id } });
    if (!record) return jsonError("المستخدم غير موجود", 404);

    const valid = await bcrypt.compare(body.currentPassword, record.passwordHash);
    if (!valid) {
      return jsonError("كلمة المرور الحالية غير صحيحة", 401);
    }

    const newHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    return jsonOk({ changed: true });
  } catch (e) {
    return handleApiError(e);
  }
}

/** حذف الحساب نهائيًا. */
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    const user = requireUser(session);
    await assertCsrf(req);

    await prisma.user.delete({ where: { id: user.id } });

    return jsonOk({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
