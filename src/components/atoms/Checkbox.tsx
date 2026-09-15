import { forwardRef  } from "react";
import type {InputHTMLAttributes} from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "md" | "sm";
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ size = "md", className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "flex-none accent-accent",
        size === "md" ? "h-5 w-5" : "size-[18px]",
        className,
      )}
      {...props}
    />
  ),
);

Checkbox.displayName = "Checkbox";