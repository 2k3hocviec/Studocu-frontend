"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type User = {
  id: number;
  fullName: string;
  email: string;
};

type Plan = {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  downloadLimit: number;
  description: string | null;
};

type Subscription = {
  id: number;
  endDate: string;
  plan: Plan;
} | null;

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type PageData<T> = {
  items: T[];
};

type Payment = {
  id: number;
  paymentUrl: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function getPlanHighlight(index: number, total: number) {
  return index === Math.min(1, total - 1);
}

async function request<T>(endpoint: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message ?? "Không thể kết nối tới máy chủ.");
  }

  return result.data;
}

export function UpgradePlans() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadMembership = useCallback(async (accessToken: string) => {
    const [account, planPage, activeSubscription] = await Promise.all([
      request<User>("/users/me", accessToken),
      request<PageData<Plan>>("/subscriptions/plans?page=1&limit=100", accessToken),
      request<Subscription>("/subscriptions/me", accessToken),
    ]);
    setUser(account);
    setPlans(planPage.items);
    setSubscription(activeSubscription);
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    loadMembership(accessToken)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Không thể tải các gói khóa học.");
      })
      .finally(() => setIsLoading(false));
  }, [loadMembership, router]);

  async function enroll(plan: Plan) {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setProcessingId(plan.id);
    setError("");

    try {
      const payment = await request<Payment>("/payments", accessToken, {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, method: "VNPAY" }),
      });
      if (!payment.paymentUrl) {
        throw new Error("Không nhận được đường dẫn thanh toán VNPAY.");
      }
      window.location.assign(payment.paymentUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tạo thanh toán VNPAY.");
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      <SiteHeader authenticated />

      <main className="profile-pattern mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-8 sm:py-10">
        <section className="rounded-2xl bg-gradient-to-r from-[#56b09c] to-[#70c4b4] px-7 py-8 text-[#12382f] shadow-sm sm:px-9">
          <p className="text-sm font-medium text-emerald-950/70">Tài khoản Premium</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Chọn gói tài liệu phù hợp</h1>
          <p className="mt-3 max-w-2xl text-sm text-emerald-950/75 sm:text-base">
            Mở khóa tài liệu Premium và tăng giới hạn tải xuống để học tập thuận tiện hơn.
          </p>
        </section>

        {user && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_7px_18px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Đăng ký cho tài khoản</p>
              <p className="mt-1 font-semibold text-slate-900">{user.fullName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-[#00734b]">
              Thanh toán an toàn qua VNPAY
            </span>
          </div>
        )}

        {subscription && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
            <p>
              Gói hiện tại: <span className="font-bold">{subscription.plan.name}</span>, có hiệu lực đến {formatDate(subscription.endDate)}.
            </p>
          </div>
        )}

        {error && <p className="mt-6 rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</p>}
        {isLoading && <p className="mt-10 text-center text-sm text-slate-500">Đang tải các gói Premium...</p>}

        {!isLoading && (
          <section className="mt-8 grid gap-5 md:grid-cols-3">
            {plans.map((plan, index) => {
              const highlighted = getPlanHighlight(index, plans.length);
              const current = subscription?.plan.id === plan.id;

              return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-7 shadow-[0_5px_16px_rgba(15,23,42,0.06)] ${
                  highlighted ? "border-[#16825f] ring-1 ring-[#16825f]" : "border-slate-200"
                }`}
              >
                {highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#16825f] px-4 py-1 text-xs font-semibold text-white">
                    Phổ biến nhất
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">{plan.name}</h2>
                  {current && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Đang dùng</span>}
                </div>
                <p className="mt-5 text-4xl font-bold tracking-tight text-[#00734b]">
                  {formatMoney(plan.price)}<span className="ml-1 text-xl">đ</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">{plan.durationDays} ngày sử dụng</p>
                <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <span className="text-[#16825f]">✓</span> {plan.downloadLimit} lượt tải tài liệu
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#16825f]">✓</span> Xem tài liệu Premium
                  </p>
                  {plan.description && (
                    <p className="flex items-start gap-2">
                      <span className="text-[#16825f]">✓</span> {plan.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={() => void enroll(plan)}
                  className={`mt-8 w-full ${
                    highlighted
                      ? "app-button-primary"
                      : "app-button-secondary"
                  }`}
                >
                  {processingId === plan.id ? "Đang chuyển đến VNPAY..." : current ? "Gia hạn qua VNPAY" : "Chọn gói này"}
                </button>
              </article>
              );
            })}
          </section>
        )}

        <p className="mt-9 text-center text-sm text-slate-500">
          Thanh toán qua VNPAY. Gói Premium được kích hoạt sau khi giao dịch thành công.
        </p>
      </main>
    </div>
  );
}
