"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/user" className="text-xl font-bold text-emerald-700 dark:text-emerald-400">HọcLiệu</Link>
          <Link href="/user" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-white">
            Về tài liệu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Nâng cấp tài khoản</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-950 dark:text-white">Chọn gói khóa học phù hợp</h1>
        {user && <p className="mt-4 text-slate-600 dark:text-slate-300">Đăng ký cho <span className="font-semibold">{user.fullName}</span> ({user.email})</p>}

        {subscription && (
          <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            Gói hiện tại: <span className="font-bold">{subscription.plan.name}</span>, có hiệu lực đến {formatDate(subscription.endDate)}.
          </div>
        )}

        {error && <p className="mt-7 rounded-2xl bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
        {isLoading && <p className="mt-10 text-sm text-slate-500">Đang tải các gói khóa học...</p>}

        {!isLoading && (
          <section className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">{plan.name}</h2>
                <p className="mt-4 text-4xl font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(plan.price)}đ</p>
                <p className="mt-2 text-sm text-slate-500">{plan.durationDays} ngày sử dụng</p>
                <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                  {plan.downloadLimit} lượt tải tài liệu
                </p>
                {plan.description && <p className="mt-3 text-sm text-slate-500">{plan.description}</p>}
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={() => void enroll(plan)}
                  className="mt-7 h-12 w-full rounded-xl bg-emerald-700 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-500"
                >
                  {processingId === plan.id ? "Đang chuyển đến VNPAY..." : "Thanh toán qua VNPAY"}
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
