// Polis World 2: the world in memory, a chunk at a time.
//
// The old World held every block of an 800 × 800 map. This one holds only the chunks near the player (and anyone
// else who needs them), makes the rest on demand from the map's shape (geo.js), and drops them again when nobody is
// near. The player's changes live in `edits` (block index → block) and are put back whenever a chunk is made again.
//
// It answers the same questions as the old World (get, set, groundY, solid, top, lights…), so the rest of the game
// doesn't need to know the difference.

import { BLOCKS, IS_SOLID, BLOCKS_SKY, GLOW, IS_WATER, IS_CROSS } from './engine.js';
import { SIZE, H, SL, CS, MAPS, genChunk, column } from './geo.js';

export { SIZE, H, SL, CS };
export const SKY_FALLOFF = [1, 0.84, 0.68, 0.53, 0.40, 0.29, 0.16];

export class ChunkWorld {
  /// `map` is a key of MAPS; `edits` a Map of block index → block (the save).
  constructor(mapId, edits = new Map()) {
    this.mapId = mapId; this.map = MAPS[mapId];
    this.n = SIZE; this.H = H; this.SL = SL; this.lightScale = 2;   // (torchlight reaches as far in metres as before)
    this.chunks = new Map();          // "cx,cz" → { cells, tops, bio, used }
    this.edits = new Map();           // "cx,cz" → Map(index → block)
    this.lights = new Map();          // "cx,cz" → Set of glowing block indexes
    this.protected = new Map();
    this.pending = new Map();         // chunks asked of the workers: "cx,cz" → true
    this.onChunk = null;              // called with (cx, cz) when a chunk arrives from a worker
    this.workers = [];
    this.clock = 0;
    this._last = null; this._lastK = -1;
    for (const [i, b] of edits) this.remember(i, b);
  }
  bio = { get: () => 0 };
  idx(x, y, z) { return (y * this.n + z) * this.n + x; }
  unidx(i) { const n = this.n; return [i % n, Math.floor(i / (n * n)), Math.floor(i / n) % n]; }
  inb(x, z) { return x >= 0 && z >= 0 && x < this.n && z < this.n; }
  key(cx, cz) { return cx + ',' + cz; }
  chunkKey(x, z) { return Math.floor(x / CS) + ',' + Math.floor(z / CS); }
  remember(i, b) {
    const [x, , z] = this.unidx(i), k = this.chunkKey(x, z);
    let m = this.edits.get(k);
    if (!m) { m = new Map(); this.edits.set(k, m); }
    m.set(i, b);
  }
  /// Every change, for saving.
  allEdits() { const out = new Map(); for (const m of this.edits.values()) for (const [i, b] of m) out.set(i, b); return out; }

