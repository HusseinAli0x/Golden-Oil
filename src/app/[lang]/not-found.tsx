import { lang } from "next/root-params";
import { NotFoundView } from "@/components/layout/NotFoundView";
import { DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";

export default async function LocaleNotFound() {
  const value = await lang();
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  return <NotFoundView locale={locale} dict={getDictionary(locale)} />;
}
