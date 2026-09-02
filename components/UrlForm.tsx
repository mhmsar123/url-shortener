"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { EXPIRY_OPTIONS } from "@/lib/constants";
import Turnstile, { getTurnstileToken } from "./Turnstile";
import ResultBox from "./ResultBox";

type CreateResult = {
  id: string;
  shortUrl: string;
  code: string;
  originalUrl: string;
  expiresAt?: string | null;
};

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiry, setExpiry] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [aliasStatus, setAliasStatus] = useState<{
    state: "idle" | "checking" | "available" | "taken" | "invalid";
    message?: string;
  }>({ state: "idle" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);
  const aliasTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnstileId = useRef(`ts-${Math.random().toString(36).slice(2)}`).current;

  const checkAlias = useCallback((value: string) => {
    if (aliasTimer.current) clearTimeout(aliasTimer.current);
    const v = value.trim().toLowerCase();
    if (!v) {
      setAliasStatus({ state: "idle" });
      return;
    }
    setAliasStatus({ state: "checking" });
    aliasTimer.current = setTimeout(async () => {
      const res = await api<{ available: boolean; message: string }>(
        `/api/aliases/check?alias=${encodeURIComponent(v)}`
      );
      if (res.ok && res.data) {
        setAliasStatus({
          state: res.data.available ? "available" : "taken",
          message: res.data.message,
        });
      } else {
        setAliasStatus({ state: "idle" });
      }
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (aliasTimer.current) clearTimeout(aliasTimer.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = url.trim();
    if (!trimmed) {
      setError("الصق الرابط الطويل أولًا");
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("الرابط يجب أن يبدأ بـ http:// أو https://");
      return;
    }

    // إذا كان CAPTCHA مفعلًا يجب إكماله
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      const token = getTurnstileToken(turnstileId);
      if (!token) {
        setError("أكمل التحقق الأمني أولًا");
        return;
      }
    }

    setLoading(true);

    let expiresAt: string | null = null;
    if (expiry === "custom") {
      if (customDate) expiresAt = new Date(customDate).toISOString();
    } else if (expiry) {
      const ms =
        expiry === "1d" ? 86400000 : expiry === "7d" ? 604800000 : expiry === "30d" ? 2592000000 : 0;
      expiresAt = new Date(Date.now() + ms).toISOString();
    }

    const res = await api<CreateResult>("/api/links", {
      method: "POST",
      json: {
        originalUrl: trimmed,
        alias: alias.trim().toLowerCase(),
        expiresAt,
      },
    });

    setLoading(false);

    if (res.ok && res.data) {
      setResult(res.data);
      setUrl("");
      setAlias("");
      setExpiry("");
      setCustomDate("");
      setAliasStatus({ state: "idle" });
    } else {
      setError(res.error || "حدث خطأ غير متوقع");
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pl-3 pr-4 text-slate-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            <input
              type="text"
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="الصق الرابط الطويل هنا…"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-12 pl-4 text-left text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-950"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 px-8 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            )}
            اختصر الرابط
          </button>
        </div>

        {/* خيارات متقدمة */}
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800">
          <div>
            <label htmlFor="alias" className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              هل تريد تخصيص الرابط؟ (اختياري)
            </label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-slate-400" dir="ltr">
                {typeof window !== "undefined" ? window.location.origin : ""}/
              </span>
              <input
                id="alias"
                type="text"
                dir="ltr"
                value={alias}
                onChange={(e) => {
                  setAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""));
                  checkAlias(e.target.value);
                }}
                placeholder="my-link"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
              />
            </div>
            {aliasStatus.state !== "idle" && (
              <p
                className={`mt-1.5 text-xs font-medium ${
                  aliasStatus.state === "available"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : aliasStatus.state === "taken" || aliasStatus.state === "invalid"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-400"
                }`}
              >
                {aliasStatus.state === "checking" && "جارٍ الفحص…"}
                {aliasStatus.state === "available" && (aliasStatus.message || "الاسم متاح ✓")}
                {aliasStatus.state === "taken" && (aliasStatus.message || "الاسم مستخدم بالفعل")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="expiry" className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              تاريخ انتهاء الرابط (اختياري)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                id="expiry"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {expiry === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              )}
            </div>
          </div>
        </div>

        <Turnstile id={turnstileId} />

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            {error}
          </p>
        )}
      </form>

      {result && <ResultBox result={result} />}
    </div>
  );
}
