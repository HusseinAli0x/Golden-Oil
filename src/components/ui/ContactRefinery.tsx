import { ArrowUpRight, Building2, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { CONTACT, mailtoHref } from "@/lib/site";
import { Section, SectionHeading } from "./Section";

interface Row {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  cta?: string;
  ltr?: boolean;
  external?: boolean;
  aria?: string;
}

/** "Contact the Refinery": address → Google Maps, tap-to-call phone, clickable email. */
export function ContactRefinery({ common, id = "contact-refinery", headingLevel = "section" }: { common: Dictionary["common"]; id?: string; headingLevel?: "section" | "page" }) {
  const t = common.contactBlock;
  const rows: Row[] = [
    { icon: MapPin, label: t.addressL, value: common.address, href: CONTACT.mapsHref, cta: t.mapsCta, external: true, aria: `${t.mapsAria}: ${common.address}` },
    { icon: Phone, label: t.phoneL, value: CONTACT.phoneDisplay, href: CONTACT.phoneHref, cta: t.callCta, ltr: true, aria: `${t.callCta}: ${CONTACT.phoneDisplay}` },
    { icon: Mail, label: t.emailL, value: CONTACT.email, href: mailtoHref(), cta: t.emailCta, ltr: true, aria: `${t.emailCta}: ${CONTACT.email}` },
    { icon: Building2, label: t.companyL, value: t.company },
  ];

  return (
    <Section id={id} titleId={`${id}-title`} className={headingLevel === "page" ? "pb-[110px] pt-16 min-[900px]:pt-[72px]" : "pt-20 min-[900px]:pt-[104px]"}>
      <SectionHeading id={`${id}-title`} title={t.title} lead={t.lead} />
      <p className="reveal m-0 text-[22px] font-bold">{t.name}</p>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[700px]:grid-cols-2">
        {rows.map(({ icon: Icon, label, value, href, cta, ltr, external, aria }) => {
          const body = (
            <>
              <span className="ico shrink-0">
                <Icon size={26} strokeWidth={1.6} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[13px] text-subtle">{label}</span>
                <span dir={ltr ? "ltr" : undefined} className={`text-[17px] font-semibold leading-snug [overflow-wrap:anywhere] ${ltr ? "text-start rtl:text-end" : ""}`}>
                  {value}
                </span>
                {cta && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {cta}
                    <ArrowUpRight size={15} aria-hidden className="rtl:-scale-x-100" />
                  </span>
                )}
              </span>
            </>
          );
          return (
            <li key={label} className="reveal">
              {href ? (
                <a
                  href={href}
                  aria-label={aria}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="card lift flex h-full items-start gap-4 p-6 text-ink no-underline"
                >
                  {body}
                </a>
              ) : (
                <div className="card flex h-full items-start gap-4 p-6">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
