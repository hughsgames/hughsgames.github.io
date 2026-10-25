// Polis World (computer version): builds the whole world in the background, from the same map as the iPhone game.
// Terrain, caves, ravines, canyons, ores, trees, the wonders of the ancient world, cities and your camp.
'use strict';

const B = {
  air: 0, grass: 1, dirt: 2, stone: 3, sand: 4, gravel: 5, snow: 6, oakLog: 7, oakLeaves: 8, birchLog: 9, birchLeaves: 10,
  spruceLog: 11, spruceLeaves: 12, cactus: 13, clay: 14, coalOre: 15, tinOre: 16, copperOre: 17, ironOre: 18, goldOre: 19,
  bedrock: 20, sandstone: 21, cobblestone: 22, planks: 23, palmLog: 24, palmLeaves: 25, snowyGrass: 26, mossyCobble: 27,
  tallGrass: 30, redFlower: 31, yellowFlower: 32, deadBush: 33, fence: 34, door: 35, gate: 36, bedHead: 37, bedFoot: 38,
  water: 40, brick: 41, marble: 42, blueTile: 43, column: 44, goldBlock: 45, lamp: 46, farmland: 51, limestone: 52,
  mudBrick: 53, carvedStone: 54, stoneBricks: 55, torch: 56, campfire: 58, furnace: 59, furnaceLit: 60, granite: 61,
  blackMarble: 62, ancientBlock: 63, ancientOre: 64, kelp: 65, seagrass: 66, brainCoral: 67, tubeCoral: 68, fireCoral: 69,
  purpleFan: 70, yellowFan: 71, sponge: 72, ladder: 73, crystal: 74, pedestal: 75, atlStone: 76, falling: 88,
  yellowRoof: 90, greenRoof: 91, redLacquer: 92, glass: 93, terracotta: 94, mosaic: 95, plaster: 96, bronzeBlock: 97,
  redCloth: 98, blueCloth: 99, jerusalemStone: 100, scrollShelf: 101, jade: 102, greyRoof: 103, rammedEarth: 104, purpleCloth: 105,
  doorXLower: 110, doorXUpper: 111, doorZLower: 112, doorZUpper: 113, gateX: 118, gateZ: 119,
};
const flow = (a) => 80 + a;
const BIOMES = ['ocean', 'sea', 'lake', 'river', 'beach', 'oasis', 'desert', 'plain', 'forest', 'hill', 'mountain'];
const BI = Object.fromEntries(BIOMES.map((b, i) => [b, i]));
const isWaterBiome = (b) => b <= 3;

const H = 96, WL = 32, LIFT = WL - 9, BPT = 10;   // 10 blocks per map square: an 800 × 800 world (it was 7, 560 × 560)
// Blocks that stop you (solid) and block the sky.
const SOLID = new Uint8Array(256), CROSS = new Uint8Array(256);
for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 34, 37, 38, 41, 42, 43, 44, 45, 46, 51, 52, 53, 54, 55, 59, 60, 61, 62, 63, 64, 67, 68, 69, 72, 74, 75, 76,
  90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 110, 111, 112, 113, 118, 119]) SOLID[id] = 1;
for (const id of [30, 31, 32, 33, 56, 58, 65, 66, 70, 71]) CROSS[id] = 1;
const WATERY = new Uint8Array(256);
for (const id of [40, 65, 66, 70, 71, 81, 82, 83, 84, 85, 86, 87, 88]) WATERY[id] = 1;

// ---------- noise ----------
function hash(x, z, seed) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ seed;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 8) / 16777216;
}
const hash3 = (x, y, z, s) => hash(x + Math.imul(y, 7919), z - Math.imul(y, 104729), s);
function vnoise(x, z, cell, seed) {
  const fx = x / cell, fz = z / cell, ix = Math.floor(fx), iz = Math.floor(fz);
  let tx = fx - ix, tz = fz - iz;
  tx = tx * tx * (3 - 2 * tx); tz = tz * tz * (3 - 2 * tz);
  const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed), c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
  const top = a + (b - a) * tx, bot = c + (d - c) * tx;
  return top + (bot - top) * tz;
}
const fbm = (x, z, s) => 0.5 * vnoise(x, z, 16, s) + 0.27 * vnoise(x, z, 8, s + 1) + 0.15 * vnoise(x, z, 4, s + 2) + 0.08 * vnoise(x, z, 2, s + 3);
function blur(a, n, r) {
  const tmp = new Float32Array(a.length), out = new Float32Array(a.length);
  for (let z = 0; z < n; z++) {
    let s = 0, c = 0;
    for (let x = -r; x <= r; x++) if (x >= 0 && x < n) { s += a[z * n + x]; c++; }
    for (let x = 0; x < n; x++) {
      tmp[z * n + x] = s / c;
      const add = x + r + 1, rem = x - r;
      if (add < n) { s += a[z * n + add]; c++; }
      if (rem >= 0) { s -= a[z * n + rem]; c--; }
    }
  }
  for (let x = 0; x < n; x++) {
    let s = 0, c = 0;
    for (let z = -r; z <= r; z++) if (z >= 0 && z < n) { s += tmp[z * n + x]; c++; }
    for (let z = 0; z < n; z++) {
      out[z * n + x] = s / c;
      const add = z + r + 1, rem = z - r;
      if (add < n) { s += tmp[add * n + x]; c++; }
      if (rem >= 0) { s -= tmp[rem * n + x]; c--; }
    }
  }
  return out;
}
function Dice(seed) {
  let s = seed >>> 0;
  return {
    next() { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
    range(a, b) { return a + (b - a) * this.next(); },
  };
}

function shape(b) {
  const l = LIFT;
  switch (BIOMES[b]) {
    case 'ocean': return [l - 6, 2, 0];
    case 'sea': return [l - 1, 1.5, 0];
    case 'lake': return [l + 4, 1, 0];
    case 'river': return [l + 6, 0.5, 0];
    case 'beach': return [l + 9.6, 0.5, 0];
    case 'oasis': return [l + 9.8, 0.6, 0];
    case 'desert': return [l + 11, 2.4, 0];
    case 'plain': return [l + 11, 2.0, 0];
    case 'forest': return [l + 12, 2.6, 0];
    case 'hill': return [l + 16, 4.5, 3];
    default: return [l + 24, 8, 16];
  }
}

// ---------- the world ----------
class World {
  constructor(n) {
    this.n = n;
    this.cells = new Uint8Array(n * n * H);
    this.bio = new Uint8Array(n * n);
    this.protected = new Map();     // cell index → site number (historic sites can't be broken)
  }
  idx(x, y, z) { return (y * this.n + z) * this.n + x; }
  inb(x, z) { return x >= 0 && z >= 0 && x < this.n && z < this.n; }
  get(x, y, z) { if (y < 0) return B.bedrock; if (!this.inb(x, z) || y >= H) return 0; return this.cells[(y * this.n + z) * this.n + x]; }
  set(x, y, z, b) { if (!this.inb(x, z) || y < 0 || y >= H) return; this.cells[(y * this.n + z) * this.n + x] = b; }
  solid(x, y, z) { return SOLID[this.get(x, y, z)] === 1; }
  biome(x, z) { return this.inb(x, z) ? this.bio[z * this.n + x] : 0; }
  groundY(x, z, below = H - 1) {
    if (!this.inb(x, z)) return 0;
    for (let y = Math.min(below, H - 1); y >= 0; y--) { const b = this.cells[(y * this.n + z) * this.n + x]; if (SOLID[b]) return b === B.fence ? y + 2 : y + 1; }
    return 0;
  }
  hasWater(x, z) { return WATERY[this.get(x, WL - 1, z)] === 1; }
  nearestLand(x0, z0) {
    for (let r = 0; r < 80; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
      const x = x0 + dx, z = z0 + dz;
      if (x < 2 || z < 2 || x >= this.n - 2 || z >= this.n - 2) continue;
      const g = this.groundY(x, z);
      const at = this.get(x, g, z);
      if (g > WL && !this.hasWater(x, z) && (at === 0 || CROSS[at]) && !this.solid(x, g + 1, z)) return [x, z];
    }
    return [x0, z0];
  }
}

function generate(mapRows, seed, spawn) {
  const tiles = mapRows.length, n = tiles * BPT;
  const w = new World(n);
  const base = new Float32Array(n * n), amp = new Float32Array(n * n), ridgeW = new Float32Array(n * n);
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const b = BI[mapRows[Math.floor(z / BPT)][Math.floor(x / BPT)]];
    const i = z * n + x;
    w.bio[i] = b;
    const s = shape(b);
    base[i] = s[0]; amp[i] = s[1]; ridgeW[i] = s[2];
  }
  const br = BPT + 1;
  const base2 = blur(blur(base, n, br), n, Math.max(2, br >> 1)), amp2 = blur(amp, n, br), ridge2 = blur(ridgeW, n, br);
  let wet = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) if (isWaterBiome(w.bio[i])) wet[i] = 1;
  const wetness = blur(wet, n, 2), dryness = blur(wet, n, 9);
  post('Shaping the land…', 0.1);

  const heights = new Int16Array(n * n), canyon = new Uint8Array(n * n);
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const i = z * n + x, b = w.bio[i];
    const f = fbm(x, z, seed);
    const ridge = 1 - Math.abs(vnoise(x, z, 11, seed + 40) * 2 - 1);
    const crag = 1 - Math.abs(vnoise(x, z, 5, seed + 41) * 2 - 1);
    let h = base2[i] + amp2[i] * (f - 0.5) * 2 + ridge2[i] * (ridge * 0.8 + crag * 0.2);
    h = isWaterBiome(b) ? Math.min(h, WL - 1) : Math.max(h, WL + 1);
    if ((b === BI.desert || b === BI.plain || b === BI.hill) && dryness[i] < 0.02 && (Math.abs(x - spawn[0]) > 30 || Math.abs(z - spawn[1]) > 30)) {
      const wob = vnoise(x, z, 9, seed + 44) * 0.06;
      const c = Math.abs(vnoise(x, z, 52, seed + 43) + wob - 0.53);
      const width = 0.042 * Math.min(1, (0.02 - dryness[i]) / 0.012);
      if (width > 0.004 && c < width) {
        const t = 1 - c / width;
        let cut = Math.pow(t, 0.55) * 22;
        cut = Math.floor(cut / 3) * 3;
        const floorY = Math.max(h - cut, WL + 2);
        canyon[i] = Math.max(0, Math.min(255, Math.round(h - floorY)));
        h = floorY;
      }
    }
    heights[i] = Math.min(Math.max(Math.round(h), 2), H - 14);
  }
  // Gentle coasts: the land rises slowly from the water's edge (about one block for every two), and the sea bed shelves
  // away gradually (about one block deeper for every three), so beaches slope into shallow water instead of dropping off.
  const shore = shoreDistance(w.bio, n);
  for (let i = 0; i < n * n; i++) {
    const d = shore[i];
    if (d > 40) continue;
    if (isWaterBiome(w.bio[i])) heights[i] = Math.max(heights[i], WL - Math.max(1, Math.round(1 + (d - 1) * 0.34)));
    else heights[i] = Math.min(heights[i], WL + 1 + Math.floor((d - 1) * 0.5));
  }
  const cp = canyonPlan(n);
  const banded = sculptCanyon(heights, w.bio, n, cp, seed);
  post('Laying down rock…', 0.25);

  const cells = w.cells;
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const i = z * n + x, h = heights[i], b = w.bio[i], cut = canyon[i];
    const colRand = hash(x, z, seed + 3);
    const graniteTop = 10 + Math.floor(vnoise(x, z, 9, seed + 70) * 6);
    for (let y = 0; y < h; y++) {
      const depth = h - 1 - y;
      let bl = B.stone;
      if (y === 0 || (y <= 2 && hash3(x, y, z, seed + 9) < 0.5)) bl = B.bedrock;
      else if (isWaterBiome(b)) { if (depth < 2) bl = colRand < 0.55 ? B.sand : (colRand < 0.8 ? B.gravel : B.clay); }
      else if (cut > 0 && b === BI.desert) {
        if (depth === 0) bl = B.sand;
        else { const band = (y + Math.floor(vnoise(x, z, 13, seed + 45) * 3)) % 7; bl = band < 3 ? B.sandstone : (band < 5 ? B.limestone : (band === 5 ? B.clay : B.sandstone)); }
      } else if (cut > 0) {
        if (depth === 0) bl = cut > 6 ? B.gravel : B.grass; else if (depth < 2 && cut <= 6) bl = B.dirt;
      } else if (b === BI.beach || b === BI.desert || b === BI.oasis || (h <= WL + 1 && wetness[i] > 0.03)) {
        if (depth < 4) bl = B.sand; else if (depth < 9 && b !== BI.beach) bl = B.sandstone;
      } else if (b === BI.mountain || (b === BI.hill && h >= WL + 13)) {
        if (h >= WL + 30) { if (depth === 0) bl = B.snow; else if (depth === 1 && hash3(x, y, z, seed) < 0.5) bl = B.snow; }
        else if (h >= WL + 18) { if (depth === 0 && hash(x, z, seed + 31) < 0.15) bl = B.gravel; }
        else { if (depth === 0) bl = h >= WL + 25 ? B.snowyGrass : B.grass; else if (depth < 3) bl = B.dirt; }
      } else { if (depth === 0) bl = B.grass; else if (depth < 4) bl = B.dirt; }
      if (banded[i] && bl === B.stone && depth >= 2) {
        // The hidden canyon's walls: stripes of rock laid down over millions of years.
        const band = (y + Math.floor(vnoise(x, z, 11, seed + 46) * 3)) % 9;
        bl = band < 3 ? B.limestone : band < 5 ? B.stone : band < 6 ? B.clay : band < 8 ? B.sandstone : B.granite;
      }
      if (bl === B.stone && y < graniteTop) bl = B.granite;
      if ((bl === B.stone || bl === B.granite) && (depth >= 1 || b === BI.mountain)) { const o = ore(x, y, z, seed); if (o) bl = o; }
      if (bl === B.stone) {
        if ((b === BI.desert || b === BI.plain || b === BI.oasis) && depth >= 3 && depth <= 12 && hash3(x >> 1, y, z >> 1, seed + 61) < 0.55) bl = B.limestone;
        else if ((b === BI.hill || b === BI.mountain) && y >= WL + 4 && depth >= 1 && hash3(x >> 1, y >> 1, z >> 1, seed + 63) < 0.08) bl = B.marble;
        else if (depth >= 2 && hash3(x >> 2, y >> 1, z >> 2, seed + 64) < 0.05) bl = B.gravel;
      }
      cells[(y * n + z) * n + x] = bl;
    }
    for (let y = h; y < WL; y++) cells[(y * n + z) * n + x] = B.water;
  }
  post('Carving caves…', 0.45);
  carveCaves(w, heights, seed, spawn);
  const wake = canyonWater(w, heights, cp);
  post('Growing forests…', 0.6);
  plantTrees(w, heights, seed, spawn);
  post('Growing coral reefs and kelp…', 0.68);
  seaLife(w, heights, seed);
  return { w, heights, cp, wake };
}

