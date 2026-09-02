import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function handleApiError(e: unknown) {
  if (e instanceof ZodError) {
    const first = e.errors[0];
    return jsonError(first?.message ?? "مدخلات غير صالحة", 422, { details: e.errors });
  }
  const err = e as { status?: number; message?: string };
  const status = err.status ?? 500;
  if (status >= 500) {
    console.error("[API ERROR]", e);
    return jsonError("حدث خطأ غير متوقع، حاول لاحقًا.", 500);
  }
  return jsonError(err.message || "خطأ غير معروف", status);
}
