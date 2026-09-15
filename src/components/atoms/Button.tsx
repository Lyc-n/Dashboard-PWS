import { forwardRef  } from "react";
import type {ButtonHTMLAttributes} from "react";
import { cn } from "@/lib/utils"; 

type Variant = "default" | "primary" | "ghost" | "danger" | "export";
type Size = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASS: Record<Variant, string> = {
  default: "border-line bg-surface text-ink-2 hover:border-accent",
  primary: "border-accent bg-accent text-white hover:bg-accent-hover",
  ghost: "border-accent-border bg-surface text-accent hover:bg-accent-light",
  danger: "border-[var(--color-danger-border)] bg-surface text-danger hover:bg-[var(--color-danger-soft)]",
  export: "border-accent bg-accent text-white hover:bg-accent-hover",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "min-h-10 px-5 py-2.5 text-[13px]",
  sm: "min-h-8 px-3 py-1 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", type = "button", className, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-bold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";