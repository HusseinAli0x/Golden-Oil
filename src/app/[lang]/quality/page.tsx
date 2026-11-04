import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardCheck, FlaskConical, HeartPulse, Leaf, ShieldCheck, type LucideIcon } from "lucide-react";
import { ContactBand } from "@/components/ui/ContactBand";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/quality">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "quality", "/quality") : {};
}

export default async function QualityPage({ params }: PageProps<"/[lang]/quality">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.quality;

  const cards: ReadonlyArray<{ item: { title: string; text: string; items: readonly string[] }; icon: LucideIcon; span: string; pending: boolean }> = [
    { item: t.qm, icon: ClipboardCheck, span: "s2", pending: true },
    { item: t.pq, icon: FlaskConical, span: "s2", pending: true },
    { item: t.hs, icon: HeartPulse, span: "s2 r2", pending: false },
    { item: t.env, icon: Leaf, span: "s2", pending: false },
    { item: t.os, icon: ShieldCheck, span: "s2", pending: false },
  ];

  return (
    <>
      <PageHero locale={lang} common={dict.common} crumb={t.crumb} title={t.title} lead={t.lead} />

      <Section label={t.crumb} className="pt-16 min-[900px]:pt-[72px]">
        <div className="bento">
          {cards.map(({ item, icon: Icon, span, pending }) => (
            <article key={item.title} className={`card reveal flex flex-col gap-3.5 p-[30px] ${span}`}>
              <div className="ico">
                <Icon size={26} strokeWidth={1.6} aria-hidden />
              </div>
              <h2 className="m-0 text-2xl font-bold">{item.title}</h2>
              <p className="m-0 text-[15px] leading-[1.7] text-muted">{item.text}</p>
              {item.items.length > 0 && (
                <ul className="m-0 flex flex-col gap-1.5 ps-[18px] text-sm text-ink-soft">
                  {item.items.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              )}
              {pending && <span className="tag">{dict.common.pending}</span>}
            </article>
          ))}
        </div>
      </Section>

      <Section id="sus" titleId="sus-title" className="pt-10">
        <div className="card reveal flex flex-wrap items-center justify-between gap-5 p-8">
          <div className="flex max-w-[640px] flex-col gap-2">
            <h2 id="sus-title" className="m-0 text-[26px] font-bold">
              {t.susT}
            </h2>
            <p className="m-0 text-[15px] leading-[1.7] text-muted">{t.susP}</p>
          </div>
          <Link href={localePath(lang, "/sustainability")} className="btn btn-primary">
            {t.susBtn}
          </Link>
        </div>
        <p className="m-0 text-sm leading-relaxed text-subtle">{t.claimNote}</p>
      </Section>

      <ContactBand common={dict.common} locale={lang} />
    </>
  );
}
