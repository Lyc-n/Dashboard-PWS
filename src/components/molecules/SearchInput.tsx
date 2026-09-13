import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-55 rounded-lg bg-surface-2 px-3.5 py-1.5 text-[13px] text-ink outline-none",
        "placeholder:text-muted-soft",
        className,
        "border border-muted-soft/30"
      )}
      {...props}
    />
  ),
);

SearchInput.displayName = "SearchInput";