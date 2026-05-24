"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/user" className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
            HọcLiệu
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/user/upgrade" className="hidden font-medium text-slate-600 sm:block dark:text-slate-300">
              Nâng cấp
            </Link>
            <Link href="/profile" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
              Hồ sơ
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
        <section className="rounded-3xl bg-emerald-950 px-6 py-8 text-white sm:px-9">
          <p className="text-sm font-semibold text-emerald-200">Thư viện tài liệu</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Tìm tài liệu học tập của bạn</h1>
          <p className="mt-3 max-w-xl text-emerald-100">
            Tra cứu bài giảng, đề thi và ghi chú từ các trường học.
          </p>
        </section>

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Tên tài liệu
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Nhập tên tài liệu..."
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 font-normal outline-none focus:border-emerald-600 dark:border-white/10"
              />
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
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Loại tài liệu
              <select
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 font-normal outline-none focus:border-emerald-600 dark:border-white/10"
              >
                <option value={allValue}>Tất cả loại</option>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Tìm thấy <span className="font-bold text-slate-900 dark:text-white">{total}</span> tài liệu
            </p>
            <button onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300">
              Xóa bộ lọc
            </button>
          </div>
        </section>

        {error && (
          <p className="mt-7 rounded-2xl bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}

        {isLoading && (
          <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-300">Đang tải tài liệu...</p>
        )}

        {!isLoading && <section className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <article key={document.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {documentTypeLabels[document.documentType]}
                </span>
                {document.isPremium && <span className="text-xs font-bold text-amber-600">PRO</span>}
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{document.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-300">{document.description ?? "Không có mô tả."}</p>
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                <p><span className="font-semibold text-slate-700 dark:text-slate-100">Môn:</span> {document.subject.name}</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-100">Trường:</span> {document.school.name}</p>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>{document.viewCount} lượt xem</span>
                <span>{document.downloadCount} lượt tải</span>
              </div>
            </article>
          ))}
        </section>}

        {!isLoading && !error && documents.length === 0 && (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
            Không có tài liệu phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </main>
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
    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 font-normal outline-none focus:border-emerald-600 dark:border-white/10"
      >
        <option value={allValue}>Tất cả</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );
}
