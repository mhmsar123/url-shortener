import { z } from "zod";

// ===== تحقق من صحة الروابط وأمانها =====

function isPrivateIp(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return true; // IP غير صالح
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a >= 224) return true; // multicast/reserved
  return false;
}

/** منع الروابط الخطرة (javascript:, data:, ...) وروابط الشبكات الداخلية. */
export function isSafeUrl(raw: string): boolean {
  if (!raw || raw.length > 2048) return false;
  if (/[\s<>"]/.test(raw)) return false;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return false;

  // النطاقات المحلية/الخاصة
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localdomain") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return false;
  }

  if (isPrivateIp(host)) return false;

  return true;
}

/** منع اختصار روابط لنفس الموقع (حلقة لانهائية). */
export function isSameHost(raw: string, currentBase: string): boolean {
  try {
    const a = new URL(raw).hostname.toLowerCase();
    const b = new URL(currentBase).hostname.toLowerCase();
    return a === b;
  } catch {
    return false;
  }
}

// ===== مخططات التحقق من المدخلات (zod) =====

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .min(1, "الصق الرابط أولًا")
    .max(2048, "الرابط طويل جدًا"),
  alias: z
    .string()
    .trim()
    .regex(/^[a-z0-9-_]{3,32}$/, "الاسم يجب أن يكون 3-32 حرفًا (أحرف أو أرقام أو - أو _)")
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .trim()
    .max(120, "العنوان طويل جدًا")
    .optional()
    .or(z.literal("")),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(190),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(72, "كلمة المرور طويلة جدًا"),
  confirmPassword: z.string(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(190),
  password: z.string().min(1, "أدخل كلمة المرور").max(72),
});

export const reportSchema = z.object({
  code: z.string().trim().min(1).max(32),
  reason: z.enum(["scam", "malware", "illegal", "spam", "other"]),
  details: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateLinkSchema = z.object({
  alias: z
    .string()
    .trim()
    .regex(/^[a-z0-9-_]{3,32}$/, "الاسم يجب أن يكون 3-32 حرفًا")
    .optional()
    .or(z.literal("")),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية").max(72),
  newPassword: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(72),
});

export const adminLinkPatchSchema = z.object({
  isActive: z.boolean().optional(),
});

export const adminReportPatchSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
});

export const adminAliasSchema = z.object({
  alias: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-_]{3,32}$/, "الاسم يجب أن يكون 3-32 حرفًا"),
});

export const adminSettingsSchema = z.record(
  z.enum([
    "rate_limit_create",
    "rate_limit_lookup",
    "rate_limit_auth",
    "rate_limit_report",
    "rate_limit_global",
    "window_seconds",
  ]),
  z.union([z.string(), z.number()])
);
