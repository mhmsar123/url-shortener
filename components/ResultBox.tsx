"use client";

import Link from "next/link";
import { useState } from "react";
import QrModal from "./QrModal";

type ResultProps = {
  result: {
    id: string;
    shortUrl: string;
    code: string;
    originalUrl: string;
    expiresAt?: string | null;
  };
};

export default function ResultBox({ result }: ResultProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = result.shortUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "رابط مختصر", url: result.shortUrl });
        return;
      } catch {
        /* ألغى المستخدم المشاركة */
      }
    }
    copy();
  }

  return (
    <div className="animate-fade-in-up mt-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
        <p className="text-sm font-bold">تم اختصار الرابط بنجاح ✓</p>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 rounded-2xl border border-emerald-200 bg-white px-4 py-3 dark:border-emerald-900 dark:bg-slate-900">
          <a
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-left text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            dir="ltr"
          >
            {result.shortUrl}
          </a>
          <p className="mt-1 block truncate text-xs text-slate-400" dir="ltr">
            {result.originalUrl}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition sm:flex-none ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            }`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                تم النسخ!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                نسخ الرابط
              </>
            )}
          </button>

          <button
            type="button"
            onClick={share}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
            مشاركة
          </button>

          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M21 14v.01M14 21h.01M18 18h.01" />
            </svg>
            QR Code
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Link
          href={`/report/${encodeURIComponent(result.code)}`}
          className="text-xs font-medium text-slate-400 transition hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
        >
          الإبلاغ عن هذا الرابط
        </Link>
        {result.expiresAt && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            ينتهي في: {new Date(result.expiresAt).toLocaleDateString("ar")}
          </span>
        )}
      </div>

      {qrOpen && <QrModal url={result.shortUrl} onClose={() => setQrOpen(false)} />}
    </div>
  );
}
