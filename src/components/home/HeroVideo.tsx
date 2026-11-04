"use client";

import { useEffect, useRef, useState } from "react";
import { IMAGES } from "@/lib/site";

/**
 * Muted, looping, inline background video. The poster (the Hero's image) shows
 * until it plays, and stays if playback is blocked, data-saver is on, or the
 * visitor prefers reduced motion. Pauses while off-screen to save battery.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || conn?.saveData) return;
    // Defer so the poster paints first and the video never competes with the LCP image.
    const id = window.setTimeout(() => setAllowed(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !allowed) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [allowed]);

  if (!allowed) return null;
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      src={IMAGES.heroVideo}
      poster={IMAGES.hero}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
      disablePictureInPicture
    />
  );
}
