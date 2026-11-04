"use client";

import { useEffect, useId, useRef } from "react";
import type { Locale } from "@/lib/i18n";

/**
 * "Liquid petroleum" underline for the desktop nav: one glossy oil line that
 * flows between links with spring physics, stretches (front pulls ahead, back
 * follows viscously), sags, ripples at rest and occasionally drips.
 *
 * Everything per-frame is done with setAttribute through refs inside a rAF loop;
 * React only renders the static SVG skeleton once. Layout is read only when
 * measuring (resize, fonts, route/locale change), never inside the loop.
 */

interface Props {
  /** Index of the link for the current route (-1: none). */
  activeIndex: number;
  locale: Locale;
}

// ── Tunables (from the spec) ────────────────────────────────────────────
const THICK = 3.5;
const HALF = THICK / 2;
const GAP_BELOW_TEXT = 7;
const LEAD = { k: 120, z: 0.92 };
const TRAIL = { k: 34, z: 1.06 };
const GROW = { k: 95, z: 1 };
const SUBSTEP = 0.008;
const MAX_DT = 0.034;
const RETURN_DELAY = 160;
const COLOR_RATE = 7;
const MAX_DROPS = 3;
const DRIP_GAP = 0.7;
const HANG = 0.28;
const GRAVITY = 430;
const FALL_END = 16;
const MERGE_TIME = 0.5;
const SWEEP_TIME = 1.7;
const FADE_MS = 110; // ×2 = 220 ms reduced-motion swap

type RGB = [number, number, number];
const NAVY_FALLBACK: RGB = [0x0f, 0x39, 0x49];
const GOLD_FALLBACK: RGB = [0xff, 0xc0, 0x00];

