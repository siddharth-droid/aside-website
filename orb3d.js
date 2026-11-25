// The Aside orb, ported from tauri-app/src/components/mascot/OrbGL.tsx (same shaders, Ink and Paper looks).
// One full-viewport transparent canvas; the orb is placed in screen pixels every frame.
import * as THREE from "./vendor/three.module.js";

const MOOD = {
  idle: { center: "#ffd27a", edge: "#f5a742", brightness: 1, eyes: [1, 0, 0], rightEye: 1, tilt: 0, gaze: null, swirl: 0, blinks: true, spread: 1 },
  happy: { center: "#fff1c9", edge: "#ff9e6b", brightness: 1.25, eyes: [0, 1, 0], rightEye: 1, tilt: 0, gaze: null, swirl: 0, blinks: false, spread: 1.9 },
  curious: { center: "#c4f5ec", edge: "#4fc4bb", brightness: 1, eyes: [1, 0, 0], rightEye: 1.25, tilt: -8, gaze: null, swirl: 0, blinks: true, spread: 1 },
  thinking: { center: "#f2c98a", edge: "#c9894a", brightness: 0.6, eyes: [1, 0, 0], rightEye: 1, tilt: 0, gaze: { x: 0.35, y: 1 }, swirl: 1, blinks: false, spread: 0.9 },
  screenshot: { center: "#ffb8a8", edge: "#ff7f6e", brightness: 1.1, eyes: [0, 0, 1], rightEye: 1, tilt: 0, gaze: { x: 0, y: 0 }, swirl: 0, blinks: false, spread: 1.25 },
};
// Both looks, values from the app (mascot/tokens.ts and OrbGL.tsx SHELL). Paper is milky glass for light pages.
const LOOKS = {
  ink: { eye: "#2e1f16", rim: 0.8, rimColor: "#ffe9d2", coreBoost: 1.35, satBoost: 1.2, dark: 1,
    shell: { milk: [0.2, 0.205, 0.235], band: [0.1, 0.1, 0.12], clear: 0.35, sheen: 0.06, shadow: [0, 0, 0], shadowOpacity: 0.5 } },
  paper: { eye: "#47362f", rim: 0.25, rimColor: "#fffaf2", coreBoost: 1, satBoost: 1, dark: 0,
    shell: { milk: [0.885, 0.88, 0.885], band: [0.74, 0.725, 0.725], clear: 0.55, sheen: 0.07, shadow: [0.25, 0.2, 0.16], shadowOpacity: 0.22 } },
};
let INK = LOOKS.ink; // the active look; set by createOrb3D

const hexRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
function coreRgb(hex) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl, THREE.SRGBColorSpace);
  c.setHSL(hsl.h, Math.min(1, hsl.s * INK.satBoost), hsl.l, THREE.SRGBColorSpace);
  const o = { r: 0, g: 0, b: 0 };
  c.getRGB(o, THREE.SRGBColorSpace);
  return [o.r, o.g, o.b];
}

