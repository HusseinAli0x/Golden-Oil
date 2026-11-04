import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  titleId?: string;
  label?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}

/** Page section with the site gutters and the 1240px content column. */
export function Section({ id, titleId, label, className = "pt-20 min-[900px]:pt-[104px]", innerClassName = "flex flex-col gap-7", children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={titleId} aria-label={titleId ? undefined : label} className={`wrap scroll-mt-20 ${className}`}>
      <div className={`mx-auto max-w-site ${innerClassName}`}>{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  id: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
}

/** Sections start directly with the heading — no eyebrow labels (client rule). */
export function SectionHeading({ id, title, lead, aside }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="reveal flex max-w-[720px] flex-col gap-2.5">
        <h2 id={id} className="h2">
          {title}
        </h2>
        {lead && <p className="m-0 text-lead text-muted">{lead}</p>}
      </div>
      {aside}
    </div>
  );
}
