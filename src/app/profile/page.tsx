import type { Metadata } from "next";
import { ProfilePanel } from "@/components/profile-panel";

export const metadata: Metadata = { title: "Hồ sơ cá nhân | HọcLiệu" };

export default function ProfilePage() {
  return <ProfilePanel />;
}
