// Polis World (computer version): the great cities, rebuilt as whole cities rather than a monument with a few huts.
// Each city gets streets on a grid (the way many ancient cities were planned), houses in its own style packed into
// the blocks, markets, gardens and walls, and several of its famous buildings. Loaded by worldgen.js (same worker).
'use strict';

// ---------- house styles ----------
// wall, trim, floor, roof kind and material, how many storeys, and the paving of the streets.
const CITY_STYLE = {
  roman: { wall: B.limestone, trim: B.brick, floor: B.stoneBricks, roof: 'gable', roofB: B.brick, storeys: [1, 2], street: B.cobblestone, avenue: B.stoneBricks, court: 0.35, tall: { chance: 0.4, storeys: [3, 5], wall: B.brick, trim: B.limestone, roof: 'flat', roofB: B.brick } },
  greek: { wall: B.limestone, trim: null, floor: B.limestone, roof: 'gable', roofB: B.brick, storeys: [1, 2], street: B.gravel, avenue: B.limestone, court: 0.5 },
  egyptian: { wall: B.mudBrick, trim: B.limestone, floor: B.sand, roof: 'terrace', roofB: B.mudBrick, storeys: [1, 2], street: B.sand, avenue: B.limestone, court: 0.3 },
  mesopotamian: { wall: B.mudBrick, trim: B.blueTile, trimChance: 0.25, floor: B.brick, roof: 'terrace', roofB: B.mudBrick, storeys: [1, 2], street: B.gravel, avenue: B.brick, court: 0.55 },
  persian: { wall: B.mudBrick, trim: B.carvedStone, floor: B.stoneBricks, roof: 'terrace', roofB: B.stoneBricks, storeys: [1, 2], street: B.gravel, avenue: B.stoneBricks, court: 0.5 },
  indus: { wall: B.brick, trim: null, floor: B.brick, roof: 'terrace', roofB: B.brick, storeys: [1, 2], street: B.brick, avenue: B.brick, court: 0.6, blankFront: true },
  mesoamerican: { wall: B.limestone, trim: B.brick, floor: B.stone, roof: 'flat', roofB: B.limestone, storeys: [1, 1], street: B.gravel, avenue: B.gravel, court: 0.8 },
  khmer: { wall: B.planks, trim: null, floor: B.planks, roof: 'gable', roofB: B.palmLeaves, storeys: [1, 1], street: B.dirt, avenue: B.gravel, court: 0, stilts: true },
  // Jerusalem: stone houses with flat roofs. Carthage: white-plastered houses several floors high. China: courtyard houses of grey brick with grey tiled roofs and red doors.
  judean: { wall: B.jerusalemStone, trim: null, floor: B.limestone, roof: 'terrace', roofB: B.limestone, storeys: [1, 2], street: B.limestone, avenue: B.jerusalemStone, court: 0.4 },
  punic: { wall: B.plaster, trim: B.sandstone, floor: B.terracotta, roof: 'terrace', roofB: B.plaster, storeys: [2, 3], street: B.gravel, avenue: B.stoneBricks, court: 0.5 },
  chinese: { wall: B.stoneBricks, trim: B.redLacquer, floor: B.stoneBricks, roof: 'gable', roofB: B.greyRoof, storeys: [1, 1], street: B.rammedEarth, avenue: B.stoneBricks, court: 0.75 },
};

/// How many townspeople walk the streets of a city (more for bigger cities; each stands for many real people).
function crowdSize(pop) { return Math.round(Math.max(40, Math.min(170, 40 + 60 * Math.log10(pop / 10000)))); }

