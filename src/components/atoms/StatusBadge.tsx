import type { HTMLAttributes } from "react";
import { cn, statusVariantFrom, STATUS_STYLES  } from "@/lib/utils";
import type {StatusVariant} from "@/lib/utils";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  value?: string | null;
}

export function StatusBadge({ variant, value, className, children, ...props }: StatusBadgeProps) {
  const resolved = variant ?? statusVariantFrom(value);
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-md border px-[7px] py-[3px] text-[11px] font-bold",
        STATUS_STYLES[resolved],
        className,
      )}
      {...props}
    >
      {children ?? value}
    </span>
  );
}

export default StatusBadge;