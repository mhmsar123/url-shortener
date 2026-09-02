export const metadata = { title: "سياسة الخصوصية" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">سياسة الخصوصية</h1>
      <div className="prose prose-slate mt-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. ما البيانات التي نجمعها؟</h2>
          <p>
            نجمع الحد الأدنى من البيانات اللازمة لتشغيل الخدمة:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>الروابط التي تختصرها (لا نكشفها للغير).</li>
            <li>إذا أنشأت حسابًا: بريدك الإلكتروني وكلمة مرور مشفرة بطريقة آمنة (hashing).</li>
            <li>إحصائيات زيارات عامة: نوع الجهاز، المتصفح، نظام التشغيل، الدولة التقريبية، ومصدر الزيارة.</li>
            <li>عنوان IP الخاص بك مؤقتًا لأغراض منع إساءة الاستخدام (Rate Limiting)، ولا نحتفظ به كجزء من البيانات الشخصية.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. كيف نستخدم البيانات؟</h2>
          <p>
            نستخدم البيانات حصريًا لتقديم الخدمة وتحسينها وضمان أمانها، ولا نبيع بياناتك لأي طرف ثالث أبدًا.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. الكوكيز (Cookies)</h2>
          <p>
            نستخدم كوكيز تقنية ضرورية لتسجيل الدخول (جلسة آمنة) وحماية من التزييف (CSRF) وتذكّر التفضيلات.
            يمكنك حذفها من متصفحك في أي وقت.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. حذف البيانات</h2>
          <p>
            يمكنك حذف أي رابط من لوحة التحكم في أي وقت، أو حذف حسابك بالكامل من صفحة الإعدادات.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. تعديل هذه السياسة</h2>
          <p>
            قد نقوم بتحديث هذه السياسة من وقت لآخر، وسيُنشر أي تحديث في هذه الصفحة.
          </p>
        </section>
      </div>
    </div>
  );
}
