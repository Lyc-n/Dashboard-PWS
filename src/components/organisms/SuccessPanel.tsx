import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export interface SuccessPanelProps {
  title?: ReactNode;
  message?: ReactNode;
  children?: ReactNode;
}

export function SuccessPanel({
  title = "Data berhasil disimpan.",
  message,
  children,
}: SuccessPanelProps) {
  return (
    <div className="mt-4 rounded-lg border border-line border-t-[3px] border-t-accent bg-surface p-5 text-center">
      <div className="grid justify-items-center gap-1.5">
        <CheckCircle2 className="size-9 text-accent" />
        <div className="text-base font-bold text-ink">{title}</div>
        {message ? <div className="max-w-[520px] text-[12.5px] leading-relaxed text-muted">{message}</div> : null}
      </div>
      {children ? <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div> : null}
    </div>
  );
}
