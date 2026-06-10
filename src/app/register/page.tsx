import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Đăng ký | HọcLiệu" };

/** Trang đăng ký tài khoản. */
export default function RegisterPage() {
  return (
    <AuthCard
      title="Tạo tài khoản"
      description="Đăng ký để đăng tải và lưu trữ tài liệu học tập."
      footnote={<>Đã có tài khoản? <Link href="/login" className="font-semibold text-emerald-700">Đăng nhập</Link></>}
    >
      <RegisterForm />
      <p className="mt-4 text-xs text-slate-500">Sau khi đăng ký, hệ thống sẽ gửi OTP xác minh email.</p>
    </AuthCard>
  );
}
