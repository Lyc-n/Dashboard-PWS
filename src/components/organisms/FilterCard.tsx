import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/molecules/Card";
import { CardHeader } from "@/components/molecules/CardHeader";

export interface FilterCardProps {
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function FilterCard({ title, sub, children, footer, className }: FilterCardProps) {
  return (
    <Card className={cn("mt-4", className)}>
      <CardHeader title={title} sub={sub} />
      {children ? <div className="mt-3">{children}</div> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </Card>
  );
}
