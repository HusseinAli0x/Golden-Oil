"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { VDU_AR, VDU_FRAMES, VDU_LABELS } from "./vdu-data";

/**
 * Vacuum Distillation Unit — cinematic scroll section (design/Technology.dc.html).
 * The 3D scene is the design's own three.js r147 (UMD) script, served from /public/vdu
 * and loaded only when the section nears the viewport. Without WebGL it scrubs
 * pre-rendered frames instead. The text panels are real HTML, so content stays
 * readable and indexable without the canvas.
 */

interface VduApi {
  dispose?: () => void;
  setLang?: (l: Locale) => void;
}
type VduFactory = (opts: {
  root: HTMLElement;
  frames: readonly string[];
  labels: typeof VDU_LABELS;
  ar: Record<string, string>;
  lang: Locale;
}) => VduApi;

declare global {
  interface Window {
    GORVDU?: VduFactory;
  }
}

const SCRIPTS = ["/vdu/three.r147.min.js", "/vdu/postprocessing.js", "/vdu/vdu-scene.js"];
let loading: Promise<void> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-vdu="${src}"]`);
    if (existing?.dataset.loaded) return resolve();
    const s = existing ?? document.createElement("script");
    s.addEventListener("load", () => {
      s.dataset.loaded = "1";
      resolve();
    });
    s.addEventListener("error", () => reject(new Error(src)));
    if (!existing) {
      s.src = src;
      s.async = false;
      s.dataset.vdu = src;
      document.head.appendChild(s);
    }
  });
}

/** Loads the scripts in order, once per page view. */
function loadVdu(): Promise<void> {
  if (window.GORVDU) return Promise.resolve();
  loading ??= SCRIPTS.reduce((p, src) => p.then(() => loadScript(src)), Promise.resolve()).catch((e) => {
    loading = null;
    throw e;
  });
  return loading;
}

const c = (color: string) => ({ "--c": color }) as CSSProperties;

export function VacuumSection({ t, locale }: { t: Dictionary["vacuum"]; locale: Locale }) {
  const rootRef = useRef<HTMLElement>(null);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const prod = (slug: string) => `${localePath(locale, "/products")}#${slug}`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let api: VduApi | null = null;
    let dead = false;

    const start = () => {
      loadVdu()
        .then(() => {
          if (dead || !window.GORVDU) return;
          api = window.GORVDU({ root, frames: VDU_FRAMES, labels: VDU_LABELS, ar: VDU_AR, lang: locale });
        })
        .catch(() => root.classList.add("vdu-static"));
    };

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (es) => {
          if (es[es.length - 1].isIntersecting) {
            io?.disconnect();
            start();
          }
        },
        { rootMargin: "600px 0px" },
      );
      io.observe(root);
    } else start();

    // While the scene fills the screen, flag it so fixed UI (back-to-top) can step aside on phones.
    const html = document.documentElement;
    const onScroll = () => {
      const r = root.getBoundingClientRect();
      html.classList.toggle("vdu-in-view", r.top <= 1 && r.bottom >= window.innerHeight - 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      dead = true;
      io?.disconnect();
      api?.dispose?.();
      window.removeEventListener("scroll", onScroll);
      html.classList.remove("vdu-in-view");
    };
  }, [locale]);

  const products: Array<[string, string, string]> = [
    ["vdo", "#4FB3A5", "VDO"],
    ["lvgo", "#F2B544", "LVGO"],
    ["hvgo", "#E07B2A", "HVGO"],
    ["bitumen", "#A83A5C", "VR / Bitumen"],
  ];

  const rail: Array<[number, string]> = [
    [0, t.s1b],
    [0.12, t.s2],
    [0.27, t.s3],
    [0.5, "LVGO"],
    [0.61, "HVGO"],
    [0.71, t.resN],
    [0.84, t.s5],
  ];

  return (
    <section id="vacuum" ref={rootRef} className="vdu scroll-mt-0" aria-labelledby="vdu-title">
      <div className="vdu-stage" dir="ltr">
        <canvas className="vdu-gl" aria-hidden />
        <canvas className="vdu-fallback" aria-hidden />
        <div className="vdu-vignette" aria-hidden />
        <div className="vdu-scrim" aria-hidden />

        <article className="vdu-panel vdu-hero" data-scene="s1" dir={dir}>
          <h2 id="vdu-title" className="vdu-h1">
            {t.s1a}
            <span>{t.s1b}</span>
          </h2>
          <p>{t.s1p}</p>
        </article>

        <article className="vdu-panel" data-scene="s2" dir={dir}>
          <h3>{t.s2}</h3>
          <p>{t.s2p}</p>
        </article>

        <article className="vdu-panel" data-scene="s3" dir={dir}>
          <h3>{t.s3}</h3>
          <p>{t.s3p}</p>
          <div className="vdu-legend">
            <span><i style={{ background: "#D8482A" }} />{t.lgFeed}</span>
            <span><i style={{ background: "#FFF1D6" }} />{t.lgVap}</span>
            <span><i style={{ background: "#F2A53A" }} />{t.lgLiq}</span>
            <span><i style={{ background: "#DFE9F5" }} />{t.lgSteam}</span>
          </div>
        </article>

        {(
          [
            ["s4a", "lvgo", "#F2B544", "LVGO", t.lvgoN, t.lvgoP, t.lvgoNote, "#F2B544", "LVGO"],
            ["s4b", "hvgo", "#E07B2A", "HVGO", t.hvgoN, t.hvgoP, t.hvgoNote, "#E07B2A", "HVGO"],
            ["s4c", "bitumen", "#C9567A", t.resCode, t.resN, t.resP, t.resNote, "#C9567A", "VR / Bitumen"],
          ] as const
        ).map(([scene, slug, color, code, name, text, note, more, moreLabel]) => (
          <article key={scene} className="vdu-panel" data-scene={scene} dir={dir}>
            <div className="vdu-prod">
              <a className="code" href={prod(slug)} style={{ color }} dir={code === t.resCode ? undefined : "ltr"}>
                {code}
              </a>
              <a className="name" href={prod(slug)}>
                {name}
              </a>
            </div>
            <p>{text}</p>
            <a className="vdu-more" href={prod(slug)} style={c(more)}>
              {`${t.view} · ${moreLabel}`}
            </a>
            <div className="vdu-note">{note}</div>
          </article>
        ))}

        <article className="vdu-panel" data-scene="s5" dir={dir}>
          <h3>{t.s5}</h3>
          <div className="vdu-legend">
            <span><i style={{ background: "#D8482A" }} />{t.lgFeed}</span>
            <span><i style={{ background: "#F2B544" }} />LVGO</span>
            <span><i style={{ background: "#E07B2A" }} />HVGO</span>
            <span><i style={{ background: "#A83A5C" }} />{t.resN}</span>
            <span><i style={{ background: "#9FC4E8" }} />{t.lgVac}</span>
          </div>
          <div className="vdu-prods">
            <strong>{t.ourProds}</strong>
            {products.map(([slug, color, label]) => (
              <a key={slug} href={prod(slug)} style={c(color)} dir="ltr">
                {label}
              </a>
            ))}
          </div>
          <p>
            {t.s5b} {t.s5p}
          </p>
        </article>

        <a className="tag tag-link" data-label="vdo" href={prod("vdo")} style={c("#4FB3A5")} aria-label={`VDO — ${t.view}`}>
          <span>VDO<b aria-hidden>→</b></span>
          <i />
        </a>
        <a className="tag tag-link alt" data-label="lvgo" href={prod("lvgo")} style={c("#F2B544")} aria-label={`LVGO — ${t.view}`}>
          <span>LVGO<b aria-hidden>→</b></span>
          <i />
        </a>
        <a className="tag tag-link" data-label="hvgo" href={prod("hvgo")} style={c("#E07B2A")} aria-label={`HVGO — ${t.view}`}>
          <span>HVGO<b aria-hidden>→</b></span>
          <i />
        </a>
        <a className="tag tag-link alt" data-label="resid" href={prod("bitumen")} style={c("#A83A5C")} aria-label={`VR / Bitumen — ${t.view}`}>
          <span>VR / Bitumen<b aria-hidden>→</b></span>
          <i />
        </a>
        <div className="tag" data-label="bitumen" style={c("#8C7A6C")} dir={dir}>
          <span>{t.tagBit}</span>
          <i />
        </div>
        <div className="tag" data-label="feed" style={c("#D8482A")} dir={dir}>
          <span>{t.tagFeed}</span>
          <i />
        </div>
        <div className="tag" data-label="vac" style={c("#9FC4E8")} dir={dir}>
          <span>{t.lgVac}</span>
          <i />
        </div>

        <nav className="vdu-rail" aria-label={t.rail}>
          <div className="vdu-rail-fill" />
          {rail.map(([p, label]) => (
            <button key={p} className="rail-dot" data-p={p} style={{ top: `${p * 100}%` }} type="button" aria-label={label} />
          ))}
        </nav>

        <div className="vdu-hint" dir={dir} aria-hidden>
          <span>{t.hint}</span>
          <i />
        </div>
        <div className="vdu-foot" dir={dir}>
          {t.foot}
        </div>
      </div>
    </section>
  );
}
