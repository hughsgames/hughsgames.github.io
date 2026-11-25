// Polis World 2: the four maps (Egypt, Asia, the Mediterranean and Yucatán), each 40 km square, built a piece at a time.
//
// Blocks are half a metre, so a map is 80,000 blocks across. Nothing here keeps the whole map in memory: every
// question ("how high is the land here?", "which blocks are in this chunk?") is answered from the map's shape, which is
// written below in kilometres as coasts, rivers, mountain ranges and cities. The same answer comes back every time, so
// only the player's own changes need saving.
//
// This file has no DOM and no imports, so it runs in a worker or in Node as well as on the page.

export const KM = 2000;              // blocks per kilometre (a block is half a metre)
export const SIZE = 40 * KM;         // blocks across one map
export const H = 384;                // world height in blocks (192 m)
export const SL = 96;                // sea level (the first y that is air above calm water)
export const CS = 16;                // chunk width

// ---------- noise ----------
function hash2(x, z, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(s | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export const rand2 = hash2;
const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
function grad(ix, iz, s) { const a = hash2(ix, iz, s) * Math.PI * 2; return [Math.cos(a), Math.sin(a)]; }
/// 2D simplex noise, about −1 … 1.
export function noise(x, z, s = 0) {
  const k = (x + z) * F2, i = Math.floor(x + k), j = Math.floor(z + k);
  const t = (i + j) * G2, x0 = x - (i - t), z0 = z - (j - t);
  const i1 = x0 > z0 ? 1 : 0, j1 = 1 - i1;
  const x1 = x0 - i1 + G2, z1 = z0 - j1 + G2, x2 = x0 - 1 + 2 * G2, z2 = z0 - 1 + 2 * G2;
  let n = 0;
  for (const [dx, dz, gi, gj] of [[x0, z0, i, j], [x1, z1, i + i1, j + j1], [x2, z2, i + 1, j + 1]]) {
    const tt = 0.5 - dx * dx - dz * dz;
    if (tt > 0) { const g = grad(gi, gj, s); n += tt * tt * tt * tt * (g[0] * dx + g[1] * dz); }
  }
  return n * 70;
}
/// Several octaves of noise; `f` is the first frequency (per km here), result about −1 … 1.
export function fbm(x, z, f, oct, s = 0) {
  let a = 1, sum = 0, tot = 0;
  for (let o = 0; o < oct; o++) { sum += a * noise(x * f, z * f, s + o * 101); tot += a; a *= 0.5; f *= 2.03; }
  return sum / tot;
}
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- shapes (all in km) ----------
/// Distance from p to a polyline, and how far along it (0 … 1 of the whole line).
function lineDist(px, pz, pts) {
  let best = 1e9, along = 0, run = 0, total = 0;
  for (let i = 0; i + 1 < pts.length; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, len = Math.sqrt(l2);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
    const d = Math.hypot(px - ax - dx * t, pz - az - dz * t);
    if (d < best) { best = d; along = (run + t * len) / total; }
    run += len;
  }
  return [best, along];
}
/// Signed distance to a polygon: negative inside.
function polyDist(px, pz, pts) {
  let d = 1e9, inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, az] = pts[j], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
    d = Math.min(d, Math.hypot(px - ax - dx * t, pz - az - dz * t));
    if ((az > pz) !== (bz > pz) && px < ax + ((pz - az) * dx) / dz) inside = !inside;
  }
  return inside ? -d : d;
}
function ellipseDist(px, pz, cx, cz, rx, rz) { const k = Math.hypot((px - cx) / rx, (pz - cz) / rz); return (k - 1) * Math.min(rx, rz); }

// Biomes. Each says what covers the ground and what grows there.
export const BIOME = {
  sea: 0, beach: 1, desert: 2, fields: 3, forest: 4, jungle: 5, rock: 6, snow: 7, scrub: 8, steppe: 9, bamboo: 10,
  delta: 11, oasis: 12, alpine: 13, mangrove: 14, savanna: 15,
};
export const BIOME_NAME = Object.fromEntries(Object.entries(BIOME).map(([k, v]) => [v, k]));

