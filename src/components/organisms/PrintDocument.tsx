import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";

export interface PrintDocumentProps {
  title: ReactNode;
  onPrint?: () => void;
  children: ReactNode;
}

export function PrintDocument({ title, onPrint, children }: PrintDocumentProps) {
  return (
    <div className="mt-4 rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3.5">
      <div className="flex items-center justify-between gap-3">
        <b className="text-[13px] text-ink">{title}</b>
        {onPrint ? (
          <Button variant="default" size="sm" onClick={onPrint}>
            Print / Download
          </Button>
        ) : null}
      </div>
      <div className="mt-2.5 overflow-auto rounded-lg border border-[var(--color-surface-2)]">
        <div className="p-4 text-xs text-ink-2">{children}</div>
      </div>
    </div>
  );
}

export default PrintDocument;