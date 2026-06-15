"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, SubmitButton } from "@/components/form-controls";

type ApiResponse = {
  success: boolean;
  message?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

/** Form đăng ký tài khoản và chuyển sang bước xác thực OTP. */
export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordType = showPassword ? "text" : "password";
  const passwordRightIcon = showPassword ? (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.596m16.807 16.807L3.596 3.596m0 0A10.015 10.015 0 013.05 8.959m16.807 16.807L3.596 3.596" />
    </svg>
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      email,
      password,
      confirmPassword,
    };

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Không thể đăng ký tài khoản.");
      }

      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
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
      <Field label="Họ và tên" name="fullName" placeholder="Nguyễn Văn An" autoComplete="name" minLength={2} />
      <Field label="Email" name="email" type="email" placeholder="ban@example.com" autoComplete="email" />
      <Field
        label="Mật khẩu"
        name="password"
        type={passwordType}
        placeholder="Tối thiểu 8 ký tự"
        autoComplete="new-password"
        minLength={8}
        rightIcon={passwordRightIcon}
        onRightIconClick={() => setShowPassword(!showPassword)}
      />
      <Field
        label="Xác nhận mật khẩu"
        name="confirmPassword"
        type={passwordType}
        placeholder="Nhập lại mật khẩu"
        autoComplete="new-password"
        minLength={8}
        rightIcon={passwordRightIcon}
        onRightIconClick={() => setShowPassword(!showPassword)}
      />
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
      </SubmitButton>
    </form>
  );
}
