import Image from "next/image";
import type { Dictionary } from "@/lib/i18n";
import { HeroVideo } from "./HeroVideo";
import { IMAGES } from "@/lib/site";

export function Hero({ t, parentLine }: { t: Dictionary["home"]; parentLine: string }) {
  const facts = [
    [t.factLocLabel, t.factLoc],
    [t.factCapLabel, t.factCap],
    [t.factVduLabel, t.factVdu],
  ] as const;

  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden bg-night">
      <Image src={IMAGES.hero} alt="" fill preload sizes="100vw" className="object-cover" quality={75} />
      <HeroVideo />
      <div aria-hidden className="absolute inset-0 bg-night/45" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(16_24_32/0.15)_0%,rgb(16_24_32/0.55)_100%)]" />

      <div className="wrap relative pb-24 pt-24 min-[900px]:pt-[120px]">
        <div className="mx-auto flex max-w-site flex-col gap-[26px]">
          <h1
            id="hero-title"
            className="hero-title m-0 max-w-[940px] text-[40px] font-bold leading-[1.02] tracking-[-1.5px] text-white [text-wrap:balance] [animation:pop-up_.8s_cubic-bezier(.2,.8,.2,1)_both] min-[900px]:text-[68px]"
          >
            {t.heroTitle}
          </h1>
          <p className="m-0 max-w-[600px] text-lg leading-[1.7] text-border [animation:pop-up_.8s_.12s_cubic-bezier(.2,.8,.2,1)_both]">
            {t.heroSub}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-3 [animation:pop-up_.8s_.24s_cubic-bezier(.2,.8,.2,1)_both]">
            <a href="#explore" className="btn btn-amber">
              {t.ctaExplore}
            </a>
            <a href="#products" className="btn btn-ghost-light">
              {t.ctaProducts}
            </a>
          </div>
          <dl className="mb-0 mt-[26px] grid max-w-[900px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] border-t border-white/20">
            {facts.map(([label, value]) => (
              <div key={label} className="pe-5 pt-[18px]">
                <dt className="text-[13px] text-border-strong">{label}</dt>
                <dd className="m-0 mt-1.5 text-[22px] font-semibold text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 mt-2 text-[13px] text-border-strong">{parentLine}</p>
        </div>
      </div>

      <a
        href="#film"
        aria-label={t.scrollAria}
        className="absolute bottom-[18px] left-1/2 flex h-14 w-11 -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] text-border no-underline"
      >
        <span>{t.scroll}</span>
        <span aria-hidden className="relative h-7 w-px overflow-hidden bg-white/30">
          <span className="absolute left-0 top-0 h-3 w-px animate-cue bg-amber" />
        </span>
      </a>
    </section>
  );
}
