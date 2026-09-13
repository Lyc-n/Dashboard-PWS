import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TimelineItemProps {
  date?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  done?: boolean;
  last?: boolean;
}

export function TimelineItem({ date, title, description, done = true, last }: TimelineItemProps) {
  return (
    <div
      className={cn(
        "relative ml-2 flex gap-3 border-l-2 py-2.5 pl-4",
        last ? "border-l-transparent" : "border-line",
        !done && "opacity-70",
      )}
    >
      <span
        className={cn(
          "absolute -left-[6px] top-[14px] h-2.5 w-2.5 rounded-full border-2 border-white",
          done ? "bg-accent shadow-[0_0_0_2px_var(--color-accent-light)]" : "bg-[var(--color-muted-soft)] shadow-[0_0_0_2px_var(--color-line)]",
        )}
      />
      <div className="min-w-0">
        {date ? <div className="text-[11px] font-semibold text-muted">{date}</div> : null}
        <div className="mt-0.5 text-xs font-semibold text-ink">{title}</div>
        {description ? <div className="mt-0.5 text-[11.5px] text-muted">{description}</div> : null}
      </div>
    </div>
  );
}

export default TimelineItem;