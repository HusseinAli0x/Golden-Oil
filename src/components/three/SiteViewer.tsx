"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { IMAGES } from "@/lib/site";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { ModelToolbar } from "./ModelToolbar";
import type { SiteApi } from "./SiteCanvas";
import { useSiteModel } from "./useSiteModel";
import { CAMERA_VIEWS, HOME_VIEW, type ViewId } from "./views";

const SiteCanvas = dynamic(() => import("./SiteCanvas"), { ssr: false });

const panel = "rounded-2xl border border-white/10 bg-dark/90 backdrop-blur-sm";

/** Full-screen 3D site viewer with camera presets and day/night (design/Site3D.dc.html). */
export function SiteViewer({ t }: { t: Dictionary["model3d"] }) {
  const stage = useRef<HTMLDivElement>(null);
  const api = useRef<SiteApi>(null);
  const [auto, setAuto] = useState(true);
  const [night, setNight] = useState(false);
  const [view, setView] = useState<ViewId | null>("overview");
  const { status, font, active, onReady, onError } = useSiteModel(stage, { lazy: false });
  const ready = status === "ready";

  const goView = (id: ViewId) => {
    const v = CAMERA_VIEWS.find((c) => c.id === id) ?? HOME_VIEW;
    api.current?.flyTo(v);
    if (id !== "overview") setAuto(false);
    setView(id);
  };

  return (
    <div ref={stage} className="relative h-[calc(100svh-66px)] min-h-[560px] overflow-hidden bg-dark text-bg">
      {(status === "loading" || ready) && (
        <ModelErrorBoundary fallback={null} onError={onError}>
          <SiteCanvas
            apiRef={api}
            interactive="viewer"
            autoRotate={auto}
            night={night}
            active={active}
            arabicFont={font}
            onUserMove={() => setView(null)}
            onReady={onReady}
          />
        </ModelErrorBoundary>
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <Image src={IMAGES.modelFallback} alt={t.fallbackAlt} fill sizes="100vw" preload className="object-cover opacity-40" />
          <p className="relative m-0 max-w-[420px] text-[15px] text-white">{status === "nogl" ? t.noGl : t.loading}</p>
        </div>
      )}

      <div className={`${panel} absolute start-5 top-5 flex max-w-[min(360px,calc(100%-40px))] flex-col gap-1.5 px-[18px] py-4`}>
        <h1 className="m-0 text-lg font-bold text-white">{t.viewerTitle}</h1>
        <p className="m-0 text-xs text-[#A9B2BD]">{t.viewerSub}</p>
      </div>

      {ready && (
        <>
          <div
            role="group"
            aria-label={t.viewsAria}
            className="absolute inset-x-5 top-[104px] flex gap-2 overflow-x-auto pb-1 min-[900px]:start-auto min-[900px]:top-5 min-[900px]:max-w-[60%] min-[900px]:flex-wrap min-[900px]:justify-end"
          >
            {CAMERA_VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => goView(v.id)}
                aria-pressed={view === v.id}
                className="min-h-[38px] shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-white/20 bg-dark/80 px-3.5 text-[13px] font-medium text-bg transition-colors hover:border-white/40 focus-visible:outline-amber aria-pressed:border-bg aria-pressed:bg-bg aria-pressed:text-ink"
              >
                {t.views[v.id]}
              </button>
            ))}
          </div>

          <div className={`${panel} absolute bottom-5 start-5 hidden flex-col gap-2 px-4 py-3 text-xs text-border-strong min-[760px]:flex`}>
            {(
              [
                [t.help.rotate, t.help.rotateHow],
                [t.help.pan, t.help.panHow],
                [t.help.zoom, t.help.zoomHow],
                [t.help.move, t.help.moveHow],
              ] as const
            ).map(([k, v]) => (
              <span key={k}>
                <b className="text-white">{k}</b> — {v}
              </span>
            ))}
          </div>

          <ModelToolbar
            t={t}
            className="absolute bottom-5 end-5"
            autoRotate={auto}
            night={night}
            onZoomIn={() => api.current?.zoomBy(0.72)}
            onZoomOut={() => api.current?.zoomBy(1.38)}
            onReset={() => goView("overview")}
            onToggleAuto={() => setAuto((a) => !a)}
            onToggleNight={() => setNight((n) => !n)}
          />
        </>
      )}
    </div>
  );
}
