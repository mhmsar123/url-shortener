import Link from "next/link";
import { getSession } from "@/lib/auth";
import NavMenu from "./NavMenu";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";
import Logo from "./Logo";

export default async function Header() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const items = session
    ? [
        { href: "/", label: "الرئيسية" },
        { href: "/create", label: "إنشاء رابط" },
        { href: "/dashboard", label: "روابطي" },
        ...(isAdmin ? [{ href: "/admin", label: "الإدارة" }] : []),
      ]
    : [
        { href: "/", label: "الرئيسية" },
        { href: "/dashboard", label: "روابطي" },
        { href: "/login", label: "تسجيل الدخول" },
        { href: "/register", label: "إنشاء حساب" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="قصّار - الصفحة الرئيسية">
          <Logo />
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            قَصَّار
          </span>
        </Link>

        <div className="flex items-center gap-2 relative">
          <NavMenu items={items} />
          <ThemeToggle />
          {session && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
