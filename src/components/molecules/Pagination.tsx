import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";

export interface PaginationProps {
  info?: ReactNode;
  prevText?: ReactNode;
  nextText?: ReactNode;
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

export function Pagination({
  info,
  prevText = "‹",
  nextText = "›",
  canPrev = false,
  canNext = false,
  onPrev,
  onNext,
  className,
}: PaginationProps) {
  return (
    <div className={className ?? "flex items-center justify-between gap-3 px-3.5 py-3"}>
      {onPrev ? (
        <Button size="sm" variant="default" disabled={!canPrev} onClick={onPrev}>
          {prevText}
        </Button>
      ) : null}
      {info ? <span className="text-xs text-muted">{info}</span> : null}
      {onNext ? (
        <Button size="sm" variant="default" disabled={!canNext} onClick={onNext}>
          {nextText}
        </Button>
      ) : null}
    </div>
  );
}

export default Pagination;