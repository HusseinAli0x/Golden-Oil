import type { Metadata, Viewport } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: "Golden Oil Refinery (GOR) | مصفاة النفط الذهبي" },
  description:
    "Golden Oil Refinery (GOR) in Najaf, Iraq — vacuum distillation of Furnace Oil into VDO, LVGO and HVGO. مصفاة النفط الذهبي في النجف، العراق.",
  alternates: { canonical: "/", languages: { en: "/en", ar: "/ar", "x-default": "/en" } },
};

export const viewport: Viewport = { themeColor: "#F5F6F8" };

export default function IntroLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
