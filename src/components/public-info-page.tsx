import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

type InfoItem = {
  title: string;
  description: string;
};

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: InfoItem[];
  action?: {
    href: string;
    label: string;
  };
};

export function PublicInfoPage({ eyebrow, title, description, items, action }: PublicInfoPageProps) {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#121b17] dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-6 py-14 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#006d45] dark:text-emerald-300">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
            </article>
          ))}
        </section>

        {action ? (
          <Link href={action.href} className="mt-10 inline-flex rounded-full bg-[#006d45] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005638]">
            {action.label}
          </Link>
        ) : null}
      </main>
    </div>
  );
}
