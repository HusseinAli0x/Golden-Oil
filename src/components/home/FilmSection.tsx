"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { FILM } from "@/lib/site";

/**
 * Local company film. Autoplays (muted, looping, inline) as soon as the section
 * scrolls into view and pauses when it leaves. If the browser blocks playback,
 * the poster stays visible with a play button. No third-party player.
 */
export function FilmSection({ t }: { t: Dictionary["home"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // React does not reliably reflect `muted` to the DOM attribute; autoplay needs it.
    v.muted = true;
    const tryPlay = () => {
      if (userPaused.current) return;
      v.play().catch(() => setPlaying(false));
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) tryPlay();
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  return (
    <div className="reveal relative aspect-video max-w-full overflow-hidden rounded-[20px] bg-dark">
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        src={FILM.src}
        poster={FILM.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={t.filmAlt}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.filmPause : t.filmPlay}
        className="absolute bottom-4 end-4 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-dark/75 text-white backdrop-blur transition-colors hover:bg-dark"
      >
        {playing ? <Pause size={20} aria-hidden /> : <Play size={20} aria-hidden className="ms-0.5" />}
      </button>
    </div>
  );
}