// ---------- the four maps ----------
// Each map lists its land (polygons and ellipses, joined), its seas cut out of that land, its rivers (with their width
// in km), its mountain ranges, its cities, and a `climate` function that picks the biome from what's around.
export const MAPS = {
  egypt: {
    name: 'Egypt', seed: 11,
    blurb: 'The Nile runs north through the desert to the sea. Pyramids, temples, palm groves and the great river.',
    land: [{ poly: [[-2, 2.3], [12, 1.9], [14, 1.0], [20, 0.6], [27, 1.0], [29, 1.9], [42, 2.2], [42, 42], [-2, 42]] }],
    seas: [{ poly: [[37.2, 13], [42, 12], [42, 42], [39.5, 42], [38.4, 30], [37, 20]] }],   // the Red Sea
    rivers: [
      { pts: [[20.5, 41], [21.4, 35], [20.2, 28], [21.1, 21], [20.4, 15.5], [20.5, 13]], w: 0.26, valley: 2.2 },
      { pts: [[20.5, 13], [18.2, 9], [15.6, 5], [14.6, 1.2], [14.4, -0.5]], w: 0.16, valley: 1.2 },
      { pts: [[20.5, 13], [23.0, 9], [25.6, 5], [26.6, 1.4], [26.8, -0.5]], w: 0.16, valley: 1.2 },
    ],
    ranges: [{ pts: [[38.5, 2.5], [36.5, 12], [35.5, 22], [36.5, 34]], r: 3.0, h: 55 }],      // the Red Sea hills
    lakes: [{ e: [5, 20, 0.5, 0.35] }],                                                    // the oasis pool
    ruggedness: 10, plateau: 45,
    cities: [
      { id: 'alexandria', x: 10.5, z: 3.2, r: 1.5, e: 3 },
      { id: 'giza', x: 18.4, z: 14.6, r: 1.3, e: 30 },
      { id: 'memphis', x: 21.4, z: 16.4, r: 1.0, e: 5 },
      { id: 'thebes', x: 22.0, z: 33.0, r: 1.8, e: 6 },
    ],
    climate(c) {
      const x = c.x + c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 7) * 1.2, z = c.z - c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 8) * 1.2;
      if (c.e < 0.8) return c.sea ? BIOME.sea : BIOME.beach;
      if (Math.hypot(c.x - 5, c.z - 20) < 1.6) return BIOME.oasis;
      if (z < 13 && c.river < 6 && c.e < 9) return BIOME.delta;
      if (c.river < 1.6 + c.wob * 0.4) return BIOME.fields;
      if (c.e > 50 && x > 33) return BIOME.rock;
      return BIOME.desert;
    },
  },
  asia: {
    name: 'Asia', seed: 23,
    blurb: 'From Babylon and Persia across the Indus to the rivers and mountains of China, and the jungles of Angkor.',
    land: [{ poly: [[-2, -2], [42, -2], [42, 2], [37.6, 6], [36.6, 12], [37.2, 18], [36.2, 24], [37, 30], [34, 33.5], [33, 37.5], [31.5, 42], [-2, 42]] }],
    seas: [
      { poly: [[2.5, 31], [7, 30.5], [11, 33], [13.5, 37], [14, 42], [-2, 42], [-2, 34]] },   // the Persian Gulf and Arabian Sea
      { poly: [[17.5, 38.5], [24, 37.8], [28, 38.6], [28, 42], [17, 42]] },                    // the Bay of Bengal
    ],
    rivers: [
      { pts: [[1.5, 5], [3.2, 12], [4.3, 20], [5.4, 27], [6.2, 31.2]], w: 0.14, valley: 1.2 },          // the Euphrates
      { pts: [[4.5, 4], [6.2, 11], [6.6, 19], [6.0, 26], [6.3, 31.2]], w: 0.12, valley: 1.0 },          // the Tigris
      { pts: [[15, 11], [15.7, 19], [16.4, 27], [17.2, 33], [17.6, 38.8]], w: 0.18, valley: 1.6 },      // the Indus
      { pts: [[21.5, 9.5], [25, 12.5], [28.5, 9.0], [31.5, 10.5], [34, 13], [36.8, 13.4]], w: 0.18, valley: 1.6 },  // the Yellow River
      { pts: [[20.5, 20.5], [24, 22.3], [27, 23.8], [30.5, 24.2], [33.5, 25.6], [36.6, 26.4]], w: 0.22, valley: 1.8 }, // the Yangtze
      { pts: [[25.5, 27], [26.8, 30.5], [28.5, 33.8], [29.5, 37], [30.2, 40.5]], w: 0.2, valley: 1.6 },  // the Mekong
    ],
    ranges: [
      { pts: [[7.5, 3], [9.2, 12], [10, 20], [10.6, 28]], r: 2.4, h: 85 },          // the Zagros
      { pts: [[13.5, 7.5], [17, 6.5], [21, 6.8], [24, 4.5]], r: 4.0, h: 140, snow: 95 },  // the Himalaya
      { pts: [[19, 13], [20.5, 17.5], [19.5, 25.5]], r: 2.2, h: 95, snow: 105 },    // the mountains round Shu
      { pts: [[25.5, 17.2], [29, 18.3], [32.5, 18]], r: 1.6, h: 70 },               // the Qinling
      { pts: [[22.5, 3.5], [30, 2.2], [37, 3]], r: 1.6, h: 40 },                    // the northern hills, for the Great Wall
    ],
    lakes: [],
    ruggedness: 16, plateau: 20,
    cities: [
      { id: 'babylon', x: 4.2, z: 21.5, r: 1.3, e: 6 },
      { id: 'persepolis', x: 12.6, z: 25.5, r: 1.0, e: 40 },
      { id: 'mohenjoDaro', x: 16.9, z: 30.5, r: 1.0, e: 6 },
      { id: 'forbiddenCity', x: 31.5, z: 6.4, r: 1.6, e: 12 },
      { id: 'wei', x: 27.2, z: 13.2, r: 1.1, e: 14 },
      { id: 'shu', x: 22.4, z: 22.5, r: 1.1, e: 14 },
      { id: 'wu', x: 32.4, z: 27.2, r: 1.1, e: 6 },
      { id: 'liangzhu', x: 35, z: 29.5, r: 1.0, e: 4 },
      { id: 'angkor', x: 27.6, z: 34.6, r: 1.6, e: 6 },
    ],
    climate(c) {
      const x = c.x + c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 7) * 1.2, z = c.z - c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 8) * 1.2;
      if (c.e < 0.8) return c.sea ? BIOME.sea : BIOME.beach;
      if (c.snow && c.e > c.snow + c.wob * 8) return BIOME.snow;
      if (c.e > 62 + c.wob * 10) return x > 19 && c.e < 80 ? BIOME.forest : BIOME.rock;
      if (x < 12) return c.river < 1.4 + c.wob * 0.5 ? BIOME.fields : x > 7.5 ? BIOME.steppe : BIOME.desert;
      if (x < 18.5) return c.river < 2 + c.wob ? BIOME.fields : BIOME.savanna;
      if (z > 29 && x < 34) return BIOME.jungle;
      if (z < 15) return c.river < 1.2 ? BIOME.fields : c.wob > 0.25 ? BIOME.forest : BIOME.steppe;
      if (c.river < 1.3 + c.wob * 0.5) return BIOME.fields;
      return c.wob > 0.35 ? BIOME.bamboo : BIOME.forest;
    },
  },
  mediterranean: {
    name: 'The Mediterranean', seed: 37,
    blurb: 'A sea of islands: Rome and Florence in Italy, Athens and Olympia in Greece, Carthage in Africa, Jerusalem in the east.',
    land: [
      { poly: [[-2, -2], [42, -2], [42, 5.5], [33, 6.2], [26, 5.2], [20, 5.6], [12, 4.6], [5, 6.0], [-2, 5.2]] },   // Europe
      { poly: [[11, 4.5], [17.5, 4.8], [22, 11], [28.4, 15.6], [27.9, 17.6], [24.6, 16.8], [25.4, 21.4], [23.3, 22.4], [20.5, 16.8], [15.6, 11.8], [12.3, 8.4]] }, // Italy
      { poly: [[21.2, 23.4], [25.4, 23.7], [22.4, 26.6]] },                                                       // Sicily
      { poly: [[30.4, 5], [42, 5], [42, 13.5], [38.6, 14.8], [37.6, 15.6], [35.6, 16.4], [35.6, 20.6], [33.8, 21.4], [31.4, 19.6], [31.2, 17.4], [32.8, 15.4], [30.6, 12.2]] }, // Greece
      { e: [35.2, 28.2, 3.4, 0.7] }, { e: [8.2, 12.4, 1.2, 2.6] }, { e: [8.4, 18.4, 1.8, 3.0] },                   // Crete, Corsica, Sardinia
      { e: [38.6, 19.4, 0.7, 0.5] }, { e: [39.2, 22.4, 0.6, 0.6] }, { e: [36.6, 23.6, 0.5, 0.4] },                // islands of the Aegean
      { poly: [[-2, 33], [10, 32.5], [15.5, 30.6], [17, 27.4], [19.6, 27.6], [20.6, 31.2], [28, 33.6], [36.6, 33.2], [37.6, 22.5], [42, 22], [42, 42], [-2, 42]] }, // Africa and the Levant
    ],
    seas: [],
    rivers: [
      { pts: [[13.4, 5.2], [14.6, 7.0], [15.2, 7.5]], w: 0.07, valley: 0.6 },      // the Arno
      { pts: [[18.6, 7.2], [18.2, 10], [17.4, 11.5], [16.7, 12.4]], w: 0.09, valley: 0.8 },   // the Tiber
      { pts: [[39.6, 26], [39.4, 30], [39.6, 35.5]], w: 0.06, valley: 0.6, lake: true },      // the Jordan
    ],
    ranges: [
      { pts: [[2, 1.5], [12, 2.5], [22, 1.8], [30, 2.6]], r: 2.6, h: 120, snow: 85 },   // the Alps
      { pts: [[14.5, 6.5], [18.4, 9.8], [21.5, 13.5], [23.8, 19]], r: 1.3, h: 60 },     // the Apennines
      { pts: [[33, 7], [33.8, 11], [33.6, 15]], r: 1.4, h: 70 },                        // the Pindus
      { pts: [[3, 37], [11, 35.8], [16, 36.4]], r: 1.8, h: 55 },                        // the Atlas
    ],
    lakes: [],
    ruggedness: 14, plateau: 12,
    cities: [
      { id: 'rome', x: 17.6, z: 11.6, r: 1.7, e: 10 },
      { id: 'florence', x: 15.4, z: 7.6, r: 1.0, e: 12 },
      { id: 'athens', x: 37.3, z: 16.4, r: 1.4, e: 12 },
      { id: 'olympia', x: 32.6, z: 18.2, r: 0.8, e: 8 },
      { id: 'carthage', x: 18.3, z: 28.6, r: 1.3, e: 5 },
      { id: 'jerusalem', x: 38.9, z: 31.6, r: 1.0, e: 40 },
      { id: 'worldBank', x: 23.1, z: 24.4, r: 0.35, e: 8 },
    ],
    climate(c) {
      const x = c.x + c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 7) * 1.2, z = c.z - c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 8) * 1.2;
      if (c.e < 0.8) return c.sea ? BIOME.sea : BIOME.beach;
      if (c.snow && c.e > c.snow + c.wob * 8) return BIOME.snow;
      if (c.e > 70) return BIOME.alpine;
      if (z > 34.5 && x < 37) return c.wob > 0.3 ? BIOME.scrub : BIOME.desert;
      if (z < 5.5) return BIOME.forest;
      if (c.river < 0.7) return BIOME.fields;
      return c.wob > 0.15 ? BIOME.scrub : c.wob < -0.3 ? BIOME.forest : BIOME.fields;
    },
  },
  yucatan: {
    name: 'Yucatán', seed: 53,
    blurb: 'Flat limestone jungle with hidden wells (cenotes), Maya pyramids, the Caribbean coast and highland volcanoes.',
    land: [{ poly: [[-2, 7], [3, 5.2], [10, 4.2], [18, 3.6], [26, 4.2], [31, 5.6], [34.4, 9], [35.6, 15], [34.8, 21], [35.2, 27], [34, 33], [35.6, 42], [-2, 42]] }],
    seas: [{ poly: [[-2, 7], [2.8, 9], [3.4, 15], [2.6, 21], [-2, 23]] }],     // the Gulf of Mexico
    rivers: [{ pts: [[18, 41], [22, 36.5], [27, 35.5], [31, 33.5], [34.4, 32]], w: 0.12, valley: 1.0 }],
    ranges: [
      { pts: [[7, 21], [12, 23.5], [18, 25]], r: 1.6, h: 45 },                          // the Puuc hills
      { pts: [[-1, 36.5], [6, 37.5], [14, 39.5], [22, 41.5]], r: 3.4, h: 120, snow: 118 },  // the highlands
      { pts: [[3.5, 39.6], [3.6, 39.7]], r: 1.6, h: 130, snow: 118 },                   // a volcano
    ],
    lakes: [{ e: [26, 30.5, 1.0, 0.5] }],
    ruggedness: 5, plateau: 6, cenotes: true,
    cities: [
      { id: 'chichenItza', x: 20.4, z: 11.6, r: 1.3, e: 10 },
      { id: 'uxmal', x: 12, z: 20.4, r: 1.0, e: 18 },
      { id: 'tulum', x: 34.2, z: 17.6, r: 0.7, e: 6 },
      { id: 'tikal', x: 24.6, z: 32.6, r: 1.4, e: 30 },
      { id: 'teotihuacan', x: 8.6, z: 33.4, r: 1.8, e: 60 },
    ],
    climate(c) {
      const x = c.x + c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 7) * 1.2, z = c.z - c.wob * 4 + fbm(c.x, c.z, 1.1, 2, 8) * 1.2;
      if (c.e < 0.8) return c.sea ? BIOME.sea : c.wob > 0.2 ? BIOME.mangrove : BIOME.beach;
      if (c.snow && c.e > c.snow + c.wob * 6) return BIOME.snow;
      if (c.e > 85) return BIOME.rock;
      if (z < 14) return c.wob > 0.25 ? BIOME.jungle : BIOME.savanna;
      return BIOME.jungle;
    },
  },
};
export const MAP_IDS = Object.keys(MAPS);
for (const id of MAP_IDS) MAPS[id].id = id;

