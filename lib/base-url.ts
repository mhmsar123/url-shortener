/** حساب الرابط الأساسي للموقع تلقائيًا من الطلب أو من إعداد APP_BASE_URL. */
export function getBaseUrl(req?: Request): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/+$/, "");
  }
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export function buildShortUrl(base: string, code: string): string {
  return `${base.replace(/\/+$/, "")}/${encodeURIComponent(code)}`;
}
