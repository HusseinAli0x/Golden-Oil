import { lang } from "next/root-params";
import { LoadingScreen } from "@/components/animations/LoadingScreen";
import { DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";

export default async function Loading() {
  const value = await lang();
  return <LoadingScreen t={getDictionary(isLocale(value) ? value : DEFAULT_LOCALE).loading} />;
}
