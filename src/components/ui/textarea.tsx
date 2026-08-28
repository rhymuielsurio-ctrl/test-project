import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${textareaId}-error`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
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

Textarea.displayName = "Textarea";
