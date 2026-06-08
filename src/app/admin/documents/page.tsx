"use client";

import { useEffect, useState } from "react";
import { DocumentViewer } from "@/components/document-viewer";
import { apiFetch, getValidAccessToken } from "@/utils/api";

type DocumentItem = {
  id: number;
  title: string;
  documentType: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  rejectReason?: string | null;
  uploader: { fullName: string };
  school?: { name: string } | null;
  subject?: { name: string } | null;
  requestedSchoolName?: string | null;
  requestedSubjectName?: string | null;
};

type DocumentDetail = DocumentItem & {
  description?: string | null;
  uploader: { id?: number; fullName: string; avatarUrl?: string | null };
  school?: { id?: number; name: string } | null;
  subject?: { id?: number; name: string } | null;
  documentFile?: {
    fileType: "PDF" | "DOCX" | "PPTX";
    totalPages?: number | null;
  } | null;
  previews: Array<{ id: number; pageNumber: number; imageUrl: string; isBlurred: boolean }>;
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

function schoolName(document: Pick<DocumentItem, "school" | "requestedSchoolName">) {
  return document.school?.name ?? document.requestedSchoolName ?? "Chưa có trường";
}

function subjectName(document: Pick<DocumentItem, "subject" | "requestedSubjectName">) {
  return document.subject?.name ?? document.requestedSubjectName ?? "Chưa có môn học";
}

export default function AdminDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [meta, setMeta] = useState<APIResponse["data"]["meta"] | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
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

  const openDocumentDetail = async (id: number) => {
    setDetailLoading(true);
    setSelectedDocument(null);
    try {
      const token = await getValidAccessToken();
      setAccessToken(token);
      const response = await apiFetch(`${apiUrl}/documents/${id}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setSelectedDocument(result.data as DocumentDetail);
      } else {
        showToast(result.message ?? "Không thể tải chi tiết tài liệu.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setDetailLoading(false);
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
        setSelectedDocument(null);
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
        setSelectedDocument(null);
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
        setSelectedDocument(null);
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
        setSelectedDocument(null);
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
        setSelectedDocument(null);
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
    <div className="min-w-0 space-y-6">
      {/* Search & Filter Header bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800/40 dark:bg-slate-900 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-1 gap-2 lg:max-w-md">
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

        <div className="flex flex-wrap items-center gap-2">
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
            <table className="min-w-[980px] w-full text-left text-sm">
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
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{schoolName(doc)}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{subjectName(doc)}</p>
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
                      <button
                        onClick={() => void openDocumentDetail(doc.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        Xem
                      </button>
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
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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

      {(detailLoading || selectedDocument) && (
        <DocumentDetailModal
          document={selectedDocument}
          isLoading={detailLoading}
          accessToken={accessToken}
          apiUrl={apiUrl}
          onClose={() => {
            setSelectedDocument(null);
            setDetailLoading(false);
          }}
          onApprove={handleApprove}
          onReject={(id) => {
            setRejectingDocId(id);
          }}
          onHide={handleHide}
          onUnhide={handleUnhide}
          onDelete={handleDelete}
        />
      )}

      {/* Reject Dialog Modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-scaleUp dark:bg-slate-900">
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

function DocumentDetailModal({
  document,
  isLoading,
  accessToken,
  apiUrl,
  onClose,
  onApprove,
  onReject,
  onHide,
  onUnhide,
  onDelete,
}: {
  document: DocumentDetail | null;
  isLoading: boolean;
  accessToken: string | null;
  apiUrl: string;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onHide: (id: number) => void;
  onUnhide: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-5">
      <aside className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Xem trước tài liệu</h3>
            <p className="text-xs font-semibold text-slate-400">Kiểm tra nội dung trước khi duyệt hoặc xử lý</p>
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
          {isLoading || !document ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid min-w-0 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
              <section className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tài liệu</p>
                      <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{document.title}</h4>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {document.status}
                    </span>
                  </div>
                  {document.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{document.description}</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                  <dl className="space-y-3">
                    <DetailRow label="Người đăng" value={document.uploader.fullName} />
                    <DetailRow label="Trường" value={schoolName(document)} />
                    <DetailRow label="Môn học" value={subjectName(document)} />
                    <DetailRow label="Loại" value={document.documentType} />
                    <DetailRow label="Lượt xem" value={String(document.viewCount)} />
                    <DetailRow label="Lượt tải" value={String(document.downloadCount)} />
                    <DetailRow label="Ngày đăng" value={new Date(document.createdAt).toLocaleDateString("vi-VN")} />
                    {document.documentFile?.totalPages && <DetailRow label="Số trang" value={String(document.documentFile.totalPages)} />}
                  </dl>
                  {document.status === "REJECTED" && document.rejectReason && (
                    <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                      <p className="font-bold">Lý do từ chối</p>
                      <p className="mt-1">{document.rejectReason}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="min-w-0 rounded-xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
                {document.documentFile ? (
                  <DocumentViewer
                    fileUrl={`${apiUrl}/documents/${document.id}/file`}
                    fileType={document.documentFile.fileType}
                    totalPages={document.documentFile.totalPages ?? undefined}
                    isPreview={false}
                    authToken={accessToken}
                    downloadFileName={document.title}
                    fallback={document.previews.length > 0 ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                          Không thể tải file gốc. Đang hiển thị bản preview để admin vẫn có thể kiểm tra tạm thời.
                        </div>
                        <div className="max-h-[calc(100vh-260px)] space-y-5 overflow-y-auto pr-1">
                          {document.previews.map((preview) => (
                            <img
                              key={preview.id}
                              src={preview.imageUrl}
                              alt={`Trang ${preview.pageNumber} của ${document.title}`}
                              className={`mx-auto h-auto w-full max-w-[820px] rounded-sm border border-slate-300 bg-white shadow-sm dark:border-slate-700 ${preview.isBlurred ? "blur-sm" : ""}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : undefined}
                  />
                ) : document.previews.length > 0 ? (
                  <div className="max-h-[calc(100vh-220px)] space-y-5 overflow-y-auto pr-1">
                    {document.previews.map((preview) => (
                      <img
                        key={preview.id}
                        src={preview.imageUrl}
                        alt={`Trang ${preview.pageNumber} của ${document.title}`}
                        className={`mx-auto h-auto w-full max-w-[820px] rounded-sm border border-slate-300 bg-white shadow-sm dark:border-slate-700 ${preview.isBlurred ? "blur-sm" : ""}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                    <p className="font-semibold">Tài liệu này chưa có preview hoặc file gốc.</p>
                    <p className="mt-1 text-sm">Bạn vẫn có thể xử lý trạng thái nếu metadata đã đủ rõ.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {document && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
            {document.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => onReject(document.id)}
                  className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/20"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(document.id)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Duyệt tài liệu
                </button>
              </>
            )}
            {document.status === "APPROVED" && (
              <>
                <button
                  type="button"
                  onClick={() => onHide(document.id)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Ẩn đi
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(document.id)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Xóa
                </button>
              </>
            )}
            {document.status === "HIDDEN" && (
              <>
                <button
                  type="button"
                  onClick={() => onUnhide(document.id)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Hiện lại
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(document.id)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Xóa
                </button>
              </>
            )}
            {document.status === "REJECTED" && (
              <button
                type="button"
                onClick={() => onDelete(document.id)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Xóa
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}
