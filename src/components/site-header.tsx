"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PremiumBadge } from "@/components/premium-badge";
import { ThemeToggle } from "@/components/theme-toggle";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type SiteHeaderProps = {
  authenticated?: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
};

type Subscription = {
  id: number;
  endDate: string;
} | null;

function DigitalLibraryLogo() {
  return (
    <span className="flex items-center gap-2.5" aria-label="Kho tài liệu số">
      <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
        <svg viewBox="0 0 120 120" className="h-11 w-11" fill="none" aria-hidden="true">
          <path
            d="M92 25a45 45 0 0 1 11 22M102 71a45 45 0 0 1-29 30M47 102a45 45 0 0 1-29-28M18 47a45 45 0 0 1 29-29M62 17a45 45 0 0 1 23 6"
            className="stroke-sky-700 dark:stroke-sky-300"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M25 76c14-8 29-8 42 0 11-8 24-9 37-3v11c-13-5-26-4-37 3-13-8-28-8-42 0V76Z"
            className="fill-emerald-700 dark:fill-emerald-300"
          />
          <path
            d="M34 46v29M55 40v35M82 46v29M96 46v29"
            className="stroke-teal-700 dark:stroke-teal-300"
            strokeWidth="9"
            strokeLinecap="square"
          />
          <path
            d="M42 66 56 75 78 58 93 29"
            className="stroke-teal-800 dark:stroke-teal-200"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M63 58c-2-15 8-26 24-25 5 8 4 17-2 25"
            className="stroke-teal-800 dark:stroke-teal-200"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M87 33c6-10 14-15 24-15-1 13-5 21-14 27 8-1 15 1 21 5-8 8-18 10-30 6"
            className="stroke-teal-800 dark:stroke-teal-200"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="hidden leading-none sm:block">
        <span className="block text-[15px] font-black tracking-[0.16em] text-slate-800 dark:text-slate-100">
          KHO TÀI LIỆU SỐ
        </span>
        <span className="mt-1 block h-0.5 w-full rounded-full bg-gradient-to-r from-sky-700 via-teal-600 to-emerald-600 dark:from-sky-300 dark:via-teal-300 dark:to-emerald-300" />
      </span>
    </span>
  );
}

export function SiteHeader({ authenticated = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);

  const publicNavItems = [
    { href: "/", label: "Trang chủ", active: pathname === "/" },
    { href: "/documents", label: "Tài liệu", active: pathname.startsWith("/documents") },
    { href: "/pricing", label: "Gói Premium", active: pathname === "/pricing" },
  ];

  const publicLinkClass = (active: boolean) =>
    active
      ? "border-b-2 border-[#006d45] py-5 font-medium text-[#006d45] dark:border-emerald-400 dark:text-emerald-400"
      : "py-5 transition hover:text-[#006d45] dark:hover:text-emerald-400";

  useEffect(() => {
    if (!authenticated) {
      setHasPremium(false);
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    let cancelled = false;
    fetch(`${apiUrl}/subscriptions/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const result = (await response.json()) as ApiResponse<Subscription>;
        return result.success ? result.data ?? null : null;
      })
      .then((subscription) => {
        if (!cancelled) setHasPremium(Boolean(subscription));
      })
      .catch(() => {
        if (!cancelled) setHasPremium(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Local session cleanup still logs the user out if the API is unavailable.
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setHasPremium(false);
      setIsMenuOpen(false);
      router.replace("/login");
    }
  }

  return (
    <header className="relative z-30 border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5 px-6">
        <Link href={authenticated ? "/user" : "/"} className="flex shrink-0 items-center gap-2">
          <DigitalLibraryLogo />
          {hasPremium ? <PremiumBadge compact /> : null}
        </Link>

        {authenticated ? (
          <nav className="hidden items-center gap-3 md:flex">
            <Link href="/user/upload" className="app-button-primary app-button-compact">
              + Đăng bài
            </Link>
            <Link href="/user/upgrade" className="app-button-secondary app-button-compact">
              Nâng cấp
            </Link>
            <Link href="/user" className="app-button-secondary app-button-compact">
              Tài liệu
            </Link>
            <Link href="/profile" className="app-button-secondary app-button-compact">
              Hồ sơ cá nhân
            </Link>
            <ThemeToggle />
            <button type="button" onClick={handleLogout} className="app-button-secondary app-button-compact">
              Đăng xuất
            </button>
          </nav>
        ) : (
          <>
            <nav className="hidden items-center gap-8 text-sm text-slate-500 dark:text-slate-300 md:flex">
              {publicNavItems.map((item) => (
                <Link key={item.href} href={item.href} className={publicLinkClass(item.active)}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-4 md:flex">
              <ThemeToggle />
              <Link href="/login" className="app-button-primary app-button-compact">
                Đăng nhập
              </Link>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-content-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-700 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300 md:hidden"
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isMenuOpen}
        >
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>

      {isMenuOpen && (
        <nav className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-slate-950 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
            {authenticated ? (
              <>
                <Link href="/user/upload" onClick={() => setIsMenuOpen(false)} className="app-button-primary w-full">
                  + Đăng bài
                </Link>
                <Link href="/user" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">
                  Tài liệu
                </Link>
                <Link href="/user/upgrade" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">
                  Nâng cấp Premium
                </Link>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">
                  Hồ sơ cá nhân
                </Link>
                <button type="button" onClick={handleLogout} className="app-button-secondary w-full">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                {publicNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={item.active ? "app-button-primary w-full" : "app-button-secondary w-full"}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="app-button-primary w-full">
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