// ---------- the land at one spot ----------
/// Everything about the land at (x, z) km: e (metres above the sea), whether it's sea, the biome, and the nearest
/// river and city. Pure and repeatable.
export function sample(map, x, z) {
  const s = map.seed;
  const wob = fbm(x, z, 0.35, 3, s + 5);                           // a slow wobble that breaks up edges
  // How far inland (km): positive on land.
  const wx = x + fbm(x, z, 0.5, 3, s + 1) * 0.6, wz = z + fbm(x, z, 0.5, 3, s + 2) * 0.6;
  let land = -1e9;
  for (const L of map.land) land = Math.max(land, -(L.poly ? polyDist(wx, wz, L.poly) : ellipseDist(wx, wz, ...L.e)));
  for (const S of map.seas) land = Math.min(land, S.poly ? polyDist(wx, wz, S.poly) : ellipseDist(wx, wz, ...S.e));
  for (const L of map.lakes) land = Math.min(land, ellipseDist(wx, wz, ...L.e));
  // The land itself: a shore, then plains rising to the map's plateau, with hills.
  let e;
  if (land < 0) e = Math.max(-40, land * 25 - 1.5);
  else {
    const inland = smooth(0, 3, land);
    e = 1 + land * 4 * (1 - inland) + inland * (4 + map.plateau * smooth(0.5, 1, fbm(x, z, 0.08, 2, s + 3) * 0.5 + 0.5));
    e += map.ruggedness * inland * (fbm(x, z, 0.45, 5, s + 4) * 0.5 + 0.5);
  }
  // Mountains.
  let snow = 0;
  for (const R of map.ranges) {
    const [d] = lineDist(x, z, R.pts);
    if (d < R.r) {
      const k = Math.pow(1 - d / R.r, 1.4), ridge = 1 - Math.abs(fbm(x, z, 1.3, 4, s + 9));
      const add = R.h * k * (0.55 + 0.45 * ridge) * (land > 0 ? smooth(0, 1.5, land) : 0);
      if (add > 0 && R.snow) snow = R.snow;
      e += add;
    }
  }
  // Rivers cut down to the sea, with a valley either side.
  let river = 99;
  for (const R of map.rivers) {
    const [d] = lineDist(x, z, R.pts);
    const dd = d + fbm(x, z, 2, 2, s + 7) * R.w * 0.6;
    river = Math.min(river, dd);
    if (land > -0.5 && dd < R.w + R.valley) {
      const bed = dd < R.w ? -2.5 - (1 - dd / R.w) * 2 : 1.5;
      e = lerp(Math.min(e, bed), e, smooth(R.w * 0.6, R.w + R.valley, dd) * (dd < R.w ? 0 : 1));
      if (dd >= R.w) e = Math.max(e, 1.2);
    }
  }
  // Cenotes: round wells in the limestone, open to water.
  let cenote = false;
  if (map.cenotes && land > 2) {
    const cx = Math.floor(x / 1.7), cz = Math.floor(z / 1.7);
    if (hash2(cx, cz, s + 31) < 0.55) {
      const px = (cx + 0.2 + 0.6 * hash2(cx, cz, s + 32)) * 1.7, pz = (cz + 0.2 + 0.6 * hash2(cx, cz, s + 33)) * 1.7;
      const r = 0.018 + 0.02 * hash2(cx, cz, s + 34), d = Math.hypot(x - px, z - pz);
      if (d < r) { e = -6; cenote = true; }
    }
  }
  // Cities sit on level ground.
  let city = null;
  for (const C of map.cities) {
    const d = Math.hypot(x - C.x, z - C.z);
    if (d < C.r + 0.5) {
      const k = smooth(C.r + 0.5, C.r, d);
      if (river > 0.25 || C.id === 'thebes' || C.id === 'rome') e = lerp(e, Math.max(C.e, river < 0.3 ? e : C.e), k);
      if (d < C.r) city = C;
    }
  }
  const sea = e < 0;
  const c = { x, z, e, sea, wob, river, snow, land, cenote, city };
  c.biome = cenote ? BIOME.jungle : map.climate(c);
  return c;
}

