"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/form-controls";

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

function getInitials(fullName: string) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "HL";
}

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader authenticated />
      <main className="mx-auto grid max-w-4xl gap-6 px-6 py-10 md:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-white/5">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={`Ảnh đại diện của ${profile.fullName}`}
              className="mx-auto h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto grid h-20 w-20 place-content-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-900/40">
              {getInitials(profile?.fullName ?? fullName)}
            </div>
          )}
          <p className="mt-4 font-semibold text-slate-950 dark:text-white">
            {profile?.fullName || (isLoading ? "Đang tải..." : "Thông tin tài khoản")}
          </p>
          <p className="mt-1 break-all text-sm text-slate-500">{profile?.email ?? "Thành viên HọcLiệu"}</p>
        </aside>
        <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-white/10 dark:bg-white/5 sm:p-9">
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Hồ sơ cá nhân</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
            Quản lý tên hiển thị và ảnh đại diện của tài khoản bạn.
          </p>
          {isLoading ? (
            <p className="mt-8 text-sm text-slate-500">Đang tải thông tin hồ sơ...</p>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Họ và tên
                <input
                  type="text"
                  name="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  minLength={2}
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Ảnh đại diện (URL)
                <input
                  type="url"
                  name="avatarUrl"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
                <input
                  type="email"
                  value={profile?.email ?? ""}
                  disabled
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal text-slate-500 dark:border-white/10 dark:bg-white/5"
                />
              </label>
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              {notice ? <p className="text-sm font-medium text-emerald-700">{notice}</p> : null}
              <SubmitButton type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </SubmitButton>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
