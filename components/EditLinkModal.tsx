"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";

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

export default function EditLinkModal({
  link,
  onClose,
  onSaved,
}: {
  link: LinkItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [alias, setAlias] = useState(link.customAlias ?? "");
  const [title, setTitle] = useState(link.title ?? "");
  const [expiry, setExpiry] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [aliasStatus, setAliasStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onClose]);

  function checkAlias(value: string) {
    if (timer.current) clearTimeout(timer.current);
    const v = value.trim().toLowerCase();
    if (!v || v === link.customAlias) {
      setAliasStatus("idle");
      return;
    }
    if (!/^[a-z0-9-_]{3,32}$/.test(v)) {
      setAliasStatus("taken");
      return;
    }
    setAliasStatus("checking");
    timer.current = setTimeout(async () => {
      const res = await api<{ available: boolean }>(`/api/aliases/check?alias=${encodeURIComponent(v)}`);
      setAliasStatus(res.ok && res.data?.available ? "available" : "taken");
    }, 400);
  }

  async function save() {
    setError("");
    setSaving(true);

    let expiresAt: string | null = null;
    if (expiry === "custom" && customDate) {
      expiresAt = new Date(customDate).toISOString();
    } else if (expiry === "1d" || expiry === "7d" || expiry === "30d") {
      const ms = expiry === "1d" ? 86400000 : expiry === "7d" ? 604800000 : 2592000000;
      expiresAt = new Date(Date.now() + ms).toISOString();
    } else if (expiry === "") {
      expiresAt = null;
    }

    const res = await api(`/api/links/${link.id}`, {
      method: "PATCH",
      json: {
        alias: alias.trim().toLowerCase(),
        title,
        expiresAt,
      },
    });

    setSaving(false);

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      setError(res.error || "حدث خطأ");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-fade-in-up w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">تعديل الرابط</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              الاسم المخصص (Alias) — فارغ يعني كودًا عشوائيًا
            </label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-slate-400" dir="ltr">
                {typeof window !== "undefined" ? window.location.origin : ""}/
              </span>
              <input
                type="text"
                dir="ltr"
                value={alias}
                onChange={(e) => {
                  setAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""));
                  checkAlias(e.target.value);
                }}
                placeholder="my-link"
                className={inputClass}
              />
            </div>
            {aliasStatus !== "idle" && (
              <p
                className={`mt-1.5 text-xs font-medium ${
                  aliasStatus === "available"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : aliasStatus === "checking"
                      ? "text-slate-400"
                      : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {aliasStatus === "available" && "الاسم متاح ✓"}
                {aliasStatus === "checking" && "جارٍ الفحص…"}
                {aliasStatus === "taken" && "هذا الاسم مستخدم بالفعل، اختر اسمًا آخر."}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">العنوان (اختياري)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="وصف قصير للرابط" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">تاريخ الانتهاء</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className={inputClass}
              >
                <option value="">بدون انتهاء</option>
                <option value="1d">بعد يوم</option>
                <option value="7d">بعد أسبوع</option>
                <option value="30d">بعد شهر</option>
                <option value="custom">تاريخ مخصص</option>
              </select>
              {expiry === "custom" && (
                <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className={inputClass} />
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-11 rounded-2xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "جارٍ الحفظ…" : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