Object.assign(Stamper.prototype, {
  // ---------- one building ----------
  /// A house or apartment block on a w × d plot whose floor is at gy - 1. door = [dx, dz] (which side the door is on).
  building(x0, z0, w, d, gy, o, door, seed) {
    const x1 = x0 + w - 1, z1 = z0 + d - 1, sh = o.sh ?? 3, storeys = o.storeys ?? 1, wallH = storeys * sh;
    const base = o.stilts ? gy + 2 : gy;
    const top = base + wallH;
    // Clear the plot and give it a floor.
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      for (let y = 1; y < gy - 1; y++) if (!SOLID[this.w.get(x, y, z)] || WATERY[this.w.get(x, y, z)]) this.raw(x, y, z, B.dirt);
      this.put(x, gy - 1, z, o.stilts ? B.dirt : o.floor);
      for (let y = gy; y < Math.min(top + 6, H); y++) this.put(x, y, z, 0);
    }
    if (o.stilts) {
      for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) this.fill(x, gy, z, x, gy + 1, z, B.oakLog);
      this.fill(x0, gy + 1, z0, x1, gy + 1, z1, B.planks);
    }
    const court = o.court && w >= 9 && d >= 9;
    const edge = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
    const inner = (x, z) => court && (x === x0 + 3 || x === x1 - 3 || z === z0 + 3 || z === z1 - 3) && x >= x0 + 3 && x <= x1 - 3 && z >= z0 + 3 && z <= z1 - 3;
    const yard = (x, z) => court && x > x0 + 3 && x < x1 - 3 && z > z0 + 3 && z < z1 - 3;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (edge(x, z) || inner(x, z)) this.fill(x, base, z, x, top - 1, z, o.wall);
      else if (!yard(x, z)) for (let s = 1; s < storeys; s++) this.put(x, base + s * sh - 1, z, B.planks);
    }
    if (o.trim) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (edge(x, z)) this.put(x, top - 1, z, o.trim);
    // The door, and a passage through to the courtyard.
    const cx = x0 + (w >> 1), cz = z0 + (d >> 1);
    const dx = door[0] === 0 ? cx : door[0] > 0 ? x1 : x0, dz = door[1] === 0 ? cz : door[1] > 0 ? z1 : z0;
    this.put(dx, base, dz, 0); this.put(dx, base + 1, dz, 0);
    if (court) { const ix = door[0] === 0 ? cx : door[0] > 0 ? x1 - 3 : x0 + 3, iz = door[1] === 0 ? cz : door[1] > 0 ? z1 - 3 : z0 + 3; this.put(ix, base, iz, 0); this.put(ix, base + 1, iz, 0); }
    // Windows on every floor (except the street side of Indus houses, which had blank walls for privacy).
    for (let s = 0; s < storeys; s++) {
      const y = base + s * sh + 1;
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        if (!edge(x, z) || ((x === x0 || x === x1) && (z === z0 || z === z1))) continue;
        const along = x === x0 || x === x1 ? z - z0 : x - x0;
        if (along % 3 !== 1 || (x === dx && z === dz && s === 0)) continue;
        if (o.blankFront && ((door[0] && x === dx) || (door[1] && z === dz))) continue;
        this.put(x, y, z, 0);
      }
    }
    // A pool in the courtyard (Roman atrium, Greek and Indus courtyards had wells or basins).
    if (court) { this.put(cx, gy - 1, cz, B.water); if (hash(x0, z0, seed + 3) < 0.5) oak(this.w, cx + 1, gy, cz + 1, seed); }
    // Roof.
    const rb = o.roofB;
    if (o.roof === 'flat' || o.roof === 'terrace') {
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (!yard(x, z)) this.put(x, top, z, rb);
      if (o.roof === 'terrace') for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (edge(x, z) && (x + z) % 2 === 0) this.put(x, top + 1, z, o.wall);
    } else {
      // A gable roof along the longer side, overhanging the walls by one.
      const alongX = w >= d, span = alongX ? d : w;
      for (let k = 0; 2 * k < span + 2; k++) {
        const y = top + k;
        if (alongX) for (let x = x0 - 1; x <= x1 + 1; x++) { this.put(x, y, z0 - 1 + k, rb); this.put(x, y, z1 + 1 - k, rb); }
        else for (let z = z0 - 1; z <= z1 + 1; z++) { this.put(x0 - 1 + k, y, z, rb); this.put(x1 + 1 - k, y, z, rb); }
        // Fill the triangle at the ends.
        if (alongX) for (let z = z0 - 1 + k + 1; z <= z1 + 1 - k - 1; z++) { this.put(x0, y, z, o.wall); this.put(x1, y, z, o.wall); }
        else for (let x = x0 - 1 + k + 1; x <= x1 + 1 - k - 1; x++) { this.put(x, y, z0, o.wall); this.put(x, y, z1, o.wall); }
      }
    }
    if (o.lamp) this.put(x0 + 1, base, z0 + 1, B.lamp);
    // A step up to the door if the street is lower.
    const ox = dx + door[0], oz = dz + door[1];
    if (o.stilts) { this.put(ox, gy, oz, B.planks); this.put(ox + door[0], gy - 1, oz + door[1], B.planks); this.put(ox, gy + 1, oz, B.planks); this.put(ox, gy + 2, oz, 0); this.put(ox, gy + 3, oz, 0); }
    else if (this.ground(ox, oz) < gy - 1) this.put(ox, gy - 1, oz, o.floor);
    return [ox + door[0] * (o.stilts ? 2 : 0) + 0.5, oz + door[1] * (o.stilts ? 2 : 0) + 0.5, this.ground(ox + door[0] * (o.stilts ? 2 : 0), oz + door[1] * (o.stilts ? 2 : 0))];
  },

  // ---------- the city ----------
  /// Lays out a whole city. spec: { id, cx, cz, R, shape, S, street, style, wall, moat, monuments, colonnade, lamps, gardenTree }
  layoutCity(spec, others, avoid) {
    const w = this.w, st = CITY_STYLE[spec.style], S = spec.S ?? 11, SW = spec.street ?? 2, R = spec.R;
    const { cx, cz } = spec;
    const seed = 6000 + hash(cx, cz, 17) * 1000 | 0;
    const inShape = (x, z) => spec.shape === 'circle' ? Math.hypot(x - cx, z - cz) <= R : Math.abs(x - cx) <= R && Math.abs(z - cz) <= R;
    const mine = (x, z) => others.every((o) => Math.hypot(x - cx, z - cz) / R <= Math.hypot(x - o.cx, z - o.cz) / o.R);
    // Dry land, or shallow water (up to 2 deep) that the city fills in, like the drained marshes under the Roman Forum.
    const dry = (x, z) => w.inb(x, z) && this.ground(x, z) >= WL - 1;
    const free = (x, z) => { const g = this.ground(x, z); for (let y = g - 2; y <= g + 3; y++) if (w.protected.has(w.idx(x, Math.max(1, y), z))) return false; return true; };
    const inRects = (list, x, z) => list.some((r) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]);
    // What every spot in the city is like, worked out once: 0 = can't build (another wonder, the edge of the world),
    // 1 = water or outside the city, 2 = good dry land in the city. `used` marks spots taken by this city's buildings.
    const G0 = cx - R - 2, H0 = cz - R - 2, GW = 2 * R + 5;
    const land = new Uint8Array(GW * GW), used = new Uint8Array(GW * GW);
    for (let j = 0; j < GW; j++) for (let i = 0; i < GW; i++) {
      const x = G0 + i, z = H0 + j;
      if (!w.inb(x, z) || x <= 4 || z <= 4 || x >= w.n - 5 || z >= w.n - 5 || inRects(avoid, x, z) || inRects(spec.keep || [], x, z) || !free(x, z)) continue;
      land[j * GW + i] = inShape(x, z) && mine(x, z) && dry(x, z) ? 2 : 1;
    }
    const at = (x, z) => { const i = x - G0, j = z - H0; return i < 0 || j < 0 || i >= GW || j >= GW ? -1 : j * GW + i; };
    const ok = (x, z) => { const k = at(x, z); return k >= 0 && land[k] === 2 && !used[k]; };
    const take = (r, m = 0) => { for (let z = r[1] - m; z <= r[3] + m; z++) for (let x = r[0] - m; x <= r[2] + m; x++) { const k = at(x, z); if (k >= 0) used[k] = 1; } };
    // Never on top of another wonder or this city's buildings (hard); mostly dry land inside the city (soft, `need` of it).
    const rectOk = (r, need = 1) => {
      let good = 0, all = 0;
      for (let z = r[1]; z <= r[3]; z++) for (let x = r[0]; x <= r[2]; x++) {
        all++;
        const k = at(x, z);
        if (k < 0 || used[k]) return false;
        if (land[k] === 0) return false;
        if (land[k] === 2) good++;
      }
      return good >= all * need;
    };
    const reserved = [];
    const out = { doors: [], streets: [], plazas: [], center: [cx, cz], R, monuments: [] };
    this.site = spec.siteNo;

    // 1. The famous buildings, nudged a little if the first spot is in the sea or on another site.
    for (const m of spec.monuments || []) {
      // The spot nearest where it really stood that has room for it.
      let placedAt = null;
      for (const [sx, sz] of SPIRAL) {
        const x0 = cx + m.at[0] + sx, z0 = cz + m.at[1] + sz, r = [x0, z0, x0 + m.size[0] - 1, z0 + m.size[1] - 1];
        if (rectOk(r, m.need ?? 0.9)) { placedAt = r; break; }
      }
      if (!placedAt) continue;
      const gy = m.gy ?? this.level(placedAt, WL + 1);
      if (!m.noFlatten) this.flatten(placedAt, gy, m.ground ?? st.avenue, 2);
      m.build.call(this, placedAt[0], placedAt[1], gy, placedAt);
      take(placedAt, 1);
      out.monuments.push({ name: m.name, x: (placedAt[0] + placedAt[2]) / 2, z: (placedAt[1] + placedAt[3]) / 2 });
      if (m.plaza) out.plazas.push([(placedAt[0] + placedAt[2]) / 2, (placedAt[1] + placedAt[3]) / 2]);
    }

    // 2. Blocks between the streets, filled with houses, markets and gardens.
    const isStreet = (x, z) => {
      const ox = ((x - cx + (SW >> 1)) % S + S) % S, oz = ((z - cz + (SW >> 1)) % S + S) % S;
      return ox < SW || oz < SW || Math.abs(x - cx) <= 1 || Math.abs(z - cz) <= 1;
    };
    const plots = [];
    const n0 = Math.ceil(R / S) + 1;
    for (let j = -n0; j <= n0; j++) for (let i = -n0; i <= n0; i++) {
      let x0 = cx + i * S + (SW - (SW >> 1)), z0 = cz + j * S + (SW - (SW >> 1));
      let x1 = x0 + S - SW - 1, z1 = z0 + S - SW - 1;
      // Keep the main avenues (through the middle) three wide.
      if (x0 <= cx + 1 && x1 >= cx - 1) { if (x0 >= cx - 1) x0 = cx + 2; else x1 = cx - 2; }
      if (z0 <= cz + 1 && z1 >= cz - 1) { if (z0 >= cz - 1) z0 = cz + 2; else z1 = cz - 2; }
      if (x1 - x0 < 3 || z1 - z0 < 3) continue;
      plots.push([x0, z0, x1, z1]);
    }
    for (const blk of plots) {
      const [bx0, bz0, bx1, bz1] = blk;
      const bw = bx1 - bx0 + 1, bd = bz1 - bz0 + 1;
      // Whole block, or its quarters on uneven ground and coasts.
      let parts = [];
      // (Small ponds and dips get filled in: houses only need most of the plot to be dry land.)
      if (rectOk(blk, 0.8)) parts = [[blk, true]];
      else {
        const mx = bx0 + (bw >> 1), mz = bz0 + (bd >> 1);
        for (const q of [[bx0, bz0, mx - 1, mz - 1], [mx, bz0, bx1, mz - 1], [bx0, mz, mx - 1, bz1], [mx, mz, bx1, bz1]]) if (q[2] - q[0] >= 3 && q[3] - q[1] >= 3 && rectOk(q, 0.75)) parts.push([q, false]);
      }
      for (const [r, whole] of parts) {
        take(r);
        const hs = [];
        for (let z = r[1]; z <= r[3]; z++) for (let x = r[0]; x <= r[2]; x++) hs.push(this.ground(x, z));
        hs.sort((a, b) => a - b);
        if (hs[hs.length - 1] - hs[0] > 8) continue;
        const gy = Math.max(hs[hs.length >> 1], WL + 1);
        if (gy > H - 20) continue;
        const roll = hash(r[0], r[1], seed);
        const ctr = [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
        const toC = [cx - ctr[0], cz - ctr[1]];
        const door = Math.abs(toC[0]) > Math.abs(toC[1]) ? [toC[0] > 0 ? 1 : -1, 0] : [0, toC[1] > 0 ? 1 : -1];
        const near = Math.hypot(toC[0], toC[1]) < R * 0.45;
        if (whole && near && roll < (spec.markets ?? 0.07)) { this.market(r, gy, st, seed); out.plazas.push(ctr); continue; }
        if (whole && roll > 1 - (spec.gardens ?? 0.06)) { this.garden(r, gy, spec.style, seed); out.plazas.push(ctr); continue; }
        this.houses(r, gy, st, door, spec, seed, out);
      }
    }

    // 3. Streets: paved, cleared of trees, with lamps along the main avenues.
    for (let z = cz - R; z <= cz + R; z++) for (let x = cx - R; x <= cx + R; x++) {
      if (!isStreet(x, z) || !ok(x, z)) continue;
      let g = this.ground(x, z);
      if (g <= WL) { for (let y = g - 1; y < WL; y++) this.raw(x, y, z, B.dirt); g = WL + 1; }
      const main = Math.abs(x - cx) <= 1 || Math.abs(z - cz) <= 1;
      this.raw(x, g - 1, z, main ? st.avenue : st.street);
      for (let y = g; y < Math.min(g + 6, H); y++) { const b = w.get(x, y, z); if (b !== 0 && !w.protected.has(w.idx(x, y, z))) this.raw(x, y, z, 0); }
      if (hash(x, z, seed + 9) < 0.09) out.streets.push([x + 0.5, z + 0.5, g]);
      // Colonnades and lamps along the avenues.
      const along = Math.abs(x - cx) <= 1 ? z - cz : x - cx, side = Math.abs(x - cx) <= 1 ? x - cx : z - cz;
      if (main && Math.abs(side) === 1 && Math.abs(along) > 3 && Math.abs(Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1 ? 0 : along) % 6 === 0 && !(Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1)) {
        const ox = Math.abs(x - cx) <= 1 ? Math.sign(side) : 0, oz = Math.abs(x - cx) <= 1 ? 0 : Math.sign(side);
        const px = x + ox, pz = z + oz;
        if (ok(px, pz) && w.get(px, this.ground(px, pz), pz) === 0 && isStreet(px, pz)) {
          const pg = this.ground(px, pz);
          if (spec.colonnade) { this.fill(px, pg, pz, px, pg + 3, pz, B.column); this.put(px, pg + 4, pz, B.lamp); }
          else { this.put(px, pg, pz, B.fence); this.put(px, pg + 1, pz, B.lamp); }
        }
      }
    }
    // 4. City walls with towers and gates (where the avenues go out), and a moat if the city had one.
    if (spec.wall) this.cityWall(spec, ok, inShape);
    return out;
  },

  /// Houses in one block: one big house round a courtyard, or a few smaller ones.
  houses(r, gy, st, door, spec, seed, out) {
    const bw = r[2] - r[0] + 1, bd = r[3] - r[1] + 1;
    const roll = hash(r[0] + 7, r[1] - 3, seed + 1);
    const pick = (lo, hi, s) => lo + Math.floor(hash(r[0] + s, r[1] + s * 3, seed + 2) * (hi - lo + 1));
    const tall = st.tall && roll < st.tall.chance;
    const make = (x0, z0, w, d, k) => {
      const o = { wall: st.wall, trim: st.trim && (st.trimChance === undefined || hash(x0, z0, seed + 5) < st.trimChance) ? st.trim : null, floor: st.floor, roof: st.roof, roofB: st.roofB, storeys: pick(st.storeys[0], st.storeys[1], k), stilts: st.stilts, blankFront: st.blankFront, lamp: hash(x0, z0, seed + 6) < 0.5 };
      if (tall) Object.assign(o, { wall: st.tall.wall, trim: st.tall.trim, roof: st.tall.roof, roofB: st.tall.roofB, storeys: pick(st.tall.storeys[0], st.tall.storeys[1], k), court: w >= 9 && d >= 9 });
      else o.court = hash(x0, z0, seed + 7) < st.court;
      const sub = [x0 + w / 2, z0 + d / 2], toB = [(r[0] + r[2]) / 2 - sub[0], (r[1] + r[3]) / 2 - sub[1]];
      // Doors face the street the house is on.
      let dr = door;
      if (Math.abs(toB[0]) > 0.6 && Math.abs(toB[0]) >= Math.abs(toB[1])) dr = [toB[0] > 0 ? -1 : 1, 0];
      else if (Math.abs(toB[1]) > 0.6) dr = [0, toB[1] > 0 ? -1 : 1];
      out.doors.push(this.building(x0, z0, w, d, gy, o, dr, seed + k));
    };
    if (st.stilts) {
      // Wooden houses on stilts, spread out with gardens between.
      const s = 5;
      for (let z = r[1] + 1; z + s - 1 <= r[3]; z += s + 2) for (let x = r[0] + 1; x + s - 1 <= r[2]; x += s + 2) make(x, z, s, s - 1, x + z);
      return;
    }
    if (tall || (bw >= 9 && bd >= 9 && roll < st.court)) { make(r[0], r[1], bw, bd, 1); return; }
    // Split into two or four houses with a narrow alley between.
    const splitX = bw >= 9, splitZ = bd >= 9;
    const xs = splitX ? [[r[0], (bw >> 1) - 1], [r[0] + (bw >> 1), bw - (bw >> 1)]] : [[r[0], bw]];
    const zs = splitZ ? [[r[1], (bd >> 1) - 1], [r[1] + (bd >> 1), bd - (bd >> 1)]] : [[r[1], bd]];
    let k = 0;
    for (const [x0, ww] of xs) for (const [z0, dd] of zs) if (ww >= 4 && dd >= 4) make(x0, z0, ww, dd, ++k);
  },
  market(r, gy, st, seed) {
    this.flattenRaw(r, gy, st.avenue);
    const cols = [B.brick, B.blueTile, B.planks, B.goldBlock, B.limestone];
    for (let z = r[1] + 1; z <= r[3] - 1; z += 3) for (let x = r[0] + 1; x <= r[2] - 1; x += 4) {
      if (x + 1 > r[2] || z + 1 > r[3]) continue;
      const c = cols[Math.floor(hash(x, z, seed + 11) * cols.length)];
      // A stall: two posts, an awning, a counter with goods on it.
      this.fill(x, gy, z, x, gy + 1, z, B.fence); this.fill(x + 2 <= r[2] ? x + 2 : x + 1, gy, z, x + 2 <= r[2] ? x + 2 : x + 1, gy + 1, z, B.fence);
      this.fill(x, gy + 2, z - 0, Math.min(x + 2, r[2]), gy + 2, z, c);
      this.put(x + 1, gy, z + 1 <= r[3] ? z + 1 : z, [B.planks, B.clay, B.oakLog][Math.floor(hash(x, z, seed + 12) * 3)]);
    }
    this.put((r[0] + r[2]) >> 1, gy, (r[1] + r[3]) >> 1, B.water);
  },
  garden(r, gy, style, seed) {
    this.flattenRaw(r, gy, B.grass);
    const tree = style === 'egyptian' || style === 'mesopotamian' || style === 'indus' || style === 'persian' ? palm : style === 'khmer' ? palm : oak;
    const mx = (r[0] + r[2]) >> 1, mz = (r[1] + r[3]) >> 1;
    // Paths in a cross with a pool in the middle (like a Persian four-part garden).
    for (let x = r[0]; x <= r[2]; x++) this.put(x, gy - 1, mz, B.gravel);
    for (let z = r[1]; z <= r[3]; z++) this.put(mx, gy - 1, z, B.gravel);
    this.put(mx, gy - 1, mz, B.water);
    for (const [x, z] of [[r[0] + 1, r[1] + 1], [r[2] - 1, r[1] + 1], [r[0] + 1, r[3] - 1], [r[2] - 1, r[3] - 1]]) tree(this.w, x, gy, z, seed + x);
    for (let z = r[1]; z <= r[3]; z++) for (let x = r[0]; x <= r[2]; x++) if (x !== mx && z !== mz && this.w.get(x, gy, z) === 0 && hash(x, z, seed + 13) < 0.3) this.raw(x, gy, z, [B.redFlower, B.yellowFlower, B.tallGrass][Math.floor(hash(x, z, seed + 14) * 3)]);
  },
  /// Level a rectangle to gy (top block `top`) with no blending, and clear it.
  flattenRaw(r, gy, top) {
    for (let z = r[1]; z <= r[3]; z++) for (let x = r[0]; x <= r[2]; x++) {
      for (let y = 1; y < gy - 1; y++) if (!SOLID[this.w.get(x, y, z)] || WATERY[this.w.get(x, y, z)]) this.raw(x, y, z, B.dirt);
      this.put(x, gy - 1, z, top);
      for (let y = gy; y < Math.min(gy + 14, H); y++) if (this.w.get(x, y, z) !== 0) this.put(x, y, z, 0);
    }
  },
  cityWall(spec, ok, inShape) {
    const { cx, cz, R } = spec, wl = spec.wall, h = wl.h ?? 6;
    const ring = (x, z) => spec.shape === 'circle' ? Math.hypot(x - cx, z - cz) > R - 2 && Math.hypot(x - cx, z - cz) <= R : Math.max(Math.abs(x - cx), Math.abs(z - cz)) >= R - 1;
    const gate = (x, z) => Math.abs(x - cx) <= 2 || Math.abs(z - cz) <= 2;
    for (let z = cz - R; z <= cz + R; z++) for (let x = cx - R; x <= cx + R; x++) {
      if (!inShape(x, z) || !ring(x, z) || !ok(x, z)) continue;
      const g = this.ground(x, z);
      const along = Math.abs(x - cx) >= Math.abs(z - cz) ? z - cz : x - cx;
      const tower = (Math.abs(along) % 12 >= 5 && Math.abs(along) % 12 <= 7) || Math.abs(along) >= R - 2;
      const top = g + h + (tower ? 3 : 0);
      if (gate(x, z)) {
        // A gateway: an opening with a lintel and a tower each side.
        this.fill(x, g, z, x, g + 3, z, 0);
        this.fill(x, g + 4, z, x, top, z, wl.gateB ?? wl.b);
        continue;
      }
      this.fill(x, Math.max(1, g - 1), z, x, top, z, wl.b);
      for (let y = top + 1; y < top + 4; y++) this.put(x, y, z, 0);
      if ((x + z) % 2 === 0) this.put(x, top + 1, z, wl.b);
      if (wl.trim && (x + z) % 3 === 0) this.put(x, g + Math.floor(h / 2), z, wl.trim);
    }
    if (spec.moat) {
      for (let z = cz - R - 4; z <= cz + R + 4; z++) for (let x = cx - R - 4; x <= cx + R + 4; x++) {
        const d = spec.shape === 'circle' ? Math.hypot(x - cx, z - cz) - R : Math.max(Math.abs(x - cx), Math.abs(z - cz)) - R;
        if (d < 2 || d > 4 || !this.w.inb(x, z) || gate(x, z)) continue;
        if (this.w.hasWater(x, z) || this.w.protected.has(this.w.idx(x, this.ground(x, z) - 1, z))) continue;
        const g = this.ground(x, z);
        if (g > WL + 8) continue;
        for (let y = g - 3; y < g - 1; y++) this.raw(x, y, z, B.water);
        this.raw(x, g - 4, z, B.clay);
        for (let y = g - 1; y < g + 4; y++) this.raw(x, y, z, 0);
      }
    }
  },

  // ---------- famous buildings ----------
  ring(cx, cz, y0, y1, rOut, rIn, b) { for (let z = Math.floor(cz - rOut - 1); z <= cz + rOut + 1; z++) for (let x = Math.floor(cx - rOut - 1); x <= cx + rOut + 1; x++) { const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz); if (d <= rOut && d > rIn) this.fill(x, y0, z, x, y1, z, b); } },
  disc(cx, cz, y, r, b) { for (let z = Math.floor(cz - r - 1); z <= cz + r + 1; z++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) <= r) this.put(x, y, z, b); },
  dome(cx, cz, y0, r, b, oculus = 0) {
    for (let y = 0; y <= r; y++) for (let z = Math.floor(cz - r - 1); z <= cz + r + 1; z++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5, z + 0.5 - cz), hz = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      if (d <= r && d > r - 1.3 && hz >= oculus) this.put(x, y0 + y, z, b);
    }
  },
  colonnadeRect(x0, z0, x1, z1, y, h, b = B.column, step = 2) {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if ((x === x0 || x === x1 || z === z0 || z === z1) && ((x - x0) % step === 0 || x === x1) && ((z - z0) % step === 0 || z === z1)) this.fill(x, y, z, x, y + h - 1, z, b);
  },
  gableRoof(x0, z0, x1, z1, y, b, alongX = true) {
    const span = alongX ? z1 - z0 + 1 : x1 - x0 + 1;
    for (let k = 0; 2 * k < span; k++) {
      if (alongX) this.fill(x0, y + k, z0 + k, x1, y + k, z1 - k, b);
      else this.fill(x0 + k, y + k, z0, x1 - k, y + k, z1, b);
    }
  },
  obelisk(x, z, gy, h, b = B.granite) { this.fill(x - 1, gy, z - 1, x + 1, gy, z + 1, B.stoneBricks); this.fill(x, gy + 1, z, x, gy + h, z, b); this.put(x, gy + h + 1, z, B.goldBlock); },
  statue(x, z, gy, b = B.goldBlock) { this.fill(x - 1, gy, z - 1, x + 1, gy + 1, z + 1, B.marble); this.fill(x, gy + 2, z, x, gy + 4, z, b); this.put(x - 1, gy + 4, z, b); this.put(x + 1, gy + 4, z, b); this.put(x, gy + 5, z, b); },
  stepPyramid(cx, cz, gy, halves, tierH, b, inner, stairDir, stairB) {
    this.stepped(cx, cz, gy, halves, tierH, b, inner);
    const height = halves.length * tierH;
    if (stairDir) this.stairs(cx, cz, gy, halves[0], height, stairDir, stairB ?? b, 1);
  },
  theater(x0, z0, gy, r, facing, b = B.limestone) {
    // A Greek or Roman theatre: a half circle of stone seats rising round a round stage floor.
    const cx = x0 + r, cz = facing > 0 ? z0 : z0 + r;
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (dz * facing < 0) continue;
      const d = Math.hypot(dx, dz), x = cx + dx, z = cz + dz;
      if (d > r) continue;
      if (d <= 3.2) { this.put(x, gy - 1, z, B.marble); continue; }
      const row = Math.min(Math.floor(d - 3), r - 3);
      this.fill(x, gy, z, x, gy + row - 1, z, b);
      if (Math.abs(dx) <= 0 && row > 0) this.fill(x, gy + Math.max(row - 1, 0), z, x, gy + row - 1, z, B.stoneBricks);
    }
    // The stage building behind the round floor.
    this.fill(cx - r + 2, gy, cz - facing * 2, cx + r - 2, gy + 3, cz - facing * 2, B.limestone);
    for (let x = cx - r + 3; x <= cx + r - 3; x += 2) this.fill(x, gy, cz - facing * 1, x, gy + 2, cz - facing * 1, B.column);
  },

  // ---------- Chinese buildings ----------
  /// A hip roof: rings of tiles stepping in and up until they meet in a ridge.
  hipRoof(x0, z0, x1, z1, y, b) {
    for (let k = 0; ; k++) {
      const a = x0 + k, c = x1 - k, d = z0 + k, e = z1 - k;
      if (a > c || d > e) break;
      if (c - a <= 1 || e - d <= 1) { this.fill(a, y + k, d, c, y + k, e, b); break; }
      for (let z = d; z <= e; z++) for (let x = a; x <= c; x++) if (x === a || x === c || z === d || z === e) this.put(x, y + k, z, b);
    }
    // The corners curl up, the way Chinese roofs do.
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) this.put(x, y + 1, z, b);
  },
  /// A Chinese hall: terraces, red pillars and walls, and one or two hip roofs (eaves: 2 for the grandest halls).
  hall(x0, z0, x1, z1, gy, o = {}) {
    const roofB = o.roof ?? B.yellowRoof, wallB = o.wall ?? B.redLacquer, h = o.h ?? 4, terr = o.terrace ?? 0, terrB = o.terraceB ?? B.marble, front = o.front ?? 1;
    for (let t = 0; t < terr; t++) { const m = 2 * (terr - t); this.fill(x0 - m, gy + t, z0 - m, x1 + m, gy + t, z1 + m, terrB); }
    if (terr) { const m = 2 * terr; for (let t = 0; t < terr; t++) this.fill(((x0 + x1) >> 1) - 1, gy + t, front > 0 ? z1 + 1 + 2 * (terr - t) - 2 : z0 - 1 - 2 * (terr - t) + 2, ((x0 + x1) >> 1) + 1, gy + t, front > 0 ? z1 + m : z0 - m, terrB); }
    const base = gy + terr, top = base + h;
    this.fill(x0, base - 1, z0, x1, base - 1, z1, B.stoneBricks);
    for (let y = base; y < top; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1, inner = x === x0 + 1 || x === x1 - 1 || z === z0 + 1 || z === z1 - 1;
      if (edge) { if (((x - x0) % 2 === 0 && (z === z0 || z === z1)) || ((z - z0) % 2 === 0 && (x === x0 || x === x1))) this.put(x, y, z, wallB); else this.put(x, y, z, 0); }
      else if (inner && x > x0 && x < x1 && z > z0 && z < z1) this.put(x, y, z, y === top - 1 ? wallB : (y >= base + 1 && y <= base + 2 && (x + z) % 3 === 0 ? B.glass : wallB));
      else this.put(x, y, z, 0);
    }
    // Doors in the front wall.
    const fz = front > 0 ? z1 - 1 : z0 + 1, mx = (x0 + x1) >> 1;
    for (let x = mx - 1; x <= mx + 1; x++) this.fill(x, base, fz, x, base + 2, fz, 0);
    this.fill(x0, top, z0, x1, top, z1, wallB);
    if ((o.eaves ?? 1) >= 2) {
      // The lower roof skirt, then a short upper storey and the main roof above it.
      for (let z = z0 - 2; z <= z1 + 2; z++) for (let x = x0 - 2; x <= x1 + 2; x++) if (x < x0 || x > x1 || z < z0 || z > z1) this.put(x, top + ((x < x0 - 1 || x > x1 + 1 || z < z0 - 1 || z > z1 + 1) ? 0 : 1), z, roofB);
      this.fill(x0 + 1, top + 1, z0 + 1, x1 - 1, top + 2, z1 - 1, wallB);
      this.hipRoof(x0, z0, x1, z1, top + 3, roofB);
    } else this.hipRoof(x0 - 1, z0 - 1, x1 + 1, z1 + 1, top + 1, roofB);
  },
  /// A city gate: a thick wall block with a passage through it, and a hall on top.
  gateTower(x0, z0, x1, z1, gy, wallB, roofB, alongX = true) {
    this.fill(x0, gy, z0, x1, gy + 5, z1, wallB);
    const mx = (x0 + x1) >> 1, mz = (z0 + z1) >> 1;
    if (alongX) this.fill(mx - 1, gy, z0, mx + 1, gy + 3, z1, 0); else this.fill(x0, gy, mz - 1, x1, gy + 3, mz + 1, 0);
    this.hall(x0 + 1, z0 + 1, x1 - 1, z1 - 1, gy + 6, { roof: roofB, wall: B.redLacquer, h: 3, terrace: 0 });
  },

  // ---------- the new wonders (Oct 22) ----------
  /// Olympia: the sanctuary of Zeus where the Olympic Games were held. The stadium, the Altis (the sacred walled grove)
  /// with the great Temple of Zeus (and Phidias's giant gold-and-ivory statue inside it), the older Temple of Hera, the
  /// ash altar, the row of treasuries, the round Philippeion, the Zanes and the palaestra where athletes trained.
  olympia(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.grass);
    // The stadium along the north: a sand track about 40 blocks long between grassy banks for the crowd, with stone
    // starting lines at both ends and the vaulted tunnel the athletes walked through.
    const sz0 = cz - 13, sz1 = cz - 10, sx0 = cx - 20, sx1 = cx + 20;
    for (let x = sx0 - 1; x <= sx1 + 1; x++) {
      this.fill(x, gy - 1, sz0, x, gy - 1, sz1, B.sand);
      for (const [z, h] of [[sz0 - 1, 1], [sz0 - 2, 2], [sz1 + 1, 1], [sz1 + 2, 2]]) this.fill(x, gy, z, x, gy + h - 1, z, B.grass);
    }
    for (const x of [sx0, sx1]) for (let z = sz0; z <= sz1; z++) this.put(x, gy - 1, z, B.limestone);
    for (const x of [sx0 - 1, sx1 + 1]) this.fill(x, gy, sz0 - 2, x, gy + 1, sz1 + 2, B.grass);
    this.fill(cx - 15, gy, sz1 + 1, cx - 13, gy + 2, sz1 + 2, B.limestone); this.fill(cx - 14, gy, sz1 + 1, cx - 14, gy + 1, sz1 + 2, 0);   // the krypte
    this.put(cx - 1, gy, sz1 + 2, B.marble); this.put(cx, gy, sz1 + 2, B.marble); this.put(cx + 1, gy, sz1 + 2, B.marble);                      // the judges' seats
    // The Zanes: bronze statues paid for with the fines of athletes caught cheating, lined up where every athlete passed.
    for (let k = 0; k < 8; k++) { const x = cx - 12 + k * 1.5 | 0; this.put(x, gy, sz1 + 4, B.limestone); this.fill(x, gy + 1, sz1 + 4, x, gy + 2, sz1 + 4, B.bronzeBlock); }
    // The Altis: a low wall round the sacred grove.
    const ax0 = cx - 21, ax1 = cx + 8, az0 = cz - 6, az1 = cz + 14;
    for (let x = ax0; x <= ax1; x++) for (const z of [az0, az1]) if (Math.abs(x - (cx - 14)) > 1 && Math.abs(x - cx) > 1) this.put(x, gy, z, B.limestone);
    for (let z = az0; z <= az1; z++) for (const x of [ax0, ax1]) if (Math.abs(z - (cz + 6)) > 1) this.put(x, gy, z, B.limestone);
    // The treasuries: little temples built by Greek cities to hold their gifts to Zeus, on a terrace by the north wall.
    this.fill(cx - 19, gy, cz - 5, cx + 1, gy, cz - 3, B.limestone);
    for (let k = 0; k < 5; k++) {
      const x0 = cx - 19 + k * 4;
      this.fill(x0, gy + 1, cz - 5, x0 + 2, gy + 3, cz - 4, B.marble);
      this.put(x0 + 1, gy + 1, cz - 4, 0); this.put(x0 + 1, gy + 2, cz - 4, 0);
      this.fill(x0, gy + 1, cz - 3, x0, gy + 3, cz - 3, B.column); this.fill(x0 + 2, gy + 1, cz - 3, x0 + 2, gy + 3, cz - 3, B.column);
      this.fill(x0, gy + 4, cz - 5, x0 + 2, gy + 4, cz - 3, B.marble); this.put(x0 + 1, gy + 5, cz - 4, B.marble);
    }
    // The Temple of Hera: the oldest building here. Today the Olympic flame is lit in front of it.
    this.temple(cx - 15, cz + 1, gy, 4, 2, 3, [1, 0]);
    this.put(cx - 9, gy, cz + 1, B.campfire);
    // The great Temple of Zeus on its stepped platform, facing east.
    const tx = cx - 6, tz = cz + 8, P = gy + 2;
    for (let k = 0; k < 2; k++) this.fill(tx - 11 + k, gy + k, tz - 6 + k, tx + 11 - k, gy + k, tz + 6 - k, B.limestone);
    this.fill(tx + 11, gy, tz - 1, tx + 12, gy, tz + 1, B.limestone);
    this.temple(tx, tz, P, 9, 4, 5, [1, 0]);
    this.fill(tx + 7, P + 1, tz - 1, tx + 7, P + 3, tz + 1, 0);          // a wide door
    // Inside: the seated Zeus by Phidias, one of the Seven Wonders of the Ancient World: gold robes, ivory skin,
    // a figure of Nike (Victory) in one hand and a sceptre in the other, on a throne of ebony and gold.
    const zx = tx - 5;
    this.fill(zx - 1, P + 1, tz - 2, zx, P + 1, tz + 2, B.blackMarble);
    this.fill(zx - 1, P + 2, tz - 2, zx - 1, P + 4, tz + 2, B.blackMarble);
    this.fill(zx, P + 2, tz - 1, zx + 1, P + 2, tz + 1, B.goldBlock);      // lap and robe
    this.fill(zx + 1, P + 1, tz - 1, zx + 1, P + 1, tz + 1, B.goldBlock);
    this.fill(zx, P + 3, tz, zx, P + 4, tz, B.marble);                    // ivory body
    this.put(zx, P + 3, tz - 1, B.goldBlock); this.put(zx, P + 3, tz + 1, B.goldBlock);
    this.put(zx, P + 5, tz, B.marble);                                    // head
    this.put(zx + 1, P + 3, tz - 1, B.marble); this.put(zx + 1, P + 4, tz - 1, B.goldBlock);   // Nike in his hand
    this.fill(zx + 1, P + 2, tz + 2, zx + 1, P + 5, tz + 2, B.goldBlock); // sceptre
    for (const z of [tz - 2, tz + 2]) { this.put(tx + 4, P + 1, z, B.lamp); this.put(zx + 3, P + 1, z, B.lamp); this.put(tx, P + 1, z, B.lamp); }   // oil lamps light the statue
    // The great ash altar of Zeus, built up from the ashes of sacrifices.
    this.fill(cx + 1, gy, cz + 1, cx + 3, gy, cz + 3, B.gravel); this.put(cx + 2, gy + 1, cz + 2, B.gravel);
    // The Philippeion: a round building with columns, begun by Philip II of Macedon.
    this.fill(cx - 19, gy, cz + 9, cx - 15, gy, cz + 13, B.marble);
    this.ring(cx - 16.5, cz + 11.5, gy + 1, gy + 3, 2.6, 1.6, B.column);
    this.disc(cx - 16.5, cz + 11.5, gy + 4, 2.6, B.marble); this.disc(cx - 16.5, cz + 11.5, gy + 5, 1.6, B.terracotta);
    // Olive trees in the grove: the winners' crowns were cut from the sacred wild olive with a golden sickle.
    for (const [ox, oz] of [[cx - 1, cz + 12], [cx + 5, cz + 10], [cx + 5, cz - 1], [cx - 3, cz - 1], [cx - 19, cz + 6]]) oak(this.w, ox, gy, oz, ox * 31 + oz);
    // The palaestra, a square of columns round a sandy yard where wrestlers and boxers trained.
    const px0 = cx + 11, px1 = cx + 20, pz0 = cz + 1, pz1 = cz + 12;
    this.fill(px0, gy - 1, pz0, px1, gy - 1, pz1, B.sand);
    this.colonnadeRect(px0, pz0, px1, pz1, gy, 3);
    return gy;
  },
  /// Jerusalem: Herod's Temple Mount, a huge stone platform with porches round it and the Second Temple in its courts.
  jerusalem(cx, cz, r) {
    const gy = this.level(r, WL + 2); this.flatten(r, gy, B.limestone);
    const x0 = r[0] + 1, x1 = r[2] - 1, z0 = r[1] + 1, z1 = r[3] - 1, P = gy + 4;
    // The platform: walls of huge blocks (the Western Wall is part of it), filled in and paved on top.
    this.fill(x0, gy, z0, x1, P - 1, z1, B.jerusalemStone);
    this.fill(x0, P - 1, z0, x1, P - 1, z1, B.limestone);
    // Steps up from the south (to the Huldah Gates) and Robinson's Arch stairway on the west.
    for (let k = 0; k < 4; k++) this.fill(cx - 4, gy + k, z1 + 4 - k, cx + 4, gy + k, z1 + 4 - k, B.jerusalemStone);
    for (let k = 0; k < 4; k++) this.fill(x0 - 4 + k, gy + k, z1 - 6, x0 - 4 + k, gy + k, z1 - 4, B.jerusalemStone);
    // Porches (stoas) round the edge; the Royal Stoa along the south side is the grandest, with four rows of columns.
    for (let x = x0; x <= x1; x += 2) for (const z of [z0, z1, z1 - 2]) this.fill(x, P, z, x, P + 4, z, B.column);
    for (let z = z0; z <= z1; z += 2) for (const x of [x0, x1]) this.fill(x, P, z, x, P + 4, z, B.column);
    this.fill(x0, P + 5, z1 - 2, x1, P + 5, z1, B.limestone); this.gableRoof(x0, z1 - 2, x1, z1, P + 6, B.limestone, true);
    this.fill(x0, P + 5, z0, x1, P + 5, z0, B.limestone); this.fill(x0, P + 5, z0, x0, P + 5, z1, B.limestone); this.fill(x1, P + 5, z0, x1, P + 5, z1, B.limestone);
    // The low stone fence (the soreg) round the inner courts, and the courts raised a step.
    const ix0 = cx - 11, ix1 = cx + 9, iz0 = cz - 5, iz1 = cz + 5;
    for (let z = iz0 - 1; z <= iz1 + 1; z++) for (let x = ix0 - 1; x <= ix1 + 1; x++) if ((x === ix0 - 1 || x === ix1 + 1 || z === iz0 - 1 || z === iz1 + 1) && (x + z) % 4 !== 0) this.put(x, P, z, B.limestone);
    this.fill(ix0, P, iz0, ix1, P, iz1, B.marble);
    // The Court of Women (east), with its gate; the Court of the Priests and the great altar of unhewn stones.
    this.fill(cx + 2, P + 1, iz0, cx + 2, P + 4, iz1, B.jerusalemStone); this.fill(cx + 2, P + 1, cz - 1, cx + 2, P + 3, cz + 1, 0);
    this.fill(cx + 2, P + 1, cz - 1, cx + 2, P + 1, cz + 1, B.goldBlock); this.fill(cx + 2, P + 1, cz - 1, cx + 2, P + 1, cz + 1, 0);
    this.fill(cx - 2, P + 1, cz - 1, cx, P + 2, cz + 1, B.jerusalemStone);             // the altar
    this.fill(cx - 1, P + 1, cz + 2, cx - 1, P + 1, cz + 3, B.jerusalemStone);          // its ramp
    this.put(cx - 1, P + 1, cz - 3, B.bronzeBlock);                                      // the bronze laver for washing
    // The Temple itself, facing east: a tall golden-white front, the Holy Place and the Holy of Holies behind it.
    const tx0 = cx - 11, tx1 = cx - 4;
    this.fill(tx0, P + 1, cz - 3, tx1 - 2, P + 9, cz + 3, B.marble);
    this.fill(tx1 - 1, P + 1, cz - 5, tx1, P + 13, cz + 5, B.marble);
    this.fill(tx1, P + 1, cz - 1, tx1, P + 7, cz + 1, B.goldBlock);                     // the golden doorway and its vine
    this.fill(tx1 - 1, P + 1, cz - 1, tx1 - 1, P + 6, cz + 1, 0);
    for (let z = cz - 5; z <= cz + 5; z += 2) this.put(tx1, P + 13, z, B.goldBlock);    // golden spikes on the roof edge (to keep birds off!)
    for (let x = tx0; x <= tx1 - 2; x += 2) { this.put(x, P + 10, cz - 3, B.goldBlock); this.put(x, P + 10, cz + 3, B.goldBlock); }
    this.fill(tx0 + 1, P + 1, cz - 2, tx0 + 2, P + 4, cz + 2, B.redCloth);              // the curtain before the Holy of Holies
    this.fill(tx0 + 3, P + 1, cz - 2, tx1 - 2, P + 8, cz + 2, 0);
    this.put(tx0 + 5, P + 1, cz, B.goldBlock); this.put(tx0 + 5, P + 2, cz, B.lamp);    // the golden lampstand (menorah)
    // The Antonia Fortress at the north-west corner, with a tall tower at each corner.
    const ax0 = x0 - 1, az0 = z0 - 6;
    this.fill(ax0, gy, az0, ax0 + 8, gy + 8, az0 + 5, B.jerusalemStone);
    this.fill(ax0 + 1, gy + 1, az0 + 1, ax0 + 7, gy + 8, az0 + 4, 0);
    for (const [tx, tz] of [[ax0, az0], [ax0 + 7, az0], [ax0, az0 + 4], [ax0 + 7, az0 + 4]]) this.fill(tx, gy, tz, tx + 1, gy + 11, tz + 1, B.jerusalemStone);
    this.fill(ax0 + 3, gy, az0 + 5, ax0 + 5, gy + 2, az0 + 5, 0);
    return gy;
  },
  /// Carthage: the round military harbour (the cothon), with the admiral's island and sheds for warships all round it.
  carthage(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.sand);
    const R1 = 11, R0 = 5.5, wy = gy - 1;
    // The ring of water, three deep, with a stone quay round both edges.
    for (let z = cz - R1 - 2; z <= cz + R1 + 2; z++) for (let x = cx - R1 - 2; x <= cx + R1 + 2; x++) {
      const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      if (d < R1 && d > R0) { this.fill(x, wy - 3, z, x, wy - 3, z, B.sandstone); for (let y = wy - 2; y <= wy; y++) this.raw(x, y, z, B.water); for (let y = gy; y < gy + 8; y++) this.raw(x, y, z, 0); }
      else if ((d >= R1 && d < R1 + 1.5) || (d <= R0 && d > R0 - 1.2)) this.put(x, gy - 1, z, B.stoneBricks);
    }
    // The channel out to the trading harbour, to the south.
    for (let z = cz + R1 - 1; z <= cz + R1 + 6; z++) for (let x = cx - 1; x <= cx + 1; x++) { this.fill(x, wy - 3, z, x, wy - 3, z, B.sandstone); for (let y = wy - 2; y <= wy; y++) this.raw(x, y, z, B.water); for (let y = gy; y < gy + 8; y++) this.raw(x, y, z, 0); }
    // The rectangular trading harbour.
    for (let z = cz + R1 + 6; z <= cz + R1 + 13; z++) for (let x = cx - 7; x <= cx + 7; x++) {
      if (z === cz + R1 + 13 || Math.abs(x - cx) === 7) { this.put(x, gy - 1, z, B.stoneBricks); continue; }
      this.fill(x, wy - 3, z, x, wy - 3, z, B.sandstone); for (let y = wy - 2; y <= wy; y++) this.raw(x, y, z, B.water); for (let y = gy; y < gy + 8; y++) this.raw(x, y, z, 0);
    }
    // Ship sheds: rows of columns with sloping roofs round the island and round the outer ring.
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      for (const [rad, h] of [[R0 - 0.5, 3], [R1 + 0.6, 3]]) {
        const x = Math.floor(cx + Math.cos(a) * rad), z = Math.floor(cz + Math.sin(a) * rad);
        if (Math.abs(x - cx) <= 1 && z > cz && rad > R1) continue;      // leave the channel open
        if (k % 2 === 0) this.fill(x, gy, z, x, gy + h - 1, z, B.column);
        this.put(x, gy + h, z, B.limestone);
      }
    }
    // The admiral's headquarters on the island: a round tower he could watch the fleet and the sea from.
    this.disc(cx, cz, gy - 1, R0 - 1, B.limestone);
    this.ring(cx, cz, gy, gy + 9, 2.6, 1.5, B.plaster);
    this.fill(cx, gy, cz + 2, cx, gy + 2, cz + 2, 0);
    this.disc(cx, cz, gy + 10, 2.6, B.limestone);
    this.ring(cx, cz, gy + 11, gy + 11, 2.6, 1.6, B.plaster);
    this.put(cx, gy + 11, cz, B.purpleCloth);
    // A bridge from the quay to the island.
    this.fill(cx - 1, gy - 1, cz - R1, cx + 1, gy - 1, cz - R0, B.planks);
    return gy;
  },
  /// The Forbidden City: a walled, moated palace; the Meridian Gate; and the great halls on their white marble terraces.
  forbiddenCity(cx, cz, r) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.stoneBricks);
    const x0 = r[0] + 2, x1 = r[2] - 2, z0 = r[1] + 2, z1 = r[3] - 2;
    // The moat and the red palace wall with a yellow-tiled top.
    for (let z = r[1]; z <= r[3]; z++) for (let x = r[0]; x <= r[2]; x++) {
      const edge = x < x0 || x > x1 || z < z0 || z > z1;
      if (edge) { for (let y = gy - 3; y < gy - 1; y++) this.raw(x, y, z, B.water); this.raw(x, gy - 1, z, B.water); this.raw(x, gy - 4, z, B.stoneBricks); }
      else if (x === x0 || x === x1 || z === z0 || z === z1) { this.fill(x, gy, z, x, gy + 6, z, B.brick); this.put(x, gy + 7, z, B.yellowRoof); }
    }
    // Corner towers.
    for (const [x, z] of [[x0, z0], [x1 - 4, z0], [x0, z1 - 4], [x1 - 4, z1 - 4]]) this.hall(x, z, x + 4, z + 4, gy + 7, { h: 2, eaves: 1 });
    // The Meridian Gate (Wumen), in the south wall, with a bridge over the moat.
    const mx = cx;
    this.fill(mx - 1, gy - 1, z1, mx + 1, gy - 1, r[3], B.marble);
    this.gateTower(mx - 5, z1 - 2, mx + 5, z1, gy, B.brick, B.yellowRoof, true);
    // The Gate of Supreme Harmony, with the golden-water stream and its marble bridges in front.
    const gz = z1 - 9;
    for (let x = x0 + 4; x <= x1 - 4; x++) { this.raw(x, gy - 1, gz + 4, B.water); }
    for (const bx of [mx - 3, mx, mx + 3]) this.put(bx, gy - 1, gz + 4, B.marble);
    this.hall(mx - 5, gz - 1, mx + 5, gz + 2, gy, { h: 3, terrace: 1 });
    // The Hall of Supreme Harmony: the biggest hall, on three tiers of white marble, with a double roof.
    const hz = cz - 2;
    this.hall(mx - 8, hz - 3, mx + 8, hz + 3, gy, { h: 4, terrace: 3, eaves: 2 });
    // The Hall of Central Harmony and the Hall of Preserving Harmony behind it.
    this.hall(mx - 2, hz - 8, mx + 2, hz - 5, gy, { h: 3, terrace: 1 });
    this.hall(mx - 6, hz - 13, mx + 6, hz - 10, gy, { h: 3, terrace: 1, eaves: 2 });
    // The Palace of Heavenly Purity, where the emperor lived, at the back.
    this.hall(mx - 5, z0 + 2, mx + 5, z0 + 5, gy, { h: 3, terrace: 1 });
    return gy;
  },
  /// A Three Kingdoms capital's palace: rammed-earth walls, a gate tower and the main hall on an earth terrace.
  threeKingdoms(cx, cz, r, kind) {
    const gy = this.level(r, WL + 1); this.flatten(r, gy, B.gravel);
    const x0 = r[0] + 1, x1 = r[2] - 1, z0 = r[1] + 1, z1 = r[3] - 1;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x === x0 || x === x1 || z === z0 || z === z1) { this.fill(x, gy, z, x, gy + 5, z, B.rammedEarth); if ((x + z) % 2 === 0) this.put(x, gy + 6, z, B.rammedEarth); }
    this.gateTower(cx - 4, z1 - 1, cx + 4, z1 + 1, gy, B.rammedEarth, B.greyRoof, true);
    const roof = kind === 'wu' ? B.greenRoof : B.greyRoof;
    this.hall(cx - 7, cz - 4, cx + 7, cz + 1, gy, { roof, wall: B.redLacquer, h: 4, terrace: 2, terraceB: B.rammedEarth, eaves: 2 });
    // Two watch towers (que) by the gate, a Han dynasty sign of a great palace.
    for (const tx of [cx - 7, cx + 6]) { this.fill(tx, gy, z1 + 2, tx + 1, gy + 7, z1 + 3, B.rammedEarth); this.hipRoof(tx - 1, z1 + 1, tx + 2, z1 + 4, gy + 8, roof); }
    if (kind === 'wei') {
      // Lingyun Terrace: a tall wooden tower Cao Pi built in Luoyang. It was said to sway in the wind but never fall.
      const lx = x0 + 3, lz = z0 + 3;
      for (let k = 0; k < 4; k++) { const y = gy + k * 3; this.fill(lx + k * 0, y, lz, lx + 4, y + 2, lz + 4, B.planks); this.fill(lx + 1, y, lz + 1, lx + 3, y + 2, lz + 3, 0); }
      this.hipRoof(lx - 1, lz - 1, lx + 5, lz + 5, gy + 12, B.greyRoof);
    } else if (kind === 'shu') {
      // Silk drying on racks in the brocade workshops' yard.
      for (let k = 0; k < 4; k++) { const x = x0 + 3 + k * 2; this.fill(x, gy, z0 + 3, x, gy + 3, z0 + 3, B.planks); this.fill(x, gy + 1, z0 + 4, x, gy + 3, z0 + 5, k % 2 ? B.redCloth : B.blueCloth); }
    } else {
      // A tower ship's model in the palace pool: Wu ruled the river.
      this.fill(x0 + 2, gy - 1, z0 + 2, x0 + 9, gy - 1, z0 + 6, B.water);
      this.fill(x0 + 4, gy - 1, z0 + 3, x0 + 7, gy, z0 + 5, B.planks); this.fill(x0 + 5, gy + 1, z0 + 3, x0 + 6, gy + 2, z0 + 5, B.redLacquer);
    }
    return gy;
  },});

