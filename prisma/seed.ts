import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const RESERVED_ALIASES = [
  "admin",
  "login",
  "register",
  "api",
  "dashboard",
  "settings",
  "about",
  "contact",
  "privacy",
  "terms",
  "report",
  "404",
  "403",
  "500",
  "analytics",
  "create",
  "admin-panel",
  "robots",
  "sitemap",
  "favicon",
  "icon",
  "home",
  "signup",
  "signin",
  "logout",
  "account",
  "user",
  "profile",
  "manage",
  "panel",
  "auth",
  "verify",
  "refund",
];

const DEFAULT_SETTINGS = {
  rate_limit_create: "10", // إنشاء روابط لكل دقيقة
  rate_limit_lookup: "120", // فتح روابط مختصرة لكل دقيقة
  rate_limit_auth: "5", // محاولات دخول/تسجيل لكل دقيقة
  rate_limit_report: "5", // بلاغات لكل دقيقة
  rate_limit_global: "600", // حد عام لكل IP
  window_seconds: "60",
};

async function main() {
  console.log("⏳ بذر قاعدة البيانات...");

  // ===== حساب الأدمن =====
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    console.log(`✓ الأدمن موجود بالفعل: ${adminEmail}`);
  } else {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash, role: "ADMIN", name: "Administrator" },
    });
    console.log(`✓ تم إنشاء حساب الأدمن: ${adminEmail}`);
  }

  // ===== الكلمات المحجوزة =====
  for (const alias of RESERVED_ALIASES) {
    await prisma.reservedAlias.upsert({
      where: { alias },
      update: {},
      create: { alias },
    });
  }
  console.log(`✓ تمت إضافة ${RESERVED_ALIASES.length} كلمة محجوزة`);

  // ===== إعدادات الإدارة =====
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.adminSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("✓ تم ضبط إعدادات Rate Limit الافتراضية");

  console.log("✅ اكتمل البذر بنجاح.");
  console.log("   أدمن: " + adminEmail + " / " + adminPassword);
  console.log("   ⚠️ غيّر كلمة المرور فورًا بعد أول تسجيل دخول!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
