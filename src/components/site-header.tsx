"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type SiteHeaderProps = {
  authenticated?: boolean;
};

export function SiteHeader({ authenticated = false }: SiteHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"}/auth/logout`, {
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
      setIsMenuOpen(false);
      router.replace("/login");
    }
  }

  return (
    <header className="relative z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5 px-6">
        <Link href={authenticated ? "/user" : "/"} className="shrink-0 text-xl font-bold text-[#006d45]">
          HọcLiệu
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
            <button type="button" onClick={handleLogout} className="app-button-secondary app-button-compact">
              Đăng xuất
            </button>
          </nav>
        ) : (
          <>
            <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
              <Link href="/" className="border-b-2 border-[#006d45] py-5 font-medium text-[#006d45]">
                Trang chủ
              </Link>
              <Link href="/#tai-lieu" className="transition hover:text-[#006d45]">Khóa học</Link>
              <Link href="/#tai-lieu" className="transition hover:text-[#006d45]">Đề thi</Link>
              <Link href="/#tai-lieu" className="transition hover:text-[#006d45]">Tài liệu</Link>
              <Link href="/pricing" className="transition hover:text-[#006d45]">Cài đặt</Link>
            </nav>
            <div className="hidden items-center gap-4 md:flex">
              <label className="hidden items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-400 lg:flex">
                <span aria-hidden>⌕</span>
                <input
                  type="search"
                  placeholder="Tìm tài liệu..."
                  className="w-28 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
              <Link href="/login" className="app-button-primary app-button-compact">
                Đăng nhập
              </Link>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-content-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-700 hover:text-emerald-700 md:hidden"
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
        <nav className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-4 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            {authenticated ? (
              <>
                <Link href="/user/upload" onClick={() => setIsMenuOpen(false)} className="app-button-primary w-full">+ Đăng bài</Link>
                <Link href="/user" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">Tài liệu</Link>
                <Link href="/user/upgrade" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">Nâng cấp Premium</Link>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">Hồ sơ cá nhân</Link>
                <button type="button" onClick={handleLogout} className="app-button-secondary w-full">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">Trang chủ</Link>
                <Link href="/#tai-lieu" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">Tài liệu</Link>
                <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="app-button-secondary w-full">Gói Premium</Link>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="app-button-primary w-full">Đăng nhập</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
