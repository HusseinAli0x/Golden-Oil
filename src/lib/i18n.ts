import en from "@/content/en.json";
import ar from "@/content/ar.json";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Storage key used to remember the visitor's language choice. */
export const LANG_STORAGE_KEY = "gor-lang";

/** The English file is the source of truth for the dictionary shape. */
export type Dictionary = typeof en;

// Typing the Arabic file against the English one makes a missing key a build error.
const arabic: Dictionary = ar;
const dictionaries: Record<Locale, Dictionary> = { en, ar: arabic };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ar";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

/** Builds a localized path, e.g. localePath("ar", "/about") -> "/ar/about". */
export function localePath(locale: Locale, path = ""): string {
  const clean = path === "/" ? "" : path;
  return `/${locale}${clean}`;
}

/** Swaps the locale segment of a pathname, keeping the rest of the route. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    parts[1] = to;
    return parts.join("/") || `/${to}`;
  }
  return `/${to}`;
}
