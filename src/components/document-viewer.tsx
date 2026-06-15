"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { DOCXViewer } from "@/components/docx-viewer";
import { PDFPageViewer } from "@/components/pdf-page-viewer";

interface DocumentViewerProps {
  fileUrl: string;
  fileType?: "PDF" | "DOCX" | "PPTX" | string;
  totalPages?: number;
  isPreview?: boolean;
  authToken?: string | null;
  downloadFileName?: string;
  onDownload?: () => void;
  fallback?: ReactNode;
  apiBase?: string;
  documentId?: number | string;
  previews?: Array<{ pageNumber: number; imageUrl: string }>;
}

/** Chọn trình hiển thị phù hợp cho các file tài liệu PDF, DOCX và PPTX. */
export function DocumentViewer({ fileUrl, fileType, totalPages, isPreview = false, authToken, downloadFileName, onDownload, fallback, apiBase, documentId, previews }: DocumentViewerProps) {
  const fullViewUrl =
    !isPreview && fileType === "PPTX" && apiBase && documentId !== undefined
      ? `${apiBase}/documents/${documentId}/file/pdf`
      : fileUrl;
  const { objectUrl, isLoading, error } = useProtectedFile(fullViewUrl, authToken, !isPreview);
  const viewerUrl = isPreview ? fileUrl : objectUrl;

  if (!isPreview && isLoading) {
    return <ViewerLoadingState />;
  }

  if (!isPreview && error && fallback) {
    return <>{fallback}</>;
  }

  if (!isPreview && error) {
    return <ViewerMessage tone="error" title="Không thể mở tài liệu" description={error} />;
  }

  if (!viewerUrl) {
    return <ViewerMessage tone="neutral" title="Chưa có file để hiển thị" description="Vui lòng thử lại sau." />;
  }

  if (fileType === "DOCX") {
    return <DOCXViewer fileUrl={viewerUrl} isPreview={isPreview} onDownload={onDownload} />;
  }

  if (fileType === "PPTX") {
    if (isPreview) {
      return <PPTXPreviewGallery previews={previews} totalPages={totalPages} />;
    }
    return (
      <PDFPageViewer
        fileUrl={viewerUrl ?? fullViewUrl}
        totalPages={totalPages}
        downloadFileName={downloadFileName?.replace(/\.pptx$/i, ".pdf")}
        onDownload={onDownload}
      />
    );
  }

  return <PDFPageViewer fileUrl={viewerUrl} totalPages={totalPages} downloadFileName={downloadFileName} onDownload={onDownload} />;
}

/** Tải file được bảo vệ thành object URL để trình duyệt hiển thị được nội dung cần xác thực. */
function useProtectedFile(fileUrl: string, authToken: string | null | undefined, enabled: boolean) {
  const [objectUrl, setObjectUrl] = useState<string | null>(enabled ? null : fileUrl);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setObjectUrl(fileUrl);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let nextObjectUrl: string | null = null;

    /** Tải file tài liệu bảo mật và chuyển thành object URL tạm thời. */
    async function loadFile() {
      setIsLoading(true);
      setError(null);
      setObjectUrl(null);

      try {
        const response = await fetch(fileUrl, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(response.status === 403 ? "Bạn chưa có quyền xem toàn bộ tài liệu." : `HTTP ${response.status}`);
        }

        const blob = await response.blob();
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Lỗi không xác định");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadFile();

    return () => {
      controller.abort();
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [authToken, enabled, fileUrl]);

  return { objectUrl, isLoading, error };
}

/** Hiển thị trạng thái đang tải với hiệu ứng khung trang PDF mô phỏng và spinner. */
function ViewerLoadingState() {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Đang tải tài liệu">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative mx-auto h-[640px] max-w-3xl animate-pulse rounded-lg bg-slate-200/80 shadow-sm dark:bg-slate-800/60"
        >
          <span
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-600 dark:border-t-emerald-400"
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
}

/** Hiển thị trạng thái trống hoặc lỗi dùng lại trong khung xem tài liệu. */
function ViewerMessage({ title, description, tone }: { title: string; description: string; tone: "neutral" | "error" }) {
  const classes = tone === "error"
    ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200"
    : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";

  return (
    <div className={`rounded-lg border p-6 ${classes}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}

/** Hiển thị danh sách ảnh preview PowerPoint giống gallery mặc định. */
function PPTXPreviewGallery({ previews, totalPages }: { previews?: Array<{ pageNumber: number; imageUrl: string }>; totalPages?: number }) {
  if (!previews || previews.length === 0) {
    return (
      <ViewerMessage
        tone="neutral"
        title="Chưa có bản preview"
        description="Tài liệu PowerPoint này chưa được tạo ảnh xem trước."
      />
    );
  }
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        {totalPages ? `${totalPages} trang` : `${previews.length} trang preview`}
      </div>
      <div className="space-y-6 rounded-xl bg-slate-200/70 px-3 py-6 dark:bg-slate-900 sm:px-6">
        {previews.map((preview) => (
          <img
            key={preview.pageNumber}
            src={preview.imageUrl}
            alt={`Trang ${preview.pageNumber}`}
            className="mx-auto h-auto w-full max-w-[850px] rounded-sm border border-slate-300 bg-white shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