function ore(x, y, z, seed) {
  const r = hash3(x >> 1, y >> 1, z >> 1, seed + 77);
  if (hash3(x, y, z, seed + 5) >= 0.75) return 0;
  let t = 0;
  t += 0.045; if (r < t && y < WL + 40) return B.coalOre;
  t += 0.026; if (r < t && y < WL + 22 && y > 10) return B.copperOre;
  t += 0.016; if (r < t && y < WL + 14) return B.tinOre;
  t += 0.016; if (r < t && y < WL + 4) return B.ironOre;
  t += 0.008; if (r < t && y < 22) return B.goldOre;
  t += 0.005; if (r < t && y < 9) return B.blackMarble;
  return 0;
}

function carveCaves(w, heights, seed, spawn) {
  const n = w.n, cells = w.cells;
  function carve(x, y, z) {
    if (x <= 1 || z <= 1 || x >= n - 2 || z >= n - 2 || y <= 2 || y >= H - 2) return;
    if (Math.abs(x - spawn[0]) < 14 && Math.abs(z - spawn[1]) < 18 && y > WL - 12) return;
    const i = z * n + x, top = heights[i];
    if ((isWaterBiome(w.bio[i]) || top <= WL) && y >= top - 5) return;
    for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const j = (z + dz) * n + x + dx; if (heights[j] <= WL && y >= heights[j] - 4) return; }
    const k = (y * n + z) * n + x, b = cells[k];
    if (b === 0 || b === B.water || b === B.bedrock) return;
    cells[k] = 0;
  }
  function blob(cx, cy, cz, rx, ry) {
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry), z0 = Math.floor(cz - rx), z1 = Math.ceil(cz + rx);
    for (let y = y0; y <= y1; y++) { const dy = (y + 0.5 - cy) / ry; for (let z = z0; z <= z1; z++) { const dz = (z + 0.5 - cz) / rx; for (let x = x0; x <= x1; x++) { const dx = (x + 0.5 - cx) / rx; if (dx * dx + dy * dy + dz * dz <= 1) carve(x, y, z); } } }
  }
  const cell = 34, across = Math.floor(n / cell);
  for (let gz = 0; gz < across; gz++) for (let gx = 0; gx < across; gx++) {
    const d = Dice(seed + gz * 7919 + gx * 104729 + 17);
    const tunnels = d.next() < 0.75 ? (d.next() < 0.4 ? 2 : 1) : 0;
    for (let t = 0; t < tunnels; t++) {
      let px = gx * cell + d.range(0, cell), pz = gz * cell + d.range(0, cell);
      const surface = heights[Math.min(Math.max(Math.floor(pz), 0), n - 1) * n + Math.min(Math.max(Math.floor(px), 0), n - 1)];
      let py = d.range(6, Math.max(8, Math.min(surface - 3, WL + 8)));
      let yaw = d.range(0, 6.283), pitch = d.range(-0.25, 0.25);
      const steps = Math.floor(d.range(70, 170)), r0 = d.range(1.4, 2.6);
      for (let s = 0; s < steps; s++) {
        const r = r0 * (0.8 + 0.35 * Math.sin(s * 0.11 + r0));
        blob(px, py, pz, r, r * 0.8);
        if (d.next() < 0.006) blob(px, py, pz, d.range(4, 7), d.range(2.5, 4));
        yaw += d.range(-0.35, 0.35);
        pitch = Math.min(Math.max(pitch * 0.85 + d.range(-0.18, 0.18), -0.55), 0.55);
        px += Math.sin(yaw) * Math.cos(pitch); pz += Math.cos(yaw) * Math.cos(pitch); py += Math.sin(pitch);
        if (py < 5) pitch = Math.abs(pitch) + 0.1;
        if (px < 3 || pz < 3 || px > n - 4 || pz > n - 4) break;
      }
    }
    if (d.next() < 0.13) {
      let px = gx * cell + d.range(0, cell), pz = gz * cell + d.range(0, cell), yaw = d.range(0, 6.283);
      const len = Math.floor(d.range(40, 90)), floorY = d.range(8, WL - 6), depth = d.range(18, 30);
      for (let s = 0; s < len; s++) {
        const t = s / len, wd = d.range(1.2, 1.8) * Math.sin(t * Math.PI) + 0.6;
        const colH = heights[Math.min(Math.max(Math.floor(pz), 0), n - 1) * n + Math.min(Math.max(Math.floor(px), 0), n - 1)];
        const top = Math.min(floorY + depth, colH + 2);
        for (let y = floorY; y < top; y++) blob(px, y, pz, wd * (0.55 + 0.6 * (y - floorY) / Math.max(depth, 1)), 1);
        yaw += d.range(-0.12, 0.12); px += Math.sin(yaw); pz += Math.cos(yaw);
        if (px < 3 || pz < 3 || px > n - 4 || pz > n - 4) break;
      }
    }
  }
  for (let z = 2; z < n - 2; z++) for (let x = 2; x < n - 2; x++) {
    const i6 = (6 * n + z) * n + x, i5 = (5 * n + z) * n + x, i7 = (7 * n + z) * n + x;
    if (cells[i6] === 0 && SOLID[cells[i5]]) cells[i6] = B.water;
    if (cells[i7] === 0 && (cells[i6] === B.water || SOLID[cells[i6]])) cells[i7] = B.water;
  }
}

