"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { INTRO_MARK } from "@/components/animations/intro-paths";
import { DEFAULT_LOCALE, isLocale, LANG_STORAGE_KEY, type Locale } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/scroll-progress";

const SEEN_KEY = "gor-intro-seen";
const GOLD = "#D4A72C";

const noopSubscribe = () => () => {};

function preferredLocale(): Locale {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage blocked — fall through to the browser language.
  }
  return navigator.languages?.some((l) => l.toLowerCase().startsWith("ar")) ? "ar" : DEFAULT_LOCALE;
}

/**
 * Site entry (DESIGN-SPEC §5 Intro): the Golden Network Holding mark fades in,
 * the names reveal, then the intro fades and opens Home (about 2.7 s in total).
 * Shown once per session; this is the only place the holding logo appears.
 */
export function IntroAnimation() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const target = useSyncExternalStore(noopSubscribe, preferredLocale, () => DEFAULT_LOCALE);
  const [leaving, setLeaving] = useState(false);
  const left = useRef(false);

  const go = useCallback(
    (locale: Locale) => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Ignore: the intro will simply show again next time.
      }
      router.replace(`/${locale}`);
    },
    [router],
  );

  useEffect(() => {
    const locale = preferredLocale();
    router.prefetch(`/${locale}`);
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return go(locale);

    const reduce = prefersReducedMotion();
    rootRef.current?.classList.add("play");
    const leaveT = window.setTimeout(
      () => {
        if (left.current) return;
        left.current = true;
        setLeaving(true);
      },
      reduce ? 900 : 2300,
    );
    return () => window.clearTimeout(leaveT);
  }, [go, router]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => go(target), prefersReducedMotion() ? 0 : 400);
    return () => window.clearTimeout(t);
  }, [leaving, go, target]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-9 overflow-hidden bg-bg px-5 py-12 text-ink">
      <Link
        href={`/${target}`}
        onClick={(e) => {
          e.preventDefault();
          left.current = true;
          go(target);
        }}
        className="fixed end-6 top-[22px] z-10 inline-flex min-h-10 items-center rounded-full border border-ink/20 bg-white/70 px-[18px] text-sm font-medium text-ink no-underline hover:border-ink/45"
        lang={target}
      >
        {target === "ar" ? "تخطي" : "Skip"}
      </Link>

      <div ref={rootRef} className={`intro-root flex flex-col items-center gap-9 ${leaving ? "leaving" : ""}`}>
        <div className="lg-wrap relative flex items-center justify-center">
          <div
            aria-hidden
            className="lg-glow absolute h-[120%] w-[120%] rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(212,167,44,0.35), rgba(0,0,0,0))" }}
          />
          <svg viewBox="0 0 502 468" role="img" aria-label="Golden Network Holding logo" className="intro-logo relative block h-auto w-[200px] overflow-visible min-[720px]:w-[300px]">
            <path className="lg-final" fill={GOLD} fillRule="evenodd" d={INTRO_MARK} />
          </svg>
        </div>

        <div className="flex max-w-[900px] flex-col items-center gap-3.5 text-center">
          <h1 className="tx-ar m-0 font-arabic text-[38px] font-bold leading-[1.2] min-[720px]:text-[64px]" lang="ar" dir="rtl">
            الشبكة الذهبية القابضة
          </h1>
          <div aria-hidden className="tx-line h-0.5 w-[140px] rounded-sm" style={{ background: GOLD }} />
          <div className="tx-en text-[17px] font-semibold uppercase tracking-[0.22em] min-[720px]:text-[26px]" style={{ color: GOLD }} lang="en">
            Golden Network Holding
          </div>
          <p className="tx-sub1 m-0 mt-1.5 font-arabic text-[15px] font-medium leading-relaxed text-muted min-[720px]:text-xl" lang="ar" dir="rtl">
            للتجارة والمقاولات والاستثمارات العقارية والخدمات العامة المحدودة
          </p>
          <p className="tx-sub2 m-0 text-sm leading-relaxed tracking-[0.04em] text-muted" lang="en">
            Trading, Contracting, Real Estate Investments &amp; General Services Ltd.
          </p>
        </div>
      </div>

      <nav aria-label="Language" className="sr-only">
        <Link href="/en">Golden Oil Refinery — English</Link>
        <Link href="/ar" lang="ar">
          مصفاة النفط الذهبي — العربية
        </Link>
      </nav>
    </div>
  );
}
