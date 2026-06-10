"use client";

type PremiumBadgeProps = {
  compact?: boolean;
  className?: string;
};

/** Badge hiển thị trạng thái premium của người dùng. */
export function PremiumBadge({ compact = false, className = "" }: PremiumBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-black uppercase tracking-[0.14em] text-amber-950 shadow-[0_0_18px_rgba(245,158,11,0.28)] ${
        compact ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1.5 text-xs"
      } ${className}`}
    >
      Premium
    </span>
  );
}
