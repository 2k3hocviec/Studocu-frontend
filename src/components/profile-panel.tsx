"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PremiumBadge } from "@/components/premium-badge";
import { SiteHeader } from "@/components/site-header";

type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

type Subscription = {
  id: number;
  endDate: string;
} | null;

type PaymentPlan = {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  downloadLimit: number;
  description: string | null;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PaymentHistoryItem = {
  id: number;
  amount: number;
  method: "MOCK" | "VNPAY";
  status: "PENDING" | "PAID" | "FAILED";
  paidAt: string | null;
  createdAt: string;
  plan: PaymentPlan;
};

type PaymentHistoryPage = {
  items: PaymentHistoryItem[];
  pagination: PaginationData;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type ProfileDocument = {
  id: number;
  title: string;
  description?: string | null;
  documentType: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  viewedAt?: string;
  coverImageUrl?: string | null;
  totalPages?: number | null;
  school: { name: string };
  subject: { name: string };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Chưa hoàn tất";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

const documentTypeLabels: Record<string, string> = {
  LECTURE: "Bài giảng",
  EXAM: "Đề thi",
  NOTE: "Ghi chú",
  ASSIGNMENT: "Bài tập",
  OTHER: "Khác",
};

const statusLabels: Record<ProfileDocument["status"], string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  HIDDEN: "Đã ẩn",
};

const statusTextClasses: Record<ProfileDocument["status"], string> = {
  PENDING: "text-amber-700 dark:text-amber-200",
  APPROVED: "text-emerald-700 dark:text-emerald-200",
  REJECTED: "text-rose-700 dark:text-rose-200",
  HIDDEN: "text-slate-600 dark:text-slate-300",
};

const paymentStatusLabels: Record<PaymentHistoryItem["status"], string> = {
  PENDING: "Đang chờ",
  PAID: "Thành công",
  FAILED: "Thất bại",
};

const paymentStatusClasses: Record<PaymentHistoryItem["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  FAILED: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

const paymentMethodLabels: Record<PaymentHistoryItem["method"], string> = {
  MOCK: "Thanh toán thử",
  VNPAY: "VNPAY",
};

export function ProfilePanel() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [activeLibrary, setActiveLibrary] = useState<"mine" | "recent" | null>(null);
  const [libraryDocuments, setLibraryDocuments] = useState<ProfileDocument[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [paymentPagination, setPaymentPagination] = useState<PaginationData | null>(null);
  const [paymentPage, setPaymentPage] = useState(1);
  const [isPaymentHistoryLoading, setIsPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const avatarPreview = useMemo(() => {
    if (!avatarFile) return profile?.avatarUrl ?? "";
    return URL.createObjectURL(avatarFile);
  }, [avatarFile, profile?.avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const [profileResponse, subscriptionResponse] = await Promise.all([
          fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${apiUrl}/subscriptions/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);
        const profileResult = (await profileResponse.json()) as ApiResponse<UserProfile>;

        if (profileResponse.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          router.replace("/login");
          return;
        }

        if (!profileResponse.ok || !profileResult.data) {
          throw new Error(profileResult.message ?? "Không thể tải thông tin hồ sơ.");
        }

        if (subscriptionResponse.ok) {
          const subscriptionResult = (await subscriptionResponse.json()) as ApiResponse<Subscription>;
          setSubscription(subscriptionResult.success ? subscriptionResult.data ?? null : null);
        }

        setProfile(profileResult.data);
        setFullName(profileResult.data.fullName);
      } catch (cause) {
        setProfileError(cause instanceof Error ? cause.message : "Không thể tải thông tin hồ sơ.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    const loadPaymentHistory = async () => {
      setIsPaymentHistoryLoading(true);
      setPaymentHistoryError("");

      try {
        const response = await fetch(`${apiUrl}/payments/history?page=${paymentPage}&limit=8`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = (await response.json()) as ApiResponse<PaymentHistoryPage>;

        if (!response.ok || !result.data) {
          throw new Error(result.message ?? "Không thể tải lịch sử thanh toán.");
        }

        setPaymentHistory(result.data.items);
        setPaymentPagination(result.data.pagination);
      } catch (cause) {
        setPaymentHistory([]);
        setPaymentPagination(null);
        setPaymentHistoryError(cause instanceof Error ? cause.message : "Không thể tải lịch sử thanh toán.");
      } finally {
        setIsPaymentHistoryLoading(false);
      }
    };

    void loadPaymentHistory();
  }, [paymentPage]);

  function authToken() {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) router.replace("/login");
    return accessToken;
  }

  async function loadLibrary(mode: "mine" | "recent") {
    if (activeLibrary === mode) {
      setActiveLibrary(null);
      setLibraryError("");
      setIsLibraryLoading(false);
      return;
    }

    const accessToken = authToken();
    if (!accessToken) return;

    setActiveLibrary(mode);
    setLibraryError("");
    setIsLibraryLoading(true);

    try {
      const endpoint = mode === "mine"
        ? `${apiUrl}/users/me/documents`
        : `${apiUrl}/users/me/recent-documents?limit=10`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = (await response.json()) as ApiResponse<ProfileDocument[]>;

      if (!response.ok || !result.data) {
        throw new Error(result.message ?? "Không thể tải danh sách tài liệu.");
      }

      setLibraryDocuments(result.data);
    } catch (cause) {
      setLibraryDocuments([]);
      setLibraryError(cause instanceof Error ? cause.message : "Không thể tải danh sách tài liệu.");
    } finally {
      setIsLibraryLoading(false);
    }
  }

  function openPasswordModal() {
    setIsPasswordModalOpen(true);
    setPasswordError("");
    setPasswordNotice("");
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
    setPasswordError("");
    setPasswordNotice("");
  }

  function closePasswordModalFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) closePasswordModal();
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = authToken();
    if (!accessToken) return;

    setProfileError("");
    setProfileNotice("");
    setIsSavingProfile(true);

    try {
      const response = await fetch(`${apiUrl}/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });
      const result = (await response.json()) as ApiResponse<UserProfile>;

      if (!response.ok || !result.data) {
        throw new Error(result.message ?? "Không thể lưu thay đổi.");
      }

      setProfile(result.data);
      setFullName(result.data.fullName);
      setProfileNotice("Đã cập nhật thông tin hồ sơ.");
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : "Không thể lưu thay đổi.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAvatarUpload() {
    const accessToken = authToken();
    if (!accessToken) return;
    if (!avatarFile) {
      setProfileError("Vui lòng chọn file PNG để tải lên.");
      return;
    }
    if (avatarFile.type !== "image/png") {
      setProfileError("Avatar chỉ hỗ trợ file PNG.");
      return;
    }

    setProfileError("");
    setProfileNotice("");
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const response = await fetch(`${apiUrl}/users/me/avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const result = (await response.json()) as ApiResponse<UserProfile>;

      if (!response.ok || !result.data) {
        throw new Error(result.message ?? "Không thể tải avatar.");
      }

      setProfile(result.data);
      setAvatarFile(null);
      setProfileNotice("Đã cập nhật ảnh đại diện.");
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : "Không thể tải avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = authToken();
    if (!accessToken) return;

    setPasswordError("");
    setPasswordNotice("");
    setIsChangingPassword(true);

    try {
      const response = await fetch(`${apiUrl}/users/me/password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      });
      const result = (await response.json()) as ApiResponse<{ message: string }>;

      if (!response.ok) {
        throw new Error(result.message ?? "Không thể đổi mật khẩu.");
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordNotice(result.data?.message ?? "Đã đổi mật khẩu thành công.");
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader authenticated />
      <main className="profile-pattern mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl content-start gap-6 px-6 py-11 md:grid-cols-[255px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white px-7 pb-8 pt-10 text-center shadow-[0_7px_18px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt={`Ảnh đại diện của ${profile?.fullName ?? "người dùng"}`}
              className="mx-auto h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto grid h-20 w-20 place-content-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.55">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5.5 20c.3-4 3-6.2 6.5-6.2s6.2 2.2 6.5 6.2" />
              </svg>
            </div>
          )}
          {subscription ? (
            <div className="mt-4">
              <PremiumBadge />
              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-200">Hết hạn {formatDate(subscription.endDate)}</p>
            </div>
          ) : null}
          <p className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
            {profile?.fullName || (isLoading ? "Đang tải..." : "Thông tin tài khoản")}
          </p>
          <p className="mt-1 break-all text-sm leading-5 text-slate-500 dark:text-slate-400">{profile?.email ?? "Thành viên HọcLiệu"}</p>
          <div className="mt-7 grid gap-3 text-left">
            <div className="grid gap-2">
              <LibraryToggleButton
                mode="mine"
                isOpen={activeLibrary === "mine"}
                onClick={() => void loadLibrary("mine")}
              />
              {activeLibrary === "mine" ? (
                <DocumentLibraryPanel
                  mode="mine"
                  documents={libraryDocuments}
                  isLoading={isLibraryLoading}
                  error={libraryError}
                />
              ) : null}
            </div>
            <div className="grid gap-2">
              <LibraryToggleButton
                mode="recent"
                isOpen={activeLibrary === "recent"}
                onClick={() => void loadLibrary("recent")}
              />
              {activeLibrary === "recent" ? (
                <DocumentLibraryPanel
                  mode="recent"
                  documents={libraryDocuments}
                  isLoading={isLibraryLoading}
                  error={libraryError}
                />
              ) : null}
            </div>
          </div>
        </aside>

        <div className="grid min-w-0 gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_7px_18px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:px-9 sm:pb-9 sm:pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#123329] dark:text-white">Hồ sơ cá nhân</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Quản lý tên hiển thị, ảnh đại diện và bảo mật tài khoản.
              </p>
            </div>
            <button type="button" onClick={openPasswordModal} className="app-button-secondary app-button-compact shrink-0">
              Đổi mật khẩu
            </button>
          </div>

          {isLoading ? (
            <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">Đang tải thông tin hồ sơ...</p>
          ) : (
            <div className="mt-7 space-y-6">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Ảnh đại diện PNG</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:h-10 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700 dark:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAvatarUpload()}
                    disabled={!avatarFile || isUploadingAvatar}
                    className="app-button-primary app-button-compact shrink-0"
                  >
                    {isUploadingAvatar ? "Đang tải..." : "Tải avatar"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Chỉ nhận file PNG, tối đa 2MB.</p>
              </div>

              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Họ và tên
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-slate-500 transition focus-within:border-emerald-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                    <input
                      type="text"
                      name="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                      minLength={2}
                      required
                      className="w-full bg-transparent font-normal text-slate-900 outline-none dark:text-white"
                    />
                  </span>
                </label>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  <span className="flex justify-between">
                    <span>Email</span>
                    <span className="font-normal text-slate-400">Đã xác minh</span>
                  </span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-4 text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                    <input
                      type="email"
                      value={profile?.email ?? ""}
                      disabled
                      className="w-full bg-transparent font-normal text-slate-500 outline-none dark:text-slate-400"
                    />
                  </span>
                </label>
                {profileError ? <p className="text-sm font-medium text-red-600 dark:text-red-400">{profileError}</p> : null}
                {profileNotice ? <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{profileNotice}</p> : null}
                <button type="submit" disabled={isSavingProfile} className="app-button-primary mt-2 w-full gap-2">
                  {isSavingProfile ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </form>
            </div>
          )}
        </section>

          <PaymentHistoryPanel
            payments={paymentHistory}
            pagination={paymentPagination}
            isLoading={isPaymentHistoryLoading}
            error={paymentHistoryError}
            onPrevious={() => setPaymentPage((page) => Math.max(1, page - 1))}
            onNext={() => setPaymentPage((page) => Math.min(paymentPagination?.totalPages ?? page, page + 1))}
          />
        </div>
      </main>

      {isPasswordModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onMouseDown={closePasswordModalFromBackdrop}
          role="presentation"
        >
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#123329] dark:text-white">Đổi mật khẩu</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Nhập mật khẩu cũ và xác nhận mật khẩu mới để cập nhật bảo mật.
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="grid h-9 w-9 shrink-0 place-content-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
                aria-label="Đóng đổi mật khẩu"
              >
                ×
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
              <PasswordField
                label="Mật khẩu cũ"
                value={passwordForm.currentPassword}
                onChange={(value) => setPasswordForm((form) => ({ ...form, currentPassword: value }))}
                autoComplete="current-password"
              />
              <PasswordField
                label="Mật khẩu mới"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((form) => ({ ...form, newPassword: value }))}
                autoComplete="new-password"
              />
              <PasswordField
                label="Xác nhận mật khẩu mới"
                value={passwordForm.confirmPassword}
                onChange={(value) => setPasswordForm((form) => ({ ...form, confirmPassword: value }))}
                autoComplete="new-password"
              />
              {passwordError ? <p className="text-sm font-medium text-red-600 dark:text-red-400">{passwordError}</p> : null}
              {passwordNotice ? <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{passwordNotice}</p> : null}
              <button type="submit" disabled={isChangingPassword} className="app-button-primary w-full">
                {isChangingPassword ? "Đang đổi mật khẩu..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function PaymentHistoryPanel({
  payments,
  pagination,
  isLoading,
  error,
  onPrevious,
  onNext,
}: {
  payments: PaymentHistoryItem[];
  pagination: PaginationData | null;
  isLoading: boolean;
  error: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_7px_18px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Thanh toán</p>
          <h2 className="mt-1 text-xl font-bold text-[#123329] dark:text-white">Lịch sử thanh toán</h2>
        </div>
        {pagination ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {pagination.total} giao dịch
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
      ) : null}

      {isLoading ? (
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Đang tải lịch sử thanh toán...</p>
      ) : payments.length === 0 && !error ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          Bạn chưa có giao dịch thanh toán nào.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100 dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Gói</th>
                  <th className="px-4 py-3 font-semibold">Số tiền</th>
                  <th className="px-4 py-3 font-semibold">Phương thức</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Tạo lúc</th>
                  <th className="px-4 py-3 font-semibold">Thanh toán lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {payments.map((payment) => (
                  <tr key={payment.id} className="bg-white text-slate-700 dark:bg-transparent dark:text-slate-200">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950 dark:text-white">{payment.plan.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payment.plan.durationDays} ngày Premium</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#00734b] dark:text-emerald-300">{formatMoney(payment.amount)}đ</td>
                    <td className="px-4 py-3">{paymentMethodLabels[payment.method]}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusClasses[payment.status]}`}>
                        {paymentStatusLabels[payment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(payment.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(payment.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>
            Trang {pagination.page}/{pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={onPrevious}
              className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={onNext}
              className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
      {label}
      <span className="mt-2 flex h-12 items-center rounded-lg border border-slate-200 bg-white px-4 transition focus-within:border-emerald-600 dark:border-white/10 dark:bg-slate-900">
        <input
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          required
          autoComplete={autoComplete}
          className="w-full bg-transparent font-normal text-slate-900 outline-none dark:text-white"
        />
      </span>
    </label>
  );
}

function LibraryToggleButton({
  mode,
  isOpen,
  onClick,
}: {
  mode: "mine" | "recent";
  isOpen: boolean;
  onClick: () => void;
}) {
  const title = mode === "mine" ? "Tài liệu của tôi" : "Tài liệu gần đây";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm font-bold transition ${
        isOpen
          ? "border-slate-500 bg-white text-slate-700 shadow-sm dark:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-slate-600"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-content-center rounded-full bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900">
          {mode === "recent" ? <ClockIcon /> : <DocumentIcon />}
        </span>
        <span className="truncate">{title}</span>
      </span>
      <ChevronIcon isOpen={isOpen} />
    </button>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 13h5" />
      <path d="M9.5 17h4" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 shrink-0 text-slate-600 transition-transform dark:text-slate-300 ${isOpen ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DocumentLibraryPanel({
  mode,
  documents,
  isLoading,
  error,
}: {
  mode: "mine" | "recent";
  documents: ProfileDocument[];
  isLoading: boolean;
  error: string;
}) {
  const emptyText = mode === "mine"
    ? "Bạn chưa tải lên tài liệu nào."
    : "Bạn chưa xem tài liệu nào gần đây.";

  return (
    <section className="overflow-hidden rounded-b-lg border-x border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/50">
      {isLoading ? (
        <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">Đang tải danh sách tài liệu...</p>
      ) : error ? (
        <p className="m-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>
      ) : documents.length === 0 ? (
        <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{emptyText}</p>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          {documents.map((document) => (
            <ProfileDocumentCard key={`${mode}-${document.id}`} document={document} showStatus={mode === "mine"} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProfileDocumentCard({ document, showStatus }: { document: ProfileDocument; showStatus: boolean }) {
  return (
    <Link
      href={`/documents/${document.id}`}
      className="group flex gap-3 border-b border-slate-100 px-4 py-3 text-slate-700 transition last:border-b-0 hover:bg-sky-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-sky-950/40"
    >
      <span className="mt-1 grid h-5 w-5 shrink-0 place-content-center rounded bg-sky-100 text-sky-500 dark:bg-sky-950 dark:text-sky-300">
        <DocumentIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block overflow-hidden break-words text-sm font-semibold leading-6 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] group-hover:text-slate-950 dark:group-hover:text-white">
          {document.title}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>{documentTypeLabels[document.documentType] ?? document.documentType}</span>
          {showStatus ? (
            <span className={statusTextClasses[document.status]}>
              {statusLabels[document.status]}
            </span>
          ) : null}
          {document.viewedAt ? <span>Xem {formatDate(document.viewedAt)}</span> : null}
        </span>
        <span className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-slate-400">
          {document.subject.name} · {document.school.name}
        </span>
      </span>
    </Link>
  );
}
