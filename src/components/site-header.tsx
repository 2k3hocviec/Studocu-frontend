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
          <span className="text-xl font-bold text-[#006d45] dark:text-emerald-400">HọcLiệu</span>
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
