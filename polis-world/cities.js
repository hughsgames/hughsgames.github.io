// Polis World 2: the great cities at life size.
//
// A city is worked out a column at a time, so any chunk of it can be built on its own, in any order, and always comes
// out the same. Each city has a style (what its houses, roofs, roads and walls are made of), a street grid, a wall with
// gates, and its monuments at their real sizes: the Great Pyramid is 230 m across and 146 m high (460 and 293
// half-metre blocks), the Colosseum 189 × 156 m and 48 m high.
//
// No DOM, no imports from the page: geo.js calls `cityColumn` while it makes a chunk.

const B = {
  grass: 1, dirt: 2, stone: 3, sand: 4, gravel: 5, sandstone: 21, cobble: 22, planks: 23, palmLeaf: 25, oakLog: 7, oakLeaf: 8,
  fence: 34, door: 35, water: 40, brick: 41, marble: 42, blueTile: 43, column: 44, gold: 45, lamp: 46, limestone: 52, mudBrick: 53,
  carved: 54, stoneBrick: 55, torch: 56, granite: 61, blackMarble: 62, ladder: 73, yellowTile: 90, greenTile: 91, redWood: 92,
  glass: 93, terracotta: 94, mosaic: 95, plaster: 96, bronze: 97, redCloth: 98, blueCloth: 99, jerusalem: 100, greyTile: 103,
  rammed: 104, purpleCloth: 105, palmLog: 24, jungleLeaf: 125, farmland: 51, wheat: 50,
};

// What each kind of city is built of.
const STYLES = {
  egypt: { wall: B.mudBrick, house: [B.mudBrick, B.mudBrick, B.plaster], trim: B.sandstone, road: B.sandstone, plaza: B.sandstone, roof: 'flat', storeys: [1, 2], cityWall: B.mudBrick, tree: 'palm', lot: 20 },
  mesopotamia: { wall: B.mudBrick, house: [B.mudBrick, B.mudBrick, B.brick], trim: B.brick, road: B.brick, plaza: B.brick, roof: 'flat', storeys: [1, 2], cityWall: B.brick, tree: 'palm', lot: 20 },
  persia: { wall: B.limestone, house: [B.mudBrick, B.plaster], trim: B.carved, road: B.limestone, plaza: B.limestone, roof: 'flat', storeys: [1, 2], cityWall: B.mudBrick, tree: 'cypress', lot: 22 },
  indus: { wall: B.brick, house: [B.brick], trim: B.brick, road: B.brick, plaza: B.brick, roof: 'flat', storeys: [1, 2], cityWall: B.brick, tree: 'none', lot: 18 },
  china: { wall: B.rammed, house: [B.plaster, B.stoneBrick], trim: B.redWood, road: B.stoneBrick, plaza: B.stoneBrick, roof: 'grey', storeys: [1, 1, 2], cityWall: B.stoneBrick, tree: 'cherry', lot: 24 },
  neolithic: { wall: B.rammed, house: [B.rammed, B.planks], trim: B.planks, road: B.dirt, plaza: B.rammed, roof: 'thatch', storeys: [1], cityWall: B.rammed, tree: 'oak', lot: 22 },
  khmer: { wall: B.sandstone, house: [B.planks, B.planks, B.redWood], trim: B.planks, road: B.dirt, plaza: B.sandstone, roof: 'thatch', storeys: [1], cityWall: B.sandstone, tree: 'palm', lot: 22, stilts: true },
  roman: { wall: B.brick, house: [B.plaster, B.plaster, B.brick], trim: B.marble, road: B.cobble, plaza: B.marble, roof: 'tile', storeys: [2, 3, 4], cityWall: B.stoneBrick, tree: 'cypress', lot: 20 },
  greek: { wall: B.limestone, house: [B.plaster, B.plaster, B.limestone], trim: B.marble, road: B.limestone, plaza: B.marble, roof: 'tile', storeys: [1, 2], cityWall: B.limestone, tree: 'olive', lot: 20 },
  punic: { wall: B.limestone, house: [B.plaster, B.plaster, B.sandstone], trim: B.sandstone, road: B.limestone, plaza: B.limestone, roof: 'flat', storeys: [2, 3, 4], cityWall: B.limestone, tree: 'palm', lot: 18 },
  renaissance: { wall: B.stoneBrick, house: [B.plaster, B.stoneBrick, B.plaster], trim: B.stoneBrick, road: B.cobble, plaza: B.stoneBrick, roof: 'tile', storeys: [3, 4], cityWall: B.stoneBrick, tree: 'cypress', lot: 18 },
  levant: { wall: B.jerusalem, house: [B.jerusalem], trim: B.jerusalem, road: B.jerusalem, plaza: B.jerusalem, roof: 'flat', storeys: [1, 2], cityWall: B.jerusalem, tree: 'olive', lot: 18 },
  maya: { wall: B.limestone, house: [B.plaster, B.rammed], trim: B.limestone, road: B.plaster, plaza: B.plaster, roof: 'thatch', storeys: [1], cityWall: B.limestone, tree: 'palm', lot: 26, sparse: true },
  mesoamerica: { wall: B.limestone, house: [B.plaster, B.limestone], trim: B.terracotta, road: B.plaster, plaza: B.plaster, roof: 'flat', storeys: [1], cityWall: B.limestone, tree: 'none', lot: 24 },
  bank: { wall: B.marble, house: [B.marble], trim: B.gold, road: B.marble, plaza: B.marble, roof: 'flat', storeys: [1], cityWall: B.marble, tree: 'none', lot: 30 },
};

