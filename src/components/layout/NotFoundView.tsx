import Link from "next/link";
import { House, Phone } from "lucide-react";
import { PumpJack } from "@/components/animations/PumpJack";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { CONTACT } from "@/lib/site";

/** 404: pump jack working an empty well (design/NotFound.dc.html). */
export function NotFoundView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.notFound;
  return (
    <div className="wrap">
      <div className="mx-auto flex min-h-[calc(100svh-66px-220px)] max-w-[1320px] flex-wrap items-center gap-12 py-12 min-[900px]:py-16">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <div aria-hidden className="text-[110px] font-extrabold leading-[0.9] tracking-[-6px] text-primary min-[760px]:text-[180px]">
            {t.big}
          </div>
          <h1 className="m-0 text-[32px] font-bold leading-[1.15] min-[760px]:text-[40px]">{t.title}</h1>
          <p className="m-0 max-w-[460px] text-[17px] leading-[1.65] text-muted">{t.text}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href={localePath(locale)} className="btn btn-primary">
              <House size={18} aria-hidden />
              {t.home}
            </Link>
            <a href={CONTACT.phoneHref} dir="ltr" className="btn btn-outline font-medium" aria-label={`${dict.common.phoneAria}: ${CONTACT.phoneDisplay}`}>
              <Phone size={16} aria-hidden />
              {CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_520px] items-center justify-center">
          <PumpJack variant="empty" label={t.art} className="max-w-[600px]" />
        </div>
      </div>
    </div>
  );
}
