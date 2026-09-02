import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getBaseUrl, buildShortUrl } from "@/lib/base-url";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "إحصائيات الرابط" };

const REASON_LABELS: Record<string, string> = {
  scam: "احتيال",
  malware: "ضار",
  illegal: "غير قانوني",
  spam: "Spam",
  other: "أخرى",
};

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">لا توجد بيانات بعد.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((d) => (
            <li key={d.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">{d.label}</span>
              <MiniBar value={d.count} max={max} />
              <span className="w-8 shrink-0 text-left text-xs font-bold text-slate-500 dark:text-slate-400">{d.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;

  const link = await prisma.link.findFirst({
    where: { id },
    select: {
      id: true,
      originalUrl: true,
      shortCode: true,
      customAlias: true,
      title: true,
      createdAt: true,
      expiresAt: true,
      clickCount: true,
      isActive: true,
      userId: true,
      reports: { select: { reason: true, status: true, createdAt: true } },
    },
  });

  if (!link) notFound();
  if (!session || (link.userId !== session.id && session.role !== "ADMIN")) {
    notFound();
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [recentClicks, firstLast] = await Promise.all([
    prisma.click.findMany({
      where: { linkId: id, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.click.aggregate({
      where: { linkId: id },
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
  ]);

  const dayMap = new Map<string, number>();
  for (const c of recentClicks) {
    const key = c.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const byDay: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    byDay.push({ date: d.toISOString().slice(0, 10), count: dayMap.get(d.toISOString().slice(0, 10)) ?? 0 });
  }

  async function breakdown(field: "deviceType" | "browser" | "os" | "referrer" | "country") {
    const rows = await prisma.click.groupBy({
      by: [field],
      where: { linkId: id },
      _count: { _all: true },
      orderBy: { _count: { [field]: "desc" } },
      take: 8,
    });
    return rows.filter((r) => r[field] !== null).map((r) => ({ label: String(r[field]), count: r._count._all }));
  }

  const [byDevice, byBrowser, byOs, byReferrer, byCountry] = await Promise.all([
    breakdown("deviceType"),
    breakdown("browser"),
    breakdown("os"),
    breakdown("referrer"),
    breakdown("country"),
  ]);

  const base = getBaseUrl();
  const code = link.customAlias ?? link.shortCode;
  const shortUrl = buildShortUrl(base, code);
  const maxDay = Math.max(1, ...byDay.map((d) => d.count));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            → العودة إلى لوحة التحكم
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">إحصائيات الرابط</h1>
        </div>
      </div>

      {/* معلومات الرابط */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="truncate font-bold text-indigo-600 hover:underline dark:text-indigo-400" dir="ltr">
                {shortUrl}
              </a>
              <CopyButton text={shortUrl} />
            </div>
            <p className="mt-1.5 truncate text-sm text-slate-400" dir="ltr">
              {link.originalUrl}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-400">الإنشاء</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {link.createdAt.toLocaleDateString("ar")}
              </p>
            </div>
            {link.expiresAt && (
              <div>
                <p className="text-xs text-slate-400">الانتهاء</p>
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  {link.expiresAt.toLocaleDateString("ar")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* بطاقات رئيسية */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{link.clickCount}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إجمالي الزيارات</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {firstLast._min?.createdAt ? firstLast._min.createdAt.toLocaleDateString("ar") : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">أول زيارة</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {firstLast._max?.createdAt ? firstLast._max.createdAt.toLocaleDateString("ar") : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">آخر زيارة</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{link.isActive ? "نشط" : "معطّل"}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">الحالة</p>
        </div>
      </div>

      {/* الزيارات اليومية */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">الزيارات اليومية — آخر 30 يومًا</h3>
        <div className="flex h-40 items-end gap-1">
          {byDay.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-violet-500 transition group-hover:opacity-80"
                style={{ height: `${Math.max(2, Math.round((d.count / maxDay) * 100))}%` }}
                title={`${d.date}: ${d.count} زيارة`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-400">
          <span>{byDay[0]?.date}</span>
          <span>{byDay[Math.floor(byDay.length / 2)]?.date}</span>
          <span>{byDay[byDay.length - 1]?.date}</span>
        </div>
      </div>

      {/* التوزيعات */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Breakdown title="الأجهزة" data={byDevice.map((d) => ({ label: d.label, count: d.count }))} />
        <Breakdown title="المتصفحات" data={byBrowser.map((d) => ({ label: d.label, count: d.count }))} />
        <Breakdown title="أنظمة التشغيل" data={byOs.map((d) => ({ label: d.label, count: d.count }))} />
        <Breakdown title="الدول" data={byCountry.map((d) => ({ label: d.label, count: d.count }))} />
        {byReferrer.length > 0 && (
          <div className="lg:col-span-2">
            <Breakdown title="مصادر الزيارات (Referrers)" data={byReferrer.map((d) => ({ label: d.label, count: d.count }))} />
          </div>
        )}
      </div>

      {/* البلاغات */}
      {link.reports.length > 0 && (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">بلاغات على هذا الرابط</h3>
          <ul className="mt-3 space-y-2">
            {link.reports.map((r) => (
              <li key={r.createdAt.toISOString()} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <span className="font-semibold">{REASON_LABELS[r.reason] ?? r.reason}</span>
                <span className="text-xs text-amber-500">— {r.createdAt.toLocaleDateString("ar")}</span>
                <span className="text-xs">({r.status})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
