import { Fragment } from "react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-3 flex items-center gap-2 text-xs text-muted", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {isLast ? (
              <span className="text-muted">{item.label}</span>
            ) : (
              <a className="text-muted hover:text-accent" href={item.href}>
                {item.label}
              </a>
            )}
            {!isLast ? <span aria-hidden>›</span> : null}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;