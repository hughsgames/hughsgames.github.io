// Polis World (computer version): the pictures of every tool, food and thing you can make, and the 3D models made
// from those same pictures, so what you hold in your hand (and what the townspeople work with) matches its icon.
// Everything here is painted in code: wooden handles with grain and a bound leather grip, metal with a bright bevel
// and a sharpened edge, rivets where the head meets the haft. Pictures are 64 × 64, drawn in a 32-unit space, so every
// detail can land on a half unit; they show at 32 or 16 pixels, both exact halvings, so nothing blurs.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const SS = 2, A = 32, N = A * SS;   // art units across, pixels per art unit, pixels across
// ---------- colours ----------
const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/// A light-to-dark ramp around one colour: k = 0 is in shadow, k = 1 is in full light.
const ramp = (h) => { const c = hex(h), dk = mix(c, [10, 6, 14], 0.52), lt = mix(c, [255, 252, 240], 0.45); return (k) => (k < 0.5 ? mix(dk, c, k * 2) : mix(c, lt, (k - 0.5) * 2)); };
const noise = (x, y, s = 0) => { let h = Math.imul(Math.floor(x) * 374761393 + Math.floor(y) * 668265263 + s * 1442695041, 1274126177); h ^= h >>> 13; return ((h >>> 0) % 1000) / 1000; };
const clamp = (v) => Math.max(0, Math.min(1, v));
const MAT = {
  wood: 0x9a6a3c, darkWood: 0x6f4722, stone: 0x9a9a98, bronze: 0xcf8d40, iron: 0xb5bcc4, ancient: 0x3cc4b4, gold: 0xe8c040,
  copper: 0xc8703a, tin: 0xcfd3d8, obsidian: 0x2c2638, leather: 0x6e4428, cord: 0xb9a06a, cloth: 0xe9dfc8,
};
const TIER = { wooden: 'wood', stone: 'stone', bronze: 'bronze', iron: 'iron', ancient: 'ancient' };

// ---------- a tiny painter ----------
// Art coordinates run 0…32 across the picture; every primitive is drawn at pixel precision inside that.
class Pic {
  constructor() { this.c = new Float32Array(N * N * 3); this.a = new Uint8Array(N * N); this.plain = new Uint8Array(N * N); }
  /// One picture pixel (art coordinates, fractional).
  dot(ax, ay, col, plain) {
    const x = Math.floor(ax * SS), y = Math.floor(ay * SS);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const i = y * N + x;
    this.c[i * 3] = col[0]; this.c[i * 3 + 1] = col[1]; this.c[i * 3 + 2] = col[2]; this.a[i] = 1; if (plain) this.plain[i] = 1;
  }
  /// One whole art unit (the chunky pixel the older pictures were drawn in).
  set(ax, ay, col, plain) { for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) this.dot(ax + i / SS, ay + j / SS, col, plain); }
  getPx(x, y) { const i = y * N + x; return [this.c[i * 3], this.c[i * 3 + 1], this.c[i * 3 + 2]]; }
  /// Runs `fn(ax, ay, x, y)` over the pixels of a box in art coordinates.
  scan(x0, y0, x1, y1, fn) {
    const a = Math.max(0, Math.floor(x0 * SS)), b = Math.max(0, Math.floor(y0 * SS));
    const c = Math.min(N - 1, Math.ceil(x1 * SS)), d = Math.min(N - 1, Math.ceil(y1 * SS));
    for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) fn((x + 0.5) / SS, (y + 0.5) / SS, x, y);
  }
  put(x, y, col, plain) { const i = y * N + x; this.c[i * 3] = col[0]; this.c[i * 3 + 1] = col[1]; this.c[i * 3 + 2] = col[2]; this.a[i] = 1; if (plain) this.plain[i] = 1; }
  /// A thick stroke along a path. width(t) for t from 0 to 1 along it; paint(t, s, x, y) with s from -1 on the lit
  /// (top-left) side to 1 on the shaded side.
  stroke(pts, width, paint) {
    const segs = []; let total = 0;
    for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push([pts[i], pts[i + 1], total, l]); total += l; }
    const W = typeof width === 'number' ? () => width : width;
    let maxW = 0; for (let k = 0; k <= 20; k++) maxW = Math.max(maxW, W(k / 20));
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), m = maxW / 2 + 1;
    this.scan(Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m, (px, py, x, y) => {
      let best = Infinity, bt = 0, bs = 0;
      for (const [a, b, t0, l] of segs) {
        const dx = b[0] - a[0], dy = b[1] - a[1], u = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (l * l || 1)));
        const qx = a[0] + dx * u, qy = a[1] + dy * u, d = Math.hypot(px - qx, py - qy);
        if (d < best) { best = d; bt = (t0 + u * l) / (total || 1); const nx = -dy / (l || 1), ny = dx / (l || 1); bs = ((px - qx) * nx + (py - qy) * ny); }
      }
      const w = W(bt) / 2;
      if (w > 0 && best <= w) this.put(x, y, paint(bt, Math.max(-1, Math.min(1, bs / Math.max(w, 0.35))), px, py));
    });
  }
  poly(pts, paint) {
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    this.scan(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (px, py, x, y) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; }
      if (inside) this.put(x, y, paint(px, py, x, y));
    });
  }
  /// A ball (or an ellipse) lit like a sphere from the top left.
  ball(cx, cy, rx, ry, paint) {
    this.scan(cx - rx, cy - ry, cx + rx, cy + ry, (px, py, x, y) => {
      const u = (px - cx) / rx, v = (py - cy) / ry, d = u * u + v * v;
      if (d > 1) return;
      const nz = Math.sqrt(1 - d), lit = Math.max(0, -u * 0.55 - v * 0.6 + nz * 0.58);
      this.put(x, y, paint(lit, u, v, px, py));
    });
  }
  /// The dark edge round everything (pixel art's outline), one pixel thick.
  outline(dark = 0.42) {
    const add = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (this.a[y * N + x]) continue;
      let n = null;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N && this.a[yy * N + xx] && !this.plain[yy * N + xx]) { n = this.getPx(xx, yy); break; } }
      if (n) add.push([x, y, mix(n, [14, 9, 7], 1 - dark)]);
    }
    for (const [x, y, c] of add) this.put(x, y, c);
    return this;
  }
  canvas() {
    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    const g = cv.getContext('2d', { willReadFrequently: true }), img = g.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { img.data[i * 4] = this.c[i * 3]; img.data[i * 4 + 1] = this.c[i * 3 + 1]; img.data[i * 4 + 2] = this.c[i * 3 + 2]; img.data[i * 4 + 3] = this.a[i] ? 255 : 0; }
    g.putImageData(img, 0, 0);
    return cv;
  }
}

// ---------- materials ----------
/// Wood: round shading across the shaft, grain running along it, and the odd darker knot.
const woodPaint = (h = MAT.wood) => {
  const r = ramp(h);
  return (t, s, x, y) => {
    let k = 0.64 - s * 0.36;
    if (Math.abs(s + 0.12) < 0.1 || Math.abs(s - 0.5) < 0.08) k -= 0.13;          // two grain lines
    if (noise(t * 26, 0, 7) < 0.1) k -= 0.1;                                       // a knot
    k += (noise(x * 2, y * 2, 3) - 0.5) * 0.07;
    return r(clamp(k));
  };
};
/// Metal: a bright bevel along the lit edge, a specular streak, a dark edge underneath. Stone is rough and speckled.
const metalPaint = (m, polish = 1) => {
  const r = ramp(MAT[m] ?? m), rough = m === 'stone' || m === 'wood';
  return (t, s, x, y) => {
    let k = 0.56 - s * 0.38;
    if (s < -0.62) k += 0.3;
    if (s > 0.72) k -= 0.14;
    if (!rough && Math.abs(s + 0.22) < 0.12) k += 0.26 * polish;
    if (rough) k += (noise(x * 2, y * 2, 11) - 0.5) * 0.36;
    return r(clamp(k));
  };
};
/// Leather binding: each wrap is a band across the grip, with a dark gap between.
const wrapPaint = (h = MAT.leather) => {
  const r = ramp(h);
  return (t, s) => { const w = (t * 7) % 1; return r(clamp(0.6 - s * 0.3 - (w < 0.18 ? 0.3 : 0) + (w > 0.4 && w < 0.7 ? 0.12 : 0))); };
};
const flat = (h, k = 0.55) => { const r = ramp(h); return () => r(k); };
const litPoly = (h, x0, y0, x1, y1, lo = 0.3, hi = 0.95) => { const r = ramp(h); return (x, y) => r(clamp(hi - ((x - x0) / (x1 - x0 || 1) * (hi - lo) * 0.5 + (y - y0) / (y1 - y0 || 1) * (hi - lo) * 0.6))); };
const ballPaint = (h, spec = true) => { const r = ramp(h); return (lit, u, v) => (spec && Math.hypot(u + 0.42, v + 0.45) < 0.22 ? mix(r(1), [255, 255, 255], 0.5) : r(clamp(0.16 + lit * 0.86))); };

