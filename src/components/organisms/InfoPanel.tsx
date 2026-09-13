import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InfoRow } from "@/components/molecules/InfoRow";

export interface InfoPanelField {
  label: ReactNode;
  value: ReactNode;
}

export interface InfoPanelProps {
  fields: InfoPanelField[];
  columns?: 1 | 2;
  className?: string;
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
        <InfoRow key={i} label={f.label} value={f.value} />
      ))}
    </div>
  );
}

export default InfoPanel;