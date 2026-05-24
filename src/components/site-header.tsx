import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
          HọcLiệu
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="hidden text-sm font-medium text-slate-600 hover:text-emerald-700 sm:block dark:text-slate-300">
            Bảng giá
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
