import Image from "next/image";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { IMAGES } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "contact", "/contact") : {};
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.contact;
  const productOptions = [...dict.products.items.map((i) => i.code === "Bitumen" ? i.name : i.code), ...dict.products.grades.map((g) => g.code)];

  return (
    <>
      <PageHero locale={lang} common={dict.common} crumb={t.crumb} title={t.title} lead={t.lead} />

      <Section label={t.formTi} className="pb-[110px] pt-16" innerClassName="grid items-start gap-6 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="reveal flex flex-col gap-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] bg-dark">
            <Image src={IMAGES.contact} alt={t.imgAlt} fill sizes="(min-width: 1240px) 500px, (min-width: 1000px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>

        <div className="card reveal p-6 min-[900px]:p-9">
          <h2 className="m-0 mb-6 text-2xl font-bold">{t.formTi}</h2>
          <InquiryForm t={t} products={productOptions} locale={lang} />
        </div>
      </Section>
    </>
  );
}
