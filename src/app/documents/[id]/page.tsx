"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DocumentViewer } from "@/components/document-viewer";
import { UnlockDialog } from "@/components/unlock-dialog";

interface Document {
    id: number;
    title: string;
    description?: string;
    uploader: {
        id: number;
        fullName: string;
        avatarUrl?: string;
    };
    school: {
        name: string;
    };
    subject: {
        name: string;
    };
    viewCount: number;
    downloadCount: number;
    createdAt: string;
    documentType: string;
    documentFile?: {
        fileUrl: string | null;
        previewUrl?: string | null;
        fileType: "PDF" | "DOCX" | "PPTX";
        totalPages?: number;
    };
    previews: Array<{ id: number; pageNumber: number; imageUrl: string; isBlurred: boolean }>;
    accessInfo: {
        canViewFull: boolean;
        isPremium: boolean;
        isOwner: boolean;
        hasPremium: boolean;
        hasUnlocked: boolean;
        needsUnlock: boolean;
        unlockCost: number;
    };
    reactionInfo: {
        likeCount: number;
        dislikeCount: number;
        myReaction: "LIKE" | "DISLIKE" | null;
    };
}

export default function DocumentPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const documentId = params.id;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
    const [document, setDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userCredit, setUserCredit] = useState(0);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [showUnlockDialog, setShowUnlockDialog] = useState(false);

    // Fetch document details
    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                setAccessToken(token);
                const headers: HeadersInit = {};
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const response = await fetch(
                    `${apiUrl}/documents/${documentId}`,
                    { headers }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("API Error:", response.status, errorData);
                    throw new Error(errorData.message || "Tài liệu không tồn tại hoặc chưa được duyệt");
                }

                const result = await response.json();
                console.log("✓ Document loaded:", result.data?.id, result.data?.title);
                setDocument(result.data);

                // Fetch user info to get credit
                if (token) {
                    const userResponse = await fetch(`${apiUrl}/users/me`, {
                        headers,
                    });
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        setUserCredit(userData.data?.creditBalance ?? 0);
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Lỗi không xác định";
                console.error("Fetch error:", message);
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocument();
    }, [apiUrl, documentId]);

    // Handle unlock
    const handleUnlock = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            setAccessToken(token);
            if (!token) {
                router.push("/login");
                return;
            }

            const response = await fetch(
                `${apiUrl}/documents/${documentId}/unlock`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 402) {
                throw new Error("Không đủ credits. Vui lòng nâng cấp Premium.");
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Lỗi mở quyền truy cập");
            }

            // Success - refresh document
            setShowUnlockDialog(false);
            const refreshResponse = await fetch(
                `${apiUrl}/documents/${documentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (refreshResponse.ok) {
                const result = await refreshResponse.json();
                setDocument(result.data);
                setUserCredit((prev) => prev - 1);
            }
        } catch (err) {
            console.error("Unlock error:", err);
            throw err;
        }
    };

    // Handle download
    const handleDownload = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            setAccessToken(token);
            if (token) {
                await fetch(`${apiUrl}/documents/${documentId}/download`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (err) {
            console.error("Download tracking error:", err);
        }
    };

    const handleFileDownload = async () => {
        // Check if user has access to full file
        if (!document?.accessInfo.canViewFull) {
            alert("Vui lòng mở quyền truy cập trước khi tải tài liệu");
            setShowUnlockDialog(true);
            return;
        }

        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            // Record download
            await handleDownload();

            // Download from protected endpoint
            const response = await fetch(`${apiUrl}/documents/${documentId}/file?download=1`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Download file error:", response.status, errorData);
                alert(`Lỗi tải tài liệu (${response.status}). Vui lòng thử lại.`);
                return;
            }

            // Download file
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = window.document.createElement("a");
            link.href = objectUrl;
            link.download = document?.title ?? "document";
            link.click();
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error("Download error:", err);
            alert("Lỗi tải tài liệu. Vui lòng thử lại.");
        }
    };

    const handleReaction = async (nextReaction: "LIKE" | "DISLIKE") => {
        if (!document?.accessInfo.canViewFull || !accessToken) return;

        const type = document.reactionInfo.myReaction === nextReaction ? null : nextReaction;
        const response = await fetch(`${apiUrl}/documents/${documentId}/reaction`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ type }),
        });
        if (!response.ok) return;

        const result = await response.json();
        setDocument((current) => current
            ? { ...current, reactionInfo: result.data }
            : current);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <SiteHeader authenticated={Boolean(accessToken)} />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-4xl mb-4">⏳</div>
                        <p className="text-slate-600 dark:text-slate-300">Đang tải tài liệu...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <SiteHeader authenticated={Boolean(accessToken)} />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Tài liệu không tồn tại
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
                        <button
                            onClick={() => router.push("/")}
                            className="app-button-primary"
                        >
                            Quay lại trang chủ
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <SiteHeader authenticated={Boolean(accessToken)} />

            <main className="flex-1 py-8 px-6">
                <div className="mx-auto max-w-4xl">
                    {/* Document Header */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                    {document.title}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-300">
                                    {document.description}
                                </p>
                            </div>

                            {/* Premium Badge */}
                            {document.accessInfo.isPremium && (
                                <div className="ml-4 px-3 py-1 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium whitespace-nowrap">
                                    👑 Premium
                                </div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400 pb-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <img
                                    src={document.uploader.avatarUrl || "/images/avatar-default.png"}
                                    alt={document.uploader.fullName}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span>{document.uploader.fullName}</span>
                            </div>
                            <div>📚 {document.school.name}</div>
                            <div>📖 {document.subject.name}</div>
                            <div>👁️ {document.viewCount} lượt xem</div>
                            <div>⬇️ {document.downloadCount} lượt tải</div>
                            <ReactionControls
                                canReact={Boolean(accessToken) && document.accessInfo.canViewFull}
                                reactionInfo={document.reactionInfo}
                                onReact={(type) => void handleReaction(type)}
                            />
                        </div>
                    </div>

                    {/* Access Status */}
                    {!document.accessInfo.canViewFull && (
                        <PaywallBanner
                            isAuthenticated={Boolean(accessToken)}
                            userCredit={userCredit}
                            unlockCost={document.accessInfo.unlockCost}
                            onUnlock={() => setShowUnlockDialog(true)}
                        />
                    )}

                    {document.accessInfo.isOwner && (
                        <div className="mb-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                ✓ Đây là tài liệu của bạn. Bạn có toàn quyền truy cập.
                            </p>
                        </div>
                    )}

                    {document.accessInfo.hasPremium && (
                        <div className="mb-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-lg p-4">
                            <p className="text-sm text-purple-800 dark:text-purple-300">
                                👑 Bạn có gói Premium. Bạn có toàn quyền truy cập.
                            </p>
                        </div>
                    )}

                    {document.accessInfo.hasUnlocked && !document.accessInfo.isOwner && !document.accessInfo.hasPremium && (
                        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-4">
                            <p className="text-sm text-emerald-800 dark:text-emerald-300">
                                ✓ Bạn đã mở quyền truy cập tài liệu này.
                            </p>
                        </div>
                    )}

                    {/* Document Viewer */}
                    {document.previews.length > 0 ? (
                        <div className="space-y-5">
                            {document.accessInfo.canViewFull && document.documentFile && (
                                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                    {document.documentFile.fileType === "DOCX" ? (
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Tài liệu Word
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {document.previews.length} trang
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => void handleFileDownload()}
                                        className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                                    >
                                        Tải xuống
                                    </button>
                                </div>
                            )}
                            <div className="space-y-6 rounded-xl bg-slate-200/70 px-3 py-6 dark:bg-slate-900 sm:px-6">
                                {document.previews.map((preview) => (
                                    <img
                                        key={preview.id}
                                        src={preview.imageUrl}
                                        alt={`Trang ${preview.pageNumber} của ${document.title}`}
                                        className={`mx-auto h-auto w-full max-w-[850px] rounded-sm border border-slate-300 bg-white shadow-sm ${preview.isBlurred ? "blur-sm" : ""}`}
                                    />
                                ))}
                            </div>
                            {!document.accessInfo.canViewFull && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        Đây là bản preview tối đa 5 trang / 30% tài liệu. Mở quyền truy cập để đọc toàn bộ và tải tài liệu.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : document.accessInfo.canViewFull && document.documentFile ? (
                        <DocumentViewer
                            fileUrl={`${apiUrl}/documents/${documentId}/file`}
                            fileType={document.documentFile.fileType}
                            totalPages={document.documentFile.totalPages}
                            isPreview={!document.accessInfo.canViewFull}
                            authToken={accessToken}
                            downloadFileName={document.title}
                            onDownload={handleDownload}
                        />
                    ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                            <p className="font-semibold">Tài liệu này chưa có bản preview.</p>
                            <p className="mt-1 text-sm">Mở quyền truy cập bằng 1 credit hoặc Premium để xem đầy đủ và tải xuống.</p>
                        </div>
                    )}

                    {/* Document Info Card */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 p-6">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Loại tài liệu</h3>
                            <p className="text-slate-600 dark:text-slate-400">{document.documentType}</p>
                        </div>

                        <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 p-6">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Ngày đăng</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                {new Date(document.createdAt).toLocaleDateString("vi-VN")}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 p-6">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Quyền truy cập</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                {document.accessInfo.canViewFull ? "✓ Toàn quyền" : "🔒 Preview"}
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Unlock Dialog */}
            <UnlockDialog
                isOpen={showUnlockDialog}
                creditCost={document.accessInfo.unlockCost}
                userCredit={userCredit}
                title={document.title}
                onUnlock={handleUnlock}
                onClose={() => setShowUnlockDialog(false)}
            />
        </div>
    );
}

function PaywallBanner({
    isAuthenticated,
    userCredit,
    unlockCost,
    onUnlock,
}: {
    isAuthenticated: boolean;
    userCredit: number;
    unlockCost: number;
    onUnlock: () => void;
}) {
    if (!isAuthenticated) {
        return (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <p className="font-semibold">Bạn đang xem bản preview.</p>
                <p className="mt-1 text-sm">
                    Đăng nhập để dùng credit mở khóa tài liệu, hoặc mua Premium để xem đầy đủ và tải xuống.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/login" className="app-button-primary app-button-compact">Đăng nhập</Link>
                    <Link href="/pricing" className="app-button-secondary app-button-compact">Xem Premium</Link>
                </div>
            </div>
        );
    }

    if (userCredit < unlockCost) {
        return (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
                <p className="font-semibold">Bạn chưa có đủ credit để xem toàn bộ tài liệu.</p>
                <p className="mt-1 text-sm">
                    Hiện tại bạn chỉ xem được preview tối đa 5 trang / 30%. Hãy mua Premium để xem đầy đủ và tải tài liệu.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/user/upgrade" className="app-button-primary app-button-compact">Mua Premium</Link>
                    <Link href="/user" className="app-button-secondary app-button-compact">Tìm tài liệu khác</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <p className="font-semibold">Bạn đang xem bản preview.</p>
                <p className="mt-1 text-sm">
                    Bạn có {userCredit} credit. Dùng {unlockCost} credit để xem toàn bộ tài liệu và tải xuống.
                </p>
            </div>
            <button
                type="button"
                onClick={onUnlock}
                className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
                Dùng {unlockCost} credit
            </button>
        </div>
    );
}

function ReactionControls({
    canReact,
    reactionInfo,
    onReact,
}: {
    canReact: boolean;
    reactionInfo: Document["reactionInfo"];
    onReact: (type: "LIKE" | "DISLIKE") => void;
}) {
    const disabledTitle = "Bạn cần đăng nhập và mở quyền tài liệu để đánh giá.";

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                disabled={!canReact}
                title={canReact ? "Thích tài liệu" : disabledTitle}
                onClick={() => onReact("LIKE")}
                className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    reactionInfo.myReaction === "LIKE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                }`}
            >
                <ThumbIcon direction="up" />
                <span>{reactionInfo.likeCount}</span>
            </button>
            <button
                type="button"
                disabled={!canReact}
                title={canReact ? "Không thích tài liệu" : disabledTitle}
                onClick={() => onReact("DISLIKE")}
                className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    reactionInfo.myReaction === "DISLIKE"
                        ? "border-rose-600 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-700"
                }`}
            >
                <ThumbIcon direction="down" />
                <span>{reactionInfo.dislikeCount}</span>
            </button>
        </div>
    );
}

function ThumbIcon({ direction }: { direction: "up" | "down" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${direction === "down" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M7 10v11" />
            <path d="M15 6.5 14 10h5.2a2 2 0 0 1 1.9 2.5l-1.8 6.8a2 2 0 0 1-1.9 1.5H7V10l4.3-7a2 2 0 0 1 3.7 1.5Z" />
            <path d="M3 10h4v11H3z" />
        </svg>
    );
}
