/* Vacuum Distillation Unit — cinematic scroll experience
   three.js r147 (UMD) + GSAP 3.12 ScrollTrigger.
   Illustrative configuration only: not to scale, not a specific plant. */
window.GORVDU = function (opts) {
  'use strict';
  opts = opts || {};

  const T = window.THREE;
  const ROOT = opts.root;
  const qs = (s) => ROOT.querySelector(s);
  const STAGE = ROOT.querySelector('.vdu-stage');
  const SW = () => STAGE.clientWidth || innerWidth, SH = () => STAGE.clientHeight || innerHeight;
  let disposed = false, rafId = 0; const cleanup = [];
  const api = { lang: opts.lang || 'en' };
  const tr = (str) => (api.lang === 'ar' && opts.ar && opts.ar[str]) || str;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const band = (a, b, c, d, x) => smooth(a, b, x) * (1 - smooth(c, d, x)); // fade in a→b, out c→d
  const lerp = (a, b, t) => a + (b - a) * t;

  const isMobile = window.matchMedia('(max-width: 760px)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Stream palette ----------
  const C = {
    feed: 0xd8482a,
    vapor: 0xfff1d6,
    liquid: 0xf2a53a,
    lvgo: 0xf2b544,
    hvgo: 0xe07b2a,
    resid: 0xa83a5c,
    vac: 0x9fc4e8,
    bitumen: 0x6b5a4e,
  };

  // ---------- Tower geometry (illustrative) ----------
  const R = 4.2;           // main (vacuum) section radius
  const RB = 2.6;          // bottom boot radius
  const RT = 2.8;          // top section radius
  const PROFILE = [        // [radius, y]
    [0.01, 4.6], [RB * 1.25, 4.6], [RB * 1.25, 6], [RB, 6], [RB, 16], [R, 19.5], [R, 48], [RT, 52], [RT, 57.2],
    [RT * 0.82, 58.6], [RT * 0.45, 59.4], [0.01, 59.6],
  ];
  const Y = {
    flash: 27, feedIn: 27.2, wash: [28.6, 31.0], washDist: 31.6, hvgoTray: 33.6, hvgoBed: [35.2, 39.6], hvgoDist: 40.2,
    lvgoTray: 42.0, lvgoBed: [43.4, 46.4], lvgoDist: 47.0, demister: 53.5, strip: [19.6, 25.2], residLevel: 10.5, residOut: 7.2,
  };
  const rAt = (y) => {
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const a = PROFILE[i], b = PROFILE[i + 1];
      if (y >= a[1] && y <= b[1]) { const t = (y - a[1]) / Math.max(1e-6, b[1] - a[1]); return lerp(a[0], b[0], t); }
    }
    return R;
  };

  // ---------- Story (progress ranges) ----------
  const SCENES = [
    { id: 's1', from: 0.0, to: 0.12 },
    { id: 's2', from: 0.12, to: 0.27 },
    { id: 's3', from: 0.27, to: 0.5 },
    { id: 's4a', from: 0.5, to: 0.61 },
    { id: 's4b', from: 0.61, to: 0.71 },
    { id: 's4c', from: 0.71, to: 0.84 },
    { id: 's5', from: 0.84, to: 1.0 },
  ];

  // Camera keyframes: progress → position / target
  const KEYS = [
    { p: 0.0, pos: [40, 6, 66], tgt: [-10, 31, 0] },
    { p: 0.07, pos: [32, 13, 52], tgt: [-8, 31, 0] },
    { p: 0.13, pos: [22, 21, 36], tgt: [-4, 31, 0] },
    { p: 0.2, pos: [11, 28, 24], tgt: [-3, 30, -0.5] },
    { p: 0.27, pos: [2, 26, 19], tgt: [-3.5, 25, -1] },
    { p: 0.3, pos: [-2.6, 22.4, 14.5], tgt: [-3.8, 22.2, -1] },
    { p: 0.34, pos: [-2.8, 27.4, 15], tgt: [-4, 27.6, -1] },
    { p: 0.38, pos: [-0.8, 31.2, 15.5], tgt: [-3.6, 31.2, -1] },
    { p: 0.42, pos: [-0.6, 36.6, 15.5], tgt: [-3.6, 36.4, -1] },
    { p: 0.46, pos: [-0.6, 43.4, 15.5], tgt: [-3.6, 43.6, -1] },
    { p: 0.5, pos: [-1.2, 52.5, 13], tgt: [-3.2, 53.5, -1] },
    { p: 0.56, pos: [17, 46, 19], tgt: [0.5, 42, 0] },
    { p: 0.61, pos: [17, 41, 19], tgt: [0.5, 38, 0] },
    { p: 0.66, pos: [16.5, 36.5, 18], tgt: [0.5, 34, 0] },
    { p: 0.72, pos: [14, 19, 21], tgt: [-1, 11, 0] },
    { p: 0.78, pos: [16, 10, 19], tgt: [1.5, 7, 0] },
    { p: 0.84, pos: [30, 15, 27], tgt: [16, 4, -4] },
    { p: 0.89, pos: [11, 10, 45], tgt: [14.5, 3, 17] },
    { p: 0.95, pos: [46, 27, 74], tgt: [1, 24, 4] },
    { p: 1.0, pos: [62, 35, 94], tgt: [0, 25, 4] },
  ];

  // ---------- WebGL check ----------
  let gl = false;
  try { const c = document.createElement('canvas'); gl = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) {}
  const forceFallback = !!opts.forceFallback;
  const useGL = gl && T && !forceFallback;

  // ---------- Shared scroll progress ----------
  const S = { p: 0, target: 0 };
  const scroller = ROOT;

  function readScroll() {
    const r = scroller.getBoundingClientRect(); const max = Math.max(1, r.height - innerHeight);
    if (!window.VDU_CAPTURE) S.target = clamp(-r.top / max, 0, 1);
    return r.bottom > -60 && r.top < innerHeight + 60;
  }
  function setupScroll() {}


  // ---------- Overlay UI (panels, progress rail) ----------
  const panels = SCENES.map((s) => ({ s, el: qs('[data-scene="' + s.id + '"]') }));
  const rail = qs('.vdu-rail-fill');
  const dots = Array.prototype.slice.call(ROOT.querySelectorAll('.rail-dot'));
  function updateUI(p) {
    panels.forEach(({ s, el }) => {
      if (!el) return;
      const w = 0.025;
      const o = s.from === 0 ? 1 - smooth(s.to - w, s.to, p) : s.to === 1 ? smooth(s.from, s.from + w, p) : band(s.from, s.from + w, s.to - w, s.to, p);
      el.style.opacity = o.toFixed(3);
      el.style.transform = 'translateY(' + ((1 - o) * 18).toFixed(1) + 'px)';
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
    if (rail) rail.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    dots.forEach((d) => { const at = parseFloat(d.dataset.p); d.classList.toggle('on', p >= at - 0.005); });
    const hint = qs('.vdu-hint'); if (hint) hint.style.opacity = (1 - smooth(0.0, 0.03, p)).toFixed(2);
  }
  dots.forEach((d) => d.addEventListener('click', () => {
    const r = scroller.getBoundingClientRect(); const max = r.height - innerHeight;
    scrollTo({ top: scrollY + r.top + max * (parseFloat(d.dataset.p) + 0.01), behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  // =====================================================================
  // Fallback: scroll-scrubbed pre-rendered frames (no WebGL)
  // =====================================================================
  if (!useGL) {
    ROOT.classList.add('no-webgl'); { const g0 = qs('.vdu-gl'), f0 = qs('.vdu-fallback'); if (g0) g0.style.display = 'none'; if (f0) f0.style.display = 'block'; }
    const cv = qs('.vdu-fallback'); const ctx = cv.getContext('2d');
    const FR = opts.frames || []; const N = FR.length;
    const imgs = []; let last = -1;
    for (let i = 0; i < N; i++) { const im = new Image(); im.src = FR[i]; im.onload = () => { if (i === last || last < 0) draw(true); }; imgs.push(im); }
    const fit = () => { cv.width = SW() * Math.min(devicePixelRatio || 1, 2); cv.height = SH() * Math.min(devicePixelRatio || 1, 2); draw(true); };
    function draw(force) {
      if (!N) return;
      const i = Math.round(S.p * (N - 1)); if (i === last && !force) return;
      const im = imgs[i]; if (!im || !im.complete || !im.naturalWidth) return;
      last = i;
      const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    }
    const LB = opts.labels || []; const LEL = {}; ROOT.querySelectorAll('[data-label]').forEach((el) => { LEL[el.getAttribute('data-label')] = el; });
    function placeFB() {
      if (!LB.length) return;
      const row = LB[Math.round(S.p * (LB.length - 1))] || {}; const W = SW(), H = SH(); const sc = Math.max(W / 1280, H / 720); const ox = (W - 1280 * sc) / 2, oy = (H - 720 * sc) / 2;
      Object.keys(LEL).forEach((k) => { const el = LEL[k], v = row[k];
        if (!v || v[2] < 0.02) { el.style.visibility = 'hidden'; el.style.opacity = '0'; return; }
        el.style.visibility = 'visible'; el.style.opacity = String(v[2]);
        el.style.transform = 'translate(' + (ox + (v[0] + 1) / 2 * 1280 * sc).toFixed(1) + 'px,' + (oy + (1 - v[1]) / 2 * 720 * sc).toFixed(1) + 'px) translate(-50%,-100%)'; });
    }
    addEventListener('resize', fit); cleanup.push(() => removeEventListener('resize', fit)); fit();
    const loop = () => { if (disposed) return; if (readScroll()) { S.p += (S.target - S.p) * (reduceMotion ? 1 : 0.18); updateUI(S.p); draw(); placeFB(); } rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);
    api.dispose = () => { disposed = true; cancelAnimationFrame(rafId); cleanup.forEach((f) => f()); };
    api.setLang = (l) => { api.lang = l; };
    qs('#loader') && qs('#loader').classList.add('done');
    return api;
  }

  // =====================================================================
  // WebGL scene
  // =====================================================================
  const canvas = qs('.vdu-gl');
  const renderer = new T.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance', preserveDrawingBuffer: !!window.VDU_CAPTURE });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  const BG = 0x141c24;
  scene.background = new T.Color(BG);
  scene.fog = new T.FogExp2(BG, 0.0105);
  const camera = new T.PerspectiveCamera(38, 1, 0.2, 900);

  // Lights
  const hemi = new T.HemisphereLight(0x6f86a6, 0x16110c, 0.55); scene.add(hemi);
  const key = new T.DirectionalLight(0xffd6a0, 1.9); key.position.set(40, 70, 35); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -45, right: 45, top: 70, bottom: -20, near: 10, far: 200 });
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.05; scene.add(key);
  const rim = new T.DirectionalLight(0x7fa6ff, 0.9); rim.position.set(-50, 40, -40); scene.add(rim);
  const inner = new T.PointLight(0xffb070, 0, 30, 1.6); inner.position.set(0, 34, 2.5); scene.add(inner);
  const inner2 = new T.PointLight(0xffc890, 0, 24, 1.6); inner2.position.set(0, 22, 2.5); scene.add(inner2);

  // ---------- Procedural textures ----------
  function canvasTex(w, h, paint, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  const cladTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#c9d0d7'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '40,50,60') + ',' + (Math.random() * 0.05) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 30, 1); }
    g.strokeStyle = 'rgba(40,48,58,.55)'; g.lineWidth = 2;
    for (let x = 0; x <= w; x += w / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.strokeStyle = 'rgba(40,48,58,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h - 2); g.lineTo(w, h - 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, h - 6); g.lineTo(w, h - 6); g.stroke();
  }, [6, 9]);
  const cladRough = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6b6b6b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 60 + Math.random() * 90 | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 20, 1 + Math.random() * 2); }
  }, [6, 9]);
  cladRough.encoding = T.LinearEncoding;
  const packTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#3c4148'; g.fillRect(0, 0, w, h);
    g.lineWidth = 2;
    for (let row = 0; row < 8; row++) {
      const y0 = row * h / 8, dir = row % 2 ? 1 : -1;
      g.strokeStyle = row % 2 ? 'rgba(190,198,206,.55)' : 'rgba(150,160,170,.5)';
      for (let x = -h; x < w + h; x += 9) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x + dir * h / 8, y0 + h / 8); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y0, w, 1.5);
    }
  }, [2, 1]);
  const concreteTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#2a2e33'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const v = 30 + Math.random() * 30 | 0; g.fillStyle = 'rgba(' + v + ',' + (v + 3) + ',' + (v + 6) + ',.5)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
  }, [40, 40]);
  const dotTex = canvasTex(64, 64, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
  const glowTex = canvasTex(128, 32, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });

  // ---------- Reflection environment (PBR metals: drums, vessels) ----------
  // A tiny procedural sky/horizon with warm key and cool rim panels matching the scene lights,
  // prefiltered once with PMREM. Applied only to the product drums and the bitumen unit.
  const envTex = (() => {
    const pm = new T.PMREMGenerator(renderer);
    const es = new T.Scene();
    const sky = new T.SphereGeometry(50, 24, 12);
    const cGround = new T.Color(0x30343a), cHorizon = new T.Color(0x56657a), cSky = new T.Color(0x222d3b);
    const pos = sky.attributes.position, cols = [];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 50;
      const c = y < 0 ? cHorizon.clone().lerp(cGround, Math.min(1, -y * 2.5)) : cHorizon.clone().lerp(cSky, Math.min(1, y * 2.2));
      cols.push(c.r, c.g, c.b);
    }
    sky.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    es.add(new T.Mesh(sky, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const panel = (color, k, p, w, h) => { const o = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(k), side: T.DoubleSide })); o.position.set(p[0], p[1], p[2]); o.lookAt(0, 0, 0); es.add(o); };
    panel(0xffd6a0, 5, [22, 34, 18], 18, 10);   // key (matches the warm directional light)
    panel(0x7fa6ff, 2.2, [-26, 20, -22], 14, 8); // rim
    panel(0xe8eef5, 1.2, [0, 12, 40], 40, 3);    // soft horizon strip
    // tall low strips: vertical highlight streaks on the drums/vessels from the yard camera angles
    panel(0xffe2bc, 6, [32, 6, 32], 9, 50);
    panel(0xa9c2ff, 3, [-30, 6, 32], 8, 46);
    panel(0xdfe6ee, 2.2, [4, -2, 46], 10, 46);
    const tex = pm.fromScene(es, 0.03).texture;
    es.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    pm.dispose();
    return tex;
  })();
  cleanup.push(() => envTex.dispose());

  // ---------- Materials ----------
  const M = (o) => new T.MeshStandardMaterial(o);
  const mat = {
    clad: M({ map: cladTex, roughnessMap: cladRough, color: 0xffffff, metalness: 0.78, roughness: 0.42 }),
    cladFront: M({ map: cladTex, roughnessMap: cladRough, color: 0xffffff, metalness: 0.78, roughness: 0.42, transparent: true }),
    innerWall: M({ color: 0x46413c, metalness: 0.55, roughness: 0.75, side: T.BackSide }),
    steel: M({ color: 0x5b6470, metalness: 0.75, roughness: 0.45 }),
    darkSteel: M({ color: 0x2a3038, metalness: 0.6, roughness: 0.6 }),
    grate: M({ color: 0x3a4048, metalness: 0.6, roughness: 0.7, side: T.DoubleSide }),
    yellow: M({ color: 0xf2b12a, metalness: 0.2, roughness: 0.45 }),
    pipe: M({ color: 0xbfc6cd, metalness: 0.8, roughness: 0.35 }),
    pack: M({ map: packTex, color: 0xffffff, metalness: 0.65, roughness: 0.5, side: T.DoubleSide }),
    packSide: M({ color: 0x4a5058, metalness: 0.6, roughness: 0.55, side: T.DoubleSide }),
    tray: M({ color: 0x6d747d, metalness: 0.7, roughness: 0.45, side: T.DoubleSide }),
    concrete: M({ map: concreteTex, color: 0xffffff, metalness: 0.0, roughness: 0.95 }),
    cutEdge: M({ color: 0x8c949c, metalness: 0.7, roughness: 0.4 }),
    bg: M({ color: 0x1a2129, metalness: 0.5, roughness: 0.7 }),
    lamp: new T.MeshBasicMaterial({ color: 0xffd8a0 }),
    motor: M({ color: 0x2f5d8a, metalness: 0.4, roughness: 0.5 }),
  };
  const frontMats = [mat.cladFront];

  const root = new T.Group(); scene.add(root);
  const add = (geo, m, x, y, z, parent) => { const o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; (parent || root).add(o); return o; };

  // ---------- Ground & environment ----------
  const ground = add(new T.PlaneGeometry(600, 600), mat.concrete, 0, 0, 0); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
  add(new T.CylinderGeometry(9, 9.4, 0.8, 48), mat.concrete, 0, 0.4, 0).castShadow = false;

  // distant refinery silhouettes
  const bgGroup = new T.Group(); root.add(bgGroup);
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const lampGeo = new T.SphereGeometry(0.22, 8, 6);
  const lamps = [];
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2, d = 70 + rnd() * 90;
    const x = Math.cos(a) * d, z = Math.sin(a) * d - 30;
    if (z > 40 && Math.abs(x) < 70) continue;
    const kind = rnd();
    if (kind < 0.45) { const h = 20 + rnd() * 40, r = 1.5 + rnd() * 2.5; add(new T.CylinderGeometry(r, r, h, 16), mat.bg, x, h / 2, z, bgGroup); for (let k = 8; k < h; k += 7) lamps.push([x + r + 0.3, k, z]); }
    else if (kind < 0.8) { const r = 7 + rnd() * 8, h = 9 + rnd() * 6; add(new T.CylinderGeometry(r, r, h, 32), mat.bg, x, h / 2, z, bgGroup); lamps.push([x, h + 0.5, z]); }
    else { const w = 10 + rnd() * 14, h = 8 + rnd() * 14; add(new T.BoxGeometry(w, h, 8), mat.bg, x, h / 2, z, bgGroup); for (let k = 3; k < h; k += 4) lamps.push([x - w / 3, k, z + 4.1], [x + w / 3, k, z + 4.1]); }
  }
  // flare stack in the distance
  add(new T.CylinderGeometry(0.6, 1.1, 70, 16), mat.bg, -95, 35, -120, bgGroup);
  const flare = new T.Mesh(new T.ConeGeometry(1.6, 7, 16, 1, true), new T.MeshBasicMaterial({ color: 0xff9a3a, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
  flare.position.set(-95, 73.5, -120); scene.add(flare);
  const lampInst = new T.InstancedMesh(lampGeo, mat.lamp, lamps.length); const O3 = new T.Object3D();
  lamps.forEach((l, i) => { O3.position.set(l[0], l[1], l[2]); O3.updateMatrix(); lampInst.setMatrixAt(i, O3.matrix); }); scene.add(lampInst);

  // ---------- Tower shell (lathe halves for cutaway) ----------
  const prof = PROFILE.map((q) => new T.Vector2(q[0], q[1]));
  const profIn = PROFILE.map((q) => new T.Vector2(Math.max(0.01, q[0] - 0.14), q[1]));
  // three Lathe: x = r*sin(phi), z = r*cos(phi). Front half faces +z.
  const backShell = add(new T.LatheGeometry(prof, 72, Math.PI / 2, Math.PI), mat.clad);
  const backInner = add(new T.LatheGeometry(profIn, 72, Math.PI / 2, Math.PI), mat.innerWall); backInner.castShadow = false;
  const frontShell = add(new T.LatheGeometry(prof, 72, -Math.PI / 2, Math.PI), mat.cladFront);
  frontShell.renderOrder = 5;
  // cut edge strips (wall thickness) at x = ±r, z = 0
  const edgeObjs = [];
  [-1, 1].forEach((s) => {
    const pts = []; prof.forEach((v) => pts.push(new T.Vector3(v.x * s, v.y, 0)));
    const curve = new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.0);
    const edge = add(new T.TubeGeometry(curve, 200, 0.09, 6, false), mat.cutEdge);
    edge.userData.cutEdge = true; edge.visible = false; edgeObjs.push(edge);
  });

  // cladding hoops (stiffener bands)
  const hoopGeoCache = {};
  for (let y = 8; y < 57; y += 3.2) {
    const r = rAt(y) + 0.06; const k = r.toFixed(2);
    hoopGeoCache[k] = hoopGeoCache[k] || new T.TorusGeometry(r, 0.07, 6, 72, Math.PI);
    const back = add(hoopGeoCache[k], mat.steel, 0, y, 0); back.rotation.set(Math.PI / 2, 0, Math.PI);
  }

  // Platforms (back half permanent, front half fades with shell)
  const frontGroup = new T.Group(); root.add(frontGroup);
  const platformYs = [16.5, 24, 32, 40, 48.5, 56];
  const box3 = new T.Box3(), cz = new T.Vector3();
  const sideOf = (mesh) => { mesh.updateMatrixWorld(true); box3.setFromObject(mesh); box3.getCenter(cz); return cz.z; };
  const toFront = (mesh) => { // move a mesh into the fading front group with its own transparent material
    const m = mesh.material.clone(); m.transparent = true; frontMats.push(m); mesh.material = m;
    root.remove(mesh); frontGroup.add(mesh);
  };
  platformYs.forEach((y) => {
    const r = rAt(y) + 0.15, w = 1.6;
    [0, Math.PI].forEach((ts) => {
      const parts = [];
      const deck = add(new T.RingGeometry(r, r + w, 48, 1, ts, Math.PI), mat.grate, 0, y, 0); deck.rotation.x = -Math.PI / 2; parts.push(deck);
      const front = sideOf(deck) > 0;
      [1.1, 0.55].forEach((h) => { const tr = add(new T.TorusGeometry(r + w - 0.05, 0.045, 5, 48, Math.PI), mat.yellow, 0, y + h, 0); tr.rotation.x = -Math.PI / 2; tr.rotation.z = ts; parts.push(tr); });
      const postG = new T.CylinderGeometry(0.035, 0.035, 1.1, 5);
      for (let i = 0; i <= 14; i++) {
        const a2 = ts + (i / 14) * Math.PI;
        const pz = Math.sin(a2) * (r + w - 0.05) * (front ? 1 : -1);
        parts.push(add(postG, mat.yellow, Math.cos(a2) * (r + w - 0.05), y + 0.55, Math.abs(pz) * (front ? 1 : -1)));
      }
      parts.forEach((m) => { const z = sideOf(m); if (front || z > 0.3) toFront(m); });
    });
  });
  // caged ladder on back-left
  const ladX = -(R + 0.9), ladZ = -1.2;
  const ladRail = new T.CylinderGeometry(0.05, 0.05, 1, 6);
  [[-0.25, 0], [0.25, 0]].forEach(([dz]) => { const l = add(ladRail, mat.steel, ladX, 32, ladZ + dz); l.scale.y = 50; });
  for (let y = 7; y < 57; y += 1.4) { const ring = add(new T.TorusGeometry(0.45, 0.03, 4, 16, Math.PI * 1.3), mat.yellow, ladX - 0.3, y, ladZ); ring.rotation.set(Math.PI / 2, 0, 0.6); }

  // Nozzles & external lines -------------------------------------------------
  const pipeTube = (pts, r, m, segs) => {
    const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.08);
    const mesh = add(new T.TubeGeometry(curve, segs || 160, r, 14, false), m);
    return { curve, mesh };
  };
  const polyCurve = (pts, rad) => { // straight runs with rounded corners
    const P = pts.map((p) => new T.Vector3(p[0], p[1], p[2]));
    const path = new T.CurvePath(); let cur = P[0];
    for (let i = 1; i < P.length; i++) {
      const p = P[i];
      if (i < P.length - 1) {
        const dIn = p.clone().sub(P[i - 1]).normalize(), dOut = P[i + 1].clone().sub(p).normalize();
        const a = p.clone().sub(dIn.multiplyScalar(rad)), b = p.clone().add(dOut.multiplyScalar(rad));
        path.add(new T.LineCurve3(cur, a)); path.add(new T.QuadraticBezierCurve3(a, p.clone(), b)); cur = b;
      } else path.add(new T.LineCurve3(cur, p));
    }
    return path;
  };
  // Flanges are collected here and drawn as one InstancedMesh once every line exists.
  const FLANGES = [];
  const flange = (p, d, r) => FLANGES.push({ p: p.clone(), d: d.clone().normalize(), r });
  // Every line starts and ends at equipment (shell nozzle, tank, barrel, pump or header).
  // Flanged nozzle connections at both ends, and a flanged joint either side of each elbow.
  const line = (pts, r, color, bend) => {
    const curve = polyCurve(pts, bend || 1.1);
    const m = M({ color: 0xc3cad1, metalness: 0.8, roughness: 0.32, emissive: new T.Color(color), emissiveIntensity: 0 });
    const mesh = add(new T.TubeGeometry(curve, Math.max(80, Math.round(curve.getLength() * 3)), r, 16, false), m);
    const P = pts.map((q) => new T.Vector3(q[0], q[1], q[2]));
    const first = FLANGES.length;
    const d0 = P[1].clone().sub(P[0]).normalize(), d1 = P[P.length - 1].clone().sub(P[P.length - 2]).normalize();
    flange(P[0].clone().addScaledVector(d0, 0.4), d0, r);
    flange(P[P.length - 1].clone().addScaledVector(d1, -0.4), d1, r);
    curve.curves.forEach((c) => {
      if (!c.isQuadraticBezierCurve3) return;
      flange(c.v0, c.v1.clone().sub(c.v0), r);
      flange(c.v2, c.v2.clone().sub(c.v1), r);
    });
    // short straight runs between two elbows get one flange at their middle instead of two overlapping
    for (let i = first; i < FLANGES.length; i++) for (let j = i + 1; j < FLANGES.length; j++) {
      if (FLANGES[i].p.distanceTo(FLANGES[j].p) < 0.7) { FLANGES.splice(j, 1); FLANGES.splice(i--, 1); break; } // back-to-back elbows: no flange
    }
    return { curve, mesh, mat: m, color, tint: new T.Color(color) };
  };
  // Short flanged stub where a line meets a vessel (reads as a real nozzle).
  const nozzle = (x, y, z, dir, r, len, m) => {
    const d = new T.Vector3(dir[0], dir[1], dir[2]).normalize();
    const o = add(new T.CylinderGeometry(r, r, len, 16), m || mat.steel, x + d.x * len / 2, y + d.y * len / 2, z + d.z * len / 2);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d);
    return o;
  };
  // Simple centrifugal pump skid: the line rises from its discharge (top of casing).
  const pump = (x, z, y0) => {
    const g = new T.Group(); g.position.set(x, y0, z); root.add(g);
    add(new T.BoxGeometry(1.5, 0.3, 0.85), mat.darkSteel, 0.3, 0.15, 0, g);
    const cas = add(new T.CylinderGeometry(0.38, 0.38, 0.5, 18), mat.steel, 0, 0.72, 0, g); cas.rotation.x = Math.PI / 2;
    const mot = add(new T.CylinderGeometry(0.3, 0.3, 0.8, 16), mat.motor, 0.75, 0.64, 0, g); mot.rotation.z = Math.PI / 2;
    return y0 + 0.95; // discharge height (inside casing top)
  };

  // Charge heater (feed source, far left) — low-poly firebox + convection box + stack
  const heater = new T.Group(); root.add(heater); heater.position.set(-33, 0, 6);
  add(new T.BoxGeometry(6.4, 0.6, 5.2), mat.concrete, 0, 0.3, 0, heater);
  add(new T.BoxGeometry(5, 5.6, 4), mat.darkSteel, 0, 3.4, 0, heater);
  add(new T.BoxGeometry(3, 2, 2.6), mat.steel, 0, 7.2, 0, heater);
  add(new T.CylinderGeometry(0.5, 0.6, 8, 14), mat.darkSteel, 0, 12.2, 0, heater);
  nozzle(-30.5, 1.5, 6, [1, 0, 0], 0.8, 0.35);
  // Feed line from the heater outlet into the flash zone (kept clear of the column plinth)
  const feed = line([[-30.4, 1.5, 6], [-18, 1.5, 6], [-12, 1.5, 0], [-9, 1.5, 0], [-9, Y.feedIn, 0], [-R - 0.1, Y.feedIn, 0]], 0.62, C.feed);
  // LVGO draw (right, upper) → LVGO barrel (ends just inside the drum wall)
  const lvgo = line([[R + 0.05, Y.lvgoTray - 0.3, 0], [8.5, Y.lvgoTray - 0.3, 0], [8.5, 3.0, 0], [8.5, 3.0, 13], [14, 3.0, 13], [14, 3.0, 16.75]], 0.42, C.lvgo);
  // HVGO draw (right, middle) → HVGO barrel
  const hvgo = line([[R + 0.05, Y.hvgoTray - 0.3, 0], [6.6, Y.hvgoTray - 0.3, 0], [6.6, 1.6, 0], [6.6, 1.6, 11.4], [20, 1.6, 11.4], [20, 1.6, 16.75]], 0.46, C.hvgo);
  // Vacuum residue from the boot bottom → bitumen tank inlet nozzle (was ending in mid-air at x=22)
  const resid = line([[RB - 0.2, Y.residOut, 0], [5, Y.residOut, 0], [5, 1.4, 0], [5, 1.4, -4], [20.6, 1.4, -4], [20.6, 2.6, -4], [23.25, 2.6, -4]], 0.55, C.resid, 0.55);
  // Overhead vapor to the vacuum system: drops into the top of the ejector riser
  const vac = line([[0, 59.4, 0], [0, 62, 0], [-6, 62, 0], [-6, 62, -10], [-13.6, 62, -10], [-13.6, 60.6, -10]], 0.7, C.vac, 0.65);
  const streams = { lvgo, hvgo, resid, feed, vac };

  // Return lines (pumparound / reflux) — from pumps on the plinth back into shell nozzles.
  // Line 1 meets the shell at z=-2.5; line 2 jogs to z=-2.2 and runs under the 40 m platform deck.
  const PLINTH = 0.8;
  const pr1 = pump(-8.5, -2.5, PLINTH), pr2 = pump(-7.2, -3.5, PLINTH);
  const shellX = (z, y) => -Math.sqrt(Math.max(0.01, rAt(y) * rAt(y) - z * z)) + 0.08;
  line([[-8.5, pr1, -2.5], [-8.5, Y.lvgoDist + 0.2, -2.5], [shellX(-2.5, Y.lvgoDist + 0.2), Y.lvgoDist + 0.2, -2.5]], 0.32, 0x888888);
  const RET2Y = Y.hvgoDist - 0.6;
  line([[-7.2, pr2, -3.5], [-7.2, RET2Y, -3.5], [-7.2, RET2Y, -2.2], [shellX(-2.2, RET2Y), RET2Y, -2.2]], 0.32, 0x888888, 0.6);

  // Vacuum system package (ejectors) — generic block; riser now stands on the pad and ties into a drum
  const vacPkg = new T.Group(); root.add(vacPkg); vacPkg.position.set(-17, 0, -10);
  add(new T.BoxGeometry(8.6, 0.6, 5), mat.concrete, 0.6, 0.3, 0, vacPkg);
  [-1.5, 1.5].forEach((dx) => { add(new T.CylinderGeometry(0.9, 0.9, 7, 20), mat.pipe, dx, 4.1, 0, vacPkg); });
  add(new T.CylinderGeometry(0.7, 0.7, 60.6 - 0.6, 18), mat.pipe, 3.4, 30.6, 0, vacPkg); // same bore as the overhead line
  const tie = add(new T.CylinderGeometry(0.4, 0.4, 0.7, 14), mat.pipe, 2.55, 6.4, 0, vacPkg); tie.rotation.z = Math.PI / 2;

  // Downstream: bitumen unit (residue destination) — vertical storage vessel + tall column
  const bit = new T.Group(); root.add(bit); bit.position.set(26, 0, -4);
  add(new T.BoxGeometry(7, 0.6, 7), mat.concrete, 0, 0.3, 0, bit);
  const bitMat = M({ color: 0x2b2420, metalness: 0.45, roughness: 0.5, envMap: envTex, envMapIntensity: 0.6, emissive: new T.Color(C.bitumen), emissiveIntensity: 0 });
  const skirtMat = M({ color: 0x15130f, metalness: 0.3, roughness: 0.75, envMap: envTex, envMapIntensity: 0.3 });
  const seamMat = M({ color: 0x4b4540, metalness: 0.55, roughness: 0.6, envMap: envTex, envMapIntensity: 0.5 });
  const colMat = M({ color: 0x9aa2ab, metalness: 0.75, roughness: 0.38, envMap: envTex, envMapIntensity: 0.8 });
  const colSkirtMat = M({ color: 0x3a4048, metalness: 0.5, roughness: 0.65, envMap: envTex, envMapIntensity: 0.4 });
  const headGeo = new T.SphereGeometry(1, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2); // unit hemisphere, scaled per vessel
  const seamGeoT = new T.TorusGeometry(2.42, 0.035, 4, 48), seamGeoC = new T.TorusGeometry(1.12, 0.03, 4, 32);
  const ring = (geo, m, x, y, z) => { const o = add(geo, m, x, y, z, bit); o.rotation.x = Math.PI / 2; o.castShadow = false; return o; };
  // tank: darker skirt 0.6–1.4, shell 1.4–5.6, 2:1 dished head to 6.6
  const TX = -0.5;
  add(new T.CylinderGeometry(2.3, 2.36, 0.8, 32), skirtMat, TX, 1.0, 0, bit);
  add(new T.CylinderGeometry(2.4, 2.4, 4.2, 32), bitMat, TX, 3.5, 0, bit);
  const tHead = add(headGeo, bitMat, TX, 5.6, 0, bit); tHead.scale.set(2.4, 1.0, 2.4);
  ring(seamGeoT, seamMat, TX, 1.42, 0); [2.45, 3.5, 4.55].forEach((y) => ring(seamGeoT, seamMat, TX, y, 0));
  add(new T.CylinderGeometry(0.35, 0.35, 0.3, 14), seamMat, TX + 1.0, 6.25, 0.5, bit); // roof manway
  // column: skirt 0.6–1.6, shell 1.6–8.0, hemispherical head; nudged 0.2 so it no longer intersects the tank
  const CX = 2.6, CZ = 2.0, CW = [26 + CX, -4 + CZ];
  add(new T.CylinderGeometry(1.05, 1.12, 1.0, 24), colSkirtMat, CX, 1.1, CZ, bit);
  add(new T.CylinderGeometry(1.1, 1.1, 6.4, 24), colMat, CX, 4.8, CZ, bit);
  const cHead = add(headGeo, colMat, CX, 8.0, CZ, bit); cHead.scale.set(1.1, 0.55, 1.1);
  [1.62, 3.2, 4.8, 6.4, 7.98].forEach((y) => ring(seamGeoC, mat.steel, CX, y, CZ));
  // top platform (grating + yellow handrail) and caged ladder on the +x side
  const PY = 7.4;
  const deck = add(new T.RingGeometry(1.18, 2.0, 32), mat.grate, CX, PY, CZ, bit); deck.rotation.x = -Math.PI / 2;
  const railGeo = new T.TorusGeometry(1.96, 0.04, 4, 32);
  [0.55, 1.1].forEach((h) => ring(railGeo, mat.yellow, CX, PY + h, CZ));
  const postGeo = new T.CylinderGeometry(0.03, 0.03, 1.1, 5);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add(postGeo, mat.yellow, CX + Math.cos(a) * 1.96, PY + 0.55, CZ + Math.sin(a) * 1.96, bit); }
  const LX = CX + 1.45, rungRail = new T.CylinderGeometry(0.035, 0.035, PY + 1.1 - 0.6, 6);
  [-0.22, 0.22].forEach((dz) => add(rungRail, mat.steel, LX, (PY + 1.1 + 0.6) / 2, CZ + dz, bit));
  const rungGeo = new T.CylinderGeometry(0.02, 0.02, 0.44, 4);
  for (let y = 0.9; y < PY + 1; y += 0.35) { const r0 = add(rungGeo, mat.steel, LX, y, CZ, bit); r0.rotation.x = Math.PI / 2; r0.castShadow = false; }
  const cageGeo = new T.TorusGeometry(0.42, 0.022, 4, 14, Math.PI * 1.2);
  for (let y = 2.6; y < PY + 1.1; y += 0.7) { const c0 = add(cageGeo, mat.yellow, LX + 0.05, y, CZ, bit); c0.rotation.set(Math.PI / 2, 0, -Math.PI * 0.6); c0.castShadow = false; }
  // nozzles where lines connect (flanges come from the shared flange instances)
  nozzle(26 + TX - 2.38, 2.6, -4, [-1, 0, 0], 0.66, 0.3);              // residue inlet
  const VRX = 26.6, VRZ = -4 + Math.sqrt(2.4 * 2.4 - (VRX - 26 - TX) ** 2);
  nozzle(VRX, 2.2, VRZ - 0.05, [0, 0, 1], 0.36, 0.3);                  // product outlet → VR barrel
  nozzle(26 + TX, 6.5, -4, [0, 1, 0], 0.3, 0.3);                       // tank vapour outlet
  nozzle(CW[0], 8.45, CW[1], [0, 1, 0], 0.3, 0.25);                    // column top inlet
  // tank vapour → column top (rises clear of the platform, then drops into the head nozzle)
  line([[26 + TX, 6.5, -4], [26 + TX, 9.4, -4], [26 + TX, 9.4, CW[1]], [CW[0], 9.4, CW[1]], [CW[0], 8.5, CW[1]]], 0.24, 0x888888, 0.4);
  // Product destinations at line ends (simple tanks)
  // GOR product barrels (clickable via HTML tags) — illustrative product yard
  const BZ = 18, BARREL = {};
  add(new T.BoxGeometry(22, 0.3, 5), mat.concrete, 17, 0.15, BZ);
  // VR / bitumen product line: tank outlet → VR barrel (ends just inside the drum wall)
  const VR_LINE = line([[VRX, 2.2, VRZ], [VRX, 2.2, 0.4], [VRX, 1.0, 0.4], [VRX, 1.0, 16.85]], 0.3, C.resid, 0.5);
  VR_LINE.mat.emissiveIntensity = 0.25;

  // Steel oil drums: glossy black painted steel (PBR) with lighter, rougher worn edges on chimes and hoops.
  const drumTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#111214'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { // scuffs concentrate near the top/bottom chimes
      const edge = Math.random() < 0.5 ? Math.random() * 0.12 : 1 - Math.random() * 0.12;
      g.fillStyle = 'rgba(' + (52 + Math.random() * 20 | 0) + ',54,58,' + (0.04 + Math.random() * 0.08).toFixed(2) + ')';
      g.fillRect(Math.random() * w, edge * h, 1 + Math.random() * 9, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.025).toFixed(3) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1, 4 + Math.random() * 18); }
  });
  const drumRough = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = 'rgb(90,90,90)'; g.fillRect(0, 0, w, h); // ≈0.35 × roughness 1
    for (let i = 0; i < 180; i++) {
      const edge = Math.random() < 0.5 ? Math.random() * 0.08 : 1 - Math.random() * 0.08, v = 100 + Math.random() * 16 | 0;
      g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(Math.random() * w, edge * h, 2 + Math.random() * 10, 1 + Math.random() * 3);
    }
  });
  drumRough.encoding = T.LinearEncoding;
  const bGeo = new T.CylinderGeometry(1.45, 1.45, 3.8, 44), ribGeo = new T.TorusGeometry(1.46, 0.09, 8, 44), chimeGeo = new T.TorusGeometry(1.45, 0.08, 8, 44);
  const lidGeo = new T.CylinderGeometry(1.32, 1.32, 0.06, 44), bungGeo = new T.CylinderGeometry(0.2, 0.2, 0.14, 12), bung2Geo = new T.CylinderGeometry(0.13, 0.13, 0.12, 10);
  // metalness 0.6 / roughness ≈0.35 base, plus a thin clear lacquer so the black paint shows real highlights
  const drumBase = { color: 0xffffff, map: drumTex, roughnessMap: drumRough, metalness: 0.6, roughness: 1, clearcoat: 1, clearcoatRoughness: 0.18, envMap: envTex, envMapIntensity: 1.5 };
  const wornMat = M({ color: 0x1b1d20, metalness: 0.55, roughness: 0.62, envMap: envTex, envMapIntensity: 0.24 });
  const lidPaint = M({ color: 0x141518, metalness: 0.6, roughness: 0.38, envMap: envTex, envMapIntensity: 0.9 });
  const lidMat = M({ color: 0x8a9099, metalness: 0.85, roughness: 0.32, envMap: envTex, envMapIntensity: 0.9 });
  [['vdo', 8, 0x4fb3a5], ['lvgo', 14, C.lvgo], ['hvgo', 20, C.hvgo], ['vr', 26, C.resid]].forEach(([k, x, col]) => {
    const g = new T.Group(); root.add(g); g.position.set(x, 0.3, BZ);
    // product colour only as a faint emissive cue while that product is in focus (labels carry identity)
    const bm = new T.MeshPhysicalMaterial(Object.assign({ emissive: new T.Color(col), emissiveIntensity: 0 }, drumBase));
    const body = add(bGeo, bm, 0, 1.9, 0, g); body.castShadow = true;
    [0.45, 1.33, 2.47, 3.35].forEach((y) => { const r = add(ribGeo, wornMat, 0, y, 0, g); r.rotation.x = Math.PI / 2; r.castShadow = false; });
    // rolled chimes wrap the body's top and bottom edges (the edge sits inside the tube: no visible seam)
    [0.0, 3.8].forEach((y) => { const r = add(chimeGeo, wornMat, 0, y, 0, g); r.rotation.x = Math.PI / 2; r.castShadow = false; });
    add(lidGeo, lidPaint, 0, 3.82, 0, g);
    add(bungGeo, lidMat, 0.7, 3.9, 0.25, g);
    add(bung2Geo, lidMat, -0.78, 3.88, -0.3, g);
    BARREL[k] = { g, mat: bm };
  });

  // ---------- Internals (back half sections + cut faces) ----------
  const internals = new T.Group(); root.add(internals);
  const halfCyl = (r, h, y, m) => { const g = new T.CylinderGeometry(r, r, h, 48, 1, false, Math.PI / 2, Math.PI); return add(g, m, 0, y + h / 2, 0, internals); };
  const cutFace = (w, h, y, m, z) => { const o = add(new T.PlaneGeometry(w, h), m, 0, y + h / 2, z || 0.01, internals); o.castShadow = false; return o; };
  const zoneMeshes = {};
  function bed(y0, y1, name) {
    const r = R - 0.16, h = y1 - y0;
    const side = halfCyl(r, h, y0, mat.packSide);
    const face = cutFace(r * 2, h, y0, mat.pack.clone());
    face.material.map = packTex.clone(); face.material.map.needsUpdate = true; face.material.map.repeat.set(2, Math.max(1, h / 1.5));
    face.material.emissive = new T.Color(0x000000); face.material.emissiveIntensity = 1;
    zoneMeshes[name] = face;
    // support grid + hold-down
    [y0 - 0.12, y1 + 0.05].forEach((yy) => { const g = halfCyl(r, 0.12, yy, mat.darkSteel); g.castShadow = false; });
    return face;
  }
  function collector(y, name, color) {
    const r = R - 0.16;
    const plate = add(new T.CircleGeometry(r, 48, 0, Math.PI), mat.tray, 0, y, 0, internals); plate.rotation.x = -Math.PI / 2;
    // liquid pool (product colour)
    const poolMat = new T.MeshStandardMaterial({ color, emissive: new T.Color(color), emissiveIntensity: 0.15, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.85 });
    const pool = add(new T.CircleGeometry(r - 0.05, 48, 0, Math.PI), poolMat, 0, y + 0.14, 0, internals); pool.rotation.x = -Math.PI / 2; pool.castShadow = false;
    // chimneys with hats
    const chimG = new T.BoxGeometry(0.55, 1.0, 0.55), hatG = new T.BoxGeometry(0.85, 0.08, 0.85);
    [[-2.4, -1.2], [0, -1.6], [2.4, -1.2], [-1.2, -3.0], [1.2, -3.0]].forEach(([x, z]) => { add(chimG, mat.steel, x, y + 0.5, z, internals); add(hatG, mat.steel, x, y + 1.15, z, internals); });
    // cut edge of tray
    const edge = add(new T.BoxGeometry(r * 2, 0.12, 0.12), mat.cutEdge, 0, y, 0.02, internals); edge.castShadow = false;
    // draw sump towards the outlet (+x)
    add(new T.BoxGeometry(1.2, 0.8, 1.6), mat.tray, r - 0.7, y - 0.4, -0.9, internals);
    zoneMeshes[name] = pool;
    return pool;
  }
  function distributor(y) {
    const r = R - 0.4;
    const hdr = add(new T.CylinderGeometry(0.16, 0.16, r * 2, 10), mat.pipe, 0, y, -0.6, internals); hdr.rotation.z = Math.PI / 2;
    [-2.6, -1.3, 0, 1.3, 2.6].forEach((x) => { const arm = add(new T.CylinderGeometry(0.08, 0.08, Math.sqrt(Math.max(0.1, r * r - x * x)) * 0.95, 8), mat.pipe, x, y, -0.6 - Math.sqrt(Math.max(0.1, r * r - x * x)) * 0.47, internals); arm.rotation.x = Math.PI / 2; });
  }
  function sieveTrays(y0, y1) {
    const r = R - 0.16; let k = 0;
    for (let y = y0; y <= y1; y += 1.4) {
      const plate = add(new T.CircleGeometry(r, 40, 0, Math.PI), mat.tray, 0, y, 0, internals); plate.rotation.x = -Math.PI / 2;
      // downcomer alternating sides
      const side = k++ % 2 ? 1 : -1;
      add(new T.BoxGeometry(0.08, 1.1, r * 0.9), mat.tray, side * (r - 1.0), y - 0.55, -r * 0.45, internals);
      add(new T.BoxGeometry(r * 2, 0.08, 0.08), mat.cutEdge, 0, y, 0.02, internals);
    }
  }
  bed(Y.lvgoBed[0], Y.lvgoBed[1], 'lvgoBed');
  bed(Y.hvgoBed[0], Y.hvgoBed[1], 'hvgoBed');
  bed(Y.wash[0], Y.wash[1], 'washBed');
  collector(Y.lvgoTray, 'lvgoPool', C.lvgo);
  collector(Y.hvgoTray, 'hvgoPool', C.hvgo);
  distributor(Y.lvgoDist); distributor(Y.hvgoDist); distributor(Y.washDist);
  sieveTrays(Y.strip[0], Y.strip[1]);
  // demister pad near the top
  const dem = halfCyl(RT - 0.2, 0.5, Y.demister, mat.packSide); dem.castShadow = false;
  cutFace((RT - 0.2) * 2, 0.5, Y.demister, mat.pack);
  // flash zone: tangential feed horn / vapor horn
  const horn = add(new T.TorusGeometry(R - 0.9, 0.28, 8, 40, Math.PI), mat.steel, 0, Y.feedIn, 0, internals); horn.rotation.set(Math.PI / 2, 0, Math.PI);
  // bottom residue liquid in boot
  const residMat = new T.MeshStandardMaterial({ color: 0x140806, emissive: new T.Color(0x4a120c), emissiveIntensity: 0.1, metalness: 0.3, roughness: 0.06 });
  const residLiquid = halfCyl(RB - 0.15, Y.residLevel - 6.3, 6.3, residMat); residLiquid.castShadow = false;
  const residTop = add(new T.CircleGeometry(RB - 0.15, 40, 0, Math.PI), residMat, 0, Y.residLevel, 0, internals); residTop.rotation.x = -Math.PI / 2;
  const residFace = cutFace((RB - 0.15) * 2, Y.residLevel - 6.3, 6.3, residMat);
  zoneMeshes.resid = residTop;
  // vortex breaker / outlet stub inside
  add(new T.BoxGeometry(1.2, 0.5, 1.2), mat.steel, 1.2, 6.6, -0.9, internals);

  // Zone highlight bands (additive glow inside the shell)
  const zoneBand = (y0, y1, color, rad) => {
    const m = new T.MeshBasicMaterial({ color, map: glowTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    const o = new T.Mesh(new T.CylinderGeometry(rad || R - 0.22, rad || R - 0.22, y1 - y0, 48, 1, true, Math.PI / 2, Math.PI), m);
    o.position.y = (y0 + y1) / 2; internals.add(o); return m;
  };
  const bands = {
    lvgo: zoneBand(Y.lvgoTray - 0.3, Y.lvgoBed[1] + 0.3, C.lvgo),
    hvgo: zoneBand(Y.hvgoTray - 0.3, Y.hvgoBed[1] + 0.3, C.hvgo),
    resid: zoneBand(6.2, Y.residLevel + 0.6, C.resid, RB - 0.2),
    flash: zoneBand(Y.flash - 1.4, Y.flash + 1.4, C.feed),
  };

  // ---------- Particle systems ----------
  const pointsMat = (color, size) => new T.PointsMaterial({ color, size, map: dotTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
  function cloud(n, color, size, init) {
    const g = new T.BufferGeometry(); const pos = new Float32Array(n * 3); const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { seed[i] = Math.random(); init(i, pos, seed[i]); }
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    const m = pointsMat(color, size); const pts = new T.Points(g, m); pts.frustumCulled = false; scene.add(pts);
    return { g, pos, seed, m, n };
  }
  const randInHalfDisk = (r) => { const a = Math.PI / 2 + Math.random() * Math.PI, d = Math.sqrt(Math.random()) * r; return [Math.sin(a) * d, Math.cos(a) * d]; };
  const NV = isMobile ? 500 : 1400, NL = isMobile ? 380 : 900, NF = isMobile ? 160 : 320, NS = isMobile ? 110 : 220;
  const vapor = cloud(NV, C.vapor, 0.22, (i, p) => { const q = randInHalfDisk(R - 0.4); p[i * 3] = q[0]; p[i * 3 + 1] = Y.flash + Math.random() * (52 - Y.flash); p[i * 3 + 2] = q[1]; });
  const liquid = cloud(NL, C.liquid, 0.17, (i, p) => { const q = randInHalfDisk(R - 0.4); p[i * 3] = q[0]; p[i * 3 + 1] = Y.strip[0] + Math.random() * (Y.lvgoDist - Y.strip[0]); p[i * 3 + 2] = q[1]; });
  const feedP = cloud(NF, C.feed, 0.3, (i, p) => { p[i * 3] = -R; p[i * 3 + 1] = Y.feedIn; p[i * 3 + 2] = 0; });
  const streamP = {};
  ['feed', 'lvgo', 'hvgo', 'resid', 'vac'].forEach((k) => {
    const s = streams[k]; const L = s.curve.getLength();
    streamP[k] = cloud(Math.round(NS * clamp(L / 40, 0.6, 1.6)), s.color, k === 'vac' ? 0.34 : 0.4, (i, p) => { p[i * 3] = 0; p[i * 3 + 1] = -100; p[i * 3 + 2] = 0; });
    streamP[k].curve = s.curve;
  });
  const tmpV = new T.Vector3();

  function stepParticles(dt, time, vis) {
    // vapor rising (speeds up in beds), slight swirl
    if (vis.vapor > 0.01) {
      const p = vapor.pos;
      for (let i = 0; i < vapor.n; i++) {
        const s = vapor.seed[i]; let y = p[i * 3 + 1] + dt * (2.2 + s * 2.4);
        if (y > 52.5) { y = Y.flash + Math.random() * 1.5; const q = randInHalfDisk(R - 0.5); p[i * 3] = q[0]; p[i * 3 + 2] = q[1]; }
        const rr = rAt(y) - 0.35; let x = p[i * 3] + Math.sin(time * 1.3 + s * 40) * dt * 0.35, z = p[i * 3 + 2];
        const d = Math.hypot(x, z); if (d > rr) { x *= rr / d; z *= rr / d; } if (z > -0.05) z = -0.05 - s * 0.3;
        p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
      }
      vapor.g.attributes.position.needsUpdate = true;
    }
    if (vis.liquid > 0.01) {
      const p = liquid.pos;
      for (let i = 0; i < liquid.n; i++) {
        const s = liquid.seed[i]; let y = p[i * 3 + 1] - dt * (1.4 + s * 2.2);
        if (y < Y.strip[0]) { y = Y.lvgoDist - Math.random() * 0.4; const q = randInHalfDisk(R - 0.6); p[i * 3] = q[0]; p[i * 3 + 2] = q[1]; }
        p[i * 3 + 1] = y;
      }
      liquid.g.attributes.position.needsUpdate = true;
    }
    if (vis.feed > 0.01) {
      // feed: travels in along the horn then flashes (spreads outward/up)
      const p = feedP.pos;
      for (let i = 0; i < feedP.n; i++) {
        const s = feedP.seed[i]; const t = (time * 0.35 + s) % 1;
        const a = Math.PI * (1.5 - t * 1.0);
        const rr = (R - 0.9) * (1 - t * 0.15);
        p[i * 3] = Math.sin(a) * rr * (t < 0.08 ? 1 : 1) + (t < 0.08 ? -(1 - t / 0.08) * 0.0 : 0);
        p[i * 3 + 2] = Math.min(-0.05, Math.cos(a) * rr);
        p[i * 3 + 1] = Y.feedIn + (s - 0.5) * 0.6 + t * t * 2.2 * (s > 0.5 ? 1 : -0.6);
      }
      feedP.g.attributes.position.needsUpdate = true;
    }
    Object.keys(streamP).forEach((k) => {
      const sp = streamP[k]; if (vis[k] < 0.01) return; const p = sp.pos;
      for (let i = 0; i < sp.n; i++) {
        const u = (time * (k === 'resid' ? 0.045 : 0.07) + sp.seed[i]) % 1;
        sp.curve.getPointAt(u, tmpV);
        const j = (sp.seed[i] * 97) % 1 - 0.5;
        p[i * 3] = tmpV.x + j * 0.25; p[i * 3 + 1] = tmpV.y + ((sp.seed[i] * 53) % 1 - 0.5) * 0.25; p[i * 3 + 2] = tmpV.z + ((sp.seed[i] * 31) % 1 - 0.5) * 0.25;
      }
      sp.g.attributes.position.needsUpdate = true;
    });
  }


  // ---------- Extra internal detail ----------
  const detailMat = { beam: M({ color: 0x4b525b, metalness: 0.7, roughness: 0.5 }), orange: M({ color: 0xe8762a, metalness: 0.3, roughness: 0.5 }), gauge: M({ color: 0xe9edf1, metalness: 0.2, roughness: 0.4 }) };
  // bed support beams (I-beams under each bed) + hold-down grid rods on top
  [[Y.lvgoBed[0], Y.lvgoBed[1]], [Y.hvgoBed[0], Y.hvgoBed[1]], [Y.wash[0], Y.wash[1]]].forEach(([y0, y1]) => {
    [-1.0, -2.4, -3.4].forEach((z) => {
      const half = Math.sqrt(Math.max(0.2, (R - 0.2) ** 2 - z * z));
      const web = add(new T.BoxGeometry(half * 2, 0.34, 0.06), detailMat.beam, 0, y0 - 0.32, z, internals); web.castShadow = false;
      add(new T.BoxGeometry(half * 2, 0.05, 0.26), detailMat.beam, 0, y0 - 0.14, z, internals).castShadow = false;
      add(new T.BoxGeometry(half * 2, 0.05, 0.26), detailMat.beam, 0, y0 - 0.5, z, internals).castShadow = false;
    });
    for (let x = -3.4; x <= 3.4; x += 0.85) {
      const len = Math.sqrt(Math.max(0.2, (R - 0.25) ** 2 - x * x));
      const rod = add(new T.CylinderGeometry(0.03, 0.03, len, 5), mat.steel, x, y1 + 0.18, -len / 2, internals); rod.rotation.x = Math.PI / 2; rod.castShadow = false;
    }
  });
  // trough-type liquid distributors under the headers (parting box + troughs)
  [Y.lvgoDist, Y.hvgoDist].forEach((y) => {
    add(new T.BoxGeometry(1.4, 0.45, 2.6), mat.tray, 0, y - 0.25, -1.5, internals);
    [-3, -1.8, -0.6, 0.6, 1.8, 3].forEach((x) => {
      const len = Math.sqrt(Math.max(0.2, (R - 0.3) ** 2 - x * x));
      add(new T.BoxGeometry(0.32, 0.34, len), mat.tray, x, y - 0.55, -len / 2, internals).castShadow = false;
    });
  });
  // wash-oil spray nozzles with spray cones
  const sprayMat = new T.MeshBasicMaterial({ color: 0xf2a53a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  [[-2.6, -1.2], [0, -1.2], [2.6, -1.2], [-1.3, -3.0], [1.3, -3.0]].forEach(([x, z]) => {
    add(new T.CylinderGeometry(0.06, 0.12, 0.25, 8), mat.steel, x, Y.washDist - 0.25, z, internals);
    const cone = new T.Mesh(new T.ConeGeometry(0.9, 1.3, 20, 1, true), sprayMat); cone.position.set(x, Y.washDist - 1.0, z); internals.add(cone);
  });
  // vapor horn baffle above the feed inlet + inlet pipe through the wall
  const baffle = add(new T.RingGeometry(R - 1.6, R - 0.2, 40, 1, 0, Math.PI), mat.tray, 0, Y.feedIn + 0.95, 0, internals); baffle.rotation.x = -Math.PI / 2;
  const inlet = add(new T.CylinderGeometry(0.45, 0.45, 1.6, 16), mat.steel, -R + 0.6, Y.feedIn, -0.4, internals); inlet.rotation.z = Math.PI / 2;
  for (let k = 0; k < 7; k++) { const a = Math.PI * (0.55 + k * 0.13); add(new T.BoxGeometry(0.5, 0.08, 0.18), mat.darkSteel, Math.sin(a) * (R - 0.9), Y.feedIn - 0.3, Math.min(-0.1, Math.cos(a) * (R - 0.9)), internals); }
  // stripping-steam sparger below the trays + steam inlet nozzle
  const sparger = add(new T.TorusGeometry(R - 1.2, 0.12, 8, 40, Math.PI), mat.steel, 0, Y.strip[0] - 0.9, 0, internals); sparger.rotation.set(-Math.PI / 2, 0, 0);
  for (let k = 0; k < 12; k++) { const a = Math.PI * (k + 0.5) / 12; add(new T.CylinderGeometry(0.04, 0.04, 0.2, 5), mat.steel, Math.cos(a) * (R - 1.2), Y.strip[0] - 0.75, -Math.sin(a) * (R - 1.2), internals); }
  // steam supply: utility station on the plinth → riser → sparger nozzle on the boot cone
  add(new T.BoxGeometry(0.9, 1.1, 0.9), mat.darkSteel, -6.7, PLINTH + 0.55, -1.4);
  const steamIn = line([[-6.7, PLINTH + 1.0, -1.4], [-6.7, Y.strip[0] - 0.9, -1.4], [shellX(-1.4, Y.strip[0] - 0.9), Y.strip[0] - 0.9, -1.4]], 0.18, 0xcfd8e2);
  // manways on the back wall (bolted covers seen from inside)
  [22.6, 30.2, 37.6, 45.0, 55.0].forEach((y) => {
    const rr = rAt(y) - 0.2;
    const ring = add(new T.TorusGeometry(0.62, 0.09, 8, 28), mat.steel, 0, y, -rr + 0.06, internals); ring.castShadow = false;
    add(new T.CircleGeometry(0.58, 28), mat.darkSteel, 0, y, -rr + 0.02, internals).castShadow = false;
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; add(new T.SphereGeometry(0.04, 5, 4), mat.steel, Math.cos(a) * 0.72, y + Math.sin(a) * 0.72, -rr + 0.08, internals); }
  });
  // thermowells along the back-left wall (+ external transmitter heads)
  [21.5, 27.8, 30.6, 34.6, 38.2, 42.6, 46.0, 52.0].forEach((y) => {
    const rr = rAt(y); const a = Math.PI * 1.25, cx = Math.sin(a), cz = Math.cos(a);
    const tw = add(new T.CylinderGeometry(0.05, 0.05, 1.3, 6), mat.steel, cx * (rr - 0.6), y, cz * (rr - 0.6), internals); tw.rotation.z = Math.PI / 2; tw.rotation.y = -a + Math.PI / 2;
    add(new T.SphereGeometry(0.07, 6, 5), detailMat.orange, cx * (rr - 1.25), y, cz * (rr - 1.25), internals);
    add(new T.BoxGeometry(0.28, 0.28, 0.28), detailMat.gauge, cx * (rr + 0.45), y, cz * (rr + 0.45));
  });
  // level bridle on the boot (external) with transmitters
  const brX = -(RB + 1.3);
  add(new T.CylinderGeometry(0.16, 0.16, 7.2, 10), mat.pipe, brX, 10.2, 0.6);
  [7.2, 13.2].forEach((y) => { const c = add(new T.CylinderGeometry(0.1, 0.1, 1.4, 8), mat.pipe, brX + 0.7, y, 0.6); c.rotation.z = Math.PI / 2; });
  [9.0, 11.6].forEach((y) => { add(new T.BoxGeometry(0.45, 0.6, 0.35), detailMat.gauge, brX - 0.35, y, 0.6); add(new T.CylinderGeometry(0.2, 0.2, 0.12, 14), detailMat.orange, brX - 0.35, y + 0.42, 0.6); });
  // pressure transmitter at the top + overhead outlet nozzle inside
  add(new T.BoxGeometry(0.4, 0.5, 0.35), detailMat.gauge, RT + 0.5, 56.6, 0.8);
  add(new T.CylinderGeometry(0.75, 0.75, 1.2, 20), mat.steel, 0, 58.6, -0.2, internals);
  // pumparound return stubs into the distributor headers
  [Y.lvgoDist + 0.2, RET2Y].forEach((y) => { const st = add(new T.CylinderGeometry(0.22, 0.22, 1.2, 12), mat.pipe, -R + 0.55, y, -1.6, internals); st.rotation.z = Math.PI / 2; });

  // liquid film trickling down the packed-bed cut faces (animated streak texture)
  const streakTex = canvasTex(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w, y = Math.random() * h, L = 20 + Math.random() * 70;
      const gr = g.createLinearGradient(0, y, 0, y + L); gr.addColorStop(0, 'rgba(255,190,90,0)'); gr.addColorStop(0.7, 'rgba(255,190,90,.9)'); gr.addColorStop(1, 'rgba(255,230,170,1)');
      g.fillStyle = gr; g.fillRect(x, y, 1.6, L);
    }
  }, [3, 1]);
  const filmMat = new T.MeshBasicMaterial({ map: streakTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
  [[Y.lvgoBed[0], Y.lvgoBed[1]], [Y.hvgoBed[0], Y.hvgoBed[1]], [Y.wash[0], Y.wash[1]]].forEach(([y0, y1]) => {
    const f = new T.Mesh(new T.PlaneGeometry((R - 0.2) * 2, y1 - y0), filmMat); f.position.set(0, (y0 + y1) / 2, 0.04); internals.add(f);
  });

  // steam bubbles rising through the stripping trays
  const steamP = cloud(isMobile ? 120 : 280, 0xdfe9f5, 0.16, (i, p) => { const q = randInHalfDisk(R - 0.6); p[i * 3] = q[0]; p[i * 3 + 1] = Y.strip[0] - 0.8 + Math.random() * 6.6; p[i * 3 + 2] = q[1]; });

  // internal part labels (shown while travelling inside)
  const PARTS = [
    ['Demister pad', [-1.6, 54.1, -0.8]], ['Overhead vapor outlet', [0, 58.9, -0.6]],
    ['Pumparound distributor', [-2.2, Y.lvgoDist + 0.25, -0.6]], ['LVGO packed bed', [-2.6, 45.0, 0.05]], ['Chimney collector tray', [-2.2, Y.lvgoTray + 1.3, -1.2]],
    ['Bed support beams', [2.2, Y.hvgoBed[0] - 0.3, -1.0]], ['HVGO packed bed', [-2.6, 37.4, 0.05]], ['Collector tray · draw sump', [2.6, Y.hvgoTray + 0.2, -0.9]],
    ['Wash-oil spray nozzles', [-2.4, Y.washDist - 0.6, -1.2]], ['Wash bed', [-2.6, 29.8, 0.05]], ['Vapor horn · flash zone', [-2.6, Y.feedIn + 0.4, -1.4]],
    ['Stripping trays', [-2.6, 22.6, 0.05]], ['Steam sparger', [-2.2, Y.strip[0] - 0.7, -1.6]], ['Manway', [0, 37.6 + 0.95, -3.8]], ['Thermowells', [-2.3, 38.4, -2.3]],
    ['Liquid level', [-0.8, Y.residLevel + 0.3, -0.6]], ['Vortex breaker', [1.2, 7.2, -0.9]], ['Level instruments', [brX - 0.35, 12.4, 0.6]],
  ].map(([name, p]) => {
    const el = document.createElement('div'); el.className = 'tag mini'; el.innerHTML = '<span></span><i></i>'; el.firstChild.textContent = tr(name); el._name = name;
    STAGE.appendChild(el);
    return { el, p: new T.Vector3(p[0], p[1], p[2]), boot: p[1] < 14 };
  });
  function placeParts(pIn, pBoot) {
    const w = SW(), h = SH();
    PARTS.forEach((L) => {
      const o = L.boot ? pBoot : pIn;
      const d = camera.position.distanceTo(L.p);
      const fade = o * (1 - smooth(16, 22, d));
      if (fade < 0.02) { L.el.style.visibility = 'hidden'; return; }
      proj.copy(L.p).project(camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 0.95 && Math.abs(proj.y) < 0.92 && !(isMobile && proj.y < -0.2);
      L.el.style.visibility = vis ? 'visible' : 'hidden';
      L.el.style.opacity = fade.toFixed(2);
      L.el.style.transform = 'translate(' + ((proj.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - proj.y) / 2 * h).toFixed(1) + 'px) translate(-50%,-100%)';
    });
  }

  // ---------- Pipe flanges (one InstancedMesh for every line) ----------
  {
    const fGeo = new T.CylinderGeometry(1, 1, 1, 20);
    const fMesh = new T.InstancedMesh(fGeo, mat.steel, FLANGES.length);
    const o = new T.Object3D(), up = new T.Vector3(0, 1, 0);
    FLANGES.forEach((f, i) => {
      o.position.copy(f.p); o.quaternion.setFromUnitVectors(up, f.d); o.scale.set(f.r * 1.55, 0.16, f.r * 1.55);
      o.updateMatrix(); fMesh.setMatrixAt(i, o.matrix);
    });
    fMesh.castShadow = true; fMesh.receiveShadow = true; root.add(fMesh);
  }

  // ---------- 3D labels ----------
  const labelEls = {};
  [['vdo', [8, 4.3, BZ]], ['lvgo', [14, 4.3, BZ]], ['hvgo', [20, 4.3, BZ]], ['resid', [26, 4.3, BZ]], ['bitumen', [26, 10.5, -4]], ['feed', [-26, 3.4, 6]], ['vac', [-14, 64.5, -10]]].forEach(([k, p]) => {
    const el = qs('[data-label="' + k + '"]'); if (el) labelEls[k] = { el, p: new T.Vector3(p[0], p[1], p[2]) };
  });
  const proj = new T.Vector3();
  const LSTATE = {};
  function placeLabels(op) {
    const w = SW(), h = SH();
    Object.keys(labelEls).forEach((k) => {
      const L = labelEls[k]; const o = op[k] || 0;
      if (o < 0.01) { L.el.style.opacity = '0'; L.el.style.visibility = 'hidden'; LSTATE[k] = 0; return; }
      proj.copy(L.p).project(camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05;
      LSTATE[k] = vis ? [+proj.x.toFixed(4), +proj.y.toFixed(4), +o.toFixed(2)] : 0;
      L.el.style.visibility = vis ? 'visible' : 'hidden';
      L.el.style.opacity = o.toFixed(2);
      L.el.style.transform = 'translate(' + ((proj.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - proj.y) / 2 * h).toFixed(1) + 'px) translate(-50%,-100%)';
    });
  }

  // ---------- Post-processing (bloom) ----------
  let composer = null, bloom = null;
  if (!isMobile && T.EffectComposer && T.UnrealBloomPass) {
    composer = new T.EffectComposer(renderer);
    composer.addPass(new T.RenderPass(scene, camera));
    bloom = new T.UnrealBloomPass(new T.Vector2(SW(), SH()), 0.55, 0.6, 0.82);
    composer.addPass(bloom);
  }

  // ---------- Camera path ----------
  const V = (a) => new T.Vector3(a[0], a[1], a[2]);
  const KP = KEYS.map((k) => ({ p: k.p, pos: V(k.pos), tgt: V(k.tgt) }));
  const cr = (a, b, c, d, t) => { // centripetal-ish Catmull-Rom (uniform)
    const t2 = t * t, t3 = t2 * t;
    return new T.Vector3().addScaledVector(a, -0.5 * t3 + t2 - 0.5 * t).addScaledVector(b, 1.5 * t3 - 2.5 * t2 + 1).addScaledVector(c, -1.5 * t3 + 2 * t2 + 0.5 * t).addScaledVector(d, 0.5 * t3 - 0.5 * t2);
  };
  function camAt(p) {
    let i = 0; while (i < KP.length - 2 && p > KP[i + 1].p) i++;
    const a = KP[Math.max(0, i - 1)], b = KP[i], c = KP[i + 1], d = KP[Math.min(KP.length - 1, i + 2)];
    let t = clamp((p - b.p) / Math.max(1e-6, c.p - b.p), 0, 1);
    t = t * t * (3 - 2 * t) * 0.5 + t * 0.5; // gentle ease inside each leg
    return { pos: cr(a.pos, b.pos, c.pos, d.pos, t), tgt: cr(a.tgt, b.tgt, c.tgt, d.tgt, t) };
  }

  // ---------- Resize ----------
  function resize() {
    const w = SW(), h = SH();
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 52 : 38; camera.updateProjectionMatrix();
    if (composer) { composer.setSize(w, h); bloom.setSize(w, h); }
  }
  addEventListener('resize', resize); cleanup.push(() => removeEventListener('resize', resize)); resize();

  // ---------- Per-frame state from progress ----------
  const colTmp = new T.Color();
  const SILVER = new T.Color(0xc3cad1);
  function apply(p, time, dt) {
    const c = camAt(p); camera.position.copy(c.pos); camera.lookAt(c.tgt);
    // gentle handheld drift
    if (!reduceMotion) { camera.position.x += Math.sin(time * 0.31) * 0.06; camera.position.y += Math.sin(time * 0.23) * 0.05; }

    // cutaway: front shell fades 0.15→0.25, partially returns in final overview
    const cut = smooth(0.15, 0.25, p) * (1 - 0.62 * smooth(0.86, 0.97, p));
    const fo = 1 - cut;
    frontMats.forEach((m) => { m.opacity = fo; m.depthWrite = fo > 0.98; });
    frontShell.visible = fo > 0.01; frontGroup.visible = fo > 0.01;
    edgeObjs.forEach((e) => { e.visible = cut > 0.02; });
    internals.visible = cut > 0.01;
    inner.intensity = 2.4 * cut; inner2.intensity = 1.6 * cut;

    // flows
    const vis = {
      vapor: smooth(0.27, 0.33, p) * (1 - 0.7 * smooth(0.5, 0.56, p)) * (1 - 0.3 * smooth(0.84, 0.9, p)),
      liquid: smooth(0.33, 0.39, p) * (1 - 0.7 * smooth(0.5, 0.56, p)) * (1 - 0.3 * smooth(0.84, 0.9, p)),
      feed: band(0.27, 0.31, 0.48, 0.53, p) + 0.6 * smooth(0.86, 0.92, p),
      lvgo: smooth(0.51, 0.56, p),
      hvgo: smooth(0.61, 0.65, p),
      resid: smooth(0.71, 0.75, p),
      vac: smooth(0.86, 0.92, p),
    };
    vis.feed = clamp(vis.feed, 0, 1);
    vapor.m.opacity = 0.55 * vis.vapor; liquid.m.opacity = 0.75 * vis.liquid; feedP.m.opacity = 0.9 * vis.feed;
    streamP.feed.m.opacity = 0.9 * clamp(band(0.27, 0.31, 0.48, 0.53, p) + smooth(0.86, 0.92, p), 0, 1);
    ['lvgo', 'hvgo', 'resid', 'vac'].forEach((k) => { streamP[k].m.opacity = 0.95 * vis[k]; });
    const focusPre = { lvgo: band(0.5, 0.53, 0.6, 0.63, p), hvgo: band(0.61, 0.64, 0.7, 0.73, p) };
    stepParticles(Math.min(dt, 0.05), time, Object.assign({}, vis, { feed: Math.max(vis.feed, streamP.feed.m.opacity) }));
    // steam, liquid film, sprays
    const inside = smooth(0.27, 0.31, p) * (1 - smooth(0.52, 0.57, p)) + 0.35 * smooth(0.86, 0.92, p);
    steamP.m.opacity = 0.5 * inside;
    if (inside > 0.01) {
      const sp = steamP.pos;
      for (let i = 0; i < steamP.n; i++) { let y = sp[i * 3 + 1] + Math.min(dt, 0.05) * (1.2 + steamP.seed[i] * 1.6); if (y > Y.strip[1] + 1.2) { y = Y.strip[0] - 0.8; const q = randInHalfDisk(R - 0.6); sp[i * 3] = q[0]; sp[i * 3 + 2] = q[1]; } sp[i * 3 + 1] = y; }
      steamP.g.attributes.position.needsUpdate = true;
    }
    filmMat.opacity = 0.55 * Math.max(inside, 0.6 * Math.max(focusPre.lvgo, focusPre.hvgo));
    streakTex.offset.y = (streakTex.offset.y + Math.min(dt, 0.05) * 0.35) % 1;
    sprayMat.opacity = 0.16 * inside * (0.8 + 0.2 * Math.sin(time * 6));
    steamIn.mat.emissiveIntensity = 0.4 * inside;

    // stream focus (current product highlighted, others dimmed during scene 4)
    const focus = { lvgo: band(0.5, 0.53, 0.6, 0.63, p), hvgo: band(0.61, 0.64, 0.7, 0.73, p), resid: band(0.71, 0.74, 0.83, 0.86, p) };
    const finalAll = smooth(0.86, 0.93, p);
    const glowOf = (k) => clamp(Math.max(focus[k] || 0, finalAll * 0.6, (k === 'feed' ? band(0.27, 0.31, 0.48, 0.53, p) : 0)), 0, 1);
    ['lvgo', 'hvgo', 'resid', 'feed', 'vac'].forEach((k) => {
      const g = k === 'vac' ? finalAll : glowOf(k);
      streams[k].mat.emissiveIntensity = 0.45 * g;
      streams[k].mat.color.copy(SILVER).lerp(streams[k].tint, 0.75 * g);
    });
    bands.lvgo.opacity = 0.55 * focus.lvgo + 0.12 * finalAll * cut;
    bands.hvgo.opacity = 0.55 * focus.hvgo + 0.12 * finalAll * cut;
    bands.resid.opacity = 0.6 * focus.resid + 0.12 * finalAll * cut;
    bands.flash.opacity = 0.45 * band(0.27, 0.3, 0.37, 0.42, p);
    zoneMeshes.lvgoPool.material.emissiveIntensity = 0.15 + 1.2 * focus.lvgo;
    zoneMeshes.hvgoPool.material.emissiveIntensity = 0.15 + 1.2 * focus.hvgo;
    residMat.emissiveIntensity = 0.1 + 0.7 * focus.resid;
    ['lvgoBed', 'hvgoBed'].forEach((k) => { const f = k === 'lvgoBed' ? focus.lvgo : focus.hvgo; colTmp.set(k === 'lvgoBed' ? C.lvgo : C.hvgo).multiplyScalar(0.35 * f); zoneMeshes[k].material.emissive.copy(colTmp); });
    const yard = band(0.84, 0.875, 0.93, 0.955, p);
    // black drums: only a faint product-colour cue while that product is in focus
    BARREL.lvgo.mat.emissiveIntensity = 0.12 * focus.lvgo;
    BARREL.hvgo.mat.emissiveIntensity = 0.12 * focus.hvgo;
    BARREL.vr.mat.emissiveIntensity = 0.12 * focus.resid;
    BARREL.vdo.mat.emissiveIntensity = 0;
    bitMat.emissiveIntensity = 0.5 * band(0.76, 0.8, 0.84, 0.88, p) + 0.2 * finalAll;

    // flare flicker
    const f = 1 + Math.sin(time * 9) * 0.07 + Math.sin(time * 23) * 0.04; flare.scale.set(f, 1 + Math.sin(time * 6) * 0.1, f);

    placeParts(smooth(0.275, 0.3, p) * (1 - smooth(0.5, 0.53, p)), band(0.72, 0.75, 0.8, 0.83, p));
    // labels
    placeLabels({
      vdo: yard, lvgo: yard, hvgo: yard, resid: yard,
      bitumen: clamp(band(0.76, 0.79, 0.84, 0.87, p) + finalAll, 0, 1), feed: band(0.28, 0.31, 0.36, 0.4, p), vac: finalAll,
    });
  }

  // ---------- Barrel hit-testing: tap / click a drum to open its product page ----------
  // The drums are WebGL meshes, so they need a raycast; the HTML tags above them are hidden
  // on phones (they would cover the text panel). Works for mouse, pen and touch alike.
  {
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    const LINK = { vdo: 'vdo', lvgo: 'lvgo', hvgo: 'hvgo', vr: 'resid' };
    const keys = Object.keys(BARREL);
    const groups = keys.map((k) => BARREL[k].g);
    const hitAt = (x, y) => {
      if (S.p < 0.84) return null; // drums are only framed in the final chapter
      const r = canvas.getBoundingClientRect();
      if (!r.width || x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(groups, true)[0];
      if (!hit) return null;
      for (let o = hit.object; o; o = o.parent) { const i = groups.indexOf(o); if (i >= 0) return LINK[keys[i]]; }
      return null;
    };
    const open = (label) => { const a = qs('a.tag-link[data-label="' + label + '"]'); if (a) a.click(); };
    let down = null;
    const onDown = (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      down = e.target.closest('a,button') ? null : { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = (e) => {
      const d = down; down = null;
      if (!d || !e.isPrimary) return;
      // A tap, not a scroll swipe: little movement, short press.
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 700) return;
      const label = hitAt(e.clientX, e.clientY);
      if (label) { e.preventDefault(); open(label); }
    };
    const onCancel = () => { down = null; };
    const onHover = (e) => {
      if (e.pointerType !== 'mouse') return;
      STAGE.style.cursor = !e.target.closest('a,button') && hitAt(e.clientX, e.clientY) ? 'pointer' : '';
    };
    STAGE.addEventListener('pointerdown', onDown, { passive: true });
    STAGE.addEventListener('pointerup', onUp);
    STAGE.addEventListener('pointercancel', onCancel, { passive: true });
    STAGE.addEventListener('pointermove', onHover, { passive: true });
    cleanup.push(() => {
      STAGE.removeEventListener('pointerdown', onDown);
      STAGE.removeEventListener('pointerup', onUp);
      STAGE.removeEventListener('pointercancel', onCancel);
      STAGE.removeEventListener('pointermove', onHover);
      STAGE.style.cursor = '';
    });
  }

  // ---------- Loop ----------
  let last = performance.now(), time = 0, first = true;
  api.setProgress = (p) => { S.target = S.p = p; };
  api.render = () => frame(performance.now());
  api.labelState = () => JSON.parse(JSON.stringify(LSTATE));
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; time += reduceMotion ? dt * 0.3 : dt;
    S.p += (S.target - S.p) * (window.VDU_CAPTURE ? 1 : 1 - Math.pow(0.0008, dt));
    apply(S.p, time, dt);
    updateUI(S.p);
    if (composer) composer.render(); else renderer.render(scene, camera);
    first = false;
  }
  const loop = (now) => {
    if (disposed) return;
    if (!document.hidden && readScroll()) frame(now); else last = now;
    if (!window.VDU_CAPTURE) rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
  api.setLang = (l) => { api.lang = l; PARTS.forEach((L) => { L.el.firstChild.textContent = tr(L.el._name); }); };
  api.dispose = () => {
    disposed = true; cancelAnimationFrame(rafId); cleanup.forEach((f) => f());
    PARTS.forEach((L) => L.el.remove());
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
    renderer.dispose();
  };
  return api;
};