// Offsets in rings out from the middle, nearest first (for finding room for a building).
const SPIRAL = (() => { const a = []; for (let z = -36; z <= 36; z += 2) for (let x = -36; x <= 36; x += 2) a.push([x, z]); return a.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1])); })();

// ---------- the cities ----------
// Every plan is written around the wonder that's already there (its anchor x, z). +z is "south" on the map.
const CITY_PLANS = {
  rome: (p) => ({
    cx: p.x - 24, cz: p.z, R: 46, shape: 'square', S: 12, style: 'roman', colonnade: false, markets: 0.08, gardens: 0.05,
    wall: { b: B.limestone, h: 6, trim: B.brick }, keep: [p.rect],
    monuments: [
      { name: 'The Forum', at: [-30, -16], size: [22, 15], ground: B.stoneBricks, plaza: true, build(x0, z0, gy) {
        // Temples round a paved square: Saturn, the round Temple of Vesta, the Senate house and a long basilica.
        this.temple(x0 + 4, z0 + 4, gy, 3, 2, 4, [0, 1]);
        this.fill(x0 + 15, gy, z0 + 1, x0 + 20, gy + 5, z0 + 5, B.brick); this.fill(x0 + 17, gy, z0 + 5, x0 + 18, gy + 2, z0 + 5, 0); this.gableRoof(x0 + 14, z0, x0 + 21, z0 + 6, gy + 6, B.brick, false);
        this.ring(x0 + 11.5, z0 + 3.5, gy, gy + 3, 2.6, 1.6, B.column); this.dome(x0 + 11.5, z0 + 3.5, gy + 4, 2.6, B.brick);
        this.fill(x0 + 1, gy, z0 + 10, x0 + 20, gy, z0 + 14, B.marble);
        this.colonnadeRect(x0 + 1, z0 + 10, x0 + 20, z0 + 14, gy + 1, 4);
        this.fill(x0 + 1, gy + 5, z0 + 10, x0 + 20, gy + 5, z0 + 14, B.limestone); this.gableRoof(x0 + 1, z0 + 10, x0 + 20, z0 + 14, gy + 6, B.brick, true);
        this.statue(x0 + 11, z0 + 7, gy);
      } },
      { name: "Trajan's Column", at: [-36, -22], size: [5, 5], build(x0, z0, gy) { this.fill(x0 + 1, gy, z0 + 1, x0 + 3, gy + 1, z0 + 3, B.marble); this.fill(x0 + 2, gy + 2, z0 + 2, x0 + 2, gy + 15, z0 + 2, B.column); this.fill(x0 + 1, gy + 16, z0 + 1, x0 + 3, gy + 16, z0 + 3, B.marble); this.fill(x0 + 2, gy + 17, z0 + 2, x0 + 2, gy + 18, z0 + 2, B.goldBlock); } },
      { name: 'The Pantheon', at: [-26, -43], size: [17, 23], build(x0, z0, gy) {
        const cx = x0 + 8.5, cz = z0 + 8.5;
        this.ring(cx, cz, gy, gy + 7, 8.5, 7.2, B.brick);
        this.disc(cx, cz, gy - 1, 7.5, B.marble);
        this.dome(cx, cz, gy + 8, 8.5, B.limestone, 1.4);
        this.fill(x0 + 7, gy, z0 + 15, x0 + 9, gy + 3, z0 + 17, 0);
        // The porch of columns in front.
        this.fill(x0 + 3, gy - 1, z0 + 16, x0 + 13, gy - 1, z0 + 22, B.marble);
        for (let x = x0 + 3; x <= x0 + 13; x += 2) for (const z of [z0 + 22, z0 + 19]) this.fill(x, gy, z, x, gy + 5, z, B.column);
        this.fill(x0 + 3, gy + 6, z0 + 16, x0 + 13, gy + 6, z0 + 22, B.marble);
        this.gableRoof(x0 + 3, z0 + 16, x0 + 13, z0 + 22, gy + 7, B.marble, false);
      } },
      { name: 'The Circus Maximus', at: [-30, 16], size: [46, 15], build(x0, z0, gy) {
        // A long racetrack with tiers of seats, a central barrier with an obelisk, and starting gates.
        const x1 = x0 + 45, z1 = z0 + 14, mz = z0 + 7;
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
          const end = x > x1 - 7 ? Math.hypot(x - (x1 - 7), z - mz) : Math.abs(z - mz);
          if (end > 7.5) continue;
          if (end > 5) { const k = Math.floor(end - 5); this.fill(x, gy, z, x, gy + k + 1, z, B.limestone); this.put(x, gy + k + 2, z, k === 2 ? B.brick : B.limestone); }
          else this.put(x, gy - 1, z, B.sand);
        }
        this.fill(x0 + 8, gy, mz, x1 - 10, gy, mz, B.stoneBricks);
        this.obelisk((x0 + x1) >> 1, mz, gy + 1, 7);
        for (const x of [x0 + 8, x1 - 10]) this.fill(x, gy + 1, mz, x, gy + 3, mz, B.goldBlock);
        for (let z = z0 + 2; z <= z1 - 2; z++) { this.fill(x0, gy, z, x0, gy + 3, z, B.limestone); if ((z - z0) % 2 === 0) this.fill(x0, gy, z, x0, gy + 1, z, 0); }
      } },
      { name: 'The Baths of Trajan', at: [10, -35], size: [22, 15], build(x0, z0, gy) {
        const x1 = x0 + 21, z1 = z0 + 14;
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x === x0 || x === x1 || z === z0 || z === z1) this.fill(x, gy, z, x, gy + 6, z, B.brick);
        for (const x of [x0 + 7, x0 + 14]) for (let z = z0; z <= z1; z++) this.fill(x, gy, z, x, gy + 6, z, B.brick);
        for (const x of [x0 + 7, x0 + 14]) this.fill(x, gy, z0 + 6, x, gy + 2, z0 + 8, 0);
        this.fill(x0 + 10, gy, z1, x0 + 11, gy + 2, z1, 0);
        // A cold pool, a warm pool and a hot pool.
        for (const [a, b] of [[x0 + 2, x0 + 5], [x0 + 9, x0 + 12], [x0 + 16, x0 + 19]]) { this.fill(a, gy - 2, z0 + 3, b, gy - 2, z1 - 3, B.marble); this.fill(a, gy - 1, z0 + 3, b, gy - 1, z1 - 3, B.water); }
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if ((x - x0) % 7 !== 3 || (z - z0) % 7 !== 3) this.put(x, gy + 7, z, B.brick);
        for (const x of [x0 + 3.5, x0 + 10.5, x0 + 17.5]) this.dome(x, z0 + 7.5, gy + 8, 3.5, B.limestone, 0.8);
      } },
      { name: 'The Aqueduct', at: [26, -18], size: [20, 3], need: 0.6, noFlatten: true, build(x0, z0, gy) {
        // Arches on piers carrying a water channel across the valley into the city.
        let top = 0;
        for (let x = x0; x <= x0 + 19; x++) top = Math.max(top, this.ground(x, z0 + 1));
        top = Math.min(top + 8, H - 6);
        for (let x = x0; x <= x0 + 19; x++) {
          const g = this.ground(x, z0 + 1), pier = (x - x0) % 4 === 0;
          for (let z = z0; z <= z0 + 2; z++) {
            if (pier) this.fill(x, g - 1, z, x, top, z, B.limestone);
            else { this.fill(x, top - 1, z, x, top, z, B.limestone); if ((x - x0) % 4 !== 2) this.put(x, top - 2, z, B.limestone); }
          }
          this.put(x, top + 1, z0, B.limestone); this.put(x, top + 1, z0 + 2, B.limestone); this.put(x, top + 1, z0 + 1, B.water);
        }
        this.put(x0 - 1, top + 1, z0 + 1, B.limestone); this.put(x0 + 20, top + 1, z0 + 1, B.limestone);
      } },
    ],
  }),
  athens: (p) => ({
    cx: p.x - 4, cz: p.z - 2, R: 34, shape: 'circle', S: 10, style: 'greek', markets: 0.05, gardens: 0.08,
    wall: { b: B.limestone, h: 5 }, keep: [p.rect],
    monuments: [
      { name: 'The Agora', at: [-30, -24], size: [20, 15], ground: B.gravel, plaza: true, build(x0, z0, gy) {
        // The marketplace and meeting place, with the long Stoa (a covered walkway with shops) along one side.
        this.fill(x0, gy - 1, z0 + 11, x0 + 19, gy - 1, z0 + 14, B.limestone);
        for (let x = x0; x <= x0 + 19; x++) { this.fill(x, gy, z0 + 14, x, gy + 5, z0 + 14, B.limestone); if (x % 2 === 0) this.fill(x, gy, z0 + 11, x, gy + 4, z0 + 11, B.column); }
        this.fill(x0, gy + 5, z0 + 11, x0 + 19, gy + 5, z0 + 14, B.limestone);
        this.gableRoof(x0, z0 + 11, x0 + 19, z0 + 14, gy + 6, B.brick, true);
        for (let x = x0 + 2; x <= x0 + 18; x += 4) this.fill(x, gy, z0 + 12, x, gy + 4, z0 + 13, B.limestone);
        this.put(x0 + 10, gy, z0 + 5, B.water); this.fill(x0 + 9, gy - 1, z0 + 4, x0 + 11, gy - 1, z0 + 6, B.marble);
        this.statue(x0 + 4, z0 + 4, gy, B.limestone);
      } },
      { name: 'The Temple of Hephaestus', at: [-34, -6], size: [13, 9], build(x0, z0, gy) {
        this.fill(x0, gy, z0, x0 + 12, gy, z0 + 8, B.limestone);
        this.temple(x0 + 6, z0 + 4, gy + 1, 5, 3, 4, [1, 0]);
      } },
      { name: 'The Theatre of Dionysus', at: [-8, 12], size: [21, 13], build(x0, z0, gy) { this.theater(x0, z0, gy, 10, -1); } },
      { name: 'The Pnyx', at: [-30, 10], size: [9, 7], ground: B.stone, build(x0, z0, gy) {
        // Where the citizens' assembly met to vote: a speaker's platform cut into the hill.
        this.fill(x0 + 3, gy, z0 + 1, x0 + 5, gy + 1, z0 + 2, B.stone); this.fill(x0 + 4, gy + 2, z0 + 1, x0 + 4, gy + 2, z0 + 1, B.stone);
        for (let z = z0 + 3; z <= z0 + 6; z++) for (let x = x0; x <= x0 + 8; x++) if ((z + x) % 3 === 0) this.put(x, gy, z, B.limestone);
      } },
    ],
  }),
  giza: (p) => ({
    cx: p.x + 24, cz: p.z + 40, R: 20, shape: 'square', S: 9, style: 'egyptian', markets: 0.12, gardens: 0.04,
    wall: null, keep: [p.rect],
    monuments: [
      { name: 'The Wall of the Crow', at: [-12, -22], size: [36, 3], need: 0.7, build(x0, z0, gy) {
        // A huge stone wall that separated the pyramid builders' town from the pyramids.
        for (let x = x0; x <= x0 + 35; x++) { if (Math.abs(x - (x0 + 18)) <= 1) { this.fill(x, gy + 4, z0, x, gy + 7, z0 + 2, B.limestone); continue; } this.fill(x, gy, z0, x, gy + 7, z0 + 2, B.limestone); }
      } },
      { name: 'The Bakeries', at: [8, -18], size: [12, 8], plaza: true, build(x0, z0, gy) {
        for (let k = 0; k < 3; k++) {
          const x = x0 + k * 4;
          this.fill(x, gy, z0, x + 2, gy + 2, z0 + 5, B.mudBrick); this.fill(x + 1, gy, z0 + 1, x + 1, gy + 1, z0 + 4, 0); this.fill(x + 1, gy, z0 + 5, x + 1, gy + 1, z0 + 5, 0);
          this.put(x + 1, gy, z0 + 2, B.campfire);
          this.put(x + 1, gy + 2, z0 + 2, 0);
        }
      } },
    ],
    extra(st, p, out) {
      const cx = p.x, cz = p.z, gy = p.ground;
      st.site = out.siteNo;
      // The queens' pyramids beside the Great Pyramid, rows of mastaba tombs, and the causeway to the valley temple.
      for (const dz of [-6, -1, 4]) st.pyramid(cx + 12, cz + dz, 2, gy, B.limestone, B.limestone);
      for (let k = 0; k < 8; k++) {
        const mx = cx - 27 + (k % 4) * 5, mz = cz - 10 + Math.floor(k / 4) * 5;
        if (st.w.hasWater(mx, mz)) continue;
        const g = st.ground(mx, mz);
        st.fill(mx, g, mz, mx + 4, g + 1, mz + 2, B.limestone); st.fill(mx + 1, g + 2, mz, mx + 3, g + 2, mz + 2, B.limestone);
      }
      const vx = cx + 8, vz = cz + 17;
      st.fill(vx - 2, gy, vz - 2, vx + 2, gy + 3, vz + 2, B.granite);
      st.fill(vx - 2, gy, vz, vx - 2, gy + 1, vz, 0);
      for (let x = cx - 4; x < vx - 2; x++) st.fill(x, gy - 1, cz + 15, x, gy, cz + 17, B.limestone);
    },
  }),
  alexandria: (p) => ({
    cx: p.x + 2, cz: p.z + 8, R: 30, shape: 'square', S: 11, style: 'greek', colonnade: true, markets: 0.08, gardens: 0.06,
    wall: { b: B.limestone, h: 6 }, keep: [p.rect],
    monuments: [
      { name: 'The Tomb of Alexander', at: [6, 6], size: [9, 9], plaza: true, build(x0, z0, gy) { this.fill(x0 + 1, gy, z0 + 1, x0 + 7, gy, z0 + 7, B.marble); this.ring(x0 + 4.5, z0 + 4.5, gy + 1, gy + 4, 3.6, 2.6, B.marble); this.fill(x0 + 4, gy + 1, z0 + 7, x0 + 4, gy + 2, z0 + 7, 0); this.dome(x0 + 4.5, z0 + 4.5, gy + 5, 3.6, B.goldBlock); } },
      { name: 'The Royal Palace', at: [14, -16], size: [18, 14], build(x0, z0, gy) {
        const x1 = x0 + 17, z1 = z0 + 13;
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x === x0 || x === x1 || z === z0 || z === z1) this.fill(x, gy, z, x, gy + 5, z, B.marble);
        this.colonnadeRect(x0 + 3, z0 + 3, x1 - 3, z1 - 3, gy, 4);
        this.garden([x0 + 5, z0 + 5, x1 - 5, z1 - 5], gy, 'egyptian', 77);
        this.fill(x0 + 8, gy, z1, x0 + 9, gy + 2, z1, 0);
        for (let x = x0; x <= x1; x += 2) this.put(x, gy + 6, z0, B.goldBlock);
      } },
      { name: 'The Theatre', at: [-24, 8], size: [19, 11], build(x0, z0, gy) { this.theater(x0, z0, gy, 9, -1); } },
      { name: 'The Serapeum', at: [-28, -22], size: [15, 11], ground: B.granite, build(x0, z0, gy) { this.fill(x0, gy, z0, x0 + 14, gy + 2, z0 + 10, B.granite); this.fill(x0 + 6, gy, z0 + 10, x0 + 8, gy + 2, z0 + 10, B.stoneBricks); this.temple(x0 + 7, z0 + 5, gy + 3, 5, 3, 4, [0, 1]); this.statue(x0 + 7, z0 + 5, gy + 4); } },
    ],
  }),
  babylon: (p) => ({
    cx: p.x, cz: p.z - 18, R: 32, shape: 'square', S: 11, style: 'mesopotamian', markets: 0.08, gardens: 0.03,
    wall: { b: B.mudBrick, h: 8, trim: B.blueTile, gateB: B.blueTile }, moat: true, keep: [p.rect],
    monuments: [
      { name: 'Esagila, the Temple of Marduk', at: [-9, -28], size: [17, 13], build(x0, z0, gy) {
        const x1 = x0 + 16, z1 = z0 + 12;
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x === x0 || x === x1 || z === z0 || z === z1) { this.fill(x, gy, z, x, gy + 5, z, B.mudBrick); if ((x + z) % 5 === 0) this.fill(x, gy, z, x, gy + 7, z, B.mudBrick); }
        for (let x = x0; x <= x1; x++) this.put(x, gy + 4, z1, B.blueTile);
        this.fill(x0 + 7, gy, z1, x0 + 9, gy + 3, z1, 0);
        this.fill(x0 + 5, gy, z0 + 2, x0 + 11, gy + 5, z0 + 6, B.mudBrick); this.fill(x0 + 8, gy, z0 + 6, x0 + 8, gy + 2, z0 + 6, 0);
        this.fill(x0 + 7, gy + 6, z0 + 2, x0 + 9, gy + 6, z0 + 6, B.blueTile);
        this.statue(x0 + 8, z0 + 9, gy);
      } },
      { name: 'The Hanging Gardens (a legend)', at: [12, -6], size: [15, 13], build(x0, z0, gy) {
        // Terraces planted with trees and watered from the river. Nobody has found them, so they may be a legend.
        for (let t = 0; t < 4; t++) {
          const a = x0 + t * 2, b = x0 + 14 - t * 2, c = z0 + t * 2, d = z0 + 12 - t * 2, y = gy + t * 3;
          if (a > b || c > d) break;
          this.fill(a, y, c, b, y + 2, d, B.brick);
          for (let z = c; z <= d; z++) for (let x = a; x <= b; x++) { this.put(x, y + 2, z, B.grass); if ((x === a || x === b || z === c || z === d) && (x + z) % 2 === 0) this.put(x, y + 3, z, B.oakLeaves); }
          if (t < 3) for (let x = a + 1; x <= b - 1; x += 3) this.put(x, y + 1, c, B.water);
        }
        oak(this.w, x0 + 7, gy + 12, z0 + 6, 5);
      } },
      { name: 'The Euphrates bridge', at: [-24, -2], size: [6, 5], need: 0.5, build(x0, z0, gy) {
        // A stretch of the river through the city, crossed by a stone bridge.
        for (let z = z0 - 30; z <= z0 + 30; z++) for (let x = x0; x <= x0 + 5; x++) {
          if (!this.w.inb(x, z)) continue; { const g0 = this.ground(x, z); if (this.w.protected.has(this.w.idx(x, g0 - 1, z)) || this.w.protected.has(this.w.idx(x, g0, z))) continue; }
          if (Math.abs(z - (z0 + 2)) <= 1) { const g = this.ground(x, z); this.fill(x, g - 1, z, x, g - 1, z, B.stoneBricks); if (x === x0 || x === x0 + 5) this.put(x, g, z, B.stoneBricks); continue; }
          const g = this.ground(x, z);
          if (g > WL + 6) continue;
          for (let y = g - 4; y < g - 1; y++) this.raw(x, y, z, B.water);
          this.raw(x, g - 5, z, B.clay);
          for (let y = g - 1; y < g + 6; y++) this.raw(x, y, z, 0);
        }
      } },
    ],
  }),
  persepolis: (p) => ({
    cx: p.x - 2, cz: p.z, R: 32, shape: 'square', S: 10, style: 'persian', markets: 0.06, gardens: 0.1,
    wall: { b: B.stoneBricks, h: 5 }, keep: [p.rect],
    monuments: [
      { name: 'The Hall of a Hundred Columns', at: [14, -8], size: [14, 17], build(x0, z0, gy) {
        const top = Math.max(gy, p.ground + 3);
        this.fill(x0, gy, z0, x0 + 13, top - 1, z0 + 16, B.stoneBricks);
        for (let z = z0 + 2; z <= z0 + 14; z += 2) for (let x = x0 + 2; x <= x0 + 11; x += 2) { const r = hash(x, z, 911), h = r < 0.7 ? 7 : 1 + Math.floor(r * 40) % 4; this.fill(x, top, z, x, top + h - 1, z, B.column); if (h === 7) this.put(x, top + 7, z, B.carvedStone); }
        for (const [a, b] of [[x0, x0 + 1], [x0 + 12, x0 + 13]]) this.fill(a, top, z0 + 7, b, top + 4, z0 + 9, B.carvedStone);
      } },
      { name: 'The Paradise Garden', at: [-30, -8], size: [15, 15], ground: B.grass, build(x0, z0, gy) {
        // A Persian "paradise": a walled garden split in four by water channels, with a pavilion in the middle.
        for (let z = z0; z <= z0 + 14; z++) for (let x = x0; x <= x0 + 14; x++) {
          if (x === x0 || x === x0 + 14 || z === z0 || z === z0 + 14) { this.fill(x, gy, z, x, gy + 2, z, B.mudBrick); continue; }
          if (x === x0 + 7 || z === z0 + 7) this.put(x, gy - 1, z, B.water);
          else if ((x - x0) % 3 === 0 && (z - z0) % 3 === 0) (hash(x, z, 5) < 0.5 ? oak : spruce)(this.w, x, gy, z, x * 7 + z);
          else if (hash(x, z, 6) < 0.25) this.raw(x, gy, z, B.redFlower);
        }
        this.fill(x0 + 7, gy, z0, x0 + 7, gy + 1, z0, 0);
        this.colonnadeRect(x0 + 5, z0 + 5, x0 + 9, z0 + 9, gy, 4, B.column);
        this.fill(x0 + 5, gy + 4, z0 + 5, x0 + 9, gy + 4, z0 + 9, B.carvedStone);
      } },
      { name: 'The Royal Tombs', at: [24, 12], size: [6, 13], need: 0.6, build(x0, z0, gy) {
        // Kings' tombs cut into the cliff, with a carved cross-shaped front.
        this.fill(x0, gy, z0, x0 + 5, gy + 13, z0 + 12, B.stone);
        for (const zc of [z0 + 3, z0 + 9]) { this.fill(x0, gy + 3, zc - 2, x0, gy + 10, zc + 2, B.carvedStone); this.fill(x0, gy + 5, zc - 1, x0, gy + 7, zc + 1, B.carvedStone); this.fill(x0, gy + 3, zc, x0, gy + 4, zc, 0); this.fill(x0 + 1, gy + 3, zc, x0 + 2, gy + 4, zc, 0); }
      } },
    ],
  }),
  mohenjoDaro: (p) => ({
    cx: p.x + 4, cz: p.z + 14, R: 30, shape: 'square', S: 10, style: 'indus', markets: 0.06, gardens: 0.02,
    wall: null, keep: [p.rect],
    monuments: [
      { name: 'The Granary', at: [10, -26], size: [12, 9], build(x0, z0, gy) {
        // A great brick platform with air channels between its blocks, for storing grain (or perhaps a hall).
        this.fill(x0, gy, z0, x0 + 11, gy + 3, z0 + 8, B.brick);
        for (let x = x0 + 1; x <= x0 + 10; x += 3) this.fill(x, gy + 1, z0, x, gy + 2, z0 + 8, 0);
        this.fill(x0 + 1, gy + 4, z0 + 1, x0 + 10, gy + 4, z0 + 7, B.planks);
        this.colonnadeRect(x0 + 1, z0 + 1, x0 + 10, z0 + 7, gy + 5, 2, B.oakLog, 3);
        this.fill(x0 + 1, gy + 7, z0 + 1, x0 + 10, gy + 7, z0 + 7, B.planks);
      } },
      { name: 'The Pillared Hall', at: [-27, -26], size: [11, 11], build(x0, z0, gy) {
        this.fill(x0, gy - 1, z0, x0 + 10, gy - 1, z0 + 10, B.brick);
        for (let z = z0; z <= z0 + 10; z++) for (let x = x0; x <= x0 + 10; x++) if (x === x0 || x === x0 + 10 || z === z0 || z === z0 + 10) this.fill(x, gy, z, x, gy + 3, z, B.brick);
        for (let z = z0 + 2; z <= z0 + 8; z += 3) for (let x = x0 + 2; x <= x0 + 8; x += 3) this.fill(x, gy, z, x, gy + 3, z, B.brick);
        this.fill(x0 + 5, gy, z0 + 10, x0 + 5, gy + 1, z0 + 10, 0);
        this.fill(x0, gy + 4, z0, x0 + 10, gy + 4, z0 + 10, B.planks);
      } },
      { name: 'A public well', at: [0, 4], size: [5, 5], plaza: true, build(x0, z0, gy) { this.ring(x0 + 2.5, z0 + 2.5, gy, gy, 2.4, 1.2, B.brick); this.fill(x0 + 2, gy - 6, z0 + 2, x0 + 2, gy - 1, z0 + 2, B.water); } },
    ],
  }),
  teotihuacan: (p) => ({
    cx: p.x + 8, cz: p.z + 8, R: 34, shape: 'square', S: 12, style: 'mesoamerican', markets: 0.08, gardens: 0.03,
    wall: null, keep: [p.rect],
    monuments: [
      { name: 'The Temple of the Feathered Serpent', at: [-18, 13], size: [19, 19], build(x0, z0, gy) {
        // The Ciudadela: a huge walled square with a pyramid decorated with stone serpent heads.
        for (let z = z0; z <= z0 + 18; z++) for (let x = x0; x <= x0 + 18; x++) if (x - x0 < 3 || x0 + 18 - x < 3 || z - z0 < 3 || z0 + 18 - z < 3) this.fill(x, gy, z, x, gy + 2, z, B.stone);
        this.fill(x0, gy, z0 + 8, x0 + 2, gy + 2, z0 + 10, 0);
        for (const [dx, dz] of [[1, 1], [17, 1], [1, 17], [17, 17], [9, 1], [9, 17]]) this.stepped(x0 + dx, z0 + dz, gy + 3, [1], 2, B.stone, B.stone);
        const px = x0 + 11, pz = z0 + 9;
        this.stepped(px, pz, gy, [4, 3, 2, 1], 2, B.stone, B.cobblestone);
        this.stairs(px, pz, gy, 4, 7, [-1, 0], B.cobblestone, 0);
        for (let t = 0; t < 4; t++) for (const dz of [-1, 1]) { const y = gy + t * 2 + 1, x = px - 4 + t - 1; this.put(x, y, pz + dz * 2, B.carvedStone); this.put(x - 1, y, pz + dz * 2, B.blueTile); }
      } },
      { name: 'The Great Compound market', at: [4, 14], size: [14, 14], ground: B.gravel, plaza: true, build(x0, z0, gy) { this.market([x0, z0, x0 + 13, z0 + 13], gy, CITY_STYLE.mesoamerican, 31); } },
    ],
    extra(st, p) {
      // The Avenue of the Dead runs on, south past the Sun pyramid, to the Ciudadela.
      const ax = p.x - 12;
      for (let z = p.z + 17; z <= p.z + 44; z++) for (let x = ax - 1; x <= ax + 1; x++) { if (!st.w.inb(x, z) || st.w.hasWater(x, z)) continue; const g = st.ground(x, z); st.raw(x, g - 1, z, B.gravel); for (let y = g; y < g + 4; y++) if (!st.w.protected.has(st.w.idx(x, y, z))) st.raw(x, y, z, 0); }
    },
  }),
  olympia: (p) => ({
    cx: p.x, cz: p.z - 6, R: 32, shape: 'square', S: 9, style: 'greek', markets: 0.1, gardens: 0.1,
    wall: null, keep: [p.rect],
    monuments: [
      { name: 'The Leonidaion', at: [-34, 4], size: [11, 9], build(x0, z0, gy) {
        // A guesthouse for important visitors to the Games, with rooms round a garden courtyard.
        this.fill(x0, gy, z0, x0 + 10, gy, z0 + 8, B.limestone);
        this.colonnadeRect(x0, z0, x0 + 10, z0 + 8, gy + 1, 3);
        this.fill(x0 + 3, gy, z0 + 3, x0 + 7, gy, z0 + 5, B.grass);
        this.put(x0 + 5, gy + 1, z0 + 4, B.water);
      } },
      { name: 'The Workshop of Phidias', at: [24, -20], size: [8, 7], build(x0, z0, gy) {
        // Where the sculptor Phidias built the giant statue of Zeus. Archaeologists found his tools, and a cup scratched
        // with the words "I belong to Phidias".
        this.fill(x0, gy, z0, x0 + 7, gy + 4, z0 + 6, B.brick); this.fill(x0 + 1, gy, z0 + 1, x0 + 6, gy + 3, z0 + 5, 0);
        this.fill(x0 + 3, gy, z0 + 6, x0 + 4, gy + 2, z0 + 6, 0);
        this.fill(x0, gy + 5, z0, x0 + 7, gy + 5, z0 + 6, B.terracotta);
        this.put(x0 + 3, gy, z0 + 3, B.marble); this.put(x0 + 3, gy + 1, z0 + 3, B.goldBlock);
      } },
    ],
  }),
  angkor: (p) => ({
    cx: p.x, cz: p.z - 46, R: 21, shape: 'square', S: 9, style: 'khmer', markets: 0.06, gardens: 0.15,
    wall: { b: B.granite, h: 6, gateB: B.carvedStone }, moat: true, keep: [p.rect],
    monuments: [
      { name: 'The Bayon', at: [-8, -8], size: [17, 17], plaza: true, build(x0, z0, gy) {
        // The temple in the middle of Angkor Thom, with towers carved with huge calm faces.
        const cx = x0 + 8, cz = z0 + 8;
        this.stepped(cx, cz, gy, [8, 6, 4], 2, B.carvedStone, B.stone);
        this.stairs(cx, cz, gy, 8, 5, [0, 1], B.stoneBricks);
        const top = gy + 6;
        for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, -5], [0, 5], [-5, 0], [5, 0]]) {
          this.fill(cx + dx - 1, top - 2, cz + dz - 1, cx + dx + 1, top + 2, cz + dz + 1, B.carvedStone);
          this.put(cx + dx, top + 3, cz + dz, B.carvedStone);
          // A face: two eyes and a mouth on each side.
          for (const [fx, fz] of [[0, -2], [0, 2], [-2, 0], [2, 0]]) { this.put(cx + dx + fx, top + 1, cz + dz + fz, B.stoneBricks); }
        }
        this.fill(cx - 2, top, cz - 2, cx + 2, top + 5, cz + 2, B.carvedStone);
        this.fill(cx - 1, top + 6, cz - 1, cx + 1, top + 7, cz + 1, B.carvedStone);
        this.put(cx, top + 8, cz, B.goldBlock);
      } },
      { name: 'The Terrace of the Elephants', at: [-14, -4], size: [4, 20], build(x0, z0, gy) {
        this.fill(x0, gy, z0, x0 + 2, gy + 2, z0 + 19, B.granite);
        for (let z = z0 + 1; z <= z0 + 18; z += 3) { this.fill(x0 + 3, gy, z, x0 + 3, gy + 2, z, B.stone); this.put(x0 + 3, gy, z + 1, B.stone); }
      } },
    ],
    extra(st, p) {
      // The West Baray: a vast reservoir that stored water for the rice fields.
      const x0 = p.x - 64, z0 = p.z - 52;
      for (let z = z0; z <= z0 + 14; z++) for (let x = x0; x <= x0 + 34; x++) {
        if (!st.w.inb(x, z) || st.w.hasWater(x, z)) continue;
        const g = st.ground(x, z);
        if (g > WL + 6 || st.w.protected.has(st.w.idx(x, g - 1, z))) continue;
        const rim = x === x0 || x === x0 + 34 || z === z0 || z === z0 + 14;
        for (let y = g; y < g + 5; y++) if (!st.w.protected.has(st.w.idx(x, y, z))) st.raw(x, y, z, 0);
        if (rim) { st.raw(x, g - 1, z, B.grass); st.raw(x, g, z, B.dirt); st.raw(x, g + 1, z, B.grass); }
        else { st.raw(x, g - 3, z, B.clay); st.raw(x, g - 2, z, B.water); st.raw(x, g - 1, z, B.water); }
      }
      // Rice paddies outside the walls.
      for (let z = p.z - 30; z <= p.z - 22; z++) for (let x = p.x + 24; x <= p.x + 40; x++) {
        if (!st.w.inb(x, z) || st.w.hasWater(x, z)) continue;
        const g = st.ground(x, z);
        if (st.w.protected.has(st.w.idx(x, g - 1, z)) || g > WL + 8) continue;
        if ((x - p.x) % 5 === 0) { st.raw(x, g - 1, z, B.water); continue; }
        st.raw(x, g - 1, z, B.farmland); st.raw(x, g, z, 50);
      }
    },
  }),
  jerusalem: (p) => ({
    cx: p.x + 4, cz: p.z - 36, R: 24, shape: 'square', S: 9, style: 'judean', markets: 0.08, gardens: 0.05,
    wall: { b: B.jerusalemStone, h: 7 }, keep: [p.rect],
    monuments: [
      { name: "Herod's Palace", at: [-20, 6], size: [12, 10], build(x0, z0, gy) {
        // Herod's palace on the city's west side, guarded by three great towers: Hippicus, Phasael and Mariamne.
        this.fill(x0 + 2, gy, z0 + 2, x0 + 11, gy + 4, z0 + 9, B.jerusalemStone); this.fill(x0 + 3, gy, z0 + 3, x0 + 10, gy + 3, z0 + 8, 0);
        this.fill(x0 + 6, gy, z0 + 9, x0 + 7, gy + 2, z0 + 9, 0);
        this.fill(x0 + 3, gy + 4, z0 + 3, x0 + 10, gy + 4, z0 + 8, B.limestone);
        for (const [tx, tz, h] of [[x0, z0, 12], [x0, z0 + 4, 14], [x0, z0 + 8, 10]]) this.fill(tx, gy, tz, tx + 2, gy + h, tz + 1, B.jerusalemStone);
      } },
      { name: 'The Pool of Siloam', at: [12, 10], size: [9, 7], build(x0, z0, gy) {
        // A big stepped pool where pilgrims washed before going up to the Temple.
        for (let k = 0; k < 3; k++) this.fill(x0 + k, gy - 1 - k, z0 + k, x0 + 8 - k, gy - 1 - k, z0 + 6 - k, B.jerusalemStone);
        this.fill(x0 + 3, gy - 3, z0 + 3, x0 + 5, gy - 3, z0 + 3, B.water);
        for (let k = 0; k < 3; k++) for (let z = z0 + k + 1; z <= z0 + 5 - k; z++) for (let x = x0 + k + 1; x <= x0 + 7 - k; x++) this.put(x, gy - 1 - k, z, 0);
        this.fill(x0 + 3, gy - 3, z0 + 2, x0 + 5, gy - 3, z0 + 4, B.water);
      } },
    ],
  }),
  carthage: (p) => ({
    cx: p.x - 22, cz: p.z - 4, R: 26, shape: 'square', S: 10, style: 'punic', markets: 0.1, gardens: 0.05,
    wall: { b: B.sandstone, h: 8, trim: B.plaster }, keep: [p.rect],
    monuments: [
      { name: 'The Byrsa Hill', at: [-8, -20], size: [13, 13], build(x0, z0, gy) {
        // The citadel hill in the middle of the city, with the temple of Eshmun, god of healing, on top.
        const cx = x0 + 6, cz = z0 + 6;
        this.stepped(cx, cz, gy, [6, 5, 4], 2, B.sandstone, B.dirt);
        this.stairs(cx, cz, gy, 6, 6, [0, 1], B.stoneBricks);
        this.temple(cx, cz, gy + 6, 3, 2, 4, [0, 1]);
      } },
      { name: 'The Agora', at: [6, -10], size: [14, 11], ground: B.stoneBricks, plaza: true, build(x0, z0, gy) {
        this.colonnadeRect(x0, z0, x0 + 13, z0 + 10, gy, 4);
        this.statue(x0 + 7, z0 + 5, gy);
      } },
    ],
  }),
  forbiddenCity: (p) => ({
    cx: p.x, cz: p.z, R: 44, shape: 'square', S: 11, style: 'chinese', markets: 0.07, gardens: 0.06,
    wall: { b: B.stoneBricks, h: 8, gateB: B.redLacquer }, moat: false, keep: [p.rect],
    monuments: [
      { name: 'The Temple of Heaven', at: [22, 22], size: [13, 13], build(x0, z0, gy) {
        // The round Hall of Prayer for Good Harvests: three blue roofs on a three-tiered white marble terrace.
        const cx = x0 + 6.5, cz = z0 + 6.5;
        for (let t = 0; t < 3; t++) this.disc(cx, cz, gy + t, 6 - t, B.marble);
        this.ring(cx, cz, gy + 3, gy + 6, 3.3, 2.2, B.redLacquer);
        this.fill(Math.floor(cx), gy + 3, Math.floor(cz) + 2, Math.floor(cx), gy + 4, Math.floor(cz) + 3, 0);
        for (let k = 0; k < 3; k++) { this.disc(cx, cz, gy + 7 + k * 2, 4.5 - k * 1.2, B.blueTile); this.disc(cx, cz, gy + 8 + k * 2, 3.5 - k * 1.2, B.blueTile); }
        this.put(Math.floor(cx), gy + 13, Math.floor(cz), B.goldBlock);
      } },
      { name: 'Jingshan Hill', at: [-6, -40], size: [13, 9], need: 0.5, build(x0, z0, gy) {
        // A hill made from the earth dug out for the moat, behind the palace, with a pavilion on top.
        const cx = x0 + 6, cz = z0 + 4;
        this.stepped(cx, cz, gy, [6, 4, 2], 2, B.grass, B.dirt);
        this.hall(cx - 1, cz - 1, cx + 1, cz + 1, gy + 6, { h: 2, roof: B.yellowRoof });
      } },
    ],
  }),
  wei: (p) => ({
    cx: p.x, cz: p.z + 14, R: 30, shape: 'square', S: 10, style: 'chinese', markets: 0.08, gardens: 0.04,
    wall: { b: B.rammedEarth, h: 7 }, keep: [p.rect],
    monuments: [
      { name: 'The White Horse Temple', at: [14, 10], size: [11, 13], build(x0, z0, gy) {
        // China's first Buddhist temple, said to be named after the white horse that carried the first holy books from India.
        this.fill(x0, gy, z0, x0 + 10, gy + 2, z0, B.rammedEarth); this.fill(x0 + 4, gy, z0, x0 + 6, gy + 1, z0, 0);
        this.hall(x0 + 2, z0 + 3, x0 + 8, z0 + 7, gy, { roof: B.greyRoof, h: 3, terrace: 1 });
        this.statue(x0 + 5, z0 + 10, gy, B.limestone);
      } },
    ],
  }),
  shu: (p) => ({
    cx: p.x, cz: p.z + 14, R: 28, shape: 'square', S: 10, style: 'chinese', markets: 0.12, gardens: 0.06,
    wall: { b: B.rammedEarth, h: 6 }, keep: [p.rect],
    monuments: [
      { name: 'The Brocade Market', at: [10, 8], size: [12, 10], ground: B.stoneBricks, plaza: true, build(x0, z0, gy) {
        for (let k = 0; k < 3; k++) { const x = x0 + 1 + k * 4; this.fill(x, gy, z0 + 2, x + 2, gy, z0 + 3, B.planks); this.fill(x, gy + 1, z0 + 2, x + 2, gy + 1, z0 + 2, k % 2 ? B.redCloth : B.blueCloth); this.hipRoof(x - 1, z0 + 1, x + 3, z0 + 4, gy + 3, B.greyRoof); for (const px of [x - 1, x + 3]) this.fill(px, gy, z0 + 1, px, gy + 2, z0 + 1, B.planks); }
      } },
    ],
  }),
  wu: (p) => ({
    cx: p.x, cz: p.z + 14, R: 28, shape: 'square', S: 10, style: 'chinese', markets: 0.08, gardens: 0.05,
    wall: { b: B.rammedEarth, h: 6 }, keep: [p.rect],
    monuments: [
      { name: 'The Stone City', at: [-30, 0], size: [11, 11], need: 0.5, build(x0, z0, gy) {
        // Shitoucheng, Wu's fortress on the cliffs above the Yangtze, built of stone where the river runs below.
        for (let z = z0; z <= z0 + 10; z++) for (let x = x0; x <= x0 + 10; x++) if (x === x0 || x === x0 + 10 || z === z0 || z === z0 + 10) { this.fill(x, gy, z, x, gy + 6, z, B.stone); if ((x + z) % 2 === 0) this.put(x, gy + 7, z, B.stone); }
        this.fill(x0 + 5, gy, z0 + 10, x0 + 5, gy + 2, z0 + 10, 0);
        this.hall(x0 + 3, z0 + 3, x0 + 7, z0 + 6, gy, { roof: B.greenRoof, h: 3 });
      } },
    ],
  }),
};

/// Builds every city: replaces the scattered houses with real city plans.
Stamper.prototype.addCities = function (placed, avoid, cityInfo, siteIndex) {
  const result = {};
  const ids = Object.keys(CITY_PLANS).filter((id) => placed[id] && cityInfo[id]);
  const specs = ids.map((id) => ({ id, ...CITY_PLANS[id](placed[id]) }));
  for (const s of specs) {
    const info = cityInfo[s.id];
    s.siteNo = siteIndex[s.id];
    const others = specs.filter((o) => o !== s).map((o) => ({ cx: o.cx, cz: o.cz, R: o.R }));
    // Keep away from the other wonders (not this city's own).
    const notMine = avoid.filter((r) => !(s.keep || []).some((k) => k === r));
    const out = this.layoutCity(s, others, notMine);
    out.siteNo = s.siteNo;
    if (s.extra) s.extra(this, placed[s.id], out);
    out.count = crowdSize(info.population);
    result[s.id] = out;
  }
  return result;
};
