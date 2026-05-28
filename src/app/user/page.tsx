import type { Metadata } from "next";
import { UserDocumentBrowser } from "@/components/user-document-browser";

export const metadata: Metadata = { title: "Tài liệu học tập | HọcLiệu" };

export default function UserPage() {
  return <UserDocumentBrowser />;
}
