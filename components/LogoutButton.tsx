"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const m = document.cookie.match(/(?:^|;\s*)qs_csrf=([^;]+)/);
    const csrf = m ? decodeURIComponent(m[1]) : "";
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: csrf ? { "x-csrf-token": csrf } : undefined,
    });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-rose-400"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      خروج
    </button>
  );
}
