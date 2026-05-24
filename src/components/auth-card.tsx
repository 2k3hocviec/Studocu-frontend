import Link from "next/link";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footnote?: React.ReactNode;
};

export function AuthCard({ title, description, children, footnote }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="px-6 py-7">
        <Link href="/" className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
          HọcLiệu
        </Link>
      </header>
      <main className="mx-auto max-w-md px-6 pb-12 pt-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-9">
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
          {children}
          {footnote && <div className="mt-7 text-center text-sm text-slate-500 dark:text-slate-300">{footnote}</div>}
        </div>
      </main>
    </div>
  );
}
