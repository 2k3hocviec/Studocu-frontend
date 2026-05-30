"use client";

import { useEffect, useState } from "react";
import { DocumentViewer } from "@/components/document-viewer";
import { apiFetch, getValidAccessToken } from "@/utils/api";
import { reportReasonLabel } from "@/utils/report-reasons";

type ReportStatus = "PENDING" | "RESOLVED" | "REJECTED";

type ReportItem = {
  id: number;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
  handledAt?: string | null;
  reporter: { fullName: string; email: string };
  document: { id: number; title: string };
  handler?: { fullName: string } | null;
};

type ReportDetail = Omit<ReportItem, "document" | "handler"> & {
  handler?: { id: number; fullName: string } | null;
  document: {
    id: number;
    title: string;
    description?: string | null;
    status: string;
    documentType: string;
    viewCount: number;
    downloadCount: number;
    rejectReason?: string | null;
    createdAt: string;
    uploader: { id: number; fullName: string };
    school: { id: number; name: string };
    subject: { id: number; name: string };
    documentFile?: {
      fileType: "PDF" | "DOCX" | "PPTX";
      totalPages?: number | null;
    } | null;
    previews: Array<{ id: number; pageNumber: number; imageUrl: string; isBlurred: boolean }>;
  };
};

type PageMeta = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
};

