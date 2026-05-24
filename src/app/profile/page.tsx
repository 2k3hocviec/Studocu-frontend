import type { Metadata } from "next";
import { Field, SubmitButton } from "@/components/form-controls";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Hồ sơ cá nhân | HọcLiệu" };

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto grid max-w-4xl gap-6 px-6 py-10 md:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-white/5">
          <div className="mx-auto grid h-20 w-20 place-content-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-900/40">
            HL
          </div>
          <p className="mt-4 font-semibold text-slate-950 dark:text-white">Tài khoản của bạn</p>
          <p className="mt-1 text-sm text-slate-500">Thành viên</p>
        </aside>
        <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-white/10 dark:bg-white/5 sm:p-9">
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Hồ sơ cá nhân</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
            Cập nhật thông tin được hỗ trợ bởi API người dùng.
          </p>
          <form className="mt-8 space-y-5">
            <Field label="Họ và tên" name="fullName" placeholder="Nguyễn Văn An" autoComplete="name" minLength={2} />
            <Field label="Ảnh đại diện (URL)" name="avatarUrl" type="url" placeholder="https://example.com/avatar.jpg" required={false} />
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email
              <input
                type="email"
                value="ban@example.com"
                disabled
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal text-slate-500 dark:border-white/10 dark:bg-white/5"
              />
            </label>
            <SubmitButton>Lưu thay đổi</SubmitButton>
          </form>
        </section>
      </main>
    </div>
  );
}