// ---------- trees ----------
function put(w, x, y, z, b) { const c = w.get(x, y, z); if (c === 0 || CROSS[c]) w.set(x, y, z, b); }
function oak(w, x, h, z, seed) {
  const trunk = 4 + Math.floor(hash(x, z, seed + 21) * 2.99), lb = h + trunk - 2;
  for (let y = lb; y < lb + 2; y++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (!(Math.abs(dx) === 2 && Math.abs(dz) === 2 && hash3(x + dx, y, z + dz, seed) < 0.6)) put(w, x + dx, y, z + dz, B.oakLeaves);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!(Math.abs(dx) === 1 && Math.abs(dz) === 1 && hash3(x + dx, lb + 2, z + dz, seed) < 0.5)) put(w, x + dx, lb + 2, z + dz, B.oakLeaves);
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(w, x + dx, lb + 3, z + dz, B.oakLeaves);
  for (let y = h; y < h + trunk; y++) w.set(x, y, z, B.oakLog);
}
function birch(w, x, h, z, seed) {
  const trunk = 5 + Math.floor(hash(x, z, seed + 22) * 2.99), lb = h + trunk - 3;
  for (let y = lb; y < lb + 3; y++) { const r = y === lb + 2 ? 1 : 2; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (!(Math.abs(dx) === r && Math.abs(dz) === r)) put(w, x + dx, y, z + dz, B.birchLeaves); }
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(w, x + dx, lb + 3, z + dz, B.birchLeaves);
  for (let y = h; y < h + trunk; y++) w.set(x, y, z, B.birchLog);
}
function spruce(w, x, h, z, seed) {
  const trunk = 6 + Math.floor(hash(x, z, seed + 23) * 3.99);
  let y = h + 2;
  for (const r of [2, 1, 2, 1, 1, 0, 0]) {
    if (r > 0) { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (!(r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2)) put(w, x + dx, y, z + dz, B.spruceLeaves); }
    else put(w, x, y, z, B.spruceLeaves);
    y++;
    if (y > h + trunk + 1) break;
  }
  put(w, x, h + trunk + 1, z, B.spruceLeaves);
  for (let yy = h; yy < h + trunk; yy++) w.set(x, yy, z, B.spruceLog);
}
function palm(w, x, h, z, seed) {
  const trunk = 5 + Math.floor(hash(x, z, seed + 24) * 2.99);
  for (let y = h; y < h + trunk; y++) w.set(x, y, z, B.palmLog);
  const top = h + trunk;
  put(w, x, top, z, B.palmLeaves);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { put(w, x + dx, top, z + dz, B.palmLeaves); put(w, x + dx * 2, top, z + dz * 2, B.palmLeaves); put(w, x + dx * 3, top - 1, z + dz * 3, B.palmLeaves); }
  for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { put(w, x + dx, top, z + dz, B.palmLeaves); put(w, x + dx * 2, top - 1, z + dz * 2, B.palmLeaves); }
}
function plantTrees(w, heights, seed, spawn) {
  const n = w.n, trunks = new Uint8Array(n * n);
  for (let z = 3; z < n - 3; z++) for (let x = 3; x < n - 3; x++) {
    const i = z * n + x, h = heights[i];
    if (h >= H - 12 || w.get(x, h, z) !== 0) continue;
    const top = w.get(x, h - 1, z), b = w.bio[i];
    const near = Math.abs(x - spawn[0]) <= 3 && Math.abs(z - spawn[1]) <= 3;
    const r = hash(x, z, seed + 7), r2 = hash(x, z, seed + 13), r3 = hash(x, z, seed + 17);
    let kind = 0;
    if (b === BI.forest && top === B.grass) { if (r < 0.065) kind = r2 < 0.3 ? 2 : 1; }
    else if (b === BI.plain && top === B.grass) { if (r < 0.007) kind = 1; }
    else if (b === BI.hill && top === B.grass) { if (r < 0.022) kind = r2 < 0.5 ? 3 : 1; }
    else if (b === BI.mountain && (top === B.grass || top === B.snowyGrass)) { if (r < 0.04) kind = 3; }
    else if (b === BI.beach && top === B.sand) { if (r < 0.012) kind = 4; }
    else if (b === BI.oasis) { if (r < 0.06 && (top === B.sand || top === B.grass)) kind = 4; }
    else if (b === BI.desert && top === B.sand) { if (r < 0.005) kind = 5; else if (r < 0.013) w.set(x, h, z, B.deadBush); }
    if (kind && !near) {
      let crowded = false;
      for (let dz = -2; dz <= 2 && !crowded; dz++) for (let dx = -2; dx <= 2; dx++) if (trunks[(z + dz) * n + x + dx]) { crowded = true; break; }
      if (!crowded) {
        trunks[i] = 1;
        if (kind === 1) oak(w, x, h, z, seed); else if (kind === 2) birch(w, x, h, z, seed); else if (kind === 3) spruce(w, x, h, z, seed);
        else if (kind === 4) palm(w, x, h, z, seed); else { const tall = 2 + Math.floor(hash(x, z, seed + 25) * 1.99); for (let y = h; y < h + tall; y++) w.set(x, y, z, B.cactus); }
        continue;
      }
    }
    if (top === B.grass) {
      let g = 0.05, f = 0;
      if (b === BI.plain) { g = 0.22; f = 0.05; } else if (b === BI.forest) { g = 0.12; f = 0.02; } else if (b === BI.hill) { g = 0.1; f = 0.015; } else if (b === BI.mountain) g = 0.06;
      if (r3 < g) w.set(x, h, z, B.tallGrass); else if (r3 < g + f) w.set(x, h, z, r2 < 0.5 ? B.redFlower : B.yellowFlower);
    }
  }
}


// ---------- sea life: coral reefs in warm seas, kelp forests in cool ones, seagrass in the shallows ----------
function seaLife(w, heights, seed) {
  const n = w.n;
  for (let z = 2; z < n - 2; z++) for (let x = 2; x < n - 2; x++) {
    const i = z * n + x, b = w.bio[i];
    if (!isWaterBiome(b)) continue;
    const h = heights[i];
    if (w.get(x, h, z) !== B.water || !SOLID[w.get(x, h - 1, z)]) continue;
    const depth = WL - h;
    if (depth < 1) continue;
    const floor = w.get(x, h - 1, z);
    const warm = z > n * 0.5, sea = b === BI.ocean || b === BI.sea;
    const r = hash(x, z, seed + 90), r2 = hash(x, z, seed + 91);
    if (sea && warm && depth >= 2 && depth <= 13 && vnoise(x, z, 9, seed + 92) > 0.55) {
      if (r < 0.5) {
        const kind = [B.brainCoral, B.tubeCoral, B.fireCoral][Math.min(2, Math.floor(vnoise(x, z, 4, seed + 93) * 3))];
        const tall = 1 + Math.floor(r2 * Math.min(3, depth - 1));
        let y = h;
        for (; y < h + tall && y < WL - 1; y++) w.set(x, y, z, kind);
        if (y < WL - 1 && hash(x, z, seed + 94) < 0.45) w.set(x, y, z, hash(x, z, seed + 95) < 0.5 ? B.purpleFan : B.yellowFan);
      } else if (r < 0.7) w.set(x, h, z, hash(x, z, seed + 96) < 0.5 ? B.purpleFan : B.yellowFan);
      else if (r < 0.82) w.set(x, h, z, B.seagrass);
      continue;
    }
    if (sea && !warm && depth >= 4 && vnoise(x, z, 7, seed + 97) > 0.52 && r < 0.22) {
      const top = Math.min(h + 2 + Math.floor(r2 * (depth - 2)), WL - 1);
      for (let y = h; y < top; y++) w.set(x, y, z, B.kelp);
      continue;
    }
    if (sea && depth >= 7 && r < 0.012) { w.set(x, h, z, B.sponge); continue; }
    if ((floor === B.sand || floor === B.gravel || floor === B.clay) && depth <= 9 && r < (sea ? 0.1 : 0.16)) w.set(x, h, z, B.seagrass);
  }
}

// ---------- the hidden canyon near Angkor, with a waterfall (the tunnel from Atlantis comes out here) ----------
/// For each column, how far (in blocks) it is to the nearest column on the other side of the shoreline.
function shoreDistance(bio, n) {
  const d = new Float32Array(n * n), INF = 1e6, S = Math.SQRT2;
  const wetAt = (i) => isWaterBiome(bio[i]);
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const i = z * n + x, me = wetAt(i);
    let edge = false;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < n && zz < n && wetAt(zz * n + xx) !== me) { edge = true; break; } }
    d[i] = edge ? 1 : INF;
  }
  // Two sweeps (a chamfer distance). Water only measures through water and land through land.
  const pass = (z, x, dx, dz, w) => { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= n || zz >= n) return INF; const j = zz * n + xx; return wetAt(j) === wetAt(z * n + x) ? d[j] + w : INF; };
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) { const i = z * n + x; d[i] = Math.min(d[i], pass(z, x, -1, 0, 1), pass(z, x, 0, -1, 1), pass(z, x, -1, -1, S), pass(z, x, 1, -1, S)); }
  for (let z = n - 1; z >= 0; z--) for (let x = n - 1; x >= 0; x--) { const i = z * n + x; d[i] = Math.min(d[i], pass(z, x, 1, 0, 1), pass(z, x, 0, 1, 1), pass(z, x, 1, 1, S), pass(z, x, -1, 1, S)); }
  return d;
}

function canyonPlan(n) {
  const ax = Math.floor(66.3 * BPT), az = Math.floor(65.3 * BPT);           // Angkor Wat
  const head = Math.min(ax - 32, n - 30), mouth = head - 30, zc = az + 12;  // waterfall end, river mouth, middle line
  const top = WL + 17;
  const midZ = (x) => zc + Math.round(Math.sin((x - mouth) * 0.17) * 2.2);
  // The river steps down three times on its way from the falls to the lake, where it meets the lake's own level.
  const floorY = (x) => WL + Math.round(Math.max(0, Math.min(1, (x - mouth) / (head - mouth))) * 3);
  return { ax, az, head, mouth, zc, top, midZ, floorY, rect: [mouth - 6, zc - 18, head + 12, zc + 18] };
}
function sculptCanyon(heights, bio, n, cp, seed) {
  const banded = new Uint8Array(n * n);
  const [rx0, rz0, rx1, rz1] = cp.rect;
  for (let z = rz0 - 10; z <= rz1 + 10; z++) for (let x = rx0 - 10; x <= rx1 + 10; x++) {
    if (x < 2 || z < 2 || x >= n - 2 || z >= n - 2) continue;
    const i = z * n + x;
    if (isWaterBiome(bio[i])) continue;
    // A raised plateau of rock…
    const d = Math.max(rx0 - x, 0, x - rx1, rz0 - z, 0, z - rz1);
    const lift = d === 0 ? 1 : Math.max(0, 1 - d / 10);
    const plateau = Math.round(cp.top - 1 + vnoise(x, z, 6, seed + 48) * 3);
    let h = Math.round(heights[i] + (plateau - heights[i]) * (lift * lift * (3 - 2 * lift)));
    if (h > heights[i]) { heights[i] = h; banded[i] = 1; }
    // …with the canyon cut down through it.
    if (x >= cp.mouth - 4 && x <= cp.head) {
      const off = Math.abs(z - cp.midZ(x)), fy = cp.floorY(x);
      const wall = 3.5 + Math.max(0, (x - cp.mouth) / (cp.head - cp.mouth)) * 1.5;
      if (off <= wall) heights[i] = fy;
      else if (off <= wall + 3) heights[i] = Math.min(heights[i], fy + Math.round((off - wall) * (off - wall) * 1.6));
    }
  }
  return banded;
}
/// The river along the canyon floor, a plunge pool, and a stream that falls over the end of the canyon as a waterfall.
/// Returns the cells the water simulation should look at first.
function canyonWater(w, heights, cp) {
  const wake = [];
  const n = w.n;
  for (let x = cp.mouth - 4; x <= cp.head; x++) {
    const mz = cp.midZ(x), fy = cp.floorY(x);
    for (let z = mz - 1; z <= mz + 1; z++) {
      if (!w.inb(x, z) || heights[z * n + x] > fy) continue;
      w.set(x, fy - 1, z, B.water);
      w.set(x, fy - 2, z, B.gravel);
    }
  }
  // The plunge pool under the falls.
  const px = cp.head - 4, pz = cp.midZ(cp.head), py = cp.floorY(cp.head);
  for (let z = pz - 5; z <= pz + 5; z++) for (let x = px - 5; x <= cp.head; x++) {
    const d = Math.hypot((x - px) / 1.2, z - pz);
    if (d > 4.2) continue;
    for (let y = py - 4; y < py; y++) w.set(x, y, z, B.water);
    w.set(x, py - 5, z, B.gravel);
    for (let y = py; y < py + 3; y++) if (w.get(x, y, z) !== 0 && !SOLID[w.get(x, y, z)]) w.set(x, y, z, 0);
  }
  // A spring on the plateau feeds a stream that pours over the edge. Its channel is level, with stone banks,
  // so the water only leaves it over the lip of the falls.
  const lip = cp.head + 1, top = heights[pz * n + lip], sz = pz;
  for (let x = lip; x <= lip + 10; x++) for (let z = sz - 2; z <= sz + 3; z++) {
    const bank = z === sz - 2 || z === sz + 3 || x === lip + 10;
    for (let y = top - 4; y < top - 1; y++) w.set(x, y, z, B.stone);
    w.set(x, top - 1, z, bank ? B.stone : B.water);
    if (bank) w.set(x, top, z, B.mossyCobble);
    for (let y = bank ? top + 1 : top; y < top + 4; y++) w.set(x, y, z, 0);
  }
  // The falling sheet of water, from the lip down to the pool.
  for (let z = sz - 1; z <= sz + 2; z++) {
    for (let y = py; y < top - 1; y++) w.set(cp.head, y, z, B.falling);
    for (let y = top - 1; y < top + 3; y++) w.set(cp.head, y, z, y === top - 1 ? B.falling : 0);
    wake.push([cp.head, top - 1, z], [lip, top - 1, z], [cp.head, py, z]);
  }
  return wake;
}

