import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

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

      <Section label={t.formTi} className="pb-[110px] pt-16" innerClassName="">
        <div className="card reveal mx-auto w-full max-w-[880px] p-6 min-[900px]:p-9">
          <h2 className="m-0 mb-6 text-2xl font-bold">{t.formTi}</h2>
          <InquiryForm t={t} products={productOptions} locale={lang} />
        </div>
      </Section>
    </>
  );
}
