import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader />

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center sm:py-28">
        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          Nền tảng tài liệu trực tuyến
        </span>
        <h1 className="mt-7 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
          Đăng tải và chia sẻ tài liệu học tập dễ dàng
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Lưu trữ bài giảng, đề thi và ghi chú học tập của bạn trong một không
          gian đơn giản, thuận tiện và dễ sử dụng.
        </p>
        <Link
          href="/register"
          className="mt-10 rounded-full bg-emerald-700 px-7 py-3.5 font-semibold text-white transition hover:bg-emerald-800"
        >
          Bắt đầu ngay
        </Link>
      </main>
    </div>
  );
}