interface LinkBox {
  l: number;
  r: number;
  y: number; // centre line of the oil
}
interface Drop {
  kind: "fall" | "merge";
  x: number;
  born: number;
  rMax: number;
  vy: number;
  dy: number;
  r: number;
  rx: number;
  ry: number;
}
interface Pending {
  at: number;
  kind: "fall" | "merge";
  frac: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const r2 = (v: number) => (Math.round(v * 100) / 100).toString();
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function parseColor(v: string, fallback: RGB): RGB {
  const s = v.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return fallback;
}

export function OilUnderline({ activeIndex, locale }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = { goo: `oil-goo-${rawId}`, hl: `oil-hl-${rawId}`, ir: `oil-ir-${rawId}`, sw: `oil-sw-${rawId}` };

  const svgRef = useRef<SVGSVGElement>(null);
  const filterRef = useRef<SVGFilterElement>(null);
  const gooRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const capARef = useRef<SVGCircleElement>(null);
  const capBRef = useRef<SVGCircleElement>(null);
  const dropRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const hlRef = useRef<SVGPathElement>(null);
  const hlGradRef = useRef<SVGLinearGradientElement>(null);
  const irRef = useRef<SVGPathElement>(null);
  const irGradRef = useRef<SVGLinearGradientElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const glintRef = useRef<SVGEllipseElement>(null);
  const swRef = useRef<SVGPathElement>(null);
  const swGradRef = useRef<SVGLinearGradientElement>(null);

  /** Imperative engine API, created once on mount. */
  const engine = useRef<{ sync: (active: number) => void } | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const container = svg?.parentElement;
    if (!svg || !container) return;

    // ── Colours from the site tokens ─────────────────────────────────────
    const rootStyle = getComputedStyle(document.documentElement);
    const NAVY = parseColor(rootStyle.getPropertyValue("--color-primary"), NAVY_FALLBACK);
    const GOLD = parseColor(rootStyle.getPropertyValue("--color-accent"), GOLD_FALLBACK);

    // ── State ────────────────────────────────────────────────────────────
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    let links: HTMLAnchorElement[] = [];
    let boxes: LinkBox[] = [];
    let measured = false;
    let active = -1;
    let hoverIdx: number | null = null;
    let target: (LinkBox & { idx: number; hover: boolean }) | null = null;
    let L = 0,
      R = 0,
      Y = 0,
      vL = 0,
      vR = 0,
      dir = 1;
    let growing = false;
    let started = false; // has the line ever been placed
    let mix = 0;
    let time = 0;
    let last = 0;
    let raf = 0;
    let running = false;
    let onScreen = true;
    let lastDrip = -10;
    const drops: Drop[] = [];
    const pending: Pending[] = [];
    let sweepStart = -1;
    let nextSweep = rand(2.6, 5);
    let returnTimer = 0;
    let fadeTimer = 0;

    const setOpacity = (o: number) => {
      svg.style.opacity = String(o);
    };

    // ── Measuring (layout reads live only here) ─────────────────────────
    const measure = () => {
      links = Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href]"));
      if (!container.offsetWidth || !links.length) {
        measured = false;
        return;
      }
      boxes = links.map((a) => {
        const cs = getComputedStyle(a);
        const pl = parseFloat(cs.paddingLeft) || 0;
        const pr = parseFloat(cs.paddingRight) || 0;
        const pb = parseFloat(cs.paddingBottom) || 0;
        const bb = parseFloat(cs.borderBottomWidth) || 0;
        // offsetLeft/Top are relative to the positioned container and ignore transforms.
        let x = 0,
          y = 0,
          el: HTMLElement | null = a;
        while (el && el !== container) {
          x += el.offsetLeft;
          y += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        const textBottom = y + a.offsetHeight - pb - bb;
        return { l: x + pl, r: x + a.offsetWidth - pr, y: textBottom + GAP_BELOW_TEXT };
      });
      measured = true;
      if (target) retarget(target.idx, target.hover, true);
    };

    // ── Targeting ────────────────────────────────────────────────────────
    const retarget = (idx: number, hover: boolean, fromMeasure = false) => {
      if (!measured || idx < 0 || idx >= boxes.length) {
        target = null;
        setOpacity(0);
        return;
      }
      const b = boxes[idx];
      const prev = target;
      target = { ...b, idx, hover };
      Y = b.y;

      if (!started) {
        // First placement: grow outward from the centre of the link.
        started = true;
        const c = (b.l + b.r) / 2;
        L = R = c;
        vL = vR = 0;
        growing = !reduced;
        if (reduced) {
          L = b.l;
          R = b.r;
        }
        mix = hover ? 1 : 0;
        setOpacity(1);
        draw();
        updateRunning();
        return;
      }

      if (reduced) {
        if (fromMeasure || (prev && prev.idx === idx)) {
          L = b.l;
          R = b.r;
          mix = hover ? 1 : 0;
          setOpacity(1);
          draw();
          return;
        }
        // Snap with a quick fade out / in.
        window.clearTimeout(fadeTimer);
        setOpacity(0);
        fadeTimer = window.setTimeout(() => {
          if (!target) return;
          L = target.l;
          R = target.r;
          vL = vR = 0;
          mix = target.hover ? 1 : 0;
          draw();
          setOpacity(1);
        }, FADE_MS);
        return;
      }

      setOpacity(1);
      if (fromMeasure || (prev && prev.idx === idx)) return;

      // A new move: maybe schedule drips.
      const dist = Math.abs((b.l + b.r) / 2 - (L + R) / 2);
      if (dist > 48 && time - lastDrip >= DRIP_GAP && drops.length + pending.length < MAX_DROPS) {
        lastDrip = time;
        pending.push({ at: time + rand(0.08, 0.13), kind: "fall", frac: rand(0.22, 0.4) });
        if (dist > 220) pending.push({ at: time + rand(0.2, 0.26), kind: "merge", frac: rand(0.3, 0.7) });
      }
      sweepStart = -1;
      updateRunning();
    };

    const show = () => {
      const idx = hoverIdx ?? active;
      retarget(idx, hoverIdx !== null && hoverIdx !== active);
    };

    // ── Physics ──────────────────────────────────────────────────────────
    const spring = (x: number, v: number, to: number, k: number, z: number, h: number) => {
      const a = -k * (x - to) - 2 * z * Math.sqrt(k) * v;
      v += a * h;
      return [x + v * h, v] as const;
    };

    const step = (h: number) => {
      if (!target) return;
      const tc = (target.l + target.r) / 2;
      const cc = (L + R) / 2;
      if (Math.abs(tc - cc) > 0.5) dir = tc > cc ? 1 : -1;
      const left = growing ? GROW : dir > 0 ? TRAIL : LEAD;
      const right = growing ? GROW : dir > 0 ? LEAD : TRAIL;
      [L, vL] = spring(L, vL, target.l, left.k, left.z, h);
      [R, vR] = spring(R, vR, target.r, right.k, right.z, h);
    };

    const atRest = () =>
      !!target && Math.abs(L - target.l) < 0.4 && Math.abs(R - target.r) < 0.4 && Math.abs(vL) + Math.abs(vR) < 3;

    // ── Drawing ──────────────────────────────────────────────────────────
    const g = {
      body: bodyRef.current!,
      capA: capARef.current!,
      capB: capBRef.current!,
      hl: hlRef.current!,
      hlGrad: hlGradRef.current!,
      ir: irRef.current!,
      irGrad: irGradRef.current!,
      core: coreRef.current!,
      glint: glintRef.current!,
      sw: swRef.current!,
      swGrad: swGradRef.current!,
      filter: filterRef.current!,
      goo: gooRef.current!,
    };
    const rtl = () => document.documentElement.dir === "rtl";

    const draw = () => {
      if (!target) return;
      const w = Math.max(0, R - L);
      const tw = Math.max(1, target.r - target.l);
      const st = reduced ? 0 : clamp((w - tw) / (tw * 0.7 + 50), 0, 1);
      const speedLead = Math.abs(dir > 0 ? vR : vL);

      // Colour
      const c: RGB = [0, 1, 2].map((i) => Math.round(NAVY[i] + (GOLD[i] - NAVY[i]) * mix)) as RGB;
      const fill = `rgb(${c[0]},${c[1]},${c[2]})`;
      const core = `rgb(${Math.round(c[0] * 0.55)},${Math.round(c[1] * 0.55)},${Math.round(c[2] * 0.55)})`;
      g.goo.setAttribute("fill", fill);
      g.core.setAttribute("stroke", core);

      // Body samples between the cap centres
      const x0 = L + HALF,
        x1 = Math.max(x0, R - HALF);
      const span = x1 - x0;
      const n = Math.max(2, Math.ceil(span / 5));
      const tops: Array<[number, number]> = [];
      const bots: Array<[number, number]> = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = x0 + span * u;
        const uu = w > 0 ? (x - L) / w : 0.5;
        const s = dir > 0 ? uu : 1 - uu; // 0 = trailing end, 1 = leading end
        const thin = 1 - 0.32 * st * Math.sin(Math.PI * uu);
        const sag = 1.2 * st * Math.exp(-(((s - 0.42) / 0.24) ** 2));
        const fade = smooth(0, 10, x - L) * smooth(0, 10, R - x);
        const rip = reduced
          ? 0
          : (0.26 + 0.45 * st) * (Math.sin(x * 0.09 - time * 2.1) + 0.6 * Math.sin(x * 0.043 + time * 1.25)) * fade;
        tops.push([x, Y + sag - HALF * thin + rip]);
        bots.push([x, Y + sag + HALF * thin + rip * 0.35]);
      }
      let d = `M${r2(tops[0][0])} ${r2(tops[0][1])}`;
      for (let i = 1; i < tops.length; i++) d += `L${r2(tops[i][0])} ${r2(tops[i][1])}`;
      for (let i = bots.length - 1; i >= 0; i--) d += `L${r2(bots[i][0])} ${r2(bots[i][1])}`;
      g.body.setAttribute("d", `${d}Z`);

      // End caps: the leading one is a fatter blob of oil
      const capLead = HALF * (1 + 0.32 * st);
      const yA = (tops[0][1] + bots[0][1]) / 2;
      const yB = (tops[tops.length - 1][1] + bots[bots.length - 1][1]) / 2;
      g.capA.setAttribute("cx", r2(x0));
      g.capA.setAttribute("cy", r2(yA));
      g.capA.setAttribute("r", r2(dir < 0 ? capLead : HALF));
      g.capB.setAttribute("cx", r2(x1));
      g.capB.setAttribute("cy", r2(yB));
      g.capB.setAttribute("r", r2(dir > 0 ? capLead : HALF));

      // Goo filter region: the line ± 16 px (plus room for falling drops)
      g.filter.setAttribute("x", r2(L - 16));
      g.filter.setAttribute("y", r2(Y - 16));
      g.filter.setAttribute("width", r2(w + 32));
      g.filter.setAttribute("height", r2(32 + FALL_END));

      // Overlays following the edges
      const edge = (pts: Array<[number, number]>, off: number) => {
        let p = "";
        pts.forEach(([x, y], i) => (p += `${i ? "L" : "M"}${r2(x)} ${r2(y + off)}`));
        return p;
      };
      const hlPath = edge(tops, 0.8);
      g.hl.setAttribute("d", hlPath);
      g.ir.setAttribute("d", edge(bots, -0.6));
      g.core.setAttribute("d", edge(bots, -1));
      for (const grad of [g.hlGrad, g.irGrad]) {
        grad.setAttribute("x1", r2(L));
        grad.setAttribute("x2", r2(Math.max(L + 1, R)));
      }

      // Glint at the leading edge while moving
      const glintO = reduced ? 0 : Math.min(0.85, speedLead / 700);
      const lx = dir > 0 ? x1 : x0;
      g.glint.setAttribute("cx", r2(lx - dir * HALF * 0.35));
      g.glint.setAttribute("cy", r2((dir > 0 ? yB : yA) - HALF * 0.45));
      g.glint.setAttribute("opacity", r2(glintO));

      // Highlight sweep
      if (sweepStart >= 0) {
        const p = clamp((time - sweepStart) / SWEEP_TIME, 0, 1);
        const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        const cx = rtl() ? R - w * e : L + w * e;
        g.sw.setAttribute("d", hlPath);
        g.swGrad.setAttribute("x1", r2(cx - 14));
        g.swGrad.setAttribute("x2", r2(cx + 14));
        g.sw.setAttribute("opacity", r2(Math.sin(Math.PI * p)));
      } else g.sw.setAttribute("opacity", "0");

      // Droplets
      for (let i = 0; i < MAX_DROPS; i++) {
        const el = dropRefs.current[i];
        if (!el) continue;
        const dp = drops[i];
        if (!dp) {
          el.setAttribute("rx", "0");
          el.setAttribute("ry", "0");
          continue;
        }
        el.setAttribute("cx", r2(dp.x));
        el.setAttribute("cy", r2(Y + 0.4 + dp.dy));
        el.setAttribute("rx", r2(dp.rx));
        el.setAttribute("ry", r2(dp.ry));
      }
    };

