"use client";

import { useCallback, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker
if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
    fileUrl: string;
    totalPages?: number;
    isPreview?: boolean;
    onDownload?: () => void;
}

export function PDFViewer({ fileUrl, totalPages = 0, isPreview = false, onDownload }: PDFViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);

    const maxPage = isPreview ? 3 : numPages || totalPages || 100;

    // Reset loading when file URL changes
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        setCurrentPage(1);
    }, [fileUrl]);

    const handlePrevPage = useCallback(() => {
        setCurrentPage((p) => Math.max(1, p - 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage((p) => Math.min(maxPage, p + 1));
    }, [maxPage]);

    const handleZoomIn = useCallback(() => {
        setScale((s) => Math.min(2, s + 0.2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale((s) => Math.max(0.5, s - 0.2));
    }, []);

    const handleResetZoom = useCallback(() => {
        setScale(1);
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
        console.log(`✓ PDF loaded successfully: ${numPages} pages`);
    };

    const onDocumentLoadError = (err: Error) => {
        const errorMsg = `Không thể tải tài liệu PDF: ${err.message || "Lỗi không xác định"}`;
        setError(errorMsg);
        setIsLoading(false);
        console.error("PDF load error:", err);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
                <div className="text-center">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-red-800 font-semibold">{error}</p>
                    <p className="text-sm text-red-600 mt-1">Không thể tải tài liệu. Vui lòng thử lại.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/10">
                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                        className="h-10 px-3 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                    >
                        ←
                    </button>

                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min="1"
                            max={maxPage}
                            value={currentPage}
                            onChange={(e) => setCurrentPage(Math.min(maxPage, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-12 text-center h-10 border border-slate-300 dark:border-white/10 rounded-lg dark:bg-white/5 dark:text-white"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300">/ {maxPage}</span>
                    </div>

                    <button
                        onClick={handleNextPage}
                        disabled={currentPage >= maxPage}
                        className="h-10 px-3 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                    >
                        →
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomOut}
                        className="h-10 px-3 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                        title="Zoom out"
                    >
                        −
                    </button>

                    <button
                        onClick={handleResetZoom}
                        className="h-10 px-4 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-sm whitespace-nowrap"
                        title="Reset zoom"
                    >
                        {Math.round(scale * 100)}%
                    </button>

                    <button
                        onClick={handleZoomIn}
                        className="h-10 px-3 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                        title="Zoom in"
                    >
                        +
                    </button>
                </div>

                {/* Download button */}
                <a
                    href={fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onDownload?.()}
                    className="h-10 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium"
                >
                    ⬇️ Tải xuống
                </a>
            </div>

            {/* PDF Viewer */}
            <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-auto bg-slate-100 dark:bg-slate-900 p-4 max-h-[600px] flex justify-center">
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="h-96 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="inline-block animate-spin text-3xl mb-2">⏳</div>
                                    <p className="text-slate-600 dark:text-slate-400">Đang tải PDF...</p>
                                </div>
                            </div>
                        }
                        error={
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">⚠️</div>
                                    <p className="text-red-800 dark:text-red-300">Lỗi tải PDF</p>
                                </div>
                            </div>
                        }
                    >
                        <div
                            className={isLoading ? "hidden" : ""}
                            style={{
                                transform: `scale(${scale})`,
                                transformOrigin: "top center",
                                transition: "transform 0.2s",
                            }}
                        >
                            <Page
                                pageNumber={currentPage}
                                width={700}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />
                        </div>
                    </Document>
                </div>
            </div>

            {/* Info */}
            {isPreview && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        Đây là bản preview. Đăng nhập để xem đầy đủ và tải tài liệu.
                    </p>
                </div>
            )}
        </div>
    );
}