// ---------- what the ground is made of ----------
// For each biome: the top block, the few blocks under it, and the rock below.
const T = { grass: 1, dirt: 2, stone: 3, sand: 4, gravel: 5, snow: 6, clay: 14, sandstone: 21, limestone: 52, mountainSoil: 122, snowyGrass: 26, granite: 61, farmland: 51, rammedEarth: 104 };
const GROUND = {
  [BIOME.sea]: [T.sand, T.sand, T.stone], [BIOME.beach]: [T.sand, T.sand, T.sandstone], [BIOME.desert]: [T.sand, T.sand, T.sandstone],
  [BIOME.fields]: [T.grass, T.dirt, T.stone], [BIOME.forest]: [T.grass, T.dirt, T.stone], [BIOME.jungle]: [T.grass, T.dirt, T.limestone],
  [BIOME.rock]: [T.stone, T.stone, T.stone], [BIOME.snow]: [T.snow, T.stone, T.granite], [BIOME.scrub]: [T.grass, T.dirt, T.limestone],
  [BIOME.steppe]: [T.grass, T.dirt, T.stone], [BIOME.bamboo]: [T.grass, T.dirt, T.stone], [BIOME.delta]: [T.grass, T.clay, T.stone],
  [BIOME.oasis]: [T.grass, T.sand, T.sandstone], [BIOME.alpine]: [T.mountainSoil, T.stone, T.granite], [BIOME.mangrove]: [T.dirt, T.clay, T.limestone],
  [BIOME.savanna]: [T.grass, T.dirt, T.stone],
};
// What grows: [chance per column, kinds…]. A kind is a tree (log, leaves, shape) or a small plant id.
const P = { tallGrass: 30, poppy: 31, dandelion: 32, deadBush: 33, cactus: 13, papyrus: 138, bamboo: 137 };
const TREE = {
  oak: [7, 8, 'round'], birch: [9, 10, 'round'], spruce: [11, 12, 'cone'], palm: [24, 25, 'palm'], jungle: [124, 125, 'tall'],
  cherry: [126, 127, 'round'], ginkgo: [128, 129, 'round'], acacia: [130, 131, 'flat'], fig: [132, 133, 'round'], olive: [132, 133, 'low'],
  ironwood: [157, 158, 'tall'],
};
const GROWS = {
  [BIOME.fields]: { trees: 0.0012, kinds: ['oak'], plants: 0.14, small: [P.tallGrass, P.tallGrass, P.tallGrass, P.tallGrass, P.tallGrass, P.tallGrass, P.tallGrass, P.poppy, P.dandelion] },
  [BIOME.forest]: { trees: 0.012, kinds: ['oak', 'oak', 'birch', 'spruce'], plants: 0.12, small: [P.tallGrass, P.tallGrass, P.tallGrass, P.tallGrass, P.poppy] },
  [BIOME.jungle]: { trees: 0.02, kinds: ['jungle', 'jungle', 'fig', 'ironwood', 'palm'], plants: 0.3, small: [P.tallGrass] },
  [BIOME.scrub]: { trees: 0.003, kinds: ['olive', 'olive', 'fig', 'spruce'], plants: 0.12, small: [P.tallGrass, P.deadBush, P.poppy] },
  [BIOME.steppe]: { trees: 0.0004, kinds: ['acacia'], plants: 0.22, small: [P.tallGrass, P.tallGrass, P.deadBush] },
  [BIOME.savanna]: { trees: 0.0015, kinds: ['acacia', 'acacia', 'fig'], plants: 0.2, small: [P.tallGrass] },
  [BIOME.bamboo]: { trees: 0.004, kinds: ['cherry', 'ginkgo'], plants: 0.12, small: [P.bamboo, P.bamboo, P.tallGrass] },
  [BIOME.delta]: { trees: 0.002, kinds: ['palm'], plants: 0.25, small: [P.tallGrass, P.papyrus] },
  [BIOME.oasis]: { trees: 0.02, kinds: ['palm'], plants: 0.1, small: [P.tallGrass] },
  [BIOME.desert]: { trees: 0, kinds: [], plants: 0.002, small: [P.deadBush, P.cactus] },
  [BIOME.alpine]: { trees: 0.006, kinds: ['spruce'], plants: 0.08, small: [P.tallGrass] },
  [BIOME.mangrove]: { trees: 0.01, kinds: ['jungle'], plants: 0.05, small: [P.tallGrass] },
  [BIOME.beach]: { trees: 0.0008, kinds: ['palm'], plants: 0, small: [] },
};

