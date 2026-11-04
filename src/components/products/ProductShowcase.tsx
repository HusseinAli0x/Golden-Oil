"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, X, ZoomIn } from "lucide-react";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { Modal } from "@/components/ui/Modal";
import type { Dictionary } from "@/lib/i18n";
import { PRODUCTS } from "@/lib/site";

interface ProductShowcaseProps {
  t: Dictionary["products"];
  common: Dictionary["common"];
}

const closeBtn =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-ink shadow-[0_4px_14px_rgb(16_24_32/0.25)] transition-transform hover:scale-105 focus-visible:outline-primary";

const EASE = "ease-[cubic-bezier(.2,.7,.2,1)]";

/** Large product cards → large details panel → full-size photo viewer. */
export function ProductShowcase({ t, common }: ProductShowcaseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [zoomSrc, setZoomSrc] = useState<{ src: string; alt: string } | null>(null);
  const item = selected === null ? null : t.items[selected];
  const meta = selected === null ? null : PRODUCTS[selected];
  const isBitumen = meta?.slug === "bitumen";

  return (
    <>
      <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 min-[760px]:grid-cols-2">
        {PRODUCTS.map((p, i) => {
          const it = t.items[i];
          return (
            <li key={p.slug} id={p.slug} className="reveal scroll-mt-24">
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-haspopup="dialog"
                aria-label={`${t.viewDetails}: ${it.name}`}
                className={`group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-0 text-start font-[inherit] text-ink shadow-[0_1px_2px_rgb(16_24_32/0.04)] transition-[transform,box-shadow,border-color] duration-300 ${EASE} hover:-translate-y-1 hover:border-amber hover:shadow-[0_22px_44px_rgb(15_57_73/0.16)] focus-visible:-outline-offset-2`}
              >
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-dark">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(min-width: 1240px) 600px, (min-width: 760px) 50vw, 100vw"
                    className={`object-cover transition-transform duration-700 ${EASE} group-hover:scale-[1.06]`}
                  />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgb(15_57_73/0.55)_0%,transparent_55%)]" />
                  <span dir="ltr" className="absolute bottom-5 start-6 text-[clamp(36px,2.4vw+28px,52px)] font-bold leading-none text-white">
                    {it.code}
                  </span>
                </span>
                <span className="flex flex-1 flex-col gap-3 px-7 pb-7 pt-6">
                  <span className="text-title font-semibold leading-snug">{it.name}</span>
                  <span className="text-base leading-[1.7] text-ink-soft">{it.intro}</span>
                  {p.gradeImages && (
                    <span className="flex flex-wrap gap-2.5" dir="ltr">
                      {t.grades.map((g) => (
                        <span key={g.code} className="inline-flex min-h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white">
                          {g.code}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="mt-auto inline-flex items-center gap-2 pt-2 text-[15px] font-semibold text-primary">
                    {t.viewDetails}
                    <ArrowRight size={17} strokeWidth={2.2} aria-hidden className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Modal
        open={item !== null && zoomSrc === null}
        onClose={() => setSelected(null)}
        labelledBy="pm-title"
        className="w-[min(1240px,calc(100%-24px))]"
      >
        {item && meta && (
          <div className="relative max-h-[calc(100dvh-24px)] overflow-auto rounded-[22px] bg-surface shadow-[0_30px_70px_rgb(16_24_32/0.4)]">
            <button type="button" onClick={() => setSelected(null)} aria-label={t.close} autoFocus className={`${closeBtn} fixed end-5 top-5 z-10 min-[1264px]:absolute`}>
              <X size={22} strokeWidth={2.2} aria-hidden />
            </button>
            <div className="flex flex-wrap">
              <button
                type="button"
                onClick={() => setZoomSrc({ src: meta.image, alt: item.alt })}
                aria-label={t.zoom}
                className="group relative block min-h-[280px] min-w-0 flex-[1_1_480px] cursor-zoom-in overflow-hidden border-0 bg-dark p-0 focus-visible:-outline-offset-[3px] focus-visible:outline-amber min-[900px]:min-h-[520px]"
              >
                <Image src={meta.image} alt={item.alt} fill sizes="(min-width: 1240px) 620px, 100vw" className={`object-cover transition-transform duration-700 ${EASE} group-hover:scale-[1.03]`} />
                <span aria-hidden className="absolute bottom-4 end-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-primary">
                  <ZoomIn size={20} />
                </span>
              </button>
              <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-5 px-6 pb-8 pt-8 min-[900px]:px-12 min-[900px]:pb-12 min-[900px]:pt-14">
                <h2 id="pm-title" className="m-0 flex flex-col gap-1.5">
                  <span dir="ltr" className="text-[clamp(36px,3vw+26px,56px)] font-bold leading-none text-primary">
                    {item.code}
                  </span>
                  {item.name !== item.code && <span className="text-xl font-semibold text-ink-soft">{item.name}</span>}
                </h2>
                <p className="m-0 text-lead text-ink-soft">{item.intro}</p>
                <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-y border-border py-5 text-base leading-relaxed">
                  <dt className="font-semibold text-muted">{t.originL}</dt>
                  <dd className="m-0 text-ink">{item.origin}</dd>
                  <dt className="font-semibold text-muted">{t.supplyL}</dt>
                  <dd className="m-0 text-ink">{t.supplyText}</dd>
                </dl>
                <div className="flex flex-col gap-3">
                  <p className="m-0 text-base font-semibold">{t.order}</p>
                  <ContactButtons common={common} subject={`${t.mailSubject} ${item.code}`} compact />
                </div>
              </div>
            </div>

            {isBitumen && meta.gradeImages && (
              <div className="border-t border-border bg-bg-alt px-6 pb-8 pt-7 min-[900px]:px-12 min-[900px]:pb-12">
                <h3 className="m-0 mb-5 text-xl font-bold">{t.gradesTitle}</h3>
                <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 min-[700px]:grid-cols-2">
                  {t.grades.map((g, gi) => (
                    <li key={g.code} className="overflow-hidden rounded-2xl border border-border bg-surface">
                      <button
                        type="button"
                        onClick={() => setZoomSrc({ src: meta.gradeImages![gi], alt: g.alt })}
                        aria-label={`${t.zoom}: ${g.code}`}
                        className="group relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden border-0 bg-dark p-0"
                      >
                        <Image src={meta.gradeImages![gi]} alt={g.alt} fill sizes="(min-width: 1240px) 560px, (min-width: 700px) 50vw, 100vw" className={`object-cover transition-transform duration-700 ${EASE} group-hover:scale-[1.05]`} />
                        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgb(15_57_73/0.7)_0%,transparent_55%)]" />
                        <span dir="ltr" className="absolute bottom-4 start-5 text-[clamp(26px,1.2vw+22px,30px)] font-bold leading-none text-white">
                          {g.code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={zoomSrc !== null} onClose={() => setZoomSrc(null)} label={zoomSrc?.alt} className="h-dvh max-h-none w-screen max-w-none">
        {zoomSrc && (
          <div className="relative flex h-full w-full cursor-zoom-out items-center justify-center bg-[rgb(10_14_18/0.94)] px-5 pb-5 pt-16" onClick={() => setZoomSrc(null)}>
            <Image src={zoomSrc.src} alt={zoomSrc.alt} width={1600} height={900} sizes="100vw" className="h-auto max-h-full w-auto max-w-full rounded-[10px] object-contain" />
            <button type="button" onClick={() => setZoomSrc(null)} aria-label={t.zoomClose} autoFocus className={`${closeBtn} fixed end-[18px] top-[18px]`}>
              <X size={22} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
