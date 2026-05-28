"use client";

import { useState } from "react";

interface UnlockDialogProps {
    isOpen: boolean;
    creditCost: number;
    userCredit: number;
    title: string;
    onUnlock: () => Promise<void>;
    onClose: () => void;
}

export function UnlockDialog({ isOpen, creditCost, userCredit, title, onUnlock, onClose }: UnlockDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasEnoughCredit = userCredit >= creditCost;

    const handleUnlock = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onUnlock();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi không xác định");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full animate-scaleUp">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-white/10 p-6">
                    <button
                        onClick={onClose}
                        className="float-right text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        ✕
                    </button>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">🔓 Mở quyền truy cập</h2>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">&quot;{title}&quot;</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Để xem toàn bộ tài liệu này, bạn cần mở quyền truy cập.
                        </p>
                    </div>

                    {/* Credit Info */}
                    <div className="space-y-3">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Chi phí:</span>
                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{creditCost} credits</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Số credit của bạn:</span>
                                <span className={`text-xl font-bold ${hasEnoughCredit ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
                                    {userCredit} credits
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
                            ⚠️ {error}
                        </div>
                    )}

                    {!hasEnoughCredit && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-3">
                                ⚠️ Bạn không có đủ credits
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                                Bạn cần {creditCost - userCredit} credits nữa.{" "}
                                <a href="/user/upgrade" className="font-semibold underline hover:no-underline">
                                    Nâng cấp Premium
                                </a>{" "}
                                để xem không giới hạn.
                            </p>
                        </div>
                    )}

                    {/* Benefits */}
                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Sau khi mở quyền:</p>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                            <li>✓ Xem toàn bộ tài liệu</li>
                            <li>✓ Tải xuống (không cần trừ credit thêm)</li>
                            <li>✓ Quyền truy cập vĩnh viễn</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-white/10 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleUnlock}
                        disabled={!hasEnoughCredit || isLoading}
                        className="flex-1 h-12 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="inline-block animate-spin">⏳</span>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                🔓 Mở quyền ({creditCost} credits)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
