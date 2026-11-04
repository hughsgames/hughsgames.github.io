// The blocks' pictures, painted at eight times the detail of the original 10 × 10 art: real grain in stone, pebbles in
// dirt, blades of grass, furrowed bark, growth rings, boards with wood grain, leaves you can see between, crystals in
// the ores. Each picture keeps the colours of its original (taken from the old art), so the world looks like itself,
// only finely made. Everything wraps round at the edges, so a wall of the same block shows no seams.
//
// Pure arithmetic on arrays (no canvas), so it can be tried out anywhere. `src` is the original sheet (80 wide, 8
// pictures a row, 10 × 10 each, RGBA), `rows` how many rows of pictures, `R` the new size of a picture (80).
// Pictures without a painter of their own are enlarged with the Scale2x rule (edges stay crisp, steps get smoothed),
// then given a fine grain.

export function paintHD(src, rows, R, T) {
  const W = 8 * R, out = new Uint8ClampedArray(W * rows * R * 4), bump = new Uint8ClampedArray(W * rows * R);
  const P = painters(T);
  for (let t = 0; t < 8 * rows; t++) {
    const pal = palette(src, t);
    if (!pal.n) continue;   // an empty slot
    const tile = new Float32Array(R * R * 4);
    const fn = P[t] || generic, c = new Ctx(tile, R, t, pal, src);
    fn(c);
    if (c.keepColours !== true) matchMean(tile, R, pal, c.keepColours === 'tint');
    // The bumps: what the painter said stands up and sinks in, or else how light each pixel is.
    const h = c.h || new Float32Array(R * R).map((_, i) => (0.2126 * tile[i * 4] + 0.7152 * tile[i * 4 + 1] + 0.0722 * tile[i * 4 + 2]) / 255);
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < R * R; i++) { if (h[i] < lo) lo = h[i]; if (h[i] > hi) hi = h[i]; }
    const span = Math.max(1e-6, hi - lo);
    const ox = (t % 8) * R, oy = Math.floor(t / 8) * R;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const i = (y * R + x) * 4, o = ((oy + y) * W + ox + x) * 4;
      out[o] = tile[i]; out[o + 1] = tile[i + 1]; out[o + 2] = tile[i + 2]; out[o + 3] = tile[i + 3];
      bump[(oy + y) * W + ox + x] = tile[i + 3] < 128 ? 64 : ((h[y * R + x] - lo) / span) * 255;
    }
  }
  return { rgba: out, bump };
}

/// The whole block atlas, ready for the graphics card: every picture painted (paintHD), each in a cell with wrapped
/// borders `3 × scale` wide (so far-away, blurred copies don't bleed into their neighbours), the bumps turned into a
/// normal map in the same layout. Rows are stored bottom-up, as a texture wants them, so tileUV in engine.js finds the
/// same places it always did. `scale` 8 gives 80-pixel pictures (1024 × 4096), 4 gives 40-pixel ones (512 × 2048).
/// See-through pixels keep the colour of the pixels next to them, so smooth filtering doesn't draw dark rims round
/// leaves and grass.
export function buildAtlasData(sheet, T, scale = 8, rows = 32) {
  const R = 80, hd = paintHD(sheet, rows, R, T), SW = 8 * R;
  bleed(hd.rgba, SW, rows * R, R);
  const C = 16 * scale, Pd = 3 * scale, Tl = 10 * scale, k = Math.max(1, Math.round(R / Tl)), w = C * 8, h = C * rows;
  const rgba = new Uint8ClampedArray(w * h * 4), ht = new Float32Array(w * h);
  for (let t = 0; t < 8 * rows; t++) {
    const cx = (t % 8) * C, cy = Math.floor(t / 8) * C, ox = (t % 8) * R, oy = Math.floor(t / 8) * R;
    for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
      const tx = mod(x - Pd, Tl), ty = mod(y - Pd, Tl);
      let r = 0, g = 0, b = 0, a = 0, hh = 0;
      for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
        const si = (oy + ty * k + j) * SW + ox + tx * k + i;
        r += hd.rgba[si * 4]; g += hd.rgba[si * 4 + 1]; b += hd.rgba[si * 4 + 2]; a += hd.rgba[si * 4 + 3]; hh += hd.bump[si];
      }
      const n = k * k, row = h - 1 - (cy + y), o = row * w + cx + x;
      rgba[o * 4] = r / n; rgba[o * 4 + 1] = g / n; rgba[o * 4 + 2] = b / n; rgba[o * 4 + 3] = a / n;
      ht[o] = hh / n / 255;
    }
  }
  // Bumps into a normal map: x across, y up the texture, z out of the face.
  const normal = new Uint8ClampedArray(w * h * 4), S = 7 * Tl / 80;
  const at = (x, y) => ht[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = -(at(x + 1, y) - at(x - 1, y)) * 0.5 * S, ny = -(at(x, y + 1) - at(x, y - 1)) * 0.5 * S, l = Math.hypot(nx, ny, 1), o = (y * w + x) * 4;
    normal[o] = (nx / l * 0.5 + 0.5) * 255; normal[o + 1] = (ny / l * 0.5 + 0.5) * 255; normal[o + 2] = (1 / l * 0.5 + 0.5) * 255; normal[o + 3] = 255;
  }
  return { w, h, scale, rgba, normal };
}
/// Gives every see-through pixel the colour of the solid pixels nearest it (spreading out a pixel at a time, within its
/// own picture), and any left over the picture's average.
function bleed(px, W, Hh, R) {
  for (let ty = 0; ty < Hh / R; ty++) for (let tx = 0; tx < W / R; tx++) {
    const ox = tx * R, oy = ty * R, known = new Uint8Array(R * R);
    let sr = 0, sg = 0, sb = 0, sn = 0;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const i = ((oy + y) * W + ox + x) * 4; if (px[i + 3] >= 16) { known[y * R + x] = 1; sr += px[i]; sg += px[i + 1]; sb += px[i + 2]; sn++; } }
    if (!sn || sn === R * R) continue;
    for (let pass = 0; pass < 12; pass++) {
      const next = known.slice();
      let grew = false;
      for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
        if (known[y * R + x]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = mod(x + dx, R), yy = mod(y + dy, R);
          if (!known[yy * R + xx]) continue;
          const j = ((oy + yy) * W + ox + xx) * 4; r += px[j]; g += px[j + 1]; b += px[j + 2]; n++;
        }
        if (n) { const i = ((oy + y) * W + ox + x) * 4; px[i] = r / n; px[i + 1] = g / n; px[i + 2] = b / n; next[y * R + x] = 1; grew = true; }
      }
      known.set(next);
      if (!grew) break;
    }
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) if (!known[y * R + x]) { const i = ((oy + y) * W + ox + x) * 4; px[i] = sr / sn; px[i + 1] = sg / sn; px[i + 2] = sb / sn; }
  }
}

// ---------- numbers that look random but are always the same ----------
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h = Math.imul(h ^ (h >>> 16), 2246822507); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k * k * (3 - 2 * k);
const mod = (a, n) => ((a % n) + n) % n;

