import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="greeting">
      <h1 className="m-0 text-[26px] font-bold tracking-tight text-ink">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-[700px] text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}

export default PageHeader;