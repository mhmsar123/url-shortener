import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError } from "@/lib/api";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { EXTRA_RESERVED } from "@/lib/constants";
import { isCodeTakenCaseInsensitive } from "@/lib/db";

export const dynamic = "force-dynamic";

/** فحص توفّر الاسم المخصص (Alias). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const alias = (url.searchParams.get("alias") || "").trim().toLowerCase();

  if (!alias) {
    return jsonOk({ available: false, message: "" });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`alias-check:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return jsonError("طلبات كثيرة، حاول لاحقًا.", 429);
  }

  if (!/^[a-z0-9-_]{3,32}$/.test(alias)) {
    return jsonOk({
      available: false,
      message: "الاسم يجب أن يكون 3-32 حرفًا (أحرف، أرقام، - أو _)",
    });
  }

  const reserved = EXTRA_RESERVED.includes(alias);
  if (!reserved) {
    const row = await prisma.reservedAlias.findUnique({ where: { alias } });
    if (row) {
      return jsonOk({ available: false, message: "هذا الاسم محجوز." });
    }
  }
  if (reserved) {
    return jsonOk({ available: false, message: "هذا الاسم محجوز." });
  }

  const taken = await isCodeTakenCaseInsensitive(alias);

  if (taken) {
    return jsonOk({ available: false, message: "هذا الاسم مستخدم بالفعل، اختر اسمًا آخر." });
  }

  return jsonOk({ available: true, message: "الاسم متاح ✓" });
}
