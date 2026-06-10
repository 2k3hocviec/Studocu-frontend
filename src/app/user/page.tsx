import type { Metadata } from "next";
import { Suspense } from "react";
import { UserDocumentBrowser } from "@/components/user-document-browser";

export const metadata: Metadata = { title: "Tài liệu học tập | HọcLiệu" };

/** Trang thư viện tài liệu dành cho user. */
export default function UserPage() {
  return (
    <Suspense fallback={null}>
      <UserDocumentBrowser />
    </Suspense>
  );
}
