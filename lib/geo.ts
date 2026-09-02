import { isLocalIp } from "./ip";

/**
 * تحديد الدولة بشكل تقريبي من عنوان IP.
 * يُستخدم ip-api.com (مجاني، بدون مفتاح). يُستدعى بعد إرسال الرد حتى لا يبطئ التحويل.
 */
export async function resolveCountry(ip: string): Promise<string | null> {
  if (isLocalIp(ip)) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { status: string; countryCode?: string };
    return data.status === "success" && data.countryCode ? data.countryCode : null;
  } catch {
    return null;
  }
}
