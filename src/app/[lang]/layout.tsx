import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "../globals.css";
import { BackToTop } from "@/components/layout/BackToTop";
import { LangMemory } from "@/components/layout/LangMemory";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeaderBar, SiteHeader } from "@/components/layout/SiteHeader";
import { fontVariables } from "@/lib/fonts";
import { dirOf, getDictionary, isLocale, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#F5F6F8",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html lang={lang} dir={dirOf(lang)} className={fontVariables}>
      <body>
        <a
          href="#main"
          className="absolute start-4 top-[-60px] z-[80] rounded-lg bg-primary px-4 py-2.5 font-semibold text-white no-underline focus:top-3"
        >
          {dict.common.skip}
        </a>
        <ScrollProgress />
        <LangMemory locale={lang} />
        <Suspense fallback={<HeaderBar locale={lang} t={dict.common} pathname={null} />}>
          <SiteHeader locale={lang} t={dict.common} />
        </Suspense>
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter locale={lang} dict={dict} />
        <BackToTop label={dict.common.backTop} />
      </body>
    </html>
  );
}
