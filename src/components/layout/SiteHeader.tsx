"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { IMAGES, NAV_ITEMS } from "@/lib/site";
import { OilBar } from "@/components/nav/OilBar";
import { PipeBurger } from "@/components/nav/PipeBurger";
import { LangSwitch } from "@/components/nav/LangSwitch";
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

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  // Close the mobile menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  /** Close; `refocus` returns focus to the menu button (Escape, outside tap). */
  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  // While open: lock page scroll, move focus into the menu, keep Tab inside button + menu,
  // close on Escape.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
    // Keep the scrollbar's space reserved (on the correct side in RTL too) so nothing jumps.
    if (window.innerWidth > html.clientWidth) html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";

    const focusables = () => [buttonRef.current, ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href], button") ?? [])].filter((el): el is HTMLElement => !!el && el.getClientRects().length > 0); // skip links hidden on desktop
    const raf = requestAnimationFrame(() => focusables()[1]?.focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      } else if (e.key === "Tab") {
        const els = focusables();
        const i = els.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          els[els.length - 1]?.focus();
        } else if (!e.shiftKey && (i === els.length - 1 || i === -1)) {
          e.preventDefault();
          els[0]?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev.overflow;
      html.style.scrollbarGutter = prev.gutter;
    };
  }, [open, close]);

  const links = NAV_ITEMS.map((item) => {
    const href = localePath(locale, item.path);
    return { ...item, href, current: current !== null && isCurrent(pathname, href, item.key === "home") };
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3 min-[900px]:px-10 min-[900px]:py-3.5">
        <Link href={localePath(locale)} aria-label={t.homeAria} className="-m-2.5 flex shrink-0 items-center justify-self-start p-2.5">
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

        <div className="col-start-3 justify-self-end">
          <PipeBurger ref={buttonRef} open={open} onToggle={() => setOpen((v) => !v)} label={open ? t.menuClose : t.menu} controls="mobile-menu" />
        </div>
      </div>

      {/* Outside tap closes. Absolute, not fixed: the header's backdrop-filter is the containing block. */}
      <div aria-hidden className="mm-scrim" data-open={open ? "" : undefined} onClick={() => close(true)} />

      <nav id="mobile-menu" ref={menuRef} aria-label={t.navAria} className="mm" data-open={open ? "" : undefined} inert={!open}>
        <div className="mm-sheet">
          <ul className="m-0 flex list-none flex-col p-0 min-[1080px]:hidden">
            {links.map((l, i) => (
              <li key={l.key} className="mm-item" style={{ "--i": i } as CSSProperties}>
                <Link href={l.href} aria-current={l.current ? "page" : undefined} className="mm-link" onClick={() => close(false)}>
                  <span className="relative">
                    {t.nav[l.key]}
                    {l.current && <OilBar />}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mm-item mm-foot" style={{ "--i": links.length } as CSSProperties}>
            <LangSwitch locale={locale} pathname={current} label={t.langLabel} switchAria={t.langAria} onSwitch={() => close(false)} className="w-full justify-center" />
          </div>
          {/* Oil lip along the poured edge, with one droplet that falls as it settles. */}
          <span aria-hidden className="mm-lip">
            <span className="mm-drop" />
          </span>
        </div>
      </nav>
    </header>
  );
}
