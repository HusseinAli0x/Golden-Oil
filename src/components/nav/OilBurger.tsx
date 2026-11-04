import { useId } from "react";

/**
 * Menu icon drawn as three glossy fuel bars, in the same liquid style as the nav's
 * <OilUnderline>: navy oil (gold on hover), a white specular highlight and a faint
 * petroleum iridescence. Opening pulls the outer bars to the centre where the goo
 * filter fuses them into an X, while the middle bar draws in and drips away.
 * Pure CSS transitions (see `.ob` in globals.css); reduced motion simply swaps state.
 */
export function OilBurger({ open }: { open: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const goo = `ob-goo-${id}`;
  const hl = `ob-hl-${id}`;
  const ir = `ob-ir-${id}`;

  const bars = [
    ["ob-top", 4.5],
    ["ob-mid", 10.5],
    ["ob-bot", 16.5],
  ] as const;

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden focusable="false" className="ob" data-open={open ? "" : undefined}>
      <defs>
        <filter id={goo} filterUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="30" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feGaussianBlur in="goo" stdDeviation="1.1" result="sblur" />
          <feOffset in="sblur" dy="1" result="soff" />
          <feColorMatrix in="soff" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.2 0" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="goo" />
          </feMerge>
        </filter>
        <linearGradient id={hl} gradientUnits="userSpaceOnUse" x1="3" x2="21" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.62" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.24" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ir} gradientUnits="userSpaceOnUse" x1="3" x2="21" y1="0" y2="0">
          <stop offset="0" stopColor="#6B4BB3" />
          <stop offset="0.5" stopColor="#2A8F9A" />
          <stop offset="1" stopColor="#C9A24A" />
        </linearGradient>
      </defs>

      {/* Oil bodies (fused by the goo filter) */}
      <g filter={`url(#${goo})`} className="ob-fill">
        {bars.map(([cls, y]) => (
          <rect key={cls} className={`ob-bar ${cls}`} x="3" y={y} width="18" height="3" rx="1.5" />
        ))}
        <circle className="ob-drop" cx="12" cy="12" r="1.7" />
      </g>

      {/* Gloss overlays, moving with their bars */}
      {bars.map(([cls, y]) => (
        <g key={cls} className={`ob-bar ob-gloss ${cls}`}>
          <path d={`M4.4 ${y + 2.55}H19.6`} stroke={`url(#${ir})`} strokeWidth="0.5" strokeOpacity="0.55" strokeLinecap="round" />
          <path d={`M4.4 ${y + 0.75}H19.6`} stroke={`url(#${hl})`} strokeWidth="0.6" strokeLinecap="round" />
          <path className="ob-sheen" d={`M4.4 ${y + 0.75}H19.6`} stroke="#fff" strokeWidth="0.7" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
