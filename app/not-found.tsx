import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <div className="text-center">
        <div className="flex justify-center">
          <Logo className="h-14 w-14" />
        </div>
        <p className="mt-8 text-6xl font-extrabold text-slate-300 dark:text-slate-700">404</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">عذرًا، الصفحة غير موجودة</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          الرابط الذي تبحث عنه غير موجود أو تم حذفه أو انتهت صلاحيته.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-600 px-7 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            الصفحة الرئيسية
          </Link>
          <Link
            href="/create"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-7 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            اختصار رابط
          </Link>
        </div>
      </div>
    </section>
  );
}
