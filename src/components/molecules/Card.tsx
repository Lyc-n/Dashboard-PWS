import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  bordered?: boolean;
}

export function Card({ padded = true, bordered = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] bg-surface",
        bordered && "border border-[var(--color-line-2)] shadow-card",
        padded && "p-4",
        className,
      )}
      {...props}
    />
  );
}

export default Card;