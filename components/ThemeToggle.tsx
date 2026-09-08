"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "gray" | "dark";

const ORDER: Theme[] = ["light", "gray", "dark"];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "gray");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "gray") root.classList.add("gray");
  try {
    localStorage.setItem("qs-theme", theme);
  } catch {
    /* ignore */
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) setTheme("dark");
    else if (root.classList.contains("gray")) setTheme("gray");
    else setTheme("light");
  }, []);

  function toggle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
  }

  const label = theme === "dark" ? "الوضع الليلي" : theme === "gray" ? "الوضع الرمادي" : "الوضع النهاري";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`تبديل المظهر (الحالي: ${label})`}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-300"
    >
      {theme === "light" && (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {theme === "gray" && (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="9" fill="#9ca3af" stroke="currentColor" strokeWidth="2" />
          <path d="M12 3a9 9 0 0 1 0 18z" fill="#4b5563" />
        </svg>
      )}
      {theme === "dark" && (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
