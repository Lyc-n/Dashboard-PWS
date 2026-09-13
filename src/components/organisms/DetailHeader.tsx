import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";
import { Breadcrumb } from "@/components/molecules/Breadcrumb";
import type { BreadcrumbItem } from "@/components/molecules/Breadcrumb";

export interface DetailHeaderProps {
  breadcrumb?: BreadcrumbItem[];
  onBack?: () => void;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function DetailHeader({ breadcrumb, onBack, title, meta, actions }: DetailHeaderProps) {
  return (
    <div className="rounded-lg border-t-[3px] border-t-accent bg-surface-warm px-3.5 py-3">
      {breadcrumb?.length ? <Breadcrumb items={breadcrumb} className="mb-2.5" /> : null}
      <div className="flex flex-wrap items-center gap-3">
        {onBack ? (
          <Button aria-label="Kembali" className="size-9 px-0" onClick={onBack}>
            <ArrowLeft size={18} />
          </Button>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-base font-bold text-ink">{title}</h1>
        </div>
        {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-2.5 text-[11.5px] text-muted">{meta}</div> : null}
    </div>
  );
}

export default DetailHeader;