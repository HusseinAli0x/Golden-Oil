import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, CircleCheck, Droplet, Eye, Factory, Gauge, Handshake, MapPin, ShieldCheck, Split, Target } from "lucide-react";
import { ContactBand } from "@/components/ui/ContactBand";
import { ParentBrand } from "@/components/ui/ParentBrand";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { IMAGES } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "about", "/about") : {};
}

const VALUE_ICONS = [Eye, Target, ShieldCheck, Handshake];

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.about;

  const facts = [
    { icon: MapPin, label: t.fLocL, value: t.fLoc },
    { icon: Gauge, label: t.fCapL, value: t.fCap },
    { icon: Factory, label: t.fVduL, value: t.fVdu },
    { icon: Droplet, label: t.fFeedL, value: t.fFeed },
  ];

  return (
    <>
      <PageHero locale={lang} common={dict.common} crumb={t.crumb} title={t.title} lead={t.lead} />

      <Section id="who" titleId="who-title" className="pt-20 min-[900px]:pt-[88px]">
        <SectionHeading id="who-title" title={t.whoTi} />
        <div className="flex flex-wrap gap-8">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
            <p className="m-0 text-xl leading-[1.7]">{t.whoText}</p>
            <p className="m-0 text-[15px] leading-[1.7] text-muted">{t.whoText2}</p>
          </div>
          <div className="relative aspect-[4/3] min-w-0 flex-[1_1_300px] overflow-hidden rounded-[18px]">
            <Image src={IMAGES.storage} alt={t.posterAlt} fill sizes="(min-width: 1240px) 420px, 100vw" className="object-cover" />
          </div>
        </div>

        <div className="bento">
          {facts.map(({ icon: Icon, label, value }) => (
            <article key={label} className="card reveal flex flex-col justify-between gap-3.5 p-[26px]">
              <div className="ico">
                <Icon size={26} strokeWidth={1.6} aria-hidden />
              </div>
              <div>
                <p className="m-0 text-[13px] text-subtle">{label}</p>
                <p className="m-0 mt-1.5 text-[22px] font-bold">{value}</p>
              </div>
            </article>
          ))}
          <article className="card reveal s2 flex flex-col gap-3.5 p-[26px]">
            <div className="ico">
              <Split size={26} strokeWidth={1.6} aria-hidden />
            </div>
            <p className="m-0 text-[13px] text-subtle">{t.fProdL}</p>
            <p className="m-0 text-[22px] font-bold" dir="ltr">
              VDO · LVGO · HVGO · Bitumen
            </p>
            <p className="m-0 text-sm leading-relaxed text-subtle">{t.fProdNote}</p>
          </article>
          <article className="card reveal s2 flex flex-col justify-between gap-3.5 p-[26px]">
            <div className="ico">
              <Calendar size={26} strokeWidth={1.6} aria-hidden />
            </div>
            <div>
              <p className="m-0 text-[13px] text-subtle">{t.fEstL}</p>
              <p className="m-0 mt-1.5 text-[22px] font-bold">{t.fEst}</p>
            </div>
          </article>
        </div>
      </Section>

      <Section id="parent" titleId="parent-title" className="pt-20 min-[900px]:pt-[88px]">
        <SectionHeading id="parent-title" title={t.parTi} />
        <ParentBrand common={dict.common} />
      </Section>

      <Section id="values" titleId="values-title" className="pt-20 min-[900px]:pt-[88px]">
        <SectionHeading id="values-title" title={t.valTi} />
        <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-2">
          {t.values.map((v, i) => {
            const Icon = VALUE_ICONS[i] ?? CircleCheck;
            return (
              <article key={v.title} className="card lift reveal flex flex-col gap-3 p-7">
                <div className="ico">
                  <Icon size={26} strokeWidth={1.6} aria-hidden />
                </div>
                <h3 className="m-0 text-[22px] font-bold">{v.title}</h3>
                {v.text && <p className="m-0 text-base leading-[1.75] text-muted">{v.text}</p>}
                {v.list.length > 0 && (
                  <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                    {v.list.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-base leading-snug">
                        <CircleCheck size={18} aria-hidden className="mt-0.5 shrink-0 text-accent-text" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </Section>

      <ContactBand common={dict.common} locale={lang} />
    </>
  );
}
