"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LANG_STORAGE_KEY, localePath, otherLocale, switchLocalePath, type Dictionary, type Locale } from "@/lib/i18n";
import { IMAGES, NAV_ITEMS } from "@/lib/site";
import { OilBurger } from "@/components/nav/OilBurger";
import { OilUnderline } from "@/components/nav/OilUnderline";

interface SiteHeaderProps {
  locale: Locale;
  t: Dictionary["common"];
}

interface HeaderBarProps extends SiteHeaderProps {
  /** null while the route is not yet known (static shell): no current-page marker. */
  pathname: string | null;
}

function isCurrent(pathname: string, href: string, isHome: boolean): boolean {
  return isHome ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Reads the current route, so the nav can mark the current page and the language switch keeps it. */
export function SiteHeader({ locale, t }: SiteHeaderProps) {
  return <HeaderBar locale={locale} t={t} pathname={usePathname()} />;
}

export function HeaderBar({ locale, t, pathname: current }: HeaderBarProps) {
  const pathname = current ?? localePath(locale);
  const [open, setOpen] = useState(false);
  const target = otherLocale(locale);

  // Close the mobile menu whenever the route changes or Escape is pressed.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = NAV_ITEMS.map((item) => {
    const href = localePath(locale, item.path);
    return { ...item, href, current: current !== null && isCurrent(pathname, href, item.key === "home") };
  });

  const rememberLang = () => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, target);
    } catch {
      // Storage can be unavailable (private mode); the URL still carries the language.
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="flex items-center justify-between gap-4 px-5 py-3 min-[900px]:px-10 min-[900px]:py-3.5">
        <Link href={localePath(locale)} aria-label={t.homeAria} className="-m-2.5 flex shrink-0 items-center p-2.5">
          <Image src={IMAGES.logo} alt="" width={24} height={39} preload unoptimized className="block h-[39px] w-6" />
        </Link>

        <nav aria-label={t.navAria} className="relative hidden items-center gap-[22px] min-[1080px]:flex">
          {links.map((l) => (
            <Link key={l.key} href={l.href} className="navlink" aria-current={l.current ? "page" : undefined}>
              {t.nav[l.key]}
            </Link>
          ))}
          <OilUnderline activeIndex={links.findIndex((l) => l.current)} locale={locale} />
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href={switchLocalePath(pathname, target)}
            onClick={rememberLang}
            hrefLang={target}
            lang={target}
            aria-label={t.langAria}
            className="btn btn-outline min-h-10 px-3.5 text-sm font-medium"
          >
            {t.otherLang}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.menuClose : t.menu}
            className="btn btn-outline min-h-10 w-11 px-0 min-[1080px]:hidden"
          >
            <OilBurger open={open} />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label={t.navAria}
          className="flex flex-col border-t border-border bg-surface px-5 pb-4 pt-2 [animation:fade-in_.2s_ease_both] min-[1080px]:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              className="border-b border-bg-alt px-1 py-3.5 text-base text-ink no-underline last:border-b-0 aria-[current=page]:font-semibold aria-[current=page]:text-accent-text"
            >
              {t.nav[l.key]}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
