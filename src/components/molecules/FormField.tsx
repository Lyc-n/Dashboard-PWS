import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  invalid?: boolean;
}

export function FormField({
  label,
  required,
  hint,
  error,
  invalid,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <label
      className={cn(
        "grid gap-1.5 text-xs font-semibold text-ink",
        invalid && "[&>input]:border-[var(--color-danger-border)] [&>select]:border-[var(--color-danger-border)] [&>textarea]:border-[var(--color-danger-border)]",
        className,
      )}
      {...props}
    >
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-[11px] font-normal text-muted">{hint}</span> : null}
      {error ? (
        <span className={cn("text-[11px] font-semibold text-danger", !invalid && "hidden")}>{error}</span>
      ) : null}
    </label>
  );
}
