"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { buildSite, SCENE_BG } from "./buildSite";
import { HOME_VIEW, type CameraView } from "./views";

export interface SiteApi {
  zoomBy: (factor: number) => void;
  flyTo: (view: CameraView, durationMs?: number) => void;
}

interface SiteCanvasProps {
  apiRef: Ref<SiteApi>;
  /** Full viewer allows pan + wheel zoom; the embedded home model keeps page scroll free. */
  interactive: "embed" | "viewer";
  autoRotate: boolean;
  night: boolean;
  active: boolean;
  arabicFont: string;
  onUserMove?: () => void;
  onReady?: () => void;
}

interface Flight {
  t0: number;
  dur: number;
  fromP: THREE.Vector3;
  toP: THREE.Vector3;
  fromT: THREE.Vector3;
  toT: THREE.Vector3;
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function SiteScene({ apiRef, interactive, autoRotate, night, arabicFont, onUserMove }: Omit<SiteCanvasProps, "active" | "onReady">) {
  // three.js objects are mutable by design; read them through get() inside effects.
  const get = useThree((s) => s.get);
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const controls = useRef<OrbitControlsImpl>(null);
  const flight = useRef<Flight | null>(null);
  const site = useMemo(() => buildSite({ logoUrl: "/logos/gor-logo.svg", arabicFont }), [arabicFont]);

  useEffect(() => {
    const { scene } = get();
    scene.background = new THREE.Color(SCENE_BG);
    scene.fog = new THREE.Fog(SCENE_BG, 300, 620);
    return () => site.dispose();
  }, [get, site]);

  useEffect(() => {
    const { scene, gl } = get();
    site.setNight(night, scene, gl);
  }, [night, site, get]);

  // Wider field of view on narrow screens so the whole site stays in frame.
  useEffect(() => {
    const cam = get().camera as THREE.PerspectiveCamera;
    cam.fov = width < 720 ? 50 : 36;
    cam.updateProjectionMatrix();
  }, [get, width]);

  useEffect(() => {
    const el = get().gl.domElement;
    const c = controls.current;
    if (!c) return;
    if (interactive === "viewer") {
      c.listenToKeyEvents(el);
      el.tabIndex = 0;
      return () => c.stopListenToKeyEvents();
    }
    // Embedded: wheel zoom only after the visitor clicks the model, so page scrolling is never hijacked.
    const setZoom = (on: boolean) => {
      const ctl = get().controls as OrbitControlsImpl | null;
      if (ctl) ctl.enableZoom = on;
    };
    const arm = () => setZoom(true);
    const disarm = () => setZoom(false);
    el.addEventListener("pointerdown", arm);
    el.addEventListener("pointerleave", disarm);
    return () => {
      el.removeEventListener("pointerdown", arm);
      el.removeEventListener("pointerleave", disarm);
    };
  }, [get, interactive]);

  useImperativeHandle(
    apiRef,
    () => ({
      zoomBy(factor) {
        const c = controls.current;
        if (!c) return;
        const off = camera.position.clone().sub(c.target);
        off.setLength(Math.min(c.maxDistance, Math.max(c.minDistance, off.length() * factor)));
        flight.current = {
          t0: performance.now(),
          dur: 450,
          fromP: camera.position.clone(),
          toP: c.target.clone().add(off),
          fromT: c.target.clone(),
          toT: c.target.clone(),
        };
      },
      flyTo(view, durationMs = 1300) {
        const c = controls.current;
        if (!c) return;
        flight.current = {
          t0: performance.now(),
          dur: durationMs,
          fromP: camera.position.clone(),
          toP: new THREE.Vector3(...view.position),
          fromT: c.target.clone(),
          toT: new THREE.Vector3(...view.target),
        };
      },
    }),
    [camera],
  );

  useFrame(({ clock }) => {
    const f = flight.current;
    const c = controls.current;
    if (f && c) {
      const k = Math.min(1, (performance.now() - f.t0) / f.dur);
      const e = ease(k);
      camera.position.lerpVectors(f.fromP, f.toP, e);
      c.target.lerpVectors(f.fromT, f.toT, e);
      if (k >= 1) flight.current = null;
    }
    site.tick(clock.elapsedTime);
  });

  return (
    <>
      <primitive object={site.root} />
      <OrbitControls
        ref={controls}
        makeDefault
        target={HOME_VIEW.target}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomToCursor={interactive === "viewer"}
        minDistance={30}
        maxDistance={460}
        maxPolarAngle={Math.PI * 0.47}
        enablePan={interactive === "viewer"}
        screenSpacePanning={false}
        enableZoom={interactive === "viewer"}
        zoomSpeed={0.9}
        autoRotate={autoRotate}
        autoRotateSpeed={0.45}
        onStart={() => {
          flight.current = null;
          onUserMove?.();
        }}
      />
    </>
  );
}

export default function SiteCanvas({ active, onReady, ...props }: SiteCanvasProps) {
  return (
    <Canvas
      className="!absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 36, near: 1, far: 2000, position: HOME_VIEW.position }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        onReady?.();
      }}
      aria-hidden
    >
      <SiteScene {...props} />
    </Canvas>
  );
}
