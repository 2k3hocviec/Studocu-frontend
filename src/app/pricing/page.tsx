import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Bảng giá | HọcLiệu" };

const plans = [
  { id: 1, name: "Cơ bản", price: "49.000", days: 30, downloads: 20 },
  { id: 2, name: "Sinh viên", price: "99.000", days: 90, downloads: 100, featured: true },
  { id: 3, name: "Học kỳ", price: "169.000", days: 180, downloads: 300 },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Gói thành viên</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-950 dark:text-white">Chọn gói học phù hợp</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-slate-300">
          API lấy danh sách gói từ <code>/subscriptions/plans</code> và tạo thanh toán với phương thức bạn chọn.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <form
              key={plan.id}
              className={`rounded-3xl border bg-white p-7 text-left shadow-sm dark:bg-white/5 ${
                plan.featured ? "border-emerald-600 ring-2 ring-emerald-600/15" : "border-slate-200 dark:border-white/10"
              }`}
            >
              <input type="hidden" name="planId" value={plan.id} />
              {plan.featured && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Phổ biến</span>}
              <h2 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">{plan.name}</h2>
              <p className="mt-4 text-4xl font-bold text-emerald-700 dark:text-emerald-400">
                {plan.price}đ
              </p>
              <p className="mt-2 text-sm text-slate-500">{plan.days} ngày sử dụng</p>
              <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                {plan.downloads} lượt tải tài liệu
              </p>
              <label className="mt-6 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Phương thức thanh toán
                <select name="method" defaultValue="VNPAY" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-3 dark:border-white/10">
                  <option value="VNPAY">VNPAY</option>
                  <option value="MOMO">MOMO</option>
                  <option value="MOCK">MOCK (phát triển)</option>
                </select>
              </label>
              <button type="button" className="mt-6 h-12 w-full rounded-xl bg-emerald-700 font-semibold text-white transition hover:bg-emerald-800">
                Chọn gói
              </button>
            </form>
          ))}
        </div>
      </main>
    </div>
  );
}
