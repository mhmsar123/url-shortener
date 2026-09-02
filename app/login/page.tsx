"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/client-api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await api("/api/auth/login", {
      method: "POST",
      json: { email, password },
    });

    setLoading(false);

    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      setError(res.error || "حدث خطأ");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
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
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        تسجيل الدخول
      </button>

      <p className="pt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">
          أنشئ حسابًا
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">تسجيل الدخول</h1>
        <p className="mt-2 mb-6 text-sm text-slate-500 dark:text-slate-400">
          مرحبًا بعودتك! سجّل دخولك لإدارة روابطك وإحصائياتك.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
