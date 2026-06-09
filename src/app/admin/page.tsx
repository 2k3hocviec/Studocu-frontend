"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";

type OverviewStats = {
  totalUsers: number;
  totalDocuments: number;
  totalDownloads: number;
  totalRevenue: number;
};

type TimeSeriesItem = {
  date: string;
  count?: number;
  revenue?: number;
};

type TimeSeriesData = {
  usersByDay: TimeSeriesItem[];
  documentsByDay: TimeSeriesItem[];
  downloadsByDay: TimeSeriesItem[];
  revenueByDay: TimeSeriesItem[];
};

type TopDocument = {
  id: number;
  title: string;
  downloadCount: number;
  viewCount: number;
  uploader: { fullName: string };
};

type TopSchool = {
  id: number;
  name: string;
  documentCount: number;
};

type DashboardResponse = {
  success: boolean;
  data: {
    overview: OverviewStats;
    timeSeries: TimeSeriesData;
    topCharts: {
      topDocuments: TopDocument[];
      topSchools: TopSchool[];
    };
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardResponse["data"] | null>(null);
  
  // State bộ lọc ngày
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  
  // Chọn chế độ hiển thị biểu đồ
  const [chartMode, setChartMode] = useState<"revenue" | "users" | "documents" | "downloads">("revenue");
  
  // Điểm đang hover trên biểu đồ
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; val: string } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`${apiUrl}/dashboard/stats?startDate=${startDate}&endDate=${endDate}`);
      const result = (await response.json()) as DashboardResponse;
      if (!response.ok || !result.success) {
        throw new Error("Không thể tải thông tin thống kê.");
      }
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Đang tải số liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-center text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
        <p className="font-semibold">{error || "Lỗi tải dữ liệu"}</p>
        <button onClick={fetchStats} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">
          Thử lại
        </button>
      </div>
    );
  }

  const { overview, timeSeries, topCharts } = stats;

  // Xác định mảng dữ liệu cho biểu đồ hiện tại
  let currentChartData: { date: string; val: number }[] = [];
  if (chartMode === "revenue") {
    currentChartData = timeSeries.revenueByDay.map(d => ({ date: d.date, val: d.revenue ?? 0 }));
  } else if (chartMode === "users") {
    currentChartData = timeSeries.usersByDay.map(d => ({ date: d.date, val: d.count ?? 0 }));
  } else if (chartMode === "documents") {
    currentChartData = timeSeries.documentsByDay.map(d => ({ date: d.date, val: d.count ?? 0 }));
  } else {
    currentChartData = timeSeries.downloadsByDay.map(d => ({ date: d.date, val: d.count ?? 0 }));
  }

  // Tự tạo biểu đồ SVG tuyến tính
  const svgWidth = 800;
  const svgHeight = 250;
  const paddingX = 60;
  const paddingY = 30;

  // Tìm min, max để làm thang chia tỉ lệ
  const maxVal = Math.max(...currentChartData.map(d => d.val), 10);
  const minVal = 0;

  // Điểm vẽ biểu đồ
  const points = currentChartData.map((d, index) => {
    const x = paddingX + (index / Math.max(currentChartData.length - 1, 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((d.val - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
    return { x, y, date: d.date, val: d.val };
  });

  // Tạo đường dẫn vẽ (path) cho line chart
  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Tạo vùng tô gradient màu ở dưới đường biểu đồ
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : "";

  return (
    <div className="min-w-0 space-y-6 animate-fadeIn xl:space-y-8">
      {/* Date Filter & Options */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-6 lg:flex-row lg:items-center">
        <form onSubmit={handleFilterSubmit} className="grid w-full gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 sm:col-span-2 lg:col-span-1"
          >
            Lọc số liệu
          </button>
        </form>
      </div>

      {/* Cards Overview Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* User Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tổng thành viên</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">{overview.totalUsers.toLocaleString("vi-VN")}</p>
          <p className="mt-1 text-xs text-slate-400">Người dùng đã đăng ký</p>
        </div>

        {/* Document Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tài liệu đã duyệt</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">{overview.totalDocuments.toLocaleString("vi-VN")}</p>
          <p className="mt-1 text-xs text-slate-400">Tài liệu hiển thị công khai</p>
        </div>

        {/* Download Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lượt tải về</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">{overview.totalDownloads.toLocaleString("vi-VN")}</p>
          <p className="mt-1 text-xs text-slate-400">Tổng số lượt tải tài liệu</p>
        </div>

        {/* Revenue Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Doanh thu</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">
            {overview.totalRevenue.toLocaleString("vi-VN")} <span className="text-lg font-bold">đ</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">Thanh toán Premium thành công</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800/40 dark:bg-slate-900 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Biểu đồ sự tăng trưởng</h3>
            <p className="text-xs text-slate-400">Di chuột vào các điểm mốc trên đường vẽ để xem chi tiết</p>
          </div>
          {/* Chart mode selection tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(["revenue", "users", "documents", "downloads"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setChartMode(mode);
                  setHoveredPoint(null);
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  chartMode === mode
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-400"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {mode === "revenue" && "Doanh thu"}
                {mode === "users" && "User mới"}
                {mode === "documents" && "Tài liệu"}
                {mode === "downloads" && "Tải về"}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart area */}
        <div className="relative">
          {currentChartData.length === 0 ? (
            <div className="flex h-60 items-center justify-center border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-400">Không có dữ liệu trong khoảng thời gian này</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-auto min-w-[640px] w-full">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingY + ratio * (svgHeight - paddingY * 2);
                const gridVal = Math.round(maxVal - ratio * (maxVal - minVal));
                return (
                  <g key={index}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/60"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-semibold"
                    >
                      {gridVal.toLocaleString("vi-VN")}
                    </text>
                  </g>
                );
              })}

              {/* Area Under Curve */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Smooth Line Chart */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points */}
              {points.map((p, index) => (
                <circle
                  key={index}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  className="fill-white stroke-emerald-500 stroke-[3] cursor-pointer hover:r-7 transition-all duration-150"
                  onMouseEnter={() => {
                    setHoveredPoint({
                      x: p.x,
                      y: p.y,
                      label: p.date,
                      val: chartMode === "revenue" ? `${p.val.toLocaleString()} đ` : `${p.val.toLocaleString()} lượt`,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* Axis Label Dates (Only show first, middle, last to avoid overlap) */}
              {points.length > 0 && (
                <>
                  <text x={points[0].x} y={svgHeight - 10} textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold">
                    {points[0].date}
                  </text>
                  {points.length > 2 && (
                    <text
                      x={points[Math.floor(points.length / 2)].x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px] font-semibold"
                    >
                      {points[Math.floor(points.length / 2)].date}
                    </text>
                  )}
                  {points.length > 1 && (
                    <text
                      x={points[points.length - 1].x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px] font-semibold"
                    >
                      {points[points.length - 1].date}
                    </text>
                  )}
                </>
              )}
            </svg>
            </div>
          )}

          {/* Interactive Tooltip Card overlay */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm transition-all duration-75"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100 - 15}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <p className="text-[10px] text-slate-300 font-semibold">{hoveredPoint.label}</p>
              <p className="text-sm text-emerald-400 mt-0.5">{hoveredPoint.val}</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Tables (Popular Documents & Schools) */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top Documents table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tài liệu phổ biến nhất</h3>
            <p className="text-xs text-slate-400">Xếp hạng 5 tài liệu được tải nhiều nhất</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[620px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                  <th className="py-3 px-2">Tên tài liệu</th>
                  <th className="py-3 px-2">Người đăng</th>
                  <th className="py-3 px-2 text-right">Lượt tải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {topCharts.topDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-2 font-semibold truncate max-w-[200px]" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 text-xs font-semibold">{doc.uploader.fullName}</td>
                    <td className="py-3.5 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {doc.downloadCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Schools table */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Trường đại học sôi nổi</h3>
            <p className="text-xs text-slate-400">Xếp hạng 5 trường có nhiều tài liệu học tập nhất</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                  <th className="py-3 px-2">Tên trường học</th>
                  <th className="py-3 px-2 text-right">Số tài liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {topCharts.topSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-2 font-semibold">{school.name}</td>
                    <td className="py-3.5 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {school.documentCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
