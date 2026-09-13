import type { ReactNode } from "react";
import type { SummaryCardData } from "@/lib/mock-data";
import { EmptyState } from "@/components/atoms/EmptyState";
import { SummaryCard } from "@/components/molecules/SummaryCard";

export interface KelurahanSectionProps {
  items: SummaryCardData[];
  emptyMessage?: ReactNode;
}

export function KelurahanSection({ items, emptyMessage }: KelurahanSectionProps) {
  if (items.length === 0) {
    return (
      <section className="mt-5">
        <EmptyState>
          {emptyMessage ?? "Tidak ada kelurahan aktif — aktifkan di Atur Kelurahan."}
        </EmptyState>
      </section>
    );
  }
  return (
    <section className="mt-5">
      <div className="grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {items.map((d) => (
          <SummaryCard key={d.name} data={d} />
        ))}
      </div>
    </section>
  );
}

export default KelurahanSection;