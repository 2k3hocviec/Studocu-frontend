"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";

type SchoolItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  _count: {
    subjects: number;
    documents: number;
  };
};

type APIResponse = {
  success: boolean;
  data: {
    items: SchoolItem[];
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

// Hàm chuyển đổi tiếng Việt có dấu sang slug không dấu
function toSlug(str: string) {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|á|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/[^a-z0-9 -]/g, ""); // Xóa ký tự đặc biệt
  str = str.replace(/\s+/g, "-"); // Thay khoảng trắng bằng -
  str = str.replace(/-+/g, "-"); // Xóa nhiều - liên tiếp
  return str.trim();
}

export default function AdminSchoolsPage() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [meta, setMeta] = useState<APIResponse["data"]["meta"] | null>(null);
  
  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };
  
  // Form/Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolItem | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchools = async (searchVal = debouncedSearch) => {
    setLoading(true);
    let url = `${apiUrl}/schools?page=${currentPage}&limit=10`;
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;
    
    try {
      const response = await apiFetch(url);
      const result = (await response.json()) as APIResponse;
      if (response.ok && result.success) {
        setSchools(result.data.items);
        setMeta(result.data.meta);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách trường học:", err);
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

  // Reset page to 1 khi đổi bộ lọc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSchools(debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const openAddModal = () => {
    setEditingSchool(null);
    setFormData({ name: "", slug: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (school: SchoolItem) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      slug: school.slug,
      description: school.description ?? "",
    });
    setIsModalOpen(true);
  };

  // Tự động sinh slug khi thay đổi Tên trường
  const handleNameChange = (nameVal: string) => {
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      slug: toSlug(nameVal),
    }));
  };

  // Xử lý gửi Form (Thêm hoặc Sửa)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = editingSchool 
      ? `${apiUrl}/schools/${editingSchool.id}` 
      : `${apiUrl}/schools`;
      
    const method = editingSchool ? "PATCH" : "POST";

    try {
      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast(editingSchool ? "Đã cập nhật thành công." : "Đã thêm trường học mới thành công.");
        setIsModalOpen(false);
        fetchSchools();
      } else {
        showToast(result.message ?? "Lỗi xử lý yêu cầu.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa mềm trường học
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mềm trường học này? (Các môn học và tài liệu liên quan sẽ tạm ẩn)")) return;
    try {
      const response = await apiFetch(`${apiUrl}/schools/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Đã xóa trường học thành công.");
        fetchSchools();
      } else {
        showToast(result.message ?? "Lỗi xóa trường học.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-fadeIn dark:border-slate-800/40 dark:bg-slate-900 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-1 gap-2 lg:max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm trường học theo tên (tự động lọc)..."
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

        <button
          onClick={openAddModal}
          className="flex w-fit self-start rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 lg:self-auto"
        >
          <svg className="mr-1.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Thêm trường học</span>
        </button>
      </div>

      {/* Schools Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : schools.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">Không tìm thấy trường học nào</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="py-4 px-6">Tên trường học</th>
                  <th className="py-4 px-4">Slug</th>
                  <th className="py-4 px-4 font-semibold">Mô tả</th>
                  <th className="py-4 px-4 text-center">Số môn học</th>
                  <th className="py-4 px-4 text-center">Số tài liệu</th>
                  <th className="py-4 px-6 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                      {school.name}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-slate-450 dark:text-slate-400">{school.slug}</td>
                    <td className="py-4 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={school.description ?? ""}>
                      {school.description || <span className="italic text-slate-300">Không có mô tả</span>}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-350">{school._count.subjects}</td>
                    <td className="py-4 px-4 text-center font-bold text-emerald-650 dark:text-emerald-400">{school._count.documents}</td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(school)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(school.id)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                      >
                        Xóa
                      </button>
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
              Trang {meta.currentPage} / {meta.totalPages} (Tổng {meta.totalItems} trường học)
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

      {/* Add/Edit School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-scaleUp dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-200">
              {editingSchool ? "Chỉnh sửa trường học" : "Thêm trường học mới"}
            </h3>
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tên trường học</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Slug (Đường dẫn tĩnh)</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="dai-hoc-bach-khoa-ha-noi"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mô tả ngắn</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Thông tin giới thiệu về trường học..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang xử lý..." : editingSchool ? "Cập nhật" : "Thêm mới"}
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
