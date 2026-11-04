"use client";

import { useEffect, useRef } from "react";
import { subscribeScroll } from "@/lib/scroll-progress";

/** Thin flame-orange reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribeScroll((p) => {
        if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      }),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div ref={bar} className="h-full origin-left bg-accent rtl:origin-right" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
