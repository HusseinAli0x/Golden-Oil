import * as THREE from "three";

/**
 * Illustrative refinery site model, ported from design/Main.dc.html → init3d().
 * Layout follows the plot plan, enriched with details from site photos
 * (DESIGN-SPEC §6.1). Needs GOR approval before launch, or a generalised layout.
 *
 * Built imperatively (thousands of small parts, many instanced) and mounted
 * into React Three Fiber as a single <primitive>.
 */

export const SCENE_BG = 0x1f2933;
export const NIGHT_BG = 0x0b1118;

export interface SiteHandles {
  root: THREE.Group;
  /** Per-frame animation (flare flame flicker). */
  tick: (seconds: number) => void;
  setNight: (on: boolean, scene: THREE.Scene, gl: THREE.WebGLRenderer) => void;
  dispose: () => void;
}

// three r155+ uses physically based light units; the prototype targeted r147 legacy units.
const LEGACY = Math.PI;

type Vec3 = [number, number, number];

export function buildSite(options: { logoUrl: string; arabicFont: string }): SiteHandles {
  const root = new THREE.Group();
  const disposables = new Set<{ dispose: () => void }>();
  const track = <T extends { dispose: () => void }>(o: T): T => {
    disposables.add(o);
    return o;
  };

  // Lights
  const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x2a2620, 0.62 * LEGACY);
  root.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.6 * LEGACY);
  sun.position.set(110, 180, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -150;
  sc.right = 150;
  sc.top = 130;
  sc.bottom = -130;
  sc.near = 20;
  sc.far = 520;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  root.add(sun);
  const rim = new THREE.DirectionalLight(0x8fb0d8, 0.4 * LEGACY);
  rim.position.set(-140, 70, -120);
  root.add(rim);

  const M = (color: number, roughness: number, metalness: number, extra?: THREE.MeshStandardMaterialParameters) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));
  const mat = {
    ground: M(0x2e2a25, 1, 0),
    pad: M(0xb39a72, 0.97, 0),
    bund: M(0xa8987c, 0.9, 0),
    alu: M(0xe3e7ec, 0.28, 0.75),
    navy: M(0x27407a, 0.45, 0.45),
    grate: M(0x3a4048, 0.7, 0.4),
    yellow: M(0xf6b923, 0.4, 0.2),
    cream: M(0xe9d79c, 0.45, 0.15),
    red: M(0xc8261c, 0.42, 0.25),
    drum: M(0x1d2024, 0.55, 0.35),
    concrete: M(0xa6a29a, 0.95, 0),
    purple: M(0x4a46a8, 0.42, 0.4),
    lamp: M(0xfff4d6, 0.4, 0, { emissive: 0xfff0c8, emissiveIntensity: 1.6 }),
    panel: M(0x2a2f36, 0.5, 0.3),
    white: M(0xeaeef2, 0.4, 0.18),
    roof: M(0xd5dbe1, 0.35, 0.3),
    steel: M(0x9ba4ae, 0.38, 0.65),
    dark: M(0x464d56, 0.55, 0.5),
    gold: M(0xe07b2a, 0.34, 0.45),
    teal: M(0x4f9ea2, 0.36, 0.3),
    blue: M(0x4f78b8, 0.45, 0.25),
    maroon: M(0x6b1e33, 0.5, 0.3),
    line: M(0xd8b44a, 0.6, 0, { emissive: 0x3a2a05 }),
    glass: M(0x1b2a3a, 0.15, 0.6, { emissive: 0x2a4a6a, emissiveIntensity: 0.6 }),
  };
  mat.grate.side = THREE.DoubleSide;

  const add = (geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, cast = true) => {
    track(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, cast = true) =>
    add(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, cast);

  // Repeated parts are collected and flushed as InstancedMesh.
  const IN: Record<string, { geo: THREE.BufferGeometry; m: THREE.Material; list: THREE.Matrix4[] }> = {};
  const O3 = new THREE.Object3D();
  const put = (
    key: string,
    geoFn: () => THREE.BufferGeometry,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1,
  ) => {
    O3.position.set(x, y, z);
    O3.rotation.set(rx, ry, rz);
    O3.scale.set(sx, sy, sz);
    O3.updateMatrix();
    const k = `${key}:${m.uuid}`;
    if (!IN[k]) IN[k] = { geo: track(geoFn()), m, list: [] };
    IN[k].list.push(O3.matrix.clone());
  };
  const flushInst = () =>
    Object.entries(IN).forEach(([k, it]) => {
      const im = new THREE.InstancedMesh(it.geo, it.m, it.list.length);
      it.list.forEach((mx, i) => im.setMatrixAt(i, mx));
      im.castShadow = !k.startsWith("lamp") && !k.startsWith("dash");
      im.receiveShadow = true;
      root.add(im);
    });
  const G = {
    post: () => new THREE.BoxGeometry(0.12, 1.1, 0.12),
    rail: () => new THREE.BoxGeometry(1, 0.1, 0.1),
    lampS: () => new THREE.SphereGeometry(0.2, 10, 8),
    hoop: () => new THREE.TorusGeometry(0.55, 0.05, 4, 14, Math.PI * 1.2),
    rung: () => new THREE.BoxGeometry(0.08, 1, 0.08),
    drum: () => new THREE.CylinderGeometry(0.45, 0.45, 1.25, 16),
    brace: () => new THREE.BoxGeometry(0.22, 1, 0.22),
    lampBox: () => new THREE.BoxGeometry(1.4, 0.25, 0.5),
  };

  const railLine = (x1: number, z1: number, x2: number, z2: number, y: number) => {
    const L = Math.hypot(x2 - x1, z2 - z1);
    const ang = -Math.atan2(z2 - z1, x2 - x1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    put("rail", G.rail, mat.yellow, cx, y + 1.1, cz, 0, ang, 0, L, 1, 1);
    put("rail", G.rail, mat.yellow, cx, y + 0.55, cz, 0, ang, 0, L, 1, 1);
    const n = Math.max(1, Math.round(L / 1.5));
    for (let i = 0; i <= n; i++) put("post", G.post, mat.yellow, x1 + ((x2 - x1) * i) / n, y + 0.55, z1 + ((z2 - z1) * i) / n);
  };
  const polyPipe = (pts: Vec3[], r: number, m: THREE.Material, R: number) => {
    const P = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const path = new THREE.CurvePath<THREE.Vector3>();
    let cur = P[0];
    for (let i = 1; i < P.length; i++) {
      const p = P[i];
      if (i < P.length - 1) {
        const dIn = p.clone().sub(P[i - 1]).normalize();
        const dOut = P[i + 1].clone().sub(p).normalize();
        const a = p.clone().sub(dIn.multiplyScalar(R));
        const b = p.clone().add(dOut.multiplyScalar(R));
        path.add(new THREE.LineCurve3(cur, a));
        path.add(new THREE.QuadraticBezierCurve3(a, p.clone(), b));
        cur = b;
      } else path.add(new THREE.LineCurve3(cur, p));
    }
    return add(new THREE.TubeGeometry(path, Math.max(60, Math.round(path.getLength() * 2)), r, 14, false), m, 0, 0, 0);
  };
  const vault = (x: number, z: number, w: number, d: number, h: number, roofM: THREE.Material, frameM: THREE.Material) => {
    const rr = d / 2 + 0.6;
    const roof = add(new THREE.CylinderGeometry(rr, rr, w + 1.2, 40, 1, true, 0, Math.PI), roofM, x, h, z);
    roof.rotation.z = Math.PI / 2;
    roof.scale.x = 0.42;
    const n = Math.max(2, Math.round(w / 5));
    for (let i = 0; i <= n; i++) {
      const px = x - w / 2 + (w * i) / n;
      [-1, 1].forEach((sd) => box(0.4, h, 0.4, frameM, px, 0.4, z + (sd * d) / 2));
      box(0.3, 0.4, d, frameM, px, h - 0.2, z);
      put("brace", G.brace, frameM, px, h - 1.6, z - d / 2 + 1.2, Math.PI / 4, 0, 0, 1, 3, 1);
      put("brace", G.brace, frameM, px, h - 1.6, z + d / 2 - 1.2, -Math.PI / 4, 0, 0, 1, 3, 1);
      if (i < n) put("lampBox", G.lampBox, mat.lamp, px + w / n / 2, h - 0.5, z);
    }
    [-1, 1].forEach((sd) => box(w, 0.35, 0.35, frameM, x, h - 0.4, z + (sd * d) / 2));
  };
  const cyl = (r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 48) =>
    add(new THREE.CylinderGeometry(r, r, h, seg), m, x, y + h / 2, z);
  const hcyl = (r: number, len: number, m: THREE.Material, x: number, y: number, z: number, alongX: boolean) => {
    const mesh = add(new THREE.CylinderGeometry(r, r, len, 40), m, x, y, z);
    if (alongX) mesh.rotation.z = Math.PI / 2;
    else mesh.rotation.x = Math.PI / 2;
    const hg = new THREE.SphereGeometry(r, 32, 16);
    [-1, 1].forEach((s) => {
      const head = add(hg, m, x + (alongX ? (s * len) / 2 : 0), y, z + (alongX ? 0 : (s * len) / 2));
      head.scale.set(alongX ? 0.45 : 1, 1, alongX ? 1 : 0.45);
    });
    return mesh;
  };

  // Ground, pads and road markings
  box(270, 2, 180, mat.ground, 0, -2, 0, false);
  [
    [-112, -64, -64, -32],
    [-58, 8, -64, 8],
    [16, 76, -64, -28],
    [16, 76, -22, 6],
    [-72, 24, 16, 64],
    [32, 76, 16, 64],
    [84, 122, 12, 50],
    [84, 122, -64, -30],
    [-112, -80, 16, 64],
  ].forEach((p) => box(p[1] - p[0], 0.4, p[3] - p[2], mat.pad, (p[0] + p[1]) / 2, 0, (p[2] + p[3]) / 2, false));
  const dash = track(new THREE.BoxGeometry(3, 0.06, 0.35));
  const dashZ = track(new THREE.BoxGeometry(0.35, 0.06, 3));
  for (let x = -130; x <= 130; x += 7) {
    put("dashX", () => dash, mat.line, x, 0.03, 12);
    put("dashX", () => dash, mat.line, x, 0.03, -68);
  }
  for (let z = -84; z <= 84; z += 7) {
    put("dashZ", () => dashZ, mat.line, 80, 0.03, z);
    put("dashZ", () => dashZ, mat.line, -76, 0.03, z);
  }

  // Tank farm bund
  const bh = 1.6;
  const bt = 0.8;
  box(62, bh, bt, mat.bund, -25, 0.4, -62);
  box(62, bh, bt, mat.bund, -25, 0.4, 6);
  box(bt, bh, 68, mat.bund, -56, 0.4, -28);
  box(bt, bh, 68, mat.bund, 6, 0.4, -28);

  const tank = (x: number, z: number, r: number, h: number, bodyMat: THREE.Material = mat.white) => {
    cyl(r, h, bodyMat, x, 0.4, z, 64);
    const dome = add(new THREE.SphereGeometry(r, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2), mat.roof, x, 0.4 + h, z);
    dome.scale.y = 0.2;
    add(new THREE.CylinderGeometry(r + 0.08, r + 0.08, 0.9, 64, 1, true), mat.gold, x, 0.4 + h - 1.6, z);
    add(new THREE.TorusGeometry(r + 0.25, 0.12, 8, 64), mat.steel, x, 0.4 + h + 0.2, z).rotation.x = Math.PI / 2;
  };
  [-46, -31, -16, -1].forEach((x) => tank(x, -50, 6, 15, mat.teal));
  [-43, -24].forEach((x) => tank(x, -10, 8, 12, mat.teal));
  tank(-6, -12, 5, 10, mat.teal);

  // Steel structures
  const frame = (x: number, z: number, w: number, d: number, levels: number, lh: number) => {
    const H = levels * lh;
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
      [0, -1],
      [0, 1],
    ].forEach((c) => box(0.6, H, 0.6, mat.navy, x + (c[0] * w) / 2, 0.4, z + (c[1] * d) / 2));
    for (let i = 1; i <= levels; i++) {
      const y = 0.4 + i * lh;
      box(w, 0.25, d, mat.grate, x, y - 0.25, z);
      box(w + 0.4, 0.4, 0.4, mat.navy, x, y - 0.45, z - d / 2);
      box(w + 0.4, 0.4, 0.4, mat.navy, x, y - 0.45, z + d / 2);
      railLine(x - w / 2, z - d / 2, x + w / 2, z - d / 2, y);
      railLine(x - w / 2, z + d / 2, x + w / 2, z + d / 2, y);
      railLine(x - w / 2, z - d / 2, x - w / 2, z + d / 2, y);
      railLine(x + w / 2, z - d / 2, x + w / 2, z + d / 2, y);
      const yb = y - lh / 2;
      const diag = Math.hypot(w / 2, lh);
      const ang = Math.atan2(lh, w / 2);
      [-1, 1].forEach((sd) => {
        put("brace", G.brace, mat.navy, x - w / 4, yb, z + (sd * d) / 2, 0, 0, ang - Math.PI / 2, 1, diag, 1);
        put("brace", G.brace, mat.navy, x + w / 4, yb, z + (sd * d) / 2, 0, 0, Math.PI / 2 - ang, 1, diag, 1);
      });
      put("lampBox", G.lampBox, mat.lamp, x - w / 4, y - 0.75, z);
      put("lampBox", G.lampBox, mat.lamp, x + w / 4, y - 0.75, z);
    }
  };

  const skid = (x: number, z: number, len: number, rr: number) => {
    box(len + 4, 0.8, 7, mat.concrete, x, 0.4, z);
    box(len + 2, 0.5, 5.6, mat.navy, x, 1.2, z);
    for (let i = 0; i <= 3; i++) {
      const px = x - len / 2 + (len * i) / 3;
      [-1, 1].forEach((sd) => box(0.45, 6, 0.45, mat.navy, px, 1.2, z + sd * 2.6));
      put("brace", G.brace, mat.navy, px - 0.9, 3, z + 2.6, 0, 0, 0.9, 1, 3, 1);
    }
    box(len + 2, 0.35, 0.35, mat.navy, x, 7.0, z - 2.6);
    box(len + 2, 0.35, 0.35, mat.navy, x, 7.0, z + 2.6);
    hcyl(rr, len, mat.alu, x, 3.4, z, true);
    hcyl(rr * 0.8, len * 0.85, mat.alu, x + len * 0.05, 3.4 + rr * 2.1, z - 0.4, true);
    [-0.3, 0.1, 0.35].forEach((f) => {
      cyl(0.35, 2.2, mat.alu, x + f * len, 3.4 + rr * 0.7, z, 16);
      polyPipe(
        [
          [x + f * len, 3.4 + rr * 2.6, z + 0.6],
          [x + f * len, 6.6, z + 0.6],
          [x + f * len + 3, 6.6, z + 0.6],
        ],
        0.32,
        mat.alu,
        0.8,
      );
    });
  };

  // Process area (no tall columns: frames, vessels, exchanger skid)
  frame(63, -46, 14, 12, 4, 7);
  frame(27, -36, 8, 7, 2, 6);
  cyl(1.8, 9, mat.teal, 22, 0.4, -56);
  cyl(1.4, 7, mat.teal, 70, 0.4, -34);
  for (let i = 0; i < 4; i++) cyl(1.2, 0.6, mat.gold, 58 + i * 3.4, 21.5, -46, 32);
  frame(64, -9, 12, 12, 3, 6.5);
  frame(28, -9, 10, 9, 2, 6);
  hcyl(1.6, 9, mat.alu, 30, 14.6, -9, true);
  skid(34, -17, 12, 1.25);
  cyl(1.6, 8, mat.blue, 56, 0.4, 1);
  cyl(1.6, 8, mat.blue, 60, 0.4, 1);

  // Pipe racks
  const V = (x: number, z: number) => new THREE.Vector2(x, z);
  const offsetPoly = (pts: THREE.Vector2[], d: number) =>
    pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      let n: THREE.Vector2;
      if (i === 0 || i === pts.length - 1) {
        const dir = b.clone().sub(a).normalize();
        n = V(-dir.y, dir.x);
      } else {
        const d1 = p.clone().sub(a).normalize();
        const d2 = b.clone().sub(p).normalize();
        n = V(-d1.y, d1.x).add(V(-d2.y, d2.x)).normalize();
        n.multiplyScalar(1 / Math.max(0.5, n.dot(V(-d1.y, d1.x))));
      }
      return p.clone().add(n.multiplyScalar(d));
    });
  const smoothPath = (pts: THREE.Vector2[], y: number, R: number) => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    const P = (v: THREE.Vector2) => new THREE.Vector3(v.x, y, v.y);
    let cur = P(pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (i < pts.length - 1) {
        const dIn = p.clone().sub(pts[i - 1]).normalize();
        const dOut = pts[i + 1].clone().sub(p).normalize();
        const a = P(p.clone().sub(dIn.clone().multiplyScalar(R)));
        const b = P(p.clone().add(dOut.clone().multiplyScalar(R)));
        path.add(new THREE.LineCurve3(cur, a));
        path.add(new THREE.QuadraticBezierCurve3(a, P(p), b));
        cur = b;
      } else path.add(new THREE.LineCurve3(cur, P(p)));
    }
    return path;
  };
  const rack = (pts2: Array<[number, number]>, h: number, pipes: Array<{ off: number; r: number; m: THREE.Material }>) => {
    const pts = pts2.map((p) => V(p[0], p[1]));
    const postG = () => new THREE.BoxGeometry(0.5, h, 0.5);
    const beamG = () => new THREE.BoxGeometry(6.6, 0.45, 0.45);
    const beamG2 = () => new THREE.BoxGeometry(6.6, 0.35, 0.35);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = a.distanceTo(b);
      const dir = b.clone().sub(a).normalize();
      const nrm = V(-dir.y, dir.x);
      const n = Math.max(1, Math.round(len / 7));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) {
        const c = a.clone().add(dir.clone().multiplyScalar((len * k) / n));
        const ry = -Math.atan2(nrm.y, nrm.x);
        [-1, 1].forEach((s) => put(`rackPost${h}`, postG, mat.navy, c.x + nrm.x * s * 3, 0.4 + h / 2, c.y + nrm.y * s * 3));
        put("rackBeam", beamG, mat.navy, c.x, 0.4 + h, c.y, 0, ry, 0);
        put("rackBeam2", beamG2, mat.navy, c.x, 0.4 + h - 2.6, c.y, 0, ry, 0);
      }
    }
    pipes.forEach((pp) => {
      const curve = smoothPath(offsetPoly(pts, pp.off), 0.4 + h + pp.r + 0.22, 6);
      add(new THREE.TubeGeometry(curve, Math.max(80, Math.round(curve.getLength() * 2)), pp.r, 16, false), pp.m, 0, 0, 0);
    });
  };
  rack(
    [
      [-104, -30],
      [12, -30],
      [12, 11],
      [80, 11],
      [80, 31],
      [112, 31],
    ],
    7,
    [
      { off: -2.2, r: 0.6, m: mat.alu },
      { off: -0.8, r: 0.42, m: mat.gold },
      { off: 0.6, r: 0.55, m: mat.alu },
      { off: 1.9, r: 0.38, m: mat.maroon },
    ],
  );
  rack(
    [
      [12, 11],
      [-30, 11],
      [-30, 30],
      [8, 30],
    ],
    5.5,
    [
      { off: -1.4, r: 0.45, m: mat.alu },
      { off: 0, r: 0.5, m: mat.gold },
      { off: 1.4, r: 0.4, m: mat.alu },
    ],
  );
  rack(
    [
      [76, -46],
      [96, -46],
    ],
    3,
    [{ off: 0, r: 0.6, m: mat.steel }],
  );
  add(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(112, 1.2, 31), new THREE.Vector3(140, 1.2, 31)), 8, 0.7, 16), mat.gold, 0, 0, 0);

  // South-west: large tank, vessel, bullets
  tank(-52, 40, 10, 16);
  cyl(3, 18, mat.teal, -14, 0.4, 48);
  add(new THREE.SphereGeometry(3, 32, 16), mat.teal, -14, 18.4, 48);
  [38, 44, 50, 56].forEach((z) => {
    hcyl(2.2, 12, mat.white, -30, 3.4, z + 2, true);
    box(1, 1.4, 3, mat.dark, -34, 0.4, z + 2);
    box(1, 1.4, 3, mat.dark, -26, 0.4, z + 2);
  });

  // Instrument-air shelter: white vaulted roof, purple frame, cream receivers
  box(24, 0.6, 18, mat.concrete, 11, 0.4, 47);
  vault(11, 47, 22, 16, 8.5, mat.roof, mat.purple);
  [3, 9, 15, 21].forEach((x, i) => {
    cyl(1.15, 5.2, mat.cream, x, 1, 43, 32);
    add(new THREE.SphereGeometry(1.15, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat.cream, x, 6.2, 43);
    if (i % 2 === 0) {
      box(3, 2.4, 1.8, mat.cream, x + 3, 1, 43);
      box(1.2, 1.4, 0.3, mat.panel, x + 2.4, 2.2, 44.05);
      box(1.2, 1.4, 0.3, mat.panel, x + 3.8, 2.2, 44.05);
    }
  });
  box(6, 3, 3, mat.cream, 17, 1, 51.5);
  box(6, 3, 3, mat.cream, 5, 1, 51.5);
  box(1.4, 1.6, 0.2, mat.panel, 17, 1.8, 53.05);
  box(1.4, 1.6, 0.2, mat.panel, 5, 1.8, 53.05);
  polyPipe([[1, 3.5, 46], [21, 3.5, 46]], 0.3, mat.alu, 0.5);

  // Buildings
  box(26, 8, 14, mat.white, 54, 0.4, 40);
  box(26.2, 1.2, 14.2, mat.gold, 54, 8.4, 40);
  box(22, 2, 0.2, mat.glass, 54, 3.2, 47.05, false);
  box(9, 4, 8, mat.roof, 38, 0.4, 54);

  // North-west canopies and small tanks
  for (let i = 0; i < 4; i++) {
    const x = -104 + i * 11;
    box(8, 0.5, 14, mat.steel, x, 7, -48);
    [
      [-3.5, -6.5],
      [3.5, -6.5],
      [-3.5, 6.5],
      [3.5, 6.5],
    ].forEach((c) => box(0.5, 6.6, 0.5, mat.dark, x + c[0], 0.4, -48 + c[1]));
    box(1, 5, 1, mat.gold, x + 2.6, 0.4, -48);
  }
  tank(-100, 28, 4, 8);
  tank(-90, 28, 4, 8);
  tank(-100, 44, 4, 8);
  tank(-90, 44, 4, 8);

  // Fire-water pump shelter (red) and drum stacks
  for (let i = 0; i < 7; i++) {
    const x = 90 + i * 4;
    cyl(0.35, 5, mat.steel, x, 0.4, 20, 16);
    add(new THREE.SphereGeometry(0.6, 16, 12), mat.gold, x, 5.4, 20);
  }
  box(22, 0.6, 14, mat.concrete, 104, 0.4, 40);
  vault(104, 40, 20, 12, 7.5, mat.red, mat.red);
  hcyl(1.7, 8, mat.red, 107, 4.2, 42, true);
  [97, 101].forEach((x) => {
    box(3, 1.6, 1.6, mat.red, x, 1, 37);
    cyl(0.5, 4.5, mat.red, x + 1.2, 1, 37, 16);
  });
  polyPipe([[95, 5.6, 37], [113, 5.6, 37], [113, 1, 37]], 0.45, mat.red, 1);
  polyPipe([[98.2, 5.5, 37], [98.2, 5.5, 44], [98.2, 1, 44]], 0.4, mat.red, 0.8);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) put("drum", G.drum, mat.drum, 87 + i * 1.05, 1.03, 25.5 + j * 1.05);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) put("drum", G.drum, mat.drum, 87.5 + i * 1.05, 2.3, 26 + j * 1.05);
  box(10, 4, 6, mat.white, 112, 0.4, 20);

  // Light poles
  const pole = (x: number, z: number, dir: number) => {
    cyl(0.16, 9, mat.steel, x, 0.4, z, 8);
    const arm = box(2.4, 0.18, 0.18, mat.steel, x + Math.cos(dir) * 1.1, 9.2, z + Math.sin(dir) * 1.1);
    arm.rotation.y = -dir;
    put("lampBox", G.lampBox, mat.lamp, x + Math.cos(dir) * 2.2, 9.1, z + Math.sin(dir) * 2.2, 0, -dir, 0);
  };
  [-100, -60, -20, 20, 60, 100].forEach((x) => {
    pole(x, 9, Math.PI / 2);
    pole(x + 8, -65, -Math.PI / 2);
  });
  [-40, 30].forEach((z) => {
    pole(77, z, Math.PI);
    pole(-73, z, 0);
  });

  // Porta-cabin
  box(8, 2.8, 3, mat.white, 22, 0.4, 0);
  box(8.3, 0.25, 3.3, mat.roof, 22, 3.2, 0);
  box(1, 1.8, 0.1, mat.panel, 20, 0.6, 1.55, false);

  // Entrance sign wall with the Arabic name and the GOR logo (canvas texture)
  {
    const cw = 1024;
    const ch = 220;
    const cv = document.createElement("canvas");
    cv.width = cw;
    cv.height = ch;
    const g = cv.getContext("2d");
    const tex = track(new THREE.CanvasTexture(cv));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    let logo: HTMLImageElement | null = null;
    const paint = () => {
      if (!g) return;
      g.fillStyle = "#F3F1EC";
      g.fillRect(0, 0, cw, ch);
      g.fillStyle = "#1F2933";
      [
        [90, 40, 34, 160],
        [128, 90, 26, 110],
        [160, 120, 60, 80],
        [70, 120, 24, 80],
        [150, 60, 8, 60],
      ].forEach((r) => g.fillRect(r[0], r[1], r[2], r[3]));
      g.font = `700 64px ${options.arabicFont}, Tahoma, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("مصفاة النفط الذهبي", cw / 2 + 10, ch / 2);
      if (logo) {
        g.globalAlpha = 0.9;
        g.drawImage(logo, cw - 170, 30, 100, 162);
        g.globalAlpha = 1;
      }
      tex.needsUpdate = true;
    };
    paint();
    const im = new Image();
    im.onload = () => {
      logo = im;
      paint();
    };
    im.src = options.logoUrl;
    document.fonts?.ready.then(paint).catch(() => undefined);
    const face = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
    const signGeo = track(new THREE.BoxGeometry(20, 4.3, 0.5));
    const sign = new THREE.Mesh(signGeo, [mat.white, mat.white, mat.white, mat.white, face, mat.white]);
    sign.position.set(-44, 0.4 + 2.15 + 0.6, 9.2);
    sign.castShadow = true;
    root.add(sign);
    box(20.4, 0.6, 0.9, mat.concrete, -44, 0.4, 9.2);
  }

  flushInst();

  // Flare stack with animated flame
  const fx = 104;
  const fz = -47;
  add(new THREE.CylinderGeometry(0.8, 1.4, 62, 24), mat.steel, fx, 31.4, fz);
  for (let y = 12; y < 60; y += 12) add(new THREE.TorusGeometry(1.6, 0.1, 6, 24), mat.gold, fx, y, fz).rotation.x = Math.PI / 2;
  cyl(2.5, 1.5, mat.dark, fx, 0.4, fz);
  const flameMat = track(
    new THREE.MeshBasicMaterial({ color: 0xffa21f, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  const flame = add(new THREE.ConeGeometry(1.6, 7, 24, 1, true), flameMat, fx, 66, fz, false);
  flame.receiveShadow = false;
  const flareLight = new THREE.PointLight(0xff9a2e, 2.2 * LEGACY, 140, 0);
  flareLight.position.set(fx, 68, fz);
  root.add(flareLight);

  const nightLights = (
    [
      [40, 28, -38],
      [-20, 18, -20],
      [40, 12, 40],
    ] as Vec3[]
  ).map((q) => {
    const L = new THREE.PointLight(0xffd9a0, 1.8 * LEGACY * 0.6, 90, 0);
    L.position.set(q[0], q[1], q[2]);
    return L;
  });

  return {
    root,
    tick(s) {
      const f = 1 + Math.sin(s * 9) * 0.08 + Math.sin(s * 23) * 0.05;
      flame.scale.set(f, 1 + Math.sin(s * 7) * 0.12, f);
      flareLight.intensity = (1.8 + Math.sin(s * 13) * 0.3) * LEGACY;
    },
    setNight(on, scene, gl) {
      const bg = new THREE.Color(on ? NIGHT_BG : SCENE_BG);
      scene.background = bg;
      if (scene.fog) scene.fog.color = bg;
      hemi.intensity = (on ? 0.16 : 0.62) * LEGACY;
      hemi.color.set(on ? 0x8aa0c8 : 0xdfe6ee);
      sun.intensity = (on ? 0.22 : 1.6) * LEGACY;
      sun.color.set(on ? 0x9fb4e0 : 0xfff0d8);
      rim.intensity = (on ? 0.12 : 0.4) * LEGACY;
      mat.lamp.emissiveIntensity = on ? 3.2 : 1.6;
      nightLights.forEach((L) => (on ? root.add(L) : root.remove(L)));
      gl.toneMappingExposure = on ? 1.25 : 1.08;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      disposables.clear();
      sun.shadow.map?.dispose();
    },
  };
}
