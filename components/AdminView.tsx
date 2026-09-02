"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import ConfirmDialog from "@/components/ConfirmDialog";

type Overview = {
  totalLinks: number;
  totalClicks: number;
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
  activeLinks: number;
  expiredLinks: number;
  topLinks: { id: string; originalUrl: string; shortCode: string; customAlias: string | null; clickCount: number }[];
};

type AdminLink = {
  id: string;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  title: string | null;
  createdAt: string;
  expiresAt: string | null;
  clickCount: number;
  isActive: boolean;
  userId: string | null;
  user: { email: string } | null;
  code: string;
  shortUrl: string;
};

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { links: number };
};

type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  link: { id: string; shortCode: string; customAlias: string | null; originalUrl: string; isActive: boolean };
};

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "links", label: "الروابط" },
  { id: "users", label: "المستخدمون" },
  { id: "reports", label: "البلاغات" },
  { id: "aliases", label: "الكلمات المحجوزة" },
  { id: "settings", label: "الإعدادات" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

const REASON_LABELS: Record<string, string> = {
  scam: "احتيال",
  malware: "ضار",
  illegal: "غير قانوني",
  spam: "Spam",
  other: "أخرى",
};

export default function AdminView() {
  const [tab, setTab] = useState<TabId>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);

  // روابط
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkStatus, setLinkStatus] = useState("all");
  const [linksLoading, setLinksLoading] = useState(false);

  // مستخدمون
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  // بلاغات
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // كلمات محجوزة
  const [aliases, setAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState("");

  // إعدادات
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchOverview = useCallback(async () => {
    const res = await api<{ overview: Overview }>("/api/admin/overview");
    if (res.ok && res.data) setOverview(res.data.overview);
  }, []);

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    const res = await api<{ links: AdminLink[] }>(
      `/api/admin/links?search=${encodeURIComponent(linkSearch)}&status=${linkStatus}`
    );
    setLinksLoading(false);
    if (res.ok && res.data) setLinks(res.data.links);
  }, [linkSearch, linkStatus]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await api<{ users: AdminUser[] }>(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
    setUsersLoading(false);
    if (res.ok && res.data) setUsers(res.data.users);
  }, [userSearch]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    const res = await api<{ reports: AdminReport[] }>("/api/admin/reports");
    setReportsLoading(false);
    if (res.ok && res.data) setReports(res.data.reports);
  }, []);

  const fetchAliases = useCallback(async () => {
    const res = await api<{ aliases: string[] }>("/api/admin/aliases");
    if (res.ok && res.data) setAliases(res.data.aliases);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await api<{ settings: Record<string, string> }>("/api/admin/settings");
    if (res.ok && res.data) setSettings(res.data.settings);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (tab === "links") fetchLinks();
    if (tab === "users") fetchUsers();
    if (tab === "reports") fetchReports();
    if (tab === "aliases") fetchAliases();
    if (tab === "settings") fetchSettings();
  }, [tab, fetchLinks, fetchUsers, fetchReports, fetchAliases, fetchSettings]);

  function switchTab(t: TabId) {
    setTab(t);
  }

  async function runAction(fn: () => Promise<void>, close = true) {
    setBusy(true);
    await fn();
    setBusy(false);
    if (close) setConfirm(null);
  }

  // ===== العمليات =====
  const toggleLink = async (link: AdminLink) => {
    await api(`/api/admin/links/${link.id}`, { method: "PATCH", json: { isActive: !link.isActive } });
    fetchLinks();
    fetchOverview();
  };

  const deleteLink = async (link: AdminLink) => {
    await api(`/api/admin/links/${link.id}`, { method: "DELETE" });
    fetchLinks();
    fetchOverview();
  };

  const deleteUser = async (user: AdminUser) => {
    await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
    fetchUsers();
    fetchOverview();
  };

  const resolveReport = async (report: AdminReport, status: string) => {
    await api(`/api/admin/reports/${report.id}`, { method: "PATCH", json: { status } });
    fetchReports();
    fetchOverview();
  };

  const deleteReport = async (report: AdminReport) => {
    await api(`/api/admin/reports/${report.id}`, { method: "DELETE" });
    fetchReports();
    fetchOverview();
  };

  async function addAlias(e: React.FormEvent) {
    e.preventDefault();
    if (!newAlias.trim()) return;
    const res = await api("/api/admin/aliases", { method: "POST", json: { alias: newAlias } });
    if (res.ok) {
      setNewAlias("");
      fetchAliases();
    }
  }

  async function removeAlias(alias: string) {
    await api(`/api/admin/aliases?alias=${encodeURIComponent(alias)}`, { method: "DELETE" });
    fetchAliases();
  }

  async function saveSettings() {
    setSettingsSaved(false);
    const res = await api("/api/admin/settings", { method: "PATCH", json: settings });
    if (res.ok) {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950";

  const thClass = "px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400";
  const tdClass = "px-4 py-3.5 text-sm";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">لوحة الإدارة</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">إدارة شاملة للموقع والمستخدمين والروابط.</p>
        </div>
      </div>

      {/* التبويبات */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
            {t.id === "reports" && overview && overview.pendingReports > 0 && (
              <span className="mr-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">{overview.pendingReports}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* ===== نظرة عامة ===== */}
        {tab === "overview" && overview && (
          <div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="إجمالي الروابط" value={overview.totalLinks} accent="text-slate-900 dark:text-white" />
              <StatCard label="إجمالي الزيارات" value={overview.totalClicks} accent="text-indigo-600 dark:text-indigo-400" />
              <StatCard label="المستخدمون" value={overview.totalUsers} accent="text-violet-600 dark:text-violet-400" />
              <StatCard label="البلاغات" value={overview.totalReports} accent="text-rose-600 dark:text-rose-400" />
              <StatCard label="روابط نشطة" value={overview.activeLinks} accent="text-emerald-600 dark:text-emerald-400" />
              <StatCard label="روابط منتهية" value={overview.expiredLinks} accent="text-amber-600 dark:text-amber-400" />
              <StatCard label="بلاغات معلّقة" value={overview.pendingReports} accent="text-orange-600 dark:text-orange-400" />
              <StatCard label="روابط في الشهر" value={overview.totalLinks} accent="text-sky-600 dark:text-sky-400" />
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">الروابط الأكثر استخدامًا</h3>
              {overview.topLinks.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">لا توجد روابط بعد.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {overview.topLinks.map((l, i) => (
                    <li key={l.id} className="flex items-center gap-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <a
                          href={`/${l.customAlias ?? l.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                          dir="ltr"
                        >
                          /{l.customAlias ?? l.shortCode}
                        </a>
                        <span className="block truncate text-xs text-slate-400" dir="ltr">
                          {l.originalUrl}
                        </span>
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                        {l.clickCount} زيارة
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ===== الروابط ===== */}
        {tab === "links" && (
          <div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                placeholder="ابحث في الروابط…"
                className={`${inputClass} sm:max-w-xs`}
              />
              <select value={linkStatus} onChange={(e) => setLinkStatus(e.target.value)} className={`${inputClass} sm:max-w-[180px]`}>
                <option value="all">كل الحالات</option>
                <option value="active">نشطة</option>
                <option value="expired">منتهية</option>
                <option value="disabled">معطّلة</option>
              </select>
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-right text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
                    <tr>
                      <th className={thClass}>الرابط</th>
                      <th className={thClass}>المالك</th>
                      <th className={thClass}>الزيارات</th>
                      <th className={thClass}>الحالة</th>
                      <th className={`${thClass} text-center`}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {linksLoading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">جارٍ التحميل…</td>
                      </tr>
                    )}
                    {!linksLoading && links.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">لا توجد روابط.</td>
                      </tr>
                    )}
                    {!linksLoading &&
                      links.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                          <td className={tdClass}>
                            <a
                              href={`/${l.code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                              dir="ltr"
                            >
                              /{l.code}
                            </a>
                            <p className="max-w-[240px] truncate text-xs text-slate-400" dir="ltr">{l.originalUrl}</p>
                          </td>
                          <td className={tdClass}>{l.user?.email ?? <span className="text-slate-400">—</span>}</td>
                          <td className={tdClass}>{l.clickCount}</td>
                          <td className={tdClass}>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              !l.isActive
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                                : l.expiresAt && new Date(l.expiresAt).getTime() <= Date.now()
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                            }`}>
                              {!l.isActive ? "معطّل" : l.expiresAt && new Date(l.expiresAt).getTime() <= Date.now() ? "منتهي" : "نشط"}
                            </span>
                          </td>
                          <td className={`${tdClass} text-center`}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleLink(l)}
                                title={l.isActive ? "تعطيل" : "تفعيل"}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                              >
                                {l.isActive ? (
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                ) : (
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirm({
                                    title: "حذف رابط",
                                    message: "هل أنت متأكد من حذف هذا الرابط نهائيًا؟",
                                    action: () => runAction(() => deleteLink(l)),
                                  })
                                }
                                title="حذف"
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== المستخدمون ===== */}
        {tab === "users" && (
          <div>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="ابحث بالبريد الإلكتروني…"
              className={`${inputClass} max-w-xs`}
            />
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-right text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
                    <tr>
                      <th className={thClass}>البريد الإلكتروني</th>
                      <th className={thClass}>الدور</th>
                      <th className={thClass}>عدد الروابط</th>
                      <th className={thClass}>تاريخ التسجيل</th>
                      <th className={`${thClass} text-center`}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usersLoading && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">جارٍ التحميل…</td></tr>
                    )}
                    {!usersLoading && users.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">لا يوجد مستخدمون.</td></tr>
                    )}
                    {!usersLoading &&
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                          <td className={tdClass} dir="ltr">{u.email}</td>
                          <td className={tdClass}>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              u.role === "ADMIN"
                                ? "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {u.role === "ADMIN" ? "أدمن" : "مستخدم"}
                            </span>
                          </td>
                          <td className={tdClass}>{u._count.links}</td>
                          <td className={tdClass}>{new Date(u.createdAt).toLocaleDateString("ar")}</td>
                          <td className={`${tdClass} text-center`}>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  title: "حذف مستخدم",
                                  message: `هل أنت متأكد من حذف المستخدم ${u.email}؟ سيتم حذف جميع روابطه.`,
                                  action: () => runAction(() => deleteUser(u)),
                                })
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== البلاغات ===== */}
        {tab === "reports" && (
          <div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-right text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
                    <tr>
                      <th className={thClass}>الرابط</th>
                      <th className={thClass}>السبب</th>
                      <th className={thClass}>التفاصيل</th>
                      <th className={thClass}>التاريخ</th>
                      <th className={thClass}>الحالة</th>
                      <th className={`${thClass} text-center`}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportsLoading && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">جارٍ التحميل…</td></tr>
                    )}
                    {!reportsLoading && reports.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">لا توجد بلاغات.</td></tr>
                    )}
                    {!reportsLoading &&
                      reports.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                          <td className={tdClass}>
                            <a
                              href={`/${r.link.customAlias ?? r.link.shortCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                              dir="ltr"
                            >
                              /{r.link.customAlias ?? r.link.shortCode}
                            </a>
                            <p className="max-w-[200px] truncate text-xs text-slate-400" dir="ltr">{r.link.originalUrl}</p>
                          </td>
                          <td className={tdClass}>
                            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                              {REASON_LABELS[r.reason] ?? r.reason}
                            </span>
                          </td>
                          <td className={`${tdClass} max-w-[200px]`}>
                            <p className="truncate text-slate-500 dark:text-slate-400">{r.details || "—"}</p>
                          </td>
                          <td className={tdClass}>{new Date(r.createdAt).toLocaleDateString("ar")}</td>
                          <td className={tdClass}>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              r.status === "PENDING"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                : r.status === "ACCEPTED"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {r.status === "PENDING" ? "معلّق" : r.status === "ACCEPTED" ? "مقبول" : "مرفوض"}
                            </span>
                          </td>
                          <td className={`${tdClass} text-center`}>
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" onClick={() => resolveReport(r, "ACCEPTED")} className="rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/50">قبول</button>
                              <button type="button" onClick={() => resolveReport(r, "REJECTED")} className="rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">رفض</button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirm({
                                    title: "حذف بلاغ",
                                    message: "هل تريد حذف هذا البلاغ؟",
                                    action: () => runAction(() => deleteReport(r)),
                                  })
                                }
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== الكلمات المحجوزة ===== */}
        {tab === "aliases" && (
          <div className="max-w-lg">
            <form onSubmit={addAlias} className="flex gap-2">
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                placeholder="كلمة محجوزة جديدة (مثال: support)"
                className={inputClass}
                dir="ltr"
              />
              <button type="submit" className="h-11 shrink-0 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700">
                إضافة
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {aliases.map((a) => (
                <span key={a} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" dir="ltr">
                  {a}
                  <button type="button" onClick={() => removeAlias(a)} className="text-slate-400 transition hover:text-rose-500">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ===== الإعدادات ===== */}
        {tab === "settings" && (
          <div className="max-w-xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">إعدادات Rate Limit</h3>
              <p className="mt-1 text-xs text-slate-400">الحدود لكل عنوان IP خلال نافذة زمنية واحدة.</p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">إنشاء الروابط (لكل نافذة)</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.rate_limit_create ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, rate_limit_create: e.target.value }))}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">فتح الروابط المختصرة</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.rate_limit_lookup ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, rate_limit_lookup: e.target.value }))}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">محاولات الدخول/التسجيل</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.rate_limit_auth ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, rate_limit_auth: e.target.value }))}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">البلاغات</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.rate_limit_report ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, rate_limit_report: e.target.value }))}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">الحد العام لكل IP</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.rate_limit_global ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, rate_limit_global: e.target.value }))}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">النافذة الزمنية (بالثواني)</label>
                  <input
                    type="number"
                    min={1}
                    value={settings.window_seconds ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, window_seconds: e.target.value }))}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveSettings}
                  className={`h-12 w-full rounded-2xl text-sm font-bold text-white transition ${
                    settingsSaved ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {settingsSaved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        loading={busy}
        onConfirm={() => confirm?.action()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
