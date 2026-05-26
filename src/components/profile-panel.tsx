"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export function ProfilePanel() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = (await response.json()) as ApiResponse<UserProfile>;

        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          router.replace("/login");
          return;
        }

        if (!response.ok || !result.data) {
          throw new Error(result.message ?? "Không thể tải thông tin hồ sơ.");
        }

        setProfile(result.data);
        setFullName(result.data.fullName);
        setAvatarUrl(result.data.avatarUrl ?? "");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Không thể tải thông tin hồ sơ.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          avatarUrl: avatarUrl.trim() || null,
        }),
      });
      const result = (await response.json()) as ApiResponse<UserProfile>;

      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.data) {
        throw new Error(result.message ?? "Không thể lưu thay đổi.");
      }

      setProfile(result.data);
      setFullName(result.data.fullName);
      setAvatarUrl(result.data.avatarUrl ?? "");
      setNotice("Đã cập nhật thông tin hồ sơ.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu thay đổi.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      <SiteHeader authenticated />
      <main className="profile-pattern mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl content-start gap-6 px-6 py-11 md:grid-cols-[255px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white px-7 pb-8 pt-14 text-center shadow-[0_7px_18px_rgba(15,23,42,0.08)]">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={`Ảnh đại diện của ${profile.fullName}`}
              className="mx-auto h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto grid h-16 w-16 place-content-center rounded-full bg-slate-100 text-slate-600">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.55">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5.5 20c.3-4 3-6.2 6.5-6.2s6.2 2.2 6.5 6.2" />
              </svg>
            </div>
          )}
          <p className="mt-16 text-lg font-semibold text-slate-950">
            {profile?.fullName || (isLoading ? "Đang tải..." : "Thông tin tài khoản")}
          </p>
          <p className="mt-1 break-all text-sm leading-5 text-slate-500">{profile?.email ?? "Thành viên HọcLiệu"}</p>
        </aside>
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_7px_18px_rgba(15,23,42,0.08)] sm:px-9 sm:pb-9 sm:pt-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#123329]">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-sm text-slate-500">
            Quản lý tên hiển thị và ảnh đại diện của tài khoản bạn.
          </p>
          {isLoading ? (
            <p className="mt-8 text-sm text-slate-500">Đang tải thông tin hồ sơ...</p>
          ) : (
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-800">
                Họ và tên
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-slate-500 transition focus-within:border-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="3" />
                    <path d="M6.5 19c.5-3.6 2.7-5.4 5.5-5.4s5 1.8 5.5 5.4" />
                  </svg>
                  <input
                    type="text"
                    name="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    minLength={2}
                    required
                    className="w-full bg-transparent font-normal text-slate-900 outline-none"
                  />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-800">
                Ảnh đại diện (URL)
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-slate-500 transition focus-within:border-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M7 18h10a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 7 9.5 4.2 4.2 0 0 0 7 18Z" />
                  </svg>
                  <input
                    type="url"
                    name="avatarUrl"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-transparent font-normal text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="m6.5 16 4.2-4.5 3.2 3 2.4-2.3 3.2 3.8" />
                  </svg>
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-800">
                <span className="flex justify-between">
                  <span>Email</span>
                  <span className="font-normal text-slate-400">Đã xác minh</span>
                </span>
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-4 text-slate-500">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                    <path d="m5 7 7 5 7-5" />
                  </svg>
                  <input
                    type="email"
                    value={profile?.email ?? ""}
                    disabled
                    className="w-full bg-transparent font-normal text-slate-500 outline-none"
                  />
                  <span className="h-5 w-5 rounded-full border-2 border-emerald-600 border-t-transparent" />
                </span>
              </label>
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              {notice ? <p className="text-sm font-medium text-emerald-700">{notice}</p> : null}
              <button
                type="submit"
                disabled={isSaving}
                className="app-button-primary mt-2 w-full gap-2"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"} <span aria-hidden>→</span>
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
