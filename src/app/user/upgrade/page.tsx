import type { Metadata } from "next";
import { UpgradePlans } from "@/components/upgrade-plans";

export const metadata: Metadata = { title: "Nâng cấp tài khoản | HọcLiệu" };

export default function UpgradePage() {
  return <UpgradePlans authenticated />;
}
