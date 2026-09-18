import { forwardRef  } from "react";
import type {ButtonHTMLAttributes} from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  dark?: boolean;
  size?: "md" | "sm";
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected, dark, size = "md", type = "button", className, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        "cursor-pointer rounded-full border text-ink-2 font-semibold transition-colors",
        size === "md" ? "px-3.5 py-2 text-xs" : "px-2.5 py-1.5 text-[11px]",
        selected &&
          (dark ? "border-ink bg-ink text-on-accent" : "border-accent bg-accent text-on-accent"),
        className,
      )}
      {...props}
    />
  ),
);

Chip.displayName = "Chip";