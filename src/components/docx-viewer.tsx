"use client";

import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

interface DOCXViewerProps {
    fileUrl: string;
    isPreview?: boolean;
    onDownload?: () => void;
}

export function DOCXViewer({ fileUrl, isPreview = false, onDownload }: DOCXViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function renderDocx() {
            if (!containerRef.current) return;

            setIsLoading(true);
            setError(null);
            containerRef.current.innerHTML = "";

            try {
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const blob = await response.blob();
                if (cancelled || !containerRef.current) return;

                await renderAsync(blob, containerRef.current, undefined, {
                    className: "docx",
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    breakPages: true,
                    renderHeaders: true,
                    renderFooters: true,
                    useBase64URL: true,
                });
            } catch (err) {
                if (!cancelled) {
                    const message = err instanceof Error ? err.message : "Lỗi không xác định";
                    setError(`Không thể tải tài liệu Word: ${message}`);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void renderDocx();

        return () => {
            cancelled = true;
        };
    }, [fileUrl]);

    return (
        <div className="space-y-4">
            {!isPreview && <DownloadBar fileUrl={fileUrl} onDownload={onDownload} />}

            <div className={`relative overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-white/10 dark:bg-slate-900 ${isPreview ? "max-h-[520px]" : ""}`}>
                {isLoading && (
                    <div className="flex h-96 items-center justify-center">
                        <div className="text-center">
                            <div className="mb-2 inline-block animate-spin text-3xl">⏳</div>
                            <p className="text-slate-600 dark:text-slate-400">Đang tải tài liệu Word...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex h-96 items-center justify-center rounded-lg border border-red-200 bg-red-50">
                        <div className="text-center">
                            <div className="mb-2 text-4xl">⚠️</div>
                            <p className="font-semibold text-red-800">{error}</p>
                            <p className="mt-1 text-sm text-red-600">Bạn vẫn có thể tải file gốc ở phía trên.</p>
                        </div>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className={`mx-auto max-w-full overflow-auto bg-white text-slate-950 shadow-sm ${isLoading || error ? "hidden" : ""}`}
                />

                {isPreview && !isLoading && !error && (
                    <div className="pointer-events-none sticky bottom-0 -mx-4 -mb-4 bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-4 pt-20 text-center">
                        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                            Đây là bản xem trước. Mở quyền truy cập để đọc toàn bộ tài liệu.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DownloadBar({ fileUrl, onDownload }: { fileUrl: string; onDownload?: () => void }) {
    return (
        <div className="flex items-center justify-end rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <a
                href={fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onDownload?.()}
                className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
            >
                ⬇️ Tải xuống
            </a>
        </div>
    );
}
