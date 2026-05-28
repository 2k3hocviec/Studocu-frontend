"use client";

import { useState } from "react";

export interface ReportDialogProps {
    isOpen: boolean;
    documentId: number;
    documentTitle: string;
    onReport: (reason: string, description: string) => Promise<void>;
    onClose: () => void;
}

const REPORT_REASONS = [
    {
        id: "copyright",
        label: "📄 Vi phạm bản quyền",
        description: "Tài liệu này vi phạm bản quyền hoặc sở hữu trí tuệ",
    },
    {
        id: "inappropriate",
        label: "🔞 Nội dung không phù hợp",
        description: "Chứa nội dung khiêu dâm, bạo lực hoặc chế tục",
    },
    {
        id: "spam",
        label: "🚫 Nội dung spam",
        description: "Tài liệu này là quảng cáo hoặc nội dung spam",
    },
    {
        id: "misleading",
        label: "⚠️ Nội dung sai lệch",
        description: "Tài liệu chứa thông tin sai lệch hoặc gây hiểu lầm",
    },
    {
        id: "irrelevant",
        label: "🤔 Không liên quan",
        description: "Tài liệu này không phù hợp với chủ đề được phân loại",
    },
    {
        id: "malware",
        label: "🦠 Chứa phần mềm độc hại",
        description: "Tài liệu này có thể chứa virus hoặc phần mềm độc hại",
    },
    {
        id: "other",
        label: "❓ Vấn đề khác",
        description: "Vấn đề không nằm trong các danh mục trên",
    },
];

export function ReportDialog({
    isOpen,
    documentId,
    documentTitle,
    onReport,
    onClose,
}: ReportDialogProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const selectedReasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReason) {
            setError("Vui lòng chọn lý do báo cáo");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await onReport(selectedReason, description);
            setSuccess(true);

            // Reset form after 2 seconds
            setTimeout(() => {
                setSelectedReason(null);
                setDescription("");
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể gửi báo cáo. Vui lòng thử lại."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    if (success) {
        return (
            <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full animate-scaleUp p-8 text-center space-y-4">
                    <div className="text-5xl">✅</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Báo cáo đã gửi thành công!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Cảm ơn bạn đã giúp chúng tôi cải thiện chất lượng nội dung.
                        Đội ngũ quản lý sẽ xem xét báo cáo của bạn trong thời gian sớm.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleUp">
                {/* Header */}
                <div className="sticky top-0 border-b border-slate-200 dark:border-white/10 p-6 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        🚩 Báo cáo tài liệu
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Document Info */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Tài liệu báo cáo
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {documentTitle}
                        </p>
                    </div>

                    {/* Reason Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                            Lý do báo cáo <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {REPORT_REASONS.map((reason) => (
                                <button
                                    key={reason.id}
                                    type="button"
                                    onClick={() => setSelectedReason(reason.id)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                        selectedReason === reason.id
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-slate-800"
                                    }`}
                                >
                                    <div className="font-medium text-slate-900 dark:text-white">
                                        {reason.label}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {reason.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    {selectedReasonObj && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                Mô tả chi tiết (tùy chọn)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Hãy cung cấp thêm thông tin để giúp chúng tôi hiểu rõ hơn về vấn đề này..."
                                maxLength={1000}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {description.length}/1000 ký tự
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                        <p className="text-xs text-blue-900 dark:text-blue-200">
                            <span className="font-semibold">ℹ️ Lưu ý:</span> Báo cáo giả mạo có thể
                            dẫn đến hạn chế quyền sử dụng. Vui lòng chỉ báo cáo nội dung thực sự vi phạm
                            chính sách của chúng tôi.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !selectedReason}
                            className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    🚩 Gửi báo cáo
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