// ---------- the long tunnel from the Atlantis relic cave to the canyon ----------
function carveTunnel(w, atl, cp, seed) {
  const n = w.n, carved = new Set();
  const ex = cp.head - 10, ez = cp.midZ(ex) + 6, eFloor = cp.floorY(ex);
  const sx = atl.door[0], sz = atl.door[2], sFloor = atl.door[1];
  const c1 = [sx + (ex - sx) * 0.35, Math.max(sz, ez) + 22], c2 = [sx + (ex - sx) * 0.75, ez + 40];
  const at = (t) => {
    const u = 1 - t;
    return [u * u * u * sx + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * ex,
      u * u * u * sz + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * (ez + 4)];
  };
  // Measure the path so the floor can climb gently near the end.
  const pts = [];
  let len = 0, prev = at(0);
  for (let k = 0; k <= 4000; k++) { const p = at(k / 4000); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); pts.push([p[0], p[1], len]); prev = p; }
  const rise = 70;
  const carve = (x, y, z) => {
    if (!w.inb(x, z) || y < 3 || y >= H - 2) return;
    w.set(x, y, z, 0); w.protected.delete(w.idx(x, y, z)); carved.add(w.idx(x, y, z));
  };
  let lastCrystal = -99, side = 1;
  for (let k = 0; k < pts.length; k += 2) {
    const [px, pz, d] = pts[k];
    const wig = Math.sin(d * 0.09) * 2.5 + Math.sin(d * 0.031 + 1) * 3;
    const nx = pts[Math.min(k + 2, pts.length - 1)][0] - px, nz = pts[Math.min(k + 2, pts.length - 1)][1] - pz, l = Math.hypot(nx, nz) || 1;
    const qx = px - nz / l * wig, qz = pz + nx / l * wig;
    const toEnd = len - d;
    let fy = toEnd < rise ? Math.round(sFloor + (eFloor - sFloor) * (1 - toEnd / rise)) : sFloor;
    if (d < 6) fy = sFloor;
    const room = (Math.abs(d - len * 0.36) < 7 || Math.abs(d - len * 0.68) < 7) ? 2.6 : 0;
    const rad = 1.4 + room, tall = 4 + Math.round(room);
    for (let dz = -Math.ceil(rad); dz <= Math.ceil(rad); dz++) for (let dx = -Math.ceil(rad); dx <= Math.ceil(rad); dx++) {
      if (dx * dx + dz * dz > rad * rad) continue;
      const x = Math.round(qx + dx), z = Math.round(qz + dz);
      for (let y = fy; y < fy + tall; y++) carve(x, y, z);
      const under = w.get(x, fy - 1, z);
      if (!SOLID[under] || WATERY[under]) w.set(x, fy - 1, z, B.stone);
      if (d < 50) w.set(x, fy - 1, z, (x + z) % 2 ? B.atlStone : B.blackMarble);
    }
    // Atlantean crystals light the way.
    if (d - lastCrystal > 11) {
      lastCrystal = d; side = -side;
      const cx = Math.round(qx - nz / l * (rad + 1) * side), cz = Math.round(qz + nx / l * (rad + 1) * side);
      w.set(cx, fy + 2, cz, B.crystal); w.protected.delete(w.idx(cx, fy + 2, cz));
    }
  }
  // Seal the tunnel off from any sea or lake above or beside it.
  const seal = [];
  for (const i of carved) {
    const x = i % n, z = Math.floor(i / n) % n, y = Math.floor(i / (n * n));
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const b = w.get(x + dx, y + dy, z + dz);
      if (WATERY[b] && y + dy < WL + 1) seal.push([x + dx, y + dy, z + dz]);
    }
  }
  for (const [x, y, z] of seal) w.set(x, y, z, B.atlStone);
  // Open the end into the canyon floor.
  for (let z = ez; z <= ez + 5; z++) for (let x = ex - 1; x <= ex + 1; x++) for (let y = eFloor; y < eFloor + 4; y++) if (!WATERY[w.get(x, y, z)]) carve(x, y, z);
  return { exit: [ex + 0.5, eFloor, ez + 0.5], length: Math.round(len) };
}

// ---------- historic sites ----------
const SITES = [
  { id: 'rome', tile: [17.3, 17.3], fp: [-30, -12, 14, 12] },
  { id: 'athens', tile: [23.3, 26.3], fp: [-16, -9, 14, 9] },
  { id: 'giza', tile: [42.0, 26.7], fp: [-27, -11, 11, 27] },
  { id: 'alexandria', tile: [34.7, 28.7], fp: [-8, -18, 9, 8] },
  { id: 'babylon', tile: [36.0, 38.3], fp: [-9, -8, 9, 26] },
  { id: 'persepolis', tile: [34.3, 55.3], fp: [-13, -10, 11, 10] },
  { id: 'mohenjoDaro', tile: [50.3, 51.3], fp: [-11, -16, 11, 14] },
  { id: 'teotihuacan', tile: [55.4, 5.2], fp: [-19, -27, 10, 18], fixed: true },
  { id: 'greatWall', tile: [17.3, 66.3], fp: [-70, -7, 70, 7], fixed: true },
  { id: 'angkor', tile: [65.3, 66.3], fp: [-19, -19, 19, 19], fixed: true },
  { id: 'atlantis', tile: [73.3, 5.4], fp: [-20, -20, 20, 20], fixed: true },
  // Oct 22: Jerusalem's Second Temple, Carthage's harbour, the Forbidden City and the capitals of the Three Kingdoms.
  // (Added at the end so the older sites keep their numbers in saved games.)
  { id: 'jerusalem', tile: [26.5, 37.0], fp: [-16, -12, 16, 12] },
  { id: 'carthage', tile: [33.5, 18.0], fp: [-13, -13, 13, 20] },
  { id: 'forbiddenCity', tile: [21.5, 66.0], fp: [-24, -18, 24, 18] },
  { id: 'wei', tile: [28.5, 62.0], fp: [-13, -11, 13, 11] },
  { id: 'shu', tile: [36.0, 63.0], fp: [-13, -11, 13, 11] },
  { id: 'wu', tile: [32.0, 72.0], fp: [-13, -11, 13, 11] },
  { id: 'olympia', tile: [25.2, 19.8], fp: [-22, -15, 22, 15] },   // Oct 24: added last, so every other site stays where it was
];
const overlaps = (a, b, m) => a[0] - m <= b[2] && b[0] <= a[2] + m && a[1] - m <= b[3] && b[1] <= a[3] + m;
const rectDist = (r, px, pz) => Math.max(Math.max(r[0] - px, 0, px - (r[2] + 1)), Math.max(r[1] - pz, 0, pz - (r[3] + 1)));

