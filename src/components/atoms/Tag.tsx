import type { HTMLAttributes } from "react";
import { cn, priorityTagVariant, TAG_STYLES } from "@/lib/utils";
import type { TagVariant } from "@/lib/utils";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  priority?: string;
}

export function Tag({ variant, priority, className, children, ...props }: TagProps) {
  const resolved = variant ?? priorityTagVariant(priority);
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TAG_STYLES[resolved],
        className,
      )}
      {...props}
    >
      {children ?? priority}
    </span>
  );
}