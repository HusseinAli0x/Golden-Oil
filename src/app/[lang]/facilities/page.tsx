import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cylinder, Droplets, Fan, Heater, ShieldCheck, Waves, Wind, type LucideIcon } from "lucide-react";
import { ContactBand } from "@/components/ui/ContactBand";
import { CtaBand } from "@/components/ui/CtaBand";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { getDictionary, isLocale, localePath, type Dictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/facilities">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "facilities", "/facilities") : {};
}

type FacilityKey = keyof Dictionary["facilities"]["items"];

/**
 * Each facility gets the supplied photo whose filename names it
 * (e.g. "الفرن" → furnace, "مبادلات حرارية" → heat exchangers).
 */
const LAYOUT: ReadonlyArray<{ key: FacilityKey; image: string; span: string }> = [
  { key: "vdu", image: "/images/vdu-columns.jpg", span: "s2 r2" },
  { key: "feed", image: "/images/feed-tanks-entrance.jpg", span: "s2" },
  { key: "hx", image: "/images/heat-exchangers.jpg", span: "s2" },
  { key: "furnace", image: "/images/furnace.jpg", span: "s2" },
  { key: "vacuum", image: "/images/aerial-night-b.jpg", span: "s2" },
  { key: "storage", image: "/images/product-storage-tanks.jpg", span: "s2" },
  { key: "dispatch", image: "/images/loading-platform.jpg", span: "s2" },
];

const SUPPORT_CARD_IMAGES = ["/images/fire-water-pumps.jpg", "/images/instrument-air.jpg", "/images/tanker-truck.jpg"] as const;

/** Icons for `facilities.support`, in content order. */
const SUPPORT_ICONS: ReadonlyArray<LucideIcon> = [Fan, Heater, Cylinder, Droplets, Waves, ShieldCheck, Wind];

const IMG_EASE = "transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.05]";

export default async function FacilitiesPage({ params }: PageProps<"/[lang]/facilities">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.facilities;

  return (
    <>
      <PageHero locale={lang} common={dict.common} crumb={t.crumb} title={t.title} lead={t.lead} />

      <Section label={t.crumb} className="pt-16 min-[900px]:pt-[72px]">
        <div className="bento">
          {LAYOUT.map(({ key, image, span }) => {
            const item = t.items[key];
            const tall = span.includes("r2");
            return (
              <article key={key} id={`f-${key}`} className={`card lift reveal group flex scroll-mt-24 flex-col overflow-hidden ${span}`}>
                <div className={`relative w-full overflow-hidden bg-dark ${tall ? "aspect-[4/3] min-[1080px]:aspect-auto min-[1080px]:min-h-[300px] min-[1080px]:flex-1" : "aspect-[16/10]"}`}>
                  <Image src={image} alt={t.imgAlts[key]} fill quality={90} sizes="(min-width: 1080px) 1240px, (min-width: 600px) 100vw, 100vw" className={`object-cover ${IMG_EASE}`} />
                </div>
                <div className="flex flex-col gap-2.5 p-6">
                  <h2 className="m-0 text-[22px] font-bold">{item.title}</h2>
                  <p className="m-0 text-[15px] leading-[1.7] text-muted">{item.text}</p>
                  <p className="m-0 text-[13px] leading-relaxed">
                    <b className="text-accent-text">{t.roleL}</b> {item.role}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <Section id="site-support" titleId="site-support-title" className="pt-20 min-[900px]:pt-[88px]">
        <SectionHeading id="site-support-title" title={t.supportCardsTi} />
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[700px]:grid-cols-3">
          {t.supportCards.map((c, i) => (
            <li key={c.title} className="card lift reveal group overflow-hidden">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-dark">
                <Image src={SUPPORT_CARD_IMAGES[i]} alt={c.alt} fill sizes="(min-width: 1240px) 410px, (min-width: 700px) 33vw, 100vw" className={`object-cover ${IMG_EASE}`} />
              </div>
              <div className="flex flex-col gap-2 p-6">
                <h3 className="m-0 text-xl font-bold">{c.title}</h3>
                <p className="m-0 text-[15px] leading-[1.7] text-muted">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="support" titleId="support-title" className="pt-20 min-[900px]:pt-[88px]">
        <SectionHeading id="support-title" title={t.supportTi} lead={t.supportLead} />
        <ul className="reveal m-0 flex list-none flex-wrap gap-2.5 p-0">
          {t.support.map((s, i) => {
            const Icon = SUPPORT_ICONS[i] ?? ShieldCheck;
            return (
              <li key={s} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[15px] font-medium">
                <Icon size={17} className="text-accent-text" aria-hidden />
                {s}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="tour" titleId="tour-title" className="pt-16">
        <CtaBand title={t.tourT} text={t.tourP} titleId="tour-title">
          <Link href={localePath(lang, "/site-model")} className="btn btn-amber">
            {t.tourBtn}
          </Link>
        </CtaBand>
      </Section>

      <ContactBand common={dict.common} locale={lang} />
    </>
  );
}
