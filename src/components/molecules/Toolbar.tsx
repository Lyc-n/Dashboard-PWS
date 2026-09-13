import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ToolbarProps {
  children?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function Toolbar({ children, left, right, className }: ToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {left ?? children}
      {right ? (
        <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div>
      ) : null}
    </div>
  );
}

export default Toolbar;