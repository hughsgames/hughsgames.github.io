// Polis World (computer version): pieces of shader code shared by the blocks, the water, the sky and the far land,
// and the one noise picture they all draw on (clouds, puddles, ripples, the moon's craters).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// ---------- the noise picture ----------
// 256 × 256, and it tiles: a picture of soft blobs repeated forever never shows a seam.
//   R: big cloud masses   G: middle detail   B: billows (round cells)   A: fine grain
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function perlin(x, y, period, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const g = (ix, iy, dx, dy) => { const a = hash2(((ix % period) + period) % period, ((iy % period) + period) % period, seed) * Math.PI * 2; return Math.cos(a) * dx + Math.sin(a) * dy; };
  const u = fade(xf), v = fade(yf);
  const a = g(xi, yi, xf, yf), b = g(xi + 1, yi, xf - 1, yf), c = g(xi, yi + 1, xf, yf - 1), d = g(xi + 1, yi + 1, xf - 1, yf - 1);
  return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
}
function fbm(x, y, period, oct, seed) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) { s += amp * perlin(x * f, y * f, period * f, seed + o * 31); norm += amp; amp *= 0.5; f *= 2; }
  return s / norm;
}
function worley(x, y, period, seed) {
  const xi = Math.floor(x), yi = Math.floor(y); let d = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j, wx = ((cx % period) + period) % period, wy = ((cy % period) + period) % period;
    d = Math.min(d, Math.hypot(cx + hash2(wx, wy, seed) - x, cy + hash2(wx, wy, seed + 1) - y));
  }
  return d;
}
let noiseTex = null;
export function makeNoiseTexture() {
  if (noiseTex) return noiseTex;
  const N = 256, data = new Uint8Array(N * N * 4);
  const to = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, i = (y * N + x) * 4;
    data[i] = to(fbm(u * 4, v * 4, 4, 5, 11) * 0.85 + 0.5);
    data[i + 1] = to(fbm(u * 16, v * 16, 16, 4, 23) * 0.9 + 0.5);
    data[i + 2] = to(1 - Math.min(1, worley(u * 8, v * 8, 8, 37) * 1.15));
    data[i + 3] = to(fbm(u * 32, v * 32, 32, 3, 51) * 0.95 + 0.5);
  }
  noiseTex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;
  noiseTex.magFilter = THREE.LinearFilter; noiseTex.minFilter = THREE.LinearMipmapLinearFilter;
  noiseTex.generateMipmaps = true; noiseTex.needsUpdate = true;
  return noiseTex;
}

// ---------- GLSL ----------
// The sky's colour in any direction, and the haze that fades far-off things into exactly that colour.
// Everything is in linear light, before the picture is toned down for the screen.
export const SKY_GLSL = /* glsl */ `
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;
uniform vec3 uWarmCol; uniform float uWarm;
uniform vec3 uSunDir; uniform vec3 uSunGlow;
uniform float uFogDensity; uniform float uFogNear; uniform float uFogFar; uniform float uFogMode; uniform vec3 uFogFlat;
uniform float uFogBase; uniform float uFogFall;
float hgPhase(float mu, float g) { float g2 = g * g; return (1.0 - g2) / (12.566 * pow(max(1.0 + g2 - 2.0 * g * mu, 1e-4), 1.5)); }
vec3 skyColor(vec3 d) {
  float y = d.y;
  vec3 c = mix(uHorizon, uZenith, pow(clamp(y, 0.0, 1.0), 0.42));
  c = mix(c, uGround, smoothstep(0.0, -0.22, y));
  // Sunrise and sunset: a band of orange and pink low in the sky, strongest on the sun's side.
  vec2 hs = normalize(uSunDir.xz + vec2(1e-4)), hv = normalize(d.xz + vec2(1e-4));
  float side = 0.28 + 0.72 * pow(max(dot(hs, hv), 0.0), 2.0);
  float band = exp(-abs(y - 0.02) * 5.5);
  c = mix(c, uWarmCol, clamp(uWarm * band * side, 0.0, 0.85));
  // The bright glow round the sun (light scattered by haze in the air).
  float mu = dot(d, uSunDir);
  c += uSunGlow * (hgPhase(mu, 0.82) * 0.55 + pow(max(mu, 0.0), 6.0) * 0.16) * smoothstep(-0.3, 0.04, y);
  return c;
}
// Haze: the farther away something is, the more it melts into the sky behind it. Thicker low down than up high.
float atmosAmount(vec3 wp) {
  float dist = length(wp - cameraPosition);
  float edge = smoothstep(uFogNear, uFogFar, dist);
  if (uFogMode > 0.5) return edge;
  float avgY = (cameraPosition.y + wp.y) * 0.5;
  float dens = uFogDensity * exp(-max(avgY - uFogBase, 0.0) * uFogFall);
  return max(1.0 - exp(-dist * dens), edge);
}
vec3 atmosColor(vec3 wp) {
  if (uFogMode > 0.5) return uFogFlat;
  vec3 dir = normalize(wp - cameraPosition);
  return skyColor(normalize(vec3(dir.x, max(dir.y, 0.0) * 0.45 + 0.008, dir.z)));
}
vec3 atmos(vec3 col, vec3 wp) { return mix(col, atmosColor(wp), atmosAmount(wp)); }
`;

