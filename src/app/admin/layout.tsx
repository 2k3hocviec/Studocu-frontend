"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { getValidAccessToken, logoutSession } from "@/utils/api";

type TokenPayload = {
  email?: string;
  role?: "USER" | "ADMIN";
  userId?: number;
};

/** Đọc payload cơ bản từ access token để kiểm tra quyền admin. */
function readTokenPayload(accessToken: string): TokenPayload | null {
  try {
    const segment = accessToken.split(".")[1];
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

/** Layout bảo vệ và điều hướng khu vực admin. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = await getValidAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const payload = readTokenPayload(token);
      if (!payload || payload.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      setAdminEmail(payload.email ?? "admin@hoclieu.vn");
      setAdminRole(payload.role ?? "ADMIN");
      setIsAuthenticated(true);
    }
    checkAuth();
  }, [router]);

  /** Xóa phiên đăng nhập và đưa user về trang login. */
  const handleLogout = async () => {
    await logoutSession();
    router.push("/login");
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      name: "Tổng quan (Dashboard)",
      path: "/admin",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: "Quản lý Tài liệu",
      path: "/admin/documents",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Báo cáo Vi phạm",
      path: "/admin/reports",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      name: "Thành viên",
      path: "/admin/users",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: "Trường học",
      path: "/admin/schools",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: "Môn học",
      path: "/admin/subjects",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      ) : null}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[86vw] flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-2xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:w-60 lg:translate-x-0 lg:shadow-none xl:w-64 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-8 px-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              HọcLiệu <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 xl:px-4 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="mb-4 flex items-center space-x-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <span className="text-xs font-bold">{adminRole.substring(0, 2)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{adminEmail}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {adminRole}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-60 xl:pl-64">
        <header className="sticky top-0 z-10 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 sm:px-6 xl:px-8">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="grid h-10 w-10 shrink-0 place-content-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 lg:hidden"
            aria-label="Mở menu quản trị"
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
          <h2 className="min-w-0 truncate text-sm font-bold text-slate-500 dark:text-slate-400">
            {menuItems.find((item) => item.path === pathname)?.name ?? "Hệ thống quản trị"}
          </h2>
          <div className="flex shrink-0 items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <span className="hidden items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 sm:inline-flex">
              Chế độ quản trị viên
            </span>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
