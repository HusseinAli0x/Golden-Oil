import type { Dictionary } from "@/lib/i18n";

/**
 * Public contact details. Phone and email still need GOR management approval
 * before launch (DESIGN-SPEC §10.4) — change them here only.
 */
export const CONTACT = {
  phoneDisplay: "+964-7800033361",
  phoneHref: "tel:+9647800033361",
  email: "info@alshabaka-althahabiya.com.iq",
  /** Google Maps search for the refinery address (opens the Maps app on phones). */
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Haidariya Power Station Street, Karbala-Najaf Road, Lamppost 410, Najaf, Iraq"),
} as const;

export function mailtoHref(subject?: string): string {
  const base = `mailto:${CONTACT.email}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

/** Company film: local file, served from /public (no third-party player). */
export const FILM = {
  src: "/video/gor-film.mp4",
  poster: "/images/hero-film-poster.jpg",
} as const;

/** Fixed year so pages stay fully static. */
export const COPYRIGHT_YEAR = 2026;

/** Public base URL, used for canonical links, hreflang, sitemap and Open Graph. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type NavKey = keyof Dictionary["common"]["nav"];

export const NAV_ITEMS: ReadonlyArray<{ key: NavKey; path: string }> = [
  { key: "home", path: "" },
  { key: "about", path: "/about" },
  { key: "facilities", path: "/facilities" },
  { key: "products", path: "/products" },
  { key: "quality", path: "/quality" },
  { key: "sustainability", path: "/sustainability" },
  { key: "contact", path: "/contact" },
];

/** Every localized route, for the sitemap and hreflang alternates. */
export const ROUTES = ["", "/about", "/facilities", "/products", "/quality", "/sustainability", "/contact", "/site-model"] as const;
export type RoutePath = (typeof ROUTES)[number];

export type ProductSlug = "vdo" | "lvgo" | "hvgo" | "bitumen";

/**
 * Product photos are refinery site photos, not product photography.
 * Order matches `products.items` in the content files. Bitumen carries one
 * photo per grade, matching `products.grades`.
 */
export const PRODUCTS: ReadonlyArray<{ slug: ProductSlug; image: string; gradeImages?: readonly string[] }> = [
  { slug: "vdo", image: "/images/skid-night.jpg" },
  { slug: "lvgo", image: "/images/heat-exchangers.jpg" },
  { slug: "hvgo", image: "/images/aerial-night-a.jpg" },
  { slug: "bitumen", image: "/images/bitumen-drum-filling.jpg", gradeImages: ["/images/drum-yard-aerial.jpg", "/images/loading-forklift.jpg"] },
];

export const IMAGES = {
  hero: "/images/hero-film-poster.jpg",
  heroVideo: "/video/gor-film.mp4",
  storage: "/images/product-storage-tanks.jpg",
  contact: "/images/tanker-truck-centered.jpg",
  about: "/images/about-entrance-sign.jpg",
  modelFallback: "/images/site-model-fallback.jpg",
  logo: "/logos/gor-logo.svg",
} as const;
