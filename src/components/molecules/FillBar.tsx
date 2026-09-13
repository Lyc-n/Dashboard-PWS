import { ProgressBar } from "@/components/atoms/ProgressBar";

export interface FillBarProps {
  label?: string;
  pct: number;
}

export function FillBar({ label = "Kelengkapan form", pct }: FillBarProps) {
  return (
    <div aria-live="polite" className="mt-3.5 rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3 shadow-elev">
      <div className="flex justify-between text-xs font-semibold text-muted">
        <span>{label}</span>
        <strong className="text-ink">{pct}%</strong>
      </div>
      <ProgressBar value={pct} size="md" className="mt-2" />
    </div>
  );
}

export default FillBar;