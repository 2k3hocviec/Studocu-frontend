"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";

type DocumentItem = {
  id: number;
  title: string;
  documentType: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  isPremium: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  rejectReason?: string | null;
  uploader: { fullName: string };
  school: { name: string };
  subject: { name: string };
};

type APIResponse = {
  success: boolean;
  data: {
    items: DocumentItem[];
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

export default function AdminDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [meta, setMeta] = useState<APIResponse["data"]["meta"] | null>(null);
  
  // Các bộ lọc
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // State xử lý Reject Modal
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const fetchDocuments = async (searchVal = debouncedSearch) => {
    setLoading(true);
    
    let url = `${apiUrl}/documents?page=${currentPage}&limit=10`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;

    try {
      const response = await apiFetch(url);
      const result = (await response.json()) as APIResponse;
      if (response.ok && result.success) {
        setDocuments(result.data.items);
        setMeta(result.data.meta);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách tài liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page to 1 khi đổi bộ lọc tìm kiếm hoặc status
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchDocuments(debouncedSearch);
  }, [currentPage, statusFilter, debouncedSearch]);

  // Hành động Duyệt tài liệu
  const handleApprove = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt tài liệu này? Người tải lên sẽ nhận được 2 credit.")) return;
    try {
      const response = await apiFetch(`${apiUrl}/documents/${id}/approve`, {
        method: "PATCH",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Đã duyệt tài liệu thành công.");
        fetchDocuments();
      } else {
        showToast(result.message ?? "Lỗi duyệt tài liệu.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  // Hành động Ẩn tài liệu
  const handleHide = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn ẩn tài liệu này khỏi công chúng?")) return;
    try {
      const response = await apiFetch(`${apiUrl}/documents/${id}/hide`, {
        method: "PATCH",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Tài liệu đã được ẩn.");
        fetchDocuments();
      } else {
        showToast(result.message ?? "Lỗi ẩn tài liệu.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  // Hành động Xóa mềm tài liệu
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này? (Tài liệu sẽ không hiển thị ở bất kỳ đâu)")) return;
    try {
      const response = await apiFetch(`${apiUrl}/documents/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Đã xóa tài liệu thành công.");
        fetchDocuments();
      } else {
        showToast(result.message ?? "Lỗi xóa tài liệu.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  // Hành động Hủy ẩn tài liệu
  const handleUnhide = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn bỏ ẩn tài liệu này?")) return;
    try {
      const response = await apiFetch(`${apiUrl}/documents/${id}/unhide`, {
        method: "PATCH",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Tài liệu đã được hiển thị lại.");
        fetchDocuments();
      } else {
        showToast(result.message ?? "Lỗi bỏ ẩn tài liệu.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  // Nộp lý do Từ chối
  const submitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setIsSubmittingReject(true);
    try {
      const response = await apiFetch(`${apiUrl}/documents/${rejectingDocId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Tài liệu đã bị từ chối.");
        setRejectingDocId(null);
        setRejectReason("");
        fetchDocuments();
      } else {
        showToast(result.message ?? "Lỗi từ chối tài liệu.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const getStatusBadge = (status: DocumentItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Đã Duyệt</span>;
      case "PENDING":
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Chờ Duyệt</span>;
      case "REJECTED":
        return <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Bị Từ Chối</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Đang Ẩn</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header bar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 md:flex-row md:items-center md:justify-between border border-slate-100 dark:border-slate-800/40">
        <div className="flex flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm tài liệu theo tiêu đề (tự động lọc)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="HIDDEN">Đang ẩn</option>
          </select>
        </div>
      </div>

      {/* Main Table area */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">Không tìm thấy tài liệu phù hợp</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="py-4 px-6">Tài liệu</th>
                  <th className="py-4 px-4">Thông tin phân loại</th>
                  <th className="py-4 px-4">Người đăng / Ngày</th>
                  <th className="py-4 px-4">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{doc.title}</p>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{doc.documentType}</span>
                        {doc.isPremium && (
                          <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                            Premium
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{doc.school.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{doc.subject.name}</p>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <p>{doc.uploader.fullName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(doc.createdAt).toLocaleDateString("vi-VN")}</p>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(doc.status)}
                      {doc.status === "REJECTED" && doc.rejectReason && (
                        <p className="mt-1 text-[10px] text-slate-400 italic max-w-[150px] truncate" title={doc.rejectReason}>
                          Lý do: {doc.rejectReason}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      {doc.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(doc.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => setRejectingDocId(doc.id)}
                            className="rounded-lg bg-rose-550 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/20 transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {doc.status === "APPROVED" && (
                        <>
                          <button
                            onClick={() => handleHide(doc.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            Ẩn đi
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                          >
                            Xóa
                          </button>
                        </>
                      )}
                      {doc.status === "HIDDEN" && (
                        <>
                          <button
                            onClick={() => handleUnhide(doc.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Hiện lại
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                          >
                            Xóa vĩnh viễn
                          </button>
                        </>
                      )}
                      {doc.status === "REJECTED" && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                        >
                          Xóa vĩnh viễn
                        </button>
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
              Trang {meta.currentPage} / {meta.totalPages} (Tổng {meta.totalItems} tài liệu)
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

      {/* Reject Dialog Modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 animate-scaleUp">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Từ chối duyệt tài liệu</h3>
            <p className="text-xs text-slate-400 mt-1">Vui lòng nhập lý do từ chối để thông báo cho người dùng.</p>
            <form onSubmit={submitReject} className="mt-4 space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                required
                rows={4}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingDocId(null);
                    setRejectReason("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmittingReject ? "Đang xử lý..." : "Từ chối duyệt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
