import Link from "next/link";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

interface PageHeroProps {
  locale: Locale;
  common: Dictionary["common"];
  crumb: string;
  title: string;
  lead: string;
}

/** Inner-page hero: breadcrumb, H1 and lead on a white band with a faint pipeline motif. */
export function PageHero({ locale, common, crumb, title, lead }: PageHeroProps) {
  return (
    <section aria-labelledby="page-title" className="wrap relative overflow-hidden border-b border-border bg-surface pb-14 pt-16 min-[900px]:pt-[72px]">
      <svg
        aria-hidden
        viewBox="0 0 600 260"
        className="pointer-events-none absolute -end-16 top-0 hidden h-full w-[560px] text-border min-[900px]:block rtl:-scale-x-100"
        fill="none"
      >
        <path d="M0 210 H260 Q290 210 290 180 V90 Q290 60 320 60 H600" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
        <path d="M0 210 H260 Q290 210 290 180 V90 Q290 60 320 60 H600" stroke="#F5F6F8" strokeWidth="8" strokeLinecap="round" />
        <path d="M120 250 V150 Q120 130 140 130 H600" stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity=".7" />
        <circle cx="290" cy="135" r="17" fill="#fff" stroke="#FFC000" strokeWidth="2" />
        <circle cx="290" cy="135" r="5" fill="#FFC000" />
      </svg>
      <div className="relative mx-auto flex max-w-site flex-col gap-[18px]">
        <nav aria-label={common.breadcrumbAria} className="text-[13px] text-subtle">
          <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            <li>
              <Link href={localePath(locale)} className="text-subtle underline-offset-2 hover:text-ink">
                {common.crumbHome}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{crumb}</li>
          </ol>
        </nav>
        <h1 id="page-title" className="h1 max-w-[880px]">
          {title}
        </h1>
        <p className="m-0 max-w-[680px] text-lead text-muted">{lead}</p>
      </div>
    </section>
  );
}
