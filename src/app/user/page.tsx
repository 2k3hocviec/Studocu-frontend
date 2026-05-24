import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Trang người dùng | HọcLiệu" };

export default function UserPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">User</p>
      <h1 className="mt-4 text-4xl font-bold text-slate-950 dark:text-white">Trang người dùng</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">Bạn đã đăng nhập thành công.</p>
      <Link href="/" className="mt-8 rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white">
        Về trang chủ
      </Link>
    </main>
  );
}