const bodyVert = `
  uniform float uFlat; // 1 = pebble (dock side pressed flat), 0 = round
  varying vec3 vObj; varying vec3 vCam; varying vec3 vN; varying vec3 vView;
  void main() {
    vec3 p = position;
    vec3 nrm = normal;
    // Press the dock side (+x) flat like a pebble, only as much as uFlat asks.
    float keep = mix(1.0, 0.45, uFlat);
    if (p.x > 0.8) {
      p.x = 0.8 + (p.x - 0.8) * keep;
      nrm = normalize(vec3(nrm.x / keep, nrm.y, nrm.z));
    }
    vObj = p;
    vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * nrm);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const bodyFrag = `
  uniform vec3 uCenter; uniform vec3 uEdge; uniform vec3 uMilk; uniform vec3 uRimColor;
  uniform float uIntensity; uniform float uSwirl; uniform float uTime; uniform float uRim; uniform float uSheen;
  uniform float uSpread; uniform vec3 uBand; uniform float uClear; uniform float uDark;
  varying vec3 vObj; varying vec3 vCam; varying vec3 vN; varying vec3 vView;
  const int STEPS = 24;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    vec3 ro = vObj; vec3 rd = normalize(vObj - vCam);
    float b = dot(ro, rd); float c = dot(ro, ro) - 1.0;
    float tFar = max(-b + sqrt(max(b * b - c, 0.0)), 0.0);
    float glow = 0.0; vec3 emit = vec3(0.0);
    float dt = tFar / float(STEPS);
    vec3 drift = vec3(0.0, uTime * 0.06, uTime * 0.04);
    for (int i = 0; i < STEPS; i++) {
      vec3 p = ro + rd * dt * (float(i) + 0.5);
      float r2 = dot(p, p);
      float ang = atan(p.y, p.x);
      float sw = 1.0 + uSwirl * 0.45 * sin(ang * 2.0 + sqrt(r2) * 7.0 - uTime * 1.5708);
      float cl = noise(p * 2.3 + drift);
      float d = exp(-r2 / (0.5 * uSpread)) * sw * (0.7 + 0.6 * cl);
      emit += mix(uEdge, uCenter, clamp(exp(-r2 / (0.16 * uSpread)) * (0.75 + 0.5 * cl), 0.0, 1.0)) * d;
      glow += d;
    }
    vec3 core = emit / max(glow, 1e-4);
    glow *= dt / (1.2 * mix(1.0, 1.2, clamp(uSpread - 1.0, 0.0, 1.0)));
    core = mix(core, uCenter, clamp((uIntensity - 1.0) * 1.2, 0.0, 0.6));
    float k = clamp(glow * min(uIntensity, 1.0) * 1.1, 0.0, 1.0);
    vec3 n = normalize(vN); vec3 v = normalize(vView);
    float facing = clamp(dot(n, v), 0.0, 1.0); float fres = 1.0 - facing;
    vec3 key = normalize(vec3(-0.55, 0.65, 0.6));
    float wrap = 0.5 + 0.5 * dot(n, key);
    vec3 shell = uMilk * (0.9 + 0.14 * wrap);
    vec3 col = mix(shell, core, smoothstep(0.0, 0.95, k) * (0.7 + 0.22 * uDark));
    col = mix(col, core, k * 0.15 * (1.0 - 0.5 * fres));
    col = mix(col, shell * 1.04, 0.2 * (1.0 - uDark));
    float flood = clamp((uSpread - 1.0) / 0.9, 0.0, 1.0);
    vec3 lit = mix(mix(uCenter * 1.04, uEdge, uDark * 0.35), uEdge, smoothstep(0.15 - uDark * 0.1, 0.97, fres));
    col = mix(col, lit, flood * 0.9);
    k = max(k, flood);
    float edge = smoothstep(0.5, 1.0, fres);
    col = mix(col, uBand, edge * 0.42 * (1.0 - k * 0.55));
    col += 0.05 * exp(-pow((fres - 0.8) / 0.07, 2.0)) * (1.0 - uDark * 0.5);
    col += uSheen * edge * (0.5 + 0.5 * cos(6.2831 * (fres * 1.4 + n.y * 0.3 + vec3(0.0, 0.33, 0.67))) - 0.3);
    col *= 0.92 + 0.08 * smoothstep(-0.9, 0.3, n.y);
    vec3 r = reflect(-v, n); float s = dot(r, key);
    col += smoothstep(0.55, 0.98, s) * 0.13;
    col += uRimColor * pow(fres, 3.0) * uRim * 0.45;
    float alpha = 1.0 - smoothstep(0.55, 0.97, fres) * uClear * (1.0 - k * 0.6);
    float px = fwidth(fres) * 1.5;
    alpha *= 1.0 - smoothstep(1.0 - px, 1.0, fres);
    gl_FragColor = vec4(col, alpha);
  }`;
const planeVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const eyeFrag = `
  uniform vec3 uColor; uniform vec3 uShape; uniform vec2 uLook; uniform float uRight; uniform float uBlink; uniform vec2 uPlane;
  varying vec2 vUv;
  float arc(vec2 p, float r, float th) { return p.y >= 0.0 ? abs(length(p) - r) - th : length(vec2(abs(p.x) - r, p.y)) - th; }
  float eye(vec2 p) {
    vec2 ab = vec2(0.06, 0.1 * (1.0 - 0.9 * uBlink));
    float oval = (length(p / ab) - 1.0) * min(ab.x, ab.y);
    float happy = arc(p - vec2(0.0, -0.035), 0.08, 0.024);
    float closed = arc(vec2(p.x, 0.035 - p.y), 0.08, 0.024);
    return oval * uShape.x + happy * uShape.y + closed * uShape.z;
  }
  void main() {
    vec2 p = (vUv - 0.5) * uPlane - uLook * vec2(0.14, 0.1);
    vec2 pl = p - vec2(-0.33, 0.02);
    vec2 pr = (p - vec2(0.33, 0.02)) / uRight;
    float dl = eye(pl); float dr = eye(pr) * uRight; float d = min(dl, dr);
    float aa = fwidth(d) * 0.85 + 0.0012;
    float a = 1.0 - smoothstep(-aa, aa, d);
    vec2 q = dl < dr ? pl : pr;
    float gloss = smoothstep(0.02, 0.09, q.y) * smoothstep(0.0, -0.03, d) * 0.35;
    gl_FragColor = vec4(uColor * (1.0 + gloss), a * 0.93);
  }`;
const haloFrag = `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
  void main() { float d = length((vUv - 0.5) * 2.0); float a = pow(1.0 - smoothstep(0.55, 1.0, d), 2.0) * uOpacity; gl_FragColor = vec4(uColor, a); }`;
const shadowFrag = `uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
  void main() { float d = length((vUv - 0.5) * 2.0); float a = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0) * uOpacity; gl_FragColor = vec4(uColor, a); }`;

export function hasWebGL2() {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

/**
 * createOrb3D(canvas, { target, reduced })
 * target(): { x, y, size } in CSS pixels, read every frame; the orb eases between targets when the slot changes.
 */
export function createOrb3D(canvas, { target, reduced = false, onFrame = null, focus = null, look = "ink" }) {
  INK = LOOKS[look] || LOOKS.ink;
  const SHELL = INK.shell;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  // A very narrow field of view from far away: almost orthographic, so an orb near the window edge
  // is not skewed outward by perspective (that read as the eyes looking off the page).
  const FOV = 1.2;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1000, 2000000);

  const U = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));
  const bodyU = U({ uCenter: new THREE.Vector3(), uEdge: new THREE.Vector3(), uMilk: new THREE.Vector3(...SHELL.milk), uRimColor: new THREE.Vector3(...hexRgb(INK.rimColor)),
    uIntensity: 1, uSwirl: 0, uTime: 0, uRim: INK.rim, uSheen: SHELL.sheen, uSpread: 1, uBand: new THREE.Vector3(...SHELL.band), uClear: SHELL.clear, uDark: INK.dark, uFlat: 1 });
  const EYE_PLANE = new THREE.Vector2(1.6, 0.9);
  const eyeU = U({ uColor: new THREE.Vector3(...hexRgb(INK.eye)), uShape: new THREE.Vector3(1, 0, 0), uLook: new THREE.Vector2(), uRight: 1, uBlink: 0, uPlane: EYE_PLANE });
  const haloU = U({ uColor: new THREE.Vector3(), uOpacity: 0 });
  const shadowU = U({ uColor: new THREE.Vector3(), uOpacity: SHELL.shadowOpacity });
  const mat = (frag, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: planeVert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, ...extra });

  const root = new THREE.Group();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), mat(shadowFrag, shadowU));
  shadow.position.set(0, -1.25, -0.4); shadow.renderOrder = 0;
  const body = new THREE.Group();
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), mat(haloFrag, haloU));
  halo.position.z = -1.1; halo.renderOrder = 1;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), new THREE.ShaderMaterial({ vertexShader: bodyVert, fragmentShader: bodyFrag, uniforms: bodyU, transparent: true }));
  sphere.renderOrder = 2;
  const eyes = new THREE.Mesh(new THREE.PlaneGeometry(EYE_PLANE.x, EYE_PLANE.y), mat(eyeFrag, eyeU, { depthTest: false }));
  eyes.position.z = 1.02; eyes.renderOrder = 3;
  body.add(halo, sphere, eyes);
  root.add(shadow, body);
  scene.add(root);

  // Animated state, eased toward targets every frame.
  let mood = "idle";
  const col = [...coreRgb(MOOD.idle.center), ...coreRgb(MOOD.idle.edge), INK.coreBoost, 0, 1];
  const eye = [1, 0, 0, 1, 0, 0];
  let tilt = 0;
  let pointer = null;
  let hold = null; // a point the eyes stay on
  let nextBlink = performance.now() + 4000, blinkAt = -1;

  // Placement: x, y, size in CSS px. Slot changes ease over 800ms.
  let pos = null;
  let from = null, fromAt = 0, lastKey = null;

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, (h / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => (pointer = { x: e.clientX, y: e.clientY }), { passive: true });

  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const approach = (arr, tgt, k) => {
    k = Math.min(1, Math.max(0, k));
    for (let i = 0; i < arr.length; i++) { arr[i] += (tgt[i] - arr[i]) * k; if (!Number.isFinite(arr[i])) arr[i] = tgt[i]; }
  };

  let last = performance.now();
  let running = true;
  const clock0 = performance.now();

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    // rAF timestamps can be earlier than a performance.now() taken just before: never let dt go negative.
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    const t = (now - clock0) / 1000;

    // where
    const tg = target();
    if (!pos) pos = { ...tg };
    if (tg.key !== lastKey) { from = { ...pos }; fromAt = now; lastKey = tg.key; }
    const p = from && !reduced ? Math.min(1, (now - fromAt) / 800) : 1;
    const e = easeIO(p);
    pos.x = from ? from.x + (tg.x - from.x) * e : tg.x;
    pos.y = from ? from.y + (tg.y - from.y) * e : tg.y;
    pos.size = from ? from.size + (tg.size - from.size) * e : tg.size;
    if (p >= 1) from = null;
    const r = pos.size / 2;
    root.position.set(pos.x - innerWidth / 2, innerHeight / 2 - pos.y, 0);
    root.scale.setScalar(r);
    root.visible = tg.visible !== false && pos.y > -pos.size * 2 && pos.y < innerHeight + pos.size * 2;

    // how it feels
    const s = MOOD[mood];
    const ct = [...coreRgb(s.center), ...coreRgb(s.edge), s.brightness * INK.coreBoost, s.swirl, s.spread];
    approach(col, ct, reduced ? 1 : 1 - Math.exp(-dt / 0.14));
    let gx = 0, gy = 0;
    // What it looks at: a held point, else what the current section is about, else the cursor.
    const look = hold || (s.gaze ? null : (focus && focus()) || pointer);
    if (s.gaze && !hold) { gx = s.gaze.x; gy = s.gaze.y; }
    else if (look) {
      const dx = look.x - pos.x, dy = look.y - pos.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const kk = Math.min(1, d / 260);
      gx = (dx / d) * kk; gy = (-dy / d) * kk;
    }
    approach(eye, [...s.eyes, s.rightEye, gx, gy], reduced ? 1 : 1 - Math.exp(-dt / 0.05));
    tilt += (s.tilt - tilt) * (reduced ? 1 : 1 - Math.exp(-dt / 0.14));

    bodyU.uCenter.value.set(col[0], col[1], col[2]);
    bodyU.uEdge.value.set(col[3], col[4], col[5]);
    bodyU.uIntensity.value = col[6];
    bodyU.uSwirl.value = col[7];
    bodyU.uSpread.value = col[8];
    if (!reduced) bodyU.uTime.value = t;
    haloU.uColor.value.set(col[3], col[4], col[5]);
    haloU.uOpacity.value = Math.min(0.6, 0.14 + Math.max(0, (col[6] - 1) * 1.4 + (col[8] - 1) * 0.35));
    { const sh = SHELL.shadow; shadowU.uColor.value.set(sh[0] + (col[3] - sh[0]) * 0.35, sh[1] + (col[4] - sh[1]) * 0.35, sh[2] + (col[5] - sh[2]) * 0.35); }
    eyeU.uShape.value.set(eye[0], eye[1], eye[2]);
    eyeU.uRight.value = eye[3];
    eyeU.uLook.value.set(eye[4], eye[5]);

    if (s.blinks && eye[0] > 0.95 && now > nextBlink && blinkAt < 0 && !reduced) { blinkAt = now; nextBlink = now + 4000 + Math.random() * 3000; }
    if (blinkAt >= 0) { const k = (now - blinkAt) / 150; eyeU.uBlink.value = k >= 1 ? 0 : 1 - Math.abs(k * 2 - 1); if (k >= 1) blinkAt = -1; }

    const breathe = reduced ? 0 : (1 - Math.cos((t / 3) * Math.PI * 2)) / 2;
    const bob = reduced || !tg.bob ? 0 : Math.sin((t / 6) * Math.PI * 2) * (2 / r);
    body.scale.setScalar(1 + 0.03 * breathe);
    body.position.y = bob;
    body.rotation.z = THREE.MathUtils.degToRad(tilt);
    // Seen large and away from the edge, the flat dock side turns away from the viewer.
    // Pebble only while docked into the screen edge; round everywhere else, so the flat side never faces you.
    const flatTo = tg.docked ? 1 : 0;
    bodyU.uFlat.value += (flatTo - bodyU.uFlat.value) * (reduced ? 1 : 1 - Math.exp(-dt / 0.12));
    shadow.scale.set(1 - 0.04 * breathe, 1 - 0.04 * breathe, 1);

    renderer.render(scene, camera);
    if (onFrame) onFrame(pos, col, root.visible);
  }
  requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  return {
    setMood(m) { mood = m; },
    get mood() { return mood; },
    holdGaze(pt) { hold = pt; },
    center() { return pos ? { x: pos.x, y: pos.y, size: pos.size } : null; },
  };
}
