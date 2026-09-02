import { prisma } from "@/lib/prisma";
import { getSession, requireUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { updateLinkSchema } from "@/lib/validation";
import { EXTRA_RESERVED } from "@/lib/constants";
import { invalidateLinkCache } from "@/lib/cache";
import { isCodeTakenCaseInsensitive } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getOwnedLink(id: string, userId: string) {
  return prisma.link.findFirst({ where: { id, userId } });
}

async function isReservedAlias(alias: string): Promise<boolean> {
  if (EXTRA_RESERVED.includes(alias)) return true;
  const row = await prisma.reservedAlias.findUnique({ where: { alias } });
  return Boolean(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const user = requireUser(session);
    await assertCsrf(req);

    const { id } = await params;
    const link = await getOwnedLink(id, user.id);
    if (!link) return jsonError("الرابط غير موجود", 404);

    const body = updateLinkSchema.parse(await req.json());

    const data: Record<string, unknown> = {};

    if (body.alias !== undefined) {
      const alias = body.alias.trim().toLowerCase();
      if (alias === "" ) {
        data.customAlias = null;
      } else {
        if (await isReservedAlias(alias)) {
          return jsonError("هذا الاسم مستخدم بالفعل، اختر اسمًا آخر.", 409);
        }
        const isSameAlias = link.customAlias !== null && link.customAlias.toLowerCase() === alias;
        const taken = !isSameAlias && (await isCodeTakenCaseInsensitive(alias));
        if (taken) return jsonError("هذا الاسم مستخدم بالفعل، اختر اسمًا آخر.", 409);
        data.customAlias = alias;
      }
    }

    if (body.title !== undefined) {
      data.title = body.title.trim() || null;
    }

    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === "") {
        data.expiresAt = null;
      } else {
        const d = new Date(body.expiresAt);
        if (Number.isNaN(d.getTime())) return jsonError("تاريخ غير صالح", 422);
        if (d.getTime() <= Date.now()) return jsonError("تاريخ الانتهاء يجب أن يكون في المستقبل.", 422);
        data.expiresAt = d;
      }
    }

    // إبطال التخزين المؤقت للكود القديم والجديد
    if (link.shortCode) invalidateLinkCache(link.shortCode);
    if (link.customAlias) invalidateLinkCache(link.customAlias);
    if (data.customAlias) invalidateLinkCache(data.customAlias as string);

    const updated = await prisma.link.update({ where: { id }, data });

    return jsonOk({ link: updated });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const user = requireUser(session);
    await assertCsrf(req);

    const { id } = await params;
    const link = await prisma.link.findFirst({
      where: { id },
      select: { userId: true, shortCode: true, customAlias: true },
    });
    if (!link) return jsonError("الرابط غير موجود", 404);

    // المالك فقط أو الأدمن
    if (link.userId !== user.id && user.role !== "ADMIN") {
      return jsonError("غير مصرح", 403);
    }

    if (link.shortCode) invalidateLinkCache(link.shortCode);
    if (link.customAlias) invalidateLinkCache(link.customAlias);

    await prisma.link.delete({ where: { id } });

    return jsonOk({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
