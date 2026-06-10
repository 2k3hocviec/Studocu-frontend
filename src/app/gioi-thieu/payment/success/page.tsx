import type { Metadata } from "next";
import { PaymentResult } from "@/components/payment-result";

export const metadata: Metadata = { title: "Thanh toán thành công | HọcLiệu" };

/** Trang kết quả thanh toán thành công. */
export default function PaymentSuccessPage() {
  return <PaymentResult success />;
}