/// Smooth noise that wraps: cells `cx` × `cy` pixels, repeating every R pixels (R must be a whole number of cells).
function vnoise(x, y, cx, cy, R, s) {
  const px = Math.max(1, Math.round(R / cx)), py = Math.max(1, Math.round(R / cy)), gx = x / cx, gy = y / cy;
  const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = smooth(gx - x0), fy = smooth(gy - y0);
  const L = lattice(px, py, s), i0 = mod(x0, px), i1 = (i0 + 1) % px, j0 = mod(y0, py) * px, j1 = ((mod(y0, py) + 1) % py) * px;
  return lerp(lerp(L[j0 + i0], L[j0 + i1], fx), lerp(L[j1 + i0], L[j1 + i1], fx), fy);
}
/// The random values at the corners of a noise grid, worked out once (the same numbers `hash` would give each time).
const lattices = new Map();
function lattice(px, py, s) {
  const key = (s * 512 + px) * 512 + py;
  let L = lattices.get(key);
  if (!L) {
    if (lattices.size > 4000) lattices.clear();
    L = new Float64Array(px * py);
    for (let j = 0; j < py; j++) for (let i = 0; i < px; i++) L[j * px + i] = hash(i, j, s);
    lattices.set(key, L);
  }
  return L;
}
/// Several sizes of noise on top of each other: big soft shapes with finer and finer detail.
function fbm(x, y, R, cell, oct, s, stretch = 1) {
  let a = 0, amp = 1, sum = 0, c = cell;
  for (let o = 0; o < oct; o++) { a += amp * vnoise(x, y, c * stretch, c, R, s + o * 17); sum += amp; amp *= 0.5; c /= 2; if (c * Math.min(stretch, 1) < 1.25) break; }
  return a / sum;
}
/// The nearest few of a wrapping grid of `n` × `n` jittered points: distances (pixels) and which cell.
function voronoi(x, y, n, R, s, jit = 0.9) {
  const cs = R / n, gx = Math.floor(x / cs), gy = Math.floor(y / cs), A = lattice(n, n, s), B = lattice(n, n, s + 1);
  let d1 = 1e9, d2 = 1e9, id = 0, px = 0, py = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j, wx = mod(cx, n), wy = mod(cy, n);
    const qx = (cx + 0.5 + (A[wy * n + wx] - 0.5) * jit) * cs, qy = (cy + 0.5 + (B[wy * n + wx] - 0.5) * jit) * cs;
    const d = Math.hypot(x - qx, y - qy);
    if (d < d1) { d2 = d1; d1 = d; id = wy * n + wx; px = qx; py = qy; } else if (d < d2) d2 = d;
  }
  return { d1, d2, id, px, py, cs };
}

// ---------- the colours of the original picture ----------
function palette(src, t) {
  const sx = (t % 8) * 10, sy = Math.floor(t / 8) * 10, px = [];
  let r = 0, g = 0, b = 0;
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
    const i = ((sy + y) * 80 + sx + x) * 4;
    if (src[i + 3] < 128) continue;
    const c = [src[i], src[i + 1], src[i + 2]];
    px.push(c); r += c[0]; g += c[1]; b += c[2];
  }
  const n = px.length;
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  px.sort((a, c) => lum(a) - lum(c));
  const mean = n ? [r / n, g / n, b / n] : [0, 0, 0];
  /// The colour at a place on the dark-to-light scale of the picture (0 darkest, 1 lightest), blended smoothly.
  const q = (f) => {
    if (!n) return [0, 0, 0];
    const k = clamp(f) * (n - 1), i = Math.floor(k), j = Math.min(n - 1, i + 1), u = k - i;
    return [lerp(px[i][0], px[j][0], u), lerp(px[i][1], px[j][1], u), lerp(px[i][2], px[j][2], u)];
  };
  // Colours that stand out from the rest (the red of an apple, the copper in an ore).
  const off = px.filter((c) => Math.hypot(c[0] - mean[0], c[1] - mean[1], c[2] - mean[2]) > 70).sort((a, c) => sat(c) - sat(a));
  return { n, px, q, mean, lum: lum(mean), odd: off.length ? off[0] : null, odd2: off.length > 1 ? off[Math.floor(off.length / 2)] : null, opaque: n / 100 };
}
const sat = (c) => Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
const lumOf = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
/// How light each row of the original picture is, on average (10 numbers, top to bottom).
function rowProfile(c) { const p = []; for (let y = 0; y < 10; y++) { let s = 0, n = 0; for (let x = 0; x < 10; x++) { const o = c.orig(x * c.R / 10, y * c.R / 10); if (o[3] > 128) { s += lumOf(o); n++; } } p.push(n ? s / n : 0); } return p; }
/// A row profile read smoothly at `u` (0 top, 1 bottom), wrapping round.
function sampleProfile(p, u) { const k = mod(u * 10 - 0.5, 10), i = Math.floor(k), j = (i + 1) % 10, f = k - i; return lerp(p[i], p[j], smooth(f)); }
/// Splits a picture's colours into the common ones (the rock round an ore) and the ones that stand out from them (the ore).
function splitPalette(pal) {
  const med = pal.q(0.5), far = (c) => Math.hypot(c[0] - med[0], c[1] - med[1], c[2] - med[2]);
  const base = pal.px.filter((c) => far(c) < 60), spot = pal.px.filter((c) => far(c) >= 60);
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  base.sort((a, b) => lum(a) - lum(b));
  const n = base.length;
  const q = (f) => { if (!n) return pal.q(f); const k = clamp(f) * (n - 1), i = Math.floor(k), j = Math.min(n - 1, i + 1), u = k - i; return mix(base[i], base[j], u); };
  // The ore's colour: the most common of the standing-out colours, by a rough vote.
  let best = null, votes = -1;
  for (const a of spot) { let v = 0; for (const b of spot) if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 40) v++; if (v > votes) { votes = v; best = a; } }
  return { base: { ...pal, q, px: base, n }, spot: best };
}
function mix(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
function mul(c, f) { return [c[0] * f, c[1] * f, c[2] * f]; }
const hex = (v) => [(v >> 16) & 255, (v >> 8) & 255, v & 255];

/// After painting, nudge the picture's average colour back to the original's, so a hillside of grass or a sandy shore
/// looks the same colour from afar as it always has.
function matchMean(tile, R, pal, keepTint) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < R * R; i++) if (tile[i * 4 + 3] >= 128) { r += tile[i * 4]; g += tile[i * 4 + 1]; b += tile[i * 4 + 2]; n++; }
  if (!n) return;
  // The brightness closely, the tint only a little (pictures of two materials, like bricks and mortar, don't come here
  // at all: pulling their tint about would turn the mortar green to make up for there being less of it).
  const L = lumOf(pal.mean) / Math.max(1, lumOf([r / n, g / n, b / n])), l = lerp(1, clamp(L, 0.6, 1.6), 0.85);
  const f = [pal.mean[0] / Math.max(1, r / n), pal.mean[1] / Math.max(1, g / n), pal.mean[2] / Math.max(1, b / n)].map((v) => (keepTint ? l : l * lerp(1, clamp(v / L, 0.9, 1.1), 0.7)));
  for (let i = 0; i < R * R; i++) for (let c = 0; c < 3; c++) tile[i * 4 + c] = clamp(tile[i * 4 + c] * f[c], 0, 255);
}

// ---------- painting one picture ----------
class Ctx {
  constructor(tile, R, t, pal, src) { this.d = tile; this.R = R; this.t = t; this.pal = pal; this.src = src; this.s = t * 101 + 7; this.rand = rng(t * 7919 + 13); }
  set(x, y, c, a = 255) { const R = this.R, i = (mod(y, R) * R + mod(x, R)) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a; }
  get(x, y) { const R = this.R, i = (mod(y, R) * R + mod(x, R)) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]]; }
  /// Lay a colour over what's there, `k` of the way (wrapping at the edges).
  blend(x, y, c, k, a) { const R = this.R, i = (mod(Math.round(y), R) * R + mod(Math.round(x), R)) * 4; for (let j = 0; j < 3; j++) this.d[i + j] = lerp(this.d[i + j], c[j], k); if (a !== undefined) this.d[i + 3] = a; }
  each(fn) { const R = this.R; for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const r = fn(x, y); if (r) this.set(x, y, r, r[3] ?? 255); } }
  /// The original picture's pixel under (x, y) of the new one.
  orig(x, y) { const k = this.R / 10, sx = (this.t % 8) * 10 + Math.min(9, Math.floor(x / k)), sy = Math.floor(this.t / 8) * 10 + Math.min(9, Math.floor(y / k)), i = (sy * 80 + sx) * 4; return [this.src[i], this.src[i + 1], this.src[i + 2], this.src[i + 3]]; }
  /// Light from the top left over a height map: what stands up catches the light, what sinks in is in shadow.
  emboss(h, k, ao = 0) {
    const R = this.R, at = (x, y) => h[mod(y, R) * R + mod(x, R)];
    this.h = h;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const i = (y * R + x) * 4;
      if (this.d[i + 3] < 128) continue;
      // A slope rising towards the bottom right faces the light (it's the top-left side of a bump).
      const slope = clamp((at(x + 1, y + 1) - at(x - 1, y - 1)) * k, -0.45, 0.45), dark = ao ? 1 - ao * (1 - clamp(at(x, y))) : 1;
      const f = (1 + slope) * dark;
      for (let j = 0; j < 3; j++) this.d[i + j] = clamp(this.d[i + j] * f, 0, 255);
    }
  }
  /// A fine sprinkle of lighter and darker specks, the size of a grain of sand.
  grain(k) { const R = this.R; for (let i = 0; i < R * R; i++) { if (this.d[i * 4 + 3] < 128) continue; const f = 1 + (hash(i % R, (i / R) | 0, this.s + 999) - 0.5) * k; for (let j = 0; j < 3; j++) this.d[i * 4 + j] = clamp(this.d[i * 4 + j] * f, 0, 255); } }
  line(x0, y0, x1, y1, c, w = 1, a = 1, a2 = a) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
    for (let k = 0; k <= n; k++) {
      const u = k / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u), al = lerp(a, a2, u);
      if (w <= 1) this.blend(x, y, c, al, 255);
      else for (let dy = -w / 2; dy < w / 2; dy += 1) for (let dx = -w / 2; dx < w / 2; dx += 1) this.blend(x + dx + 0.5, y + dy + 0.5, c, al, 255);
    }
  }
}

