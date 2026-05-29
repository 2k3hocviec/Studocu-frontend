"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
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

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

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

  function authToken() {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) router.replace("/login");
    return accessToken;
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
        </aside>

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
