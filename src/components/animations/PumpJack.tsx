"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/scroll-progress";

interface PumpJackProps {
  /** "loading": oil flows into the tank; "empty": a question mark bobs in the empty tank (404). */
  variant: "loading" | "empty";
  label?: string;
  className?: string;
}

const PIVOT = { x: 235, y: 128 };
const CRANK = { x: 135, y: 214 };
const CRANK_R = 18;
const FLOW: Array<[number, number]> = [
  [361, 242],
  [392, 242],
  [392, 206],
  [414, 206],
];

const metal = "#5A6570";
const dark = "#23303F";
const accent = "#E07B2A";

/** 2D animated oil pump jack (design/Loading.dc.html and design/NotFound.dc.html). */
export function PumpJack({ variant, label, className = "" }: PumpJackProps) {
  const beam = useRef<SVGGElement>(null);
  const crank = useRef<SVGGElement>(null);
  const pitman = useRef<SVGLineElement>(null);
  const rod = useRef<SVGLineElement>(null);
  const fill = useRef<SVGRectElement>(null);
  const drops = useRef<Array<SVGCircleElement | null>>([]);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const period = variant === "loading" ? 2.6 : 3.2;
    const segs: Array<{ a: [number, number]; b: [number, number]; len: number; start: number }> = [];
    let total = 0;
    for (let i = 0; i < FLOW.length - 1; i++) {
      const len = Math.hypot(FLOW[i + 1][0] - FLOW[i][0], FLOW[i + 1][1] - FLOW[i][1]);
      segs.push({ a: FLOW[i], b: FLOW[i + 1], len, start: total });
      total += len;
    }
    const along = (u: number): [number, number] => {
      const d = u * total;
      for (const s of segs) {
        if (d <= s.start + s.len) {
          const k = (d - s.start) / s.len;
          return [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k];
        }
      }
      return FLOW[FLOW.length - 1];
    };

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      clock += Math.min(64, now - last) * 0.001 * (reduce ? 0.35 : 1);
      last = now;
      const theta = clock * ((Math.PI * 2) / period);
      const pin = { x: CRANK.x + CRANK_R * Math.cos(theta), y: CRANK.y + CRANK_R * Math.sin(theta) };
      const sphi = -(CRANK_R * Math.sin(theta)) / 100;
      const cphi = Math.sqrt(1 - sphi * sphi);
      const deg = (Math.asin(sphi) * 180) / Math.PI;
      beam.current?.setAttribute("transform", `rotate(${deg.toFixed(3)} ${PIVOT.x} ${PIVOT.y})`);
      crank.current?.setAttribute("transform", `rotate(${((theta * 180) / Math.PI).toFixed(2)} ${CRANK.x} ${CRANK.y})`);
      const p = pitman.current;
      if (p) {
        p.setAttribute("x1", (PIVOT.x - 100 * cphi).toFixed(2));
        p.setAttribute("y1", (PIVOT.y - 100 * sphi).toFixed(2));
        p.setAttribute("x2", pin.x.toFixed(2));
        p.setAttribute("y2", pin.y.toFixed(2));
      }
      const r = rod.current;
      if (r) {
        const hx = PIVOT.x + 117 * cphi - 58 * sphi;
        const hy = PIVOT.y + 117 * sphi + 58 * cphi;
        r.setAttribute("x1", hx.toFixed(2));
        r.setAttribute("y1", hy.toFixed(2));
        r.setAttribute("x2", hx.toFixed(2));
      }
      if (variant !== "loading") return;
      drops.current.forEach((node, i) => {
        if (!node) return;
        const u = (clock / 1.3 + i / 3) % 1;
        const [x, y] = along(u);
        node.setAttribute("cx", x.toFixed(2));
        node.setAttribute("cy", y.toFixed(2));
        node.setAttribute("opacity", Math.min(1, u * 8, (1 - u) * 8).toFixed(2));
      });
      if (fill.current) {
        const cyc = (clock / 7) % 1;
        const level = cyc < 0.85 ? cyc / 0.85 : 1 - (cyc - 0.85) / 0.15;
        const h = 58 * (0.5 - 0.5 * Math.cos(Math.PI * level));
        fill.current.setAttribute("y", (260 - h).toFixed(2));
        fill.current.setAttribute("height", h.toFixed(2));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [variant]);

  const ink = variant === "empty" ? "#1F2933" : dark;
  const flame = variant === "empty" ? accent : metal;

  return (
    <svg
      viewBox="0 0 480 290"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`block h-auto w-full overflow-visible ${className}`}
    >
      <defs>
        <clipPath id={`pj-tank-${variant}`}>
          <rect x="414" y="198" width="46" height="62" rx="3" />
        </clipPath>
      </defs>
      <line x1="20" y1="262" x2="470" y2="262" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <g stroke={ink} strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <line x1="40" y1="272" x2="70" y2="272" />
        <line x1="110" y1="272" x2="180" y2="272" />
        <line x1="300" y1="272" x2="330" y2="272" />
        <line x1="380" y1="272" x2="440" y2="272" />
      </g>
      <rect x="80" y="250" width="300" height="12" rx="3" fill={ink} />
      <rect x="110" y="214" width="50" height="36" rx="5" fill={ink} />
      <path d="M205 250 L235 132 L265 250" fill="none" stroke={metal} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <g stroke={metal} strokeWidth="3" strokeLinecap="round" opacity="0.75">
        <line x1="215" y1="210" x2="255" y2="210" />
        <line x1="223" y1="178" x2="247" y2="178" />
        <line x1="208" y1="240" x2="252" y2="212" />
      </g>
      <rect x="343" y="232" width="18" height="18" rx="2" fill={ink} />
      <rect x="338" y="228" width="28" height="6" rx="2" fill={metal} />
      <path d="M361 242 H392 V206 H414" fill="none" stroke={ink} strokeWidth="6" strokeLinejoin="round" />
      <rect x="412" y="196" width="50" height="66" rx="4" fill="none" stroke={metal} strokeWidth="3" />
      <path d="M410 196 Q437 182 464 196" fill="none" stroke={metal} strokeWidth="3" strokeLinecap="round" />

      {variant === "loading" ? (
        <>
          <g clipPath={`url(#pj-tank-${variant})`}>
            <rect ref={fill} x="414" y="260" width="46" height="0" fill={accent} opacity="0.9" />
          </g>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              ref={(n) => {
                drops.current[i] = n;
              }}
              cx="361"
              cy="242"
              r="3.2"
              fill={accent}
            />
          ))}
        </>
      ) : (
        <text className="pj-q" x="437" y="242" textAnchor="middle" fontSize="30" fontWeight="700" fill={dark}>
          ?
        </text>
      )}

      <line ref={rod} x1="352" y1="184" x2="352" y2="230" stroke={metal} strokeWidth="3" strokeLinecap="round" />
      <g ref={crank} transform={`rotate(0 ${CRANK.x} ${CRANK.y})`}>
        <path d="M135 214 L170 199 A38 38 0 0 1 170 229 Z" fill={flame} />
        <rect x="131" y="210" width="42" height="8" rx="4" fill={metal} />
        <circle cx="153" cy="214" r="4" fill={ink} />
      </g>
      <circle cx="135" cy="214" r="7" fill={ink} stroke={metal} strokeWidth="3" />
      <line ref={pitman} x1="135" y1="128" x2="153" y2="214" stroke={metal} strokeWidth="5" strokeLinecap="round" />
      <g ref={beam} transform={`rotate(0 ${PIVOT.x} ${PIVOT.y})`}>
        <rect x="129" y="120" width="214" height="16" rx="4" fill={metal} />
        <path d="M334 100 C366 104 378 140 360 186 L344 186 C356 150 352 124 334 118 Z" fill={flame} />
        <circle cx="135" cy="128" r="6" fill={ink} />
      </g>
      <circle cx="235" cy="128" r="8" fill={ink} stroke={metal} strokeWidth="3" />
    </svg>
  );
}
