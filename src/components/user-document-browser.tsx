"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  viewCount: number;
  downloadCount: number;
  school: School;
  subject: Subject;
  uploader: { id: number; fullName: string };
  coverImageUrl: string | null;
  totalPages: number | null;
};
type PagedResponse<T> = {
  success: boolean;
  message?: string;
  data?: {
    items: T[];
    pagination: { total: number };
  };
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

function isDocumentType(value: string | null): value is DocumentType {
  return value === "LECTURE" || value === "EXAM" || value === "NOTE" || value === "ASSIGNMENT" || value === "OTHER";
}

type UserDocumentBrowserProps = {
  authenticated?: boolean;
};

export function UserDocumentBrowser({ authenticated = true }: UserDocumentBrowserProps) {
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");
  const initialType = isDocumentType(queryType) ? queryType : allValue;
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [school, setSchool] = useState("");
  const [type, setType] = useState<typeof allValue | DocumentType>(initialType);
  const [appliedFilters, setAppliedFilters] = useState({
    title: "",
    subject: "",
    school: "",
    type: initialType,
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    setType(initialType);
    setAppliedFilters((current) => ({ ...current, type: initialType }));
  }, [initialType]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDocuments() {
      setIsLoading(true);
      setError("");
      const query = new URLSearchParams({ page: "1", limit: "30" });
      if (appliedFilters.title.trim()) query.set("search", appliedFilters.title.trim());
      if (appliedFilters.school.trim()) query.set("schoolName", appliedFilters.school.trim());
      if (appliedFilters.subject.trim()) query.set("subjectName", appliedFilters.subject.trim());
      if (appliedFilters.type !== allValue) query.set("type", appliedFilters.type);

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
    }

    void loadDocuments();

    return () => {
      controller.abort();
    };
  }, [appliedFilters]);

  const selectedSchool = useMemo(
    () => schools.find((item) => item.name.trim().toLocaleLowerCase("vi-VN") === school.trim().toLocaleLowerCase("vi-VN")),
    [school, schools],
  );
  const visibleSubjects = useMemo(
    () => selectedSchool ? subjects.filter((item) => item.schoolId === selectedSchool.id) : subjects,
    [selectedSchool, subjects],
  );

  function clearFilters() {
    setTitle("");
    setSubject("");
    setSchool("");
    setType(allValue);
    setAppliedFilters({ title: "", subject: "", school: "", type: allValue });
  }

  function applyFilters() {
    setAppliedFilters({
      title,
      subject,
      school,
      type,
    });
  }

  const hasPendingFilterChanges = title !== appliedFilters.title
    || subject !== appliedFilters.subject
    || school !== appliedFilters.school
    || type !== appliedFilters.type;

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      <SiteHeader authenticated={authenticated} />

      <main className="profile-pattern mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-8 sm:py-10">
        <section className="rounded-2xl bg-gradient-to-r from-[#56b09c] to-[#70c4b4] px-7 py-8 text-[#12382f] shadow-sm sm:px-9">
          <p className="text-sm font-medium text-emerald-950/70">Thư viện tài liệu</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tìm tài liệu học tập của bạn</h1>
          <p className="mt-3 max-w-xl text-sm text-emerald-950/75 sm:text-base">
            Tra cứu bài giảng, đề thi và ghi chú từ các trường học.
          </p>
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
          className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_7px_18px_rgba(15,23,42,0.09)] sm:p-7"
        >
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
            <FilterSearch
              label="Môn học"
              value={subject}
              onChange={setSubject}
              options={visibleSubjects}
              placeholder="Nhập tên môn học..."
              listId="document-subject-filter-options"
            />
            <FilterSearch
              label="Trường học"
              value={school}
              onChange={(value) => {
                setSchool(value);
              }}
              options={schools}
              placeholder="Nhập tên trường học..."
              listId="document-school-filter-options"
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
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="app-button-primary">
                Tìm kiếm
              </button>
              <button type="button" onClick={clearFilters} className="app-button-primary">
                Xóa bộ lọc
              </button>
            </div>
          </div>
          {hasPendingFilterChanges ? (
            <p className="mt-3 text-xs font-medium text-amber-700">
              Bộ lọc đã thay đổi. Nhấn Tìm kiếm để cập nhật kết quả.
            </p>
          ) : null}
        </form>

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
            <Link
              key={document.id}
              href={`/documents/${document.id}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                {document.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={document.coverImageUrl}
                    alt={`Ảnh đại diện ${document.title}`}
                    className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 text-center text-sm font-semibold text-slate-500">
                    Chưa có ảnh xem trước
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className={`rounded-lg px-3 py-1 text-xs font-semibold shadow-sm ${documentTypeStyles[document.documentType]}`}>
                    {documentTypeLabels[document.documentType]}
                  </span>
                </div>
              </div>
              <article className="flex flex-1 flex-col p-5">
                <h2 className="min-h-[3.5rem] overflow-hidden break-words text-lg font-semibold text-slate-950 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover:text-[#00734b]">{document.title}</h2>
                <p className="mt-2 min-h-12 overflow-hidden break-words text-sm leading-6 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{document.description ?? "Không có mô tả."}</p>
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-800">Môn:</span> {document.subject.name}</p>
                  <p><span className="font-semibold text-slate-800">Trường:</span> {document.school.name}</p>
                  {document.totalPages && <p><span className="font-semibold text-slate-800">Số trang:</span> {document.totalPages}</p>}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>{document.viewCount} lượt xem · {document.downloadCount} lượt tải</span>
                  <span className="font-semibold text-[#00734b] transition group-hover:text-[#005638]">Đọc tài liệu →</span>
                </div>
              </article>
            </Link>
          ))}
        </section>}

        {!isLoading && !error && documents.length === 0 && (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            Không có tài liệu phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </main>
    </div>
  );
}

type FilterSearchProps = {
  label: string;
  value: string;
  options: Array<{ id: number; name: string }>;
  placeholder: string;
  listId: string;
  onChange: (value: string) => void;
};

function FilterSearch({ label, value, options, placeholder, listId, onChange }: FilterSearchProps) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {label}
      <input
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.id} value={option.name} />
        ))}
      </datalist>
    </label>
  );
}

