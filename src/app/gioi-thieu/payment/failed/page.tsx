import type { Metadata } from "next";
import { PaymentResult } from "@/components/payment-result";

export const metadata: Metadata = { title: "Thanh toán thất bại | HọcLiệu" };

export default function PaymentFailedPage() {
  return <PaymentResult success={false} />;
}
