import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowDown, Droplets, Flame, Recycle, ShieldAlert, Waves, type LucideIcon } from "lucide-react";
import { ContactBand } from "@/components/ui/ContactBand";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/sustainability">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "sustainability", "/sustainability") : {};
}

const ICONS: ReadonlyArray<LucideIcon> = [Droplets, Flame, Recycle, ShieldAlert, Waves];

export default async function SustainabilityPage({ params }: PageProps<"/[lang]/sustainability">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.sustainability;

  return (
    <>
      <PageHero locale={lang} common={dict.common} crumb={t.crumb} title={t.title} lead={t.lead} />

      <Section label={t.crumb} className="pt-16 min-[900px]:pt-[72px]">
        {/* Heat recovery: photo + concept flow fill the whole card. */}
        <article aria-labelledby="hr-title" className="reveal grid overflow-hidden rounded-[22px] bg-primary min-[900px]:grid-cols-[1.05fr_1fr]">
          <div className="relative min-h-[260px] min-[900px]:min-h-[420px]">
            <Image src="/images/heat-exchangers.jpg" alt={t.hr.imgAlt} fill sizes="(min-width: 1240px) 700px, (min-width: 900px) 52vw, 100vw" className="object-cover object-[62%_58%]" quality={90} />
          </div>
          <div className="flex flex-col justify-center gap-6 p-7 min-[900px]:p-11">
            <h2 id="hr-title" className="m-0 text-[30px] font-bold leading-tight text-white min-[900px]:text-[36px]">
              {t.hr.title}
            </h2>
            <p className="m-0 text-base leading-[1.8] text-border-strong">{t.hr.text}</p>
            <ol className="m-0 flex list-none flex-col gap-1 p-0">
              {t.hr.steps.map((step, i) => (
                <li key={step} className="flex flex-col gap-1">
                  <span className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[15px] font-semibold leading-snug text-white">
                    <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber text-sm font-bold text-night">
                      {i + 1}
                    </span>
                    {step}
                  </span>
                  {i < t.hr.steps.length - 1 && <ArrowDown aria-hidden size={18} className="self-center text-amber" />}
                </li>
              ))}
            </ol>
          </div>
        </article>

        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[640px]:grid-cols-2 min-[1080px]:grid-cols-6">
          {t.items.map((item, i) => {
            const Icon = ICONS[i] ?? Droplets;
            return (
              <li key={item.title} className={`card lift reveal flex flex-col gap-3.5 p-7 ${i < 3 ? "min-[1080px]:col-span-2" : "min-[1080px]:col-span-3"} ${i === t.items.length - 1 && t.items.length % 2 ? "min-[640px]:max-[1079px]:col-span-2" : ""}`}>
                <div className="ico">
                  <Icon size={26} strokeWidth={1.6} aria-hidden />
                </div>
                <h2 className="m-0 text-[22px] font-bold">{item.title}</h2>
                <p className="m-0 text-[15px] leading-[1.75] text-muted">{item.text}</p>
              </li>
            );
          })}
        </ul>
        <p className="m-0 text-sm leading-relaxed text-subtle">{t.claimNote}</p>
      </Section>

      <ContactBand common={dict.common} locale={lang} />
    </>
  );
}
