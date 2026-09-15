import { Fragment  } from "react";
import type {ReactNode} from "react";
import { EmptyState } from "@/components/atoms/EmptyState";

export interface HistoryPanelProps {
  items: ReactNode[];
  emptyMessage?: ReactNode;
}

export function HistoryPanel({ items, emptyMessage = "Belum ada riwayat." }: HistoryPanelProps) {
  if (items.length === 0) return <EmptyState>{emptyMessage}</EmptyState>;
  return (
    <section className="mt-4 grid gap-3">
      {items.map((item, i) => (
        <Fragment key={i}>{item}</Fragment>
      ))}
    </section>
  );
}

export default HistoryPanel;