// Each city: its style, whether it has a wall, and its monuments (positions in blocks from the city's centre; sizes
// in blocks, which are half a metre).
const PLANS = {
  giza: { style: 'egypt', walls: false, houseFrom: 250, monuments: [
    { kind: 'pyramid', u: -500, v: -700, w: 460, h: 293, name: 'Great Pyramid of Khufu' },
    { kind: 'pyramid', u: -1080, v: -140, w: 430, h: 272, name: 'Pyramid of Khafre' },
    { kind: 'pyramid', u: -1480, v: 420, w: 206, h: 130, name: 'Pyramid of Menkaure' },
    { kind: 'sphinx', u: -320, v: 120, name: 'Great Sphinx' },
  ], houseZone: (u) => u > 150 },
  memphis: { style: 'egypt', walls: true, monuments: [{ kind: 'pylonTemple', u: 0, v: 0, w: 160, d: 300, h: 60, name: 'Temple of Ptah' }] },
  thebes: { style: 'egypt', walls: false, monuments: [
    { kind: 'pylonTemple', u: -300, v: -200, w: 220, d: 520, h: 86, name: 'Karnak' },
    { kind: 'pylonTemple', u: 300, v: 900, w: 120, d: 380, h: 48, name: 'Luxor Temple' },
  ] },
  alexandria: { style: 'greek', walls: true, monuments: [
    { kind: 'lighthouse', u: 300, v: -1500, w: 60, h: 200, name: 'Lighthouse of Alexandria' },
    { kind: 'greekTemple', u: 0, v: 0, w: 70, d: 140, h: 30, name: 'The Great Library' },
  ] },
  babylon: { style: 'mesopotamia', walls: true, monuments: [
    { kind: 'ziggurat', u: 0, v: 0, w: 182, h: 182, tiers: 7, name: 'Etemenanki' },
    { kind: 'gate', u: 0, v: -2400, w: 60, h: 50, mat: B.blueTile, name: 'Ishtar Gate' },
  ] },
  persepolis: { style: 'persia', walls: true, monuments: [{ kind: 'apadana', u: 0, v: 0, w: 224, h: 40, name: 'Apadana' }] },
  mohenjoDaro: { style: 'indus', walls: false, monuments: [{ kind: 'bath', u: 0, v: -300, w: 60, d: 40, name: 'Great Bath' }] },
  forbiddenCity: { style: 'china', walls: true, monuments: [{ kind: 'palace', u: 0, v: 0, w: 1500, d: 1900, name: 'The Forbidden City' }] },
  wei: { style: 'china', walls: true, monuments: [{ kind: 'hall', u: 0, v: 0, w: 110, d: 60, h: 50, name: 'Palace of Wei' }] },
  shu: { style: 'china', walls: true, monuments: [{ kind: 'hall', u: 0, v: 0, w: 100, d: 56, h: 48, name: 'Palace of Shu' }] },
  wu: { style: 'china', walls: true, monuments: [{ kind: 'hall', u: 0, v: 0, w: 100, d: 56, h: 48, name: 'Palace of Wu' }, { kind: 'pagoda', u: 400, v: -300, w: 24, h: 90, name: 'Pagoda' }] },
  liangzhu: { style: 'neolithic', walls: true, monuments: [{ kind: 'mound', u: 0, v: 0, w: 300, d: 200, h: 20, name: 'Mojiaoshan' }] },
  angkor: { style: 'khmer', walls: false, monuments: [{ kind: 'angkor', u: 0, v: 0, w: 2400, name: 'Angkor Wat' }] },
  rome: { style: 'roman', walls: true, monuments: [
    { kind: 'arena', u: 500, v: 200, a: 189, b: 156, h: 96, name: 'The Colosseum' },
    { kind: 'greekTemple', u: -200, v: -150, w: 60, d: 110, h: 32, name: 'Temple of Jupiter' },
    { kind: 'dome', u: -500, v: -700, w: 86, h: 86, name: 'The Pantheon' },
  ] },
  florence: { style: 'renaissance', walls: true, monuments: [{ kind: 'dome', u: 0, v: 0, w: 90, h: 228, name: 'Florence Cathedral' }] },
  athens: { style: 'greek', walls: true, monuments: [{ kind: 'acropolis', u: 0, v: -500, w: 540, d: 312, h: 120, name: 'The Acropolis' }] },
  olympia: { style: 'greek', walls: false, monuments: [{ kind: 'greekTemple', u: 0, v: 0, w: 56, d: 128, h: 40, name: 'Temple of Zeus' }] },
  carthage: { style: 'punic', walls: true, monuments: [{ kind: 'harbour', u: 600, v: 600, r: 300, name: 'The Round Harbour' }] },
  jerusalem: { style: 'levant', walls: true, monuments: [{ kind: 'templeMount', u: 0, v: -200, w: 600, d: 900, h: 30, name: 'The Temple' }] },
  worldBank: { style: 'bank', walls: false, monuments: [{ kind: 'bank', u: 0, v: 0, w: 80, d: 60, h: 30, name: 'The World Bank' }] },
  chichenItza: { style: 'maya', walls: false, monuments: [{ kind: 'mayaPyramid', u: 0, v: 0, w: 111, h: 48, tiers: 9, top: 12, name: 'El Castillo' }] },
  uxmal: { style: 'maya', walls: false, monuments: [{ kind: 'mayaPyramid', u: 0, v: 0, w: 100, h: 70, tiers: 5, top: 12, name: 'Pyramid of the Magician' }] },
  tulum: { style: 'maya', walls: true, monuments: [{ kind: 'mayaPyramid', u: 300, v: 0, w: 40, h: 16, tiers: 2, top: 10, name: 'El Castillo of Tulum' }] },
  tikal: { style: 'maya', walls: false, monuments: [
    { kind: 'mayaPyramid', u: -200, v: 0, w: 64, h: 76, tiers: 9, top: 18, name: 'Temple of the Great Jaguar' },
    { kind: 'mayaPyramid', u: 200, v: 0, w: 60, h: 60, tiers: 3, top: 16, name: 'Temple of the Masks' },
  ] },
  teotihuacan: { style: 'mesoamerica', walls: false, monuments: [
    { kind: 'mayaPyramid', u: 340, v: -200, w: 450, h: 130, tiers: 5, top: 0, name: 'Pyramid of the Sun' },
    { kind: 'mayaPyramid', u: 0, v: -1900, w: 280, h: 86, tiers: 4, top: 0, name: 'Pyramid of the Moon' },
    { kind: 'avenue', u: 0, v: 0, w: 80, d: 3400, name: 'Avenue of the Dead' },
  ] },
};

