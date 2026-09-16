import type { ReactNode } from "react";

export interface TindakCardProps {
  icon: ReactNode;
  color: string;
  title: ReactNode;
  issue: ReactNode;
}

export function TindakCard({ icon, color, title, issue }: TindakCardProps) {
  return (
    <div className="flex gap-2.5 rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3 shadow-card">
      <span
        className="grid size-8 flex-none place-items-center rounded-lg text-[13px] text-white"
        style={{ background: color }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted">{issue}</div>
      </div>
    </div>
  );
}
