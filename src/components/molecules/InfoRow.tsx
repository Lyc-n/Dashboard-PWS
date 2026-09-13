import type { ReactNode } from "react";

export interface InfoRowProps {
  label: ReactNode;
  value: ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-surface-2)] py-2 text-xs last:border-none">
      <span className="text-muted">{label}</span>
      <b className="text-right font-semibold text-ink">{value}</b>
    </div>
  );
}

export default InfoRow;