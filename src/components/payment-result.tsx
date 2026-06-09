import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

type PaymentResultProps = {
  success: boolean;
};

export function PaymentResult({ success }: PaymentResultProps) {
  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      <SiteHeader authenticated />
      <main className="profile-pattern mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center px-6 py-20 text-center">
        <span
          className={`grid h-20 w-20 place-content-center rounded-full text-4xl font-bold ${
            success ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {success ? "✓" : "!"}
        </span>
        <h1 className="mt-7 text-3xl font-bold text-slate-950">
          {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {success
            ? "Gói thành viên đã được kích hoạt. Bạn có thể bắt đầu tải tài liệu."
            : "Giao dịch chưa hoàn tất. Vui lòng kiểm tra lại hoặc thử một phương thức khác."}
        </p>
        <div className="mt-9 flex w-full flex-col gap-3 sm:flex-row">
          {!success && (
            <Link href="/user/upgrade" className="app-button-secondary flex-1">
              Thử thanh toán lại
            </Link>
          )}
          <Link href="/user" className="app-button-primary flex-1">
            Về trang tài liệu
          </Link>
        </div>
      </main>
    </div>
  );
}