class Stamper {
  constructor(w) { this.w = w; this.site = 0; this.pharos = null; }
  put(x, y, z, b) { const w = this.w; if (!w.inb(x, z) || y < 1 || y >= H) return; w.set(x, y, z, b); const i = w.idx(x, y, z); if (b === 0 || b === B.water) w.protected.delete(i); else w.protected.set(i, this.site); }
  raw(x, y, z, b) { if (!this.w.inb(x, z) || y < 1 || y >= H) return; this.w.set(x, y, z, b); }
  fill(x0, y0, z0, x1, y1, z1, b) { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) this.put(x, y, z, b); }
  isTerrain(b) { return SOLID[b] && ![B.oakLeaves, B.birchLeaves, B.spruceLeaves, B.palmLeaves, B.oakLog, B.birchLog, B.spruceLog, B.palmLog, B.cactus].includes(b); }
  ground(x, z) { if (!this.w.inb(x, z)) return WL; for (let y = H - 1; y > 0; y--) if (this.isTerrain(this.w.get(x, y, z))) return y + 1; return 1; }
  level(r, minY) {
    const hs = [];
    for (let z = r[1]; z <= r[3]; z += 3) for (let x = r[0]; x <= r[2]; x += 3) hs.push(this.w.hasWater(x, z) ? WL + 1 : this.ground(x, z));
    hs.sort((a, b) => a - b);
    const mid = hs.length ? hs[hs.length >> 1] : WL + 1;
    return Math.min(Math.max(mid, minY), WL + 15);
  }
  flatten(r, gy, top, blend = 4) {
    const w = this.w;
    for (let z = r[1] - blend; z <= r[3] + blend; z++) for (let x = r[0] - blend; x <= r[2] + blend; x++) {
      if (x < 1 || z < 1 || x >= w.n - 1 || z >= w.n - 1) continue;
      const d = Math.max(r[0] - x, 0, x - r[2], r[1] - z, 0, z - r[3]);
      const nat = this.ground(x, z);
      let target = gy;
      if (d > 0) { const t = d / (blend + 1); target = Math.round(gy * (1 - t) + nat * t); }
      target = Math.min(Math.max(target, 2), H - 6);
      for (let y = 1; y < target - 1; y++) if (!SOLID[w.get(x, y, z)]) this.raw(x, y, z, B.dirt);
      const b = BIOMES[w.biome(x, z)];
      let surface = top;
      if (d > 0) surface = target - 1 < WL ? B.sand : (b === 'desert' || b === 'beach' || b === 'oasis') ? B.sand : B.grass;
      this.raw(x, target - 1, z, surface);
      for (let y = target; y < H; y++) { if (d > 0 && y < WL) { this.raw(x, y, z, B.water); continue; } if (w.get(x, y, z) !== 0) this.raw(x, y, z, 0); w.protected.delete(w.idx(x, y, z)); }
    }
  }
  pyramid(px, pz, half, gy, outer, inner, capFrom = null, cap = B.limestone) {
    for (let k = 0; k <= half; k++) { const r = half - k; for (let z = pz - r; z <= pz + r; z++) for (let x = px - r; x <= px + r; x++) { const edge = Math.abs(x - px) === r || Math.abs(z - pz) === r; let b = edge ? outer : inner; if (capFrom !== null && k >= capFrom && edge) b = cap; this.put(x, gy + k, z, b); } }
  }
  stepped(cx, cz, gy, halves, tierH, outer, inner) {
    halves.forEach((h, t) => { for (let y = gy + t * tierH; y < gy + (t + 1) * tierH; y++) for (let z = cz - h; z <= cz + h; z++) for (let x = cx - h; x <= cx + h; x++) this.put(x, y, z, Math.abs(x - cx) === h || Math.abs(z - cz) === h ? outer : inner); });
  }
  stairs(cx, cz, gy, half, height, dir, b, width = 1) {
    const perp = [Math.abs(dir[1]), Math.abs(dir[0])];
    for (let j = 0; j < height; j++) { const ax = cx + dir[0] * (half - j), az = cz + dir[1] * (half - j); for (let k = -width; k <= width; k++) { const x = ax + perp[0] * k, z = az + perp[1] * k; this.fill(x, gy, z, x, gy + j, z, b); for (let y = gy + j + 1; y <= gy + height + 2; y++) this.put(x, y, z, 0); } }
  }
  temple(cx, cz, p, hx, hz, colH, door, ruined = false) {
    this.fill(cx - hx, p, cz - hz, cx + hx, p, cz + hz, B.marble);
    for (let z = cz - hz; z <= cz + hz; z++) for (let x = cx - hx; x <= cx + hx; x++) {
      if (!(Math.abs(x - cx) === hx || Math.abs(z - cz) === hz)) continue;
      let h = colH;
      if (ruined) { const r = hash(x, z, 4451); if (r < 0.25) continue; h = 1 + Math.floor(r * 997) % colH; }
      this.fill(x, p + 1, z, x, p + h, z, B.column);
    }
    if (ruined) return;
    const ix = hx - 2, iz = hz - 2;
    if (ix >= 1 && iz >= 1) {
      for (let z = cz - iz; z <= cz + iz; z++) for (let x = cx - ix; x <= cx + ix; x++) if (Math.abs(x - cx) === ix || Math.abs(z - cz) === iz) this.fill(x, p + 1, z, x, p + colH, z, B.marble);
      const dx = cx + door[0] * ix, dz = cz + door[1] * iz;
      this.fill(dx, p + 1, dz, dx, p + 2, dz, 0);
    }
    this.fill(cx - hx, p + colH + 1, cz - hz, cx + hx, p + colH + 1, cz + hz, B.marble);
    for (let k = 1; hz - k >= 0; k++) this.fill(cx - hx, p + colH + 1 + k, cz - hz + k, cx + hx, p + colH + 1 + k, cz + hz - k, B.marble);
  }
  cost(r, water, river, land) {
    let c = 0;
    for (let z = r[1]; z <= r[3]; z += 2) for (let x = r[0]; x <= r[2]; x += 2) { const b = BIOMES[this.w.biome(x, z)]; if (b === 'river') c += river; else if (['ocean', 'sea', 'lake'].includes(b)) c += water; else c += land; if (b === 'mountain') c += 0.6; }
    return c;
  }
  choose(site, avoid) {
    const pref = [Math.floor(site.tile[1] * BPT), Math.floor(site.tile[0] * BPT)];
    let best = pref, bestScore = Infinity;
    for (let oz = -40; oz <= 40; oz += 4) for (let ox = -40; ox <= 40; ox += 4) {
      const ax = pref[0] + ox, az = pref[1] + oz, f = site.fp;
      const r = [ax + f[0], az + f[1], ax + f[2], az + f[3]];
      if (r[0] < 4 || r[1] < 4 || r[2] >= this.w.n - 5 || r[3] >= this.w.n - 5) continue;
      if (avoid.some((a) => overlaps(a, r, 14))) continue;
      let score = (Math.abs(ox) + Math.abs(oz)) * 0.35;
      if (site.id === 'alexandria') score += this.cost([ax - 8, az - 5, ax + 9, az + 8], 4, 14, 0) + this.cost([ax - 5, az - 17, ax + 5, az - 8], 0, 14, 3);
      else score += this.cost(r, 3, 14, 0);
      if (score < bestScore) { bestScore = score; best = [ax, az]; }
    }
    return best;
  }

  giza(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.sand);
    this.pyramid(cx, cz, 8, gy, B.limestone, B.sandstone);
    this.pyramid(cx - 11, cz + 11, 6, gy, B.sandstone, B.sandstone, 4);
    this.pyramid(cx - 20, cz + 19, 4, gy, B.sandstone, B.sandstone);
    for (let z = cz - 6; z <= cz - 4; z++) this.put(cx, gy + 2, z, 0);
    this.put(cx, gy + 3, cz - 6, 0);
    const sx = cx + 3, sz = cz + 13;
    this.fill(sx - 6, gy, sz - 1, sx, gy + 1, sz + 1, B.sandstone);
    this.fill(sx + 1, gy, sz - 1, sx + 3, gy, sz - 1, B.sandstone);
    this.fill(sx + 1, gy, sz + 1, sx + 3, gy, sz + 1, B.sandstone);
    this.fill(sx - 1, gy + 2, sz - 1, sx, gy + 3, sz + 1, B.sandstone);
    this.put(sx + 1, gy + 3, sz, B.sandstone);
    this.fill(sx - 1, gy + 4, sz - 1, sx - 1, gy + 4, sz + 1, B.limestone);
    return gy;
  }
  babylon(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.sand);
    // Etemenanki, the great ziggurat (perhaps the Tower of Babel story): four tiers and a blue shrine on top.
    this.stepped(cx, cz, gy, [8, 6, 4, 2], 3, B.mudBrick, B.mudBrick);
    this.fill(cx - 1, gy + 12, cz - 1, cx + 1, gy + 14, cz + 1, B.blueTile);
    this.fill(cx, gy + 12, cz, cx, gy + 13, cz + 1, 0);
    this.put(cx, gy + 15, cz, B.goldBlock);
    this.stairs(cx, cz, gy, 8, 11, [0, 1], B.brick);
    const gz = cz + 13;
    this.fill(cx - 7, gy, gz, cx + 7, gy + 6, gz + 1, B.blueTile);
    for (let x = cx - 7; x <= cx + 7; x += 2) { this.put(x, gy + 7, gz, B.blueTile); this.put(x, gy + 7, gz + 1, B.blueTile); }
    for (const tx of [cx - 4, cx + 3]) { this.fill(tx, gy, gz - 1, tx + 1, gy + 8, gz + 2, B.blueTile); for (const [dx, dz] of [[0, -1], [1, -1], [0, 2], [1, 2]]) this.put(tx + dx, gy + 9, gz + dz, B.blueTile); }
    this.fill(cx - 1, gy, gz - 1, cx + 1, gy + 3, gz + 2, 0);
    this.fill(cx, gy + 4, gz - 1, cx, gy + 4, gz + 2, 0);
    this.put(cx - 2, gy + 5, gz + 1, B.goldBlock); this.put(cx + 2, gy + 5, gz + 1, B.goldBlock);
    this.fill(cx - 1, gy - 1, gz + 2, cx + 1, gy - 1, gz + 12, B.brick);
    this.fill(cx - 3, gy, gz + 3, cx - 3, gy + 1, gz + 12, B.blueTile);
    this.fill(cx + 3, gy, gz + 3, cx + 3, gy + 1, gz + 12, B.blueTile);
    return gy;
  }
  athens(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.grass);
    this.fill(cx - 12, gy, cz - 7, cx + 12, gy + 2, cz + 7, B.stone);
    this.fill(cx - 13, gy, cz - 1, cx - 13, gy + 1, cz + 1, B.stone);
    this.fill(cx - 14, gy, cz - 1, cx - 14, gy, cz + 1, B.stone);
    const p = gy + 3;
    this.temple(cx, cz, p, 7, 3, 4, [1, 0]);
    this.put(cx - 3, p + 1, cz, B.marble); this.put(cx - 3, p + 2, cz, B.goldBlock); this.put(cx - 3, p + 3, cz, B.limestone);
    oak(this.w, cx + 10, p, cz + 5, 99);
    return gy;
  }
  rome(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.grass);
    for (let dz = -10; dz <= 10; dz++) for (let dx = -13; dx <= 13; dx++) {
      const eo = (dx / 12.5) ** 2 + (dz / 9.5) ** 2, x = cx + dx, z = cz + dz;
      if (eo > 1) { if (eo < 1.4) this.put(x, gy - 1, z, B.gravel); continue; }
      const ei = (dx / 6.5) ** 2 + (dz / 3.5) ** 2;
      if (ei <= 1) { this.put(x, gy - 1, z, B.sand); continue; }
      const a = Math.sqrt(ei), b = Math.sqrt(eo), t = Math.min(Math.max((a - 1) * b / Math.max(a - b, 0.001), 0), 1);
      if (eo > 0.82) {
        const h = dz > 2 && dx > 2 ? 6 : 9;
        this.fill(x, gy, z, x, gy + h - 1, z, B.limestone);
        if (eo > 0.92) { const k = Math.floor((Math.atan2(dz / 9.5, dx / 12.5) + Math.PI) / (2 * Math.PI) * 44); if (k % 2 === 0) for (const y of [gy, gy + 1, gy + 3, gy + 4, gy + 6]) if (y < gy + h - 1) this.put(x, y, z, 0); }
      } else { const h = 1 + Math.floor(t * 6); this.fill(x, gy, z, x, gy + h - 2, z, B.limestone); this.put(x, gy + h - 1, z, B.stoneBricks); }
    }
    for (let dx = -13; dx <= 13; dx++) if (Math.abs(dx) > 6) this.fill(cx + dx, gy, cz, cx + dx, gy + 1, cz, 0);
    for (let dz = -10; dz <= 10; dz++) if (Math.abs(dz) > 3) this.fill(cx, gy, cz + dz, cx, gy + 1, cz + dz, 0);
    this.fill(cx - 30, gy - 1, cz - 1, cx - 14, gy - 1, cz + 1, B.cobblestone);
    this.fill(cx - 30, gy - 1, cz - 2, cx - 14, gy - 1, cz - 2, B.stoneBricks);
    this.fill(cx - 30, gy - 1, cz + 2, cx - 14, gy - 1, cz + 2, B.stoneBricks);
    return gy;
  }
  alexandria(cx, cz) {
    const lib = [cx - 8, cz - 5, cx + 9, cz + 8];
    const gy = this.level(lib, WL + 1); this.flatten(lib, gy, B.sand);
    const ly = WL + 1;
    this.flatten([cx - 5, cz - 17, cx + 5, cz - 8], ly, B.sand, 2);
    this.flatten([cx - 1, cz - 7, cx + 1, cz - 6], Math.max(ly, Math.min(gy, ly + 1)), B.gravel, 1);
    const lz = cz - 12;
    this.fill(cx - 3, ly, lz - 3, cx + 3, ly + 9, lz + 3, B.limestone);
    this.fill(cx, ly, lz + 3, cx, ly + 1, lz + 3, 0);
    for (const [x, z] of [[cx - 3, lz], [cx + 3, lz], [cx, lz - 3], [cx, lz + 3]]) this.put(x, ly + 5, z, 0);
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) this.put(cx + dx, ly + 10, lz + dz, B.goldBlock);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (!(Math.abs(dx) === 2 && Math.abs(dz) === 2)) this.fill(cx + dx, ly + 10, lz + dz, cx + dx, ly + 15, lz + dz, B.limestone);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!(Math.abs(dx) === 1 && Math.abs(dz) === 1)) this.fill(cx + dx, ly + 16, lz + dz, cx + dx, ly + 18, lz + dz, B.limestone);
    this.put(cx, ly + 19, lz, B.lamp);
    this.temple(cx, cz + 1, gy, 5, 3, 3, [0, 1]);
    this.put(cx - 2, gy + 1, cz + 1, B.planks); this.put(cx - 2, gy + 2, cz + 1, B.planks);
    this.put(cx + 2, gy + 1, cz + 1, B.planks); this.put(cx + 2, gy + 2, cz + 1, B.planks);
    return gy;
  }
  mohenjoDaro(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.sand);
    this.fill(cx - 10, gy - 1, cz, cx + 10, gy - 1, cz + 13, B.brick);
    this.fill(cx - 10, gy - 1, cz + 7, cx + 10, gy - 1, cz + 7, B.stoneBricks);
    [cx - 10, cx - 3, cx + 4].forEach((x0, i) => [cz + 1, cz + 8].forEach((z0, j) => {
      const tall = (i + j) % 3 === 0 ? 4 : 3;
      for (let z = z0; z <= z0 + 4; z++) for (let x = x0; x <= x0 + 4; x++) if (x === x0 || x === x0 + 4 || z === z0 || z === z0 + 4) this.fill(x, gy, z, x, gy + tall - 1, z, B.brick);
      const dz = j === 0 ? z0 + 4 : z0;
      this.fill(x0 + 2, gy, dz, x0 + 2, gy + 1, dz, 0);
      this.put(x0 + 4, gy + 1, z0 + 2, 0);
      if (i === 1 && j === 1) this.put(x0 + 2, gy - 1, z0 + 2, B.water);
    }));
    this.fill(cx - 6, gy, cz - 15, cx + 6, gy + 1, cz - 3, B.brick);
    this.fill(cx - 3, gy - 1, cz - 11, cx + 3, gy - 1, cz - 7, B.brick);
    this.fill(cx - 3, gy, cz - 11, cx + 3, gy + 1, cz - 7, B.water);
    this.fill(cx - 1, gy, cz - 11, cx + 1, gy, cz - 11, B.brick);
    this.fill(cx - 1, gy, cz - 7, cx + 1, gy, cz - 7, B.brick);
    for (let z = cz - 13; z <= cz - 5; z++) for (let x = cx - 5; x <= cx + 5; x++) if ((x === cx - 5 || x === cx + 5 || z === cz - 13 || z === cz - 5) && (x + z) % 3 !== 0) this.put(x, gy + 2, z, B.brick);
    this.fill(cx - 1, gy, cz - 2, cx + 1, gy, cz - 2, B.brick);
    return gy;
  }
  persepolis(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.gravel);
    this.fill(cx - 10, gy, cz - 8, cx + 10, gy + 2, cz + 8, B.stoneBricks);
    this.fill(cx - 10, gy + 1, cz - 8, cx - 10, gy + 1, cz + 8, B.carvedStone);
    const p = gy + 3;
    for (const [z0, z1] of [[-4, -2], [2, 4]]) { this.fill(cx - 11, gy, cz + z0, cx - 11, gy + 1, cz + z1, B.stoneBricks); this.fill(cx - 12, gy, cz + z0, cx - 12, gy, cz + z1, B.stoneBricks); }
    this.fill(cx - 8, p, cz - 2, cx - 8, p + 5, cz - 2, B.stoneBricks);
    this.fill(cx - 8, p, cz + 2, cx - 8, p + 5, cz + 2, B.stoneBricks);
    this.fill(cx - 8, p + 6, cz - 3, cx - 8, p + 6, cz + 3, B.carvedStone);
    this.fill(cx - 7, p, cz - 3, cx - 7, p + 1, cz - 3, B.carvedStone);
    this.fill(cx - 7, p, cz + 3, cx - 7, p + 1, cz + 3, B.carvedStone);
    for (const gz of [-6, -3, 0, 3, 6]) for (const gx of [-4, -1, 2, 5, 8]) {
      const rr = hash(gx, gz, 913), h = rr < 0.62 ? 6 : 1 + Math.floor(rr * 997) % 3;
      this.fill(cx + gx, p, cz + gz, cx + gx, p + h - 1, cz + gz, B.column);
      if (h === 6) this.fill(cx + gx - 1, p + 6, cz + gz, cx + gx + 1, p + 6, cz + gz, B.carvedStone);
    }
    return gy;
  }
  teotihuacan(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.grass);
    this.stepped(cx, cz, gy, [8, 6, 4, 2], 2, B.stone, B.cobblestone);
    this.fill(cx - 1, gy + 8, cz - 1, cx + 1, gy + 9, cz + 1, B.brick);
    this.fill(cx - 1, gy + 8, cz, cx, gy + 9, cz, 0);
    this.stairs(cx, cz, gy, 8, 7, [-1, 0], B.cobblestone);
    const mx = cx - 12, mz = cz - 20;
    this.stepped(mx, mz, gy, [5, 3, 1], 2, B.stone, B.cobblestone);
    this.stairs(mx, mz, gy, 5, 5, [0, 1], B.cobblestone);
    this.fill(cx - 13, gy - 1, cz - 14, cx - 11, gy - 1, cz + 17, B.gravel);
    for (let z = cz - 12; z <= cz + 15; z += 6) this.fill(cx - 17, gy, z - 1, cx - 15, gy + 1, z + 1, B.stone);
    return gy;
  }
  angkor(cx, cz, r) {
    const gy = Math.max(this.level(r, WL + 2), WL + 2); this.flatten(r, gy, B.grass);
    for (let dz = -17; dz <= 17; dz++) for (let dx = -17; dx <= 17; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) < 15) continue;
      const x = cx + dx, z = cz + dz;
      if (dx < 0 && Math.abs(dz) <= 1) continue;
      this.raw(x, WL - 4, z, B.sand);
      for (let y = WL - 3; y < WL; y++) this.raw(x, y, z, B.water);
      for (let y = WL; y < Math.min(gy + 12, H); y++) this.raw(x, y, z, 0);
    }
    this.fill(cx - 17, WL - 3, cz - 1, cx - 15, gy - 1, cz + 1, B.stoneBricks);
    for (let dz = -12; dz <= 12; dz++) for (let dx = -12; dx <= 12; dx++) if (Math.max(Math.abs(dx), Math.abs(dz)) === 12 && !(dx === -12 && Math.abs(dz) <= 1)) this.fill(cx + dx, gy, cz + dz, cx + dx, gy + 1, cz + dz, B.carvedStone);
    this.fill(cx - 12, gy, cz - 2, cx - 12, gy + 3, cz - 2, B.carvedStone);
    this.fill(cx - 12, gy, cz + 2, cx - 12, gy + 3, cz + 2, B.carvedStone);
    this.fill(cx - 12, gy + 2, cz - 1, cx - 12, gy + 3, cz + 1, B.carvedStone);
    this.fill(cx - 14, gy - 1, cz - 1, cx - 9, gy - 1, cz + 1, B.stoneBricks);
    this.stepped(cx, cz, gy, [8, 6, 4], 2, B.carvedStone, B.stone);
    this.stairs(cx, cz, gy, 8, 5, [-1, 0], B.stoneBricks);
    const top = gy + 6;
    this.fill(cx - 2, top, cz - 2, cx + 2, top + 1, cz + 2, B.carvedStone);
    this.fill(cx - 1, top + 2, cz - 1, cx + 1, top + 4, cz + 1, B.carvedStone);
    this.fill(cx, top + 5, cz, cx, top + 6, cz, B.carvedStone);
    this.fill(cx - 2, top, cz, cx - 2, top + 1, cz, 0);
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { this.fill(cx + dx - 1, top, cz + dz - 1, cx + dx + 1, top + 2, cz + dz + 1, B.carvedStone); this.fill(cx + dx, top + 3, cz + dz, cx + dx, top + 4, cz + dz, B.carvedStone); }
    return gy;
  }
  /// The Great Wall: a long frontier wall along the north of China, from the sea in the east (where the real wall runs
  /// into the sea at Shanhai Pass) far to the west, then turning south along the western edge, so the Forbidden City
  /// and the Three Kingdoms of Wei, Shu and Wu all lie inside it. Watchtowers every 18 blocks; you can walk along the top.
  greatWall(cx, cz) {
    const n = this.w.n, xW = Math.max(8, cx - 77), xE = n - 6, zS = Math.min(n - 10, cz + 255);
    const legs = [], line = [];
    for (let x = xE; x >= xW; x--) line.push([x, cz + Math.round(Math.sin((x - cx) * 0.07) * 4), 0]);                   // the north wall, east to west
    const zc = line[line.length - 1][1];
    for (let z = zc + 1; z <= zS; z++) line.push([xW + Math.round(Math.sin((z - zc) * 0.06) * 3), z, 1]);                // the west wall, north to south
    legs.push(line);
    // The top follows the hills, smoothed so it climbs and dips gently.
    const g0 = line.map(([x, z]) => Math.max(this.ground(x, z), WL + 1)), base = line.map((_, i) => { let s = 0, c = 0; for (let k = i - 3; k <= i + 3; k++) if (k >= 0 && k < line.length) { s += g0[k]; c++; } return Math.min(Math.floor(s / c), H - 12); });
    line.forEach(([x, z, west], i) => {
      const b = base[i];
      for (let t = 0; t <= 1; t++) {
        const xx = west ? x + t : x, zz = west ? z : z + t, ng = this.ground(xx, zz);
        this.fill(xx, Math.max(1, Math.min(ng, b) - 1), zz, xx, b + 3, zz, B.stoneBricks);
        for (let y = b + 4; y <= b + 11; y++) this.put(xx, y, zz, 0);
      }
      if (i % 2 === 0) this.put(x, b + 4, z, B.stoneBricks);                       // battlements on the outer (north / west) side
      if (i % 18 === 9 && Math.abs(x - cx) > 4) {
        for (let tz = z - 1; tz <= z + 2; tz++) for (let tx = x - 1; tx <= x + 2; tx++) this.fill(tx, Math.max(1, this.ground(tx, tz) - 1), tz, tx, b + 6, tz, B.stoneBricks);
        if (west) this.fill(x, b + 4, z - 1, x + 1, b + 5, z + 2, 0); else this.fill(x - 1, b + 4, z, x + 2, b + 5, z + 1, 0);
        for (const [tx, tz] of [[x - 1, z - 1], [x + 2, z - 1], [x - 1, z + 2], [x + 2, z + 2]]) this.put(tx, b + 7, tz, B.stoneBricks);
      }
    });
    // The main gate in the north wall, and a fortress gate in the west wall (like Jiayuguan, at the wall's western end).
    const gi = line.findIndex(([x, , w]) => !w && x === cx), gz = line[gi][1], gb = base[gi];
    for (let tz = gz - 1; tz <= gz + 2; tz++) for (let tx = cx - 2; tx <= cx + 2; tx++) this.fill(tx, Math.max(1, this.ground(tx, tz) - 1), tz, tx, gb + 6, tz, B.stoneBricks);
    this.fill(cx - 1, gb, gz - 1, cx + 1, gb + 2, gz + 2, 0);
    this.fill(cx - 2, gb + 4, gz, cx + 2, gb + 5, gz + 1, 0);
    const wi = line.findIndex(([, z, w]) => w && z === zc + 140);
    if (wi > 0) {
      const [fx, fz] = line[wi], fb = base[wi];
      for (let tz = fz - 3; tz <= fz + 3; tz++) for (let tx = fx - 2; tx <= fx + 3; tx++) this.fill(tx, Math.max(1, this.ground(tx, tz) - 1), tz, tx, fb + 7, tz, B.stoneBricks);
      this.fill(fx - 2, fb, fz - 1, fx + 3, fb + 2, fz + 1, 0);
      this.fill(fx - 1, fb + 8, fz - 2, fx + 2, fb + 9, fz + 2, B.greyRoof);
    }
    return gb;
  }
  /// Atlantis, as Plato described it: rings of land and sea around an island with Poseidon's temple, walls
  /// shining with orichalcum. Under the temple, a narrow shaft leads down to a cave holding three relics.
  atlantis(cx, cz) {
    const w = this.w;
    const rings = [[6, 'land'], [9, 'water'], [13, 'land'], [16, 'water'], [19.5, 'land']];
    for (let dz = -21; dz <= 21; dz++) for (let dx = -21; dx <= 21; dx++) {
      const d = Math.hypot(dx, dz), x = cx + dx, z = cz + dz;
      const ring = rings.find((r) => d <= r[0]);
      if (!ring) continue;
      if (ring[1] === 'land') {
        for (let y = 1; y < WL; y++) if (!SOLID[w.get(x, y, z)] || WATERY[w.get(x, y, z)]) this.raw(x, y, z, y < WL - 3 ? B.stone : B.sand);
        this.raw(x, WL, z, d <= 6 ? B.atlStone : (hash(x, z, 31) < 0.25 ? B.gravel : B.grass));
        for (let y = WL + 1; y < Math.min(WL + 22, H); y++) this.raw(x, y, z, 0);
      } else {
        for (let y = 1; y < WL - 4; y++) if (!SOLID[w.get(x, y, z)] || WATERY[w.get(x, y, z)]) this.raw(x, y, z, B.stone);
        this.raw(x, WL - 5, z, B.sand);
        for (let y = WL - 4; y < WL; y++) this.raw(x, y, z, B.water);
        for (let y = WL; y < Math.min(WL + 22, H); y++) this.raw(x, y, z, 0);
        if (hash(x, z, 33) < 0.18) this.raw(x, WL - 4, z, hash(x, z, 34) < 0.5 ? B.seagrass : B.purpleFan);
      }
    }
    // Walls on the rings: plain stone outside, orichalcum (ancient metal) on the inner ring, gold around the centre.
    for (let dz = -21; dz <= 21; dz++) for (let dx = -21; dx <= 21; dx++) {
      const d = Math.hypot(dx, dz), x = cx + dx, z = cz + dz;
      const gate = Math.abs(dx) <= 1 || Math.abs(dz) <= 1;
      if (gate) continue;
      if (d > 18.6 && d <= 19.5) this.fill(x, WL + 1, z, x, WL + 2, z, B.stoneBricks);
      else if (d > 12.2 && d <= 13) this.put(x, WL + 1, z, B.ancientBlock);
      else if (d > 5.3 && d <= 6) this.put(x, WL + 1, z, B.goldBlock);
    }
    // Bridges over the sea rings.
    for (const [ux, uz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 6; k <= 19; k++) for (let s2 = -1; s2 <= 1; s2++) {
      const x = cx + ux * k + uz * s2, z = cz + uz * k + ux * s2;
      this.put(x, WL, z, B.atlStone);
      if (Math.abs(s2) === 1 && k % 3 === 0) this.put(x, WL + 1, z, B.blackMarble);
    }
    // The temple of Poseidon: black marble, with a roof that has partly fallen in.
    const p = WL + 1;
    this.fill(cx - 4, p, cz - 3, cx + 4, p, cz + 3, B.blackMarble);
    for (let z = cz - 3; z <= cz + 3; z++) for (let x = cx - 4; x <= cx + 4; x++) {
      if (!(Math.abs(x - cx) === 4 || Math.abs(z - cz) === 3) || (x + z) % 2) continue;
      const r = hash(x, z, 4452), h = r < 0.3 ? 1 + Math.floor(r * 10) % 3 : 4;
      this.fill(x, p + 1, z, x, p + h, z, B.blackMarble);
    }
    for (let x = cx - 4; x <= cx + 4; x++) for (let z = cz - 3; z <= cz + 3; z++) if (hash(x, z, 4453) < 0.55 && (Math.abs(x - cx) >= 3 || Math.abs(z - cz) >= 2)) this.put(x, p + 5, z, (x + z) % 3 ? B.blackMarble : B.ancientBlock);
    // A gold statue of Poseidon behind the shaft.
    this.fill(cx - 2, p + 1, cz, cx - 2, p + 3, cz, B.goldBlock); this.put(cx - 2, p + 4, cz, B.ancientBlock);
    this.put(cx - 2, p + 3, cz - 1, B.goldBlock); this.put(cx - 2, p + 3, cz + 1, B.goldBlock);
    // Sunken ruins on the sea floor around the island, and ancient metal in the rock.
    for (let dz = -48; dz <= 48; dz++) for (let dx = -48; dx <= 48; dx++) {
      const d = Math.hypot(dx, dz), x = cx + dx, z = cz + dz;
      if (d <= 21 || d > 48 || !w.inb(x, z)) continue;
      let fy = WL - 1; while (fy > 2 && WATERY[w.get(x, fy, z)]) fy--;
      if (fy >= WL - 1) continue;
      const r = hash(x, z, 77);
      if (r < 0.012) { const h = 1 + Math.floor(hash(x, z, 78) * 3); for (let y = fy + 1; y <= Math.min(fy + h, WL - 2); y++) this.raw(x, y, z, B.blackMarble); }
      else if (r < 0.03) this.raw(x, fy + 1, z, B.atlStone);
      for (let y = Math.max(3, fy - 6); y <= fy; y++) if (SOLID[w.get(x, y, z)] && hash3(x, y, z, 79) < 0.035 * (1 - d / 60)) this.raw(x, y, z, B.ancientOre);
    }
    // The relic cave.
    const fy = 6, ry = 7, rr = 9.5;
    for (let dz = -12; dz <= 12; dz++) for (let dx = -12; dx <= 12; dx++) for (let dy = -1; dy <= ry + 2; dy++) {
      const x = cx + dx, z = cz + dz, y = fy + dy;
      const e = (dx / rr) ** 2 + (dz / rr) ** 2 + (Math.max(dy, 0) / ry) ** 2;
      if (dy >= 0 && e < 1) this.put(x, y, z, 0);
      else if (e < 1.45 || (dy === -1 && e < 1.6)) this.put(x, y, z, dy === -1 ? ((x + z) % 2 ? B.blackMarble : B.atlStone) : B.atlStone);
    }
    for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) this.fill(cx + dx, fy, cz + dz, cx + dx, fy + 6, cz + dz, B.blackMarble);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = cx + Math.round(Math.cos(a) * (rr + 0.4)), z = cz + Math.round(Math.sin(a) * (rr + 0.4)); this.put(x, fy + 3, z, B.crystal); }
    // Seams of ancient metal ore in the cave walls (you can mine these).
    for (let dz = -12; dz <= 12; dz++) for (let dx = -12; dx <= 12; dx++) for (let dy = 0; dy <= ry; dy++) {
      const x = cx + dx, z = cz + dz, y = fy + dy;
      if (w.get(x, y, z) === B.atlStone && hash3(x, y, z, 80) < 0.16) { this.raw(x, y, z, B.ancientOre); w.protected.delete(w.idx(x, y, z)); }
    }
    // Three pedestals for the relics.
    const relics = [];
    ['trident', 'lawTablet', 'seahorse'].forEach((id, k) => {
      const a = Math.PI / 2 + k * Math.PI * 2 / 3, x = cx + Math.round(Math.cos(a) * 4), z = cz + Math.round(Math.sin(a) * 4);
      this.put(x, fy, z, B.pedestal);
      relics.push({ id, x: x + 0.5, y: fy + 1, z: z + 0.5 });
    });
    // The narrow shaft: one block wide, black marble all round, a ladder all the way down.
    for (let y = fy; y <= p; y++) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) if (y > fy + ry - 1 || dx === 1 && dz === 0) this.put(cx + dx, y, cz + dz, B.blackMarble);
      this.put(cx, y, cz, B.ladder);
    }
    // The door out of the cave, to the east: the start of the long tunnel.
    for (let x = cx + 8; x <= cx + 12; x++) for (let z = cz - 1; z <= cz + 1; z++) for (let y = fy; y < fy + 3; y++) this.put(x, y, z, 0);
    this.put(cx + 9, fy + 3, cz, B.crystal);
    this.atl = { cx, cz, floorY: fy, relics, door: [cx + 12, fy, cz] };
    return p;
  }
  build(id, cx, cz, r) {
    switch (id) {
      case 'rome': return this.rome(cx, cz, r); case 'athens': return this.athens(cx, cz, r); case 'giza': return this.giza(cx, cz, r);
      case 'alexandria': return this.alexandria(cx, cz); case 'babylon': return this.babylon(cx, cz, r); case 'persepolis': return this.persepolis(cx, cz, r);
      case 'mohenjoDaro': return this.mohenjoDaro(cx, cz, r); case 'teotihuacan': return this.teotihuacan(cx, cz, r);
      case 'greatWall': return this.greatWall(cx, cz); case 'angkor': return this.angkor(cx, cz, r);
      case 'olympia': return this.olympia(cx, cz, r);
      case 'jerusalem': return this.jerusalem(cx, cz, r); case 'carthage': return this.carthage(cx, cz, r); case 'forbiddenCity': return this.forbiddenCity(cx, cz, r);
      case 'wei': case 'shu': case 'wu': return this.threeKingdoms(cx, cz, r, id);
      default: return this.atlantis(cx, cz);
    }
  }

  // ---------- cities ----------
  plotGround(r) {
    const hs = [];
    for (let z = r[1] - 1; z <= r[3] + 1; z++) for (let x = r[0] - 1; x <= r[2] + 1; x++) {
      if (this.w.hasWater(x, z) || isWaterBiome(this.w.biome(x, z))) return null;
      const g = this.ground(x, z);
      for (let y = g - 1; y <= g + 6; y++) if (this.w.protected.has(this.w.idx(x, Math.max(y, 0), z))) return null;
      hs.push(g);
    }
    hs.sort((a, b) => a - b);
    if (hs[hs.length - 1] - hs[0] > 5) return null;
    const gy = hs[hs.length >> 1];
    return gy > WL && gy < H - 16 ? gy : null;
  }
  house(x0, z0, size, gy, style, door, lamp) {
    const w = this.w, x1 = x0 + size - 1, z1 = z0 + size - 1, insula = size >= 7;
    let wall = B.limestone, floorB = B.planks, roof = B.brick, trim = null, flat = false, stilts = false, path = null;
    switch (style) {
      case 'roman': wall = insula ? B.brick : B.limestone; floorB = B.stoneBricks; roof = B.brick; path = B.cobblestone; trim = insula ? B.limestone : null; break;
      case 'greek': wall = B.limestone; floorB = B.limestone; roof = B.brick; path = B.gravel; break;
      case 'egyptian': wall = B.mudBrick; floorB = B.sand; roof = B.mudBrick; flat = true; break;
      case 'mesopotamian': wall = B.mudBrick; floorB = B.brick; roof = B.mudBrick; flat = true; trim = hash(x0, z0, 77) < 0.25 ? B.blueTile : null; break;
      case 'persian': wall = B.mudBrick; floorB = B.stoneBricks; roof = B.stoneBricks; flat = true; trim = B.carvedStone; break;
      case 'indus': wall = B.brick; floorB = B.brick; roof = B.brick; flat = true; path = B.brick; break;
      case 'mesoamerican': wall = B.limestone; floorB = B.stone; roof = B.limestone; flat = true; trim = B.brick; break;
      case 'khmer': wall = B.planks; floorB = B.planks; roof = B.planks; stilts = true; break;
    }
    for (let z = z0 - 1; z <= z1 + 1; z++) for (let x = x0 - 1; x <= x1 + 1; x++) {
      for (let y = 1; y < gy - 1; y++) if (!SOLID[w.get(x, y, z)]) this.raw(x, y, z, B.dirt);
      const edge = x < x0 || x > x1 || z < z0 || z > z1;
      if (edge) { let s = path; if (s === null) { const b = BIOMES[w.biome(x, z)]; s = b === 'desert' || b === 'beach' || b === 'oasis' ? B.sand : B.grass; } this.raw(x, gy - 1, z, s); }
      else this.put(x, gy - 1, z, stilts ? B.dirt : floorB);
      for (let y = gy; y < Math.min(gy + (insula ? 12 : 9), H); y++) if (w.get(x, y, z) !== 0) this.raw(x, y, z, 0);
    }
    const base = stilts ? gy + 2 : gy, wallH = insula ? 9 : 3;
    if (stilts) { for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [x0 + 2, z0], [x0 + 2, z1]]) this.fill(x, gy, z, x, gy + 1, z, B.oakLog); this.fill(x0, gy + 1, z0, x1, gy + 1, z1, B.planks); }
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      if (edge) this.fill(x, base, z, x, base + wallH - 1, z, wall);
      else if (insula) { this.put(x, base + 3, z, B.planks); this.put(x, base + 6, z, B.planks); }
    }
    if (trim !== null) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x === x0 || x === x1 || z === z0 || z === z1) this.put(x, base + wallH - 1, z, trim);
    const cx = x0 + (size >> 1), cz = z0 + (size >> 1);
    const dx = door[0] === 0 ? cx : (door[0] > 0 ? x1 : x0), dz = door[1] === 0 ? cz : (door[1] > 0 ? z1 : z0);
    this.put(dx, base, dz, 0); this.put(dx, base + 1, dz, 0);
    if (stilts) { this.put(dx + door[0], gy, dz + door[1], B.planks); this.put(dx + door[0] * 2, gy - 1, dz + door[1] * 2, B.planks); this.put(dx + door[0], gy + 1, dz + door[1], B.planks); this.put(dx + door[0], gy + 2, dz + door[1], 0); this.put(dx + door[0], gy + 3, dz + door[1], 0); }
    for (const s of insula ? [1, 4, 7] : [1]) for (const [wx, wz] of [[x0, cz], [x1, cz], [cx, z0], [cx, z1]]) {
      if (wx === dx && wz === dz && s === 1) continue;
      this.put(wx, base + s, wz, 0);
      if (insula && s > 1) { if (wx === x0 || wx === x1) { this.put(wx, base + s, wz - 2, 0); this.put(wx, base + s, wz + 2, 0); } else { this.put(wx - 2, base + s, wz, 0); this.put(wx + 2, base + s, wz, 0); } }
    }
    const top = base + wallH;
    if (flat || insula) { this.fill(x0, top, z0, x1, top, z1, roof); for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if ((x === x0 || x === x1 || z === z0 || z === z1) && (x + z) % 2 === 0) this.put(x, top + 1, z, roof); }
    else for (const [layer, inset] of [[0, -1], [1, 0], [2, 1]]) { const a = x0 + inset, b = x1 - inset, c = z0 + inset, d = z1 - inset; if (a <= b && c <= d) this.fill(a, top + layer, c, b, top + layer, d, roof); }
    if (lamp) this.put(x0 + 1, base, z0 + 1, B.lamp);
    return [dx + door[0] * (stilts ? 3 : 1) + 0.5, dz + door[1] * (stilts ? 3 : 1) + 0.5];
  }
  addCities(placed, avoid, cityInfo) {
    const result = {}, homes = [];
    const order = Object.keys(cityInfo).filter((id) => placed[id]).sort((a, b) => cityInfo[b].population - cityInfo[a].population);
    for (const id of order) {
      const info = cityInfo[id], p = placed[id], r = p.rect, big = info.style === 'roman';
      const houses = Math.min(Math.max(Math.round(Math.sqrt(info.population) / 25), 4), 40);
      const doors = [], center = [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
      const step = big ? 10 : 8, reach = 26 + houses;
      const others = Object.values(placed).filter((q) => q.id !== id).map((q) => q.rect);
      const plots = [];
      for (let gz = r[1] - reach; gz <= r[3] + reach; gz += step) for (let gx = r[0] - reach; gx <= r[2] + reach; gx += step) {
        const insula = big && hash(gx, gz, 5150) < 0.55, size = insula ? 7 : 5;
        const pr = [gx, gz, gx + size - 1, gz + size - 1];
        const d = rectDist(r, gx + (size >> 1), gz + (size >> 1));
        if (!(d > 4 && d < reach) || overlaps(pr, r, 3)) continue;
        const mx = gx + (size >> 1), mz = gz + (size >> 1);
        if (others.some((o) => rectDist(o, mx, mz) < Math.min(d - 12, 14))) continue;
        plots.push([gx, gz, size, d + hash(gx, gz, 5151) * 6]);
      }
      plots.sort((a, b) => a[3] - b[3]);
      for (const [x, z, size] of plots) {
        if (doors.length >= houses) break;
        const pr = [x, z, x + size - 1, z + size - 1];
        if (pr[0] <= 4 || pr[1] <= 4 || pr[2] >= this.w.n - 5 || pr[3] >= this.w.n - 5) continue;
        if (avoid.some((a) => overlaps(a, pr, 2)) || homes.some((a) => overlaps(a, pr, 1))) continue;
        const gy = this.plotGround(pr);
        if (gy === null) continue;
        const hx = x + size / 2, hz = z + size / 2, tx = center[0] - hx, tz = center[1] - hz;
        const door = Math.abs(tx) > Math.abs(tz) ? [tx > 0 ? 1 : -1, 0] : [0, tz > 0 ? 1 : -1];
        this.site = 100;
        doors.push(this.house(x, z, size, gy, info.style, door, hash(x, z, 5152) < 0.6));
        homes.push(pr);
      }
      result[id] = doors;
    }
    return result;
  }
}

