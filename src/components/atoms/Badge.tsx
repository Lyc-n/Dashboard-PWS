import type { HTMLAttributes } from "react";
import { Pill  } from "@/components/atoms/Pill";
import type {PillProps} from "@/components/atoms/Pill";
import type { BadgeVariant } from "@/lib/utils";

export interface BadgeProps extends Omit<PillProps, "variant">, HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "ok", className, ...props }: BadgeProps) {
  return <Pill variant={variant} size="xs" className={className} {...props} />;
}
