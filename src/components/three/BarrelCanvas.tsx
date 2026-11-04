"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { getScrollProgress, prefersReducedMotion } from "@/lib/scroll-progress";

interface BarrelCanvasProps {
  /** Set to 1 to trigger a hop + spin; decays back to 0. */
  hopRef: RefObject<number>;
  onReady: () => void;
}

/** Half-profile of a 200 L steel drum (height 1): chimes, two rolling hoops, recessed lid. */
const PROFILE: ReadonlyArray<[number, number]> = [
  [0, 0], [0.29, 0], [0.31, 0.004], [0.335, 0.016], [0.335, 0.045], [0.325, 0.058],
  [0.325, 0.28], [0.331, 0.288], [0.336, 0.3], [0.331, 0.312], [0.325, 0.32],
  [0.325, 0.68], [0.331, 0.688], [0.336, 0.7], [0.331, 0.712], [0.325, 0.72],
  [0.325, 0.942], [0.335, 0.955], [0.335, 0.984], [0.31, 0.996], [0.285, 1],
  [0.272, 0.985], [0.272, 0.962], [0.26, 0.955], [0, 0.955],
];

/** Fine grain used as bump + roughness variation so the steel never looks CG-flat. */
function grainTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 120 + Math.random() * 90;
    img.data.set([v, v, v, 255], i * 4);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 3);
  return t;
}

function Environment() {
  const gl = useThree((st) => st.gl);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose();
    return target;
  }, [gl]);
  useEffect(() => () => env.dispose(), [env]);
  return <primitive object={env.texture} attach="environment" />;
}

function Barrel({ hopRef, onReady }: BarrelCanvasProps) {
  const lean = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const state = useRef({ clock: 0, tilt: 0 });
  const reduce = useMemo(() => prefersReducedMotion(), []);

  const assets = useMemo(() => {
    const geo = new THREE.LatheGeometry(
      PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
      72,
    );
    geo.computeVertexNormals();
    const grain = grainTexture();
    const paint = new THREE.MeshStandardMaterial({
      color: 0x0f3949,
      metalness: 0.65,
      roughness: 0.38,
      roughnessMap: grain,
      bumpMap: grain,
      bumpScale: 0.35,
      envMapIntensity: 1.1,
    });
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9c0c6, metalness: 1, roughness: 0.32, envMapIntensity: 1.2 });
    const plugGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.02, 24);
    const ringGeo = new THREE.TorusGeometry(0.04, 0.007, 10, 28);
    // Yellow identification band, painted just below the top hoop.
    const bandGeo = new THREE.CylinderGeometry(0.3262, 0.3262, 0.07, 72, 1, true);
    const band = new THREE.MeshStandardMaterial({ color: 0xffc000, metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide });
    return { geo, grain, paint, steel, plugGeo, ringGeo, bandGeo, band };
  }, []);

  useEffect(() => {
    onReady();
    return () => {
      const a = assets;
      [a.geo, a.plugGeo, a.ringGeo, a.bandGeo, a.paint, a.steel, a.band, a.grain].forEach((d) => d.dispose());
    };
  }, [assets, onReady]);

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const st = state.current;
    st.clock += dt;
    const p = getScrollProgress();
    const target = ((4 + 14 * p) * Math.PI) / 180;
    st.tilt += (target - st.tilt) * Math.min(1, dt * 5);
    const g = lean.current;
    const sp = spin.current;
    if (!g || !sp) return;
    g.rotation.z = -(st.tilt + (reduce ? 0 : Math.sin(st.clock * 1.5) * 0.03));
    if (!reduce) sp.rotation.y += dt * 0.55;

    const hop = hopRef.current ?? 0;
    if (hop > 0) {
      const next = Math.max(0, hop - dt / 0.8);
      hopRef.current = next;
      g.position.y = 0.04 + Math.sin((1 - next) * Math.PI) * 0.28;
      sp.rotation.y += dt * 12 * next;
      g.rotation.z *= next;
    } else g.position.y = 0.04;
  });

  return (
    <group ref={lean} position={[0, 0.04, 0]}>
      <group ref={spin}>
        <mesh geometry={assets.geo} material={assets.paint} />
        <mesh geometry={assets.bandGeo} material={assets.band} position={[0, 0.82, 0]} />
        <mesh geometry={assets.plugGeo} material={assets.steel} position={[0.13, 0.962, 0.06]} />
        <mesh geometry={assets.ringGeo} material={assets.steel} position={[0.13, 0.968, 0.06]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={assets.plugGeo} material={assets.steel} position={[-0.12, 0.962, -0.08]} scale={0.75} />
      </group>
    </group>
  );
}

export default function BarrelCanvas(props: BarrelCanvasProps) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ fov: 28, near: 0.1, far: 50, position: [0, 1.1, 3.7] }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 0.5, 0);
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden
    >
      <Environment />
      <directionalLight color={0xffffff} intensity={1.8} position={[2, 3, 3]} />
      <directionalLight color={0xffd9a8} intensity={1.1} position={[-3, 1.5, -2]} />
      <Suspense fallback={null}>
        <Barrel {...props} />
      </Suspense>
    </Canvas>
  );
}
