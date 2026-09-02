import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertCsrf } from "@/lib/csrf";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRateLimitSettings } from "@/lib/settings";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limits = await getRateLimitSettings();

    const rl = rateLimit(`login:${ip}`, limits.auth, limits.windowMs);
    if (!rl.ok) {
      return jsonError("محاولات كثيرة، حاول لاحقًا.", 429, { retryAfter: rl.retryAfterSeconds });
    }

    await assertCsrf(req);

    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return jsonError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return jsonError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
    }

    await createSession({ id: user.id, email: user.email, role: user.role });

    return jsonOk({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    return handleApiError(e);
  }
}
