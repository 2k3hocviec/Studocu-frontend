"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, SubmitButton } from "@/components/form-controls";

type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
};

type TokenPayload = {
  role?: "USER" | "ADMIN" | "MODERATOR";
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

function readRole(accessToken: string) {
  try {
    const segment = accessToken.split(".")[1];
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return (JSON.parse(decoded) as TokenPayload).role;
  } catch {
    return undefined;
  }
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
          password: String(formData.get("password") ?? ""),
        }),
      });
      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message ?? "Không thể đăng nhập.");
      }

      const role = readRole(result.data.accessToken);
      if (!role) {
        throw new Error("Không xác định được quyền tài khoản.");
      }

      localStorage.setItem("accessToken", result.data.accessToken);
      localStorage.setItem("refreshToken", result.data.refreshToken);
      router.push(role === "USER" ? "/user" : "/admin");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể kết nối tới máy chủ.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <Field label="Email" name="email" type="email" placeholder="ban@example.com" autoComplete="email" />
      <div>
        <Field label="Mật khẩu" name="password" type="password" placeholder="Nhập mật khẩu" autoComplete="current-password" />
        <Link href="/forgot-password" className="mt-3 block text-right text-sm font-semibold text-emerald-700">
          Quên mật khẩu?
        </Link>
      </div>
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </SubmitButton>
    </form>
  );
}
