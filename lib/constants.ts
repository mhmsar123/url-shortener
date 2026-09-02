/** الكلمات المحجوزة الإضافية التي لا يمكن استخدامها كـ Alias
 *  (بالإضافة إلى الجدول ReservedAlias في قاعدة البيانات).
 */
export const EXTRA_RESERVED = [
  "admin",
  "administrator",
  "login",
  "register",
  "signin",
  "signup",
  "api",
  "dashboard",
  "settings",
  "about",
  "contact",
  "privacy",
  "terms",
  "report",
  "analytics",
  "create",
  "account",
  "auth",
];

export const REPORT_REASONS = [
  { value: "scam", label: "رابط احتيالي" },
  { value: "malware", label: "رابط ضار" },
  { value: "illegal", label: "محتوى غير قانوني" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "سبب آخر" },
] as const;

export const EXPIRY_OPTIONS = [
  { value: "", label: "بدون انتهاء" },
  { value: "1d", label: "بعد يوم" },
  { value: "7d", label: "بعد أسبوع" },
  { value: "30d", label: "بعد شهر" },
  { value: "custom", label: "تاريخ مخصص" },
] as const;

export function expiryToDate(value: string, custom?: string): Date | null {
  if (!value) return null;
  if (value === "1d") return new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (value === "7d") return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (value === "30d") return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (value === "custom") {
    if (!custom) return null;
    const d = new Date(custom);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}
