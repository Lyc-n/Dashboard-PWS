import type { HTMLAttributes } from "react";
import { cn, PILL_STYLES  } from "@/lib/utils";
import type {PillVariant} from "@/lib/utils";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  shape?: "md" | "pill";
  size?: "xs" | "sm" | "md";
  bold?: boolean;
}

const SHAPE_CLASS = {
  md: "rounded-md",
  pill: "rounded-full",
} as const;

const SIZE_CLASS = {
  xs: "px-1.5 py-0.5 text-[10px]",
  sm: "px-[7px] py-[3px] text-[11px]",
  md: "px-2 py-0.5 text-[11px]",
} as const;

export function Pill({
  variant = "pending",
  shape = "md",
  size = "sm",
  bold,
  className,
  ...props
}: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap border",
        SHAPE_CLASS[shape],
        SIZE_CLASS[size],
        bold && "font-bold",
        PILL_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}