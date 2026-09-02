import { prisma } from "./prisma";

/** هل قاعدة البيانات الحالية هي SQLite؟ (يُستخدم لتكييف بعض الاستعلامات). */
export function isSqlite(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:"));
}

/** فلتر بحث غير حساس لحالة الأحرف يعمل على SQLite وPostgreSQL. */
export function containsFilter(value: string) {
  if (isSqlite()) {
    return { contains: value };
  }
  return { contains: value, mode: "insensitive" as const };
}

/**
 * فحص تفرد الكود/الاسم غير حساس لحالة الأحرف (يمنع الاستغلال عبر حالة الأحرف).
 * يعمل على SQLite وPostgreSQL معًا.
 */
export async function isCodeTakenCaseInsensitive(code: string): Promise<boolean> {
  const needle = code.toLowerCase();
  const rows = await prisma.link.findMany({
    where: {
      OR: [{ shortCode: containsFilter(needle) }, { customAlias: containsFilter(needle) }],
    },
    select: { shortCode: true, customAlias: true },
  });
  return rows.some(
    (r) =>
      r.shortCode.toLowerCase() === needle ||
      (r.customAlias !== null && r.customAlias.toLowerCase() === needle)
  );
}
