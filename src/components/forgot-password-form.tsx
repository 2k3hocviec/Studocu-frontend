"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, SubmitButton } from "@/components/form-controls";

type ApiResponse = {
  success: boolean;
  message?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Không thể gửi mã OTP.");
      }

      router.push(`/verify-otp?flow=reset&email=${encodeURIComponent(email)}`);
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
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang gửi..." : "Gửi mã OTP"}
      </SubmitButton>
    </form>
  );
}
