import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Đăng nhập | HọcLiệu" };

type LoginPageProps = {
  searchParams: { status?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const notice =
    searchParams.status === "verified"
      ? "Xác minh email thành công. Bạn có thể đăng nhập."
      : searchParams.status === "password-reset"
        ? "Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới."
        : "";

  return (
    <AuthCard
      title="Đăng nhập"
      description="Đăng nhập để quản lý tài liệu và gọi thành viên của bạn."
      footnote={<>Chưa có tài khoản? <Link href="/register" className="font-semibold text-emerald-700">Đăng ký</Link></>}
    >
      {notice && (
        <p className="mt-7 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </p>
      )}
      <LoginForm />
    </AuthCard>
  );
}
