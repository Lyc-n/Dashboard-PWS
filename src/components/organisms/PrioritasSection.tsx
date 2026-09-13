import type { ReactNode } from "react";
import type { SummaryCardData } from "@/lib/mock-data";
import { EmptyState } from "@/components/atoms/EmptyState";
// import { Badge } from "@/components/atoms/Badge";
import { SummaryCard } from "@/components/molecules/SummaryCard";

export interface PrioritasSectionProps {
  items: SummaryCardData[];
  emptyMessage?: ReactNode;
}

export function PrioritasSection({ items, emptyMessage }: PrioritasSectionProps) {
  if (items.length === 0) {
    return (
      <section className="mt-5">
        <EmptyState>{emptyMessage ?? "Tidak ada prioritas aktif."}</EmptyState>
      </section>
    );
  }
  return (
    <section className="mt-5">
      <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        {items.map((d) => (
          <SummaryCard
            key={d.name}
            data={d}
            // badge={<Badge variant={d.pct >= 75 ? "ok" : "izin"}>{d.pct >= 75 ? "On track" : "Waspada"}</Badge>}
          />
        ))}
      </div>
    </section>
  );
}

export default PrioritasSection;