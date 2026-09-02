import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRateLimitSettings } from "@/lib/settings";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limits = await getRateLimitSettings();

    const rl = rateLimit(`register:${ip}`, limits.auth, limits.windowMs);
    if (!rl.ok) {
      return jsonError("لقد قمت بعدة محاولات، حاول لاحقًا.", 429, { retryAfter: rl.retryAfterSeconds });
    }

    await assertCsrf(req);

    const body = registerSchema.parse(await req.json());

    if (body.password !== body.confirmPassword) {
      return jsonError("كلمتا المرور غير متطابقتين", 422);
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return jsonError("هذا البريد مسجل بالفعل", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash, role: "USER" },
    });

    await createSession({ id: user.id, email: user.email, role: user.role });

    return jsonOk({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
