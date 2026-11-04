"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Maximize } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { IMAGES } from "@/lib/site";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { ModelToolbar } from "./ModelToolbar";
import type { SiteApi } from "./SiteCanvas";
import { useSiteModel } from "./useSiteModel";
import { HOME_VIEW } from "./views";

const SiteCanvas = dynamic(() => import("./SiteCanvas"), { ssr: false });

interface SiteModelEmbedProps {
  t: Dictionary["model3d"];
  viewerHref: string;
  viewerLabel: string;
}

/** Home-page 3D site model: lazy WebGL, tap-to-load on mobile, static image fallback. */
export function SiteModelEmbed({ t, viewerHref, viewerLabel }: SiteModelEmbedProps) {
  const stage = useRef<HTMLElement>(null);
  const api = useRef<SiteApi>(null);
  const [auto, setAuto] = useState(true);
  const { status, font, active, load, onReady, onError } = useSiteModel(stage, { lazy: true });
  const ready = status === "ready";
  const mounted = status === "loading" || status === "ready";

  const fallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-border">
      <Image src={IMAGES.modelFallback} alt={t.fallbackAlt} fill sizes="(min-width: 1240px) 1240px, 100vw" className="object-cover opacity-40" />
      <p className="relative m-0 max-w-[420px] text-[15px] leading-relaxed text-white">
        {status === "nogl" ? t.noGl : status === "tap" ? t.tap : t.loading}
      </p>
      {status === "tap" && (
        <button type="button" onClick={load} className="btn btn-amber relative">
          {t.load}
        </button>
      )}
    </div>
  );

  return (
    <figure
      ref={stage}
      aria-label={t.aria}
      className="relative m-0 h-[440px] overflow-hidden rounded-[20px] bg-dark min-[900px]:h-[620px]"
    >
      {mounted && (
        <ModelErrorBoundary fallback={null} onError={onError}>
          <SiteCanvas
            apiRef={api}
            interactive="embed"
            autoRotate={auto}
            night={false}
            active={active}
            arabicFont={font}
            onReady={onReady}
          />
        </ModelErrorBoundary>
      )}
      {!ready && fallback}

      <figcaption className="pointer-events-none absolute start-[18px] top-3.5 m-0 text-xs text-[#A9B2BD]">{t.label}</figcaption>

      <Link
        href={viewerHref}
        className="absolute end-[18px] top-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-dark/80 px-4 text-[13px] font-medium text-white no-underline backdrop-blur-sm transition-colors hover:border-white/50"
      >
        <Maximize size={16} aria-hidden />
        {viewerLabel}
      </Link>

      {ready && (
        <ModelToolbar
          t={t}
          className="absolute bottom-[18px] end-[18px]"
          autoRotate={auto}
          onZoomIn={() => api.current?.zoomBy(0.72)}
          onZoomOut={() => api.current?.zoomBy(1.38)}
          onReset={() => api.current?.flyTo(HOME_VIEW, 900)}
          onToggleAuto={() => setAuto((a) => !a)}
        />
      )}
    </figure>
  );
}
