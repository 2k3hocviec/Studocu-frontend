"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";

type ReportItem = {
  id: number;
  reason: string;
  description?: string | null;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
  handledAt?: string | null;
  reporter: { fullName: string; email: string };
  document: { id: number; title: string };
  handler?: { fullName: string } | null;
};

type APIResponse = {
  success: boolean;
  data: {
    items: ReportItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [meta, setMeta] = useState<APIResponse["data"]["meta"] | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${apiUrl}/reports?page=${currentPage}&limit=10`);
      const result = (await response.json()) as APIResponse;
      if (response.ok && result.success) {
        setReports(result.data.items);
        setMeta(result.data.meta);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách báo cáo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  // Giải quyết báo cáo (chấp nhận báo cáo, ẩn tài liệu)
  const handleResolve = async (id: number) => {
    if (!confirm("Bạn có đồng ý giải quyết báo cáo này? Tài liệu bị báo cáo sẽ tự động bị ẨN khỏi hệ thống.")) return;
    try {
      const response = await apiFetch(`${apiUrl}/reports/${id}/resolve`, {
        method: "PATCH",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Đã duyệt giải quyết báo cáo và ẩn tài liệu.");
        fetchReports();
      } else {
        showToast(result.message ?? "Lỗi xử lý báo cáo.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  // Từ chối báo cáo (bác bỏ)
  const handleReject = async (id: number) => {
    if (!confirm("Bạn có chắc muốn bác bỏ báo cáo này? (Tài liệu vẫn giữ nguyên trạng thái cũ)")) return;
    try {
      const response = await apiFetch(`${apiUrl}/reports/${id}/reject`, {
        method: "PATCH",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Báo cáo vi phạm đã bị bác bỏ.");
        fetchReports();
      } else {
        showToast(result.message ?? "Lỗi xử lý báo cáo.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  const getStatusBadge = (status: ReportItem["status"]) => {
    switch (status) {
      case "RESOLVED":
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Đã giải quyết</span>;
      case "REJECTED":
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Bác bỏ</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Đang chờ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Table card list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 animate-fadeIn">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">Không có báo cáo vi phạm nào</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="py-4 px-6">Tài liệu bị báo cáo</th>
                  <th className="py-4 px-4">Lý do báo cáo</th>
                  <th className="py-4 px-4">Người báo cáo</th>
                  <th className="py-4 px-4">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-6 font-semibold">
                      <p className="text-slate-800 dark:text-slate-200">{report.document.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">ID Tài liệu: {report.document.id}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-330">{report.reason}</p>
                      {report.description && (
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] truncate" title={report.description}>
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <p>{report.reporter.fullName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{report.reporter.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(report.status)}
                      {report.status !== "PENDING" && report.handler && (
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                          Bởi: {report.handler.fullName}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      {report.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Giải quyết
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            Bác bỏ
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              Trang {meta.currentPage} / {meta.totalPages} (Tổng {meta.totalItems} báo cáo)
            </span>
            <div className="flex space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
              >
                Trước
              </button>
              <button
                disabled={currentPage === meta.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, meta.totalPages))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-xl px-5 py-3 shadow-lg transition-all duration-300 animate-slideIn ${
          toast.type === "success" 
            ? "bg-emerald-600 text-white" 
            : "bg-rose-600 text-white"
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
