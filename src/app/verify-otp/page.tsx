import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { VerifyOtpForm } from "@/components/verify-otp-form";

export const metadata: Metadata = { title: "Xác minh OTP | HọcLiệu" };

type VerifyPageProps = {
  searchParams: { flow?: string; email?: string };
};

export default function VerifyOtpPage({ searchParams }: VerifyPageProps) {
  const resetPassword = searchParams.flow === "reset";
  const email = searchParams.email ?? "";

  return (
    <AuthCard
      title={resetPassword ? "Đặt lại mật khẩu" : "Xác minh email"}
      description={resetPassword ? "Nhập OTP đã nhận và mật khẩu mới của bạn." : "Nhập mã OTP 6 chữ số đã được gửi tới email đăng ký."}
      footnote={<Link href="/login" className="font-semibold text-emerald-700">Về trang đăng nhập</Link>}
    >
      <VerifyOtpForm email={email} resetPassword={resetPassword} />
    </AuthCard>
  );
}
