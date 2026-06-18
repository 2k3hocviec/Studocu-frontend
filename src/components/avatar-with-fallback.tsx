"use client";

import { useState } from "react";

interface AvatarWithFallbackProps {
    src?: string | null;
    fullName: string;
    alt?: string;
    className?: string;
    /** Tailwind class cho màu nền fallback (gradient). Mặc định emerald → sky. */
    fallbackClassName?: string;
    /** Kích thước fallback chữ (Tailwind text-*). Mặc định text-base. */
    textSizeClass?: string;
}

/**
 * Lấy chữ cái đầu của tên hiển thị.
 * - Bỏ khoảng trắng đầu/cuối.
 * - Lấy chữ cái đầu tiên (kể cả tiếng Việt có dấu).
 * - Nếu tên rỗng → trả về "?".
 */
function getInitial(fullName: string): string {
    const trimmed = fullName?.trim();
    if (!trimmed) return "?";
    const first = trimmed[0];
    return first ? first.toUpperCase() : "?";
}

/**
 * Lấy màu fallback ổn định dựa trên tên user.
 * Cùng 1 user → luôn cùng 1 màu (dù render bao nhiêu lần).
 * Màu lấy từ danh sách Tailwind an toàn (tránh class động không nằm trong safelist).
 */
const FALLBACK_GRADIENTS = [
    "from-emerald-400 to-sky-500",
    "from-rose-400 to-orange-400",
    "from-violet-400 to-indigo-500",
    "from-amber-400 to-pink-500",
    "from-cyan-400 to-blue-500",
    "from-fuchsia-400 to-purple-500",
] as const;

function pickFallbackGradient(seed: string): string {
    const trimmed = seed?.trim() || "?";
    let hash = 0;
    for (let i = 0; i < trimmed.length; i += 1) {
        hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
    }
    return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length] ?? FALLBACK_GRADIENTS[0];
}

/**
 * Avatar có fallback.
 * - Nếu `src` hợp lệ → render <img>.
 * - Nếu `src` rỗng / null / lỗi load → render vòng tròn gradient với chữ cái đầu của tên.
 */
export function AvatarWithFallback({
    src,
    fullName,
    alt,
    className = "h-10 w-10 rounded-full object-cover",
    fallbackClassName,
    textSizeClass = "text-base",
}: AvatarWithFallbackProps) {
    const [hasError, setHasError] = useState(false);
    const showImage = src && !hasError;
    if (showImage) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={alt ?? `Ảnh đại diện của ${fullName || "người dùng"}`}
                className={className}
                onError={() => setHasError(true)}
            />
        );
    }
    const gradient = fallbackClassName ?? pickFallbackGradient(fullName);
    return (
        <div
            role="img"
            aria-label={alt ?? `Ảnh đại diện của ${fullName || "người dùng"}`}
            className={`flex items-center justify-center bg-gradient-to-br font-semibold text-white ${gradient} ${className}`}
        >
            <span className={textSizeClass}>{getInitial(fullName)}</span>
        </div>
    );
}
