"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { hasWebGL } from "@/lib/scroll-progress";

export type ModelStatus = "idle" | "tap" | "nogl" | "loading" | "ready";
type DeviceClass = "pending" | "nogl" | "light" | "full";

const noopSubscribe = () => () => {};
let deviceClass: DeviceClass | null = null;
let arabicFont: string | null = null;

/** WebGL support and "light" devices (small screen or data-saver) never change during a visit. */
function detectDevice(): DeviceClass {
  if (deviceClass) return deviceClass;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (!hasWebGL()) deviceClass = "nogl";
  else if (window.matchMedia("(max-width: 760px)").matches || conn?.saveData) deviceClass = "light";
  else deviceClass = "full";
  return deviceClass;
}

/** The hashed family name next/font gives IBM Plex Sans Arabic, for the 3D entrance sign. */
function detectArabicFont(): string {
  arabicFont ??= getComputedStyle(document.documentElement).getPropertyValue("--font-plex-arabic").trim() || "'IBM Plex Sans Arabic'";
  return arabicFont;
}

/**
 * Decides when the WebGL site model may start: never without WebGL, only on
 * request on light devices (embedded model), otherwise once near the viewport.
 * Also reports whether the stage is on screen so rendering can pause.
 */
export function useSiteModel(stage: RefObject<HTMLElement | null>, { lazy }: { lazy: boolean }) {
  const device = useSyncExternalStore(noopSubscribe, detectDevice, () => "pending" as const);
  const font = useSyncExternalStore(noopSubscribe, detectArabicFont, () => "'IBM Plex Sans Arabic'");
  const [requested, setRequested] = useState(false);
  const [nearby, setNearby] = useState(!lazy);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const el = stage.current;
    if (!el || !lazy) return;
    const io = new IntersectionObserver((entries) => setNearby(entries[entries.length - 1].isIntersecting), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [stage, lazy]);

  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Once started, the canvas stays mounted; scrolling away only pauses rendering.
  const [started, setStarted] = useState(false);
  const canStart = device === "full" || (device === "light" && (!lazy || requested));
  if (!started && canStart && (nearby || requested)) setStarted(true);

  let status: ModelStatus;
  if (device === "nogl" || failed) status = "nogl";
  else if (ready) status = "ready";
  else if (started) status = "loading";
  else if (device === "light" && lazy) status = "tap";
  else status = "idle";

  return {
    status,
    font,
    active: nearby && pageVisible,
    load: () => setRequested(true),
    onReady: () => setReady(true),
    onError: () => setFailed(true),
  };
}
