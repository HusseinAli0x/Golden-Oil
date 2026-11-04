import type { ReactNode } from "react";

interface CtaBandProps {
  title: string;
  text: string;
  titleId?: string;
  children: ReactNode;
}

/** Dark call-to-action panel used at the end of inner pages. */
export function CtaBand({ title, text, titleId, children }: CtaBandProps) {
  return (
    <div className="reveal relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[var(--radius-card)] bg-primary p-7 min-[900px]:p-9">
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(224_123_42/0.35),transparent)]"
      />
      <div className="relative flex max-w-[640px] flex-col gap-2">
        <h2 id={titleId} className="m-0 text-[26px] font-bold text-white min-[900px]:text-[28px]">
          {title}
        </h2>
        <p className="m-0 text-[15px] leading-relaxed text-border-strong">{text}</p>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
