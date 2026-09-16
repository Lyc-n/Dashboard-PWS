import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Chip  } from "@/components/atoms/Chip";
import type {ChipProps} from "@/components/atoms/Chip";

export interface ChipOption {
  value: string;
  label: ReactNode;
}

export interface ChipGroupProps {
  options: ChipOption[];
  selected: ReadonlySet<string> | string[] | string;
  onToggle: (value: string) => void;
  dark?: boolean;
  className?: string;
  chipProps?: Partial<ChipProps>;
}

export function ChipGroup({ options, selected, onToggle, dark, className, chipProps }: ChipGroupProps) {
  const has = (v: string) =>
    typeof selected === "string" ? selected === v : Array.from(selected).includes(v);
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <Chip
          key={opt.value}
          selected={has(opt.value)}
          dark={dark}
          onClick={() => onToggle(opt.value)}
          {...chipProps}
        >
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}
