import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  children?: ReactNode;
}

export function EmptyState({ title, children, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-dashed border-line p-4 text-center text-[13px] text-muted",
        className,
      )}
      {...props}
    >
      {title}
      {children}
    </div>
  );
}
