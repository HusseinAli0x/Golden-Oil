import Link from "next/link";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { CONTACT, COPYRIGHT_YEAR, IMAGES, NAV_ITEMS, PRODUCTS, mailtoHref } from "@/lib/site";

interface SiteFooterProps {
  locale: Locale;
  dict: Dictionary;
}

const colTitle = "text-xs font-semibold tracking-[1.5px] text-white";
const footLink = "-my-[5px] min-w-10 self-start py-[10px] text-border-strong no-underline transition-colors hover:text-white";

export function SiteFooter({ locale, dict }: SiteFooterProps) {
  const t = dict.common;
  return (
    <footer className="bg-dark text-border-strong">
      <div className="wrap pb-7 pt-14">
        <div className="mx-auto flex max-w-site flex-col gap-9">
          <div className="flex flex-wrap gap-x-16 gap-y-10">
            <div className="flex-none">
              <span className="fire-logo" role="img" aria-label={t.gorLogoAlt}>
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny SVG, sized exactly */}
                <img src={IMAGES.logo} alt="" width={84} height={137} loading="lazy" className="block h-[137px] w-[84px]" />
                <span className="fl-shine" aria-hidden />
              </span>
            </div>

            <nav aria-label={t.footer.nav} className="flex min-w-0 flex-[1_1_160px] flex-col gap-2.5 text-sm">
              <span className={colTitle}>{t.footer.pages}</span>
              {NAV_ITEMS.map((item) => (
                <Link key={item.key} href={localePath(locale, item.path)} className={footLink}>
                  {t.nav[item.key]}
                </Link>
              ))}
            </nav>

            <nav aria-label={t.footer.products} className="flex min-w-0 flex-[1_1_160px] flex-col gap-2.5 text-sm">
              <span className={colTitle}>{t.footer.products}</span>
              {PRODUCTS.map((p, i) => (
                <Link key={p.slug} href={`${localePath(locale, "/products")}#${p.slug}`} className={footLink} dir="ltr">
                  {dict.products.items[i].code}
                </Link>
              ))}
            </nav>

            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5 text-sm leading-relaxed">
              <span className={colTitle}>{t.footer.contact}</span>
              <address className="not-italic">{t.address}</address>
              <a href={CONTACT.phoneHref} dir="ltr" className={footLink} aria-label={`${t.phoneAria}: ${CONTACT.phoneDisplay}`}>
                {CONTACT.phoneDisplay}
              </a>
              <a href={mailtoHref()} dir="ltr" className={`${footLink} break-all`} aria-label={`${t.emailAria}: ${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 text-[13px]">
            <span>
              © {COPYRIGHT_YEAR} Golden Oil Refinery (GOR). {t.footer.rights}
            </span>
            <span>{t.footer.illus}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