// ---------- the painters ----------
function painters(T) {
  const P = {};
  const on = (tiles, fn) => { for (const t of [].concat(tiles)) P[t] = fn; };

  // Rock: soft shapes, fine grain, a few hairline cracks, lit from the top left.
  const rock = (c, o = {}) => {
    const R = c.R, h = new Float32Array(R * R), { cell = 40, crack = 0.5, bump = 2.2, contrast = 1, bands = 0, specks = 1 } = o;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      // Broad patches, with ridges winding through them, and finer and finer detail on top.
      const broad = fbm(x, y, R, cell, 5, c.s), ridge = 1 - Math.abs(2 * fbm(x, y, R, 20, 4, c.s + 13) - 1);
      let v = broad * 0.7 + ridge * ridge * 0.3 + (fbm(x, y, R, 5, 2, c.s + 14) - 0.5) * 0.18;
      if (bands) v = v * 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((y / R) * Math.PI * 2 * bands + fbm(x, y, R, 20, 3, c.s + 5) * 5));
      // Hairline cracks, only here and there (where a second, broad noise is high).
      const cr = Math.abs(fbm(x, y, R, 20, 4, c.s + 3) - 0.5), where = fbm(x, y, R, 40, 2, c.s + 8);
      const crackK = crack && where > 0.56 && cr < 0.014 ? 1 - (0.014 - cr) / 0.014 * crack : 1;
      // Specks of other minerals, each a round grain of its own size.
      const g = voronoi(x, y, 20, R, c.s + 51, 1), gk = hash(g.id, 1, c.s + 51), gr = 0.5 + hash(g.id, 2, c.s + 51) * 1.3;
      const spot = specks && g.d1 < gr ? (gk < 0.22 ? -0.28 : gk > 0.86 ? 0.2 : 0) * specks * clamp((gr - g.d1) * 1.5) : 0;
      const fine = (hash(x, y, c.s + 50) - 0.5) * 0.08;
      h[y * R + x] = v * crackK + spot * 0.25;
      c.set(x, y, mul(c.pal.q(clamp(0.5 + (v - 0.5) * 1.9 * contrast + fine + spot)), crackK * (0.92 + crackK * 0.08)));
    }
    c.emboss(h, bump);
  };
  on(T.stone, (c) => rock(c));
  // Limestone: a smooth, pale cut block, a little mottled, with small pores, and the joint to the next block along the
  // right and bottom edges (as in the original picture), so a wall shows its courses of stone.
  const ashlar = (c, o = {}) => {
    const R = c.R, h = new Float32Array(R * R), { joint = 3, pores = 1, mottle = 0.5 } = o, split = splitPalette(c.pal), q = split.base.q;
    const jointCol = mul(q(0.02), 0.82);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const f = fbm(x, y, R, 40, 5, c.s), f2 = fbm(x, y, R, 10, 3, c.s + 4, 3);   // soft cloudiness, and streaks along the bed
      const pr = voronoi(x, y, 14, R, c.s + 9, 1), pk = hash(pr.id, 1, c.s), prad = 0.4 + hash(pr.id, 2, c.s) * 1.4;
      const pd = Math.hypot((x - pr.px) * 0.55, y - pr.py), pore = pores && pk < 0.1 && pd < prad ? clamp((prad - pd) * 1.5) * 0.45 : 0;
      const ex = R - 1 - x, ey = R - 1 - y, j = Math.min(ex, ey);
      let v = 0.5 + (f - 0.5) * mottle * 1.4 + (f2 - 0.5) * 0.25 + (hash(x, y, c.s + 3) - 0.5) * 0.06 - pore * 0.3;
      let col = q(clamp(v)), hh = 0.6 + (f - 0.5) * 0.2 - pore * 0.08;
      if (j < joint) { col = mix(jointCol, q(0.2), clamp(j / joint) * 0.5); hh = 0; }
      else if (j < joint + 2) { col = mul(col, 0.9); hh = 0.45; }   // the edge of the next block, rounded off
      else if (x < 2 || y < 2) { col = mul(col, 1.06); hh = 0.65; }   // and this block's own top-left edge, catching the light
      h[y * R + x] = hh;
      c.set(x, y, col);
    }
    c.emboss(h, 1.2, 0.15);
  };
  on(T.limestone, (c) => ashlar(c));
  on(T.bedrock, (c) => { rock(c, { cell: 20, crack: 0.9, contrast: 1.4, bump: 3 }); });
  // Sandstone: straight layers, the light and dark ones where the original picture has them, fine sand grains in each.
  on(T.sandstone, (c) => {
    const R = c.R, h = new Float32Array(R * R), prof = rowProfile(c), lo = Math.min(...prof), hi = Math.max(...prof), L = R / 10;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      // Each row of the original becomes a layer of its own, the boundaries between them a little uneven.
      const yy = y + (fbm(x, y, R, 20, 3, c.s + 2) - 0.5) * 2.5, li = Math.floor(mod(yy, R) / L), into = mod(yy, L) / L;
      const here = (prof[li] - lo) / Math.max(1, hi - lo), next = (prof[(li + 1) % 10] - lo) / Math.max(1, hi - lo);
      const band = lerp(here, next, smooth(clamp((into - 0.85) / 0.15)));
      const f = fbm(x, y, R, 10, 4, c.s, 5), grainV = (hash(x, y, c.s + 1) - 0.5) * 0.2, dot = hash(x >> 1, y >> 1, c.s + 4) < 0.04 ? -0.15 : 0;
      h[y * R + x] = band * 0.6 + f * 0.4;
      c.set(x, y, c.pal.q(clamp(0.12 + band * 0.7 + (f - 0.5) * 0.4 + grainV + dot)));
    }
    c.emboss(h, 1.4, 0.15);
  });
  on(T.sandstoneTop, (c) => rock(c, { crack: 0, cell: 20, contrast: 0.7, bump: 1.2 }));
  // Granite: crystals of three colours, packed together.
  on(T.granite, (c) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const v = voronoi(x, y, 22, R, c.s), k = hash(v.id, 0, c.s + 2), f = fbm(x, y, R, 20, 3, c.s + 9);
      const col = c.pal.q(clamp(k < 0.12 ? 0.1 + k : k > 0.9 ? 0.85 + (k - 0.9) : 0.32 + f * 0.3 + (k - 0.5) * 0.25 + (hash(x, y, c.s + 4) - 0.5) * 0.08));
      h[y * R + x] = 0.5 + (k - 0.5) * 0.3;
      c.set(x, y, col);
    }
    c.emboss(h, 0.4); c.grain(0.05);
  });
  // Obsidian: black volcanic glass that breaks in shell-shaped curves, with a purple sheen.
  on(T.obsidian, (c) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const v = voronoi(x, y, 5, R, c.s), e = clamp(1 - (v.d2 - v.d1) / 3), sh = fbm(x, y, R, 40, 3, c.s + 4);
      h[y * R + x] = 1 - v.d1 / v.cs;
      c.set(x, y, mix(c.pal.q(0.1 + sh * 0.3), c.pal.q(1), e * 0.6));
    }
    c.emboss(h, 1.2);
  });
  // Rock salt: pale crystal faces, each catching the light differently.
  on(T.rockSalt, (c) => {
    const R = c.R;
    c.each((x, y) => { const v = voronoi(x, y, 7, R, c.s), k = hash(v.id, 3, c.s); return mul(c.pal.q(0.35 + k * 0.6), v.d2 - v.d1 < 1 ? 0.88 : 0.95 + k * 0.1); });
    c.grain(0.04);
  });

  // Marble: polished stone with veins winding through it.
  const marble = (c, darkVeins) => {
    const R = c.R;
    c.each((x, y) => {
      const w = fbm(x, y, R, 40, 5, c.s), v = Math.abs(Math.sin(((x + y * 0.55) / R) * Math.PI * 4 + w * 9)), v2 = Math.abs(Math.sin(((x * 0.4 - y) / R) * Math.PI * 2 + w * 7));
      const vein = Math.pow(1 - Math.min(v, v2 * 1.3), 9);
      const base = c.pal.q(darkVeins ? 0.5 + (fbm(x, y, R, 20, 3, c.s + 2) - 0.5) * 0.5 : 0.35 + (fbm(x, y, R, 20, 3, c.s + 2) - 0.5) * 0.4);
      return mix(base, c.pal.q(darkVeins ? 0.02 : 1), vein * 0.85);
    });
    c.grain(0.025);
  };
  on([T.marble, T.columnTop], (c) => marble(c, true));
  on([T.greenMarble, T.blueMarble, T.redMarble, T.purpleMarble, T.blackMarble], (c) => marble(c, false));
  on(T.jade, (c) => { marble(c, false); });
  on(T.plaster, (c) => { const R = c.R; c.each((x, y) => c.pal.q(0.45 + (fbm(x, y, R, 40, 4, c.s) - 0.5) * 0.7)); c.grain(0.03); });
  // A marble column: fluted, the grooves running up and down.
  on(T.columnSide, (c) => {
    marble(c, true);
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const g = 0.5 + 0.5 * Math.cos((x / R) * Math.PI * 2 * 5); h[y * R + x] = g; const i = (y * R + x) * 4; for (let j = 0; j < 3; j++) c.d[i + j] *= 0.8 + 0.2 * g; }
    c.emboss(h, 0.5);
  });

  // Cobblestones: rounded stones of different shades, mortar between.
  const cobble = (c, moss) => {
    c.keepColours = 'tint';
    const R = c.R, h = new Float32Array(R * R), stone = c.pal.q(0.5);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const v = voronoi(x, y, 5, R, c.s, 0.8), gap = v.d2 - v.d1, k = hash(v.id, 7, c.s);
      const dome = clamp(1 - v.d1 / (v.cs * 0.85));
      const f = fbm(x, y, R, 20, 4, c.s + 11);
      let col = c.pal.q(clamp(0.28 + k * 0.5 + (f - 0.5) * 0.5));
      if (moss) { const m = fbm(x, y, R, 20, 4, c.s + 23); if (m > 0.55 && c.pal.odd) col = mix(col, mix(hex(0x4f7a2e), c.pal.odd, 0.5), clamp((m - 0.55) * 6)); }
      const m = 1 - smooth(clamp((gap - 2) / 1.3));   // mortar, with a soft edge a pixel wide so stones aren't jagged
      h[y * R + x] = lerp(0.35 + dome * 0.65, 0, m);
      c.set(x, y, mix(col, mul(c.pal.q(0.04), 0.85 + f * 0.3), m));
    }
    c.emboss(h, 2.2, 0.35); c.grain(0.07); void stone;
  };
  on(T.cobble, (c) => cobble(c, false));
  on(T.mossyCobble, (c) => cobble(c, true));

  // Bricks laid in courses, each one a little different, the mortar pressed in between.
  const bricks = (c, o) => {
    const R = c.R, h = new Float32Array(R * R), { rows = 4, cols = 2, mortar = 'light', gap = 2, face = 0 } = o;
    const rh = R / rows, cw = R / cols, split = splitPalette(c.pal), bq = split.base.q;
    c.keepColours = 'tint';
    const mortarCol = split.spot && (mortar === 'light' ? lumOf(split.spot) > lumOf(c.pal.mean) : lumOf(split.spot) < lumOf(c.pal.mean)) ? split.spot : c.pal.q(mortar === 'light' ? 0.97 : 0.03);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const row = Math.floor(y / rh), xs = x + (row % 2 ? cw / 2 : 0), col = Math.floor(xs / cw) % cols;
      const lx = mod(xs, cw), ly = y - row * rh, edge = Math.min(lx, cw - lx, ly, rh - ly);
      const k = hash(row, col, c.s), f = fbm(x, y, R, 20, 4, c.s + 3);
      if (edge < gap) { h[y * R + x] = 0; c.set(x, y, mul(mortarCol, 0.9 + f * 0.2)); continue; }
      const bevel = clamp((edge - gap) / 3), v = 0.25 + k * 0.5 + (f - 0.5) * 0.5;
      let colr = bq(clamp(v));
      if (face && edge < gap + face) colr = mul(colr, 1.08);   // the flat drafted margin round each face
      h[y * R + x] = 0.4 + bevel * 0.4 + f * 0.2;
      c.set(x, y, colr);
    }
    c.emboss(h, 1.8, 0.25); c.grain(0.08);
  };
  on(T.brick, (c) => bricks(c, { rows: 4, cols: 2, mortar: 'light' }));
  on(T.stoneBricks, (c) => bricks(c, { rows: 2, cols: 2, mortar: 'dark', gap: 1.5 }));
  on(T.mudBrick, (c) => bricks(c, { rows: 3, cols: 2, mortar: 'dark', gap: 1.5 }));
  on(T.jerusalemStone, (c) => bricks(c, { rows: 2, cols: 1, mortar: 'dark', gap: 1.5, face: 4 }));
  on(T.atlStone, (c) => bricks(c, { rows: 3, cols: 2, mortar: 'dark', gap: 1.5 }));
  on(T.rammedEarth, (c) => rock(c, { crack: 0, bands: 5, contrast: 0.9, bump: 1.4 }));
  on(T.terracotta, (c) => rock(c, { crack: 0.15, contrast: 0.6, bump: 1, cell: 20 }));
  on(T.clay, (c) => rock(c, { crack: 0, contrast: 0.55, bump: 0.8, bands: 2 }));

  // Earth: crumbly soil with small stones in it.
  const soil = (c, o = {}) => {
    const R = c.R, h = new Float32Array(R * R), { pebbles = 0.16, furrows = 0, stones = null } = o;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      // Crumbs of earth: small lumps, each a little lighter or darker, with soft dark gaps between.
      const f = fbm(x, y, R, 20, 5, c.s), cl = voronoi(x, y, 16, R, c.s + 1, 1), ck = hash(cl.id, 3, c.s), gap = clamp((cl.d2 - cl.d1) / 2.2);
      const lump = Math.sqrt(clamp(1 - cl.d1 / (cl.cs * 0.8)));
      let v = 0.5 + (f - 0.5) * 1.3 + (ck - 0.5) * 0.45 - (1 - gap) * 0.28, hh = f * 0.4 + lump * 0.35 * gap;
      if (furrows) { const s = Math.sin((y / R) * Math.PI * 2 * furrows); v += s * 0.22; hh += s * 0.5; }
      let col = c.pal.q(clamp(v));
      // Now and then a small stone, rounded, lit from the top left.
      const p = voronoi(x, y, 8, R, c.s + 5, 1), size = p.cs * (0.12 + hash(p.id, 6, c.s) * 0.22), d = p.d1 + (vnoise(x, y, 4, 4, R, c.s + 6) - 0.5) * 2;
      if (hash(p.id, 1, c.s) < pebbles && d < size) {
        const k = hash(p.id, 2, c.s), dome = Math.sqrt(clamp(1 - (d / size) ** 2));
        col = mul(stones ? mix(stones, mul(stones, 0.75), k) : mix(c.pal.q(0.7 + k * 0.3), [150, 145, 135], 0.35), 0.8 + dome * 0.25);
        hh += 0.3 * dome;
      }
      h[y * R + x] = hh;
      c.set(x, y, col);
    }
    c.emboss(h, 1.4, 0.25); c.grain(0.08);
  };
  on(T.dirt, (c) => soil(c));
  on(T.farmland, (c) => soil(c, { pebbles: 0.08, furrows: 4 }));
  on(T.mountainSoil, (c) => soil(c, { pebbles: 0.5, stones: hex(0x8f8a80) }));
  // Gravel: a heap of pebbles, every one its own shade.
  on(T.gravel, (c) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const v = voronoi(x, y, 11, R, c.s, 1), k = hash(v.id, 4, c.s), dome = clamp(1 - v.d1 / (v.cs * 0.75));
      const gap = 1 - smooth(clamp((v.d2 - v.d1 - 0.4) / 1.1));
      h[y * R + x] = lerp(0.3 + dome * 0.7, 0, gap);
      c.set(x, y, mix(c.pal.q(clamp(0.12 + k * 0.85 + (hash(x, y, c.s + 3) - 0.5) * 0.12)), c.pal.q(0.08), gap));
    }
    c.emboss(h, 1.5, 0.3); c.grain(0.06);
  });
  // Sand: fine grains, with ripples the wind left.
  const sand = (c, o = {}) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const f = fbm(x, y, R, 40, 4, c.s), amp = clamp(fbm(x, y, R, 40, 2, c.s + 7) * 1.6 - 0.4), rip = Math.sin(((y + x * 0.3 + f * 16) / R) * Math.PI * 2 * 5) * amp;
      h[y * R + x] = rip * 0.15 + f;
      const sparkle = hash(x, y, c.s + 3) > 0.99 ? 0.1 : 0, dot = hash(x >> 1, y >> 1, c.s + 4) < 0.05 ? -0.12 : 0;
      c.set(x, y, c.pal.q(clamp(0.5 + (f - 0.5) * 1.1 + rip * 0.035 + (hash(x, y, c.s + 9) - 0.5) * (o.coarse ? 0.6 : 0.45) + sparkle + dot)));
    }
    c.emboss(h, 0.7);
  };
  on(T.sand, (c) => sand(c));
  on(T.blackSand, (c) => sand(c, { coarse: true }));
  on(T.snow, (c) => { const R = c.R; c.each((x, y) => { const f = fbm(x, y, R, 40, 4, c.s); return c.pal.q(clamp(0.55 + (f - 0.5) * 0.9 + (hash(x, y, c.s) > 0.99 ? 0.4 : 0))); }); });

  // Grass, seen from above: a thick lawn of blades in many greens over dark earth.
  const lawn = (c, x0, y0, w, hgt, dens = 1) => {
    const clump = (x, y) => (fbm(x, y, c.R, 20, 2, c.s + 40) - 0.5) * 0.9 + (vnoise(x, y, 10, 10, c.R, c.s + 41) - 0.5) * 0.4;
    const g = (k, x, y) => c.pal.q(clamp(k + (x === undefined ? 0 : clump(x, y))));
    for (let y = y0; y < y0 + hgt; y++) for (let x = x0; x < x0 + w; x++) c.set(x, y, mul(g(0.18 + fbm(x, y, c.R, 20, 3, c.s) * 0.3, x, y), 0.8));
    const n = Math.round(w * hgt * 0.22 * dens), r = c.rand;
    for (let k = 0; k < n; k++) {
      const x = x0 + r() * w, y = y0 + r() * hgt, a = r() * Math.PI * 2, l = 3 + r() * 5;
      const tone = 0.3 + r() * 0.7;
      c.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, g(tone * 0.85, x, y), 1, 0.9, 1);
      c.blend(x + Math.cos(a) * l, y + Math.sin(a) * l, g(Math.min(1, tone + 0.2), x, y), 0.8, 255);
    }
  };
  on(T.grassTop, (c) => {
    lawn(c, 0, 0, c.R, c.R);
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const p = c.get(x, y); h[y * R + x] = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255; }
    c.emboss(h, 1.5, 0.2);
  });
  // A grass block's side: earth, with the turf hanging over the top edge in ragged tufts.
  const turfSide = (c, topTile, soilTile, snowy) => {
    const R = c.R, soilPal = topTile.soil, top = topTile.top;
    c.keepColours = true;
    const under = Object.assign(Object.create(Object.getPrototypeOf(c)), c, { pal: soilPal });
    soil(under);
    const h = under.h.slice();   // the earth's own bumps, with the turf laid over the top
    for (let x = 0; x < R; x++) {
      const depth = R * (snowy ? 0.3 : 0.2) + (vnoise(x, 0, 10, 10, R, c.s) - 0.5) * R * 0.14 + (hash(x, 0, c.s + 2) < 0.12 ? R * 0.1 * hash(x, 1, c.s) : 0);
      for (let y = 0; y < R; y++) {
        if (y < depth) {
          const f = fbm(x, y, R, 10, 3, c.s + 7);
          const col = snowy ? top.q(clamp(0.45 + (f - 0.5) * 0.8 + (y > depth - 3 ? -0.25 : 0))) : top.q(clamp(0.25 + f * 0.5 + (hash(x, y >> 1, c.s) - 0.5) * 0.5 - (y / depth) * 0.15));
          c.set(x, y, col); h[y * R + x] = 0.9 + f * 0.25;
        } else if (y < depth + 3) { c.blend(x, y, [0, 0, 0], 0.35 * (1 - (y - depth) / 3)); h[y * R + x] *= 0.5; }
      }
      if (!snowy) for (let k = 0; k < 2; k++) { const l = 2 + hash(x, k + 5, c.s) * 6; c.line(x, depth - 1, x + (hash(x, k, c.s) - 0.5) * 2, depth - 1 + l * (k ? 0.6 : 1), top.q(0.2 + hash(x, k + 9, c.s) * 0.5), 1, 0.85, 0.5); }
    }
    c.h = h;
    void soilTile;
  };
  on(T.grassSide, (c) => turfSide(c, { top: palette(c.src, T.grassTop), soil: palette(c.src, T.dirt) }, T.dirt, false));
  on(T.snowSide, (c) => turfSide(c, { top: palette(c.src, T.snow), soil: palette(c.src, T.dirt) }, T.dirt, true));
  on(T.floodHole, (c) => generic(c));

  // Bark: deep furrows running up the trunk.
  const bark = (c, o = {}) => {
    const R = c.R, h = new Float32Array(R * R), { ridges = 7, rough = 1 } = o;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const w = fbm(x, y, R, 20, 3, c.s + 1) * 2.4;
      const fur = 0.5 + 0.5 * Math.sin((x / R) * Math.PI * 2 * ridges + w * 2.2);
      const f = fbm(x, y, R, 10, 4, c.s, 0.25);   // stretched: streaks up and down
      const v = clamp(Math.pow(fur, 0.7) * 0.6 + f * 0.5 * rough + (hash(x, y, c.s + 4) - 0.5) * 0.1);
      h[y * R + x] = v;
      c.set(x, y, c.pal.q(clamp(0.05 + v * 0.95)));
    }
    c.emboss(h, 2.4, 0.35);
  };
  on([T.oakSide, T.spruceSide, T.jungleSide, T.cherrySide, T.ginkgoSide, T.acaciaSide, T.figSide], (c) => bark(c));
  on(T.ironwoodSide, (c) => bark(c, { ridges: 9, rough: 1.3 }));
  // Birch: smooth pale bark with dark marks across it.
  on(T.birchSide, (c) => {
    const R = c.R, r = c.rand;
    c.each((x, y) => c.pal.q(0.72 + (fbm(x, y, R, 20, 4, c.s, 0.5) - 0.5) * 0.4));
    // Lenticels: thin dark dashes across the trunk.
    for (let k = 0; k < 30; k++) { const x = r() * R, y = r() * R, l = 3 + r() * 10, th = r() < 0.35 ? 2 : 1; c.line(x, y, x + l, y + (r() - 0.5), c.pal.q(0.03 + r() * 0.12), th, 0.85, 0.5); }
    // A few dark patches where branches once grew, soft at the edges.
    for (let k = 0; k < 3; k++) { const cx = r() * R, cy = r() * R, a = 5 + r() * 5, b = 2.5 + r() * 2; for (let y = -6; y <= 6; y++) for (let x = -11; x <= 11; x++) { const e = (x * x) / (a * a) + (y * y) / (b * b); if (e < 1) c.blend(cx + x, cy + y, c.pal.q(0.12), 0.6 * clamp((1 - e) * 2.5) * (0.6 + fbm(cx + x, cy + y, R, 10, 2, c.s) * 0.6)); } }
    c.grain(0.05);
  });
  // A palm trunk: rings of the old leaf bases, one above another.
  on(T.palmSide, (c) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const row = 10, yy = mod(y + Math.abs(mod(x, 20) - 10) * 0.8, row) / row, f = fbm(x, y, R, 20, 3, c.s);
      h[y * R + x] = yy;
      c.set(x, y, c.pal.q(clamp(0.15 + yy * 0.75 + (f - 0.5) * 0.4)));
    }
    c.emboss(h, 1.6, 0.3);
  });
  // Cactus: green ribs with pale spines.
  on(T.cactusSide, (c) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const rib = 0.5 + 0.5 * Math.cos((x / R) * Math.PI * 2 * 4); h[y * R + x] = rib; c.set(x, y, c.pal.q(clamp(0.15 + rib * 0.6 + (fbm(x, y, R, 10, 3, c.s) - 0.5) * 0.3))); }
    for (let k = 0; k < 4; k++) for (let y = 4; y < R; y += 9) { const x = (k + 0.5) * R / 4 + (y % 18 ? 0 : 0); c.set(x, y, [236, 230, 190]); c.set(x + 1, y - 1, [236, 230, 190]); }
    c.emboss(h, 1.2);
  });
  on(T.cactusTop, (c) => { const R = c.R; c.each((x, y) => { const a = Math.atan2(y - R / 2, x - R / 2), d = Math.hypot(x - R / 2, y - R / 2); return c.pal.q(clamp(0.3 + 0.4 * Math.cos(a * 8) * clamp(d / 20) + (fbm(x, y, R, 10, 3, c.s) - 0.5) * 0.3)); }); });
  // The end of a log: growth rings round the heart, bark round the edge.
  const rings = (c, o = {}) => {
    const R = c.R, h = new Float32Array(R * R), bk = o.bark || palette(c.src, T.oakSide);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const dx = x - R / 2 + 0.5, dy = y - R / 2 + 0.5, d = Math.hypot(dx, dy) + (fbm(x, y, R, 20, 3, c.s) - 0.5) * 5;
      const edge = Math.max(Math.abs(dx), Math.abs(dy));
      if (edge > R / 2 - 5) { const f = fbm(x, y, R, 10, 3, c.s + 3); c.set(x, y, bk.q(clamp(0.1 + f * 0.7))); h[y * R + x] = f; continue; }
      const ring = 0.5 + 0.5 * Math.sin(d * (o.tight ? 1.3 : 0.95)), crack = false;
      const v = clamp(0.35 + ring * 0.45 + (hash(x, y, c.s) - 0.5) * 0.08 - (d < 3 ? 0.2 : 0));
      h[y * R + x] = ring * 0.5;
      c.set(x, y, crack ? c.pal.q(0.05) : c.pal.q(v));
    }
    c.emboss(h, 0.8);
  };
  on(T.logTop, (c) => rings(c));
  on(T.ironwoodTop, (c) => rings(c, { tight: true, bark: palette(c.src, T.ironwoodSide) }));

  // Planks: boards with the grain running along them, the joins dark between.
  const boards = (c, o = {}) => {
    const R = c.R, h = new Float32Array(R * R), n = o.boards || 4, bh = R / n;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const b = Math.floor(y / bh), ly = y - b * bh, joinX = (hash(b, 0, c.s) * R) | 0, end = Math.abs(mod(x - joinX, R)) < 1.2;
      const g = fbm(x + b * 31, y, R, 5, 4, c.s + b, 8);   // grain: long streaks
      const knot = Math.hypot(mod(x - hash(b, 2, c.s) * R + R / 2, R) - R / 2, (ly - bh / 2) * 2.5);
      let v = 0.3 + hash(b, 1, c.s) * 0.3 + (g - 0.5) * 0.9 + Math.sin(g * 30) * 0.05;
      if (knot < 4 && hash(b, 3, c.s) < 0.5) v -= (4 - knot) / 4 * 0.35;
      const seam = ly < 1.2 || ly > bh - 1.2;
      h[y * R + x] = seam || end ? 0 : 0.5 + g * 0.5;
      c.set(x, y, seam || end ? c.pal.q(0.02) : c.pal.q(clamp(v)));
    }
    c.emboss(h, 1.4, 0.3);
  };
  on(T.planks, (c) => boards(c));
  on(T.redLacquer, (c) => { boards(c, { boards: 5 }); c.grain(0.03); });

  // Leaves: a mass of overlapping leaves, darker inside, with gaps you can see the sky through.
  const leaves = (c, o = {}) => {
    const R = c.R, r = c.rand, { needles = false, fronds = false, blossom = false, fruit = null, holes = 0.14 } = o;
    c.each((x, y) => mul(c.pal.q(0.08 + fbm(x, y, R, 20, 3, c.s) * 0.25), 0.8));
    const count = needles ? 520 : fronds ? 70 : blossom ? 260 : 380;
    for (let k = 0; k < count; k++) {
      const x = r() * R, y = r() * R, a = fronds ? Math.PI * 0.25 + (r() - 0.5) * 0.6 : r() * Math.PI * 2, tone = 0.3 + r() * 0.7;
      const col = c.pal.q(tone);
      if (needles) { const l = 4 + r() * 5; c.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, col, 1, 1, 0.8); continue; }
      if (fronds) {
        const l = 14 + r() * 14, dx = Math.cos(a), dy = Math.sin(a);
        c.line(x, y, x + dx * l, y + dy * l, c.pal.q(tone * 0.6), 1, 1);
        for (let s = 2; s < l; s += 2.2) for (const side of [-1, 1]) { const bx = x + dx * s, by = y + dy * s, ll = 3 + (1 - s / l) * 5; c.line(bx, by, bx + (dx * 0.4 - dy * side) * ll, by + (dy * 0.4 + dx * side) * ll, col, 1, 1, 0.7); }
        continue;
      }
      // One leaf: a small pointed oval, lit on one side.
      const L = blossom ? 2.2 : 3.4 + r() * 2.2, Wd = blossom ? 2.2 : 1.6 + r() * 0.9, ca = Math.cos(a), sa = Math.sin(a);
      for (let v = -L; v <= L; v += 0.5) for (let u = -Wd; u <= Wd; u += 0.5) {
        if ((v * v) / (L * L) + (u * u) / (Wd * Wd) > 1) continue;
        const lit = 0.85 + 0.3 * (u / Wd) * (sa > 0 ? -1 : 1);
        c.blend(x + ca * v - sa * u, y + sa * v + ca * u, mul(col, lit), 1, 255);
      }
      if (blossom && r() < 0.5 && c.pal.odd) c.blend(x, y, mix(c.pal.q(1), [255, 255, 255], 0.4), 1, 255);
    }
    if (fruit) for (let k = 0; k < 7; k++) { const x = r() * R, y = r() * R; for (let v = -2.6; v <= 2.6; v += 0.5) for (let u = -2.6; u <= 2.6; u += 0.5) if (u * u + v * v < 6.8) c.blend(x + u, y + v, mul(fruit, 0.8 + 0.35 * clamp(-(u + v) / 4 + 0.5)), 1, 255); }
    // The gaps.
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const gap = fbm(x, y, R, 10, 3, c.s + 77), pin = voronoi(x, y, 16, R, c.s + 5, 1);
      if (gap < holes * 2.2 - 0.02 || (hash(pin.id, 1, c.s + 5) < holes * 1.6 && pin.d1 < 0.8 + hash(pin.id, 2, c.s + 5) * 0.9)) { const i = (y * R + x) * 4; c.d[i + 3] = 0; }
    }
  };
  on([T.oakLeaves, T.birchLeaves, T.jungleLeaves, T.acaciaLeaves, T.ironwoodLeaves, T.ginkgoLeaves], (c) => leaves(c));
  on(T.spruceLeaves, (c) => leaves(c, { needles: true, holes: 0.1 }));
  on(T.palmLeaves, (c) => leaves(c, { fronds: true, holes: 0.16 }));
  on(T.cherryBlossom, (c) => leaves(c, { blossom: true }));
  on(T.appleLeaves, (c) => leaves(c, { fruit: c.pal.odd || hex(0xc43a2a) }));
  on(T.figLeaves, (c) => leaves(c, { fruit: c.pal.odd || hex(0x6a3a6e) }));

  // Ores: the rock they're found in, with veins and crystals of the metal or gem.
  const ore = (c, o = {}) => {
    const save = c.pal, split = splitPalette(save);
    c.pal = split.base; rock(c, { crack: 0.3 }); c.pal = save; c.keepColours = true;
    const R = c.R, metal = split.spot || c.pal.q(1), dark = mul(metal, 0.55), r = c.rand, gem = o.gem;
    const spots = 4 + Math.floor(r() * 3);
    for (let s = 0; s < spots; s++) {
      const cx = r() * R, cy = r() * R, size = 5 + r() * 5;
      for (let k = 0; k < (gem ? 6 : 14); k++) {
        const x = cx + (r() - 0.5) * size * 2, y = cy + (r() - 0.5) * size * 2, rad = gem ? 2.4 + r() * 2 : 1.2 + r() * 1.8;
        // Each grain or crystal drawn pixel by pixel with its edge pixels part-covered, so it's smooth, not stepped.
        for (let py = Math.floor(y - rad - 1); py <= y + rad + 1; py++) for (let px = Math.floor(x - rad - 1); px <= x + rad + 1; px++) {
          const u = px + 0.5 - x, v = py + 0.5 - y, d = gem ? Math.abs(u) + Math.abs(v) : Math.hypot(u, v), cov = clamp(rad - d + 0.5);
          if (cov <= 0) continue;
          const lit = clamp(0.5 - (u + v) / (rad * 2.4) + 0.2), hi = gem && Math.hypot(u + rad * 0.3, v + rad * 0.3) < rad * 0.3 ? 0.6 : 0;
          c.blend(px, py, mix(mix(dark, mix(metal, [255, 255, 255], gem ? 0.35 : 0.12), lit), [255, 255, 255], hi), cov, 255);
          if (c.h) { const hi2 = mod(py, R) * R + mod(px, R); c.h[hi2] = lerp(c.h[hi2], 1 - d / rad * 0.4, cov); }
        }
      }
    }
  };
  on([T.coalOre, T.tinOre, T.copperOre, T.ironOre, T.goldOre, T.ancientOre], (c) => ore(c));
  on([T.diamondOre, T.emeraldOre, T.amethystOre, T.opalOre], (c) => ore(c, { gem: true }));

  // Metal: brushed, with a raised border round each face.
  const metal = (c) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const brush = (hash(0, y, c.s) - 0.5) * 0.12 + (vnoise(x, y, 40, 1, R, c.s + 2) - 0.5) * 0.1, e = Math.min(x, y, R - 1 - x, R - 1 - y);
      const sheen = Math.pow(Math.max(0, Math.cos(((x - y) / R) * Math.PI * 1.4 - 0.6)), 6) * 0.25;
      const rim = e < 5 ? (x < 5 || y < 5 ? 1.18 : 0.72) : e < 6 ? 0.85 : 1;
      h[y * R + x] = e < 5 ? 1 : e < 6 ? 0 : 0.6;
      c.set(x, y, mul(c.pal.q(clamp(0.45 + brush + sheen + (fbm(x, y, R, 40, 2, c.s + 3) - 0.5) * 0.25)), rim));
    }
    c.h = h;
  };
  on([T.goldBlock, T.bronze], (c) => metal(c));

  // Cloth: woven threads, over and under.
  const cloth = (c) => {
    const R = c.R;
    c.each((x, y) => { const wv = ((x >> 1) + (y >> 1)) % 2 ? 0.9 : 1.08, f = fbm(x, y, R, 40, 3, c.s); return mul(c.pal.q(clamp(0.35 + (f - 0.5) * 0.6)), wv * (0.96 + hash(x, y, c.s) * 0.08)); });
  };
  on([T.redCloth, T.blueCloth, T.purpleCloth], (c) => cloth(c));

  // Glazed roof tiles: rows of round tiles, shiny on top, a shadow under each row.
  const roof = (c) => {
    const R = c.R, rows = 5, rh = R / rows, pitch = R / 5;
    c.each((x, y) => {
      const row = Math.floor(y / rh), ly = (y - row * rh) / rh, xx = mod(x + (row % 2) * pitch / 2, pitch) / pitch;
      const round = Math.sin(xx * Math.PI), shade = (0.55 + round * 0.55) * (ly > 0.82 ? 0.65 : 1) * (0.9 + ly * 0.2);
      return mul(c.pal.q(clamp(0.45 + (fbm(x, y, R, 20, 2, c.s) - 0.5) * 0.3)), shade);
    });
  };
  on([T.yellowRoof, T.greenRoof, T.greyRoof], (c) => roof(c));

  // Tall grass: thin blades growing up from the ground, some bent over.
  on(T.tallGrass, (c) => {
    const R = c.R, r = c.rand;
    c.each(() => [0, 0, 0, 0]);
    for (let k = 0; k < 34; k++) {
      const x0 = 6 + r() * (R - 12), h = R * (0.45 + r() * 0.48), lean = (r() - 0.5) * 18, tone = 0.25 + r() * 0.75;
      let px = x0, py = R - 2;   // (not right at the bottom edge, or the base would wrap round to the top)
      for (let s = 1; s <= 12; s++) {
        const u = s / 12, x = x0 + lean * u * u, y = R - 2 - h * u;
        c.line(px, py, x, y, c.pal.q(tone * (0.7 + u * 0.4)), u < 0.6 ? 2 : 1, 1);
        px = x; py = y;
      }
    }
  });
  // A Roman mosaic: the original's design laid in small square tesserae, each a slightly different shade, grout between.
  on(T.mosaic, (c) => {
    const R = c.R, n = 10, cs = R / n, h = new Float32Array(R * R), grout = [138, 128, 112];
    const same = (a, b2) => Math.abs(a[0] - b2[0]) + Math.abs(a[1] - b2[1]) + Math.abs(a[2] - b2[2]) < 30;
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const jx = (vnoise(x, y, 5, 5, R, c.s) - 0.5) * 1.2, jy = (vnoise(x, y, 5, 5, R, c.s + 1) - 0.5) * 1.2;
      const tx = Math.floor((x + jx) / cs), ty = Math.floor((y + jy) / cs), lx = mod(x + jx, cs), ly = mod(y + jy, cs);
      // The original's own grout dots aren't tesserae: take the colour from the neighbour instead.
      let o = c.orig((mod(tx, n) + 0.5) * cs, (mod(ty, n) + 0.5) * cs);
      if (same(o, grout)) o = c.orig((mod(tx - 1, n) + 0.5) * cs, (mod(ty, n) + 0.5) * cs);
      if (same(o, grout)) o = c.orig((mod(tx, n) + 0.5) * cs, (mod(ty - 1, n) + 0.5) * cs);
      const k = 0.9 + hash(mod(tx, n), mod(ty, n), c.s + 2) * 0.18, edge = Math.min(lx, ly, cs - lx, cs - ly);
      const g = (1 - smooth(clamp((edge - 0.05) / 0.6))) * 0.75;
      h[y * R + x] = (1 - g) * (0.7 + hash(mod(tx, n), mod(ty, n), c.s + 3) * 0.3);
      c.set(x, y, mix(mul([o[0], o[1], o[2]], k), grout, g));
    }
    c.emboss(h, 1.2, 0.1); c.grain(0.04); c.keepColours = 'tint';
  });
  // Honeycomb: rows of six-sided wax cells, some capped (pale and smooth), most full of shining honey.
  on(T.hive, (c) => {
    const R = c.R, cols = 8, rows = 10, sx = R / cols, sy = R / rows, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      let d1 = 1e9, d2 = 1e9, id = 0, qx = 0, qy = 0;
      for (let j = -1; j <= 2; j++) for (let i = -1; i <= 2; i++) {
        const row = Math.floor(y / sy) + j, col = Math.floor(x / sx) + i, cx = (col + (mod(row, 2) ? 0.5 : 0)) * sx, cy = (row + 0.5) * sy;
        const d = Math.max(Math.abs(x + 0.5 - cx) * 1.0, Math.abs(x + 0.5 - cx) * 0.5 + Math.abs(y + 0.5 - cy) * 0.9);
        if (d < d1) { d2 = d1; d1 = d; id = mod(row, rows) * cols + mod(col, cols); qx = cx; qy = cy; } else if (d < d2) d2 = d;
      }
      const wall = 1 - smooth(clamp((d2 - d1 - 0.6) / 1.2)), capped = hash(id, 1, c.s) < 0.3, k = hash(id, 2, c.s);
      const inner = clamp(d1 / (sx * 0.55)), shine = Math.pow(clamp(1 - Math.hypot(x - qx + 1.5, y - qy + 1.5) / 2.2), 2);
      const honey = mix(c.pal.q(0.35 + k * 0.2), c.pal.q(0.08), inner * 0.6), cap = c.pal.q(0.85 + k * 0.15);
      let col = capped ? mul(cap, 0.95 + (fbm(x, y, R, 10, 2, c.s) - 0.5) * 0.1) : mix(honey, [255, 240, 190], shine * 0.7);
      col = mix(col, c.pal.q(0.7), wall);
      h[y * R + x] = wall ? 0.6 + wall * 0.4 : capped ? 0.5 : 0.15 + (1 - inner) * 0.2;
      c.set(x, y, col);
    }
    c.emboss(h, 1.4, 0.2); c.keepColours = 'tint';
  });
  // A griffon's nest: woven twigs, the cup in the middle deep and dark; from the side, twigs laid round and round.
  const twigs = (c, side) => {
    const R = c.R, r = c.rand;
    c.each((x, y) => mul(c.pal.q(0.12 + fbm(x, y, R, 20, 3, c.s) * 0.2), 0.8));
    for (let k = 0; k < (side ? 170 : 220); k++) {
      const x = r() * R, y = r() * R, a = side ? (r() - 0.5) * 0.5 : r() * Math.PI, l = 8 + r() * 16, tone = 0.3 + r() * 0.7;
      const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
      c.line(x - dx / 2 + 1, y - dy / 2 + 1, x + dx / 2 + 1, y + dy / 2 + 1, c.pal.q(0.02), 1, 0.35);   // its shadow
      c.line(x - dx / 2, y - dy / 2, x + dx / 2, y + dy / 2, c.pal.q(tone), r() < 0.3 ? 2 : 1, 1);
    }
    if (!side) c.each((x, y) => { const d = Math.hypot(x - R / 2, y - R / 2) / (R * 0.3), p = c.get(x, y); return d < 1 ? mul(p, 0.3 + 0.7 * smooth(d)) : null; });
    c.keepColours = 'tint';
  };
  on(T.nestTop, (c) => twigs(c, false));
  on(T.nestSide, (c) => twigs(c, true));
  // Waterblock moss: a soft green cushion, with drops of water caught in it.
  on(T.waterMoss, (c) => {
    const R = c.R, h = new Float32Array(R * R), split = splitPalette(c.pal), q = split.base.q, drop = split.spot || [170, 220, 240];
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const f = fbm(x, y, R, 20, 4, c.s), fuzz = hash(x, y, c.s + 1), tuft = voronoi(x, y, 12, R, c.s + 2, 1), dome = clamp(1 - tuft.d1 / (tuft.cs * 0.8));
      h[y * R + x] = dome * 0.6 + f * 0.4;
      c.set(x, y, q(clamp(0.15 + dome * 0.5 + (f - 0.5) * 0.5 + (fuzz - 0.5) * 0.25)));
    }
    c.emboss(h, 1.2, 0.3);
    const r = c.rand;
    for (let k = 0; k < 14; k++) {
      const x = r() * R, y = r() * R, rad = 1.2 + r() * 1.4;
      for (let py = Math.floor(y - rad - 1); py <= y + rad + 1; py++) for (let px = Math.floor(x - rad - 1); px <= x + rad + 1; px++) {
        const u = px + 0.5 - x, v = py + 0.5 - y, cov = clamp(rad - Math.hypot(u, v) + 0.5);
        if (cov > 0) c.blend(px, py, mix(drop, [255, 255, 255], clamp(0.6 - (u + v) / rad)), cov * 0.9, 255);
      }
    }
    c.keepColours = 'tint';
  });
  // A sponge: soft yellow, full of round holes of every size.
  on(T.sponge, (c) => {
    const R = c.R, h = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const v = voronoi(x, y, 9, R, c.s, 1), size = v.cs * (0.15 + hash(v.id, 1, c.s) * 0.25), hole = 1 - smooth(clamp((v.d1 - size) / 1.2));
      const v2 = voronoi(x, y, 20, R, c.s + 3, 1), pin = 1 - smooth(clamp((v2.d1 - 0.8) / 0.8));
      const f = fbm(x, y, R, 20, 3, c.s + 5), dep = Math.max(hole, pin * 0.6);
      h[y * R + x] = 1 - dep;
      c.set(x, y, mix(c.pal.q(0.55 + (f - 0.5) * 0.6), c.pal.q(0.02), dep * 0.85));
    }
    c.emboss(h, 1.3, 0.2);
  });
  return P;
}

