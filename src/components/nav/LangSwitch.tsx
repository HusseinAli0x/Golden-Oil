"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { LANG_STORAGE_KEY, LOCALES, localePath, switchLocalePath, type Locale } from "@/lib/i18n";

const NAMES: Record<Locale, string> = { en: "English", ar: "العربية" };

interface LangSwitchProps {
  locale: Locale;
  /** Accessible name of the group, e.g. "Language". */
  label: string;
  /** Accessible name of the link to the other language, e.g. "Switch to Arabic". */
  switchAria: string;
  /** "light" on pale surfaces (mobile menu), "dark" on the navy footer. */
  tone?: "light" | "dark";
  onSwitch?: () => void;
  className?: string;
  /** Current route; null while unknown (static shell), then the links point at each language's home. */
  pathname: string | null;
}

/**
 * Two-segment language selector: both languages always shown, the current one filled.
 * The other segment is a real link to the same page in that language, and the choice is
 * remembered for the next visit (see <LangMemory>).
 */
export function LangSwitch({ locale, label, switchAria, tone = "light", onSwitch, className = "", pathname }: LangSwitchProps) {
  const remember = (to: Locale) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, to);
    } catch {
      // Storage can be unavailable (private mode); the URL still carries the language.
    }
    onSwitch?.();
  };

  return (
    <div role="group" aria-label={label} className={`ls ls-${tone} ${className}`}>
      <Globe size={16} strokeWidth={2} aria-hidden className="ls-globe" />
      {LOCALES.map((l) =>
        l === locale ? (
          <span key={l} lang={l} aria-current="true" className="ls-seg ls-on">
            {NAMES[l]}
          </span>
        ) : (
          <Link key={l} href={pathname ? switchLocalePath(pathname, l) : localePath(l)} hrefLang={l} lang={l} aria-label={switchAria} onClick={() => remember(l)} className="ls-seg">
            {NAMES[l]}
          </Link>
        ),
      )}
    </div>
  );
}

/** Reads the current route itself; render inside <Suspense> (fallback: <LangSwitch pathname={null}>). */
export function LiveLangSwitch(props: Omit<LangSwitchProps, "pathname">) {
  return <LangSwitch {...props} pathname={usePathname()} />;
}
