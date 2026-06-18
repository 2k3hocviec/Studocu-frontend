"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DocumentViewer } from "@/components/document-viewer";
import { ReportDialog } from "@/components/report-dialog";
import { AvatarWithFallback } from "@/components/avatar-with-fallback";
import { submitReport } from "@/utils/api";

interface Document {
  id: number;
  title: string;
  description?: string;
  uploader: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  school?: {
    name: string;
  } | null;
  subject?: {
    name: string;
  } | null;
  requestedSchoolName?: string | null;
  requestedSubjectName?: string | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  documentType: string;
  documentFile?: {
    fileUrl: string | null;
    fileType: "PDF" | "DOCX" | "PPTX";
    totalPages?: number;
    viewableUrl?: string | null;
  };
  previews: Array<{ id: number; pageNumber: number; imageUrl: string; isBlurred: boolean }>;
  accessInfo: {
    canViewFull: boolean;
    isOwner: boolean;
    hasPremium: boolean;
    hasCreditAccess: boolean;
    creditBalance: number | null;
    creditCost: number;
    canUnlockWithCredits: boolean;
  };
  reactionInfo: {
    likeCount: number;
    dislikeCount: number;
    myReaction: "LIKE" | "DISLIKE" | null;
  };
}

type UnlockCreditResponse = {
  document?: Document;
  creditBalance?: number;
  charged?: boolean;
};