// ---------- anything else: enlarged smoothly, then given a fine grain ----------
function generic(c) {
  const R = c.R;
  // Scale2x three times: 10 → 20 → 40 → 80. Corners round off, straight edges stay straight, nothing goes blurry.
  let n = 10, img = [];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const p = c.orig(x * R / 10, y * R / 10); img.push(p); }
  const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  while (n < R) {
    const m = n * 2, nx = new Array(m * m);
    const at = (x, y) => img[mod(y, n) * n + mod(x, n)];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const P0 = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
      let e0 = P0, e1 = P0, e2 = P0, e3 = P0;
      if (!same(C, B) && !same(A, D)) { if (same(C, A)) e0 = A; if (same(A, B)) e1 = B; if (same(D, C)) e2 = C; if (same(B, D)) e3 = D; }
      nx[(y * 2) * m + x * 2] = e0; nx[(y * 2) * m + x * 2 + 1] = e1; nx[(y * 2 + 1) * m + x * 2] = e2; nx[(y * 2 + 1) * m + x * 2 + 1] = e3;
    }
    img = nx; n = m;
    if (n > R) break;
  }
  const k = n / R;
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const p = img[Math.floor(y * k) * n + Math.floor(x * k)]; c.set(x, y, [p[0], p[1], p[2]], p[3]); }
  // Soften the edges by about a pixel (half the picture, half its 3 × 3 average), so the steps don't show close up.
  // See-through pixels don't lend their colour.
  const d0 = c.d.slice();
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
    let r = 0, g = 0, b = 0, a = 0, w = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const o = (mod(y + j, R) * R + mod(x + i, R)) * 4, al = d0[o + 3] / 255; r += d0[o] * al; g += d0[o + 1] * al; b += d0[o + 2] * al; a += d0[o + 3]; w += al; }
    const o = (y * R + x) * 4;
    if (w > 0) { c.d[o] = lerp(d0[o], r / w, 0.5); c.d[o + 1] = lerp(d0[o + 1], g / w, 0.5); c.d[o + 2] = lerp(d0[o + 2], b / w, 0.5); }
    c.d[o + 3] = lerp(d0[o + 3], a / 9, 0.5);
  }
  // Grain, so even these look finely made close up.
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
    const i = (y * R + x) * 4;
    if (c.d[i + 3] < 128) continue;
    const f = 1 + (fbm(x, y, R, 10, 3, c.s) - 0.5) * 0.16 + (hash(x, y, c.s + 1) - 0.5) * 0.07;
    for (let j = 0; j < 3; j++) c.d[i + j] = clamp(c.d[i + j] * f, 0, 255);
  }
}
