import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const documentGroups = [
  {
    title: "Đề thi THPT Quốc gia",
    description: "Kho tài liệu đề thi thử, lời giải chi tiết qua các năm học.",
    quantity: "12,4k tài liệu",
    icon: "cap",
  },
  {
    title: "Giáo án môn Khoa học",
    description: "Cập nhật giáo án giảng dạy mới nhất cho giáo viên THCS & THPT.",
    quantity: "8,2k tài liệu",
    icon: "book",
  },
  {
    title: "Tài liệu Ngữ văn",
    description: "Phân tích tác phẩm, bài văn mẫu đạt điểm cao, tài liệu luyện thi.",
    quantity: "15,1k tài liệu",
    icon: "notes",
  },
] as const;

const stats = [
  { value: "500k+", label: "Tài liệu đã đăng" },
  { value: "50k+", label: "Thành viên năng động" },
  { value: "12M+", label: "Lượt tải tài liệu" },
  { value: "4.9/5", label: "Đánh giá người dùng" },
];

/** Icon minh họa nhóm tài liệu trên trang chủ. */
function DocumentIcon({ name }: { name: (typeof documentGroups)[number]["icon"] }) {
  if (name === "cap") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="m3.5 9.5 8.5-4 8.5 4-8.5 4-8.5-4Z" />
        <path d="M7 11.2v4.2c2.8 2.2 7.2 2.2 10 0v-4.2" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4.5 5.5h5.4a3 3 0 0 1 2.1.9 3 3 0 0 1 2.1-.9h5.4v12.2h-5.4a3 3 0 0 0-2.1.8 3 3 0 0 0-2.1-.8H4.5V5.5Z" />
        <path d="M12 6.4v12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 5h12M6 9h12M6 13h7M6 17h9" />
      <path d="m16 15.5 1.8 1.8 3.2-4" />
    </svg>
  );
}

