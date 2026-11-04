import type { Dictionary } from "@/lib/i18n";
import { IMAGES } from "@/lib/site";

/**
 * GOR ↔ parent company relationship. Both original logos are shown unaltered,
 * side by side in equal tiles (never merged). Wording is the approved text.
 */
export function ParentBrand({ common, titleId }: { common: Dictionary["common"]; titleId?: string }) {
  return (
    <div className="card reveal flex flex-wrap items-center gap-8 p-6 min-[900px]:gap-12 min-[900px]:p-10">
      <div role="group" aria-label={common.parentLogosAria} className="flex w-full min-w-0 items-stretch gap-3 min-[560px]:w-auto min-[560px]:flex-[0_0_auto] min-[560px]:gap-4">
        <div className="flex h-[150px] min-w-0 flex-1 items-center justify-center rounded-2xl bg-bg-alt p-5 min-[560px]:h-[190px] min-[560px]:w-[190px] min-[560px]:flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- original SVG, rendered unaltered */}
          <img src={IMAGES.logo} alt={common.gorLogoAlt} width={76} height={120} className="block h-[104px] w-auto max-w-full object-contain min-[560px]:h-[128px]" />
        </div>
        <div className="flex h-[150px] min-w-0 flex-1 items-center justify-center rounded-2xl bg-bg-alt p-5 min-[560px]:h-[190px] min-[560px]:w-[190px] min-[560px]:flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- original SVG, rendered unaltered */}
          <img src={IMAGES.parentLogo} alt={common.parentLogoAlt} width={112} height={104} className="block h-auto w-full max-w-[112px] object-contain min-[560px]:max-w-[132px]" />
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
        <p id={titleId} className="m-0 text-[22px] font-bold leading-[1.4] min-[900px]:text-[26px]">
          {common.parentLine}
        </p>
        <p className="m-0 text-base leading-[1.75] text-muted">{common.parentIdentity}</p>
      </div>
    </div>
  );
}
