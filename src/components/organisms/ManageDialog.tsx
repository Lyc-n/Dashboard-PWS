import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CardHeader } from "@/components/molecules/CardHeader";

export interface ManageDialogProps {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ManageDialog({ title, description, children, footer, className }: ManageDialogProps) {
  return (
    <section className={cn("mt-4 rounded-lg border border-line bg-surface p-4", className)}>
      <CardHeader title={title} sub={description} />
      {children ? <div className="mt-3.5 grid gap-3">{children}</div> : null}
      {footer ? <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div> : null}
    </section>
  );
}

export default ManageDialog;