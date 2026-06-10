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
  function HKHLogo() {
    return (
      <span className="flex items-center gap-3" aria-label="HKH Kho Tài Liệu Số">

        {/* ── Icon sách + lá cây ── */}
        <span className="relative shrink-0">
          <svg
            viewBox="0 0 118 130"
            className="h-10 w-10"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hkh-spine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="hkh-spine-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="hkh-cover" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#bae6fd" />
              </linearGradient>
              <linearGradient id="hkh-cover-dark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="100%" stopColor="#164e63" />
              </linearGradient>
              <linearGradient id="hkh-page" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
              <linearGradient id="hkh-leaf" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="hkh-leaf-dark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
            </defs>

            {/* Gáy sách */}
            <rect
              x="4" y="8" width="9" height="86" rx="2"
              className="fill-[url(#hkh-spine)] dark:fill-[url(#hkh-spine-dark)]"
            />

            {/* Bìa sách */}
            <rect
              x="13" y="2" width="74" height="92" rx="4"
              className="fill-[url(#hkh-cover)] stroke-sky-300 dark:fill-[url(#hkh-cover-dark)] dark:stroke-sky-400"
              strokeWidth="0.8"
            />

            {/* Trang sách */}
            <rect
              x="15" y="4" width="68" height="88" rx="3"
              className="fill-[url(#hkh-page)] dark:fill-slate-900"
            />

            {/* Dòng kẻ trang */}
            <rect x="20" y="14" width="42" height="2.5" rx="1.2" className="fill-slate-300 dark:fill-slate-600" />
            <rect x="20" y="21" width="52" height="2.5" rx="1.2" className="fill-slate-200 dark:fill-slate-700" />
            <rect x="20" y="28" width="38" height="2.5" rx="1.2" className="fill-slate-200 dark:fill-slate-700" />
            <rect x="20" y="35" width="48" height="2.5" rx="1.2" className="fill-slate-200 dark:fill-slate-700" />
            <rect x="20" y="42" width="34" height="2.5" rx="1.2" className="fill-slate-200 dark:fill-slate-700" />
            <rect x="20" y="49" width="44" height="2.5" rx="1.2" className="fill-slate-200 dark:fill-slate-700" />

            {/* Thanh màu dưới bìa */}
            <rect x="13" y="90" width="74" height="8" rx="2" className="fill-sky-700 dark:fill-sky-500" />

            {/* Lá cây */}
            <path
              d="M68 76 Q80 42 102 30 Q100 54 85 68 Q97 64 106 57 Q104 78 80 84 Q73 86 68 76Z"
              className="fill-[url(#hkh-leaf)] dark:fill-[url(#hkh-leaf-dark)]"
              opacity="0.93"
            />
            {/* Gân lá chính */}
            <path
              d="M68 76 Q84 58 102 30"
              className="stroke-green-700 dark:stroke-green-400"
              strokeWidth="1.2" fill="none" strokeLinecap="round"
            />
            {/* Gân lá phụ */}
            <path
              d="M76 72 Q86 57 97 40"
              className="stroke-green-300 dark:stroke-green-200"
              strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.65"
            />

            {/* Chữ HKH */}
            <text
              x="50" y="118"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontSize="19"
              fontWeight="700"
              letterSpacing="5"
              className="fill-sky-700 dark:fill-sky-300"
            />
            <text
              x="50" y="118"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontSize="19"
              fontWeight="700"
              letterSpacing="5"
              fill="currentColor"
              className="text-sky-700 dark:text-sky-300"
            >HKH</text>

            {/* Gạch dưới HKH */}
            <line
              x1="15" y1="122" x2="85" y2="122"
              className="stroke-sky-500 dark:stroke-sky-400"
              strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
        </span>

        {/* ── Đường kẻ dọc phân cách ── */}
        <span className="hidden h-9 w-px shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 sm:block" />

        {/* ── Tên thương hiệu ── */}
        <span className="hidden flex-col gap-1 sm:flex">
          <span className="block text-[12px] font-black tracking-[0.14em] text-slate-800 dark:text-slate-100">
            KHO TÀI LIỆU SỐ
          </span>
          <span className="block h-0.5 w-full rounded-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 dark:from-sky-400 dark:via-teal-400 dark:to-emerald-400" />
        </span>

      </span>
    );
  }

  return <HKHLogo />;
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
      // Vẫn xóa phiên cục bộ để đăng xuất người dùng khi API không khả dụng.
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
