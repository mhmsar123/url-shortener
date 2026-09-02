export const metadata = { title: "الشروط والأحكام" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">الشروط والأحكام</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. استخدام الخدمة</h2>
          <p>
            باستخدامك للخدمة فإنك توافق على استخدامها لأغراض مشروعة فقط. يُمنع استخدام الخدمة لاختصار روابط
            تحتوي على محتوى احتيالي أو ضار أو غير قانوني أو أي محتوى يخالف القوانين المحلية والدولية.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. حسابات المستخدمين</h2>
          <p>
            أنت مسؤول عن الحفاظ على سرية كلمة مرور حسابك. التسجيل اختياري ويمكنك استخدام الخدمة الأساسية بدونه.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. الروابط والمسؤولية</h2>
          <p>
            نحن غير مسؤولين عن محتوى الروابط التي يختصرها المستخدمون. إذا وجدت رابطًا مخالفًا يمكنك الإبلاغ عنه،
            وسيتم مراجعته وقد يتم تعطيله أو حذفه.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. إساءة الاستخدام</h2>
          <p>
            نحتفظ بحق تعطيل أو حذف أي رابط أو حساب يخالف هذه الشروط أو يستغل الخدمة بشكل غير لائق
            (مثل إرسال طلبات مفرطة أو محاولة اختراق النظام).
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. انقطاع الخدمة</h2>
          <p>
            نقدم الخدمة «كما هي» دون أي ضمانات، وقد تتعطل الخدمة مؤقتًا للصيانة دون مسؤولية علينا عن أي أضرار.
          </p>
        </section>
      </div>
    </div>
  );
}
