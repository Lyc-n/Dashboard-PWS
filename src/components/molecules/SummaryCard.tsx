import type { ReactNode } from "react";
import type { SummaryCardData } from "@/lib/mock-data";
import { ProgressBar } from "@/components/atoms/ProgressBar";

export interface SummaryCardProps {
  data: SummaryCardData;
  badge?: ReactNode;
}

export function SummaryCard({ data, badge }: SummaryCardProps) {
  return (
    <div className="rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3.5 pb-3 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-xs font-semibold text-ink">{data.title}</div>
        {badge}
      </div>
      <div className="mb-2.5 mt-1 text-[26px] font-extrabold tracking-tight text-[var(--color-ink-strong)]">
        {data.pct}%
      </div>
      <div className="mt-1 text-right text-[11px] text-muted">{data.sub}</div>
      <ProgressBar value={data.pct} barColor={data.barColor} className="mt-1" />
    </div>
  );
}

export default SummaryCard;