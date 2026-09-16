import type { HTMLAttributes } from "react";
import { Pill  } from "@/components/atoms/Pill";
import type {PillProps} from "@/components/atoms/Pill";
import { priorityTagVariant  } from "@/lib/utils";
import type {TagVariant} from "@/lib/utils";

export interface TagProps extends Omit<PillProps, "variant">, HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  priority?: string;
}

export function Tag({ variant, priority, className, children, ...props }: TagProps) {
  const resolved = variant ?? priorityTagVariant(priority);
  return (
    <Pill variant={resolved} shape="pill" size="md" className={className} {...props}>
      {children ?? priority}
    </Pill>
  );
}