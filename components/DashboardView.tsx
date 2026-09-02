"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import ConfirmDialog from "@/components/ConfirmDialog";
import EditLinkModal from "@/components/EditLinkModal";
import QrModal from "@/components/QrModal";

type LinkItem = {
  id: string;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  title: string | null;
  createdAt: string;
  expiresAt: string | null;
  clickCount: number;
  isActive: boolean;
  code: string;
  shortUrl: string;
};

function isExpired(l: LinkItem): boolean {
  return Boolean(l.expiresAt && new Date(l.expiresAt).getTime() <= Date.now());
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric" });
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

export default function DashboardView() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LinkItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<LinkItem | null>(null);
  const [qrTarget, setQrTarget] = useState<LinkItem | null>(null);
  const [copiedId, setCopiedId] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLinks = useCallback(async (query = "") => {
    setLoading(true);
    const res = await api<{ links: LinkItem[] }>(`/api/links?search=${encodeURIComponent(query)}`);
    setLoading(false);
    if (res.ok && res.data) {
      setLinks(res.data.links);
      setError("");
    } else {
      setError(res.error || "تعذّر جلب الروابط");
    }
  }, []);

  useEffect(() => {
    fetchLinks("");
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [fetchLinks]);

  function onSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchLinks(value), 400);
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 2000);
    } catch {
      /* ignore */
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await api(`/api/links/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      setError(res.error || "تعذّر حذف الرابط");
      setDeleteTarget(null);
    }
  }

  const totalClicks = links.reduce((acc, l) => acc + l.clickCount, 0);
  const activeCount = links.filter((l) => l.isActive && !isExpired(l)).length;
  const expiredCount = links.filter(isExpired).length;
  const now = Date.now();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
            مرحبًا بك 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إليك نظرة على روابطك وإحصائياتها.</p>
        </div>
        <Link
          href="/create"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          إنشاء رابط جديد
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي الروابط" value={links.length} accent="text-slate-900 dark:text-white" />
        <StatCard label="إجمالي الزيارات" value={totalClicks} accent="text-indigo-600 dark:text-indigo-400" />
        <StatCard label="الروابط النشطة" value={activeCount} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="الروابط المنتهية" value={expiredCount} accent="text-amber-600 dark:text-amber-400" />
      </div>

      {/* البحث */}
      <div className="mt-8">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث بالرابط المختصر أو الاسم المخصص أو الرابط الأصلي…"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pr-12 pl-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
          />
        </div>
      </div>

      {/* الجدول */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-slate-400">جارٍ التحميل…</p>
          </div>
        ) : error && links.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-rose-500">{error}</p>
          </div>
        ) : links.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">لا توجد روابط بعد</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ابدأ باختصار أول رابط لك الآن.</p>
            <Link
              href="/create"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              اختصر رابطًا
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                  <th className="px-5 py-3.5">الرابط المختصر</th>
                  <th className="px-5 py-3.5">الرابط الأصلي</th>
                  <th className="px-5 py-3.5">الزيارات</th>
                  <th className="px-5 py-3.5">تاريخ الإنشاء</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {links.map((l) => {
                  const expired = isExpired(l);
                  const status = !l.isActive ? "معطّل" : expired ? "منتهي" : "نشط";
                  return (
                    <tr key={l.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/40">
                      <td className="px-5 py-4">
                        <a
                          href={l.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                          dir="ltr"
                        >
                          {l.shortUrl.replace(/^https?:\/\//, "")}
                        </a>
                        {l.title && <p className="mt-0.5 text-xs text-slate-400">{l.title}</p>}
                      </td>
                      <td className="max-w-[220px] px-5 py-4">
                        <p className="truncate text-slate-500 dark:text-slate-400" dir="ltr" title={l.originalUrl}>
                          {l.originalUrl}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          {l.clickCount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(l.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            status === "نشط"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : status === "منتهي"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                        >
                          {status}
                        </span>
                        {l.expiresAt && now > new Date(l.expiresAt).getTime() - 0 && (
                          <p className="mt-1 text-[10px] text-slate-400">{formatDate(l.expiresAt)}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => copy(l.shortUrl, l.id)}
                            title="نسخ"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          >
                            {copiedId === l.id ? (
                              <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>

                          <button type="button" onClick={() => setQrTarget(l)} title="QR" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <path d="M14 14h3v3M21 14v.01M14 21h.01M18 18h.01" />
                            </svg>
                          </button>

                          <Link href={`/analytics/${l.id}`} title="إحصائيات" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 20V10" />
                              <path d="M12 20V4" />
                              <path d="M6 20v-6" />
                            </svg>
                          </Link>

                          <button type="button" onClick={() => setEditTarget(l)} title="تعديل" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(l)}
                            title="حذف"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* النوافذ المنبثقة */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الرابط"
        message="هل أنت متأكد من حذف هذا الرابط؟ بعد الحذف لن يعمل الرابط المختصر نهائيًا."
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {editTarget && (
        <EditLinkModal
          link={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchLinks(search)}
        />
      )}
      {qrTarget && <QrModal url={qrTarget.shortUrl} onClose={() => setQrTarget(null)} />}
    </div>
  );
}
