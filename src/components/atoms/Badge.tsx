import type { HTMLAttributes } from "react";
import { cn, BADGE_STYLES } from "@/lib/utils";
import type { BadgeVariant } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "ok", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
        BADGE_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

export default Badge;