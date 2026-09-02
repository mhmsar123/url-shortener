import UrlForm from "@/components/UrlForm";

export const metadata = {
  title: "مختصر الروابط",
};

const features = [
  {
    title: "بدون تسجيل",
    desc: "اختصِر أي رابط فورًا دون إنشاء حساب، وانسخ وشارك في ثوانٍ.",
    icon: (
      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
    ),
  },
  {
    title: "سرعـة فائقة",
    desc: "تحويل فوري ومباشر بأقصر رمز، مع بنية تحتية مبنية للأداء.",
    icon: (
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    ),
  },
  {
    title: "إحصائيات كاملة",
    desc: "تتبّع الزيارات والأجهزة والمتصفحات والدول لكل رابط من لوحة التحكم.",
    icon: (
      <>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </>
    ),
  },
  {
    title: "QR Code",
    desc: "أنشئ رمز QR لرابطك المختصر وقم بتحميله بصيغة PNG مباشرة.",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3M21 14v.01M14 21h.01M18 18h.01" />
      </>
    ),
  },
];

export default function HomePage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/60 to-violet-200/60 blur-3xl dark:from-indigo-900/40 dark:to-violet-900/40" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-900/30" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
              مجاني وسريع وآمن
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              اختصر روابطك{" "}
              <span className="bg-gradient-to-l from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                بسهولة
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg dark:text-slate-400">
              حوّل الروابط الطويلة إلى روابط قصيرة وسهلة المشاركة في ثوانٍ.
            </p>

            <div className="mx-auto mt-10 max-w-2xl text-right">
              <UrlForm />
            </div>
          </div>
        </div>
      </section>

      {/* ===== المميزات ===== */}
      <section className="border-t border-slate-200/60 bg-white/60 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {f.icon}
                  </svg>
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