    // ── Droplet simulation ──────────────────────────────────────────────
    const updateDrops = (dt: number) => {
      for (let i = pending.length - 1; i >= 0; i--) {
        const p = pending[i];
        if (time < p.at) continue;
        pending.splice(i, 1);
        if (!target || drops.length >= MAX_DROPS) continue;
        const trail = dir > 0 ? L : R;
        const lead = dir > 0 ? R : L;
        const x = p.kind === "fall" ? trail + (lead - trail) * p.frac : target.l + (target.r - target.l) * p.frac;
        drops.push({ kind: p.kind, x, born: time, rMax: rand(1.75, 2.2), vy: 6, dy: 0, r: 0.6, rx: 0.6, ry: 0.6 });
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const dp = drops[i];
        const age = time - dp.born;
        if (age < HANG) {
          const e = smooth(0, 1, age / HANG);
          dp.r = 0.6 + (dp.rMax - 0.6) * (age / HANG);
          dp.dy = 2.6 * e;
          dp.rx = dp.ry = dp.r;
          continue;
        }
        if (dp.kind === "fall") {
          dp.vy += GRAVITY * dt;
          dp.dy += dp.vy * dt;
          const f = clamp((dp.dy - 2.6) / (FALL_END - 2.6), 0, 1);
          const stretch = Math.min(0.9, dp.vy / 250);
          dp.r = dp.rMax * (1 - 0.7 * f);
          dp.rx = dp.r * (1 - 0.15 * stretch);
          dp.ry = dp.r * (1 + stretch);
          if (dp.dy >= FALL_END) drops.splice(i, 1);
        } else {
          const p = clamp((age - HANG) / MERGE_TIME, 0, 1);
          const e = 1 - (1 - p) ** 3;
          dp.dy = 2.6 + (-0.3 - 2.6) * e;
          dp.r = dp.rMax + (0.5 - dp.rMax) * e;
          dp.rx = dp.ry = dp.r;
          if (p >= 1) drops.splice(i, 1);
        }
      }
    };

