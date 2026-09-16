import type { ReactNode } from "react";
import { CardHeader } from "@/components/molecules/CardHeader";
import { TimelineItem } from "@/components/molecules/TimelineItem";

export interface TimelineEntry {
  date?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  done?: boolean;
}

export interface TimelineProps {
  title?: ReactNode;
  items: TimelineEntry[];
}

export function Timeline({ title = "Riwayat", items }: TimelineProps) {
  return (
    <section className="mt-4 rounded-lg border border-line bg-surface p-4">
      <CardHeader title={title} sub="Urut terlama ke terbaru" />
      <div className="mt-3 flex flex-col">
        {items.map((item, i) => (
          <TimelineItem key={i} last={i === items.length - 1} {...item} />
        ))}
      </div>
    </section>
  );
}
