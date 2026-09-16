import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/atoms/ProgressBar";

export interface StatCardProps {
  caption: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  sub?: ReactNode;
  badge?: ReactNode;
  progress?: number;
  barColor?: string;
  className?: string;
}

export function StatCard({ caption, value, valueClassName, sub, badge, progress, barColor, className }: StatCardProps) {
  return (
    <div className={cn("rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3.5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted">{caption}</span>
        {badge}
      </div>
      <span className={cn("block text-[26px] font-extrabold tracking-tight text-[var(--color-ink-strong)]", valueClassName)}>
        {value}
      </span>
      {sub ? <div className="mt-1 text-right text-[11px] text-muted">{sub}</div> : null}
      {progress != null ? <ProgressBar value={progress} barColor={barColor} className="mt-2" /> : null}
    </div>
  );
}
