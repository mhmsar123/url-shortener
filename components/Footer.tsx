import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">قَصَّار</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              خدمة مجانية وسريعة لاختصار الروابط ومشاركتها، مع إحصائيات ورموز QR.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">روابط سريعة</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                  اختصار رابط
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                  لوحة التحكم
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                  إنشاء حساب
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">قانوني</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                  الإبلاغ عن رابط
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200/70 pt-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          © {new Date().getFullYear()} قَصَّار — جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
