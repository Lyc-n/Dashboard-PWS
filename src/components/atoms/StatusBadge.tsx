import type { HTMLAttributes } from "react";
import { Pill  } from "@/components/atoms/Pill";
import type {PillProps} from "@/components/atoms/Pill";
import { statusVariantFrom  } from "@/lib/utils";
import type {StatusVariant} from "@/lib/utils";

export interface StatusBadgeProps extends Omit<PillProps, "variant">, HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  value?: string | null;
}

export function StatusBadge({ variant, value, className, children, ...props }: StatusBadgeProps) {
  const resolved = variant ?? statusVariantFrom(value);
  return (
    <Pill variant={resolved} size="sm" bold className={className} {...props}>
      {children ?? value}
    </Pill>
  );
}
