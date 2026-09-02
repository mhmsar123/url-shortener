import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prismaDir = join(__dirname, "..", "prisma");

const provider = process.argv[2];
if (!["sqlite", "postgres"].includes(provider)) {
  console.error("الاستخدام:  npm run db:use:sqlite   أو   npm run db:use:postgres");
  process.exit(1);
}

const src = join(prismaDir, `schema.${provider}.prisma`);
if (!existsSync(src)) {
  console.error(`الملف غير موجود: ${src}`);
  process.exit(1);
}

copyFileSync(src, join(prismaDir, "schema.prisma"));
console.log(`✓ تم التبديل إلى ${provider}. شغّل الآن:  npx prisma generate`);
