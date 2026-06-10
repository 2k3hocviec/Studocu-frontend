import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footnote?: React.ReactNode;
};

/** Khung giao diện dùng chung cho các màn hình xác thực. */
export function AuthCard({ title, description, children, footnote }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-9">
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
          {children}
          {footnote && <div className="mt-7 text-center text-sm text-slate-500 dark:text-slate-300">{footnote}</div>}
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white px-6 py-8 dark:border-white/10 dark:bg-slate-950/50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Link href="/" className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              HọcLiệu
            </Link>
          </div>
          <p className="mb-6 text-center text-xs text-slate-500 dark:text-slate-400">
            © 2024 HọcLiệu. Nền tảng tài liệu trực tuyến.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-xs text-slate-600 dark:text-slate-300">
            <Link href="/about" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Về chúng tôi
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Link href="/terms" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Điều khoản
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Link href="/report" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Báo một
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Link href="/contact" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Liên hệ
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Link href="/help" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Trợ giúp
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Link href="/careers" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Tuyên dụng
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
