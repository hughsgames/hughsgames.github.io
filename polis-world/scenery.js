// Polis World (computer version): the living sky and the little things that make the world feel alive.
// Flocks of birds, butterflies by day and fireflies by night, glowing halos round torches and
// lamps after dark, and the details of city life: striped awnings over doorways, banners on the walls and potted
// plants on the flat roofs. All of it is only for looking at: nothing here changes the world or gets in your way.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const hash = (x, z, s) => { let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/// One geometry from many coloured boxes, each placed by a matrix (so boxes can be turned and tilted).
export function mergeBoxes(list) {
  const pos = [], nrm = [], col = [], uvs = [], idx = [], c = new THREE.Color(), g0 = new THREE.BoxGeometry(1, 1, 1);
  const nm = new THREE.Matrix3(), v = new THREE.Vector3();
  for (const { m, color } of list) {
    const p = g0.attributes.position, n = g0.attributes.normal, base = pos.length / 3;
    for (const t of g0.attributes.uv.array) uvs.push(t + 2);   // rounded-box faces (graphics.js)
    nm.getNormalMatrix(m); c.setHex(color);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nrm.push(v.x, v.y, v.z);
      col.push(c.r, c.g, c.b);
    }
    for (const i of g0.index.array) idx.push(base + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); if (pos.length) g.setIndex(idx);
  return g;
}
const boxAt = (x, y, z, sx, sy, sz, color, rot = null) => {
  const m = new THREE.Matrix4().makeTranslation(x, y, z);
  if (rot) m.multiply(rot);
  return { m: m.multiply(new THREE.Matrix4().makeScale(sx, sy, sz)), color };
};

// ---------- glowing dots (halos, fireflies) ----------
function glowPoints(max, color) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(max * 3), 3));
  g.setAttribute('phase', new THREE.Float32BufferAttribute(new Float32Array(max), 1));
  g.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(max), 1));
  g.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color(color) }, uScale: { value: 400 }, uBlink: { value: 0 } },
    vertexShader: `attribute float phase; attribute float size; uniform float uTime; uniform float uScale; uniform float uBlink; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float f = 0.86 + 0.14 * sin(uTime * 9.0 + phase * 6.3) * sin(uTime * 13.7 + phase * 2.1);
        float blink = mix(1.0, max(0.0, sin(uTime * 1.3 + phase * 6.3)), uBlink);
        vA = f * blink; gl_PointSize = size * uScale * f / max(-mv.z, 0.5); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); gl_FragColor = vec4(uColor * a * uAlpha * vA, 1.0); }`,
  });
  const p = new THREE.Points(g, mat); p.frustumCulled = false; p.renderOrder = 6;
  return p;
}

// ---------- city details ----------
// Awning and banner colours for each city's style: [cloth, stripe, banner, banner trim].
const CITY_COLOURS = {
  roman: [0xb03a2e, 0xf0e6d0, 0x9b2d24, 0xd9b34a], greek: [0x2f5fa8, 0xf2efe6, 0x2f5fa8, 0xf2efe6], egyptian: [0xf2efe2, 0x2f6fb0, 0x2f6fb0, 0xd9b34a],
  mesopotamian: [0x2f5fb0, 0xd9b34a, 0x2a4f9a, 0xd9b34a], persian: [0x6a3a8a, 0xd9b34a, 0x6a3a8a, 0xd9b34a], indus: [0xc75c38, 0xebe0c7, 0xc75c38, 0xebe0c7],
  mesoamerican: [0x2f9a7a, 0xcc4d33, 0x2f9a7a, 0xd9b34a], khmer: [0xd9952a, 0xa8342a, 0xd9952a, 0xa8342a],
  judean: [0xece6d6, 0x3a5a8a, 0x3a5a8a, 0xece6d6], punic: [0x6a2a6a, 0xf0e8d8, 0x6a2a6a, 0xd9b34a], chinese: [0xb8322a, 0xd9b34a, 0xb8322a, 0xd9b34a],
};
const POT = 0xb5643a, LEAF = 0x4f8a3a, LEAF2 = 0x6aa04a, FLOWER = [0xd94a6a, 0xe8c040, 0xf2efe6, 0xb05ab0];