/** SVG trang trí hình sách cho hero. */
function BookDecoration({ className, variant = "closed" }: { className: string; variant?: "closed" | "open" }) {
  if (variant === "open") {
    return (
      <svg aria-hidden="true" viewBox="0 0 140 100" className={className} fill="none">
        <path d="M68 20c-14-12-33-14-51-6v62c18-8 37-6 51 6V20Z" className="fill-emerald-100/70 dark:fill-emerald-900/35" />
        <path d="M72 20c14-12 33-14 51-6v62c-18-8-37-6-51 6V20Z" className="fill-sky-100/75 dark:fill-sky-900/35" />
        <path d="M70 20v64M20 26c14-4 28-2 42 6M120 26c-14-4-28-2-42 6M20 44c14-4 28-2 42 6M120 44c-14-4-28-2-42 6" className="stroke-emerald-700/25 dark:stroke-emerald-200/25" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className={className} fill="none">
      <rect x="26" y="14" width="60" height="82" rx="10" className="fill-emerald-100/80 dark:fill-emerald-900/40" />
      <rect x="38" y="22" width="60" height="82" rx="10" className="fill-white/80 dark:fill-slate-800/70" />
      <path d="M50 38h34M50 52h27M50 66h31" className="stroke-emerald-700/35 dark:stroke-emerald-200/35" strokeWidth="5" strokeLinecap="round" />
      <path d="M39 28v69" className="stroke-emerald-700/20 dark:stroke-emerald-200/20" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** Cụm hình trang trí nền của trang chủ. */
function HomeDecorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-900/25" />
      <div className="absolute right-0 top-[30rem] h-96 w-96 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25" />
      <BookDecoration variant="open" className="absolute left-8 top-28 hidden h-28 w-40 -rotate-12 opacity-80 md:block" />
      <BookDecoration className="absolute right-16 top-40 hidden h-28 w-28 rotate-12 opacity-75 lg:block" />
      <BookDecoration variant="open" className="absolute -left-6 top-[44rem] hidden h-24 w-36 rotate-6 opacity-70 lg:block" />
      <BookDecoration className="absolute bottom-36 right-8 hidden h-24 w-24 -rotate-12 opacity-65 md:block" />
    </div>
  );
}

/** Trang chủ giới thiệu và dẫn người dùng tới thư viện tài liệu. */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#121b17] dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />

      <main className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_88%_32%,rgba(14,165,233,0.14),transparent_26%),linear-gradient(180deg,#f8faf9_0%,#ffffff_42%,#f4faf7_100%)] dark:bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_88%_32%,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#020617_0%,#071410_45%,#020617_100%)]">
        <HomeDecorations />
        <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-16 text-center sm:pt-24">
          <span className="rounded-full bg-[#dfede7] px-4 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200">
            • Nền tảng tài liệu trực tuyến
          </span>
          <h1 className="mt-7 max-w-3xl text-balance text-4xl font-bold leading-[1.14] tracking-tight text-[#101613] sm:text-6xl">
            Đăng tải và chia sẻ tài liệu học tập dễ dàng
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
            Lưu trữ bài giảng, đề thi và ghi chú học tập của bạn trong một không gian
            đơn giản, thuận tiện và dễ sử dụng.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-[#006d45] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#005638]"
            >
              Bắt đầu ngay
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-medium text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
            >
              Xem gói Premium
            </Link>
          </div>

          <div className="mt-20 w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-[0_18px_46px_rgba(12,49,36,0.15)] ring-1 ring-emerald-900/5 dark:bg-slate-900 dark:shadow-[0_18px_46px_rgba(0,0,0,0.35)] dark:ring-white/10">
            <Image
              src="/images/hero-laptop.png"
              alt="Bảng điều khiển tài liệu hiển thị trên máy tính xách tay"
              width={1536}
              height={1024}
              priority
              className="h-auto w-full"
            />
          </div>
        </section>

        <section id="tai-lieu" className="relative z-10 mx-auto max-w-6xl scroll-mt-20 px-6 pb-24 pt-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Khám phá tài liệu</h2>
          <p className="mt-2 text-sm text-slate-500">Hàng ngàn tài liệu chất lượng mỗi ngày</p>
          <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
            {documentGroups.map((group) => (
              <Link
                key={group.title}
                href="/documents"
                className="group rounded-3xl border border-slate-100 bg-white/90 p-7 shadow-[0_1px_3px_rgba(15,23,42,0.03)] backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_10px_28px_rgba(12,49,36,0.08)] dark:border-white/10 dark:bg-slate-900/80 dark:hover:border-emerald-500/60 dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
              >
                <span className="inline-flex rounded-xl bg-[#dcece5] p-3 text-[#006d45] dark:bg-emerald-950/70 dark:text-emerald-300">
                  <DocumentIcon name={group.icon} />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{group.title}</h3>
                <p className="mt-3 min-h-[52px] text-sm leading-6 text-slate-500">{group.description}</p>
                <div className="mt-7 flex items-center justify-between">
                  <span className="rounded-full bg-[#e4f2ec] px-3 py-1 text-xs font-medium text-emerald-800">
                    {group.quantity}
                  </span>
                  <span aria-hidden className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-[#006d45]">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
          <div className="grid overflow-hidden rounded-[28px] bg-[#007c4c] text-white shadow-[0_16px_44px_rgba(0,109,69,0.16)] dark:bg-emerald-950 dark:shadow-[0_16px_44px_rgba(0,0,0,0.35)] lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col justify-center p-9 sm:p-14">
              <h2 className="max-w-sm text-3xl font-bold leading-tight sm:text-4xl">
                Bạn có tài liệu
                <br />
                muốn chia sẻ?
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-emerald-50/90">
                Tham gia cộng đồng 50.000+ giáo viên và học sinh đang chia sẻ tri thức tại HọcLiệu.
                Đóng góp công sức của bạn cho cộng đồng.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#06130f] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0d241c] focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                <span aria-hidden className="text-base leading-none">+</span> Đăng tải ngay
              </Link>
            </div>
            <div className="bg-[#00583f] p-4 sm:p-6">
              <Image
                src="/images/share-documents.png"
                alt="Nhóm sinh viên chia sẻ tài liệu học tập"
                width={1536}
                height={1024}
                className="h-full min-h-[290px] w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </section>

        <section className="relative z-10 border-y border-slate-200 bg-white/50 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-6 py-16 text-center md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-bold tracking-tight text-[#006d45]">{stat.value}</p>
                <p className="mt-3 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white/50 backdrop-blur dark:bg-slate-950/60">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-16">
          <div className="grid gap-10 border-b border-slate-200 pb-16 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-lg font-bold text-[#006d45]">HọcLiệu</p>
              <p className="mt-5 max-w-[225px] text-sm leading-6 text-slate-500">
                Nền tảng chia sẻ và lưu trữ tài liệu giáo dục hàng đầu Việt Nam. Nâng tầm tri thức mỗi ngày.
              </p>
              <div className="mt-6 flex gap-3 text-[#006d45]">
                <span className="rounded-full bg-emerald-50 px-3 py-2">◎</span>
                <span className="rounded-full bg-emerald-50 px-3 py-2">⊕</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Sản phẩm</p>
              <div className="mt-5 space-y-4 text-sm text-slate-500">
                <Link href="/documents" className="block transition hover:text-[#006d45]">Tài liệu miễn phí</Link>
                <Link href="/documents?type=EXAM" className="block transition hover:text-[#006d45]">Đề thi chọn lọc</Link>
                <Link href="/pricing" className="block transition hover:text-[#006d45]">Premium Account</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Công ty</p>
              <div className="mt-5 space-y-4 text-sm text-slate-500">
                <Link href="/about" className="block transition hover:text-[#006d45]">Về chúng tôi</Link>
                <Link href="/careers" className="block transition hover:text-[#006d45]">Tuyển dụng</Link>
                <Link href="/blog" className="block transition hover:text-[#006d45]">Blog tri thức</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Hỗ trợ</p>
              <div className="mt-5 space-y-4 text-sm text-slate-500">
                <Link href="/help" className="block transition hover:text-[#006d45]">Trợ giúp</Link>
                <Link href="/contact" className="block transition hover:text-[#006d45]">Liên hệ</Link>
                <Link href="/privacy" className="block transition hover:text-[#006d45]">Bảo mật</Link>
                <Link href="/terms" className="block transition hover:text-[#006d45]">Điều khoản</Link>
              </div>
            </div>
          </div>
          <p className="pt-8 text-center text-xs text-slate-400">
            © 2024 HọcLiệu. Nền tảng tài liệu trực tuyến. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
