import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/molecules/Card";
import { CardHeader } from "@/components/molecules/CardHeader";

export interface SectionCardProps {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

export function SectionCard({ title, sub, actions, className, bodyClassName, children }: SectionCardProps) {
  return (
    <Card className={cn("mt-3.5", className)}>
      <CardHeader title={title} sub={sub} actions={actions} />
      {children ? <div className={cn("mt-3", bodyClassName)}>{children}</div> : null}
    </Card>
  );
}
