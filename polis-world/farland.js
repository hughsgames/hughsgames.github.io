// Polis World (computer version): the land far away.
//
// The blocks near you are drawn in full, out to about 130 blocks. Past that the whole world is one low-detail mesh —
// a point every four blocks, coloured by whatever is on top there — so mountains, coasts, cities and the sea reach
// all the way to the horizon instead of fading into fog. It is cut out wherever the full blocks are already drawn
// (a little map of which pieces are ready says where). The sea is one sheet at sea level under it all, out to the
// horizon; past the edge of the world the land runs on a while and then sinks into it.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { SKY_GLSL, CLOUD_GLSL, PANO_GLSL, HASH_GLSL } from './shaders.js';

const VERT = /* glsl */ `
attribute vec4 fcol;
varying vec3 vWp; varying vec3 vN; varying vec4 vCol;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWp = wp.xyz; vN = normal; vCol = fcol;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */ `
#include <common>
#include <lights_pars_begin>
${HASH_GLSL}
${SKY_GLSL}
${CLOUD_GLSL}
${PANO_GLSL}
uniform sampler2D tMask; uniform sampler2D tPano; uniform float uMaskN; uniform float uOcean;
uniform float uTime; uniform vec3 uDeep; uniform float uPanoOn; uniform float uWaterY;
varying vec3 vWp; varying vec3 vN; varying vec4 vCol;
vec3 envSky(vec3 r) {
  vec3 c = skyColor(normalize(vec3(r.x, max(r.y, 0.015), r.z)));
  #ifdef PANO
    if (uPanoOn > 0.5) { vec4 cl = texture2D(tPano, panoUV(r)); c = c * (1.0 - cl.a) + cl.rgb; }
  #endif
  return c;
}
void main() {
  vec2 cc = floor(vWp.xz / 16.0);
  if (cc.x >= 0.0 && cc.y >= 0.0 && cc.x < uMaskN && cc.y < uMaskN && texture2D(tMask, (cc + 0.5) / uMaskN).r > 0.5) discard;
  vec3 V = normalize(cameraPosition - vWp);
  vec3 L = vec3(0.0, 1.0, 0.0), sunC = vec3(0.0), hemiSky = vec3(0.3), hemiGround = vec3(0.1);
  #if NUM_DIR_LIGHTS > 0
    L = normalize(inverseTransformDirection(directionalLights[0].direction, viewMatrix)); sunC = directionalLights[0].color;
  #endif
  #if NUM_HEMI_LIGHTS > 0
    hemiSky = hemisphereLights[0].skyColor; hemiGround = hemisphereLights[0].groundColor;
  #endif
  float cs = cloudShadow(vWp, L);
  vec3 col;
  if (uOcean > 0.5) {
    // Open water, far off: the deep blue of the sea, the sky and clouds mirrored in it, and the sun's glitter.
    vec2 q = vWp.xz;
    vec3 N = normalize(vec3(sin(q.x * 0.11 + uTime * 0.7) * 0.025 + (texture2D(uNoise, q * 0.004 + uTime * 0.002).g - 0.5) * 0.12, 1.0,
                            cos(q.y * 0.13 + uTime * 0.6) * 0.025 + (texture2D(uNoise, q * 0.004 - uTime * 0.0017 + 0.5).g - 0.5) * 0.12));
    float NoV = max(dot(N, V), 0.0);
    float F = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);
    vec3 refl = envSky(reflect(-V, N)) * vec3(0.72, 0.84, 0.95);
    col = mix(uDeep * 0.85, refl, F);
    float NoH = max(dot(N, normalize(L + V)), 0.0);
    col += sunC * (pow(NoH, 900.0) * 7.0 + pow(NoH, 90.0) * 0.25) * F * 4.0 * cs;
  } else {
    // Land, far off: its colour, lit by the sun (with the clouds' shadows drifting over it) and the sky.
    vec3 albedo = vCol.rgb * vCol.rgb;
    vec3 N = normalize(vN);
    float NoL = max(dot(N, L), 0.0);
    vec3 hemi = mix(hemiGround, hemiSky, N.y * 0.5 + 0.5);
    col = albedo * RECIPROCAL_PI * (sunC * NoL * cs + hemi);
  }
  col = atmos(col, vWp);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createFarLand({ world, shared, colorOf, sideOf, WL, H, IS_CROSS, IS_WATERY, q }) {
  const n = world.n, cells = world.cells, PAD = 256;
  const S = q && q.post ? 4 : 8;
  // ----- what's on top of the land, in S × S patches -----
  const cols = Math.ceil((n + PAD * 2) / S);
  const hs = new Int16Array(cols * cols), top = new Float32Array(cols * cols * 3), side = new Float32Array(cols * cols * 3);
  const topOf = (x, z) => {
    const t = world.top[z * n + x];
    for (let y = Math.min(H - 1, t + 14); y > 0; y--) { const b = cells[(y * n + z) * n + x]; if (b && !IS_CROSS[b]) return y; }
    return 0;
  };
  const cache = new Map();
  const col = (b, f) => { const k = b * 2 + (f ? 1 : 0); let c = cache.get(k); if (!c) { c = (f ? sideOf : colorOf)(b); cache.set(k, c); } return c; };
  for (let j = 0; j < cols; j++) for (let i = 0; i < cols; i++) {
    const wx = -PAD + i * S, wz = -PAD + j * S, k = j * cols + i;
    // Outside the world the land at its edge carries on, sinking slowly into the sea.
    const cx = Math.max(0, Math.min(n - 1, wx)), cz = Math.max(0, Math.min(n - 1, wz));
    const out = Math.max(Math.abs(wx - cx), Math.abs(wz - cz));
    let hMax = 0, hSum = 0, water = 0, m = 0, tr = 0, tg = 0, tb = 0, sr = 0, sg = 0, sb = 0;
    for (let dz = 0; dz < S; dz += S / 2) for (let dx = 0; dx < S; dx += S / 2) {
      const x = Math.max(0, Math.min(n - 1, cx + (out ? 0 : dx))), z = Math.max(0, Math.min(n - 1, cz + (out ? 0 : dz)));
      const y = topOf(x, z), b = cells[(y * n + z) * n + x];
      if (IS_WATERY[b]) water++;
      hMax = Math.max(hMax, y + 1); hSum += y + 1; m++;
      const a = col(b, false), c = col(b, true);
      tr += a.r; tg += a.g; tb += a.b; sr += c.r; sg += c.g; sb += c.b;
    }
    let h = Math.round(hMax * 0.6 + (hSum / m) * 0.4);
    if (out > 0) h = Math.round(THREE.MathUtils.lerp(h, WL - 6, THREE.MathUtils.smoothstep(out, 24, PAD * 0.85)));
    hs[k] = water * 2 > m || h <= WL ? 0 : h;          // 0: sea (drawn by the sea plane)
    top[k * 3] = tr / m; top[k * 3 + 1] = tg / m; top[k * 3 + 2] = tb / m;
    side[k * 3] = sr / m; side[k * 3 + 1] = sg / m; side[k * 3 + 2] = sb / m;
  }
  // ----- blocky columns, like the near land: a flat top, and sides wherever the next patch is lower -----
  const P = [], N = [], C = [], I = [];
  const quad = (pts, nx, ny, nz, c, shade) => {
    const b = P.length / 3;
    for (let v = 0; v < 4; v++) {
      P.push(pts[v][0], pts[v][1], pts[v][2]); N.push(Math.round(nx * 127), Math.round(ny * 127), Math.round(nz * 127), 0);
      const sh = shade ? shade[v] : 1;
      C.push(Math.round(Math.sqrt(Math.min(1, c[0] * sh)) * 255), Math.round(Math.sqrt(Math.min(1, c[1] * sh)) * 255), Math.round(Math.sqrt(Math.min(1, c[2] * sh)) * 255), 0);
    }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  const hAt = (i, j) => (i < 0 || j < 0 || i >= cols || j >= cols ? 0 : hs[j * cols + i]);
  const base = WL - 0.5;
  for (let j = 0; j < cols; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i, h = hs[k];
    if (!h) continue;
    const x0 = -PAD + i * S, z0 = -PAD + j * S, x1 = x0 + S, z1 = z0 + S, y = h - 0.3;
    const tc = [top[k * 3], top[k * 3 + 1], top[k * 3 + 2]], sc = [side[k * 3] * 0.85, side[k * 3 + 1] * 0.85, side[k * 3 + 2] * 0.85];
    quad([[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]], 0, 1, 0, tc);
    for (const [di, dj, nx, nz] of [[1, 0, 1, 0], [-1, 0, -1, 0], [0, 1, 0, 1], [0, -1, 0, -1]]) {
      const hn = Math.max(hAt(i + di, j + dj), base);
      if (hn >= h) continue;
      const lo = hn - 0.3, dark = [0.62, 1, 1, 0.62];   // the foot of each step a little darker
      if (nx === 1) quad([[x1, lo, z0], [x1, y, z0], [x1, y, z1], [x1, lo, z1]], 1, 0, 0, sc, dark);
      else if (nx === -1) quad([[x0, lo, z1], [x0, y, z1], [x0, y, z0], [x0, lo, z0]], -1, 0, 0, sc, dark);
      else if (nz === 1) quad([[x1, lo, z1], [x1, y, z1], [x0, y, z1], [x0, lo, z1]], 0, 0, 1, sc, dark);
      else quad([[x0, lo, z0], [x0, y, z0], [x1, y, z0], [x1, lo, z0]], 0, 0, -1, sc, dark);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(Int8Array.from(N), 4, true));
  geo.setAttribute('fcol', new THREE.BufferAttribute(Uint8Array.from(C), 4, true));
  geo.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
  geo.computeBoundingSphere();

  // ----- which pieces of the world are drawn in full (the far land and sea are cut away there) -----
  const mN = Math.ceil(n / 16), maskData = new Uint8Array(mN * mN * 4);
  const mask = new THREE.DataTexture(maskData, mN, mN, THREE.RGBAFormat);
  mask.magFilter = mask.minFilter = THREE.NearestFilter; mask.needsUpdate = true;

  const make = (ocean) => {
    const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights]);
    Object.assign(uniforms, shared, { tMask: { value: mask }, uMaskN: { value: mN }, uOcean: { value: ocean ? 1 : 0 } });
    return new THREE.ShaderMaterial({ uniforms, lights: true, fog: false, vertexShader: VERT, fragmentShader: FRAG, defines: q && q.pano ? { PANO: '' } : {} });
  };
  const land = new THREE.Mesh(geo, make(false));
  land.frustumCulled = false; land.renderOrder = 900;     // after the near blocks, so it is hidden behind them for free
  // The sea: one sheet at sea level, under all the far land and out to the horizon.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2).translate(n / 2, WL - 0.14, n / 2), make(true));
  sea.frustumCulled = false; sea.renderOrder = 901;
  const group = new THREE.Group(); group.add(land, sea);

  let dirty = false;
  return {
    group,
    setLoaded(cx, cz, on) {
      if (cx < 0 || cz < 0 || cx >= mN || cz >= mN) return;
      const i = (cz * mN + cx) * 4, v = on ? 255 : 0;
      if (maskData[i] !== v) { maskData[i] = v; dirty = true; }
    },
    update() { if (dirty) { mask.needsUpdate = true; dirty = false; } },
    setQuality(q2) { for (const m of [land.material, sea.material]) { m.defines = q2.pano ? { PANO: '' } : {}; m.needsUpdate = true; } },
    get triangles() { return I.length / 3; },
    get vertices() { return P.length / 3; },
  };
}
