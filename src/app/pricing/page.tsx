import type { Metadata } from "next";
import { UpgradePlans } from "@/components/upgrade-plans";

export const metadata: Metadata = { title: "Gói Premium | HọcLiệu" };

export default function PricingPage() {
  return <UpgradePlans authenticated={false} />;
}
