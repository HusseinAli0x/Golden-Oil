import { notFound } from "next/navigation";
import { ProductShowcase } from "@/components/products/ProductShowcase";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "products", "/products") : {};
}

export default async function ProductsPage({ params }: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.productsPage;

  return (
    <>
      <PageHero locale={lang} common={dict.common} crumb={t.crumb} title={t.title} lead={t.lead} />
      <Section label={t.crumb} className="pt-16 min-[900px]:pt-[72px]">
        <ProductShowcase t={dict.products} common={dict.common} />
        <p className="m-0 text-sm text-subtle">{t.photoNote}</p>
      </Section>
      <div aria-hidden className="pb-[88px] min-[900px]:pb-[110px]" />
    </>
  );
}
