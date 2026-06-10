"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type PlanPosition = "short" | "middle" | "long";

const planBenefits: Record<PlanPosition, { label: string; title: string; description: string; accent: string; points: string[] }> = {
  short: {
    label: "Linh hoạt",
    title: "Dùng thử hoặc học gấp",
    description: "Phù hợp khi bạn cần mở tài liệu trong một khoảng thời gian ngắn.",
    accent: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    points: ["Kích hoạt nhanh", "Chi phí thấp"],
  },
  middle: {
    label: "Phổ biến",
    title: "Cân bằng chi phí và thời gian",
    description: "Lựa chọn hợp lý cho một đợt học, ôn thi hoặc làm bài tập lớn.",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    points: ["Thời hạn thoải mái hơn", "Tiết kiệm hơn gói ngắn"],
  },
  long: {
    label: "Tiết kiệm nhất",
    title: "Giá trị cao nhất cho học lâu dài",
    description: "Phù hợp nếu bạn dùng HọcLiệu thường xuyên trong cả học kỳ.",
    accent: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    points: ["Thời hạn dài nhất", "Chi phí theo ngày tốt nhất"],
  },
};

/** Format giá tiền gói premium. */
function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/** Format ngày hết hạn premium. */
function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

/** Xác định vị trí card gói để styling nổi bật. */
function planPosition(index: number, total: number): PlanPosition {
  if (total <= 1 || index === 0) return "short";
  if (index === total - 1) return "long";
  return "middle";
}

/** Tính giá trung bình mỗi ngày của gói. */
function dailyPrice(plan: Plan) {
  if (!plan.durationDays) return plan.price;
  return Math.round(plan.price / plan.durationDays);
}

/** Gọi API cần xác thực và chuẩn hóa lỗi. */
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

/** Gọi API public và chuẩn hóa response. */
async function publicRequest<T>(endpoint: string) {
  const response = await fetch(`${apiUrl}${endpoint}`);
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message ?? "Không thể kết nối tới máy chủ.");
  }

  return result.data;
}

type UpgradePlansProps = {
  authenticated?: boolean;
};

/** Hiển thị danh sách gói premium và xử lý thanh toán. */
export function UpgradePlans({ authenticated = true }: UpgradePlansProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.durationDays - b.durationDays || a.price - b.price), [plans]);

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
      if (authenticated) {
        router.replace("/login");
      } else {
        publicRequest<PageData<Plan>>("/subscriptions/plans?page=1&limit=100")
          .then((planPage) => {
            setPlans(planPage.items);
          })
          .catch((requestError) => {
            setError(requestError instanceof Error ? requestError.message : "Không thể tải các gói Premium.");
          })
          .finally(() => setIsLoading(false));
      }
      return;
    }

    loadMembership(accessToken)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Không thể tải các gói Premium.");
      })
      .finally(() => setIsLoading(false));
  }, [authenticated, loadMembership, router]);

  async function enroll(plan: Plan) {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/login");
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
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader authenticated={authenticated} />

      <main className="profile-pattern mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-8 sm:py-10">
        <section className="rounded-2xl bg-gradient-to-r from-[#56b09c] to-[#70c4b4] px-7 py-8 text-[#12382f] shadow-sm sm:px-9">
          <p className="text-sm font-medium text-emerald-950/70">Tài khoản Premium</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {authenticated ? "Chọn nhịp học phù hợp" : "Chọn gói Premium phù hợp"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-emerald-950/75 sm:text-base">
            {authenticated
              ? "Mỗi gói đều kích hoạt quyền lợi Premium cho tài khoản trong thời hạn đã chọn."
              : "Xem trước các gói Premium. Khi bạn chọn đăng ký, hệ thống sẽ chuyển đến trang đăng nhập."}
          </p>
        </section>

        {user && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_7px_18px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Đăng ký cho tài khoản</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-[#00734b] dark:bg-emerald-500/10 dark:text-emerald-300">
              Thanh toán an toàn qua VNPAY
            </span>
          </div>
        )}

        {subscription && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
              ✓
            </span>
            <p>
              Bạn đã kích hoạt tài khoản <span className="font-bold">Premium</span>. Hết hạn:{" "}
              <span className="font-bold">{formatDate(subscription.endDate)}</span>.
            </p>
          </div>
        )}

        {error && <p className="mt-6 rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        {isLoading && <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">Đang tải các gói Premium...</p>}

        {!isLoading && (
          <section className="mt-8 grid gap-5 md:grid-cols-3">
            {sortedPlans.map((plan, index) => {
              const position = planPosition(index, sortedPlans.length);
              const benefit = planBenefits[position];
              const highlighted = position === "middle";

              return (
                <article
                  key={plan.id}
                  className={`relative flex min-h-[475px] flex-col rounded-2xl border bg-white p-6 shadow-[0_5px_16px_rgba(15,23,42,0.06)] dark:bg-white/5 sm:p-7 ${
                    highlighted ? "border-[#16825f] ring-1 ring-[#16825f]" : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${benefit.accent}`}>{benefit.label}</span>
                    {highlighted ? (
                      <span className="rounded-full bg-[#16825f] px-3 py-1 text-xs font-semibold text-white">Đề xuất</span>
                    ) : null}
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{plan.name}</h2>
                  <p className="mt-2 min-h-[44px] text-sm text-slate-500 dark:text-slate-400">{benefit.title}</p>
                  <p className="mt-5 text-4xl font-bold tracking-tight text-[#00734b] dark:text-emerald-300">
                    {formatMoney(plan.price)}
                    <span className="ml-1 text-xl">đ</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {plan.durationDays} ngày sử dụng, khoảng {formatMoney(dailyPrice(plan))}đ/ngày
                  </p>

                  <div className={`mt-6 rounded-xl border p-4 text-sm ${benefit.accent}`}>
                    {benefit.description}
                  </div>

                  <div className="mt-5 flex-1 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                    <p className="flex items-start gap-2">
                      <span className="text-[#16825f] dark:text-emerald-300">✓</span>
                      <span>Kích hoạt quyền lợi tài khoản Premium trong thời hạn gói</span>
                    </p>
                    {benefit.points.map((point) => (
                      <p key={point} className="flex items-start gap-2">
                        <span className="text-[#16825f] dark:text-emerald-300">✓</span>
                        <span>{point}</span>
                      </p>
                    ))}
                    {plan.description ? (
                      <p className="flex items-start gap-2">
                        <span className="text-[#16825f] dark:text-emerald-300">✓</span>
                        <span>{plan.description}</span>
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={processingId !== null}
                    onClick={() => void enroll(plan)}
                    className={`mt-6 w-full ${highlighted ? "app-button-primary" : "app-button-secondary"}`}
                  >
                    {!authenticated && !user
                      ? "Đăng ký"
                      : processingId === plan.id
                        ? "Đang chuyển đến VNPAY..."
                        : subscription
                          ? "Gia hạn Premium qua VNPAY"
                          : "Kích hoạt Premium"}
                  </button>
                </article>
              );
            })}
          </section>
        )}

        <p className="mt-9 text-center text-sm text-slate-500 dark:text-slate-400">
          Thanh toán qua VNPAY. Premium được kích hoạt hoặc gia hạn sau khi giao dịch thành công.
        </p>
      </main>
    </div>
  );
}