export function createScenery({ scene, world, H, WL, isSolid, isAir, groundY, lights, glow, skyOpen }) {
  const state = { wind: 0, t: 0 };
  // Birds: three flocks circling high up, each bird a body and two flapping wings.
  const BIRDS = 18, birdMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const birdBody = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.16, 0.6), birdMat, BIRDS), birdWing = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.04, 0.28), birdMat, BIRDS * 2);
  for (const m of [birdBody, birdWing]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); }
  const flocks = [0, 1, 2].map((f) => ({ cx: 0, cz: 0, y: 0, r: 10 + f * 4, speed: 0.22 + f * 0.05, set: false, kind: f }));
  const birdCol = new THREE.Color();
  for (let i = 0; i < BIRDS; i++) { birdCol.setHex(i % 6 === 0 ? 0xe8eaec : i % 2 ? 0x2a2a2a : 0x4a3a2a); birdBody.setColorAt(i, birdCol); birdWing.setColorAt(i * 2, birdCol); birdWing.setColorAt(i * 2 + 1, birdCol); }

  // Butterflies by day: two wings each, fluttering round flowers and grass near you.
  const FLY = 14, flyWing = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.18, 0.14), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), FLY * 2);
  flyWing.frustumCulled = false; flyWing.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(flyWing);
  const flyCols = [0xf29a2a, 0xf2d64a, 0xf2f2ea, 0x5a8ae8, 0xe86aa8];
  const flies = Array.from({ length: FLY }, (_, i) => ({ x: 0, y: -100, z: 0, hx: 0, hz: 0, hy: 0, a: Math.random() * 6.28, ph: Math.random() * 6.28, set: false, i }));
  flies.forEach((f, i) => { birdCol.setHex(flyCols[i % flyCols.length]); flyWing.setColorAt(i * 2, birdCol); flyWing.setColorAt(i * 2 + 1, birdCol); });

  // Rain: a column of falling streaks that keeps up with you, and a ring of splashes where they land.
  // A drop only gets a place if the sky is open above it, so it never rains indoors or underground.
  const RAIN = 1100, RAIN_R = 15;
  const rainMat = new THREE.MeshBasicMaterial({ color: 0xbcd8ee, transparent: true, opacity: 0.6, depthWrite: false, fog: false });
  const rainMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.048, 0.95, 0.048), rainMat, RAIN);
  rainMesh.frustumCulled = false; rainMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rainMesh.visible = false; scene.add(rainMesh);
  const splashMat = new THREE.MeshBasicMaterial({ color: 0xcfe4f4, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const SPLASH = 90;
  const splashMesh = new THREE.InstancedMesh(new THREE.RingGeometry(0.07, 0.11, 14), splashMat, SPLASH);
  splashMesh.frustumCulled = false; splashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); splashMesh.visible = false; scene.add(splashMesh);
  const drops = Array.from({ length: RAIN }, () => ({ x: 0, y: -1000, z: 0, v: 0, set: false }));
  const splashes = Array.from({ length: SPLASH }, () => ({ x: 0, y: -1000, z: 0, t: 0 }));
  let splashAt = 0;

  // Fireflies by night and halos round lamps and torches after dark.
  const fireflies = glowPoints(48, 0xd8ff6a); fireflies.material.uniforms.uBlink.value = 1; scene.add(fireflies);
  const ffs = Array.from({ length: 48 }, () => ({ x: 0, y: -100, z: 0, hx: 0, hz: 0, hy: 0, a: Math.random() * 6.28, set: false }));
  const halos = glowPoints(400, 0xffb45a); scene.add(halos);
  let haloT = 0;

  // ---------- flames, embers, smoke, falling leaves and dust ----------
  // All drawn as points that always face you. Flames and embers are brighter than white, so they glow; smoke and
  // leaves are lit by the daylight; dust only shows where it catches the sun.
  const pts = (max, attrs, vert, frag, opts) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(max * 3), 3));
    for (const [name, size] of attrs) g.setAttribute(name, new THREE.Float32BufferAttribute(new Float32Array(max * size), size));
    g.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uScale: { value: 500 }, uLight: { value: new THREE.Color(1, 1, 1) }, uAlpha: { value: 1 } },
      vertexShader: vert, fragmentShader: frag, ...opts });
    const p = new THREE.Points(g, mat); p.frustumCulled = false; p.renderOrder = 7; scene.add(p);
    return p;
  };
  const SIZE_VERT = (extra = '') => `attribute float size; attribute float phase; ${extra}
    uniform float uScale; uniform float uTime; varying float vPhase;
    void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; vPhase = phase; gl_PointSize = size * uScale / max(-mv.z, 0.3);`;
  // A flame: a flickering teardrop, white-hot at its heart, orange at the edge.
  const flames = pts(400, [['size', 1], ['phase', 1]], SIZE_VERT() + '}', /* glsl */ `
    uniform float uTime; varying float vPhase;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0; p.y = -p.y;
      float t = uTime * (7.0 + fract(vPhase * 7.1) * 3.0) + vPhase * 10.0;
      float h = clamp((p.y + 0.7) / 1.6, 0.0, 1.0);
      float wob = (sin(t + p.y * 4.0) * 0.09 + sin(t * 1.9 + p.y * 9.0) * 0.04) * h;
      float w = mix(0.5, 0.04, pow(h, 0.8)) * (0.9 + 0.1 * sin(t * 2.3));
      float x = (p.x - wob) / w;
      float flame = smoothstep(1.0, 0.25, abs(x)) * smoothstep(-0.95, -0.5, p.y) * smoothstep(0.9, 0.3 + 0.2 * sin(t * 1.3), p.y);
      float core = smoothstep(0.7, 0.0, abs(x)) * smoothstep(-0.8, -0.45, p.y) * smoothstep(0.35, -0.2, p.y);
      vec3 col = mix(vec3(1.0, 0.22, 0.03), vec3(1.0, 0.62, 0.18), h * 0.4 + core) + vec3(1.0, 0.9, 0.7) * core * core * 1.5;
      gl_FragColor = vec4(col * flame * 3.2, 1.0);
    }`, { blending: THREE.AdditiveBlending });
  // Embers drifting up from fires.
  const EMB = 160, embers = pts(EMB, [['size', 1], ['phase', 1]], SIZE_VERT() + '}', /* glsl */ `
    varying float vPhase;
    void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d); gl_FragColor = vec4(vec3(1.0, 0.45, 0.1) * a * a * 4.0 * vPhase, 1.0); }`, { blending: THREE.AdditiveBlending });
  const emb = Array.from({ length: EMB }, () => ({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1 }));
  // Smoke curling up from campfires.
  const SMK = 60, smoke = pts(SMK, [['size', 1], ['phase', 1]], SIZE_VERT() + '}', /* glsl */ `
    uniform vec3 uLight; varying float vPhase;
    void main() { vec2 p = gl_PointCoord - 0.5; float d = length(p) * 2.0; float a = smoothstep(1.0, 0.2, d) * (0.85 + 0.15 * sin(atan(p.y, p.x) * 3.0 + vPhase * 20.0));
      gl_FragColor = vec4(uLight * 0.55, a * 0.32 * fract(vPhase)); }`, {});
  const smk = Array.from({ length: SMK }, () => ({ x: 0, y: -999, z: 0, life: 0, max: 1, s: 0 }));
  // Leaves fluttering down under the trees.
  const LEAF = 70, leaves = pts(LEAF, [['size', 1], ['phase', 1], ['tint', 3]], SIZE_VERT('attribute vec3 tint; varying vec3 vTint;') + 'vTint = tint; }', /* glsl */ `
    uniform vec3 uLight; uniform float uTime; varying float vPhase; varying vec3 vTint;
    void main() {
      vec2 p = gl_PointCoord - 0.5; float a = uTime * (1.5 + fract(vPhase * 3.7)) + vPhase * 6.0;
      p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p; p.x *= 1.0 + 0.6 * abs(sin(a * 0.7));
      if (length(vec2(p.x * 2.2, p.y)) > 0.42) discard;
      gl_FragColor = vec4(vTint * uLight * (0.85 + 0.3 * p.y), 1.0);
    }`, {});
  const lf = Array.from({ length: LEAF }, () => ({ x: 0, y: -999, z: 0, floor: 0, ph: Math.random() * 6.3, set: false }));
  // Dust and pollen hanging in the air, glinting where the sun catches it.
  const DUST = 140, dust = pts(DUST, [['size', 1], ['phase', 1]], SIZE_VERT() + '}', /* glsl */ `
    uniform float uAlpha; uniform float uTime; varying float vPhase;
    void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d); float tw = 0.4 + 0.6 * max(0.0, sin(uTime * 2.0 + vPhase * 40.0));
      gl_FragColor = vec4(vec3(1.0, 0.95, 0.8) * a * uAlpha * tw, 1.0); }`, { blending: THREE.AdditiveBlending });
  const dst = Array.from({ length: DUST }, () => ({ x: 0, y: -999, z: 0, ph: Math.random() * 100 }));
  for (let i = 0; i < DUST; i++) dust.geometry.attributes.phase.setX(i, Math.random());
  const fires = [];   // [x, y, z, kind] for every flame near you (0 torch, 1 campfire, 2 lamp)
  const LEAFY = new Set([8, 10, 12, 25, 125, 127, 129, 131, 133, 134, 158]);
  const LEAF_TINT = { 8: [0.18, 0.38, 0.1], 10: [0.3, 0.45, 0.14], 12: [0.14, 0.28, 0.14], 25: [0.25, 0.42, 0.12], 125: [0.12, 0.36, 0.08], 127: [0.95, 0.55, 0.68], 129: [0.75, 0.62, 0.12], 131: [0.36, 0.48, 0.18], 133: [0.18, 0.4, 0.14], 134: [0.2, 0.42, 0.12], 158: [0.1, 0.3, 0.12] };

  // A spot near (px, pz) on grass or among flowers, or null.
  const grassy = (px, pz, r) => {
    for (let t = 0; t < 8; t++) {
      const x = Math.floor(px + (Math.random() - 0.5) * 2 * r), z = Math.floor(pz + (Math.random() - 0.5) * 2 * r);
      const g = groundY(x, z), below = world.get(x, g - 1, z), here = world.get(x, g, z);
      if (g > WL && (below === 1 || here === 30 || here === 31 || here === 32)) return [x + 0.5, g, z + 0.5];
    }
    return null;
  };
  const M = new THREE.Matrix4(), R = new THREE.Matrix4(), S = new THREE.Matrix4(), Z = new THREE.Matrix4().makeScale(0, 0, 0);

  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _sc = new THREE.Vector3(1, 1, 1);
  let rainK = 0;
  /// Rain falling round the player. `rain` is how hard it is coming down, 0 to 1.
  function updateRain(dt, P, rain, under) {
    rainK += (rain - rainK) * Math.min(dt * 0.6, 1);     // the sky takes its time to change its mind
    const on = rainK > 0.015 && !under;
    rainMesh.visible = on; splashMesh.visible = on;
    if (!on) return;
    const want = Math.round(RAIN * Math.min(rainK, 1));
    for (let i = 0; i < RAIN; i++) {
      const d = drops[i];
      if (i >= want) { _m4.makeScale(0, 0, 0); rainMesh.setMatrixAt(i, _m4); continue; }
      if (!d.set || d.y < d.floor) {
        // A new drop somewhere round the player, but only where it can see the sky.
        let placed = false;
        for (let k = 0; k < 3 && !placed; k++) {
          const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * RAIN_R;
          const x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
          const fx = Math.floor(x), fz = Math.floor(z);
          const top = groundY(fx, fz);
          if (!skyOpen(fx, Math.max(top, Math.floor(P.y) + 6), fz)) continue;
          d.x = x; d.z = z; d.floor = top; d.y = Math.max(top, P.y) + 9 + Math.random() * 7;
          d.v = 17 + Math.random() * 7; d.set = placed = true;
        }
        if (!placed) { _m4.makeScale(0, 0, 0); rainMesh.setMatrixAt(i, _m4); continue; }
        // Where the last one landed, leave a splash.
        const sp = splashes[splashAt % SPLASH]; splashAt++;
        sp.x = d.x; sp.z = d.z; sp.y = d.floor + 0.03; sp.t = 0.34;
      }
      d.y -= d.v * dt;
      _m4.compose(_v.set(d.x, d.y, d.z), _q.set(0, 0, 0, 1), _sc);
      rainMesh.setMatrixAt(i, _m4);
    }
    rainMesh.instanceMatrix.needsUpdate = true;
    rainMat.opacity = 0.26 + 0.34 * Math.min(rainK, 1);
    // The splashes: a flat ring that spreads and fades where each drop hit.
    for (let i = 0; i < SPLASH; i++) {
      const sp = splashes[i];
      if (sp.t <= 0) { _m4.makeScale(0, 0, 0); splashMesh.setMatrixAt(i, _m4); continue; }
      sp.t -= dt;
      const k = Math.max(0, sp.t) / 0.34, grow = 1.6 - k;
      _q.setFromAxisAngle(_v.set(1, 0, 0), -Math.PI / 2);
      _m4.compose(_v.set(sp.x, sp.y, sp.z), _q, _sc.set(grow, grow, grow));
      splashMesh.setMatrixAt(i, _m4);
      _sc.set(1, 1, 1);
    }
    splashMesh.instanceMatrix.needsUpdate = true;
    splashMat.opacity = 0.32 * Math.min(rainK, 1);
  }

  const _lc = new THREE.Color();
  function updateParticles(dt, P, day, under, rain, light, px) {
    for (const p of [flames, embers, smoke, leaves, dust]) { p.material.uniforms.uTime.value = state.t; p.material.uniforms.uScale.value = px; }
    halos.material.uniforms.uScale.value = fireflies.material.uniforms.uScale.value = px * 0.75;
    _lc.setRGB(0.25 + 0.75 * day, 0.27 + 0.73 * day, 0.33 + 0.67 * day); if (light) _lc.copy(light);
    smoke.material.uniforms.uLight.value.copy(_lc); leaves.material.uniforms.uLight.value.copy(_lc);
    // Flames: one on every torch, lamp and campfire near you.
    const fpos = flames.geometry.attributes.position, fsz = flames.geometry.attributes.size, fph = flames.geometry.attributes.phase;
    let nf = 0;
    for (const f of fires) {
      if (nf >= 400) break;
      const dx = f[0] - P.x, dz = f[2] - P.z; if (dx * dx + dz * dz > 48 * 48) continue;
      fpos.setXYZ(nf, f[0], f[1] + (f[3] === 1 ? 0.32 : 0.1), f[2]); fsz.setX(nf, f[3] === 1 ? 1.1 : f[3] === 2 ? 0.32 : 0.42); fph.setX(nf, (f[0] * 7.3 + f[2] * 3.1) % 10); nf++;
    }
    flames.geometry.setDrawRange(0, nf); fpos.needsUpdate = fsz.needsUpdate = fph.needsUpdate = true;
    // Embers: born at a flame (campfires most of all), rising, drifting, fading.
    const ep = embers.geometry.attributes.position, es = embers.geometry.attributes.size, ea = embers.geometry.attributes.phase;
    for (let i = 0; i < EMB; i++) {
      const e = emb[i];
      e.life -= dt;
      if (e.life <= 0 && fires.length && Math.random() < dt * 6) {
        const f = fires[Math.floor(Math.random() * fires.length)];
        if (f[3] === 1 || Math.random() < 0.25) {
          e.x = f[0] + (Math.random() - 0.5) * 0.3; e.y = f[1] + 0.2; e.z = f[2] + (Math.random() - 0.5) * 0.3;
          e.vx = (Math.random() - 0.5) * 0.5; e.vz = (Math.random() - 0.5) * 0.5; e.vy = 0.8 + Math.random() * (f[3] === 1 ? 1.6 : 0.6);
          e.max = e.life = 0.8 + Math.random() * (f[3] === 1 ? 1.8 : 0.7);
        }
      }
      if (e.life > 0) { e.x += (e.vx + Math.sin(state.t * 3 + i) * 0.3) * dt; e.y += e.vy * dt; e.z += (e.vz + Math.cos(state.t * 2.6 + i) * 0.3) * dt; e.vy *= 1 - dt * 0.4; }
      ep.setXYZ(i, e.x, e.life > 0 ? e.y : -999, e.z); es.setX(i, 0.045); ea.setX(i, Math.max(0, e.life / e.max));
    }
    embers.geometry.setDrawRange(0, EMB); ep.needsUpdate = es.needsUpdate = ea.needsUpdate = true;
    // Smoke from campfires.
    const sp = smoke.geometry.attributes.position, ss = smoke.geometry.attributes.size, sa = smoke.geometry.attributes.phase;
    const camp = fires.filter((f) => f[3] === 1);
    for (let i = 0; i < SMK; i++) {
      const m = smk[i];
      m.life -= dt;
      if (m.life <= 0 && camp.length && Math.random() < dt * 3) {
        const f = camp[Math.floor(Math.random() * camp.length)];
        m.x = f[0]; m.y = f[1] + 0.7; m.z = f[2]; m.max = m.life = 3 + Math.random() * 3; m.s = 0.4 + Math.random() * 0.3;
      }
      if (m.life > 0) { m.y += dt * 0.9; m.x += Math.sin(state.t * 0.5 + i) * dt * 0.35 + dt * 0.25; m.z += Math.cos(state.t * 0.4 + i * 1.3) * dt * 0.3; }
      const k = m.life > 0 ? m.life / m.max : 0;
      sp.setXYZ(i, m.x, m.life > 0 ? m.y : -999, m.z); ss.setX(i, m.s * (1 + (1 - k) * 3.5)); sa.setX(i, Math.floor(i * 7.13) + Math.min(k * 3, 1) * Math.min((1 - k) * 4, 1) * 0.999);
    }
    smoke.geometry.setDrawRange(0, SMK); sp.needsUpdate = ss.needsUpdate = sa.needsUpdate = true;
    // Leaves: a few at a time, wherever there are leaves overhead, swaying down to the ground.
    const lp = leaves.geometry.attributes.position, ls = leaves.geometry.attributes.size, lph = leaves.geometry.attributes.phase, lt = leaves.geometry.attributes.tint;
    for (let i = 0; i < LEAF; i++) {
      const l = lf[i];
      if (!l.set || l.y <= l.floor || Math.abs(l.x - P.x) > 20 || Math.abs(l.z - P.z) > 20) {
        l.set = false; l.y = -999;
        if (!under && Math.random() < dt * 1.5) {
          const x = Math.floor(P.x + (Math.random() - 0.5) * 30), z = Math.floor(P.z + (Math.random() - 0.5) * 30);
          const g = groundY(x, z);
          for (let y = Math.floor(Math.max(g, P.y - 6)); y < Math.min(H - 1, P.y + 14); y++) {
            const b = world.get(x, y, z);
            if (LEAFY.has(b) && isAir(x, y - 1, z)) {
              const t = LEAF_TINT[b] || LEAF_TINT[8];
              l.x = x + Math.random(); l.y = y - 0.1; l.z = z + Math.random(); l.floor = g; l.set = true;
              lt.setXYZ(i, t[0], t[1], t[2]); break;
            }
          }
        }
      }
      if (l.set) {
        l.y -= dt * (0.55 + 0.25 * Math.sin(state.t * 1.3 + l.ph));
        l.x += (Math.sin(state.t * 1.1 + l.ph) * 0.6 + 0.25) * dt; l.z += Math.cos(state.t * 0.9 + l.ph * 1.7) * 0.5 * dt;
      }
      lp.setXYZ(i, l.x, l.y, l.z); ls.setX(i, 0.16); lph.setX(i, l.ph);
    }
    leaves.geometry.setDrawRange(0, LEAF); lp.needsUpdate = ls.needsUpdate = lph.needsUpdate = lt.needsUpdate = true;
    // Dust: a cloud of motes round you, drifting; it only shows in daylight, away from the rain.
    const dp = dust.geometry.attributes.position, ds = dust.geometry.attributes.size;
    for (let i = 0; i < DUST; i++) {
      const d = dst[i];
      if (Math.abs(d.x - P.x) > 9 || Math.abs(d.z - P.z) > 9 || Math.abs(d.y - P.y - 1.5) > 5) { d.x = P.x + (Math.random() - 0.5) * 18; d.z = P.z + (Math.random() - 0.5) * 18; d.y = P.y + 1.5 + (Math.random() - 0.5) * 8; }
      d.x += Math.sin(state.t * 0.21 + d.ph) * dt * 0.15; d.y += Math.sin(state.t * 0.17 + d.ph * 2.1) * dt * 0.08; d.z += Math.cos(state.t * 0.19 + d.ph * 1.3) * dt * 0.15;
      dp.setXYZ(i, d.x, d.y, d.z); ds.setX(i, 0.022);
    }
    dust.geometry.setDrawRange(0, DUST); dp.needsUpdate = ds.needsUpdate = true;
    dust.material.uniforms.uAlpha.value = under ? 0 : Math.max(0, day - 0.3) * 1.4 * (1 - rain);
  }

  function update(dt, { P, day, warm, under, horizon, rain = 0, light = null, px = 500 }) {
    updateRain(dt, P, rain, under);
    state.t += dt; state.wind += dt * 1.1;
    // Birds circle in the daytime sky (they roost at night).
    flocks.forEach((f, fi) => {
      if (!f.set || Math.hypot(f.cx - P.x, f.cz - P.z) > 70) {
        const a = Math.random() * 6.28, d = 20 + Math.random() * 30;
        f.cx = P.x + Math.cos(a) * d; f.cz = P.z + Math.sin(a) * d;
        f.y = Math.max(groundY(Math.floor(f.cx), Math.floor(f.cz)), WL) + 16 + fi * 3; f.set = true;
      }
      for (let b = 0; b < 6; b++) {
        const i = fi * 6 + b, ang = state.t * f.speed + b * 0.5, rr = f.r + (b % 3) * 1.6;
        const x = f.cx + Math.cos(ang) * rr, z = f.cz + Math.sin(ang) * rr, y = f.y + Math.sin(state.t * 0.7 + b) * 1.2 + (b % 2) * 0.8;
        if (day < 0.3 || under) { birdBody.setMatrixAt(i, Z); birdWing.setMatrixAt(i * 2, Z); birdWing.setMatrixAt(i * 2 + 1, Z); continue; }
        const yaw = -ang, flap = Math.sin(state.t * 9 + b * 1.7) * 0.6;
        M.makeRotationY(yaw).setPosition(x, y, z); birdBody.setMatrixAt(i, M);
        for (const s of [1, -1]) {
          const W = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z).multiply(R.makeRotationZ(flap * s)).multiply(S.makeTranslation(0.35 * s, 0, 0));
          birdWing.setMatrixAt(i * 2 + (s > 0 ? 0 : 1), W);
        }
      }
    });
    birdBody.instanceMatrix.needsUpdate = birdWing.instanceMatrix.needsUpdate = true;
    if (birdBody.instanceColor) birdBody.instanceColor.needsUpdate = birdWing.instanceColor.needsUpdate = true;

    // Butterflies (daytime): wander round a home spot on the grass, wings beating.
    for (const f of flies) {
      if (!f.set || Math.hypot(f.hx - P.x, f.hz - P.z) > 26) { const s = grassy(P.x, P.z, 18); if (s) { [f.hx, f.hy, f.hz] = s; f.x = f.hx; f.y = f.hy + 0.8; f.z = f.hz; f.set = true; } }
      const show = f.set && day > 0.55 && !under;
      if (!show) { flyWing.setMatrixAt(f.i * 2, Z); flyWing.setMatrixAt(f.i * 2 + 1, Z); continue; }
      f.a += (Math.sin(state.t * 0.9 + f.ph) * 1.6) * dt;
      f.x += Math.sin(f.a) * dt * 0.9; f.z += Math.cos(f.a) * dt * 0.9;
      const dx = f.hx - f.x, dz = f.hz - f.z; if (Math.hypot(dx, dz) > 3) f.a = Math.atan2(dx, dz);
      f.y = f.hy + 0.7 + Math.sin(state.t * 2.1 + f.ph) * 0.35;
      const flap = Math.sin(state.t * 22 + f.ph) * 1.1;
      for (const s of [1, -1]) {
        M.makeRotationY(f.a).setPosition(f.x, f.y, f.z).multiply(R.makeRotationZ(s * (0.4 + flap * 0.5))).multiply(S.makeTranslation(0.09 * s, 0, 0)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        flyWing.setMatrixAt(f.i * 2 + (s > 0 ? 0 : 1), M);
      }
    }
    flyWing.instanceMatrix.needsUpdate = true;
    if (flyWing.instanceColor) flyWing.instanceColor.needsUpdate = true;

    // Fireflies (night, near grass).
    const fp = fireflies.geometry.attributes.position, fph = fireflies.geometry.attributes.phase, fsz = fireflies.geometry.attributes.size;
    let nf = 0;
    if (day < 0.35 && !under) for (const f of ffs) {
      if (!f.set || Math.hypot(f.hx - P.x, f.hz - P.z) > 24) { const s = grassy(P.x, P.z, 16); if (!s) continue; [f.hx, f.hy, f.hz] = s; f.set = true; f.a = Math.random() * 6.28; }
      f.a += (Math.random() - 0.5) * dt * 2;
      f.x = f.hx + Math.sin(state.t * 0.3 + f.a) * 1.5; f.z = f.hz + Math.cos(state.t * 0.27 + f.a * 1.3) * 1.5; f.y = f.hy + 0.6 + Math.sin(state.t * 0.5 + f.a) * 0.5;
      fp.setXYZ(nf, f.x, f.y, f.z); fph.setX(nf, f.a); fsz.setX(nf, 0.18); nf++;
    }
    fireflies.geometry.setDrawRange(0, nf); fp.needsUpdate = fph.needsUpdate = fsz.needsUpdate = true;
    fireflies.material.uniforms.uAlpha.value = Math.min(1, (0.35 - day) * 4);
    fireflies.material.uniforms.uTime.value = state.t;

    // Halos round every lamp, torch and fire near you, brighter the darker it is.
    haloT -= dt;
    if (haloT <= 0) {
      haloT = 0.5;
      const hp = halos.geometry.attributes.position, hph = halos.geometry.attributes.phase, hs = halos.geometry.attributes.size, n = world.n;
      let k = 0;
      fires.length = 0;
      const pcx = Math.floor(P.x / 16), pcz = Math.floor(P.z / 16);
      for (let cz = pcz - 3; cz <= pcz + 3 && k < 400; cz++) for (let cx = pcx - 3; cx <= pcx + 3 && k < 400; cx++) {
        const set = lights.get(cx + ',' + cz); if (!set) continue;
        for (const i of set) {
          if (k >= 400) break;
          const x = i % n, z = Math.floor(i / n) % n, y = Math.floor(i / (n * n)), b = world.cells[i];
          const g = glow(b); if (!g) continue;
          hp.setXYZ(k, x + 0.5, y + (b === 56 ? 0.75 : 0.5), z + 0.5); hph.setX(k, (x * 13 + z * 7) % 10); hs.setX(k, b === 58 ? 2.8 : b === 56 ? 1.6 : 2.2); k++;
          if (b === 56 || b === 58 || b === 46) fires.push([x + 0.5, y + (b === 56 ? 0.72 : b === 58 ? 0.32 : 0.62), z + 0.5, b === 58 ? 1 : b === 46 ? 2 : 0]);
        }
      }
      halos.geometry.setDrawRange(0, k); hp.needsUpdate = hph.needsUpdate = hs.needsUpdate = true;
    }
    halos.material.uniforms.uAlpha.value = 0.12 + 0.8 * (1 - day);
    halos.material.uniforms.uTime.value = state.t;
    updateParticles(dt, P, day, under, rain, light, px);
  }

  // City details, made once for each city when you first come near it.
  const decorated = new Set(), stats = {};
  function decorateCity(id, city, style) {
    if (decorated.has(id)) return; decorated.add(id);
    const [cloth, stripe, banner, trim] = CITY_COLOURS[style] || CITY_COLOURS.roman;
    const boxes = [], n = { doors: 0, facing: 0, awnings: 0, banners: 0, roofs: 0 };
    stats[id] = n;
    const solid = (x, y, z) => isSolid(x, y, z), air = (x, y, z) => isAir(x, y, z);
    // Find the doorways: from each open street square, a neighbouring square that is a two-block opening in a wall
    // (walls on both sides, wall above). The door list from the city plan misses most houses, so look at the real city.
    const found = [];
    const [ccx, ccz] = city.center, R = city.R + 4;
    const hs = (city.streets || []).map((q) => q[2]).filter((v) => v !== undefined).sort((p, q) => p - q);
    const mid = hs.length ? hs[hs.length >> 1] : groundY(Math.floor(ccx), Math.floor(ccz)), lo = mid - 4, hi = mid + 6;
    for (let z = Math.floor(ccz - R); z <= ccz + R; z++) for (let x = Math.floor(ccx - R); x <= ccx + R; x++) {
      // Street level here (under any overhanging roof), near the city's usual street height.
      for (let g = lo; g <= hi; g++) {
        if (!solid(x, g - 1, z) || !air(x, g, z) || !air(x, g + 1, z)) continue;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const qx = x - dx, qz = z - dz;      // the doorway square, behind the street square
          for (const h of [g, g + 1]) {        // the doorway can be a step up from the street
            if (!air(x, h + 1, z)) continue;
            if ((skyOpen(x, h, z) || skyOpen(x + dx, h, z + dz)) && air(qx, h, qz) && air(qx, h + 1, qz) && solid(qx, h + 2, qz) && solid(qx, h - 1, qz) && solid(qx + dz, h, qz - dx) && solid(qx - dz, h, qz + dx)) { found.push([x, z, h, dx, dz]); break; }
          }
        }
      }
    }
    n.doors = found.length; n.found = found;
    found.forEach(([x, z, g, ...dir]) => {
      const r = hash(x, z, 77);
      n.facing++;
      const [dx, dz] = dir, ux = -dz, uz = dx;                        // u runs along the wall
      const wallX = x - dx * 0.5 + 0.5, wallZ = z - dz * 0.5 + 0.5;    // the middle of the doorway, on the wall's outer face
      const yaw = Math.atan2(dx, dz), turn = new THREE.Matrix4().makeRotationY(yaw);
      // A striped cloth awning over the door (a little more than a third of doors), tilted down toward the street.
      if (r < 0.4 && air(x, g + 2, z) && solid(x - dx + ux, g + 2, z - dz + uz) && solid(x - dx - ux, g + 2, z - dz - uz)) {
        n.awnings++; (n.at ??= []).push([x, z, g, dx, dz]);
        const tilt = new THREE.Matrix4().makeRotationY(yaw).multiply(new THREE.Matrix4().makeRotationX(0.32));
        for (let s = 0; s < 4; s++) {
          const off = (s - 1.5) * 0.55;
          const cx = wallX + ux * off + dx * 0.48, cz = wallZ + uz * off + dz * 0.48;
          boxes.push(boxAt(cx, g + 2.12, cz, 0.55, 0.05, 1.0, s % 2 ? stripe : cloth, tilt));
        }
        for (const s of [-1, 1]) boxes.push(boxAt(wallX + ux * s * 1.05 + dx * 0.85, g + 1.55, wallZ + uz * s * 1.05 + dz * 0.85, 0.05, 1.1, 0.05, 0x5a3a22, turn));   // poles
      }
      // A banner on the wall beside the door.
      else if (r > 0.62) {
        const side = hash(x, z, 78) < 0.5 ? 1 : -1, bx = wallX + ux * side * 1.5 + dx * 0.03, bz = wallZ + uz * side * 1.5 + dz * 0.03;
        const wall = (n) => solid(x - dx + ux * side * n, g + 1, z - dz + uz * side * n) && solid(x - dx + ux * side * n, g + 2, z - dz + uz * side * n);
        if (wall(1) && wall(2) && air(x + ux * side, g + 1, z + uz * side) && air(x + ux * side * 2, g + 1, z + uz * side * 2)) {
          n.banners++;
          boxes.push(boxAt(bx, g + 1.85, bz, 0.7, 1.4, 0.04, banner, turn));
          boxes.push(boxAt(bx + dx * 0.01, g + 1.85, bz + dz * 0.01, 0.72, 0.1, 0.045, trim, turn));
          boxes.push(boxAt(bx + dx * 0.01, g + 2.5, bz + dz * 0.01, 0.72, 0.08, 0.045, trim, turn));
          boxes.push(boxAt(bx + dx * 0.02, g + 1.5, bz + dz * 0.02, 0.22, 0.22, 0.05, trim, turn));
        }
      }
      // Plants on a flat roof: one square inside the house, on top.
      if (hash(x, z, 79) < 0.45) {
        const rx = x - dx * 2, rz = z - dz * 2, top = groundY(rx, rz);
        if (top - g >= 3 && top - g <= 14 && groundY(rx + ux, rz + uz) === top && groundY(rx - ux, rz - uz) === top) {
          n.roofs++;
          for (const s of hash(x, z, 80) < 0.5 ? [0] : [-1, 1]) {
            const px = rx + ux * s + 0.5, pz = rz + uz * s + 0.5;
            boxes.push(boxAt(px, top + 0.18, pz, 0.42, 0.36, 0.42, POT));
            boxes.push(boxAt(px, top + 0.55, pz, 0.5, 0.42, 0.5, hash(px, pz, 81) < 0.5 ? LEAF : LEAF2));
            if (hash(px, pz, 82) < 0.6) boxes.push(boxAt(px + 0.12, top + 0.8, pz - 0.1, 0.14, 0.14, 0.14, FLOWER[Math.floor(hash(px, pz, 83) * 4)]));
          }
        }
      }
    });
    if (!boxes.length) return;
    const mesh = new THREE.Mesh(mergeBoxes(boxes), new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
  }
  return { update, decorateCity, stats };
}
