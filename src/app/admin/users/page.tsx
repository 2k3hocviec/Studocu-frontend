"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";

type UserItem = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  status: "PENDING_VERIFY" | "ACTIVE" | "BANNED";
  role: "USER" | "ADMIN";
  creditBalance: number;
  createdAt: string;
};

type APIResponse = {
  success: boolean;
  data: {
    items: UserItem[];
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

/** Trang quản lý người dùng trong admin. */
export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [meta, setMeta] = useState<APIResponse["data"]["meta"] | null>(null);
  
  // Bộ lọc tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Thông báo nhanh cho thao tác admin.
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /** Hiển thị toast trong thời gian ngắn. */
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchUsers = async (searchVal = debouncedSearch) => {
    setLoading(true);
    let url = `${apiUrl}/users?page=${currentPage}&limit=10`;
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;
    
    try {
      const response = await apiFetch(url);
      const result = (await response.json()) as APIResponse;
      if (response.ok && result.success) {
        setUsers(result.data.items);
        setMeta(result.data.meta);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách thành viên:", err);
    } finally {
      setLoading(false);
    }
  };

  // Giảm tần suất tìm kiếm khi người dùng đang nhập.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Đưa về trang đầu khi đổi bộ lọc.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUsers(debouncedSearch);
  }, [currentPage, debouncedSearch]);

  // Cập nhật trạng thái người dùng.
  const handleUpdateStatus = async (id: number, newStatus: UserItem["status"]) => {
    const actionText = newStatus === "BANNED" ? "Khóa (Ban)" : "Kích hoạt lại (Unban)";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} người dùng này không?`)) return;
    
    try {
      const response = await apiFetch(`${apiUrl}/users/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast("Đã cập nhật trạng thái người dùng thành công.");
        fetchUsers();
      } else {
        showToast(result.message ?? "Lỗi cập nhật trạng thái.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối tới máy chủ.", "error");
    }
  };

  /** Trả badge trạng thái tài khoản. */
  const getStatusBadge = (status: UserItem["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Hoạt Động</span>;
      case "BANNED":
        return <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Đã Khóa</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Chờ Kích Hoạt</span>;
    }
  };

  /** Trả badge vai trò người dùng. */
  const getRoleBadge = (role: UserItem["role"]) => {
    switch (role) {
      case "ADMIN":
        return <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">ADMIN</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">USER</span>;
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-fadeIn dark:border-slate-800/40 dark:bg-slate-900 sm:p-6">
        <div className="flex w-full gap-2 lg:max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm người dùng theo tên, email (tự động lọc)..."
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
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">Không tìm thấy thành viên phù hợp</span>
          </div>
        ) : (
          <>
            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase dark:border-slate-800 dark:bg-slate-900/50">
                    <th className="py-4 px-6">Thành viên</th>
                    <th className="py-4 px-4">Quyền hạn</th>
                    <th className="py-4 px-4">Số dư Credit</th>
                    <th className="py-4 px-4">Trạng thái</th>
                    <th className="py-4 px-4">Ngày đăng ký</th>
                    <th className="py-4 px-6 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                      <td className="py-4 px-6 flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold dark:bg-slate-800 dark:text-slate-400">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            user.fullName.substring(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-850 dark:text-slate-200">{user.fullName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">{getRoleBadge(user.role)}</td>
                      <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {user.creditBalance.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(user.status)}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-450 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {user.role !== "ADMIN" ? (
                          user.status === "BANNED" ? (
                            <button
                              onClick={() => handleUpdateStatus(user.id, "ACTIVE")}
                              className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:border-emerald-950 dark:hover:bg-emerald-950/20 transition-colors"
                            >
                              Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(user.id, "BANNED")}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                            >
                              Khóa tài khoản
                            </button>
                          )
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold dark:bg-slate-800 dark:text-slate-400">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          user.fullName.substring(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-850 dark:text-slate-200 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Số dư Credit</p>
                      <p className="font-bold mt-0.5 text-slate-700 dark:text-slate-300">{user.creditBalance.toLocaleString("vi-VN")}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Ngày đăng ký</p>
                      <p className="font-semibold mt-0.5 text-slate-700 dark:text-slate-300">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>

                  {user.role !== "ADMIN" && (
                    <div className="flex justify-end pt-2">
                      {user.status === "BANNED" ? (
                        <button
                          onClick={() => handleUpdateStatus(user.id, "ACTIVE")}
                          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:border-emerald-950 dark:hover:bg-emerald-950/20 transition-colors"
                        >
                          Mở khóa
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(user.id, "BANNED")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                        >
                          Khóa tài khoản
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-xs font-semibold text-slate-400">
              Trang {meta.currentPage} / {meta.totalPages} (Tổng {meta.totalItems} thành viên)
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
