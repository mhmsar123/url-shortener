# قصّر رابط — مختصر روابط عربي

مختصر روابط احترافي باللغة العربية، بواجهة RTL كاملة مع وضع داكن، مبني بـ **Next.js 15 + TypeScript + Tailwind CSS v4 + Prisma**.

## المزايا

- اختصار الروابط **بدون تسجيل** (بشكل مجهول)
- حساب اختياري: لوحة تحكم، إحصاءات، إدارة الروابط
- اسم مخصص (Custom Alias) + التحقق الفوري من توافره
- رمز QR لكل رابط (مولّد داخليًا بصيغة PNG)
- تاريخ انتهاء للرابط
- إحصاءات مفصّلة: نقرات يومية، أجهزة، متصفحات، أنظمة تشغيل، مصادر إحالة، دول
- تقرير الروابط الضارة (من المستخدمين)
- لوحة تحكم أدمن: مستخدمون، روابط، بلاغات، أسماء محجوزة، إعدادات معدلات الطلبات
- أمان: مصادقة JWT (كوكيز httpOnly)، حماية CSRF، تحديد معدل الطلبات (Rate Limiting)، تحقّق من سلامة الروابط (حجب `javascript:` و `data:` وعناوين IP الخاصة)، حماية فورية لتضارب الأسماء (متجاهلة لحالة الأحرف)
- CAPTCHA اختياري عبر Cloudflare Turnstile (مجاني)
- صفحات: الرئيسية، الدخول، التسجيل، لوحة التحكم، إنشاء رابط، إحصاءات، الإعدادات، التبليغ، الأدمن، الخصوصية، الشروط

## المتطلبات

- Node.js 20.9 أو أحدث (موصى به 22+)
- npm

## التشغيل محليًا

```bash
# 1) تثبيت الاعتماديات
npm install

# 2) تجهيز المتغيرات
# انسخ .env.example إلى .env ثم عدّل المفاتيح:
copy .env.example .env

# 3) إنشاء قاعدة البيانات (SQLite افتراضيًا - لا يحتاج أي إعداد)
npm run db:push

# 4) البذر الأولي (أدمن + أسماء محجوزة + إعدادات)
npm run db:seed

# 5) التشغيل
npm run dev
```

افتح المتصفح على `http://localhost:3000`.

### حساب الأدمن

- البريد: `admin@example.com`
- كلمة المرور: `Admin123!`

> غيّرها فورًا في الإنتاج عبر متغيرات `ADMIN_EMAIL` و `ADMIN_PASSWORD` في `.env`.

## متغيرات البيئة

| المتغير | الوصف |
| --- | --- |
| `DATABASE_URL` | رابط قاعدة البيانات (SQLite محليًا، أو PostgreSQL للإنتاج) |
| `AUTH_SECRET` | مفتاح توقيع الجلسات. أنشئه: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | بيانات الأدمن الافتراضي (تُستخدم في البذر فقط) |
| `APP_BASE_URL` | دومين الموقع للروابط المختصرة. اتركه فارغًا ليُحتسب تلقائيًا |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | مفاتيح CAPTCHA (فارغة = إيقاف) |

## قاعدة البيانات: SQLite أو PostgreSQL

يعمل المشروع على **SQLite** محليًا (صفر إعداد) و **PostgreSQL** للإنتاج، مع سكربت للتبديل:

```bash
# التحويل إلى PostgreSQL (للنشر)
npm run db:use:postgres

# العودة إلى SQLite (للتطوير المحلي)
npm run db:use:sqlite
```

> بعد التبديل فعّل `DATABASE_URL` المناسب في `.env` ثم نفّذ `npm run db:push` و `npm run db:seed`.

## النشر مجانًا على Vercel + Neon

1. أنشئ قاعدة PostgreSQL مجانية على [Neon](https://neon.tech) وانسخ `DATABASE_URL`.
2. ارفع المشروع على [Vercel](https://vercel.com).
3. في Vercel → Settings → Environment Variables أضف:
   - `DATABASE_URL` (رابط Neon)
   - `AUTH_SECRET` (قيمة عشوائية طويلة)
   - `ADMIN_EMAIL` و `ADMIN_PASSWORD`
   - (اختياري) مفاتيح Turnstile
4. نفّذ محليًا قبل الرفع أو في بيئة البناء:
   ```bash
   npm run db:use:postgres
   npm run db:push
   npm run db:seed
   ```
5. انشر عبر `vercel --prod`.

> ملاحظة: معدّلات الطلبات (Rate Limiting) تعمل في الذاكرة؛ على Vercel قد تكون لكل مثيل. لإعداد قوي في الإنتاج يمكن استبدالها بنهج مشترك (Redis).

## سكربتات مفيدة

| الأمر | الوصف |
| --- | --- |
| `npm run dev` | التطوير مع إعادة التحميل التلقائي |
| `npm run build` | بناء الإنتاج (يشمل توليد Prisma Client) |
| `npm run start` | تشغيل بناء الإنتاج |
| `npm run lint` | فحص الكود |
| `npm run db:push` | مزامنة مخطط قاعدة البيانات |
| `npm run db:seed` | البذر الأولي |
| `npm run db:studio` | فتح Prisma Studio لاستعراض البيانات |
| `npm run db:use:sqlite` / `npm run db:use:postgres` | التبديل بين قواعد البيانات |

## هيكل المشروع

```
app/
  page.tsx            # الرئيسية
  [code]/route.ts     # إعادة التوجيه + تسجيل النقرة
  api/                # REST API (روابط، مصادقة، إحصاءات، أدمن، QR، بلاغات)
  login|register|dashboard|create|analytics/[id]|settings|report/[code]|admin
components/           # مكونات الواجهة
lib/                  # منطق السيرفر: auth, csrf, rate-limit, validation, db, qr, cache ...
prisma/               # المخططات (SQLite/PostgreSQL) + seed
scripts/use-db.mjs    # سكربت تبديل قاعدة البيانات
middleware.ts         # حماية المسارات + كوكي CSRF
```

## الأمان

- الجلسات JWT في كوكي `httpOnly` + `secure` + `sameSite`
- تحقق CSRF: تطابق كوكي `qs_csrf` مع هيدر `x-csrf-token`
- تحديد معدل الطلبات: إنشاء الروابط، فحص الأسماء، المصادقة، البلاغات، والطلب العام
- فحص الروابط قبل الاختصار: رفض `javascript:` / `data:` / عناوين الشبكات الخاصة / نفس الموقع
- منع تضارب الأسماء مع تجاهل حالة الأحرف (الفحص قبل الإنشاء والتعديل)
- قائمة أسماء محجوزة (مسارات النظام) تمنع استغلالها كأسماء مختصرة
