import { PRIOS, KELS, KATEGORI_CHECKLIST } from "@/lib/constants";
import type { ChecklistItem } from "@/lib/seeds";
import { Checkbox } from "@/components/atoms/Checkbox";
import { EmptyState } from "@/components/atoms/EmptyState";
import { Select } from "@/components/atoms/Select";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Card } from "@/components/molecules/Card";
import { CardHeader } from "@/components/molecules/CardHeader";
import { ChipGroup } from "@/components/molecules/ChipGroup";
import { FormField } from "@/components/molecules/FormField";

export interface ChecklistPanelProps {
  kel: string;
  onKelChange: (value: string) => void;
  prio: string;
  onPrioChange: (value: string) => void;
  items: ChecklistItem[];
  checked: boolean[];
  onToggle: (index: number, value: boolean) => void;
  partitions?: number[];
}

const CATEGORIES = KATEGORI_CHECKLIST;

export function ChecklistPanel({
  kel,
  onKelChange,
  prio,
  onPrioChange,
  items,
  checked,
  onToggle,
  partitions = [items.length],
}: ChecklistPanelProps) {
  return (
    <Card className="mt-5">
      <CardHeader title="Checklist Kunjungan" sub="Centang bila kondisi terpenuhi pada entri ini." />
      <div className="mt-3">
        <FormField label="Kelurahan *">
          <Select value={kel} onChange={(e) => onKelChange(e.target.value)}>
            {KELS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="mt-3">
          <span className="text-xs font-semibold text-ink">Pilih prioritas</span>
          <ChipGroup
            className="mt-1.5"
            dark
            options={PRIOS.map((p) => ({ value: p, label: p }))}
            selected={prio}
            onToggle={(v) => {
              if (v !== prio) onPrioChange(v);
            }}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState>Tidak ada checklist untuk prioritas ini.</EmptyState>
        </div>
      ) : (
        <div className="mt-3">
          {partitions.map((count, pi) => {
            const start = partitions.slice(0, pi).reduce((a, b) => a + b, 0);
            const slice = items.slice(start, start + count);
            if (slice.length === 0) return null;
            return (
              <div key={pi} className="mt-4 first:mt-0">
                <div className="border-b border-[var(--color-line-2)] pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {CATEGORIES[pi] ?? `Kelompok ${String.fromCharCode(65 + pi)}`}
                </div>
                {slice.map((item, ii) => {
                  const i = start + ii;
                  return (
                    <div key={i} className="mt-2.5 flex items-center gap-2.5 rounded-[10px] border border-line bg-surface p-3">
                      <Checkbox
                        checked={checked[i]}
                        onChange={(e) => onToggle(i, e.target.checked)}
                        aria-label={item[0]}
                      />
                      <div className="min-w-0 flex-1 text-[12.5px] text-ink-2">{item[0]}</div>
                      <StatusBadge variant={checked[i] ? "done" : "process"}>
                        {checked[i] ? "Selesai" : "Proses"}
                      </StatusBadge>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default ChecklistPanel;