/// Height of the ground (the first air above it) and the column's biome, in blocks, at block (bx, bz).
export function column(map, bx, bz) {
  const c = sample(map, bx / KM, bz / KM);
  const y = SL + Math.round(c.e * 2);
  return { y: Math.max(4, Math.min(H - 8, y)), c };
}

// ---------- building a chunk ----------
/// The blocks of one chunk, as a Uint8Array of CS × CS × H laid out (y * CS + z) * CS + x, plus its columns' heights
/// and biomes. Trees near the edge are drawn from both sides, so they cross chunk borders cleanly.
export function genChunk(map, cx, cz) {
  const x0 = cx * CS, z0 = cz * CS, s = map.seed;
  const cells = new Uint8Array(CS * CS * H), tops = new Int16Array(CS * CS), bio = new Uint8Array(CS * CS);
  const put = (x, y, z, b) => { if (x >= 0 && z >= 0 && x < CS && z < CS && y >= 0 && y < H) cells[(y * CS + z) * CS + x] = b; };
  const putSoft = (x, y, z, b) => { if (x >= 0 && z >= 0 && x < CS && z < CS && y > 0 && y < H && cells[(y * CS + z) * CS + x] === 0) cells[(y * CS + z) * CS + x] = b; };
  // Columns, a little wider than the chunk so trees reaching in from outside know where they stand.
  const PADW = 6, W = CS + PADW * 2, colY = new Int16Array(W * W), colB = new Uint8Array(W * W), colWet = new Uint8Array(W * W);
  // The land is sampled every 4 blocks (2 m) and smoothed between, which is plenty for ground and much faster.
  const STEP = 4, gx0 = Math.floor((x0 - PADW) / STEP) * STEP, gz0 = Math.floor((z0 - PADW) / STEP) * STEP;
  const GW = Math.ceil((x0 + CS + PADW - gx0) / STEP) + 1, grid = [];
  for (let j = 0; j < GW; j++) for (let i = 0; i < GW; i++) grid.push(sample(map, (gx0 + i * STEP) / KM, (gz0 + j * STEP) / KM));
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const bx = x0 - PADW + i, bz = z0 - PADW + j, fx = (bx - gx0) / STEP, fz = (bz - gz0) / STEP;
    const ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz;
    const a = grid[iz * GW + ix], b = grid[iz * GW + ix + 1], c = grid[(iz + 1) * GW + ix], d = grid[(iz + 1) * GW + ix + 1];
    const e = (a.e * (1 - tx) + b.e * tx) * (1 - tz) + (c.e * (1 - tx) + d.e * tx) * tz;
    const near = tx < 0.5 ? (tz < 0.5 ? a : c) : (tz < 0.5 ? b : d);
    // Small bumps a block or two high so the ground isn't too smooth up close.
    const bump = noise(bx / 23, bz / 23, s + 78) * 0.9 + noise(bx / 61, bz / 61, s + 79) * 1.2;
    colY[j * W + i] = Math.max(4, Math.min(H - 8, SL + Math.round(e * 2 + (e > 1 ? bump : 0))));
    colB[j * W + i] = near.biome;
    colWet[j * W + i] = near.cenote ? 1 : 0;
  }
  for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
    const k = (z + PADW) * W + x + PADW, top = colY[k], biome = colB[k], g = GROUND[biome] || GROUND[BIOME.fields];
    tops[z * CS + x] = top; bio[z * CS + x] = biome;
    const bx = x0 + x, bz = z0 + z;
    put(x, 0, z, 20);
    for (let y = 1; y < top; y++) {
      const depth = top - y;
      let b = depth === 1 ? g[0] : depth <= 4 ? g[1] : g[2];
      if (depth === 1 && top <= SL && g[0] === T.grass) b = biome === BIOME.delta ? T.clay : T.dirt;   // under water
      if (b === T.grass && top > SL && top <= SL + 2 && biome !== BIOME.delta) b = T.sand;            // a strip of beach
      if (depth > 6) {   // ores, deeper is richer
        const r = hash2(bx * 7 + y, bz * 13 - y, s + 90);
        if (r < 0.006) b = 15; else if (r < 0.009) b = 17; else if (r < 0.011 && y < SL - 10) b = 18; else if (r < 0.0115 && y < SL - 40) b = 19;
        else if (r < 0.0122 && y < SL - 20) b = 16; else if (r < 0.0124 && y < 30) b = 151;
      }
      put(x, y, z, b);
    }
    if (top <= SL) {
      for (let y = top; y < SL; y++) put(x, y, z, 40);
      if (biome === BIOME.sea && top < SL - 6 && hash2(bx, bz, s + 61) < 0.04) put(x, top, z, hash2(bx, bz, s + 62) < 0.5 ? 66 : 65);
    }
    // The snow line.
    if (biome === BIOME.snow && top > SL) put(x, top - 1, z, T.snow);
  }
  // Plants and trees: anchored by hash at each column, including the padding, so neighbours agree.
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const top = colY[j * W + i], biome = colB[j * W + i];
    if (top <= SL + 1) continue;
    const gr = GROWS[biome];
    if (!gr) continue;
    const bx = x0 - PADW + i, bz = z0 - PADW + j, lx = bx - x0, lz = bz - z0;
    const r = hash2(bx, bz, s + 40);
    if (r < gr.trees && i > 1 && j > 1 && i < W - 2 && j < W - 2) {
      const kind = TREE[gr.kinds[Math.floor(hash2(bx, bz, s + 41) * gr.kinds.length)]];
      growTree(put, putSoft, lx, top, lz, kind, hash2(bx, bz, s + 42));
    } else if (lx >= 0 && lz >= 0 && lx < CS && lz < CS && r < gr.trees + gr.plants) {
      const p = gr.small[Math.floor(hash2(bx, bz, s + 43) * gr.small.length)];
      if (p === P.cactus || p === P.bamboo || p === P.papyrus) {
        const hgt = p === P.bamboo ? 6 + Math.floor(hash2(bx, bz, s + 44) * 10) : 2 + Math.floor(hash2(bx, bz, s + 44) * 3);
        for (let y = 0; y < hgt; y++) putSoft(lx, top + y, lz, p);
      } else putSoft(lx, top, lz, p);
    }
  }
  return { cx, cz, cells, tops, bio };
}

