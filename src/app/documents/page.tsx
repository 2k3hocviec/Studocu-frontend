import type { Metadata } from "next";
import { Suspense } from "react";
import { UserDocumentBrowser } from "@/components/user-document-browser";

export const metadata: Metadata = { title: "Kho tài liệu | HọcLiệu" };

/** Trang danh sách tài liệu công khai. */
export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <UserDocumentBrowser authenticated={false} />
    </Suspense>
  );
}
