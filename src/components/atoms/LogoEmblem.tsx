import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LogoEmblemProps {
  children?: ReactNode;
  className?: string;
}

export function LogoEmblem({ children, className }: LogoEmblemProps) {
  return (
    <span
      className={cn(
        "grid size-8 flex-none place-items-center rounded-full border-2 border-accent bg-surface text-[10px] font-bold text-accent",
        className,
      )}
    >
      {children ?? "PK"}
    </span>
  );
}

export default LogoEmblem;