/// A tree at life size: trunks 8–30 blocks (4–15 m) high, crowns to match.
function growTree(put, putSoft, x, y, z, [log, leaf, shape], r) {
  const disc = (cy, rad, b) => {
    for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
      const d = dx * dx + dz * dz;
      if (d <= rad * rad + rad * 0.6 && !(d > (rad - 0.5) * (rad - 0.5) && hash2(x + dx, z + dz, cy) < 0.35)) putSoft(x + dx, cy, z + dz, b);
    }
  };
  if (shape === 'palm') {
    const h = 12 + Math.floor(r * 8);
    for (let i = 0; i < h; i++) put(x + (i > h * 0.6 ? 1 : 0), y + i, z, log);
    const tx = x + 1, ty = y + h;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]])
      for (let k = 1; k <= 5; k++) putSoft(tx + dx * k, ty - (k > 3 ? 1 : 0) - (k > 4 ? 1 : 0), z + dz * k, leaf);
    putSoft(tx, ty, z, leaf);
    return;
  }
  if (shape === 'cone') {
    const h = 16 + Math.floor(r * 12);
    for (let i = 0; i < h; i++) put(x, y + i, z, log);
    for (let i = 4; i <= h + 1; i++) { const rad = Math.max(0, Math.round((h + 1 - i) * 0.32)); if (i % 2 === 0 || rad < 2) disc(y + i, rad, leaf); }
    putSoft(x, y + h + 1, z, leaf);
    return;
  }
  if (shape === 'flat') {   // acacia: a bare trunk and a wide flat crown
    const h = 8 + Math.floor(r * 4);
    for (let i = 0; i < h; i++) put(x + (i > h / 2 ? 1 : 0), y + i, z, log);
    disc(y + h, 5, leaf); disc(y + h + 1, 3, leaf);
    return;
  }
  const tall = shape === 'tall', low = shape === 'low';
  const h = tall ? 20 + Math.floor(r * 12) : low ? 5 + Math.floor(r * 3) : 9 + Math.floor(r * 6);
  const rad = tall ? 5 : low ? 3 : 4;
  for (let i = 0; i < h; i++) { put(x, y + i, z, log); if (tall && i < 3) { put(x + 1, y + i, z, log); put(x, y + i, z + 1, log); put(x + 1, y + i, z + 1, log); } }
  for (let dy = -rad; dy <= rad - 1; dy++) {
    const rr = Math.round(Math.sqrt(Math.max(0, rad * rad - dy * dy * 1.3)));
    if (rr > 0) disc(y + h + dy, rr, leaf);
  }
}