    // ── Loop ─────────────────────────────────────────────────────────────
    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      time += dt;
      if (!target) return;

      const n = Math.max(1, Math.ceil(dt / SUBSTEP));
      for (let i = 0; i < n; i++) step(dt / n);
      if (growing && atRest()) growing = false;

      mix += ((target.hover ? 1 : 0) - mix) * (1 - Math.exp(-COLOR_RATE * dt));
      updateDrops(dt);

      const rest = atRest();
      if (rest && sweepStart < 0 && time >= nextSweep) sweepStart = time;
      if (sweepStart >= 0 && time - sweepStart >= SWEEP_TIME) {
        sweepStart = -1;
        nextSweep = time + rand(2.6, 5);
      }
      if (!rest) nextSweep = Math.max(nextSweep, time + 2.6);

      draw();
    };

    function updateRunning() {
      const should = !reduced && onScreen && !document.hidden && measured && !!target;
      if (should && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }

    // ── Interaction ──────────────────────────────────────────────────────
    const linkIndex = (t: EventTarget | null) => {
      const a = (t as Element | null)?.closest?.("a[href]");
      return a ? links.indexOf(a as HTMLAnchorElement) : -1;
    };
    const scheduleReturn = () => {
      window.clearTimeout(returnTimer);
      returnTimer = window.setTimeout(() => {
        hoverIdx = null;
        show();
      }, RETURN_DELAY);
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const i = linkIndex(e.target);
      if (i < 0) return;
      window.clearTimeout(returnTimer);
      if (hoverIdx !== i) {
        hoverIdx = i;
        show();
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") scheduleReturn();
    };
    const onFocusIn = (e: FocusEvent) => {
      const i = linkIndex(e.target);
      if (i < 0) return;
      window.clearTimeout(returnTimer);
      hoverIdx = i;
      show();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!container.contains(e.relatedTarget as Node | null)) scheduleReturn();
    };
    container.addEventListener("pointerover", onOver);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);

    // ── Observers ────────────────────────────────────────────────────────
    const remeasure = () => {
      measure();
      if (measured && !target) show();
      updateRunning();
    };
    const ro = new ResizeObserver(remeasure);
    ro.observe(container);
    container.querySelectorAll("a[href]").forEach((a) => ro.observe(a));

    const io = new IntersectionObserver((es) => {
      onScreen = es[es.length - 1].isIntersecting;
      updateRunning();
    });
    io.observe(container);

    const onVis = () => {
      last = performance.now();
      updateRunning();
    };
    document.addEventListener("visibilitychange", onVis);

    const onMotion = () => {
      reduced = mq.matches;
      drops.length = 0;
      pending.length = 0;
      sweepStart = -1;
      growing = false;
      if (reduced && target) {
        L = target.l;
        R = target.r;
        vL = vR = 0;
        mix = target.hover ? 1 : 0;
        draw();
      }
      updateRunning();
    };
    mq.addEventListener("change", onMotion);

    let alive = true;
    document.fonts?.ready.then(() => alive && remeasure());

    engine.current = {
      sync(idx) {
        active = idx;
        measure();
        show();
        updateRunning();
      },
    };

    return () => {
      alive = false;
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(returnTimer);
      window.clearTimeout(fadeTimer);
      container.removeEventListener("pointerover", onOver);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMotion);
      ro.disconnect();
      io.disconnect();
      engine.current = null;
    };
  }, []);

  // Route or locale changed: re-measure and flow to the new active link.
  useEffect(() => {
    engine.current?.sync(activeIndex);
  }, [activeIndex, locale]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-visible"
      style={{ opacity: 0, transition: "opacity 110ms ease" }}
    >
      <defs>
        <filter id={ids.goo} ref={filterRef} filterUnits="userSpaceOnUse" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feGaussianBlur in="goo" stdDeviation="1.3" result="sblur" />
          <feOffset in="sblur" dy="1.4" result="soff" />
          <feColorMatrix in="soff" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.2 0" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="goo" />
          </feMerge>
        </filter>
        <linearGradient id={ids.hl} ref={hlGradRef} gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.62" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.24" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.ir} ref={irGradRef} gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6B4BB3" />
          <stop offset="0.5" stopColor="#2A8F9A" />
          <stop offset="1" stopColor="#C9A24A" />
        </linearGradient>
        <linearGradient id={ids.sw} ref={swGradRef} gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g ref={gooRef} filter={`url(#${ids.goo})`} fill="#0f3949">
        <path ref={bodyRef} />
        <circle ref={capARef} r="0" />
        <circle ref={capBRef} r="0" />
        {Array.from({ length: MAX_DROPS }, (_, i) => (
          <ellipse
            key={i}
            ref={(el) => {
              dropRefs.current[i] = el;
            }}
            rx="0"
            ry="0"
          />
        ))}
      </g>

      <path ref={coreRef} fill="none" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
      <path ref={irRef} fill="none" stroke={`url(#${ids.ir})`} strokeWidth="0.6" strokeOpacity="0.55" strokeLinecap="round" />
      <path ref={hlRef} fill="none" stroke={`url(#${ids.hl})`} strokeWidth="0.75" strokeLinecap="round" />
      <path ref={swRef} fill="none" stroke={`url(#${ids.sw})`} strokeWidth="1" strokeLinecap="round" opacity="0" />
      <ellipse ref={glintRef} rx="1.5" ry="0.65" fill="#fff" opacity="0" />
    </svg>
  );
}
