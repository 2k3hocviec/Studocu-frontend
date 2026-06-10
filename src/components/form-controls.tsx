"use client";

import { ReactNode } from "react";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  pattern?: string;
  minLength?: number;
  defaultValue?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
};

/** Field form dùng chung với label, icon và trạng thái lỗi. */
export function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
  pattern,
  minLength,
  defaultValue,
  icon,
  rightIcon,
  onRightIconClick,
}: FieldProps) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <div className="relative mt-2">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          pattern={pattern}
          minLength={minLength}
          defaultValue={defaultValue}
          className={`h-12 w-full rounded-full border border-slate-300 bg-white font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white ${
            icon ? "pl-11" : "px-4"
          } ${rightIcon ? "pr-11" : "px-4"}`}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </label>
  );
}

/** Nút submit dùng chung cho form xác thực. */
export function SubmitButton({
  children,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="app-button-primary w-full"
    >
      {children}
    </button>
  );
}