// The starting camp: a house with a bed, a sheep pen and a gravel path.
function campPlan(w, sx, sz) {
  const x0 = Math.min(Math.max(sx - 2, 4), w.n - 12), z0 = Math.min(Math.max(sz - 6, 4), w.n - 17);
  let gy = Math.min(Math.max(w.groundY(x0 + 2, z0 + 6), WL + 1), H - 20);
  for (let z = z0 - 2; z <= z0 + 14; z++) for (let x = x0 - 3; x <= x0 + 8; x++) {
    for (let y = 1; y < gy - 1; y++) if (!SOLID[w.get(x, y, z)]) w.set(x, y, z, B.dirt);
    w.set(x, gy - 1, z, B.grass);
    for (let y = gy; y < Math.min(gy + 14, H); y++) w.set(x, y, z, 0);
  }
  for (let z = z0; z <= z0 + 4; z++) for (let x = x0; x <= x0 + 4; x++) {
    const edge = x === x0 || x === x0 + 4 || z === z0 || z === z0 + 4, corner = (x === x0 || x === x0 + 4) && (z === z0 || z === z0 + 4);
    w.set(x, gy - 1, z, edge ? B.cobblestone : B.planks);
    if (edge) for (let y = gy; y <= gy + 2; y++) w.set(x, y, z, corner ? B.oakLog : B.planks);
  }
  w.set(x0 + 2, gy, z0 + 4, 114); w.set(x0 + 2, gy + 1, z0 + 4, 115);   // a real door, standing open (click to shut it)
  w.set(x0, gy + 1, z0 + 2, 0); w.set(x0 + 4, gy + 1, z0 + 2, 0); w.set(x0 + 2, gy + 1, z0, 0);
  for (const [layer, inset] of [[3, -1], [4, 0], [5, 1]]) for (let z = z0 + inset; z <= z0 + 4 - inset; z++) for (let x = x0 + inset; x <= x0 + 4 - inset; x++) w.set(x, gy + layer, z, B.planks);
  w.set(x0 + 2, gy + 6, z0 + 2, B.oakLog);
  w.set(x0 + 1, gy, z0 + 1, B.bedHead); w.set(x0 + 2, gy, z0 + 1, B.bedFoot);
  w.set(x0 + 3, gy, z0 + 3, B.torch);
  w.set(x0 + 2, gy - 1, z0 + 5, B.gravel); w.set(x0 + 2, gy - 1, z0 + 6, B.gravel);
  const px0 = x0 - 1, px1 = x0 + 5, pz0 = z0 + 7, pz1 = z0 + 11;
  for (let z = pz0; z <= pz1; z++) for (let x = px0; x <= px1; x++) if (x === px0 || x === px1 || z === pz0 || z === pz1) w.set(x, gy, z, B.fence);
  w.set(x0 + 2, gy, pz0, B.gateX);      // a gate into the sheep pen
  return { floorY: gy, house: [x0, z0], bed: [x0 + 1, z0 + 1], door: [x0 + 2, z0 + 4], spawn: [x0 + 2.5, z0 + 6.5], pen: [px0, pz0, px1, pz1] };
}

