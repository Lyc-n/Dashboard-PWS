import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InfoPanelField {
  label: ReactNode;
  value: ReactNode;
}

export interface InfoPanelProps {
  fields: InfoPanelField[];
  columns?: 1 | 2;
  className?: string;
}

function FieldRow({ label, value }: InfoPanelField) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-surface-2)] py-2 text-xs last:border-none">
      <span className="text-muted">{label}</span>
      <b className="text-right font-semibold text-ink">{value}</b>
    </div>
  );
}

export function InfoPanel({ fields, columns = 1, className }: InfoPanelProps) {
  return (
    <div
      className={cn(
        "grid gap-y-2",
        columns === 2 ? "grid-cols-2 gap-x-10 max-md:grid-cols-1" : "grid-cols-1",
        className,
      )}
    >
      {fields.map((f, i) => (
        <FieldRow key={i} label={f.label} value={f.value} />
      ))}
    </div>
  );
}