type APIResponse = {
  success: boolean;
  message?: string;
  data: {
    items: ReportItem[];
    meta?: PageMeta;
    pagination?: { total: number; totalPages: number; page: number };
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

function normalizeMeta(data: APIResponse["data"]): PageMeta {
  if (data.meta) return data.meta;
  return {
    totalItems: data.pagination?.total ?? data.items.length,
    totalPages: data.pagination?.totalPages ?? 1,
    currentPage: data.pagination?.page ?? 1,
  };
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${apiUrl}/reports?page=${currentPage}&limit=10`);
      const result = (await response.json()) as APIResponse;
      if (response.ok && result.success) {
        setReports(result.data.items);
        setMeta(normalizeMeta(result.data));
      } else {
        showToast(result.message ?? "Không thể tải danh sách báo cáo.", "error");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openReportDetail = async (id: number) => {
    setDetailLoading(true);
    setSelectedReport(null);
    try {
      setAccessToken(await getValidAccessToken());
      const response = await apiFetch(`${apiUrl}/reports/${id}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setSelectedReport(result.data as ReportDetail);
      } else {
        showToast(result.message ?? "Không thể tải chi tiết báo cáo.", "error");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, [currentPage]);

  const handleResolve = async (id: number) => {
    if (!confirm("Bạn có đồng ý giải quyết báo cáo này? Tài liệu bị báo cáo sẽ tự động bị ẩn khỏi hệ thống.")) return;
    try {
      const response = await apiFetch(`${apiUrl}/reports/${id}/resolve`, { method: "PATCH" });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Đã giải quyết báo cáo và ẩn tài liệu.");
        setSelectedReport(null);
        void fetchReports();
      } else {
        showToast(result.message ?? "Lỗi xử lý báo cáo.", "error");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Bạn có chắc muốn bác bỏ báo cáo này? Tài liệu vẫn giữ nguyên trạng thái cũ.")) return;
    try {
      const response = await apiFetch(`${apiUrl}/reports/${id}/reject`, { method: "PATCH" });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Báo cáo vi phạm đã bị bác bỏ.");
        setSelectedReport(null);
        void fetchReports();
      } else {
        showToast(result.message ?? "Lỗi xử lý báo cáo.", "error");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm animate-fadeIn dark:border-slate-800/40 dark:bg-slate-900">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">Không có báo cáo vi phạm nào</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Tài liệu bị báo cáo</th>
                  <th className="px-4 py-4">Lý do báo cáo</th>
                  <th className="px-4 py-4">Người báo cáo</th>
                  <th className="px-4 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-semibold">
                      <p className="text-slate-800 dark:text-slate-200">{report.document.title}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">ID tài liệu: {report.document.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{reportReasonLabel(report.reason)}</p>
                      {report.description && (
                        <p className="mt-1 max-w-[200px] truncate text-xs text-slate-400" title={report.description}>
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <p>{report.reporter.fullName}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{report.reporter.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={report.status} />
                      {report.status !== "PENDING" && report.handler && (
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">Bởi: {report.handler.fullName}</p>
                      )}
                    </td>
                    <td className="space-x-1 px-6 py-4 text-right">
                      <button
                        onClick={() => void openReportDetail(report.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40"
                      >
                        Chi tiết
                      </button>
                      {report.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => void handleResolve(report.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                          >
                            Giải quyết
                          </button>
                          <button
                            onClick={() => void handleReject(report.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40"
                          >
                            Bác bỏ
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold italic text-slate-400">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              Trang {meta.currentPage} / {meta.totalPages} (Tổng {meta.totalItems} báo cáo)
            </span>
            <div className="flex space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
              >
                Trước
              </button>
              <button
                disabled={currentPage === meta.totalPages}
                onClick={() => setCurrentPage((page) => Math.min(page + 1, meta.totalPages))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {(detailLoading || selectedReport) && (
        <ReportDetailModal
          report={selectedReport}
          isLoading={detailLoading}
          accessToken={accessToken}
          onClose={() => {
            setSelectedReport(null);
            setDetailLoading(false);
          }}
          onResolve={handleResolve}
          onReject={handleReject}
        />
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-xl px-5 py-3 shadow-lg transition-all duration-300 animate-slideIn ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  switch (status) {
    case "RESOLVED":
      return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Đã giải quyết</span>;
    case "REJECTED":
      return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Bác bỏ</span>;
    default:
      return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Đang chờ</span>;
  }
}

function ReportDetailModal({
  report,
  isLoading,
  accessToken,
  onClose,
  onResolve,
  onReject,
}: {
  report: ReportDetail | null;
  isLoading: boolean;
  accessToken: string | null;
  onClose: () => void;
  onResolve: (id: number) => void;
  onReject: (id: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <aside className="flex h-full w-full max-w-6xl flex-col bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Chi tiết báo cáo vi phạm</h3>
            <p className="text-xs font-semibold text-slate-400">Xem đủ ngữ cảnh trước khi xử lý</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !report ? (
            <div className="flex h-60 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
              <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tài liệu bị báo cáo</p>
                      <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{report.document.title}</p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {report.document.status}
                    </span>
                  </div>
                  {report.document.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{report.document.description}</p>
                  )}
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Người đăng:</span> {report.document.uploader.fullName}</p>
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Loại:</span> {report.document.documentType}</p>
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Trường:</span> {report.document.school.name}</p>
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Môn:</span> {report.document.subject.name}</p>
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Lượt xem:</span> {report.document.viewCount}</p>
                    <p><span className="font-bold text-slate-800 dark:text-slate-100">Lượt tải:</span> {report.document.downloadCount}</p>
                  </div>
                  {report.document.rejectReason && (
                    <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                      <p className="font-bold">Lý do từ chối tài liệu</p>
                      <p className="mt-1">{report.document.rejectReason}</p>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nội dung báo cáo</p>
                  <p className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{reportReasonLabel(report.reason)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {report.description || "Không có mô tả bổ sung."}
                  </p>
                </section>

                <section className="grid gap-4 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Người báo cáo</p>
                    <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">{report.reporter.fullName}</p>
                    <p className="text-slate-500 dark:text-slate-400">{report.reporter.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Thời gian</p>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">{new Date(report.createdAt).toLocaleString("vi-VN")}</p>
                    {report.handledAt && <p className="text-slate-500 dark:text-slate-400">Xử lý: {new Date(report.handledAt).toLocaleString("vi-VN")}</p>}
                  </div>
                </section>
              </div>

              <section className="min-w-0 rounded-xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Xem tài liệu</p>
                  {report.document.documentFile?.totalPages && (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {report.document.documentFile.totalPages} trang
                    </span>
                  )}
                </div>
                {report.document.previews.length > 0 ? (
                  <div className="max-h-[calc(100vh-250px)] space-y-5 overflow-y-auto pr-1">
                    {report.document.previews.map((preview) => (
                      <img
                        key={preview.id}
                        src={preview.imageUrl}
                        alt={`Trang ${preview.pageNumber} của ${report.document.title}`}
                        className={`mx-auto h-auto w-full max-w-[820px] rounded-sm border border-slate-300 bg-white shadow-sm dark:border-slate-700 ${preview.isBlurred ? "blur-sm" : ""}`}
                      />
                    ))}
                  </div>
                ) : report.document.documentFile ? (
                  <DocumentViewer
                    fileUrl={`${apiUrl}/documents/${report.document.id}/file`}
                    fileType={report.document.documentFile.fileType}
                    totalPages={report.document.documentFile.totalPages ?? undefined}
                    authToken={accessToken}
                    downloadFileName={report.document.title}
                  />
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                    <p className="font-semibold">Tài liệu này chưa có preview hoặc file gốc.</p>
                    <p className="mt-1 text-sm">Admin vẫn có thể xử lý báo cáo dựa trên thông tin người dùng cung cấp.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {report && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            {report.status === "PENDING" ? (
              <>
                <button
                  type="button"
                  onClick={() => onReject(report.id)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Bác bỏ
                </button>
                <button
                  type="button"
                  onClick={() => onResolve(report.id)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Giải quyết và ẩn tài liệu
                </button>
              </>
            ) : (
              <span className="text-xs font-semibold text-slate-400">Báo cáo này đã được xử lý.</span>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
