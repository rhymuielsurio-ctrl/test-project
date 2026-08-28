import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${error ? "border-error focus-visible:ring-error focus-visible:border-error" : "border-slate-300"}
            ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
