import { notFound } from "next/navigation";
import { SiteViewer } from "@/components/three/SiteViewer";
import { getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/site-model">) {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata(lang, "siteModel", "/site-model") : {};
}

export default async function SiteModelPage({ params }: PageProps<"/[lang]/site-model">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <SiteViewer t={getDictionary(lang).model3d} />;
}