function post(msg, p) { self.postMessage({ type: 'progress', msg, p }); }

self.onmessage = (e) => {
  const { map, seed, cityInfo } = e.data;
  const s32 = seed | 0;
  const spawn = [Math.floor(map.settle[1] * BPT + BPT / 2), Math.floor(map.settle[0] * BPT + BPT / 2)];
  const { w, cp, wake } = generate(map.rows, s32, spawn);
  post('Building the wonders of the ancient world…', 0.75);
  const st = new Stamper(w);
  const taken = [[spawn[0] - 16, spawn[1] - 16, spawn[0] + 16, spawn[1] + 16]];
  const placed = {};
  SITES.forEach((site, k) => {
    const anchor = site.fixed ? [Math.floor(site.tile[1] * BPT), Math.floor(site.tile[0] * BPT)] : st.choose(site, taken);
    const f = site.fp;
    const r = [Math.max(anchor[0] + f[0], 3), Math.max(anchor[1] + f[1], 3), Math.min(anchor[0] + f[2], w.n - 4), Math.min(anchor[1] + f[3], w.n - 4)];
    st.site = k;
    const ground = st.build(site.id, anchor[0], anchor[1], r);
    taken.push(r);
    placed[site.id] = { id: site.id, x: anchor[0], z: anchor[1], ground, rect: r };
  });
  post('Digging the tunnel from Atlantis…', 0.82);
  const tunnel = carveTunnel(w, st.atl, cp, s32);
  taken.push(cp.rect);
  post('Building the great cities…', 0.85);
  const siteIndex = Object.fromEntries(SITES.map((s, k) => [s.id, k]));
  const cities = st.addCities(placed, taken, cityInfo, siteIndex);
  const land = w.nearestLand(spawn[0], spawn[1]);
  const camp = campPlan(w, land[0], land[1]);
  post('Almost ready…', 0.95);
  const prot = new Int32Array(w.protected.size * 2);
  let k = 0;
  for (const [i, s] of w.protected) { prot[k++] = i; prot[k++] = s; }
  const canyon = { rect: cp.rect, exit: tunnel.exit, falls: [cp.head + 0.5, cp.top, cp.midZ(cp.head) + 1], fallsBase: cp.floorY(cp.head), tunnelLength: tunnel.length };
  self.postMessage({ type: 'done', n: w.n, cells: w.cells, bio: w.bio, placed, cities, camp, prot, relics: st.atl.relics, canyon, wake }, [w.cells.buffer, w.bio.buffer, prot.buffer]);
};

// The great cities (city plans) are in their own file.
if (typeof importScripts === 'function') importScripts('cityplans.js');
