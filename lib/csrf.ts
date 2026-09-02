import { cookies } from "next/headers";

export const CSRF_COOKIE = "qs_csrf";
export const CSRF_HEADER = "x-csrf-token";

/**
 * حماية CSRF: يتحقق أن قيمة الهيدر x-csrf-token تطابق قيمة الكوكيز qs_csrf.
 * الكوكيز تُضبط تلقائيًا من الميدل وير. يُستخدم فقط للطلبات التي تعدّل البيانات.
 */
export async function assertCsrf(req: Request): Promise<void> {
  const header = req.headers.get(CSRF_HEADER);
  const store = await cookies();
  const cookie = store.get(CSRF_COOKIE)?.value;
  if (!header || !cookie || header !== cookie) {
    const err = new Error("طلب غير مصرح (CSRF)") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
}

/** يُستخدم في حال احتجنا إلى قراءة الكوكيز داخل كود السيرفر فقط. */
export async function readCsrfCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? null;
}
