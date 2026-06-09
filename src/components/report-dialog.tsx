"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/utils/report-reasons";

export interface ReportDialogProps {
    isOpen: boolean;
    documentId: number;
    documentTitle: string;
    onReport: (reason: string, description: string) => Promise<void>;
    onClose: () => void;
}

export function ReportDialog({
    isOpen,
    documentTitle,
    onReport,
    onClose,
}: ReportDialogProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const selectedReasonObj = REPORT_REASONS.find((reason) => reason.id === selectedReason);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedReason) {
            setError("Vui lòng chọn lý do báo cáo");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await onReport(selectedReason, description);
            setSuccess(true);

            setTimeout(() => {
                setSelectedReason(null);
                setDescription("");
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể gửi báo cáo. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70">
                <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 text-center shadow-xl animate-scaleUp dark:bg-slate-900">
                    <div className="text-5xl">✓</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Báo cáo đã gửi thành công!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Cảm ơn bạn đã giúp chúng tôi cải thiện chất lượng nội dung. Đội ngũ quản lý sẽ xem xét báo cáo trong thời gian sớm.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl animate-scaleUp dark:bg-slate-900">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Báo cáo tài liệu
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                        aria-label="Đóng báo cáo"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                        <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                            Tài liệu báo cáo
                        </p>
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {documentTitle}
                        </p>
                    </div>

                    <div>
                        <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-white">
                            Lý do báo cáo <span className="text-red-500">*</span>
                        </label>
                        <div className="max-h-64 space-y-2 overflow-y-auto">
                            {REPORT_REASONS.map((reason) => (
                                <button
                                    key={reason.id}
                                    type="button"
                                    onClick={() => setSelectedReason(reason.id)}
                                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                                        selectedReason === reason.id
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-800 dark:hover:border-white/20"
                                    }`}
                                >
                                    <div className="font-medium text-slate-900 dark:text-white">
                                        {reason.label}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                        {reason.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedReasonObj && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                                Mô tả chi tiết (tùy chọn)
                            </label>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Hãy cung cấp thêm thông tin để giúp chúng tôi hiểu rõ hơn về vấn đề này..."
                                maxLength={1000}
                                rows={4}
                                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-blue-400"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {description.length}/1000 ký tự
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                        <p className="text-xs text-blue-900 dark:text-blue-200">
                            <span className="font-semibold">Lưu ý:</span> Báo cáo giả mạo có thể dẫn đến hạn chế quyền sử dụng. Vui lòng chỉ báo cáo nội dung thực sự vi phạm chính sách.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !selectedReason}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Đang gửi...
                                </>
                            ) : (
                                "Gửi báo cáo"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
