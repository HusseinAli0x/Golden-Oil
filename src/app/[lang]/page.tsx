import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FilmSection } from "@/components/home/FilmSection";
import { Hero } from "@/components/home/Hero";
import { ProcessPipe } from "@/components/home/ProcessPipe";
import { ProductShowcase } from "@/components/products/ProductShowcase";
import { SiteModelEmbed } from "@/components/three/SiteModelEmbed";
import { ContactRefinery } from "@/components/ui/ContactRefinery";
import { ParentBrand } from "@/components/ui/ParentBrand";
import { Section, SectionHeading } from "@/components/ui/Section";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { CONTACT, IMAGES, SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "home", "") : {};
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.home;

  // Approved facts only (DESIGN-SPEC §1).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Golden Oil Refinery",
    alternateName: ["GOR", "مصفاة النفط الذهبي"],
    url: `${SITE_URL}${localePath(lang)}`,
    logo: `${SITE_URL}${IMAGES.logo}`,
    foundingDate: "2024",
    telephone: CONTACT.phoneDisplay,
    email: CONTACT.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Haidariya Power Station Street, Karbala–Najaf Road, Lamppost 410",
      addressLocality: "Najaf",
      addressCountry: "IQ",
    },
    parentOrganization: { "@type": "Organization", name: "Al Shabaka Al Thahabiya Trading LLC" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Hero t={t} parentLine={dict.common.parentLine} />

      <Section id="film" titleId="film-title">
        <SectionHeading id="film-title" title={t.filmTitle} lead={t.filmText} />
        <FilmSection t={t} />
      </Section>

      <Section id="process" titleId="process-title">
        <SectionHeading
          id="process-title"
          title={t.procTitle}
          lead={t.procSub}
        />
        <ProcessPipe stages={t.stages} />
      </Section>

      <Section id="explore" titleId="explore-title">
        <SectionHeading id="explore-title" title={t.expTitle} lead={t.expText} />
        <SiteModelEmbed t={dict.model3d} viewerHref={localePath(lang, "/site-model")} viewerLabel={t.expFull} />
      </Section>

      <Section id="products" titleId="products-title">
        <SectionHeading id="products-title" title={t.prodTitle} lead={t.prodSub} />
        <ProductShowcase t={dict.products} common={dict.common} />
      </Section>

      <Section id="about" titleId="about-title">
        <div className="card reveal flex flex-wrap items-center gap-10 p-7 min-[900px]:p-12">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
            <h2 id="about-title" className="h2">
              {t.aboutTitle}
            </h2>
            <p className="m-0 text-[17px] leading-[1.8] text-ink-soft">{t.aboutText}</p>
            <Link href={localePath(lang, "/about")} className="group inline-flex items-center gap-2 self-start text-[15px] font-semibold text-primary">
              {t.aboutLink}
              <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
          <div className="relative aspect-[4/3] min-w-0 flex-[1_1_420px] overflow-hidden rounded-2xl bg-bg-alt">
            <Image src={IMAGES.about} alt={t.aboutImgAlt} fill sizes="(min-width: 1240px) 560px, 100vw" className="object-cover" />
          </div>
        </div>
      </Section>

      <Section id="parent" titleId="parent-title">
        <ParentBrand common={dict.common} titleId="parent-title" />
      </Section>

      <ContactRefinery common={dict.common} />
      <div className="pb-[110px]" />
    </>
  );
}
