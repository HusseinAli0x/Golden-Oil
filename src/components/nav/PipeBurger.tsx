import { useId, type Ref } from "react";

interface PipeBurgerProps {
  open: boolean;
  onToggle: () => void;
  label: string;
  controls: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Menu button drawn as three refinery pipelines (crude, gasoline, diesel). Opening
 * swings the outer pipes into an X while the middle line drains away and the flow
 * speeds up; closing reverses it. CSS transitions only — see `.pb` in globals.css.
 */
export function PipeBurger({ open, onToggle, label, controls, ref }: PipeBurgerProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const g = (n: string) => `pb-${n}-${id}`;

  const pipes = [
    { cls: "pb-top", d: "M8 14 H64", grad: g("l1") },
    { cls: "pb-mid", d: "M64 36 H8", grad: g("l2") },
    { cls: "pb-bot", d: "M8 58 H64", grad: g("l3") },
  ];

  return (
    <button
      ref={ref}
      type="button"
      className="pb"
      data-open={open ? "" : undefined}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      onClick={onToggle}
    >
      <svg viewBox="0 0 72 72" aria-hidden focusable="false">
        <defs>
          <linearGradient id={g("l1")} gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="64" y2="0">
            <stop offset="0" stopColor="#2A2A2F" />
            <stop offset="1" stopColor="#050506" />
          </linearGradient>
          <linearGradient id={g("l2")} gradientUnits="userSpaceOnUse" x1="64" y1="0" x2="8" y2="0">
            <stop offset="0" stopColor="#4A2A0E" />
            <stop offset="0.28" stopColor="#FF7A1A" />
            <stop offset="1" stopColor="#FF8F24" />
          </linearGradient>
          <linearGradient id={g("l3")} gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="64" y2="0">
            <stop offset="0" stopColor="#F08A1C" />
            <stop offset="0.35" stopColor="#E6B81E" />
            <stop offset="1" stopColor="#D9A514" />
          </linearGradient>
        </defs>

        {/* Drips from the crude and gasoline line ends */}
        <g className="pb-drips">
          <ellipse className="pb-drip" cx="59" cy="19" rx="1.25" ry="1.5" fill="#0A0A0B" />
          <ellipse className="pb-drip pb-d2" cx="59" cy="19" rx="1.1" ry="1.35" fill="#1A1A1D" />
          <ellipse className="pb-drip" cx="13" cy="41" rx="1.25" ry="1.5" fill="#FF7A1A" />
          <ellipse className="pb-drip pb-d2" cx="13" cy="41" rx="1.1" ry="1.35" fill="#FF8F24" />
        </g>

        {pipes.map(({ cls, d, grad }) => (
          <g key={cls} className={`pb-pipe ${cls}`} fill="none" strokeLinecap="round">
            <path d={d} stroke="#0B0F12" strokeWidth="11" opacity="0.12" transform="translate(0 1.6)" />
            <path d={d} stroke="#59616A" strokeWidth="10" />
            <path d={d} stroke="#A7AFB7" strokeWidth="8.4" />
            <path d={d} stroke="#0A0D10" strokeWidth="6.4" />
            <path d={d} stroke={`url(#${grad})`} strokeWidth="5.2" />
            <path className="pb-flow pb-slow" d={d} stroke="#FFFFFF" strokeWidth="1.1" strokeDasharray="5 9" opacity="0.32" />
            <path className="pb-flow pb-fast" d={d} stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="9 5" />
          </g>
        ))}
      </svg>
    </button>
  );
}
