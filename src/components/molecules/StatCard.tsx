import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/atoms/ProgressBar";

export interface StatCardProps {
  caption: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  progress?: number;
  className?: string;
}

export function StatCard({ caption, value, valueClassName, progress, className }: StatCardProps) {
  return (
    <div className={cn("rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3.5 shadow-card", className)}>
      <span className="text-xs font-medium text-muted">{caption}</span>
      <span className={cn("block text-[26px] font-extrabold tracking-tight text-[var(--color-ink-strong)]", valueClassName)}>
        {value}
      </span>
      {progress != null ? <ProgressBar value={progress} className="mt-2" /> : null}
    </div>
  );
}

export default StatCard;