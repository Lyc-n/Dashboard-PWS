import type { ReactNode } from "react";
import type { SummaryCardData } from "@/lib/mock-data";
import { EmptyState } from "@/components/atoms/EmptyState";
import { StatCard } from "@/components/molecules/StatCard";

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
          <StatCard key={d.name} caption={d.title} value={`${d.pct}%`} sub={d.sub} progress={d.pct} barColor={d.barColor} />
        ))}
      </div>
    </section>
  );
}
