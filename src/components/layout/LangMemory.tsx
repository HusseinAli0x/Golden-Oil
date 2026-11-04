"use client";

import { useEffect } from "react";
import { LANG_STORAGE_KEY, type Locale } from "@/lib/i18n";

/** Remembers the language of the page being read, so the intro opens the same language next time. */
export function LangMemory({ locale }: { locale: Locale }) {
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, locale);
    } catch {
      // Storage unavailable — nothing to remember.
    }
  }, [locale]);
  return null;
}
