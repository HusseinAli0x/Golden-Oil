import type { Metadata } from "next";
import { getDictionary, LOCALES, localePath, type Locale } from "@/lib/i18n";
import { IMAGES, SITE_URL, type RoutePath } from "@/lib/site";

type PageMetaKey = Exclude<keyof ReturnType<typeof getDictionary>["meta"], "siteName" | "ogLocale">;

/** Per-page title/description with canonical, hreflang alternates and Open Graph. */
export function pageMetadata(locale: Locale, key: PageMetaKey, path: RoutePath): Metadata {
  const dict = getDictionary(locale);
  const { title, description } = dict.meta[key];
  const languages = Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)]));

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: title },
    description,
    alternates: {
      canonical: localePath(locale, path),
      languages: { ...languages, "x-default": localePath("en", path) },
    },
    openGraph: {
      type: "website",
      siteName: dict.meta.siteName,
      title,
      description,
      url: localePath(locale, path),
      locale: dict.meta.ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => getDictionary(l).meta.ogLocale),
      images: [{ url: IMAGES.hero, width: 1215, height: 668, alt: dict.home.filmAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [IMAGES.hero] },
  };
}
