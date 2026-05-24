import Link from "next/link";

type SiteHeaderProps = {
  authenticated?: boolean;
};

export function SiteHeader({ authenticated = false }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href={authenticated ? "/user" : "/"} className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
          HọcLiệu
        </Link>
        <div className="flex items-center gap-4">
          {authenticated ? (
            <>
              <Link href="/user/upgrade" className="hidden text-sm font-medium text-slate-600 hover:text-emerald-700 sm:block dark:text-slate-300">
                Nâng cấp
              </Link>
              <Link
                href="/user"
                className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Về trang tài liệu
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
