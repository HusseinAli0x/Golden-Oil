import { IBM_Plex_Sans_Arabic, Sora } from "next/font/google";

// next/font downloads these at build time and serves them from our own origin.
export const sora = Sora({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-sora",
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-arabic",
});

export const fontVariables = `${sora.variable} ${plexArabic.variable}`;