function hash(x, z, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(s | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];

// ---------- the plan of a city ----------
const plans = new Map();
/// Everything about a city that doesn't change: its centre and reach in blocks, its ground level, style, and each
/// monument's rectangle.
export function cityPlan(c, KM, SL) {
  if (plans.has(c.id)) return plans.get(c.id);
  const P = PLANS[c.id] || { style: 'greek', walls: true, monuments: [] };
  const plan = {
    id: c.id, cx: Math.round(c.x * KM), cz: Math.round(c.z * KM), R: Math.round(c.r * KM), gy: SL + Math.round(c.e * 2),
    style: STYLES[P.style], walls: P.walls, houseZone: P.houseZone, seed: c.id.length * 131 + c.id.charCodeAt(0) * 7,
    monuments: P.monuments.map((m) => {
      const half = monumentHalf(m);
      return { ...m, x0: m.u - half[0], z0: m.v - half[1], x1: m.u + half[0], z1: m.v + half[1] };
    }),
  };
  plans.set(c.id, plan);
  return plan;
}
/// Half the width and depth of a monument's ground (with its plaza).
function monumentHalf(m) {
  switch (m.kind) {
    case 'pyramid': return [m.w / 2 + 40, m.w / 2 + 40];
    case 'sphinx': return [110, 60];
    case 'arena': return [m.a + 40, m.b + 40];
    case 'ziggurat': case 'mayaPyramid': return [m.w / 2 + 30, m.w / 2 + 30];
    case 'acropolis': return [m.w / 2 + 30, m.d / 2 + 30];
    case 'avenue': return [m.w / 2, m.d / 2];
    case 'harbour': return [m.r + 20, m.r + 20];
    case 'lighthouse': return [m.w + 30, m.w + 30];
    case 'dome': return [m.w / 2 + 30, m.w / 2 + 50];
    case 'pagoda': return [m.w / 2 + 12, m.w / 2 + 12];
    case 'angkor': return [m.w / 2, m.w / 2];
    case 'palace': return [m.w / 2, m.d / 2];
    case 'apadana': return [m.w / 2 + 60, m.w / 2 + 60];
    case 'gate': return [m.w / 2 + 10, 20];
    default: return [(m.w || 80) / 2 + 20, (m.d || m.w || 80) / 2 + 20];
  }
}

// ---------- building one column ----------
/// Builds the city at block column (x, z): `put(y, b)` sets a block in that column, `ground` is the land's height
/// there. Returns the new ground height (the first air above the street or floor), or null if the city isn't here.
export function cityColumn(plan, x, z, put) {
  const u = x - plan.cx, v = z - plan.cz, d = Math.hypot(u, v), R = plan.R, gy = plan.gy, S = plan.style;
  if (d > R + 6) return null;
  // Everything sits on level ground at the city's height.
  for (let y = gy - 4; y < gy; y++) put(y, y === gy - 1 ? S.road === B.dirt ? B.dirt : B.stone : B.stone);
  // Monuments first.
  for (const m of plan.monuments) {
    if (u < m.x0 || u > m.x1 || v < m.z0 || v > m.z1) continue;
    const r = MONUMENT[m.kind]?.(m, u - m.u, v - m.v, gy, put, S, plan);
    if (r !== false) return gy;
  }
  // The city wall, with a gate where each main street goes out.
  if (plan.walls && d > R - 12) {
    if (d > R - 2) return gy;   // a ditch-free strip outside, left as plain ground
    const gate = Math.abs(u) < 10 || Math.abs(v) < 10;
    const h = 24, top = gy + h;
    put(gy - 1, S.plaza);
    if (gate) {
      for (let y = gy + 14; y < top; y++) put(y, S.cityWall);
      return gy;
    }
    for (let y = gy; y < top; y++) put(y, S.cityWall);
    // Battlements along the outside edge.
    if (d > R - 4 && Math.floor((Math.atan2(v, u) * R) / 3) % 2 === 0) put(top, S.cityWall);
    return top;
  }
  if (plan.houseZone && !plan.houseZone(u, v)) { put(gy - 1, B.sand); return gy; }
  // Streets: a main avenue every 160 blocks (80 m) both ways, side streets every 40.
  const AV = 160, ST = 40, uu = ((u % AV) + AV) % AV, vv = ((v % AV) + AV) % AV;
  const avenue = uu < 12 || vv < 12, su = ((u % ST) + ST) % ST, sv = ((v % ST) + ST) % ST, street = su < 6 || sv < 6;
  const outer = Math.max(0, Math.min(1, (d / R - 0.5) / 0.38));   // 0 in the middle of town, 1 out by the walls
  if (avenue || street) {
    put(gy - 1, !avenue && outer > 0.5 ? (S.road === B.dirt ? B.dirt : B.gravel) : S.road);
    // Lamps along the avenues, every 24 blocks.
    if (avenue && (uu === 1 || vv === 1) && ((uu === 1 ? v : u) % 24 + 24) % 24 === 0) { put(gy, B.fence); put(gy + 1, B.fence); put(gy + 2, B.lamp); }
    return gy;
  }
  // A plot between the streets: a house, or a garden.
  const lu = Math.floor((u - 6) / ST), lv = Math.floor((v - 6) / ST);   // which plot
  const px = u - lu * ST - 6, pz = v - lv * ST - 6;                      // where in it (0 … 33)
  const W = ST - 6;
  // Plots are split into two houses along their longer side.
  const r0 = hash(lu, lv, plan.seed);
  const half = r0 < 0.5 ? (px < W / 2 ? 0 : 1) : (pz < W / 2 ? 0 : 1);
  const hx0 = r0 < 0.5 ? half * (W / 2) : 0, hz0 = r0 < 0.5 ? 0 : half * (W / 2);
  const hw = r0 < 0.5 ? W / 2 : W, hd = r0 < 0.5 ? W : W / 2;
  const r = hash(lu * 2 + half, lv * 3 + half, plan.seed + 1);
  const sparse = S.sparse ? 0.45 : 0.1;
  // Packed with houses in the middle; out towards the walls, more and more fields, orchards and pastures.
  if (r > (1 - sparse) * (1 - outer * 0.85)) return farm(plan, px, pz, W, x, z, gy, put, S, hash(lu, lv, plan.seed + 5), outer);
  if (r < 0.04) return garden(plan, x, z, gy, put, S, r);
  return house(px - hx0, pz - hz0, hw, hd, gy, put, S, r, r0 < 0.5 ? (half ? 'e' : 'w') : (half ? 's' : 'n'));
}

function garden(plan, x, z, gy, put, S, r) {
  const g = hash(x, z, plan.seed + 9);
  put(gy - 1, S.road === B.dirt || S.tree === 'palm' ? B.grass : B.grass);
  if (g < 0.006 && S.tree !== 'none') {
    // A small tree (the street trees of the city's land).
    const log = S.tree === 'palm' ? B.palmLog : B.oakLog, leaf = S.tree === 'palm' ? B.palmLeaf : B.oakLeaf;
    for (let y = 0; y < 8; y++) put(gy + y, log);
    put(gy + 8, leaf); put(gy + 9, leaf);
  } else if (g < 0.2) put(gy, 30);
  else if (g < 0.4 && S.road !== B.dirt) { put(gy - 1, B.farmland); put(gy, B.wheat); }
  return gy;
}

/// A plot of farmland: a field of wheat in rows, an orchard, or a fenced pasture.
function farm(plan, px, pz, W, x, z, gy, put, S, r, outer) {
  const edge = px === 0 || pz === 0 || px === W - 1 || pz === W - 1;
  if (r < 0.5) {   // a field
    if (edge) { put(gy - 1, B.grass); return gy; }
    const row = pz % 3;
    put(gy - 1, row === 0 ? B.water : B.farmland);
    if (row === 0) put(gy - 2, B.dirt); else put(gy, B.wheat);
    return gy;
  }
  put(gy - 1, B.grass);
  if (r < 0.8) {   // an orchard
    const tree = S.tree === 'palm' ? [B.palmLog, B.palmLeaf] : [B.oakLog, B.oakLeaf];
    const tx = (px - 4) % 9, tz = (pz - 4) % 9;
    if (px >= 4 && pz >= 4 && tx === 0 && tz === 0) { for (let y = gy; y < gy + 7; y++) put(y, tree[0]); for (let y = gy + 5; y < gy + 10; y++) put(y, tree[1]); }
    else if (px >= 3 && pz >= 3 && Math.abs(tx) <= 2 && Math.abs(tz) <= 2 && (tx * tx + tz * tz) <= 5 && !(tx === 0 && tz === 0)) for (let y = gy + 5; y < gy + 9 - (tx * tx + tz * tz > 2 ? 1 : 0); y++) put(y, tree[1]);
    else if (hash(x, z, 3) < 0.25) put(gy, 30);
    return gy;
  }
  // a pasture, with a fence round it
  if (edge && !(px === Math.floor(W / 2) && pz === 0)) put(gy, B.fence);
  else if (hash(x, z, 4) < 0.3) put(gy, 30);
  return gy;
}

/// A house in a plot `w` × `d` blocks (the column is at px, pz within it), with its door on the `street` side.
function house(px, pz, w, d, gy, put, S, r, street) {
  const set = 2;   // a strip of yard round it
  const x0 = set, z0 = set, x1 = w - 1 - set, z1 = d - 1 - set;
  if (px < x0 || px > x1 || pz < z0 || pz > z1) { put(gy - 1, S.road === B.dirt ? B.dirt : S.plaza); return gy; }
  const storeys = pick(S.storeys, hash(r * 1000, 7, 3)), SH = 6, wallTop = gy + storeys * SH;
  const mat = pick(S.house, hash(r * 1000, 3, 5));
  const edge = px === x0 || px === x1 || pz === z0 || pz === z1;
  const corner = (px === x0 || px === x1) && (pz === z0 || pz === z1);
  const base = S.stilts ? gy + 4 : gy;
  put(gy - 1, S.plaza);
  if (S.stilts) {   // on stilts, for the rains
    if (corner || ((px === x0 || px === x1) && (pz - z0) % 6 === 0) || ((pz === z0 || pz === z1) && (px - x0) % 6 === 0)) for (let y = gy; y < base; y++) put(y, B.oakLog);
    put(base - 1, B.planks);
  }
  const top = base + storeys * SH;
  if (edge) {
    // The door: in the middle of the street side, 2 wide and 4 high.
    const mid = street === 'n' || street === 's' ? Math.abs(px - (x0 + x1) / 2) < 1.1 : Math.abs(pz - (z0 + z1) / 2) < 1.1;
    const onStreet = (street === 'n' && pz === z0) || (street === 's' && pz === z1) || (street === 'w' && px === x0) || (street === 'e' && px === x1);
    for (let y = base; y < top; y++) {
      const k = (y - base) % SH;
      let b = corner ? S.trim : mat;
      if (onStreet && mid && y - base < 4) b = 0;
      // Windows: a gap two blocks high in each storey, every few blocks along the wall.
      else if (!corner && k >= 2 && k <= 3 && ((px === x0 || px === x1) ? (pz - z0) % 4 === 2 : (px - x0) % 4 === 2)) b = 0;
      else if (k === SH - 1 && !corner) b = S.trim;
      put(y, b);
    }
  } else {
    // Floors between storeys, and a ladder up by the back corner.
    const ladder = px === x1 - 1 && pz === z1 - 1;
    for (let s = 1; s < storeys; s++) put(base + s * SH - 1, ladder ? B.ladder : B.planks);
    if (ladder) for (let y = base; y < top; y++) put(y, B.ladder);
    put(base - 1, S.stilts ? B.planks : B.planks);
  }
  // The roof.
  if (S.roof === 'flat') {
    put(top - 1, edge ? (corner ? S.trim : mat) : (px === x1 - 1 && pz === z1 - 1 ? B.ladder : mat));
    if (edge) put(top, mat);   // a low wall round the roof
    return gy;
  }
  // A pitched roof: one block higher for each block in from the long sides, with the gable ends walled up.
  const along = (x1 - x0) >= (z1 - z0) ? 'x' : 'z';
  const inset = along === 'x' ? Math.min(pz - z0, z1 - pz) : Math.min(px - x0, x1 - px);
  const roofB = S.roof === 'grey' ? B.greyTile : S.roof === 'thatch' ? B.palmLeaf : B.terracotta;
  const end = along === 'x' ? (px === x0 || px === x1) : (pz === z0 || pz === z1);
  const peak = top + inset;
  for (let y = top; y < peak; y++) put(y, end ? mat : 0);
  put(peak, roofB);
  return gy;
}

// ---------- the monuments ----------
// Each takes (monument, du, dv from its centre, ground y, put, style, plan) and builds that one column.
// Return false to say "not here after all" (the column is left to the streets and houses).
const MONUMENT = {
  pyramid(m, du, dv, gy, put) {
    const half = m.w / 2, k = Math.max(Math.abs(du), Math.abs(dv));
    put(gy - 1, B.sandstone);
    if (k > half) return true;   // the paved court round it
    const h = Math.round(m.h * (1 - k / half));
    for (let y = gy; y < gy + h; y++) put(y, B.limestone);
    // The casing: smooth white stone on the outside, and a gilded capstone.
    if (h > 0) put(gy + h - 1, h > m.h - 4 ? B.gold : B.marble);
    if (h > 1) put(gy + h - 2, B.marble);
    // The entrance on the north face, and the passage going down into it.
    if (Math.abs(du) <= 2 && dv < 0) {
      const into = half + dv;   // blocks in from the north face
      const ey = gy + 34 - Math.round(into * 0.5);
      if (into >= 0 && into < 120) for (let y = Math.max(gy, ey); y < Math.max(gy, ey) + 4; y++) put(y, 0);
    }
    return true;
  },
  sphinx(m, du, dv, gy, put) {
    // A lion lying down, facing east: body, paws in front, and a head with a headdress.
    put(gy - 1, B.sandstone);
    const a = Math.abs(dv);
    let h = 0;
    if (du >= -90 && du <= 30 && a <= 15) h = 30 - Math.max(0, (a - 11)) * 2 - (du < -70 ? Math.round((-70 - du) * 0.6) : 0);   // the body
    if (du > 30 && du <= 70 && a <= 15 && a >= 4) h = Math.max(h, 8);                     // the paws
    if (du >= 14 && du <= 36 && a <= 12) h = Math.max(h, a <= 8 ? 46 : 40 - (a - 8) * 2);   // the head and headdress
    for (let y = gy; y < gy + h; y++) put(y, B.sandstone);
    if (du === 36 && a <= 6 && h) { put(gy + 38, B.limestone); }   // the face
    return true;
  },
  ziggurat(m, du, dv, gy, put) {
    put(gy - 1, B.brick);
    const half = m.w / 2, k = Math.max(Math.abs(du), Math.abs(dv)), tierH = m.h / m.tiers, step = half / m.tiers;
    if (k > half) return true;
    const tier = Math.min(m.tiers, Math.floor((half - k) / step) + 1);
    const h = Math.round(tier * tierH);
    for (let y = gy; y < gy + h; y++) put(y, y >= gy + h - 2 ? B.blueTile : B.mudBrick);
    // A great stair up the south side.
    if (Math.abs(du) <= 8 && dv > 0) { const sy = Math.round((half - dv) * (m.h / half) * 0.9); for (let y = gy; y < gy + Math.min(m.h, sy); y++) put(y, B.brick); }
    if (k < step && tier === m.tiers) for (let y = gy + h; y < gy + h + 14; y++) put(y, (Math.abs(du) === step - 1 || Math.abs(dv) === step - 1) ? B.blueTile : (y === gy + h + 13 ? B.gold : 0));
    return true;
  },
  mayaPyramid(m, du, dv, gy, put, S) {
    put(gy - 1, S.plaza);
    const half = m.w / 2, k = Math.max(Math.abs(du), Math.abs(dv)), tierH = m.h / m.tiers, topHalf = Math.max(m.top / 2 + 4, half * 0.25);
    if (k > half) return true;
    const step = (half - topHalf) / m.tiers;
    const tier = k <= topHalf ? m.tiers : Math.min(m.tiers, Math.floor((half - k) / step) + 1);
    const h = Math.round(tier * tierH);
    for (let y = gy; y < gy + h; y++) put(y, (half - k) % step < 1.5 ? B.limestone : B.plaster);
    // Stairways up all four sides (or just the front of a steep temple), 18 blocks wide.
    const sideA = Math.abs(du) <= 9 && (m.tiers > 4 || dv > 0), sideB = Math.abs(dv) <= 9 && m.tiers === 9 && m.top < 15;
    if (sideA || sideB) {
      const out = sideA ? Math.abs(dv) : Math.abs(du);
      const sy = Math.round(Math.min(m.h, (half - out) * (m.h / (half - topHalf))));
      for (let y = gy; y < gy + sy; y++) put(y, y === gy + sy - 1 ? B.limestone : B.plaster);
      if (Math.abs(sideA ? du : dv) === 9) for (let y = gy; y < gy + sy + 1; y++) put(y, B.limestone);   // the balustrade
    }
    // The temple on top: a stone room with a doorway, and a tall roof comb.
    const tt = m.top / 2;
    if (m.top && k <= tt) {
      const edge = k === Math.round(tt) || k > tt - 1;
      for (let y = gy + h; y < gy + h + 12; y++) put(y, edge && !(dv > 0 && Math.abs(du) < 2 && y < gy + h + 6) ? B.plaster : 0);
      put(gy + h + 12, B.limestone);
      if (m.top >= 16 && Math.abs(du) <= tt - 2 && Math.abs(dv) <= 2) for (let y = gy + h + 13; y < gy + h + 26; y++) put(y, B.limestone);   // the roof comb
    }
    return true;
  },
  arena(m, du, dv, gy, put) {
    put(gy - 1, B.limestone);
    const k = Math.hypot(du / m.a, dv / m.b);
    if (k > 1) return true;
    const kin = 0.46;   // the arena floor is 87 × 55 m
    if (k < kin) { put(gy - 1, B.sand); return true; }
    const ang = Math.atan2(dv / m.b, du / m.a), bay = ((ang / (2 * Math.PI)) * 80 + 80) % 1;
    if (k > 0.965) {
      // The outer wall: four storeys of arches (the top one a solid wall with small windows).
      for (let y = gy; y < gy + m.h; y++) {
        const s = Math.floor((y - gy) / 24), ky = (y - gy) % 24;
        const arch = s < 3 && bay > 0.22 && bay < 0.78 && ky >= 2 && ky < 18 - Math.round(Math.abs(bay - 0.5) * 12);
        const window = s === 3 && bay > 0.4 && bay < 0.6 && ky >= 8 && ky < 12;
        put(y, arch || window ? 0 : (ky === 0 || ky === 23) ? B.marble : B.limestone);
      }
      return true;
    }
    // The seats: rising from the podium wall round the arena to the top of the outer wall.
    const t = (k - kin) / (0.965 - kin), h = Math.round(10 + t * (m.h - 22));
    for (let y = gy; y < gy + h; y++) put(y, y === gy + h - 1 ? B.marble : (bay > 0.45 && bay < 0.55 && y < gy + h - 4 && y > gy + 1 && y < gy + 6) ? 0 : B.stoneBrick);
    return true;
  },
  greekTemple(m, du, dv, gy, put, S) {
    put(gy - 1, S.plaza);
    const hw = m.w / 2, hd = m.d / 2, a = Math.abs(du), b = Math.abs(dv);
    if (a > hw || b > hd) return true;
    // Three steps, columns all round, a walled room inside, the beams and a pitched roof.
    const step = Math.min(hw - a, hd - b);
    let y = gy;
    for (let s = 0; s < 3; s++) if (step >= s * 2) put(y++, B.marble);
    if (step < 6) return true;
    const colH = m.h - 10, ring = step < 10, sp = 9;
    const colHere = ring && ((((Math.round(du + hw)) % sp) + sp) % sp < 4 || a > hw - 10) && ((((Math.round(dv + hd)) % sp) + sp) % sp < 4 || b > hd - 10);
    const cella = step >= 16 && step <= 17;
    const door = cella && a < 4 && dv < 0;
    for (let yy = y; yy < y + colH; yy++) put(yy, (ring && colHere && step >= 6 && step <= 9) ? B.marble : (cella && !door) ? B.marble : 0);
    // Beams, then the roof: lowest along the long sides, a ridge down the middle.
    const roofTop = y + colH + 4 + Math.round((hw - a) * 0.3);
    for (let yy = y + colH; yy < roofTop; yy++) put(yy, yy === roofTop - 1 ? B.terracotta : B.marble);
    return true;
  },
  acropolis(m, du, dv, gy, put, S, plan) {
    // A great rock with cliffs, and the Parthenon on top.
    const hw = m.w / 2, hd = m.d / 2;
    const k = Math.max(Math.abs(du) / hw, Math.abs(dv) / hd);
    const edgeNoise = hash(Math.floor(du / 6), Math.floor(dv / 6), 77) * 0.06;
    if (k > 1 + edgeNoise) { put(gy - 1, B.grass); return true; }
    const h = k < 0.9 ? m.h : Math.round(m.h * (1 - (k - 0.9) / (0.1 + edgeNoise)) ** 0.4);
    for (let y = gy; y < gy + h; y++) put(y, y >= gy + h - 1 ? B.limestone : B.granite);
    // The Propylaea's ramp up the west end.
    if (du < -hw * 0.5 && Math.abs(dv) < 10) { const rh = Math.round(m.h * Math.max(0, Math.min(1, (du + hw * 1.25) / (hw * 0.75)))); for (let y = gy; y < gy + rh; y++) put(y, B.limestone); }
    if (k < 0.9) {
      // The Parthenon: 139 × 62 blocks, its columns 21 blocks high.
      const p = { w: 62, d: 139, h: 32 };
      if (Math.abs(du - 40) <= p.d / 2 && Math.abs(dv) <= p.w / 2) MONUMENT.greekTemple({ w: p.w, d: p.d, h: p.h }, dv, du - 40, gy + m.h, put, { plaza: B.limestone });
    }
    return true;
  },
  lighthouse(m, du, dv, gy, put) {
    put(gy - 1, B.limestone);
    const a = Math.max(Math.abs(du), Math.abs(dv)), r = Math.hypot(du, dv), w = m.w / 2;
    // Three stages: a square base, an eight-sided middle, a round top with the fire.
    if (a <= w) for (let y = gy; y < gy + m.h * 0.55; y++) put(y, a >= w - 1 || (y - gy) % 20 === 0 ? B.limestone : (a < 4 ? B.ladder : 0));
    const oct = Math.max(a, (Math.abs(du) + Math.abs(dv)) / Math.SQRT2);
    if (oct <= w * 0.7) for (let y = gy + Math.round(m.h * 0.55); y < gy + m.h * 0.85; y++) put(y, oct >= w * 0.7 - 1.2 ? B.marble : (a < 4 ? B.ladder : 0));
    if (r <= w * 0.4) for (let y = gy + Math.round(m.h * 0.85); y < gy + m.h; y++) put(y, r > w * 0.4 - 1.5 && (y - gy) % 6 > 2 ? 0 : r < 3 ? B.lamp : B.marble);
    if (r <= 3) put(gy + m.h, B.bronze);
    return true;
  },
  dome(m, du, dv, gy, put) {
    put(gy - 1, B.marble);
    const R = m.w / 2, r = Math.hypot(du, dv);
    // A portico of columns in front (north), then a round drum and a dome.
    if (dv < -R && dv >= -R - 40 && Math.abs(du) <= R * 0.7) {
      const col = ((Math.round(du + R) % 8) + 8) % 8 < 3 && ((Math.round(dv + R + 40) % 10) + 10) % 10 < 3;
      for (let y = gy; y < gy + 36; y++) put(y, col || y >= gy + 32 ? B.marble : 0);
      return true;
    }
    if (r > R) return true;
    const drum = Math.round(m.h * 0.45);
    for (let y = gy; y < gy + drum; y++) put(y, r > R - 3 && !(dv < 0 && Math.abs(du) < 4 && y < gy + 20) ? B.marble : 0);
    // The dome itself (a shell), with the open eye at the top.
    const hy = Math.sqrt(Math.max(0, R * R - r * r)) * (m.h - drum) / R;
    const inner = Math.sqrt(Math.max(0, (R - 4) * (R - 4) - r * r)) * (m.h - drum) / R;
    if (r > 5) for (let y = gy + drum + Math.floor(inner); y < gy + drum + hy; y++) put(y, m.h > 150 ? B.terracotta : B.stoneBrick);
    return true;
  },
  pylonTemple(m, du, dv, gy, put) {
    // An Egyptian temple: a great gateway of two sloping towers, a court of columns, then a dark hall of columns.
    put(gy - 1, B.sandstone);
    const hw = m.w / 2, hd = m.d / 2, a = Math.abs(du), front = dv + hd;
    if (a > hw || front < 0 || front > m.d) return true;
    if (front < 20) {   // the pylon
      const h = Math.round(m.h - (Math.abs(front - 10) * 0.6) - Math.max(0, a - hw * 0.8) * 1.5);
      if (a < 8) { for (let y = gy + 30; y < gy + h; y++) put(y, B.sandstone); return true; }   // the doorway
      for (let y = gy; y < gy + h; y++) put(y, B.sandstone);
      return true;
    }
    const wall = a > hw - 4 || front > m.d - 4;
    const colH = Math.round(m.h * 0.55), inHall = front > m.d * 0.5;
    const col = (((Math.round(du + hw) % 12) + 12) % 12) < 5 && (((Math.round(front) % 12) + 12) % 12) < 5;
    for (let y = gy; y < gy + colH + 2; y++) put(y, wall || (col && a > 8) ? B.sandstone : (inHall && y >= gy + colH) ? B.sandstone : 0);
    return true;
  },
  palace(m, du, dv, gy, put) {
    // The Forbidden City: a moat, red walls with corner towers, courtyards, and the great halls on white terraces.
    const hw = m.w / 2, hd = m.d / 2, a = Math.abs(du), b = Math.abs(dv);
    if (a > hw || b > hd) return true;
    const ex = Math.min(hw - a, hd - b);
    if (ex < 100) { if (ex < 30 || ex > 90) put(gy - 1, B.stoneBrick); else { for (let y = gy - 6; y < gy; y++) put(y, B.water); put(gy - 7, B.stone); } return true; }   // the moat
    if (ex < 120) { const gate = a < 14; for (let y = gy; y < gy + 20; y++) put(y, gate && y < gy + 14 ? 0 : B.redWood); for (let y = gy + 20; y < gy + 23; y++) put(y, B.yellowTile); return true; }
    put(gy - 1, B.stoneBrick);
    // The Hall of Supreme Harmony: on a three-tier white terrace in the middle.
    const hall = { w: 128, d: 74 };
    if (a < hall.w / 2 + 30 && b < hall.d / 2 + 30) {
      const t = Math.min(hall.w / 2 + 30 - a, hall.d / 2 + 30 - b);
      const ter = t < 8 ? 5 : t < 16 ? 10 : 16;
      for (let y = gy; y < gy + ter; y++) put(y, B.marble);
      if (a < hall.w / 2 && b < hall.d / 2) {
        const e = Math.min(hall.w / 2 - a, hall.d / 2 - b);
        const top = gy + 16, wallH = 30;
        for (let y = top; y < top + wallH; y++) put(y, e < 1.5 ? B.redWood : (e < 6 && ((Math.round(du) % 10) + 10) % 10 < 2) ? B.redWood : 0);
        // A double hipped roof of yellow tiles.
        const roof = Math.round(e * 0.45);
        for (let y = top + wallH; y < top + wallH + roof + 1; y++) put(y, y === top + wallH + roof ? B.yellowTile : B.redWood);
      }
      return true;
    }
    // Smaller halls in rows of courtyards.
    const cu = ((Math.round(du) % 200) + 200) % 200, cv = ((Math.round(dv) % 160) + 160) % 160;
    if (cu > 40 && cu < 160 && cv > 50 && cv < 100) {
      const e = Math.min(cu - 40, 160 - cu, cv - 50, 100 - cv);
      for (let y = gy; y < gy + 4; y++) put(y, B.marble);
      for (let y = gy + 4; y < gy + 16; y++) put(y, e < 1.5 ? B.redWood : 0);
      const roof = Math.round(e * 0.5);
      for (let y = gy + 16; y < gy + 17 + roof; y++) put(y, y === gy + 16 + roof ? B.yellowTile : B.redWood);
    }
    return true;
  },
  hall(m, du, dv, gy, put, S) {
    put(gy - 1, S.plaza);
    const hw = m.w / 2 + 16, hd = m.d / 2 + 16, a = Math.abs(du), b = Math.abs(dv);
    if (a > hw || b > hd) return true;
    const t = Math.min(hw - a, hd - b);
    for (let y = gy; y < gy + Math.min(8, Math.floor(t / 2)); y++) put(y, B.marble);
    if (a < m.w / 2 && b < m.d / 2) {
      const e = Math.min(m.w / 2 - a, m.d / 2 - b), top = gy + 8, wallH = Math.round(m.h * 0.5);
      for (let y = top; y < top + wallH; y++) put(y, e < 1.5 ? B.redWood : 0);
      const roof = Math.round(e * 0.45);
      for (let y = top + wallH; y < top + wallH + roof + 1; y++) put(y, y === top + wallH + roof ? B.greyTile : B.redWood);
    }
    return true;
  },
  pagoda(m, du, dv, gy, put) {
    put(gy - 1, B.stoneBrick);
    const a = Math.max(Math.abs(du), Math.abs(dv)), w = m.w / 2, floors = 7, fh = Math.floor(m.h / floors);
    if (a > w + 6) return true;
    for (let f = 0; f < floors; f++) {
      const fw = w - f * 1.2, y0 = gy + f * fh;
      if (a <= fw) for (let y = y0; y < y0 + fh - 3; y++) put(y, a > fw - 1 ? (((Math.round(du + dv) % 6) + 6) % 6 < 2 && y > y0 + 3 ? 0 : B.redWood) : (a < 2 ? B.ladder : 0));
      if (a <= fw + 5) put(y0 + fh - 3 + Math.round(Math.max(0, a - fw)), B.greyTile);
    }
    if (a < 1.5) for (let y = gy + floors * fh; y < gy + floors * fh + 10; y++) put(y, B.gold);
    return true;
  },
  mound(m, du, dv, gy, put) {
    const k = Math.max(Math.abs(du) / (m.w / 2), Math.abs(dv) / (m.d / 2));
    if (k > 1) return true;
    const h = Math.round(m.h * Math.min(1, (1 - k) * 4));
    for (let y = gy; y < gy + h; y++) put(y, y === gy + h - 1 ? B.grass : B.rammed);
    return true;
  },
  angkor(m, du, dv, gy, put) {
    // A wide moat round the temple, a causeway across it from the west, terraces and five lotus towers.
    const hw = m.w / 2, a = Math.abs(du), b = Math.abs(dv), ex = hw - Math.max(a, b);
    if (ex < 0) return true;
    if (ex < 380) {
      const causeway = Math.abs(dv) < 10 && du < 0;
      if (causeway) { put(gy - 1, B.sandstone); for (let y = gy; y < gy + 2; y++) if (Math.abs(dv) > 8) put(y, B.sandstone); return true; }
      for (let y = gy - 8; y < gy; y++) put(y, B.water); put(gy - 9, B.dirt);
      return true;
    }
    put(gy - 1, B.grass);
    const k = Math.max(a, b);
    if (k > 210) { if (ex < 400) for (let y = gy; y < gy + 10; y++) put(y, B.sandstone); return true; }   // the outer gallery wall
    const tiers = [[210, 0], [130, 12], [80, 26], [55, 46]];
    let h = 0;
    for (const [w, th] of tiers) if (k <= w) h = th;
    for (let y = gy; y < gy + h; y++) put(y, B.sandstone);
    // Towers: one in the middle (65 m above the ground) and one at each corner of the top terrace.
    for (const [tx, tz, th] of [[0, 0, 130], [44, 44, 90], [-44, 44, 90], [44, -44, 90], [-44, -44, 90]]) {
      const r = Math.max(Math.abs(du - tx), Math.abs(dv - tz));
      if (r > 14) continue;
      const tow = Math.round((th - 46) * Math.pow(1 - r / 14, 0.8));
      for (let y = gy + 46; y < gy + 46 + tow; y++) put(y, (y - gy) % 6 === 0 ? B.carved : B.sandstone);
    }
    return true;
  },
  apadana(m, du, dv, gy, put) {
    // A raised terrace and a great square hall of tall stone columns.
    const hw = m.w / 2 + 50, a = Math.abs(du), b = Math.abs(dv);
    if (a > hw || b > hw) return true;
    for (let y = gy; y < gy + 24; y++) put(y, B.limestone);
    if (dv > hw - 40 && Math.abs(du) < 30) { const sh = Math.round(24 * (hw - dv) / 40); for (let y = gy; y < gy + 24; y++) put(y, y < gy + sh ? B.limestone : 0); }
    const top = gy + 24, half = m.w / 2;
    if (a < half && b < half) {
      const col = (((Math.round(du + half) % 16) + 16) % 16) < 3 && (((Math.round(dv + half) % 16) + 16) % 16) < 3;
      for (let y = top; y < top + m.h; y++) put(y, col ? (y > top + m.h - 4 ? B.carved : B.limestone) : 0);
      put(top + m.h, B.planks);
    }
    return true;
  },
  gate(m, du, dv, gy, put) {
    const a = Math.abs(du);
    if (a > m.w / 2 || Math.abs(dv) > 14) return false;
    for (let y = gy; y < gy + m.h; y++) put(y, a < 7 && y < gy + 22 ? 0 : (y - gy) % 8 === 4 && a % 6 === 0 ? B.gold : m.mat);
    return true;
  },
  bath(m, du, dv, gy, put) {
    const a = Math.abs(du), b = Math.abs(dv);
    if (a > m.w / 2 || b > m.d / 2) return true;
    const e = Math.min(m.w / 2 - a, m.d / 2 - b);
    for (let y = gy; y < gy + 8; y++) put(y, B.brick);
    if (e > 8 && e < 16) for (let y = gy + 8; y < gy + 14; y++) put(y, B.brick);
    if (e >= 16) { for (let y = gy + 2; y < gy + 8; y++) put(y, B.water); }
    return true;
  },
  harbour(m, du, dv, gy, put) {
    const r = Math.hypot(du, dv);
    if (r > m.r) return true;
    if (r > m.r - 40 || r < 60) { put(gy - 1, B.limestone); if (r < 60) for (let y = gy; y < gy + 10; y++) put(y, r > 56 ? B.limestone : 0); return true; }
    for (let y = gy - 10; y < gy; y++) put(y, B.water); put(gy - 11, B.sand);
    return true;
  },
  templeMount(m, du, dv, gy, put) {
    const hw = m.w / 2, hd = m.d / 2, a = Math.abs(du), b = Math.abs(dv);
    if (a > hw || b > hd) return true;
    for (let y = gy; y < gy + m.h; y++) put(y, B.jerusalem);
    // The Temple itself, on top: white walls and a gold-trimmed front.
    if (a < 50 && Math.abs(dv) < 50) {
      const e = Math.min(50 - a, 50 - Math.abs(dv));
      for (let y = gy + m.h; y < gy + m.h + 100; y++) put(y, e < 2 ? ((y - gy) % 20 === 0 ? B.gold : B.marble) : (dv < -40 && a < 8 && y < gy + m.h + 30) ? 0 : (e < 2 ? B.marble : 0));
      put(gy + m.h + 100, B.gold);
    }
    return true;
  },
  avenue(m, du, dv, gy, put) { put(gy - 1, B.plaster); if (Math.abs(du) > m.w / 2 - 3) { put(gy, B.limestone); put(gy + 1, B.limestone); } return true; },
  bank(m, du, dv, gy, put) {
    const a = Math.abs(du), b = Math.abs(dv);
    put(gy - 1, B.marble);
    if (a > m.w / 2 || b > m.d / 2) return true;
    const e = Math.min(m.w / 2 - a, m.d / 2 - b);
    for (let y = gy; y < gy + m.h; y++) put(y, e < 2 ? ((((Math.round(du) % 8) + 8) % 8 < 3 || y > gy + m.h - 5) ? B.marble : (y < gy + 8 && Math.abs(du) < 6 && dv < 0 ? 0 : B.glass)) : (y === gy + m.h - 1 ? B.marble : 0));
    if (e < 1) put(gy + m.h, B.gold);
    return true;
  },
};
export const CITY_PLANS = PLANS;
