import type { Metadata } from "next";
import { UpgradePlans } from "@/components/upgrade-plans";

export const metadata: Metadata = { title: "Nâng cấp tài khoản | HọcLiệu" };

/** Trang nâng cấp premium của user. */
export default function UpgradePage() {
  return <UpgradePlans authenticated />;
}