// ---------- tools ----------
// Every tool is held at the bottom left and reaches to the top right, so they all sit in the hand the same way.
export const GRIP = { tool: [7.5 * SS, 25.5 * SS], food: [16 * SS, 16 * SS] };
const dir = (x0, y0, x1, y1) => { const l = Math.hypot(x1 - x0, y1 - y0) || 1; return [(x1 - x0) / l, (y1 - y0) / l]; };
/// A wooden handle, slightly thicker at the butt, with an end cap.
function haft(p, x0, y0, x1, y1, w = 2.8, h = MAT.wood, cap = true) {
  p.stroke([[x0, y0], [x1, y1]], (t) => w * (1.08 - t * 0.16), woodPaint(h));
  if (cap) { const [dx, dy] = dir(x0, y0, x1, y1); p.stroke([[x0 - dx * 0.3, y0 - dy * 0.3], [x0 + dx * 0.9, y0 + dy * 0.9]], w * 1.18, (t, s) => ramp(MAT.darkWood)(clamp(0.5 - s * 0.3))); }
}
/// The bound grip: leather wrapped round the handle where your hand goes.
function binding(p, x0, y0, x1, y1, w = 3.3, h = MAT.leather) { p.stroke([[x0, y0], [x1, y1]], w, wrapPaint(h)); }
/// A rivet: a little domed stud.
const rivet = (p, x, y, m = 'iron') => p.ball(x, y, 1.05, 1.05, ballPaint(MAT[m] ?? m));
/// The collar where a head is socketed onto the handle.
function socket(p, x, y, ang, len, w, m) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  p.stroke([[x - dx * len / 2, y - dy * len / 2], [x + dx * len / 2, y + dy * len / 2]], w, metalPaint(m, 0.7));
}