// ---------- pictures of the maps ----------
const MAP_COL = {
  [BIOME.sea]: [44, 92, 158], [BIOME.beach]: [228, 212, 160], [BIOME.desert]: [222, 196, 128], [BIOME.fields]: [126, 172, 74],
  [BIOME.forest]: [58, 112, 52], [BIOME.jungle]: [36, 118, 46], [BIOME.rock]: [136, 130, 124], [BIOME.snow]: [244, 246, 250],
  [BIOME.scrub]: [150, 152, 84], [BIOME.steppe]: [172, 170, 104], [BIOME.bamboo]: [96, 152, 72], [BIOME.delta]: [104, 162, 84],
  [BIOME.oasis]: [64, 150, 92], [BIOME.alpine]: [112, 122, 92], [BIOME.mangrove]: [72, 112, 72], [BIOME.savanna]: [180, 170, 92],
};
/// The whole map as an RGBA picture, `n` pixels across (north up), with rivers and shading.
export function mapPixels(map, n) {
  const px = new Uint8ClampedArray(n * n * 4);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const c = sample(map, ((i + 0.5) / n) * 40, ((j + 0.5) / n) * 40);
    let col = MAP_COL[c.biome] || [200, 0, 200];
    let sh = c.sea ? Math.max(0.55, 1 + c.e / 70) : Math.min(1.3, 0.85 + c.e / 200);
    if (!c.sea && c.river < Math.max(0.09, 40 / n * 0.4)) { col = [58, 104, 186]; sh = 1; }
    if (c.cenote) { col = [40, 120, 170]; sh = 1; }
    const k = (j * n + i) * 4;
    px[k] = col[0] * sh; px[k + 1] = col[1] * sh; px[k + 2] = col[2] * sh; px[k + 3] = 255;
  }
  return px;
}

