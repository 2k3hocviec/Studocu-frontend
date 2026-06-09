import type { Metadata } from "next";
import { Suspense } from "react";
import { UserDocumentBrowser } from "@/components/user-document-browser";

export const metadata: Metadata = { title: "Kho tài liệu | HọcLiệu" };

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <UserDocumentBrowser authenticated={false} />
    </Suspense>
  );
}
