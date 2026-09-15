import { forwardRef  } from "react";
import type {InputHTMLAttributes} from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink outline-none",
        "placeholder:text-[var(--color-muted-soft)] focus:border-accent focus:shadow-[0_0_0_2px_var(--color-accent-light)]",
        invalid && "border-[var(--color-danger-border)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";