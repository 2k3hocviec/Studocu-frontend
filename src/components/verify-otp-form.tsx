"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, SubmitButton } from "@/components/form-controls";

type VerifyOtpFormProps = {
  email: string;
  resetPassword: boolean;
};

type ApiResponse = {
  success: boolean;
  message?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

/** Form xác thực OTP cho đăng ký hoặc đặt lại mật khẩu. */
export function VerifyOtpForm({ email, resetPassword }: VerifyOtpFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      otpCode: String(formData.get("otpCode") ?? "").trim(),
      ...(resetPassword
        ? { password: String(formData.get("password") ?? "") }
        : {}),
    };
    const endpoint = resetPassword ? "/auth/reset-password" : "/auth/verify-email";

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Không thể xác minh mã OTP.");
      }

      const status = resetPassword ? "password-reset" : "verified";
      router.push(`/login?status=${status}`);
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
      <Field label="Email" name="email" type="email" placeholder="ban@example.com" autoComplete="email" defaultValue={email} />
      <Field label="Mã OTP" name="otpCode" placeholder="000000" autoComplete="one-time-code" pattern="[0-9]{6}" />
      {resetPassword && (
        <Field label="Mật khẩu mới" name="password" type="password" placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" minLength={8} />
      )}
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Đang xử lý..."
          : resetPassword
            ? "Đặt lại mật khẩu"
            : "Xác minh email"}
      </SubmitButton>
    </form>
  );
}
