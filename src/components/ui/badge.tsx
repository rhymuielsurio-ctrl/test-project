type BadgeVariant = "success" | "warning" | "error" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  error: "bg-error-bg text-error-text",
  neutral: "bg-slate-100 text-slate-800",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span
      role="status"
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
