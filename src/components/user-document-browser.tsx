"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";

const allValue = "ALL";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type DocumentType = "LECTURE" | "EXAM" | "NOTE" | "ASSIGNMENT" | "OTHER";
type School = { id: number; name: string };
type Subject = { id: number; name: string; schoolId: number };
type DocumentItem = {
  id: number;
  title: string;
  description: string | null;
  documentType: DocumentType;
  isPremium: boolean;
  viewCount: number;
  downloadCount: number;
  school: School;
  subject: Subject;
  uploader: { id: number; fullName: string };
};
type DocumentDetail = DocumentItem & {
  previews: Array<{ id: number; pageNumber: number; imageUrl: string; isBlurred: boolean }>;
  documentFile?: { fileUrl: string; previewUrl: string | null };
};
type PagedResponse<T> = {
  success: boolean;
  message?: string;
  data?: {
    items: T[];
    pagination: { total: number };
  };
};
type ItemResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const documentTypeLabels: Record<DocumentType, string> = {
  LECTURE: "Bài giảng",
  EXAM: "Đề thi",
  NOTE: "Ghi chú",
  ASSIGNMENT: "Bài tập",
  OTHER: "Khác",
};

const documentTypeStyles: Record<DocumentType, string> = {
  LECTURE: "bg-amber-100 text-amber-800",
  EXAM: "bg-blue-100 text-blue-700",
  NOTE: "bg-slate-100 text-slate-700",
  ASSIGNMENT: "bg-emerald-100 text-emerald-800",
  OTHER: "bg-slate-100 text-slate-700",
};

