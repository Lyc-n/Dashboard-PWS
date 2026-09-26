import type { ReactNode } from "react";
import { EmptyState } from "@/components/atoms/EmptyState";
import { StatCard } from "@/components/molecules/StatCard";

export interface SummaryCardData {
  name: string;
  title: string;
  jiwa: number;
  terlayani: number;
  pct: number;
  sub: string;
  bg?: string;
  barColor?: string;
}

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
          <StatCard key={d.name} caption={d.title} value={`${d.pct}%`} sub={d.sub} progress={d.pct} barColor={d.barColor} />
        ))}
      </div>
    </section>
  );
}
