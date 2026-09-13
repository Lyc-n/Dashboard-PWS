import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/atoms/Checkbox";

export interface ToggleSwitchProps extends LabelHTMLAttributes<HTMLLabelElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: ReactNode;
}

export function ToggleSwitch({ checked, onCheckedChange, children, className, ...props }: ToggleSwitchProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted", className)} {...props}>
      <Checkbox
        size="sm"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      {children}
    </label>
  );
}

export default ToggleSwitch;