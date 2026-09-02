import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    requireAdmin(session);

    const aliases = await prisma.reservedAlias.findMany({ orderBy: { alias: "asc" } });
    return jsonOk({ aliases: aliases.map((a) => a.alias) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    requireAdmin(session);
    await assertCsrf(req);

    const body = (await req.json()) as { alias?: string };
    const alias = (body.alias || "").trim().toLowerCase();

    if (!/^[a-z0-9-_]{3,32}$/.test(alias)) {
      return jsonError("الاسم يجب أن يكون 3-32 حرفًا (أحرف، أرقام، - أو _)", 422);
    }

    const existing = await prisma.reservedAlias.findUnique({ where: { alias } });
    if (existing) return jsonError("الاسم محجوز بالفعل", 409);

    await prisma.reservedAlias.create({ data: { alias } });

    return jsonOk({ alias });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    requireAdmin(session);
    await assertCsrf(req);

    const url = new URL(req.url);
    const alias = (url.searchParams.get("alias") || "").trim().toLowerCase();
    if (!alias) return jsonError("الاسم مطلوب", 422);

    await prisma.reservedAlias.delete({ where: { alias } }).catch(() => null);

    return jsonOk({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