/// Heights and colours for the far-off land: a grid of (n + 1) × (n + 1) points `step` blocks apart, starting at block
/// (x0, z0). Heights are in blocks (never below the sea); colours are RGB bytes.
export function farGrid(map, x0, z0, step, n) {
  const h = new Float32Array((n + 1) * (n + 1)), col = new Uint8Array((n + 1) * (n + 1) * 3);
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const bx = x0 + i * step, bz = z0 + j * step, k = j * (n + 1) + i;
    if (bx < -4000 || bz < -4000 || bx > SIZE + 4000 || bz > SIZE + 4000) { h[k] = SL - 0.3; col[k * 3] = 44; col[k * 3 + 1] = 92; col[k * 3 + 2] = 158; continue; }
    const c = sample(map, bx / KM, bz / KM), y = SL + c.e * 2;
    let rgb = MAP_COL[c.biome] || [120, 160, 80];
    const wet = c.sea || (c.river < 0.12 && c.e < 1) || c.cenote;
    if (wet) rgb = c.sea ? [40, 86, 150] : [58, 104, 186];
    h[k] = wet ? SL - 0.3 : Math.max(SL - 0.3, y - 0.5);
    // Darker and a little mottled, like the textured ground and the treetops seen from far off.
    const woods = c.biome === BIOME.forest || c.biome === BIOME.jungle || c.biome === BIOME.bamboo || c.biome === BIOME.mangrove;
    const mottle = 1 + (hash2(bx >> 3, bz >> 3, 5) - 0.5) * 0.16 - (woods ? 0.18 * (0.5 + 0.5 * noise(bx / 40, bz / 40, 6)) : 0);
    const sh = wet ? 0.9 : Math.min(1.1, 0.72 + c.e / 260) * mottle;
    col[k * 3] = Math.min(255, rgb[0] * sh); col[k * 3 + 1] = Math.min(255, rgb[1] * sh); col[k * 3 + 2] = Math.min(255, rgb[2] * sh);
  }
  return { h, col };
}
