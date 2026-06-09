"use client";

import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DocumentUploadForm } from "@/components/document-upload-form";

export default function UploadPage() {
  const router = useRouter();

  const handleSuccess = () => {
    setTimeout(() => {
      router.push("/user");
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <SiteHeader authenticated />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-950 dark:text-white">Đăng tài liệu mới</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Chia sẻ tài liệu học tập của bạn với cộng đồng
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-2xl">★</div>
              <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">Nhận credit</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">+2 credit khi tài liệu được duyệt</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-2xl">✓</div>
              <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">Duyệt nhanh</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Admin duyệt trong 24 giờ</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-2xl">◆</div>
              <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">An toàn</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Bảo vệ bản quyền tài liệu</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
            <DocumentUploadForm onSuccess={handleSuccess} />
          </div>

          <div className="mt-8 rounded-xl bg-blue-50 p-6 dark:bg-blue-950/20">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Hướng dẫn đăng tài liệu</h3>
            <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>✓ Nội dung phải hợp pháp và không vi phạm bản quyền</li>
              <li>✓ Tài liệu phải liên quan đến học tập</li>
              <li>✓ Tên tài liệu phải rõ ràng, dễ tìm kiếm</li>
              <li>✓ File hỗ trợ: PDF, Word, PowerPoint, tối đa 20MB</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 dark:border-white/10 dark:bg-slate-950/50">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© 2024 HọcLiệu - Nền tảng chia sẻ tài liệu học tập</p>
        </div>
      </footer>
    </div>
  );
}
