"use client";

/**
 * One passive, rAF-throttled scroll listener shared by every component that
 * needs page scroll progress (top progress bar, barrel back-to-top).
 * Values are read imperatively so subscribers never trigger React re-renders.
 */
type Listener = (progress: number, scrollY: number) => void;

const listeners = new Set<Listener>();
let progress = 0;
let scrollY = 0;
let frame = 0;
let attached = false;

function measure() {
  frame = 0;
  const doc = document.documentElement;
  const max = Math.max(1, doc.scrollHeight - window.innerHeight);
  scrollY = window.scrollY;
  progress = Math.min(1, Math.max(0, scrollY / max));
  listeners.forEach((fn) => fn(progress, scrollY));
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(measure);
}

export function subscribeScroll(fn: Listener): () => void {
  listeners.add(fn);
  if (!attached) {
    attached = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  schedule();
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && attached) {
      attached = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

export function getScrollProgress(): number {
  return progress;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}