export function UserDocumentBrowser() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(allValue);
  const [school, setSchool] = useState(allValue);
  const [type, setType] = useState<typeof allValue | DocumentType>(allValue);
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null);
  const [readingId, setReadingId] = useState<number | null>(null);
  const [readerError, setReaderError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFilters() {
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
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Không thể tải bộ lọc.");
        }
      }
    }

    void loadFilters();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");
      const query = new URLSearchParams({ page: "1", limit: "30" });
      if (title.trim()) query.set("search", title.trim());
      if (school !== allValue) query.set("schoolId", school);
      if (subject !== allValue) query.set("subjectId", subject);
      if (type !== allValue) query.set("type", type);

      try {
        const response = await fetch(`${apiUrl}/documents?${query}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as PagedResponse<DocumentItem>;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message ?? "Không thể tải tài liệu.");
        }
        setDocuments(result.data.items);
        setTotal(result.data.pagination.total);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        setDocuments([]);
        setTotal(0);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải tài liệu.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [school, subject, title, type]);

  const visibleSubjects =
    school === allValue
      ? subjects
      : subjects.filter((item) => item.schoolId === Number(school));

  function clearFilters() {
    setTitle("");
    setSubject(allValue);
    setSchool(allValue);
    setType(allValue);
  }

  async function openDocument(documentId: number) {
    setReadingId(documentId);
    setReaderError("");

    const accessToken = localStorage.getItem("accessToken");
    const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    try {
      const response = await fetch(`${apiUrl}/documents/${documentId}`, { headers });
      const result = (await response.json()) as ItemResponse<DocumentDetail>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message ?? "Không thể mở tài liệu.");
      }

      setSelectedDocument(result.data);
    } catch (requestError) {
      setReaderError(requestError instanceof Error ? requestError.message : "Không thể mở tài liệu.");
    } finally {
      setReadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      <SiteHeader authenticated />

      <main className="profile-pattern mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-8 sm:py-10">
        <section className="rounded-2xl bg-gradient-to-r from-[#56b09c] to-[#70c4b4] px-7 py-8 text-[#12382f] shadow-sm sm:px-9">
          <p className="text-sm font-medium text-emerald-950/70">Thư viện tài liệu</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tìm tài liệu học tập của bạn</h1>
          <p className="mt-3 max-w-xl text-sm text-emerald-950/75 sm:text-base">
            Tra cứu bài giảng, đề thi và ghi chú từ các trường học.
          </p>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_7px_18px_rgba(15,23,42,0.09)] sm:p-7">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-semibold text-slate-800">
              Tên tài liệu
              <span className="relative mt-2 block">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Nhập tên tài liệu..."
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 font-normal outline-none transition focus:border-emerald-600"
                />
                <svg viewBox="0 0 24 24" className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#096747]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="10.5" cy="10.5" r="6" />
                  <path d="m15 15 5 5" />
                </svg>
              </span>
            </label>
            <FilterSelect label="Môn học" value={subject} onChange={setSubject} options={visibleSubjects} />
            <FilterSelect
              label="Trường học"
              value={school}
              onChange={(value) => {
                setSchool(value);
                setSubject(allValue);
              }}
              options={schools}
            />
            <label className="text-sm font-semibold text-slate-800">
              Loại tài liệu
              <select
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 font-normal outline-none transition focus:border-emerald-600"
              >
                <option value={allValue}>Tất cả loại</option>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-[#164b3d]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="4" y="4" width="6" height="6" />
                <rect x="14" y="4" width="6" height="6" />
                <rect x="4" y="14" width="6" height="6" />
                <rect x="14" y="14" width="6" height="6" />
              </svg>
              Tìm thấy <span className="font-bold">{total}</span> tài liệu
            </p>
            <button onClick={clearFilters} className="app-button-primary">
              Xóa bộ lọc
            </button>
          </div>
        </section>

        {readerError && (
          <p className="mt-6 rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {readerError}
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </p>
        )}

        {isLoading && (
          <p className="mt-7 text-center text-sm text-slate-500">Đang tải tài liệu...</p>
        )}

        {!isLoading && <section className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <article key={document.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-emerald-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${documentTypeStyles[document.documentType]}`}>
                  {documentTypeLabels[document.documentType]}
                </span>
                {document.isPremium && <span className="rounded-full bg-[#947109] px-2.5 py-1 text-[11px] font-bold text-white">PRO</span>}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">{document.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{document.description ?? "Không có mô tả."}</p>
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-800">Môn:</span> {document.subject.name}</p>
                <p><span className="font-semibold text-slate-800">Trường:</span> {document.school.name}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>{document.viewCount} lượt xem · {document.downloadCount} lượt tải</span>
                <button
                  type="button"
                  onClick={() => void openDocument(document.id)}
                  disabled={readingId === document.id}
                  className="font-semibold text-[#00734b] transition hover:text-[#005638] disabled:opacity-60"
                >
                  {readingId === document.id ? "Đang mở..." : "Đọc tài liệu →"}
                </button>
              </div>
            </article>
          ))}
        </section>}

        {!isLoading && !error && documents.length === 0 && (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            Không có tài liệu phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </main>

      {selectedDocument && (
        <DocumentReader document={selectedDocument} onClose={() => setSelectedDocument(null)} />
      )}
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: Array<{ id: number; name: string }>;
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 font-normal outline-none transition focus:border-emerald-600"
      >
        <option value={allValue}>Tất cả</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );
}

function DocumentReader({ document, onClose }: { document: DocumentDetail; onClose: () => void }) {
  const fileUrl = document.documentFile?.previewUrl ?? document.documentFile?.fileUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label={`Đọc ${document.title}`}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{documentTypeLabels[document.documentType]}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{document.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="app-button-secondary app-button-compact">
            Đóng
          </button>
        </header>
        <div className="p-6">
          {document.previews.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {document.previews.map((preview) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={preview.id}
                  src={preview.imageUrl}
                  alt={`Trang ${preview.pageNumber} của ${document.title}`}
                  className={`w-full rounded-lg border border-slate-200 ${preview.isBlurred ? "blur-sm" : ""}`}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              Tài liệu chưa có hình xem trước. Mở file để đọc nội dung đầy đủ.
            </p>
          )}
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="app-button-primary mt-6"
            >
              Mở tài liệu đầy đủ
            </a>
          ) : (
            <p className="mt-6 text-sm text-amber-700">
              Đây là tài liệu Premium. Bạn chỉ có thể đọc bản xem trước nếu chưa nâng cấp quyền truy cập.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
