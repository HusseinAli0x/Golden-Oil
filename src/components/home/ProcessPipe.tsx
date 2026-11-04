"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/scroll-progress";

interface Stage {
  title: string;
  text: string;
}

interface PipeState {
  oil: SVGPathElement;
  mask: SVGPathElement;
  sheen: SVGPathElement;
  heads: SVGCircleElement[];
  nodes: SVGGElement[];
  total: number;
  nodeLen: number[];
  cur: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Eight process stages connected by an SVG pipe. Orange oil fills the pipe as the
 * section scrolls through the viewport (lerped, reversible); each badge lights up
 * with a one-time ring pulse when the oil reaches it. Port of buildPipe/drawPipe/
 * pipeTarget/initPipe from design/Main.dc.html. Layout is measured from the DOM,
 * so it follows the grid in both LTR and RTL.
 */
export function ProcessPipe({ stages }: { stages: Stage[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;
    const reduce = prefersReducedMotion();
    let pipe: PipeState | null = null;

    const draw = (v: number) => {
      const P = pipe;
      if (!P) return;
      const off = (P.total - v).toFixed(2);
      P.oil.style.strokeDashoffset = off;
      P.mask.style.strokeDashoffset = off;
      const pt = P.oil.getPointAtLength(Math.max(0, Math.min(P.total, v)));
      const show = v > 1 && v < P.total - 1;
      P.heads.forEach((c) => {
        c.setAttribute("cx", pt.x.toFixed(1));
        c.setAttribute("cy", pt.y.toFixed(1));
        c.style.display = show ? "" : "none";
      });
      P.nodes.forEach((g, i) => {
        const on = v >= P.nodeLen[i] - 2 && (i > 0 || v > 1);
        if (on !== g.classList.contains("on")) g.classList.toggle("on", on);
      });
    };

    const build = () => {
      const wr = wrap.getBoundingClientRect();
      const items = Array.from(wrap.querySelectorAll<HTMLElement>("[data-stage]"));
      if (items.length < 2 || wr.width === 0) return;
      const nodes = items.map((li) => {
        const b = li.querySelector<HTMLElement>("[data-node]")!.getBoundingClientRect();
        const r = li.getBoundingClientRect();
        return { x: b.left + b.width / 2 - wr.left, y: b.top + b.height / 2 - wr.top, top: r.top - wr.top, bottom: r.bottom - wr.top };
      });

      // Route: straight along a row, then out to the nearer side, down the gap, and back in.
      const W = wr.width;
      const cx = W / 2;
      const out = 12;
      const pts: Array<[number, number]> = [[nodes[0].x, nodes[0].y]];
      const marks = [0];
      for (let i = 1; i < nodes.length; i++) {
        const a = nodes[i - 1];
        const b = nodes[i];
        if (Math.abs(a.y - b.y) < 2) pts.push([b.x, b.y]);
        else {
          const ex = a.x > cx ? W + out : -out;
          const enx = b.x > cx ? W + out : -out;
          const gy = (a.bottom + b.top) / 2;
          pts.push([ex, a.y], [ex, gy]);
          if (ex !== enx) pts.push([enx, gy]);
          pts.push([enx, b.y], [b.x, b.y]);
        }
        marks.push(pts.length - 1);
      }

      // Rounded corners; track the path length at every badge.
      const R = 14;
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      const nodeLen = [0];
      let len = 0;
      let prev = pts[0];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const n = pts[i + 1];
        const dx = p[0] - prev[0];
        const dy = p[1] - prev[1];
        const L = Math.hypot(dx, dy) || 1;
        if (n && !marks.includes(i)) {
          const dx2 = n[0] - p[0];
          const dy2 = n[1] - p[1];
          const L2 = Math.hypot(dx2, dy2) || 1;
          const r = Math.min(R, L / 2, L2 / 2);
          const a1: [number, number] = [p[0] - (dx / L) * r, p[1] - (dy / L) * r];
          const a2: [number, number] = [p[0] + (dx2 / L2) * r, p[1] + (dy2 / L2) * r];
          len += Math.hypot(a1[0] - prev[0], a1[1] - prev[1]) + (r * Math.PI) / 2;
          d += ` L${a1[0].toFixed(1)} ${a1[1].toFixed(1)} Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${a2[0].toFixed(1)} ${a2[1].toFixed(1)}`;
          prev = a2;
        } else {
          len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
          d += ` L${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
          prev = p;
        }
        if (marks.includes(i)) nodeLen.push(len);
      }

      svg.replaceChildren();
      const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>, parent: Element = svg) => {
        const node = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
        parent.appendChild(node);
        return node;
      };
      const stroke = { d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
      el("path", { ...stroke, stroke: "#C3CAD3", "stroke-width": "12" });
      el("path", { ...stroke, stroke: "#EEF1F4", "stroke-width": "7" });
      const oil = el("path", { ...stroke, stroke: "#C8641C", "stroke-width": "7" });
      const maskEl = el("mask", { id: "gor-pipe-mask", maskUnits: "userSpaceOnUse" });
      const mask = el("path", { ...stroke, stroke: "#FFFFFF", "stroke-width": "8" }, maskEl);
      const sheen = el("path", { ...stroke, mask: "url(#gor-pipe-mask)", stroke: "#FFC000", "stroke-width": "2.2", "stroke-dasharray": "6 18", opacity: ".85" });
      const heads = [el("circle", { r: "9", fill: "#FFC000", opacity: ".28" }), el("circle", { r: "4.5", fill: "#FFC000" })];
      const nodeEls = nodes.map((nd, i) => {
        const g = el("g", { class: "pn" });
        const at = { cx: nd.x.toFixed(1), cy: nd.y.toFixed(1), r: "17" };
        el("circle", { ...at, class: "r" }, g);
        el("circle", { ...at, class: "c" }, g);
        const label = el("text", { x: at.cx, y: at.cy, "text-anchor": "middle", "dominant-baseline": "central" }, g);
        label.textContent = num(i);
        return g;
      });

      const total = oil.getTotalLength();
      const k = total / (len || total);
      [oil, mask].forEach((p) => (p.style.strokeDasharray = `${total} ${total + 20}`));
      pipe = { oil, mask, sheen, heads, nodes: nodeEls, total, nodeLen: nodeLen.map((v) => v * k), cur: pipe ? Math.min(pipe.cur, total) : 0 };
      draw(pipe.cur);
    };

    const target = () => {
      if (!pipe) return 0;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const start = r.top - vh * 0.8;
      const end = r.bottom - vh * 0.55;
      return Math.min(1, Math.max(0, -start / Math.max(1, end - start))) * pipe.total;
    };

    let raf = 0;
    let last = performance.now();
    let phase = 0;
    let inView = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pipe || !inView || document.hidden) return;
      const t = target();
      const nv = reduce ? t : pipe.cur + (t - pipe.cur) * Math.min(1, dt * 3.2);
      phase = reduce ? 0 : (phase + dt * 30) % 24;
      if (Math.abs(nv - pipe.cur) > 0.2) {
        pipe.cur = nv;
        draw(nv);
      }
      pipe.sheen.style.strokeDashoffset = (-phase).toFixed(2);
    };

    let debounce = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(build, 80);
    });
    ro.observe(wrap);
    const io = new IntersectionObserver((e) => (inView = e[e.length - 1].isIntersecting), { rootMargin: "200px 0px" });
    io.observe(wrap);
    // Badges sit in text; wait for web fonts so measurements are final.
    document.fonts?.ready.then(build).catch(() => undefined);
    build();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(debounce);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-4 gap-y-6 p-0">
        {stages.map((st, i) => (
          <li key={st.title} data-stage className="card flex min-h-[180px] flex-col gap-3 p-6">
            {/* Static badge; the SVG overlay paints the live one on top of it. */}
            <span
              data-node
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border-strong bg-surface text-[13px] font-semibold tabular-nums text-muted"
            >
              {num(i)}
            </span>
            <h3 className="m-0 text-[19px] font-semibold leading-[1.3]">{st.title}</h3>
            <p className="m-0 text-sm leading-[1.65] text-muted">{st.text}</p>
          </li>
        ))}
      </ol>
      <svg ref={svgRef} aria-hidden className="proc-pipe pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible" />
    </div>
  );
}
