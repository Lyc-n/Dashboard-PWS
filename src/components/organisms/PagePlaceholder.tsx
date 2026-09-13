import type { ReactNode } from "react";

export interface PagePlaceholderProps {
  title: string;
  description?: ReactNode;
  label?: string;
}

export function PagePlaceholder({ title, description, label = "Under construction" }: PagePlaceholderProps) {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">{label}</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">{title}</h1>
        {description ? <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">{description}</p> : null}
      </section>
    </main>
  );
}

export default PagePlaceholder;