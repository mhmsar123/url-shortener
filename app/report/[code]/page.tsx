"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { REPORT_REASONS } from "@/lib/constants";

export default function ReportPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code || "");

  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!reason) {
      setError("اختر سبب الإبلاغ أولًا");
      return;
    }
    setLoading(true);
    const res = await api("/api/report", {
      method: "POST",
      json: { code, reason, details },
    });
    setLoading(false);

    if (res.ok) {
      setDone(true);
    } else {
      setError(res.error || "حدث خطأ");
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white">تم استلام بلاغك</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          شكرًا لك. سيقوم فريق الإدارة بمراجعة البلاغ خلال أقرب وقت.
        </p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white transition hover:bg-indigo-700">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">الإبلاغ عن رابط</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          الإبلاغ عن رابط قصير يساعد في الحفاظ على الخدمة آمنة للجميع.
        </p>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" dir="ltr">
          /{code}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">سبب الإبلاغ</label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    reason === r.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">تفاصيل إضافية (اختياري)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="اكتب أي تفاصيل تساعد في المراجعة…"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? "جارٍ الإرسال…" : "إرسال البلاغ"}
          </button>
        </form>
      </div>
    </div>
  );
}