  // ---- chunks ----
  /// The chunk at (cx, cz), made now if need be.
  chunk(cx, cz) {
    const ck = cx * 100003 + cz;
    if (ck === this._lastK) return this._last;
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) c = this.accept(genChunk(this.map, cx, cz));
    c.used = this.clock;
    this._last = c; this._lastK = ck;
    return c;
  }
  has(cx, cz) { return this.chunks.has(this.key(cx, cz)); }
  /// Takes a freshly made chunk (from here or a worker): puts back the player's changes and finds its lights.
  accept(c) {
    const k = this.key(c.cx, c.cz);
    const old = this.chunks.get(k);
    if (old) return old;
    c.used = this.clock;
    this.chunks.set(k, c);
    this.pending.delete(k);
    const x0 = c.cx * CS, z0 = c.cz * CS, n = this.n;
    const ed = this.edits.get(k);
    if (ed) for (const [i, b] of ed) {
      const [x, y, z] = this.unidx(i), lx = x - x0, lz = z - z0;
      c.cells[(y * CS + lz) * CS + lx] = b;
    }
    // Lights, and the tops of columns (with the edits in).
    let lights = null;
    for (let i = 0; i < c.cells.length; i++) {
      const b = c.cells[i];
      if (b && GLOW[b] > 0) {
        const lx = i % CS, lz = Math.floor(i / CS) % CS, y = Math.floor(i / (CS * CS));
        (lights ??= new Set()).add((y * n + z0 + lz) * n + x0 + lx);
      }
    }
    if (lights) this.lights.set(k, lights);
    // The highest block in the chunk, and the lowest place anyone has changed (for meshing only what can be seen).
    let maxY = 0;
    for (let i = c.cells.length - 1; i >= 0; i--) if (c.cells[i]) { maxY = Math.floor(i / (CS * CS)); break; }
    c.maxY = maxY;
    c.lowEdit = H;
    if (ed) for (const i of ed.keys()) c.lowEdit = Math.min(c.lowEdit, this.unidx(i)[1]);
    if (ed) for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) c.tops[lz * CS + lx] = this.scanTopIn(c, lx, lz);
    else for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
      // genChunk's tops are the ground; trees and plants may stand above it.
      let y = c.tops[lz * CS + lx];
      while (y < H && !BLOCKS_SKY[c.cells[(y * CS + lz) * CS + lx]] && c.cells[(y * CS + lz) * CS + lx] !== 0) y++;
      let top = c.tops[lz * CS + lx];
      for (let yy = Math.min(H - 1, y + 40); yy >= top; yy--) if (BLOCKS_SKY[c.cells[(yy * CS + lz) * CS + lx]]) { top = yy + 1; break; }
      c.tops[lz * CS + lx] = top;
    }
    return c;
  }
  scanTopIn(c, lx, lz) { for (let y = H - 1; y >= 0; y--) if (BLOCKS_SKY[c.cells[(y * CS + lz) * CS + lx]]) return y + 1; return 0; }
  /// Ask the workers for the chunks around (x, z) that aren't made yet, nearest first.
  request(list) {
    if (!this.workers.length) return false;
    let w = 0;
    for (const [cx, cz] of list) {
      const k = this.key(cx, cz);
      if (this.chunks.has(k) || this.pending.has(k)) continue;
      if (this.pending.size > 48) break;
      this.pending.set(k, true);
      this.workers[w++ % this.workers.length].postMessage({ map: this.mapId, cx, cz });
    }
    return true;
  }
  startWorkers(n = 2) {
    for (let i = 0; i < n; i++) {
      const wk = new Worker(new URL('./chunkworker.js', import.meta.url), { type: 'module' });
      wk.onmessage = (e) => {
        const c = e.data;
        if (c.map !== this.mapId) return;
        const k = this.key(c.cx, c.cz);
        if (this.chunks.has(k)) { this.pending.delete(k); return; }
        this.accept(c);
        this.onChunk?.(c.cx, c.cz);
      };
      this.workers.push(wk);
    }
  }
  stopWorkers() { for (const w of this.workers) w.terminate(); this.workers = []; this.pending.clear(); }
  /// Forget chunks nobody has needed for a while (keeping their edits, which come back with them).
  forget(keep) {
    if (this.chunks.size < keep) return;
    const list = [...this.chunks.entries()].sort((a, b) => a[1].used - b[1].used);
    for (let i = 0; i < list.length - keep; i++) {
      const [k] = list[i];
      if (list[i][1].used >= this.clock - 2) break;
      this.chunks.delete(k); this.lights.delete(k);
    }
    this._lastK = -1;
  }

  // ---- blocks ----
  get(x, y, z) {
    if (y < 0) return 20;
    if (y >= H || x < 0 || z < 0 || x >= this.n || z >= this.n) return 0;
    const c = this.chunk(Math.floor(x / CS), Math.floor(z / CS));
    return c.cells[(y * CS + (z & 15)) * CS + (x & 15)];
  }
  /// Like get, but never makes a chunk: unknown places read as `fallback`.
  peek(x, y, z, fallback = 0) {
    if (y < 0) return 20;
    if (y >= H || x < 0 || z < 0 || x >= this.n || z >= this.n) return 0;
    const c = this.chunks.get(this.key(Math.floor(x / CS), Math.floor(z / CS)));
    return c ? c.cells[(y * CS + (z & 15)) * CS + (x & 15)] : fallback;
  }
  solid(x, y, z) { return IS_SOLID[this.get(x, y, z)] === 1; }
  set(x, y, z, b) {
    if (!this.inb(x, z) || y < 0 || y >= H) return;
    const cx = Math.floor(x / CS), cz = Math.floor(z / CS), c = this.chunk(cx, cz), lx = x & 15, lz = z & 15;
    const ci = (y * CS + lz) * CS + lx, old = c.cells[ci];
    if (old === b) return;
    const i = this.idx(x, y, z), k = this.key(cx, cz);
    if (GLOW[old] > 0) this.lights.get(k)?.delete(i);
    c.cells[ci] = b;
    if (GLOW[b] > 0) { if (!this.lights.has(k)) this.lights.set(k, new Set()); this.lights.get(k).add(i); }
    const ti = lz * CS + lx;
    if (BLOCKS_SKY[b] && y + 1 > c.tops[ti]) c.tops[ti] = y + 1;
    else if (BLOCKS_SKY[old] && y + 1 === c.tops[ti]) c.tops[ti] = this.scanTopIn(c, lx, lz);
    this.remember(i, b);
    if (b && y > c.maxY) c.maxY = y;
    if (y < c.lowEdit) c.lowEdit = y;
  }
  /// The heights worth meshing in a chunk: from just below the lowest ground (or dug hole) round it to its top.
  meshRange(cx, cz) {
    let lo = H, hi = 0;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = this.chunk(cx + dx, cz + dz);
      if (dx === 0 && dz === 0) hi = c.maxY;
      lo = Math.min(lo, c.lowEdit - 1);
      for (let i = 0; i < CS * CS; i++) {
        // (the ground under the top: water tops sit on the bed, so this reaches the sea floor too)
        const t = c.tops[i];
        let y = t - 1;
        while (y > 0 && c.cells[(y * CS + (i >> 4)) * CS + (i & 15)] && !IS_SOLID[c.cells[(y * CS + (i >> 4)) * CS + (i & 15)]]) y--;
        if (y - 1 < lo) lo = y - 1;
      }
    }
    return [Math.max(0, lo), Math.min(H - 1, hi + 1)];
  }
  topAt(x, z) { const c = this.chunk(Math.floor(x / CS), Math.floor(z / CS)); return c.tops[(z & 15) * CS + (x & 15)]; }
  get top() { const w = this; return { get length() { return w.n * w.n; } }; }
  scanTop(x, z) { return this.topAt(x, z); }
  groundY(x, z, below = H - 1) {
    if (!this.inb(x, z)) return 0;
    const c = this.chunk(Math.floor(x / CS), Math.floor(z / CS)), lx = x & 15, lz = z & 15;
    for (let y = Math.min(below, H - 1); y >= 0; y--) {
      const b = c.cells[(y * CS + lz) * CS + lx];
      if (IS_SOLID[b]) return b === 34 || BLOCKS[b].gate ? y + 1.5 : (BLOCKS[b].shape === 'bed' ? y + 0.56 : y + 1);
    }
    return 0;
  }
  /// The ground height without making the chunk: from the map's shape (ignores the player's changes and trees).
  roughGround(x, z) { return this.has(Math.floor(x / CS), Math.floor(z / CS)) ? this.groundY(x, z) : column(this.map, x, z).y; }
  hasWater(x, z) { return IS_WATER[this.get(x, SL - 1, z)] === 1; }
  skyOpen(x, y, z) { return !this.inb(x, z) || y >= this.topAt(x, z); }
  skyLight(x, y, z) {
    if (this.skyOpen(x, y, z)) return 1;
    for (let r = 1; r <= 5; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
      if (this.skyOpen(x + dx, y, z + dz)) return SKY_FALLOFF[r];
    }
    return SKY_FALLOFF[6];
  }
  nearestLand(x0, z0) {
    for (let r = 0; r < 120; r++) for (let dz = -r; dz <= r; dz += r ? 1 : 1) for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
      const x = x0 + dx, z = z0 + dz;
      if (x < 2 || z < 2 || x >= this.n - 2 || z >= this.n - 2) continue;
      const g = Math.floor(this.groundY(x, z)), at = this.get(x, g, z);
      if (g > SL && !this.hasWater(x, z) && (at === 0 || IS_CROSS[at]) && !this.solid(x, g + 1, z) && !this.solid(x, g + 2, z) && !this.solid(x, g + 3, z)) return [x, z];
    }
    return [x0, z0];
  }
}