const TOOL_ART = {
  // A pick head: two tapering arms either side of the eye, curving up away from the haft, one pointed, one chisel-ended.
  pickaxe(p, m) {
    haft(p, 5, 28.6, 21.2, 12.4);
    binding(p, 7, 26.5, 12, 21.5);
    // The head is one bar: thick at the eye, tapering to a point one end and a chisel the other, bowed away from the haft.
    const mid = [[12, 7], [16.5, 9], [20.8, 11.6], [25, 15], [28.6, 19.6]], half = [0.5, 1.5, 1.9, 1.5, 0.8], nx = 0.6, ny = -0.8;
    p.poly([...mid.map(([x, y], k) => [x + nx * half[k], y + ny * half[k]]), ...mid.map(([x, y], k) => [x - nx * half[k], y - ny * half[k]]).reverse()],
      litPoly(MAT[m], 11, 6, 30, 21, 0.3, 0.95));
    if (m === 'stone') p.poly([...mid.map(([x, y], k) => [x + nx * half[k], y + ny * half[k]]), ...mid.map(([x, y], k) => [x - nx * half[k], y - ny * half[k]]).reverse()],
      (x, y) => ramp(MAT.stone)(clamp(0.62 - (y - 6) / 36 + (noise(x * 2, y * 2, 17) - 0.5) * 0.5)));
    p.stroke(mid.map(([x, y], k) => [x + nx * half[k], y + ny * half[k]]), 1.1, () => ramp(MAT[m])(0.98));
    p.stroke([[11.9, 6.9], [12.6, 7.4]], 1.3, () => ramp(MAT[m])(1));
    p.stroke([[28, 19.2], [29.1, 20.3]], 1.6, () => ramp(MAT[m])(1));
    socket(p, 20.8, 11.6, Math.PI / 4, 4.4, 3.4, m);
    rivet(p, 20.8, 11.6, m === 'wood' ? MAT.darkWood : 'bronze');
  },
  // An axe head: a socket on the haft, a flaring cheek and a curved cutting edge.
  axe(p, m) {
    haft(p, 5.5, 28.6, 20.8, 12.4);
    binding(p, 7.5, 26.5, 12, 21.5);
    const face = [[19.6, 11.4], [26.8, 4.4], [29.4, 7.8], [29.4, 11.2], [26.8, 14.8], [25.4, 15.4], [20.8, 13.4]];
    p.poly(face, litPoly(MAT[m], 19, 4, 30, 16, 0.28, 0.95));
    if (m === 'stone') p.poly(face, (x, y) => ramp(MAT.stone)(clamp(0.62 - (y - 4) / 34 + (noise(x * 2, y * 2, 17) - 0.5) * 0.5)));
    p.stroke([[27, 4.6], [29.4, 8], [29.4, 11.2], [26.8, 14.6]], 1.5, () => ramp(MAT[m])(1));   // the sharpened edge
    p.stroke([[20.2, 11.8], [26.2, 5.8]], 1, () => ramp(MAT[m])(0.95));                                 // the top edge catches the light
    socket(p, 20.2, 12.4, Math.PI / 4, 4.8, 3.4, m);
    rivet(p, 20.2, 12.4, 'bronze');
  },
  // A spade: a long blade with a rib down it and a rounded point, socketed, with a flared butt to push against.
  shovel(p, m) {
    haft(p, 6.6, 27.4, 19.8, 14.2, 2.6);
    p.stroke([[4.6, 29.4], [8.6, 25.4]], 3, (t, s) => ramp(MAT.darkWood)(clamp(0.55 - s * 0.3)));
    const c = [24.4, 9.4], a = Math.PI / 4, rot = (x, y) => [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
    p.poly([[-4.1, 6.8], [4.1, 6.8], [4.6, 0.4], [3.4, -4.4], [0, -7.6], [-3.4, -4.4], [-4.6, 0.4]].map(([x, y]) => rot(x, y)), litPoly(MAT[m], 17, 2, 31, 16, 0.3, 0.95));
    p.stroke([rot(0, 5.4), rot(0, -5.2)], 1.5, metalPaint(m, 0.9));                                   // the rib
    p.stroke([rot(-3.6, -3.8), rot(0, -7.2), rot(3.6, -3.8)], 1.3, () => ramp(MAT[m])(1));            // the sharpened lip
    p.stroke([rot(-4.1, 4.4), rot(-4.5, 0.4)], 1, () => ramp(MAT[m])(0.35));
    socket(p, 19.9, 14.1, Math.PI / 4, 3.6, 3.4, m);
    rivet(p, 19.9, 14.1, 'bronze');
  },
  // A tapering blade with a fuller down the middle, a crossguard, a wrapped grip and a pommel.
  sword(p, m) {
    const blade = metalPaint(m, 1.15);
    p.stroke([[10.4, 21.4], [26, 5.8], [29.4, 2.4]], (t) => (t > 0.8 ? 3.8 * (1 - (t - 0.8) / 0.2) + 0.4 : 3.8 - t * 0.5), (t, s, x, y) => {
      if (Math.abs(s) < 0.3 && t < 0.76) return ramp(MAT[m])(clamp(0.34 + (0.3 - Math.abs(s))));   // the fuller (the groove down the blade)
      const c = blade(t, s, x, y);
      return Math.abs(s) > 0.72 ? mix(c, [255, 255, 255], 0.3) : c;                                 // sharpened edges catch the light
    });
    p.stroke([[6.8, 18], [14.2, 25.4]], (t) => 2 + Math.sin(t * Math.PI) * 0.9, metalPaint(m === 'iron' || m === 'ancient' ? 'bronze' : m === 'wood' ? 'wood' : 'gold', 0.8));
    p.ball(10.5, 21.6, 1.9, 1.9, ballPaint(m === 'wood' ? MAT.wood : MAT.gold));
    binding(p, 4.8, 27.2, 9.4, 22.6, 3.1, m === 'wood' ? MAT.darkWood : MAT.leather);
    p.ball(3.8, 28.2, 2.2, 2.2, ballPaint(m === 'wood' ? MAT.wood : MAT.gold));
  },
  // A leaf-shaped head with a ridge down it, socketed and bound onto a long shaft.
  spear(p) {
    haft(p, 2.4, 30.2, 22.2, 10.4, 2.1);
    p.poly([[20.4, 12.8], [21.8, 8.6], [24.6, 4.2], [29.8, 0.4], [27.8, 6], [24.4, 10], [23, 12.2]], litPoly(MAT.iron, 20, 0, 30, 13, 0.3, 1));
    p.stroke([[21.8, 11.4], [29.4, 1.4]], 1.1, () => ramp(MAT.iron)(1));
    p.stroke([[22.8, 11.8], [28.4, 4.8]], 0.7, () => ramp(MAT.iron)(0.28));
    socket(p, 21, 12.4, Math.PI / 4, 4.2, 3.3, 'bronze');
    rivet(p, 20.4, 13, 'bronze');
    binding(p, 18.4, 15, 20.6, 12.8, 2.7, MAT.cord);
  },
  // An iron head with a flat striking face one side and a tapered peen the other.
  hammer(p) {
    haft(p, 5.6, 28.4, 20, 14, 2.6);
    binding(p, 7, 27, 11.5, 22.5, 3.1);
    const c = [21.4, 12.6], a = Math.PI / 4, rot = (x, y) => [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
    p.poly([[-2.6, -4.2], [2.6, -4.2], [2.4, 1.4], [1.3, 4.6], [-1.3, 4.6], [-2.4, 1.4]].map(([x, y]) => rot(x, y)), litPoly(MAT.iron, 16, 7, 27, 18, 0.3, 0.95));
    p.stroke([rot(-2.7, -4), rot(2.7, -4)], 1.4, () => ramp(MAT.iron)(0.98));       // the striking face
    p.stroke([rot(-1.3, 4.4), rot(1.3, 4.4)], 1.2, () => ramp(MAT.iron)(0.4));      // the peen
    p.stroke([rot(-2.2, 1.1), rot(2.2, 1.1)], 0.7, () => ramp(MAT.iron)(0.26));    // the eye the handle passes through
  },
  // A long shaft with a wide blade socketed across the end, for breaking up the soil.
  hoe(p) {
    haft(p, 3.4, 30, 23, 10.4, 2.3);
    p.poly([[21.4, 8.2], [25.6, 5.6], [30, 10.4], [27.4, 15.4], [23.4, 12.2], [20.6, 11]], litPoly(MAT.iron, 20, 5, 30, 16, 0.3, 0.95));
    p.stroke([[25.8, 5.8], [29.8, 10.6], [27.4, 15]], 1.3, () => ramp(MAT.iron)(1));
    socket(p, 21.6, 10, -Math.PI / 5, 4.2, 3.4, 'bronze');
    rivet(p, 21.6, 10, 'bronze');
  },
  // A crescent blade, wide at the base and sharp on the inside, riveted to a short handle.
  sickle(p) {
    haft(p, 4.6, 29, 11.4, 22.2, 3.3);
    socket(p, 12, 21.6, Math.PI / 4, 3, 3.6, 'bronze');
    const pts = [[12, 21.6], [15, 18.4]];
    for (let k = 0; k <= 16; k++) { const a = Math.PI * (0.86 + k / 16 * 1.12); pts.push([19 + Math.cos(a) * 8.4, 15 + Math.sin(a) * 8.4]); }
    p.stroke(pts, (t) => 4.2 - t * 3.2, (t, s, x, y) => (s > 0.4 ? mix(ramp(MAT.iron)(1), [255, 255, 255], 0.3) : metalPaint('iron')(t, s, x, y)));
    rivet(p, 12.6, 21, 'bronze');
  },
  // A short, thick chisel: an octagonal shaft, a bevelled cutting edge, and a head mushroomed from being struck.
  chisel(p) {
    p.stroke([[6.4, 28], [13, 21.4]], (t) => 4.2 - t * 0.8, woodPaint(0x7a4a2a));
    p.ball(6.2, 28.2, 2.6, 2.6, ballPaint(0x6a3e22, false));
    socket(p, 13.4, 21, Math.PI / 4, 2.4, 4, 'bronze');
    p.stroke([[13.4, 21], [24.6, 9.8]], (t) => 2.3 - t * 0.2, metalPaint('iron'));
    p.stroke([[14.2, 20.6], [23.8, 11]], 0.7, () => ramp(MAT.iron)(1));
    p.stroke([[23.8, 10.6], [25.4, 9]], 2.6, (t, s) => ramp(MAT.iron)(clamp(0.95 - s * 0.25)));   // the bevel at the cutting edge
  },
  // A reed handle, a crimped metal ferrule, and a soft wedge of bristles.
  brush(p) {
    p.stroke([[4.6, 29.4], [18.4, 15.6]], (t) => 2.5 - t * 0.5, woodPaint(0x8a5a32));
    p.stroke([[18, 16], [21, 13]], 3.2, metalPaint('bronze', 0.8));
    for (const o of [-0.9, 0.9]) p.stroke([[18.8 + o * 0.6, 15.2 + o * 0.6], [20.4 + o * 0.6, 13.6 + o * 0.6]], 0.7, () => ramp(MAT.bronze)(0.25));
    // The bristles: a wedge that narrows to a point, each strand a little darker toward the tip.
    p.stroke([[20.8, 13.2], [25.4, 8.6]], (t) => 4.4 - t * 2.2, (t, s) => ramp(0x8a6038)(clamp(0.78 - s * 0.3 - t * 0.26)));
    for (const k of [-1, 0, 1]) p.stroke([[21.4 + k * 1.1, 12.6 - k * 1.1], [24.8 + k * 0.6, 9.2 - k * 0.6]], 0.6, () => ramp(0x4a3420)(0.5));
    p.stroke([[24.6, 9.4], [25.6, 8.4]], 2.4, (t, s) => ramp(0x2a1e14)(clamp(0.5 - s * 0.2)));   // ink on the tips
  },
  // A tapering rod, whipped at the butt, with a line, a float and a hook.
  rod(p) {
    p.stroke([[3, 30], [28.6, 4.4]], (t) => 2.4 - t * 1.6, woodPaint(0x7a5232));
    binding(p, 3.4, 29.6, 7.4, 25.6, 2.8, MAT.cord);
    for (const [x, y] of [[13, 20], [19, 14]]) { p.set(x, y, ramp(MAT.iron)(0.75)); p.set(x + 0.5, y - 0.5, ramp(MAT.iron)(0.95)); }
    for (let y = 5; y <= 23; y++) p.dot(28.6, y, [238, 238, 238], true);
    p.ball(28.6, 17.4, 1.4, 1.8, ballPaint(0xd8392c));
    p.ball(28.6, 16.4, 1.2, 1.2, ballPaint(0xf2efe6));
    p.stroke([[28.4, 23], [27.2, 25.4], [28.8, 26]], 0.9, () => ramp(MAT.iron)(0.85));
    p.dot(27.6, 24.6, ramp(MAT.iron)(1));
  },
  // A long oar: a round loom with a leather sleeve, and a wide flat blade with a spine.
  oar(p) {
    p.stroke([[3, 30.4], [19.4, 14]], (t) => 2.4 - t * 0.3, woodPaint(0x9a7246));
    binding(p, 9.4, 24, 12.6, 20.8, 2.9);
    const c = [24.2, 9.2], a = Math.PI / 4, rot = (x, y) => [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
    p.poly([[-2.9, 7.4], [2.9, 7.4], [3.3, 1], [2.9, -5.6], [1.6, -7.4], [-1.6, -7.4], [-2.9, -5.6], [-3.3, 1]].map(([x, y]) => rot(x, y)), litPoly(0xb48a58, 17, 2, 31, 17, 0.35, 0.95));
    p.stroke([rot(0, 6.6), rot(0, -6.6)], 1.3, (t, s) => ramp(0x8a6238)(clamp(0.5 - s * 0.25)));
    p.stroke([rot(-3.2, 6.6), rot(-3.4, -4.6)], 1, () => ramp(0xd8ab72)(0.95));
    p.stroke([[3, 30.4], [4.6, 28.8]], 3.2, (t, s) => ramp(MAT.darkWood)(clamp(0.55 - s * 0.3)));
  },
};

// ---------- everything else ----------
const meat = (p, raw, bone) => {
  const flesh = raw ? 0xc4504c : 0x8a4a28, fat = raw ? 0xe9b0a4 : 0xc08a52;
  p.poly([[7, 12], [13, 8], [21, 8], [26, 12], [26, 20], [21, 25], [12, 25], [7, 19]], (x, y) => {
    const k = clamp(0.88 - (x - 7) / 44 - (y - 8) / 40 + (noise(x * 2, y * 2, 21) - 0.5) * 0.18);
    return noise(x, y * 2, 5) > 0.86 ? ramp(fat)(0.7) : ramp(flesh)(k);
  });
  if (!raw) for (const yy of [11, 15, 19, 23]) p.stroke([[8.5, yy], [25, yy - 3]], 1.2, () => ramp(0x4a2a16)(0.45));
  if (bone) { p.stroke([[20, 24.5], [27.5, 28.5]], 2.6, (t, s) => ramp(0xf2ead6)(clamp(0.7 - s * 0.3))); p.ball(28, 29, 2.2, 2, ballPaint(0xf6efdd)); }
};
const bowl = (p, food) => {
  p.ball(16, 17, 12, 4.6, (lit, u, v, x, y) => food(x, y, lit));
  p.poly([[4, 18], [28, 18], [25, 26], [20, 28], [12, 28], [7, 26]], litPoly(0xb06a3a, 4, 18, 28, 28, 0.35, 0.95));
  p.stroke([[5, 18.5], [27, 18.5]], 1.4, () => ramp(0xd8865a)(0.9));
};
const ART = {
  stick(p) {
    p.stroke([[7, 27], [16, 17], [25, 6]], (t) => 2.8 - t * 0.9, woodPaint(0x8a5a32));
    p.stroke([[15.6, 17.4], [12.6, 12.6], [12, 9.6]], 1.3, woodPaint(0x8a5a32));
    p.stroke([[19.6, 13.4], [23, 11.6]], 1, woodPaint(0x7a4e2a));
    for (const [x, y] of [[11, 22], [19, 13], [22.5, 9]]) p.set(x, y, ramp(0x5a3a20)(0.3));
  },
  apple(p) {
    p.ball(15.5, 18.5, 10.2, 9.6, (lit, u, v, x, y) => {
      if (Math.hypot(u + 0.44, v + 0.46) < 0.2) return [255, 238, 228];
      const streak = noise(Math.round((Math.atan2(v, u) + 3.2) * 9), 0, 3) > 0.55 ? 0.08 : 0;
      const c = ramp(0xc8222a)(clamp(0.12 + lit * 0.84 + streak));
      return v > 0.32 && u < -0.05 ? mix(c, [226, 156, 40], 0.2) : c;
    });
    p.stroke([[15.8, 10.4], [17.4, 5]], (t) => 1.7 - t * 0.5, woodPaint(0x5a3a20));
    p.poly([[17.6, 7.4], [20.4, 4.2], [25.4, 3.2], [27, 5], [23.2, 8.2], [19.4, 8.6]], litPoly(0x4c9a2c, 17, 3, 27, 9, 0.35, 1));
    p.stroke([[18.6, 7.6], [25.4, 4.6]], 0.8, () => ramp(0x3a7a22)(0.3));
  },
  bread(p) {
    p.ball(16, 18.5, 13, 8.4, (lit, u, v, x, y) => {
      const c = ramp(0xc9883a)(clamp(0.18 + lit * 0.82 + (noise(x * 2, y * 2, 9) - 0.5) * 0.1));
      return v < -0.4 ? mix(c, [242, 214, 156], 0.3) : c;
    });
    for (const k of [-6.5, 0, 6.5]) p.stroke([[16 + k - 2.6, 16.4], [16 + k + 1.6, 12.2]], 1.4, (t, s) => ramp(0xf0dcb0)(clamp(0.9 - s * 0.25)));
    for (let i = 0; i < 9; i++) p.dot(7 + i * 2.2, 12.4 + (i % 2) * 0.8, [246, 238, 220]);
  },
  coal(p) { for (const [x, y, r] of [[12, 18.5, 7], [20.5, 16, 6.6], [16, 22.5, 5.6]]) p.ball(x, y, r, r * 0.85, (lit, u, v, xx, yy) => (noise(xx * 2, yy * 2, 2) > 0.9 ? [214, 214, 226] : ramp(0x2e2e34)(clamp(0.08 + lit * 0.72)))); },
  charcoal(p) {
    p.stroke([[6, 25.5], [26, 9]], 6.4, (t, s, x, y) => (noise(x * 2, y * 2, 4) > 0.9 ? [176, 122, 92] : ramp(0x2a2522)(clamp(0.56 - s * 0.36))));
    for (let k = 0; k < 5; k++) p.stroke([[8.5 + k * 4.4, 21 - k * 3.6], [10.5 + k * 4.4, 23 - k * 3.6]], 0.7, () => [20, 18, 18]);
  },
  snowball(p) { p.ball(16, 17, 10.5, 10.5, (lit, u, v, x, y) => (noise(x * 2, y * 2, 13) > 0.93 ? [255, 255, 255] : ramp(0xdce8f4)(clamp(0.3 + lit * 0.74)))); },
  wheat(p) {
    p.stroke([[16.4, 30], [15.4, 16]], 1.4, () => ramp(0xb89a3a)(0.55));
    for (const [x, y, s] of [[15.4, 22, -1], [15.8, 25, 1]]) p.stroke([[x, y], [x + s * 5, y - 3.5]], 1, () => ramp(0xc9ab4a)(0.5));
    for (let k = 0; k < 6; k++) {
      const y = 15.5 - k * 2.3, w = 3.4 - k * 0.25;
      for (const s of [-1, 1]) {
        p.ball(15.6 + s * w * 0.45, y, 1.5, 1.9, ballPaint(0xe8c24a));
        p.stroke([[15.6 + s * w * 0.5, y - 1.4], [15.6 + s * w * 1.35, y - 4.6]], 0.6, () => ramp(0xd8b860)(0.75));
      }
    }
    p.ball(15.6, 2.6, 1.5, 1.9, ballPaint(0xe8c24a));
  },
  wheatSeeds(p) {
    p.poly([[7, 17], [25, 17], [23, 27], [9, 27]], litPoly(0x8a6a44, 7, 17, 25, 27, 0.35, 0.8));
    p.stroke([[7, 17.5], [25, 17.5]], 2, (t, s) => ramp(0x6a4e30)(clamp(0.6 - s * 0.3)));
    for (let k = 0; k < 14; k++) { const x = 9 + (k % 7) * 2.2, y = 9 + Math.floor(k / 7) * 3 + (k % 2) * 1.4; p.ball(x, y, 1.2, 1.7, ballPaint(0xe8c24a)); }
  },
  leather(p) {
    p.poly([[5, 9], [27, 7], [28, 22], [20, 26], [8, 25], [4, 18]], (x, y) => ramp(0x8a5a30)(clamp(0.9 - (x - 4) / 56 - (y - 7) / 46 + (noise(x * 2, y * 2, 19) - 0.5) * 0.12)));
    p.stroke([[7, 11], [25.5, 9.6]], 0.7, () => ramp(0x5a3a1c)(0.4));
    for (let k = 0; k < 9; k++) p.dot(7 + k * 2.3, 10.4 - k * 0.14, [226, 206, 170]);
    p.stroke([[6, 22.5], [21, 24]], 0.7, () => ramp(0x5a3a1c)(0.4));
  },
  wool(p) {
    for (const [x, y, r] of [[12, 18, 7], [20, 15, 6.5], [19, 22, 6], [12, 12, 5.5]]) p.ball(x, y, r, r * 0.92, (lit, u, v, xx, yy) => ramp(0xf2efe6)(clamp(0.3 + lit * 0.7 + (noise(xx, yy, 23) - 0.5) * 0.12)));
    for (let k = 0; k < 10; k++) { const a = k * 1.9, x = 16 + Math.cos(a) * 7.5, y = 18 + Math.sin(a) * 6.5; p.stroke([[x, y], [x + 1.4, y - 1.2]], 0.7, () => ramp(0xd8d2c4)(0.5)); }
  },
  feather(p) {
    p.stroke([[7, 28], [24, 5]], (t) => 1.5 - t * 0.6, () => ramp(0xd8cdb4)(0.75));
    for (let k = 0; k < 17; k++) {
      const t = k / 16, x = 7 + (24 - 7) * t, y = 28 + (5 - 28) * t, w = Math.sin(Math.min(1, t * 1.15) * Math.PI) * 5.2;
      p.stroke([[x, y], [x - w * 0.5, y - w * 0.72]], 1, () => ramp(0xf2efe6)(0.9));
      p.stroke([[x, y], [x + w * 0.62, y + w * 0.4]], 1, () => ramp(0xcfc8b6)(0.6));
    }
    p.stroke([[6.4, 29], [9, 26.4]], 1.3, () => ramp(0xe8e0cc)(0.95));
  },
  silk(p) {
    p.poly([[4, 10], [28, 6], [28, 20], [4, 24]], (x, y) => ramp(0x3a6ab8)(clamp(0.82 - (y - 6) / 36 + ((x + y) % 5 === 0 ? 0.12 : 0))));
    for (let k = 0; k < 5; k++) p.stroke([[5 + k * 5.4, 10.6 - k * 0.8], [7.6 + k * 5.4, 22 - k * 0.8]], 1.1, () => ramp(0xe8c24a)(0.75));
    p.stroke([[4, 23], [28, 19]], 2.2, (t, s) => ramp(0x2a4a8a)(clamp(0.6 - s * 0.3)));
    p.stroke([[4, 10.6], [28, 6.6]], 1.4, () => ramp(0x6a9ad8)(0.95));
  },
  rawBeef(p) { meat(p, true, true); }, rawMutton(p) { meat(p, true, true); }, rawPork(p) { meat(p, true, false); },
  goatMeat(p) { meat(p, true, true); },
  roastBeef(p) { meat(p, false, true); }, roastMutton(p) { meat(p, false, true); }, roastPork(p) { meat(p, false, false); },
  roastGoat(p) { meat(p, false, true); },
  rawChicken(p) {
    p.poly([[9, 10], [18, 8], [24, 13], [25, 21], [18, 26], [10, 24], [7, 17]], (x, y) => ramp(0xe8c9a8)(clamp(0.9 - (x - 7) / 44 - (y - 8) / 44 + (noise(x * 2, y * 2, 21) - 0.5) * 0.14)));
    p.stroke([[20, 23], [27.5, 28]], 2.6, (t, s) => ramp(0xf2ead6)(clamp(0.72 - s * 0.3)));
    p.ball(28, 28.6, 2.2, 2, ballPaint(0xf6efdd));
    p.stroke([[11, 12], [20, 10.4]], 1, () => ramp(0xd8b48a)(0.5));
  },
  roastChicken(p) {
    p.poly([[9, 10], [18, 8], [24, 13], [25, 21], [18, 26], [10, 24], [7, 17]], (x, y) => ramp(0xb8782e)(clamp(0.92 - (x - 7) / 40 - (y - 8) / 40 + (noise(x * 2, y * 2, 21) - 0.5) * 0.16)));
    p.stroke([[20, 23], [27.5, 28]], 2.6, (t, s) => ramp(0xf2ead6)(clamp(0.72 - s * 0.3)));
    p.ball(28, 28.6, 2.2, 2, ballPaint(0xf6efdd));
    for (const yy of [13, 17, 21]) p.stroke([[9.5, yy], [23, yy - 2]], 1.1, () => ramp(0x6a3a14)(0.45));
  },
  rawFish(p) {
    p.poly([[5, 16], [11, 10], [20, 9], [26, 14], [26, 19], [20, 24], [11, 23]], (x, y) => ramp(0x7fa8c4)(clamp(0.95 - (y - 9) / 26 + (noise(x, y, 31) > 0.7 ? 0.1 : 0))));
    p.poly([[5, 16], [1.5, 10], [1.5, 22]], litPoly(0x5a84a4, 1, 10, 6, 22, 0.4, 0.9));
    p.poly([[13, 10], [19, 5], [21, 10]], litPoly(0x5a84a4, 13, 5, 21, 11, 0.4, 0.9));
    for (let k = 0; k < 18; k++) { const x = 10 + (k % 6) * 2.6, y = 12 + Math.floor(k / 6) * 3.2 + (k % 2); p.stroke([[x, y], [x + 1.4, y + 1.2]], 0.7, () => ramp(0xa8ccdc)(0.9)); }
    p.ball(23.4, 14.4, 1.7, 1.7, ballPaint(0xf2efe6)); p.dot(23.4, 14.4, [20, 20, 28]); p.dot(23, 14, [20, 20, 28]);
  },
  cookedFish(p) {
    p.poly([[5, 16], [11, 10], [20, 9], [26, 14], [26, 19], [20, 24], [11, 23]], (x, y) => ramp(0xc08a4a)(clamp(0.95 - (y - 9) / 26 + (noise(x * 2, y * 2, 31) - 0.5) * 0.18)));
    p.poly([[5, 16], [1.5, 10], [1.5, 22]], litPoly(0x9a6a34, 1, 10, 6, 22, 0.4, 0.9));
    for (const k of [0, 1, 2]) p.stroke([[9 + k * 5, 11], [11 + k * 5, 23]], 1.3, () => ramp(0x5a3010)(0.45));
    p.ball(23.4, 14.4, 1.6, 1.6, ballPaint(0xe8dcc0));
  },
  driedKelp(p) {
    p.stroke([[12, 29], [14, 20], [11, 12], [15, 4]], (t) => 5 - t * 1.6, (t, s) => ramp(0x3a5a2a)(clamp(0.6 - s * 0.35 + (t * 7 % 1 < 0.2 ? -0.15 : 0))));
    p.stroke([[21, 27], [19, 18], [23, 9]], (t) => 4 - t * 1.4, (t, s) => ramp(0x47682f)(clamp(0.58 - s * 0.32)));
  },
  door(p) {
    p.poly([[8, 3], [24, 3], [24, 30], [8, 30]], (x, y) => { const plank = Math.floor((x - 8) / 4); return ramp(0x8a5a32)(clamp(0.42 + (plank % 2) * 0.14 + ((x - 8) % 4 > 3.4 ? -0.22 : 0) + (noise(x, y * 2, 9) - 0.5) * 0.1)); });
    for (const y of [8, 22]) { p.stroke([[8.5, y], [23.5, y]], 2.2, (t, s) => ramp(0x4a4a4e)(clamp(0.55 - s * 0.35))); for (const x of [10, 14, 18, 22]) p.dot(x, y, [182, 182, 190]); }
    p.ball(20.6, 16, 1.7, 1.7, ballPaint(MAT.iron));
    p.stroke([[8, 3], [24, 3]], 1.2, () => ramp(0xa8784a)(0.95));
  },
  gate(p) {
    for (const x of [5, 26]) p.stroke([[x, 6], [x, 29]], 3.2, (t, s) => ramp(0x7a4e2a)(clamp(0.62 - s * 0.32)));
    for (const y of [11, 21]) p.stroke([[6, y], [25, y]], 2.6, (t, s) => ramp(0x9a6a3c)(clamp(0.64 - s * 0.34)));
    p.stroke([[7, 21], [24, 11]], 2.2, (t, s) => ramp(0x9a6a3c)(clamp(0.62 - s * 0.32)));
    for (const [x, y] of [[6.5, 11], [24.5, 11], [6.5, 21], [24.5, 21]]) p.dot(x, y, ramp(MAT.iron)(0.9));
  },
  poppy(p) {
    p.stroke([[16, 30], [15, 17]], 1.5, (t, s) => ramp(0x4c8a32)(clamp(0.6 - s * 0.3)));
    p.poly([[15, 24], [9.5, 20.5], [11.5, 25.5]], litPoly(0x56a03a, 9, 20, 16, 26, 0.4, 0.9));
    for (const [x, y] of [[12, 12], [20, 12], [12, 17], [20, 17]]) p.ball(x, y, 5.2, 4.8, ballPaint(0xd42a24, false));
    p.ball(16, 14.5, 2.6, 2.6, (lit) => ramp(0x241824)(clamp(0.3 + lit * 0.6)));
    for (let k = 0; k < 6; k++) { const a = k * 1.05; p.dot(16 + Math.cos(a) * 1.6, 14.5 + Math.sin(a) * 1.6, [60, 48, 60]); }
  },
  dandelion(p) {
    p.stroke([[16, 30], [16, 16]], 1.5, (t, s) => ramp(0x5a9a36)(clamp(0.6 - s * 0.3)));
    p.poly([[16, 26], [9, 22], [11, 27]], litPoly(0x5a9a36, 9, 22, 16, 27, 0.4, 0.9));
    p.poly([[16, 24], [23, 20], [21, 25]], litPoly(0x5a9a36, 16, 20, 23, 25, 0.4, 0.9));
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; p.stroke([[16, 11], [16 + Math.cos(a) * 6.6, 11 + Math.sin(a) * 6.6]], 1.6, () => ramp(0xf2c62a)(clamp(0.55 + Math.cos(a + 2.3) * 0.3))); }
    p.ball(16, 11, 2.6, 2.6, ballPaint(0xe0a018, false));
  },
  parchment(p) {
    p.poly([[6, 4], [26, 4], [26, 28], [6, 28]], (x, y) => ramp(0xe8d6a6)(clamp(0.64 + (noise(x * 2, y * 2, 2) - 0.5) * 0.1 - (x > 23 || y > 25 ? 0.16 : 0))));
    p.stroke([[6, 4.5], [26, 4.5]], 1.2, () => ramp(0xf4e8c0)(0.95));
    for (const y of [9, 13, 17, 21]) p.stroke([[9, y], [22 - (y % 3) * 2, y]], 1, () => ramp(0x50402a)(0.35));
    p.poly([[22, 28], [26, 24], [26, 28]], () => ramp(0xcdb888)(0.45));
  },
  paper(p) {
    p.poly([[7, 4], [25, 4], [25, 28], [7, 28]], (x, y) => ramp(0xf4f0e6)(clamp(0.66 + (noise(x * 2, y * 2, 8) - 0.5) * 0.07 - (x > 22 ? 0.12 : 0))));
    for (const x of [21, 17, 13]) p.stroke([[x, 8], [x, 22]], 1.1, () => ramp(0x2a2422)(0.4));
    for (const x of [21, 17]) p.stroke([[x - 0.6, 9], [x - 0.6, 13]], 0.7, () => ramp(0x2a2422)(0.4));
  },
  papyrus(p) {
    p.poly([[5, 9], [23, 9], [23, 25], [5, 25]], (x, y) => ramp(0xd8c88a)(clamp(0.58 + (Math.floor(x) % 3 === 0 ? 0.07 : 0) + (Math.floor(y) % 3 === 0 ? -0.07 : 0))));
    p.stroke([[24, 7], [24, 27]], 5.2, (t, s) => ramp(0xcdbb7a)(clamp(0.62 - s * 0.35)));
    p.ball(24, 7.5, 2.6, 2.2, ballPaint(0xd8c88a, false));
    for (const y of [13, 17, 21]) p.stroke([[8, y], [19, y]], 1, () => ramp(0x50422a)(0.35));
  },
  amphora(p) {
    p.poly([[13, 5], [19, 5], [19, 9], [24, 13], [25, 18], [21, 25], [17.5, 30], [14.5, 30], [11, 25], [7, 18], [8, 13], [13, 9]], litPoly(0xb5643a, 7, 5, 25, 30, 0.3, 0.95));
    p.stroke([[12.5, 8], [9, 9.4], [8.5, 13]], 1.8, (t, s) => ramp(0x9a4e2a)(clamp(0.6 - s * 0.3)));
    p.stroke([[19.5, 8], [23, 9.4], [23.5, 13]], 1.8, (t, s) => ramp(0x9a4e2a)(clamp(0.6 - s * 0.3)));
    p.stroke([[9, 17], [23, 17]], 1.3, () => [48, 32, 24]);
    p.stroke([[10, 20.5], [22, 20.5]], 0.8, () => [48, 32, 24]);
    p.stroke([[12.5, 5], [19.5, 5]], 1.5, () => ramp(0xd88a58)(0.95));
    p.stroke([[11.5, 12], [12.5, 22]], 1, () => ramp(0xe09a68)(0.95));
  },
  clayPot(p) {
    p.ball(16, 19, 11, 9.6, (lit, u, v) => { const c = ramp(0xc06a3a)(clamp(0.16 + lit * 0.82)); return Math.abs(v + 0.16) < 0.1 ? [48, 32, 24] : Math.abs(v - 0.26) < 0.07 ? mix(c, [240, 200, 150], 0.5) : c; });
    p.poly([[10, 7], [22, 7], [21, 11], [11, 11]], litPoly(0xc06a3a, 10, 7, 22, 11, 0.35, 0.95));
    p.stroke([[10.5, 7.5], [21.5, 7.5]], 1.2, () => ramp(0xe09060)(0.95));
  },
  beads(p) {
    for (let k = 0; k < 13; k++) { const a = Math.PI * (0.04 + k / 12 * 0.92); p.ball(16 + Math.cos(a) * 11.5, 8.5 + Math.sin(a) * 15.5, 2, 2, ballPaint([0xd2502a, 0xe8c040, 0x3a7ec8][k % 3])); }
    p.ball(16, 25.5, 3.4, 4.2, ballPaint(0xc8402a));
    p.stroke([[12.5, 9], [16, 7.6], [19.5, 9]], 0.6, () => [90, 70, 50]);
  },
  obsidianBlade(p) {
    p.poly([[6, 27], [12, 17], [20, 9], [27.5, 3.5], [24, 12], [16, 20]], (x, y) => (noise(x * 2, y * 2, 5) > 0.84 ? [132, 120, 164] : ramp(MAT.obsidian)(clamp(0.3 + (27 - x) / 38))));
    p.stroke([[7, 26], [25, 6]], 0.8, () => [196, 186, 226]);
    binding(p, 6.4, 27.4, 11, 22.6, 3, MAT.cord);
  },
  glassBottle(p) {
    p.poly([[14, 4], [18, 4], [18, 11], [23, 15], [23, 28], [9, 28], [9, 15], [14, 11]], (x, y) => mix(ramp(0x5ab8a8)(clamp(0.38 + (23 - x) / 34)), [255, 255, 255], x < 11.5 && y > 15 && y < 25 ? 0.5 : 0.05));
    p.stroke([[10.5, 17], [10.5, 24]], 1.1, () => [226, 250, 246]);
    p.stroke([[13.5, 4], [18.5, 4]], 1.8, (t, s) => ramp(0x8a6a48)(clamp(0.6 - s * 0.3)));
    p.poly([[9.5, 22], [22.5, 22], [22.5, 27.5], [9.5, 27.5]], (x, y) => mix(ramp(0x3a8a7a)(clamp(0.4 + (23 - x) / 40)), [255, 255, 255], x < 11.5 ? 0.35 : 0));
  },
  statuette(p) {
    const m = ramp(0xece6da);
    p.poly([[10, 27], [22, 27], [22, 30], [10, 30]], (x) => m(clamp(0.45 + (22 - x) / 36)));
    p.poly([[13, 12], [19, 12], [20.5, 27], [11.5, 27]], (x, y) => m(clamp(0.55 + (20 - x) / 22 - (y - 12) / 60)));
    p.ball(16, 8.4, 3.5, 3.7, (lit) => m(clamp(0.28 + lit * 0.72)));
    p.stroke([[19, 13], [22.5, 18]], 1.7, () => m(0.58)); p.stroke([[13, 13], [10.5, 19]], 1.7, () => m(0.85));
    for (let y = 16; y < 27; y += 2.6) p.stroke([[12.6, y], [19.4, y + 1]], 0.7, () => m(0.32));
    p.dot(14.6, 8, [90, 80, 70]); p.dot(17.4, 8, [90, 80, 70]);
  },
  cotton(p) {
    p.stroke([[16, 30], [16, 18]], 1.7, woodPaint(0x6a4a2a));
    p.stroke([[16, 22], [9, 16]], 1.3, woodPaint(0x6a4a2a)); p.stroke([[16, 21], [23, 15]], 1.3, woodPaint(0x6a4a2a));
    for (const [x, y, r] of [[16, 11.5, 5.2], [9, 13, 4.2], [23, 12, 4.2]]) {
      p.ball(x, y, r, r * 0.92, (lit, u, v, xx, yy) => ramp(0xf6f4ee)(clamp(0.28 + lit * 0.72 + (noise(xx, yy, 27) - 0.5) * 0.1)));
      for (let k = 0; k < 4; k++) { const a = k * 1.6; p.dot(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, ramp(0xd8d2c0)(0.6)); }
    }
  },
  sealStone(p) {
    p.poly([[6, 6], [26, 6], [26, 26], [6, 26]], (x, y) => ramp(0xd2c4a0)(clamp(0.78 - (x - 6) / 50 - (y - 6) / 50 + (noise(x * 2, y * 2, 33) - 0.5) * 0.1)));
    p.stroke([[6, 6.5], [26, 6.5]], 1.2, () => ramp(0xe8dcbc)(0.95));
    p.poly([[10, 15], [13, 12], [20, 12], [22, 14], [22, 19], [10, 19]], () => ramp(0x8a7a58)(0.4));
    for (const x of [11, 20]) p.stroke([[x, 19], [x, 23]], 1.5, () => ramp(0x8a7a58)(0.4));
    p.stroke([[21, 12], [24, 9]], 1.3, () => ramp(0x8a7a58)(0.4));
    for (const x of [9, 12, 15, 18]) p.set(x, 9, [96, 76, 54]);
  },
  figs(p) { for (const [x, y] of [[11, 19], [21, 18], [16, 12]]) { p.ball(x, y, 6.2, 6.6, ballPaint(0x6a2a5a)); p.stroke([[x, y - 6], [x + 1, y - 8.4]], 1.4, () => ramp(0x4c8a32)(0.6)); p.ball(x - 2, y + 2, 1.2, 1.2, (lit) => ramp(0x8a4a7a)(clamp(0.4 + lit))); } },
  dates(p) { p.stroke([[16, 3], [16, 10]], 1.7, woodPaint(0x9a7a3a)); for (const [x, y] of [[11, 13], [16, 12], [21, 13], [9, 20], [14, 19], [19, 19], [24, 20], [12, 26], [18, 26]]) p.ball(x, y, 2.8, 3.6, ballPaint(0x8a4a22)); },
  olives(p) {
    p.stroke([[4, 26], [28, 8]], 1.5, woodPaint(0x6a5a3a));
    for (const [x, y] of [[10, 17], [19, 13], [24, 15]]) p.poly([[x, y], [x + 4, y - 4], [x + 6, y - 2], [x + 2, y + 1]], litPoly(0x6a8a4a, x, y - 4, x + 6, y + 1, 0.4, 0.9));
    for (const [x, y, c] of [[9, 24, 0x5a6a2a], [15, 20, 0x2a2232], [21, 19, 0x5a6a2a], [25, 12, 0x2a2232]]) p.ball(x, y, 2.8, 3.4, ballPaint(c));
  },
  puls(p) { bowl(p, (x, y, lit) => ramp(0xe0c890)(clamp(0.38 + lit * 0.5 + (noise(x * 2, y * 2, 1) - 0.5) * 0.16))); },
  fishStew(p) { bowl(p, (x, y, lit) => (x > 9 && x < 19 && y > 14 && y < 18 ? ramp(0xc8c8d0)(0.62) : ramp(0xc87a3a)(clamp(0.32 + lit * 0.5 + (noise(x * 2, y * 2, 4) > 0.86 ? 0.3 : 0))))); },
  riceBowl(p) { bowl(p, (x, y, lit) => (noise(x * 2, y * 2, 6) > 0.86 ? [70, 130, 60] : ramp(0xf4f2ea)(clamp(0.32 + lit * 0.62)))); },
  tortilla(p) { p.ball(16, 17, 13, 9.2, (lit, u, v, x, y) => (noise(x, y, 9) > 0.8 ? ramp(0x8a5a2a)(0.5) : ramp(0xe8c88a)(clamp(0.32 + lit * 0.62)))); },
  honeyCake(p) {
    p.poly([[5, 15], [27, 15], [27, 26], [5, 26]], litPoly(0xc8883a, 5, 15, 27, 26, 0.4, 0.92));
    p.ball(16, 15, 11, 3.8, (lit) => ramp(0xd8a03a)(clamp(0.38 + lit * 0.62)));
    for (const [x, l] of [[9, 5], [15, 3.4], [22, 6]]) p.stroke([[x, 15], [x, 15 + l]], 2.2, (t, s) => ramp(0xf0b830)(clamp(0.8 - s * 0.2)));
    for (const x of [10, 13, 19, 23]) p.ball(x, 13, 1.2, 1.1, ballPaint(0xf2e8c8, false));
  },
  salt(p) {
    p.ball(16, 22, 12, 6, (lit, u, v, x, y) => (noise(x * 2, y * 2, 3) > 0.82 ? [255, 255, 255] : ramp(0xe8e8ee)(clamp(0.28 + lit * 0.68))));
    p.ball(16, 17, 8, 6, (lit, u, v, x, y) => (noise(x * 2, y * 2, 4) > 0.82 ? [255, 255, 255] : ramp(0xeef0f6)(clamp(0.3 + lit * 0.68))));
  },
  tea(p) {
    for (const [cx, cy, a] of [[11, 18, -0.6], [20, 14, 0.5], [17, 23, 1.6]]) {
      const pts = []; for (let k = 0; k < 10; k++) { const t = k / 9; pts.push([cx + Math.cos(a) * (t - 0.5) * 16, cy + Math.sin(a) * (t - 0.5) * 16]); }
      p.stroke(pts, (t) => Math.sin(t * Math.PI) * 7 + 0.4, (t, s) => ramp(0x4a8a3a)(clamp(0.62 - s * 0.3 + (Math.abs(s) < 0.12 ? 0.22 : 0))));
    }
  },
  murex(p) {
    p.poly([[16, 3], [22, 10], [23, 18], [19, 26], [16, 30], [13, 26], [9, 18], [10, 10]], litPoly(0xd8b8a0, 9, 3, 23, 30, 0.35, 0.95));
    for (const [x, y, dx] of [[10, 12, -4], [22, 12, 4], [9, 18, -4], [23, 18, 4], [11, 24, -3], [21, 24, 3]]) p.stroke([[x, y], [x + dx, y - 1]], 1.5, (t, s) => ramp(0xc9a890)(clamp(0.6 - s * 0.3)));
    for (let y = 8; y < 26; y += 4) p.stroke([[11, y], [21, y + 1]], 0.8, () => ramp(0x9a6a5a)(0.4));
    p.ball(16, 20, 2.2, 3.2, ballPaint(0x82348c));
  },
  // The relics of Atlantis (a legend).
  trident(p) {
    const gold = metalPaint('gold');
    p.stroke([[5, 29], [21, 13]], (t) => 2.6 - t * 0.3, gold);
    binding(p, 6.6, 27.4, 11, 23, 3, 0xd8743a);
    p.stroke([[18.4, 10.4], [25.6, 17.6]], 2.4, gold);
    p.stroke([[21.6, 13.6], [29.4, 5.8]], (t) => 2.2 - t * 0.9, gold);
    p.stroke([[18.8, 10.8], [24.8, 4.8]], (t) => 1.9 - t * 0.8, gold);
    p.stroke([[25.2, 17.2], [31, 11.4]], (t) => 1.9 - t * 0.8, gold);
    for (const [x, y] of [[29.4, 5.8], [24.9, 4.7], [30.7, 11.7]]) p.ball(x, y, 1.6, 1.6, ballPaint(MAT.gold, false));
    p.ball(22, 14, 1.9, 1.9, ballPaint(0x36c8e8));
    p.ball(4.6, 29.4, 1.8, 1.8, ballPaint(0xf4f0e6));
  },
  lawTablet(p) {
    p.poly([[6, 5], [26, 5], [26, 29], [6, 29]], (x, y) => ramp(0xd8743a)(clamp(0.8 - (x - 6) / 42 - (y - 5) / 42)));
    p.poly([[8, 7], [24, 7], [24, 27], [8, 27]], (x) => ramp(0xd8743a)(clamp(0.6 - (x - 6) / 60)));
    p.poly([[11, 2], [21, 2], [23, 5], [9, 5]], (x) => ramp(0xd8743a)(clamp(0.74 - (x - 9) / 36)));
    for (let row = 0; row < 6; row++) { let x = 9.5; while (x < 23) { const w = 0.8 + noise(x * 3, row, 5) * 1.6; p.stroke([[x, 10 + row * 3], [x + w, 10 + row * 3]], 1, () => ramp(0x8a3a1a)(0.35)); x += w + 1.2; } }
    for (const [x, y] of [[7, 6], [25, 6], [7, 28], [25, 28]]) p.ball(x, y, 1.2, 1.2, ballPaint(0x36c8e8));
    for (const x of [14, 16, 18]) p.dot(x, 3.4, [255, 230, 140]);
  },
  seahorse(p) {
    const gold = metalPaint('gold');
    const tail = []; for (let k = 0; k <= 22; k++) { const t = k / 22, a = Math.PI * (0.5 + t * 2.2), r = 9 - t * 6; tail.push([16 + Math.cos(a) * r * 0.75, 22 + Math.sin(a) * r * 0.55 - (1 - t) * 4]); }
    p.stroke([[15, 13], [15.5, 18], ...tail], (t) => 5.6 - t * 4.4, gold);
    p.poly([[12, 4], [18, 3], [24, 7], [25, 10], [20, 10], [16, 12], [12, 14]], litPoly(MAT.gold, 12, 3, 27, 14, 0.4, 1));
    p.stroke([[11.5, 5], [10, 9], [10.5, 13], [12, 16]], 1.7, (t, s) => ramp(0x36c8e8)(clamp(0.7 - s * 0.3)));
    p.ball(18, 6, 1.4, 1.4, ballPaint(0x1e4a8a, false));
    p.stroke([[13, 15], [10, 20]], 1.9, gold); p.stroke([[17, 15], [19, 20]], 1.9, gold);
    for (const x of [9.5, 18.5]) p.stroke([[x, 21], [x + 2, 21]], 1.4, () => ramp(0x1a6a9a)(0.6));
    for (let k = 0; k < 5; k++) p.dot(14.5 + k * 0.2, 19 + k * 1.6, ramp(MAT.gold)(1));
  },
};
// New tool items: what builders, farmers, painters and fishers use (you can make them too).
export const TOOL_ITEMS = { hammer: 'hammer', hoe: 'hoe', sickle: 'sickle', chisel: 'chisel', brush: 'brush', fishingRod: 'rod', oar: 'oar' };

/// The picture for an item, or null if this file doesn't paint one (then the game's original picture is used).
export function paintItem(id, item) {
  const p = new Pic();
  const tier = Object.keys(TIER).find((k) => id.startsWith(k) && /(Pickaxe|Axe|Shovel|Sword)$/.test(id));
  if (tier) { TOOL_ART[id.slice(tier.length).toLowerCase()](p, TIER[tier]); return p.outline(); }
  if (id === 'ironSpear') { TOOL_ART.spear(p); return p.outline(); }
  if (TOOL_ITEMS[id]) { TOOL_ART[TOOL_ITEMS[id]](p); return p.outline(); }
  const ingot = { copperIngot: 'copper', tinIngot: 'tin', bronzeIngot: 'bronze', ironIngot: 'iron', goldIngot: 'gold', ancientMetal: 'ancient' }[id];
  if (ingot) {
    const r = ramp(MAT[ingot]);
    p.poly([[5, 16], [18, 11], [28, 15], [15, 20]], (x, y) => r(clamp(0.92 - (y - 11) / 40)));
    p.poly([[5, 16], [15, 20], [15, 25], [5, 21]], (x, y) => r(clamp(0.56 - (y - 16) / 60)));
    p.poly([[15, 20], [28, 15], [28, 20], [15, 25]], (x, y) => r(clamp(0.32 - (y - 15) / 80)));
    p.stroke([[8.6, 15.6], [17, 12.4]], 1.2, () => mix(r(1), [255, 255, 255], 0.45));
    p.stroke([[15, 20], [28, 15]], 0.8, () => r(0.7));
    return p.outline();
  }
  if (ART[id]) { ART[id](p); return p.outline(); }
  return null;
}
/// Which picture is drawn for a tool name the townspeople use (people.js), so their tools match yours.
export const PEOPLE_TOOL = { hammer: 'hammer', pick: 'ironPickaxe', chisel: 'chisel', brush: 'brush', hoe: 'hoe', sickle: 'sickle', oar: 'oar', rod: 'fishingRod' };

// ---------- real sizes ----------
// How big each thing really is, in blocks (a block is about a metre): its longest side, or for a tool its length.
const TOOL_LEN = { Pickaxe: 0.85, Axe: 0.75, Shovel: 1.1, Sword: 0.85 };
export const SIZE = {
  ironSpear: 2.2, hammer: 0.45, hoe: 1.3, sickle: 0.5, chisel: 0.25, brush: 0.3, fishingRod: 2.4, oar: 2.6, stick: 0.6, trident: 2.0,
  apple: 0.09, bread: 0.3, wheat: 0.6, wheatSeeds: 0.12, snowball: 0.1, coal: 0.12, charcoal: 0.15,
  copperIngot: 0.22, tinIngot: 0.22, bronzeIngot: 0.22, ironIngot: 0.22, goldIngot: 0.22, ancientMetal: 0.22,
  leather: 0.5, wool: 0.3, feather: 0.25, silk: 0.4, cotton: 0.2,
  rawBeef: 0.25, rawMutton: 0.22, rawPork: 0.22, rawChicken: 0.25, goatMeat: 0.2, rawFish: 0.35,
  roastBeef: 0.25, roastMutton: 0.22, roastPork: 0.22, roastChicken: 0.25, roastGoat: 0.2, cookedFish: 0.35, driedKelp: 0.2,
  door: 2.0, gate: 1.4, poppy: 0.35, dandelion: 0.25, torch: 0.6, kelp: 0.8, seagrass: 0.5, purpleFan: 0.4, yellowFan: 0.4, ladder: 1.0,
  parchment: 0.3, paper: 0.3, papyrus: 0.35, amphora: 0.75, clayPot: 0.3, beads: 0.3, obsidianBlade: 0.18, glassBottle: 0.15,
  statuette: 0.3, sealStone: 0.05, figs: 0.12, dates: 0.2, olives: 0.15, puls: 0.18, fishStew: 0.2, riceBowl: 0.16,
  tortilla: 0.2, honeyCake: 0.16, salt: 0.14, tea: 0.1, murex: 0.1, lawTablet: 0.6, seahorse: 0.35,
};
export const isLongTool = (id) => /(Pickaxe|Axe|Shovel|Sword)$/.test(id) || ['ironSpear', 'hammer', 'hoe', 'sickle', 'chisel', 'brush', 'fishingRod', 'oar', 'stick', 'trident'].includes(id);
export function realSize(id) { const t = Object.keys(TOOL_LEN).find((k) => id.endsWith(k)); return SIZE[id] ?? (t ? TOOL_LEN[t] : 0.3); }
/// The size of one picture pixel in blocks, so the whole thing comes out at its real size. Tools are drawn
/// corner to corner, so their length is measured along the diagonal.
export function pixelSize(canvas, id) {
  const g = canvas.getContext('2d', { willReadFrequently: true }), W = canvas.width, d = g.getImageData(0, 0, W, canvas.height).data;
  let x0 = W, y0 = W, x1 = -1, y1 = -1;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return { ps: 1 / W, extent: W };
  const w = x1 - x0 + 1, h = y1 - y0 + 1, extent = isLongTool(id) ? Math.hypot(w, h) * 0.92 : Math.max(w, h);
  return { ps: realSize(id) / extent, extent };
}

// ---------- 3D models from pictures ----------
/// A solid model of a picture: every coloured pixel becomes a little block, `depth` pixels thick, with its sides shaded.
/// The model is in pixel units, with (0, 0) at the picture's top-left, x to the right, y up and z out of the picture.
export function extrude(canvas, depth = 1.6) {
  const g = canvas.getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, canvas.width, canvas.height).data, W = canvas.width, H = canvas.height;
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 128;
  const pos = [], col = [], nrm = [];
  const lin = (v) => Math.pow(v / 255, 2.2);   // picture colours are sRGB; the 3D model's vertex colours are linear
  const quad = (a, b, c, e, n, rgb, k) => { for (const v of [a, b, c, a, c, e]) { pos.push(...v); nrm.push(...n); col.push(lin(rgb[0]) * k, lin(rgb[1]) * k, lin(rgb[2]) * k); } };
  const z0 = -depth / 2, z1 = depth / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!on(x, y)) continue;
    const i = (y * W + x) * 4, rgb = [d[i], d[i + 1], d[i + 2]], X0 = x, X1 = x + 1, Y0 = -(y + 1), Y1 = -y;
    quad([X0, Y0, z1], [X1, Y0, z1], [X1, Y1, z1], [X0, Y1, z1], [0, 0, 1], rgb, 1);
    quad([X1, Y0, z0], [X0, Y0, z0], [X0, Y1, z0], [X1, Y1, z0], [0, 0, -1], rgb, 0.8);
    if (!on(x - 1, y)) quad([X0, Y0, z0], [X0, Y0, z1], [X0, Y1, z1], [X0, Y1, z0], [-1, 0, 0], rgb, 0.85);
    if (!on(x + 1, y)) quad([X1, Y0, z1], [X1, Y0, z0], [X1, Y1, z0], [X1, Y1, z1], [1, 0, 0], rgb, 0.7);
    if (!on(x, y - 1)) quad([X0, Y1, z1], [X1, Y1, z1], [X1, Y1, z0], [X0, Y1, z0], [0, 1, 0], rgb, 0.95);
    if (!on(x, y + 1)) quad([X0, Y0, z0], [X1, Y0, z0], [X1, Y0, z1], [X0, Y0, z1], [0, -1, 0], rgb, 0.6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}
/// A tool as it sits in a hand: the handle runs forward (+z) from the grip, the head stands up and down (y), as in
/// people.js. Used for your own hand in third person and for every townsperson's tools.
export function toolInHand(geo, grip = GRIP.tool, handY = -0.68, ps = 1 / N) {
  const g = geo.clone();
  const m = new THREE.Matrix4().makeTranslation(0, handY, 0)
    .multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2))
    .multiply(new THREE.Matrix4().makeRotationZ(-Math.PI / 4))
    .multiply(new THREE.Matrix4().makeScale(ps, ps, ps))
    .multiply(new THREE.Matrix4().makeTranslation(-grip[0], grip[1], 0));
  g.applyMatrix4(m);
  return g;
}