// Clouds: a layer between heights 160 and 240. Seen from below they are lit by the sun on top and the sky round them;
// the same map darkens the ground where their shadows fall.
export const CLOUD_GLSL = /* glsl */ `
uniform sampler2D uNoise; uniform vec2 uWind; uniform float uCover;
#define CLOUD_BASE 160.0
#define CLOUD_TOP 240.0
float cloudMap(vec2 p) {
  vec2 q = (p + uWind) * (1.0 / 6144.0);
  vec4 a = texture2D(uNoise, q);
  vec4 b = texture2D(uNoise, q * 4.0 + vec2(0.37, 0.71));
  float n = a.r * 0.64 + a.g * 0.2 + b.r * 0.1 + b.a * 0.06;
  float lo = mix(0.6, 0.3, uCover);
  return clamp((n - lo) / 0.17, 0.0, 1.0);
}
float cloudShape(float m, float y) {
  float h = (y - CLOUD_BASE) * (1.0 / (CLOUD_TOP - CLOUD_BASE));
  float top = 0.22 + 0.78 * m;
  return smoothstep(0.0, 0.07, h) * (1.0 - smoothstep(top * 0.5, top, h));
}
float cloudDensity(vec3 p) { float m = cloudMap(p.xz); return m * cloudShape(m, p.y); }
float cloudDensityDetail(vec3 p) {
  float m = cloudMap(p.xz);
  if (m <= 0.0) return 0.0;
  float d = m * cloudShape(m, p.y);
  float e = texture2D(uNoise, (p.xz + uWind * 1.3) * (1.0 / 1100.0) + vec2(p.y * 0.0021, -p.y * 0.0013)).b;
  return clamp(d - (1.0 - e) * 0.42 * (1.0 - d * 0.6), 0.0, 1.0);
}
// How much a spot on the ground is shaded by the clouds overhead (1 = full sun).
float cloudShadow(vec3 wp, vec3 L) {
  vec2 p = wp.xz + L.xz / max(L.y, 0.2) * ((CLOUD_BASE + 30.0) - wp.y);
  float m = cloudMap(p);
  return 1.0 - smoothstep(0.05, 0.75, m) * 0.62 * smoothstep(0.02, 0.2, L.y);
}
`;

// Where a direction lands in the cloud picture (only the upper half of the sky is kept; the horizon gets most room).
export const PANO_GLSL = /* glsl */ `
vec2 panoUV(vec3 d) { return vec2(atan(d.z, d.x) * 0.15915494 + 0.5, sqrt(max(d.y, 0.0))); }
vec3 panoDir(vec2 uv) { float y = uv.y * uv.y, h = sqrt(max(1.0 - y * y, 0.0)), a = (uv.x - 0.5) * 6.2831853; return vec3(cos(a) * h, y, sin(a) * h); }
`;

export const HASH_GLSL = /* glsl */ `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
`;
