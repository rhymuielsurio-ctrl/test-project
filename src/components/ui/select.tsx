import { forwardRef, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, id, className = "", ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${error ? "border-error focus-visible:ring-error focus-visible:border-error" : "border-slate-300"}
            ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-xs text-error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