/** Trang chi tiết tài liệu, preview, reaction, báo cáo và mở khóa. */
export default function DocumentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isUnlockingCredit, setIsUnlockingCredit] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        setAccessToken(token);
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${apiUrl}/documents/${documentId}`, { headers });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Tài liệu không tồn tại hoặc chưa được duyệt");
        }

        const result = await response.json();
        setDocument(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDocument();
  }, [apiUrl, documentId]);

  const handleUnlockWithCredit = async () => {
    const token = localStorage.getItem("accessToken");
    setAccessToken(token);
    if (!token) {
      router.push("/login");
      return;
    }

    const cost = document?.accessInfo.creditCost ?? 1;
    const confirmed = window.confirm(`Bạn có muốn dùng ${cost} credit để xem toàn bộ tài liệu không?`);
    if (!confirmed) return;

    setIsUnlockingCredit(true);
    try {
      const response = await fetch(`${apiUrl}/documents/${documentId}/unlock-credit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Không thể dùng credit để mở tài liệu.");
        return;
      }
      const result = (await response.json()) as { data?: UnlockCreditResponse };
      if (result.data?.document) {
        setDocument(result.data.document);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Credit unlock error:", err);
      alert("Không thể dùng credit để mở tài liệu. Vui lòng thử lại.");
    } finally {
      setIsUnlockingCredit(false);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("accessToken");
    setAccessToken(token);
    if (!token) return;

    try {
      await fetch(`${apiUrl}/documents/${documentId}/download`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Download tracking error:", err);
    }
  };

  const handleFileDownload = async () => {
    const token = localStorage.getItem("accessToken");
    setAccessToken(token);
    if (!token || !document?.accessInfo.canViewFull) {
      router.push("/login");
      return;
    }

    try {
      await handleDownload();
      const response = await fetch(`${apiUrl}/documents/${documentId}/file?download=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        alert(`Lỗi tải tài liệu (${response.status}). Vui lòng thử lại.`);
        return;
      }

      const blob = await response.blob();
      const extension = document.documentFile?.fileType?.toLowerCase() ?? "bin";
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = `${document.title}.${extension}`;
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
    setDocument((current) => current ? { ...current, reactionInfo: result.data } : current);
  };

  const handleReport = async (reason: string, description: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    await submitReport(Number(documentId), reason, description);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        <SiteHeader authenticated={Boolean(accessToken)} />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-slate-600 dark:text-slate-300">Đang tải tài liệu...</p>
        </main>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        <SiteHeader authenticated={Boolean(accessToken)} />
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Tài liệu không tồn tại</h1>
            <p className="mb-6 text-slate-600 dark:text-slate-300">{error}</p>
            <button onClick={() => router.push("/")} className="app-button-primary">
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

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-6 line-clamp-2 text-4xl font-bold text-slate-900 dark:text-white">
              {document.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 pb-6 text-sm text-slate-600 dark:border-white/10 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <AvatarWithFallback
                  src={document.uploader.avatarUrl}
                  fullName={document.uploader.fullName}
                  alt={document.uploader.fullName}
                  className="h-8 w-8 rounded-full"
                  textSizeClass="text-sm"
                />
                <span>{document.uploader.fullName}</span>
              </div>
              <div>📚 {document.school?.name ?? document.requestedSchoolName ?? "Chưa có trường"}</div>
              <div>📖 {document.subject?.name ?? document.requestedSubjectName ?? "Chưa có môn học"}</div>
              <div>👁️ {document.viewCount} lượt xem</div>
              <div>⬇️ {document.downloadCount} lượt tải</div>
              <ReactionControls
                canReact={Boolean(accessToken) && document.accessInfo.canViewFull}
                reactionInfo={document.reactionInfo}
                onReact={(type) => void handleReaction(type)}
              />
              {!document.accessInfo.isOwner && (
                <button
                  onClick={() => setShowReportDialog(true)}
                  title="Báo cáo tài liệu"
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-red-900/50 dark:hover:text-red-400"
                >
                  Báo cáo
                </button>
              )}
            </div>
          </div>

          {!document.accessInfo.canViewFull && (
            <PaywallBanner
              authenticated={Boolean(accessToken)}
              accessInfo={document.accessInfo}
              isUnlockingCredit={isUnlockingCredit}
              onUnlockWithCredit={() => void handleUnlockWithCredit()}
            />
          )}

          {document.accessInfo.isOwner && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Đây là tài liệu của bạn. Bạn có toàn quyền truy cập.
              </p>
            </div>
          )}

          {document.accessInfo.canViewFull && document.documentFile ? (
            <DocumentViewer
              fileUrl={`${apiUrl}/documents/${documentId}/file`}
              directViewUrl={document.documentFile.viewableUrl}
              fileType={document.documentFile.fileType}
              totalPages={document.documentFile.totalPages}
              isPreview={false}
              authToken={accessToken}
              downloadFileName={document.title}
              onDownload={handleDownload}
              apiBase={apiUrl}
              documentId={documentId}
              previews={document.previews}
            />
          ) : document.previews.length > 0 ? (
            <div className="space-y-5">
              {document.accessInfo.canViewFull && document.documentFile && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {document.documentFile.fileType === "DOCX" ? "Tài liệu Word" : `${document.previews.length} trang`}
                  </p>
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
                    Đây là bản preview. Mở quyền truy cập để đọc toàn bộ và tải tài liệu.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <p className="font-semibold">Tài liệu này chưa có bản preview.</p>
              <p className="mt-1 text-sm">Đăng nhập để xem đầy đủ và tải xuống.</p>
            </div>
          )}
        </div>
      </main>

      <ReportDialog
        isOpen={showReportDialog}
        documentId={Number(documentId)}
        documentTitle={document.title}
        onReport={handleReport}
        onClose={() => setShowReportDialog(false)}
      />
    </div>
  );
}

/** Banner nhắc user nâng cấp hoặc dùng credit để xem đầy đủ. */
function PaywallBanner({
  authenticated,
  accessInfo,
  isUnlockingCredit,
  onUnlockWithCredit,
}: {
  authenticated: boolean;
  accessInfo: Document["accessInfo"];
  isUnlockingCredit: boolean;
  onUnlockWithCredit: () => void;
}) {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
      <p className="font-semibold">Bạn đang xem bản preview.</p>
      <p className="mt-1 text-sm">
        Đăng nhập, dùng credit hoặc nâng cấp Premium để đọc toàn bộ tài liệu và tải xuống.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {!authenticated && <Link href="/login" className="app-button-primary app-button-compact">Đăng nhập</Link>}
        {authenticated && accessInfo.canUnlockWithCredits && (
          <button
            type="button"
            disabled={isUnlockingCredit}
            onClick={onUnlockWithCredit}
            className="app-button-primary app-button-compact disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUnlockingCredit ? "Đang mở..." : `Dùng ${accessInfo.creditCost} credit`}
          </button>
        )}
        {authenticated && !accessInfo.canUnlockWithCredits && (accessInfo.creditBalance ?? 0) < accessInfo.creditCost && (
          <span className="inline-flex min-h-10 items-center rounded-lg border border-amber-300 bg-white/70 px-3 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-white/5 dark:text-amber-200">
            Không đủ credit
          </span>
        )}
        <Link href="/pricing" className="app-button-secondary app-button-compact">Xem Premium</Link>
      </div>
    </div>
  );
}

/** Cụm nút like/dislike cho tài liệu. */
function ReactionControls({
  canReact,
  reactionInfo,
  onReact,
}: {
  canReact: boolean;
  reactionInfo: Document["reactionInfo"];
  onReact: (type: "LIKE" | "DISLIKE") => void;
}) {
  const disabledTitle = "Bạn cần đăng nhập để đánh giá.";

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

/** Icon ngón tay dùng cho nút reaction. */
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
