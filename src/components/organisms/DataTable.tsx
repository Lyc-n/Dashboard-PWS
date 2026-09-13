import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/molecules/Pagination";

export interface DataTableColumn {
  key: string;
  label?: ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn[];
  rows: T[];
  renderRow: (row: T, index: number) => ReactNode;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  toolbar?: ReactNode;
  info?: ReactNode;
  collapsibleMobile?: boolean;
  emptyMessage?: ReactNode;
  page?: number;
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  renderRow,
  sortKey,
  sortDir = "asc",
  onSort,
  toolbar,
  info,
  emptyMessage,
  page,
  canPrev,
  canNext,
  onPrev,
  onNext,
  className,
}: DataTableProps<T>) {
  const hasPagination = page !== undefined || onPrev || onNext;
  return (
    <div className={cn("mt-3.5 overflow-hidden rounded-[10px] border border-[var(--color-line-2)] bg-surface", className)}>
      {toolbar ? <div className="border-b border-[var(--color-line-2)] px-3.5 py-3">{toolbar}</div> : null}
      <div className="overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                    className={cn(
                      "whitespace-nowrap border-b border-[var(--color-line-2)] bg-surface-2 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted",
                      col.sortable && onSort && "cursor-pointer select-none",
                      col.headerClassName,
                    )}
                  >
                    <span className={cn("inline-flex items-center gap-1", active && "text-ink")}>
                      {col.label}
                      {col.sortable && onSort ? (
                        active ? (
                          sortDir === "asc" ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="opacity-50" />
                        )
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, i) => renderRow(row, i))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-5 text-center text-muted">
                  {emptyMessage ?? "Tidak ada data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasPagination ? (
        <Pagination info={info} canPrev={canPrev} canNext={canNext} onPrev={onPrev} onNext={onNext} />
      ) : null}
    </div>
  );
}

export default DataTable;