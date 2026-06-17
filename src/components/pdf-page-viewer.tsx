"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url,
    ).toString();
}

type PdfDocument = {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PdfPage>;
    destroy: () => Promise<void>;
};

type PdfPage = {
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void>; cancel: () => void };
    cleanup: () => void;
};

interface PDFPageViewerProps {
    fileUrl: string;
    totalPages?: number;
    downloadFileName?: string;
    onDownload?: () => void;
}

/** Trình xem PDF render từng trang bằng pdf.js canvas. */
export function PDFPageViewer({ fileUrl, totalPages = 0, downloadFileName, onDownload }: PDFPageViewerProps) {
    const [pdfDocument, setPdfDocument] = useState<PdfDocument | null>(null);
    const [pageCount, setPageCount] = useState(totalPages);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let loadedDocument: PdfDocument | null = null;

        async function loadPdf() {
            setIsLoading(true);
            setError(null);
            setPdfDocument(null);

            try {
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.arrayBuffer();
                const loadingTask = pdfjs.getDocument({ data });
                loadedDocument = (await loadingTask.promise) as unknown as PdfDocument;

                if (cancelled) {
                    await loadedDocument.destroy();
                    return;
                }

                setPdfDocument(loadedDocument);
                setPageCount(loadedDocument.numPages);
            } catch (requestError) {
                if (!cancelled) {
                    setError(requestError instanceof Error ? requestError.message : "Lỗi không xác định");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void loadPdf();

        return () => {
            cancelled = true;
            if (loadedDocument) void loadedDocument.destroy();
        };
    }, [fileUrl]);

    if (isLoading) {
        return <ViewerShell title="Đang tách trang PDF..." description="Hệ thống đang render tài liệu thành từng trang." />;
    }

    if (error || !pdfDocument) {
        return <ViewerShell title="Không thể hiển thị PDF" description={error ?? "Không tải được tài liệu."} tone="error" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {pageCount} trang
                </p>
                <a
                    href={fileUrl}
                    download={downloadFileName ? (downloadFileName.replace(/\.[^.]+$/, "") + ".pdf") : undefined}
                    onClick={() => onDownload?.()}
                    className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                >
                    Tải xuống
                </a>
            </div>

            <div className="space-y-5">
                {Array.from({ length: pageCount }, (_, index) => (
                    <LazyPDFCanvasPage key={index + 1} pdfDocument={pdfDocument} pageNumber={index + 1} />
                ))}
            </div>
        </div>
    );
}

/** Đặt chỗ cho một trang PDF, chỉ render canvas khi gần cuộn tới (IntersectionObserver). */
function LazyPDFCanvasPage({ pdfDocument, pageNumber }: { pdfDocument: PdfDocument; pageNumber: number }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(pageNumber <= 2);

    useEffect(() => {
        if (shouldRender) return;
        const node = containerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShouldRender(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "300px" },
        );
        observer.observe(node);

        return () => observer.disconnect();
    }, [shouldRender]);

    return (
        <section
            ref={containerRef}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10"
        >
            {shouldRender ? (
                <PDFCanvasPage pdfDocument={pdfDocument} pageNumber={pageNumber} />
            ) : (
                <div className="bg-slate-100 p-3">
                    <div className="mx-auto aspect-[1/1.414] w-full max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
            )}
        </section>
    );
}

/** Render một trang PDF vào canvas. */
function PDFCanvasPage({ pdfDocument, pageNumber }: { pdfDocument: PdfDocument; pageNumber: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let renderTask: ReturnType<PdfPage["render"]> | null = null;

        async function renderPage() {
            try {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const page = await pdfDocument.getPage(pageNumber);
                if (cancelled) return;

                const viewport = page.getViewport({ scale: 1.2 });
                const context = canvas.getContext("2d");
                if (!context) throw new Error("Canvas is not available");

                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                renderTask = page.render({ canvasContext: context, viewport });
                await renderTask.promise;
                page.cleanup();
            } catch (requestError) {
                if (!cancelled) {
                    setError(requestError instanceof Error ? requestError.message : "Không render được trang.");
                }
            }
        }

        void renderPage();

        return () => {
            cancelled = true;
            renderTask?.cancel();
        };
    }, [pageNumber, pdfDocument]);

    if (error) {
        return <p className="p-5 text-sm text-red-700">{error}</p>;
    }

    return (
        <div className="bg-slate-100 p-3">
            <canvas ref={canvasRef} className="mx-auto h-auto w-full max-w-full bg-white" />
        </div>
    );
}

/** Khung trạng thái dùng chung cho trình xem PDF. */
function ViewerShell({ title, description, tone = "neutral" }: { title: string; description: string; tone?: "neutral" | "error" }) {
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
