/** استخراج عنوان IP الخاص بالزائر من الهيدرات، مع تجاهل المصادر المحلية. */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function isLocalIp(ip: string): boolean {
  return (
    !ip ||
    ip === "unknown" ||
    ip === "::1" ||
    ip === "0:0:0:0:0:0:0:1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^169\.254\./.test(ip)
  );
}
