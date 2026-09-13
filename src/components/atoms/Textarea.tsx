import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[74px] resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink outline-none",
        "placeholder:text-[var(--color-muted-soft)] focus:border-accent focus:shadow-[0_0_0_2px_var(--color-accent-light)]",
        invalid && "border-[var(--color-danger-border)]",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";