import type { Dictionary } from "@/lib/i18n";
import { PumpJack } from "./PumpJack";
import { TruckProgress } from "./TruckProgress";

/** Loading state: pump jack filling a tank + tanker-truck progress bar. */
export function LoadingScreen({ t, compact = false }: { t: Dictionary["loading"]; compact?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t.label}
      className={`flex flex-col items-center justify-center gap-7 px-5 py-12 ${compact ? "min-h-[60vh]" : "min-h-[calc(100svh-66px)]"}`}
    >
      <PumpJack variant="loading" className="max-w-[520px]" />
      <div className="flex flex-col items-center gap-3.5">
        <div className="text-[22px] font-semibold">
          {t.label}
          <span className="ld-dot">.</span>
          <span className="ld-dot">.</span>
          <span className="ld-dot">.</span>
        </div>
        <TruckProgress />
        <span className="text-[13px] text-muted">{t.brand}</span>
      </div>
    </div>
  );
}
