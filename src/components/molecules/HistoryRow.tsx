import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface HistoryRowProps extends HTMLAttributes<HTMLDivElement> {
  layout?: "row" | "stack";
}

export function HistoryRow({ layout = "row", className, children, ...props }: HistoryRowProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-line-2)] bg-surface-2 px-2.5 py-2 text-xs",
        layout === "row" ? "flex flex-wrap items-center gap-2.5" : "grid gap-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default HistoryRow;