import type { Metadata } from "next";
import { PaymentResult } from "@/components/payment-result";

export const metadata: Metadata = { title: "Thanh toán thất bại | HọcLiệu" };

/** Trang kết quả thanh toán thất bại. */
export default function PaymentFailedPage() {
  return <PaymentResult success={false} />;
}
