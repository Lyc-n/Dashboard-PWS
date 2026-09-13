import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PwsChart } from "@/components/molecules/PwsChart";

export interface ChartCardProps {
  title: ReactNode;
  note?: ReactNode;
  data: number[];
  labels: string[];
  renderTooltip?: (index: number) => ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  note,
  data,
  labels,
  renderTooltip,
  children,
  className,
}: ChartCardProps) {
  return (
    <div className={cn("mt-3.5 rounded-lg border border-line-2 bg-surface p-4 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[13px] font-bold leading-snug text-ink">{title}</div>
        {note ? <div className="text-[10px] text-muted">{note}</div> : null}
      </div>
      <PwsChart data={data} labels={labels} renderTooltip={renderTooltip} />
      {children ? <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">{children}</div> : null}
    </div>
  );
}

export default ChartCard;