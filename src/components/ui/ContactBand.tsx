import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getDictionary, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { IMAGES } from "@/lib/site";
import { ContactButtons } from "./ContactButtons";
import { Section } from "./Section";

/** Closing "Contact the refinery" band: photo + direct contact + enquiry CTA, no empty areas. */
export function ContactBand({ common, locale }: { common: Dictionary["common"]; locale: Locale }) {
  return (
    <Section titleId="contact-title" className="pb-[110px] pt-16">
      <div className="reveal grid overflow-hidden rounded-[22px] bg-primary min-[900px]:grid-cols-[1fr_1.1fr]">
        <div className="relative min-h-[240px] min-[900px]:min-h-[360px]">
          <Image src={IMAGES.contact} alt={getDictionary(locale).contact.imgAlt} fill sizes="(min-width: 1240px) 600px, (min-width: 900px) 48vw, 100vw" className="object-cover" />
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgb(15_57_73/0.55),transparent_60%)]" />
        </div>
        <div className="flex flex-col justify-center gap-5 p-7 min-[900px]:p-11">
          <h2 id="contact-title" className="m-0 text-[28px] font-bold leading-tight text-white min-[900px]:text-[34px]">
            {common.contactBand.title}
          </h2>
          <p className="m-0 text-base leading-[1.75] text-border-strong">{common.contactBand.text}</p>
          <p className="m-0 flex items-start gap-2.5 text-sm leading-relaxed text-border">
            <MapPin size={18} aria-hidden className="mt-0.5 shrink-0 text-amber" />
            {common.address}
          </p>
          <ContactButtons common={common} tone="dark" />
          <Link href={localePath(locale, "/contact")} className="btn btn-amber self-start">
            {common.contactBand.cta}
          </Link>
        </div>
      </div>
    </Section>
  );
}
