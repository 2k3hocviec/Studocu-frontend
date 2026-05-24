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
};

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
}: FieldProps) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        pattern={pattern}
        minLength={minLength}
        defaultValue={defaultValue}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
}

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
      className="h-12 w-full rounded-xl bg-emerald-700 px-5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-500"
    >
      {children}
    </button>
  );
}
