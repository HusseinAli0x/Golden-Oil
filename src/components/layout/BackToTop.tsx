"use client";

import { useRef, useState, useEffect } from "react";
import { prefersReducedMotion, subscribeScroll } from "@/lib/scroll-progress";

const LEVELS = 4;

/**
 * Back-to-top button: barrel artwork (imag-oil/preview.webp) whose fill level
 * follows scroll progress, crossfading between 4 states.
 */
export function BackToTop({ label }: { label: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(
    () =>
      subscribeScroll((p, y) => {
        setVisible(y > 160);
        const pos = Math.min(Math.max(p, 0), 1) * (LEVELS - 1);
        imgs.current.forEach((el, i) => {
          if (el) el.style.opacity = String(Math.max(0, 1 - Math.abs(pos - i)));
        });
      }),
    [],
  );

  const goTop = () => {
    const reduce = prefersReducedMotion();
    const b = button.current;
    if (b && !reduce) {
      b.classList.remove("barrel-hop");
      void b.offsetWidth;
      b.classList.add("barrel-hop");
    }
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <button
      ref={button}
      type="button"
      onClick={goTop}
      aria-label={label}
      title={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`barrel fixed bottom-5 end-5 z-50 h-[68px] w-[68px] cursor-pointer overflow-hidden rounded-full border border-border bg-[#F4F6F8] p-0 shadow-[0_10px_28px_rgb(16_24_32/0.16)] transition-[opacity,transform] duration-300 hover:-translate-y-[3px] ${
        visible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      {Array.from({ length: LEVELS }, (_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          ref={(el) => {
            imgs.current[i] = el;
          }}
          src={`/images/barrel-${i}.webp`}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain p-2"
          style={{ opacity: i === 0 ? 1 : 0 }}
        />
      ))}
    </button>
  );
}
