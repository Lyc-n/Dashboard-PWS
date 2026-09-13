import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ invalid, className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink outline-none",
        "focus:border-accent focus:shadow-[0_0_0_2px_var(--color-accent-light)]",
        invalid && "border-[var(--color-danger-border)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";