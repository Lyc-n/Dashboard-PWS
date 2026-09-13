import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: "sm" | "md";
  barClassName?: string;
  barColor?: string;
}

export function ProgressBar({ value, size = "sm", barClassName, barColor, className, ...props }: ProgressBarProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-line-2",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
      {...props}
    >
      <i
        className={cn("block h-full rounded-full bg-accent transition-[width]", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, ...(barColor ? { background: barColor } : {}) }}
      />
    </div>
  );
}

export default ProgressBar;