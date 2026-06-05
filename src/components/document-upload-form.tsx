"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SubmitButton } from "./form-controls";
import { getValidAccessToken } from "@/utils/api";

interface DocumentUploadFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

type DocumentStatus = "idle" | "uploading" | "success" | "error";
type School = { id: number; name: string };
type Subject = { id: number; name: string; schoolId: number };
type PagedResponse<T> = {
    success: boolean;
    message?: string;
    data?: {
        items: T[];
    };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export function DocumentUploadForm({ onSuccess, onError }: DocumentUploadFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<DocumentStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [schools, setSchools] = useState<School[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);
    const onErrorRef = useRef(onError);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        schoolId: "",
        subjectId: "",
        documentType: "LECTURE",
    });

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
        let active = true;

        async function loadCatalogs() {
            setIsCatalogLoading(true);
            try {
                const [schoolResponse, subjectResponse] = await Promise.all([
                    fetch(`${apiUrl}/schools?page=1&limit=100`),
                    fetch(`${apiUrl}/subjects?page=1&limit=100`),
                ]);
                const schoolResult = (await schoolResponse.json()) as PagedResponse<School>;
                const subjectResult = (await subjectResponse.json()) as PagedResponse<Subject>;

                if (!schoolResponse.ok || !schoolResult.success || !schoolResult.data) {
                    throw new Error(schoolResult.message ?? "Không thể tải danh sách trường học.");
                }
                if (!subjectResponse.ok || !subjectResult.success || !subjectResult.data) {
                    throw new Error(subjectResult.message ?? "Không thể tải danh sách môn học.");
                }

                if (active) {
                    setSchools(schoolResult.data.items);
                    setSubjects(subjectResult.data.items);
                }
            } catch (error) {
                if (active) {
                    const message = error instanceof Error ? error.message : "Không thể tải trường học, môn học.";
                    setErrorMsg(message);
                    setStatus("error");
                    onErrorRef.current?.(message);
                }
            } finally {
                if (active) setIsCatalogLoading(false);
            }
        }

        void loadCatalogs();
        return () => {
            active = false;
        };
    }, []);

    const visibleSubjects = useMemo(
        () => formData.schoolId
            ? subjects.filter((subject) => subject.schoolId === Number(formData.schoolId))
            : [],
        [formData.schoolId, subjects],
    );

    useEffect(() => {
        if (!formData.subjectId) return;
        const subjectBelongsToSchool = visibleSubjects.some((subject) => String(subject.id) === formData.subjectId);
        if (!subjectBelongsToSchool) {
            setFormData((current) => ({ ...current, subjectId: "" }));
        }
    }, [formData.subjectId, visibleSubjects]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const selectedFile = e.target.files[0];
            validateAndSetFile(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files?.[0]) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];

        if (selectedFile.size > maxSize) {
            setErrorMsg("File quá lớn. Tối đa 20MB.");
            setStatus("error");
            return;
        }

        if (!allowedTypes.includes(selectedFile.type)) {
            setErrorMsg("Chỉ hỗ trợ PDF, Word, PowerPoint.");
            setStatus("error");
            return;
        }

        setFile(selectedFile);
        setErrorMsg("");
        setStatus("idle");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
            setErrorMsg("Vui lòng chọn file.");
            setStatus("error");
            return;
        }

        if (!formData.title.trim()) {
            setErrorMsg("Vui lòng nhập tiêu đề.");
            setStatus("error");
            return;
        }

        if (!formData.schoolId) {
            setErrorMsg("Vui lòng chọn trường học.");
            setStatus("error");
            return;
        }

        if (!formData.subjectId) {
            setErrorMsg("Vui lòng chọn môn học.");
            setStatus("error");
            return;
        }

        setStatus("uploading");
        setProgress(0);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            uploadFormData.append("title", formData.title);
            uploadFormData.append("description", formData.description || "");
            uploadFormData.append("schoolId", formData.schoolId);
            uploadFormData.append("subjectId", formData.subjectId);
            uploadFormData.append("documentType", formData.documentType);

            const fileType = file.type === "application/pdf" ? "PDF" : file.type.includes("word") ? "DOCX" : "PPTX";
            uploadFormData.append("fileType", fileType);

            const token = await getValidAccessToken();
            if (!token) {
                setErrorMsg("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
                setStatus("error");
                onError?.("Phiên đăng nhập hết hạn");
                return;
            }
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setProgress(percentComplete);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status === 201) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        setStatus("success");
                        setFile(null);
                        setFormData({
                            title: "",
                            description: "",
                            schoolId: "",
                            subjectId: "",
                            documentType: "LECTURE",
                        });
                        onSuccess?.();
                        setTimeout(() => setStatus("idle"), 3000);
                    }
                    return;
                }

                if (xhr.status === 401) {
                    setErrorMsg("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
                    setStatus("error");
                    onError?.("Phiên đăng nhập hết hạn");
                    return;
                }

                let response: { message?: string } = {};
                try {
                    response = JSON.parse(xhr.responseText || "{}") as { message?: string };
                } catch {
                    response = {};
                }
                setErrorMsg(response.message || "Upload thất bại. Vui lòng thử lại.");
                setStatus("error");
                onError?.(response.message || "Upload thất bại");
            });

            xhr.addEventListener("error", () => {
                setErrorMsg("Lỗi upload. Vui lòng thử lại.");
                setStatus("error");
                onError?.("Lỗi upload");
            });

            xhr.open("POST", `${apiUrl}/documents`);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(uploadFormData);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Lỗi không xác định";
            setErrorMsg(message);
            setStatus("error");
            onError?.(message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${isDragging ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-slate-300 bg-slate-50 hover:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-600"
                    }`}
            >
                <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" />

                <div className="space-y-2">
                    <div className="text-3xl">📄</div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{file ? file.name : "Kéo file vào đây hoặc nhấp để chọn"}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">PDF, Word, PowerPoint • Tối đa 20MB</p>
                    </div>
                </div>

                {file && <div className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">✓ File đã chọn: {(file.size / 1024 / 1024).toFixed(2)}MB</div>}

                {status === "uploading" && (
                    <div className="mt-4 space-y-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{Math.round(progress)}%</p>
                    </div>
                )}
            </div>

            {/* Form Fields */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Tiêu đề *
                    <input
                        type="text"
                        name="title"
                        placeholder="Ví dụ: Cấu trúc dữ liệu - Midterm"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                </label>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Mô tả
                    <textarea
                        name="description"
                        placeholder="Mô tả chi tiết về tài liệu (không bắt buộc)"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Trường học *
                        <select
                            value={formData.schoolId}
                            disabled={isCatalogLoading || schools.length === 0}
                            onChange={(e) => setFormData({ ...formData, schoolId: e.target.value, subjectId: "" })}
                            className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:disabled:bg-white/10"
                        >
                            <option value="">{isCatalogLoading ? "Đang tải trường..." : "Chọn trường"}</option>
                            {schools.map((school) => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Môn học *
                        <select
                            value={formData.subjectId}
                            disabled={isCatalogLoading || !formData.schoolId || visibleSubjects.length === 0}
                            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                            className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:disabled:bg-white/10"
                        >
                            <option value="">
                                {isCatalogLoading ? "Đang tải môn..." : formData.schoolId ? "Chọn môn" : "Chọn trường trước"}
                            </option>
                            {visibleSubjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Loại tài liệu
                    <select value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value })} className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white">
                        <option value="LECTURE">Bài giảng</option>
                        <option value="EXAM">Đề thi</option>
                        <option value="NOTE">Ghi chú</option>
                        <option value="ASSIGNMENT">Bài tập</option>
                        <option value="OTHER">Khác</option>
                    </select>
                </label>
            </div>

            {/* Error Message */}
            {status === "error" && errorMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                    ⚠️ {errorMsg}
                </div>
            )}

            {/* Success Message */}
            {status === "success" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
                    ✓ Tài liệu được upload thành công! Đang chờ Admin duyệt.
                </div>
            )}

            {/* Submit Button */}
            <SubmitButton disabled={status === "uploading" || isCatalogLoading || !file} type="submit">
                {status === "uploading" ? "Đang upload..." : status === "success" ? "✓ Thành công" : "Đăng bài"}
            </SubmitButton>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Sau khi đăng, Admin sẽ duyệt tài liệu trong 24 giờ. Nếu được duyệt bạn sẽ nhận được +2 credit.
            </p>
        </form>
    );
}
