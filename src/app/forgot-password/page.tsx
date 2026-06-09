import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Quên mật khẩu | HọcLiệu" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Quên mật khẩu"
      description="Nhập email đăng ký. Hệ thống sẽ gửi mã OTP đặt lại mật khẩu nếu tài khoản tồn tại."
      footnote={<Link href="/login" className="font-semibold text-emerald-700">Quay lại đăng nhập</Link>}
    >
      <ForgotPasswordForm />
      <Link href="/verify-otp?flow=reset" className="mt-5 block text-center text-sm font-semibold text-emerald-700">
        Tôi đã có mã OTP
      </Link>
    </AuthCard>
  );
}
