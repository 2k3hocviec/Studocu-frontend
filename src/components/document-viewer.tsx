"use client";

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
}

export function DocumentViewer({ fileUrl, fileType, totalPages, isPreview = false, authToken, downloadFileName, onDownload }: DocumentViewerProps) {
    const { objectUrl, isLoading, error } = useProtectedFile(fileUrl, authToken, !isPreview);
    const viewerUrl = isPreview ? fileUrl : objectUrl;

    if (!isPreview && isLoading) {
        return <ViewerMessage tone="neutral" title="Đang mở tài liệu..." description="Hệ thống đang tải file qua endpoint nội bộ." />;
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
        return (
            <div className="space-y-4">
                {!isPreview && <div className="flex items-center justify-end rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <a
                        href={viewerUrl}
                        download={downloadFileName}
                        onClick={() => onDownload?.()}
                        className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        ⬇️ Tải xuống
                    </a>
                </div>}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                    <p className="font-semibold">Preview PowerPoint chưa được hỗ trợ.</p>
                    <p className="mt-1 text-sm">Bạn có thể tải file gốc để xem nội dung.</p>
                </div>
            </div>
        );
    }

    return <PDFPageViewer fileUrl={viewerUrl} totalPages={totalPages} downloadFileName={downloadFileName} onDownload={onDownload} />;
}

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
