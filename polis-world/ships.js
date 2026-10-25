// Polis World (computer version): the great warships of the ancient Mediterranean.
// Carthage has biremes (two rows of oars), Athens has triremes (three rows) and Rome has an enormous quinquereme, with
// rowers who lean and pull together while their oars sweep through the water. Each ship rows back and forth between
// two wide patches of sea near its city, turning on the spot at each end the way real galleys did: the rowers on one
// side pull forward while the other side backs water. You can swim up to a ship, climb aboard and ride on its deck.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { mergeBoxes } from './scenery.js';
import { rig, Squad, soldierLook, rowerLook, rowPose } from './figures.js';

// Sizes are in blocks (about a metre each). Real ships were about twice as long (a trireme was about 37 m), but these fit
// the game's narrow seas; the number of oars shown is fewer than the real number too, so you can see each one move.
export const SHIP_TYPES = {
  bireme: {
    name: 'Carthaginian bireme', L: 16, B: 2.8, hs: 0.95, dk: 1.95, banks: 2, per: 9, men: [1, 1], oar: [3.0, 2.6], speed: 3.2,
    hull: 0x3b2a1e, band: 0x6e2a7a, sail: [0xeee2c8, 0x6e2a7a, 0xeee2c8], shields: 0x8a6a2c, crest: null, marines: 4,
    title: 'A Carthaginian bireme',
    body: 'A bireme has two rows of oars, one above the other. The Phoenicians, who founded Carthage, were among the first to build them, nearly 3,000 years ago. Putting the rowers in two levels made the ship shorter and faster to turn, without losing rowing power. Carthage\'s biggest warships were quinqueremes, but smaller ships like this one carried messages and scouted for the fleet. Every timber was marked with a letter so the ship could be built quickly, like a kit.',
  },
  trireme: {
    name: 'Athenian trireme', L: 18, B: 3.0, hs: 1.05, dk: 2.05, banks: 3, per: 11, men: [1, 1, 1], oar: [3.6, 3.1, 2.7], speed: 3.6, outrigger: 0.45,
    hull: 0x262321, band: 0xb8402e, sail: [0xf3ecd9, 0xf3ecd9, 0xf3ecd9], shields: 0xc9a23a, crest: 0xb8402e, marines: 4, piper: true,
    title: 'An Athenian trireme',
    body: 'A trireme had 170 rowers in three rows, one above the other. The top row sat out on a frame over the side. A bronze ram on the bow could punch a hole in an enemy ship. Athens\'s rowers were free citizens, paid for their work, and a flute player played a tune so they kept time. In 480 BCE, Greek triremes beat the much bigger Persian fleet at the Battle of Salamis. Painted eyes on the bow helped the ship "see" its way.',
  },
  quinquereme: {
    name: 'Roman quinquereme', L: 24, B: 4.4, hs: 1.35, dk: 2.55, banks: 3, per: 12, men: [2, 2, 1], oar: [4.6, 4.0, 3.5], speed: 3.0, corvus: true,
    hull: 0x2b2420, band: 0xa3262a, sail: [0xf0e6d0, 0xa3262a, 0xf0e6d0], shields: 0xa3262a, crest: 0xa3262a, marines: 8, rect: true,
    title: 'A Roman quinquereme',
    body: 'A quinquereme ("five-er") was an enormous warship with about 300 rowers and 120 soldiers. Historians think it had three rows of oars, with two men on each of the top two oars and one on the bottom: five men in each group. In 260 BCE, during its war with Carthage, Rome built a fleet of about 100 of these in just two months, copying a Carthaginian ship that had run aground. Romans added the corvus ("crow"), a boarding bridge with a spike that dropped onto an enemy ship so soldiers could charge across.',
  },
};
export const FLEETS = [{ city: 'athens', type: 'trireme', n: 2 }, { city: 'rome', type: 'quinquereme', n: 1 }, { city: 'carthage', type: 'bireme', n: 2 }];   // in this order, each choosing the nearest free sea

const SKIN = [0xc68e64, 0xa8744e, 0xd9a77e, 0x8a5a3a, 0xb98058];
const box = (list, x0, y0, z0, x1, y1, z1, color, rot = null) => {
  const m = new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (rot) m.multiply(rot);
  list.push({ m: m.multiply(new THREE.Matrix4().makeScale(Math.max(x1 - x0, 0.01), Math.max(y1 - y0, 0.01), Math.max(z1 - z0, 0.01))), color });
};
const rotX = (a) => new THREE.Matrix4().makeRotationX(a);

/// Half the width of the hull at a point along it (z from bow +L/2 to stern -L/2).
function halfWidth(t, z) { const u = Math.min(Math.abs(z) / (t.L / 2), 1); return Math.max(0.25, (t.B / 2) * Math.pow(Math.max(0, 1 - Math.pow(u, z > 0 ? 2.2 : 3)), 0.5)); }
/// Where the oars sit: [z, bank] for each oar station on one side.
function stations(t) {
  const out = [], z0 = -t.L / 2 + 3.6, z1 = t.L / 2 - 4.2;
  for (let b = 0; b < t.banks; b++) for (let k = 0; k < t.per; k++) out.push([z0 + (z1 - z0) * (k + (b % 2) * 0.5) / (t.per - 0.5), b]);
  return out;
}
const pivotY = (t, b) => t.hs + 0.3 - b * 0.42;   // top bank (0) sits at the gunwale, lower banks row through oarports

// ---------- the models ----------
function soldier(list, x, y, z, t, facing) {
  const skin = SKIN[Math.floor(Math.abs(x * 7 + z * 13)) % SKIN.length];
  box(list, x - 0.18, y, z - 0.1, x - 0.03, y + 0.75, z + 0.1, skin); box(list, x + 0.03, y, z - 0.1, x + 0.18, y + 0.75, z + 0.1, skin);
  box(list, x - 0.24, y + 0.7, z - 0.15, x + 0.24, y + 1.4, z + 0.15, 0x8a8f96);       // armour
  box(list, x - 0.26, y + 0.55, z - 0.17, x + 0.26, y + 0.75, z + 0.17, t.band);
  box(list, x - 0.16, y + 1.42, z - 0.16, x + 0.16, y + 1.74, z + 0.16, skin);         // head
  box(list, x - 0.19, y + 1.62, z - 0.19, x + 0.19, y + 1.86, z + 0.19, 0xb8913a);      // bronze helmet
  if (t.crest) box(list, x - 0.04, y + 1.86, z - 0.2, x + 0.04, y + 2.12, z + 0.2, t.crest);
  const sx = x + facing * 0.32;                                                          // shield on the outer arm
  if (t.rect) box(list, sx - 0.05, y + 0.45, z - 0.32, sx + 0.05, y + 1.5, z + 0.32, t.shields);
  else box(list, sx - 0.05, y + 0.6, z - 0.36, sx + 0.05, y + 1.35, z + 0.36, t.shields);
  box(list, x - facing * 0.3, y + 0.8, z - 0.04, x - facing * 0.26, y + 2.6, z + 0.04, 0x6b4a2a);   // spear
}
function hullGeometry(t) {
  const L = t.L, list = [], wood = 0x7b5a3a, dark = t.hull, deckC = 0x9c7a50;
  for (let z = -L / 2; z < L / 2; z += 0.5) {
    const zc = z + 0.25, hw = halfWidth(t, zc), endRise = zc < -L / 2 + 3 ? (-L / 2 + 3 - zc) * 0.35 : zc > L / 2 - 2 ? (zc - L / 2 + 2) * 0.25 : 0;
    box(list, -hw * 0.8, -0.7, z, hw * 0.8, -0.35, z + 0.5, dark);                       // keel and bottom
    box(list, -hw + 0.02, -0.45, z, hw - 0.02, 0.18, z + 0.5, dark);                      // the hull below the rowers' floor
    for (const s of [-1, 1]) {
      box(list, s * hw - 0.09, -0.4, z, s * hw + 0.09, t.hs + endRise, z + 0.5, dark);    // the sides, black with pitch
      box(list, s * hw - 0.1, t.hs - 0.32 + endRise * 0.5, z, s * hw + 0.1, t.hs - 0.12 + endRise * 0.5, z + 0.5, t.band);
    }
  }
  // The deck over the rowers, held up on posts, with the top row of rowers in the open gap below it.
  const d0 = -L / 2 + 2.6, d1 = L / 2 - 2.6;
  for (let z = d0; z < d1; z += 0.5) { const hw = Math.min(halfWidth(t, z), halfWidth(t, z + 0.5)) - 0.05; box(list, -hw, t.dk - 0.14, z, hw, t.dk, z + 0.5, deckC); }
  for (let z = d0; z <= d1; z += 2) for (const s of [-1, 1]) { const hw = halfWidth(t, z); box(list, s * hw - 0.06, t.hs, z - 0.06, s * hw + 0.06, t.dk, z + 0.06, wood); }
  for (const s of [-1, 1]) for (let z = d0; z < d1; z += 0.5) { const hw = halfWidth(t, z + 0.25); box(list, s * hw - 0.05, t.dk, z, s * hw + 0.05, t.dk + 0.5, z + 0.5, wood); }   // rail
  if (t.outrigger) for (const s of [-1, 1]) for (let z = d0 + 0.5; z < d1 - 0.5; z += 0.5) { const hw = halfWidth(t, z + 0.25); box(list, s * (hw + t.outrigger) - 0.06, t.hs + 0.15, z, s * (hw + t.outrigger) + 0.06, t.hs + 0.3, z + 0.5, wood); }
  // The bronze ram at the waterline, the curving stern ornament and the painted eyes.
  const bow = L / 2;
  box(list, -0.32, -0.45, bow - 0.6, 0.32, 0.05, bow + 1.5, 0xb08d3c);
  for (const y of [-0.38, -0.2, -0.02]) box(list, -0.42, y - 0.05, bow + 0.9, 0.42, y + 0.05, bow + 1.55, 0xc9a24a);
  box(list, -0.22, 0.05, bow - 0.2, 0.22, t.hs + 0.9, bow + 0.35, dark);
  for (let k = 0; k < 9; k++) { const a = k * 0.17; box(list, -0.12, 0, 0, 0.12, 0.6, 0.35, dark, null); list[list.length - 1].m = new THREE.Matrix4().makeTranslation(0, t.hs + 0.9 + 0.5 * k * Math.cos(a * 0.6), -L / 2 + 0.6 + 0.35 * k * Math.sin(a) - 0.2 * k).multiply(rotX(a)).multiply(new THREE.Matrix4().makeScale(0.24, 0.6, 0.35)); }
  for (const s of [-1, 1]) { const hw = halfWidth(t, bow - 2.4) + 0.1; box(list, s * hw - 0.02, t.hs - 0.05, bow - 2.7, s * hw + 0.02, t.hs + 0.45, bow - 2.1, 0xf2efe6); box(list, s * hw - 0.03, t.hs + 0.07, bow - 2.55, s * hw + 0.03, t.hs + 0.33, bow - 2.25, 0x121212); }
  // Two big steering oars at the stern.
  for (const s of [-1, 1]) { const m = new THREE.Matrix4().makeTranslation(s * (halfWidth(t, -L / 2 + 2.5) + 0.25), t.hs * 0.5, -L / 2 + 1.4).multiply(rotX(0.55)).multiply(new THREE.Matrix4().makeScale(0.14, 3.2, 0.14)); list.push({ m, color: 0x6b4a2a }); box(list, s * (halfWidth(t, -L / 2 + 2.5) + 0.25) - 0.05, -0.9, -L / 2 - 0.25, s * (halfWidth(t, -L / 2 + 2.5) + 0.25) + 0.05, -0.2, -L / 2 + 0.25, 0x6b4a2a); }
  // Mast, yard and a striped square sail.
  const mz = L * 0.08, top = t.dk + 6.5, sw = t.B * 0.95;
  box(list, -0.13, t.dk, mz - 0.13, 0.13, top + 0.4, mz + 0.13, 0x6b4a2a);
  box(list, -sw - 0.2, top - 0.1, mz + 0.14, sw + 0.2, top + 0.1, mz + 0.3, 0x6b4a2a);
  const sh = 3.4, bands = t.sail;
  for (let k = 0; k < 3; k++) box(list, -sw, top - (k + 1) * sh / 3, mz + 0.3, sw, top - k * sh / 3, mz + 0.36, bands[k]);
  // The Roman corvus: a boarding bridge hauled up against a pole, with an iron spike underneath its end.
  if (t.corvus) {
    const cz = L / 2 - 4.2;
    box(list, -0.15, t.dk, cz - 0.15, 0.15, t.dk + 6, cz + 0.15, 0x6b4a2a);
    const m = new THREE.Matrix4().makeTranslation(0, t.dk + 3.2, cz + 1.2).multiply(rotX(-1.05)).multiply(new THREE.Matrix4().makeScale(1.1, 0.12, 6));
    list.push({ m, color: 0x8a6a42 });
    box(list, -0.08, t.dk + 5.3, cz + 2.4, 0.08, t.dk + 5.9, cz + 2.6, 0x3a3a3a);
  }
  // (The soldiers on deck, the helmsman and the flute player are real people now: see crewOf.)
  return mergeBoxes(list);
}
function oarGeometry() {
  const list = [];
  box(list, 0, -0.045, -0.045, 1, 0.045, 0.045, 0xb89466);       // the shaft, stretched to each oar's length (handle included)
  return mergeBoxes(list);
}
function bladeGeometry() { const list = []; box(list, 0, -0.17, -0.03, 1, 0.17, 0.03, 0xb89466); return mergeBoxes(list); }
function rowerGeometry() {
  // Sitting facing the stern (-z), hands on the oar handle in front of him; the matrix pivots him at the hips.
  const list = [], skin = 0xb98058, tunic = 0xe2d6bb;
  box(list, -0.2, 0, -0.12, 0.2, 0.62, 0.12, tunic);
  box(list, -0.15, 0.64, -0.15, 0.15, 0.94, 0.15, skin);
  box(list, -0.16, 0.9, -0.12, 0.16, 0.99, 0.17, 0x3a2716);
  box(list, -0.24, 0.42, -0.62, -0.14, 0.52, -0.02, skin); box(list, 0.14, 0.42, -0.62, 0.24, 0.52, -0.02, skin);
  box(list, -0.18, -0.08, -0.65, 0.18, 0.08, 0, skin);
  return mergeBoxes(list);
}

/// The people on deck: soldiers (marines) with shields and spears, the helmsman at the steering oars, and on a trireme
/// the flute player who keeps the rowers in time. They stand still, so they're posed once.
function crewOf(t, body) {
  const army = { tunic: t.band, shield: t.shields, helm: 0xb8913a, crest: t.crest, rect: t.rect };
  const d0 = -t.L / 2 + 2.6, d1 = t.L / 2 - 2.6, mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const marines = new Squad(body, rig(soldierLook(army, t.L | 0)), t.marines, mat);
  for (let k = 0; k < t.marines; k++) {
    const sd = k % 2 ? 1 : -1, z = d0 + 1.5 + (d1 - d0 - 3) * Math.floor(k / 2) / Math.max(1, Math.ceil(t.marines / 2) - 1);
    marines.setPose(k, sd * (halfWidth(t, z) - 0.6), t.dk, z, sd > 0 ? Math.PI / 2 : -Math.PI / 2, { armL: -0.35, armR: -0.15, armRz: 0.05 });
  }
  marines.done();
  const others = new Squad(body, rig(rowerLook(0xe7dcc2, 3)), t.piper ? 2 : 1, mat);
  others.setPose(0, 0, t.dk, -t.L / 2 + 2.9, 0, { armL: -0.9, armR: -0.9, armLz: 0.5, armRz: -0.5 });   // the helmsman, a steering oar in each hand
  if (t.piper) others.setPose(1, 0, t.dk, d0 + 1, Math.PI, { armL: -1.3, armR: -1.3, armLz: -0.25, armRz: 0.25 });   // playing the aulos, facing the rowers
  others.done();
}

// ---------- finding sea room ----------
/// Chamfer distance to the nearest spot that isn't open water, for a square of the map around a city.
function seaRoom(isWet, x0, z0, N) {
  const INF = 1e9, d = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) d[j * N + i] = isWet(x0 + i, z0 + j) ? INF : 0;
  const S = Math.SQRT2;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i; let v = d[k]; if (!v) continue;
    v = Math.min(v, i ? d[k - 1] + 1 : 1, j ? d[k - N] + 1 : 1, i && j ? d[k - N - 1] + S : S, j && i < N - 1 ? d[k - N + 1] + S : S);
    d[k] = v;
  }
  for (let j = N - 1; j >= 0; j--) for (let i = N - 1; i >= 0; i--) {
    const k = j * N + i; let v = d[k]; if (!v) continue;
    v = Math.min(v, i < N - 1 ? d[k + 1] + 1 : 1, j < N - 1 ? d[k + N] + 1 : 1, i < N - 1 && j < N - 1 ? d[k + N + 1] + S : S, j < N - 1 && i ? d[k + N - 1] + S : S);
    d[k] = v;
  }
  return d;
}
const segDist = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz; const u = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0; return Math.hypot(px - ax - dx * u, pz - az - dz * u); };

/// A course for one ship: two places with a clear lane between them, as near the city as possible and away from the
/// other ships. Best of all, both ends have room to turn on the spot ('turn' courses). In narrow water the ship rows to
/// the far end and then backs water all the way home, stern first ('shuttle' courses), as real galleys could.
function chartCourse(room, x0, z0, N, cx, cz, t, lanes, far = 200) {
  const reach = Math.max(...t.oar) * 0.95 + t.B / 2 + (t.outrigger || 0);
  // Turning on the spot, the ram at the bow sweeps the widest circle; the oars, further back, a smaller one.
  const turn = Math.max(t.L / 2 + 1.6, Math.hypot(t.L / 2 - 4.2, reach)) + 0.5, lane = reach + 0.6, ext = t.L / 2 + 1.6;
  const at = (x, z) => { const i = Math.round(x) - x0, j = Math.round(z) - z0; return i < 0 || j < 0 || i >= N || j >= N ? 0 : room[j * N + i]; };
  const free = (x, z, r) => lanes.every((l) => segDist(x, z, l[0], l[1], l[2], l[3]) > r + l[4]);
  const clear = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az); for (let s = 0; s <= len; s += 0.7) { const x = ax + (bx - ax) * s / len, z = az + (bz - az) * s / len; if (at(x, z) < lane || !free(x, z, lane)) return false; } return true; };
  const spotsAbove = (need) => { const out = []; for (let j = 0; j < N; j += 2) for (let i = 0; i < N; i += 2) if (room[j * N + i] >= need) { const x = x0 + i, z = z0 + j; if (free(x, z, need)) out.push([x, z, Math.hypot(x - cx, z - cz)]); } return out.sort((a, b) => a[2] - b[2]); };
  const search = (spots, maxAway, shuttle) => {
    for (const [ax, az, d] of spots.slice(0, 120)) {
      if (d > maxAway) break;
      const cands = [];
      for (const [bx, bz] of spots) { const len = Math.hypot(bx - ax, bz - az); if (len >= 22 && len <= 80) cands.push([bx, bz, len, len - 0.6 * Math.hypot((ax + bx) / 2 - cx, (az + bz) / 2 - cz)]); }
      cands.sort((p, q) => q[3] - p[3]);
      for (const [bx, bz, len] of cands.slice(0, 500)) {
        // A shuttling ship's bow and stern reach past the ends of its lane, so the lane must be clear that far too.
        const ux = (bx - ax) / len, uz = (bz - az) / len, e = shuttle ? ext : 0;
        if (clear(ax - ux * e, az - uz * e, bx + ux * e, bz + uz * e)) return { a: [ax + 0.5, az + 0.5], b: [bx + 0.5, bz + 0.5], mode: shuttle ? 'shuttle' : 'turn', width: shuttle ? lane : turn, len };
      }
    }
    return null;
  };
  return search(spotsAbove(turn), 75, false) || search(spotsAbove(lane), Math.min(far, 140), true) || search(spotsAbove(turn), far, false);
}

// ---------- the fleet ----------
export function createShips({ scene, world, WL, IS_WATERY, cities }) {
  const surface = WL - 0.11;
  const isWet = (x, z) => {
    if (!world.inb(x, z) || !IS_WATERY[world.get(x, WL - 1, z)]) return false;
    for (let y = WL; y < WL + 12; y += 1) if (world.get(x, y, z) !== 0) return false;
    return true;
  };
  const oarMat = new THREE.MeshLambertMaterial({ vertexColors: true }), hullMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const oarGeo = oarGeometry(), bladeGeo = bladeGeometry(), rowerGeo = rowerGeometry();
  const ships = [], lanes = [];
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), M = new THREE.Matrix4(), Mb = new THREE.Matrix4(), Ms = new THREE.Matrix4();
  for (const f of FLEETS) {
    const city = cities[f.city]; if (!city) continue;
    const t = SHIP_TYPES[f.type], [cx, cz] = city.center, N = 340, x0 = Math.round(cx - N / 2), z0 = Math.round(cz - N / 2);
    const room = seaRoom(isWet, x0, z0, N);
    for (let k = 0; k < f.n; k++) {
      const c = chartCourse(room, x0, z0, N, cx, cz, t, lanes, k ? 100 : 200);   // a second ship only if there's sea near its city
      if (!c) break;
      lanes.push([c.a[0], c.a[1], c.b[0], c.b[1], c.mode === 'shuttle' ? c.width + 1 : c.width]);
      ships.push(makeShip(t, f.type, f.city, c, k));
    }
  }
  function makeShip(t, type, city, course, k) {
    const g = new THREE.Group(), body = new THREE.Group();
    g.add(body);
    const hull = new THREE.Mesh(hullGeometry(t), hullMat); hull.castShadow = hull.receiveShadow = true; body.add(hull);
    const st = stations(t), oars = [];
    for (const side of [-1, 1]) for (const [z, b] of st) oars.push({ side, z, b, len: t.oar[b], x: side * (halfWidth(t, z) + (b === 0 ? (t.outrigger || 0) : 0)), y: pivotY(t, b) });
    const shaft = new THREE.InstancedMesh(oarGeo, oarMat, oars.length), blade = new THREE.InstancedMesh(bladeGeo, oarMat, oars.length);
    const seats = [];
    for (const o of oars) if (o.b === 0) for (let m = 0; m < t.men[0]; m++) seats.push({ o, x: o.side * (Math.abs(o.x) - 0.75 - (t.outrigger ? 0 : 0) - m * 0.62), y: t.hs - 0.55, z: o.z });
    for (const m of [shaft, blade]) { m.castShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); body.add(m); }
    // The rowers are real people (two looks, taking turns along the benches), facing the stern as rowers do.
    const rowers = [0, 1].map((k) => new Squad(body, rig(rowerLook(k ? 0xd8c8a8 : 0xe9e0cc, k + type.length)), Math.ceil(seats.length / 2) - (k && seats.length % 2 ? 1 : 0), oarMat));
    seats.forEach((r, i) => { r.squad = rowers[i % 2]; r.i = i >> 1; });
    crewOf(t, body);
    const [ax, az] = course.a, [bx, bz] = course.b;
    const s = { type, city, t, course, g, body, oars, seats, shaft, blade, rowers, x: ax, z: az, yaw: Math.atan2(bx - ax, bz - az), from: 0, leg: 'row', u: 0.15, phi: k * 1.7, turning: 0, back: 0, len: course.len };
    g.position.set(s.x, surface, s.z); g.rotation.y = s.yaw;
    scene.add(g);
    pose(s, 0, true);
    return s;
  }

  /// Oars and rowers for this moment. Each side can row forward (1), back water (-1) or rest (0).
  function pose(s, time, force = false) {
    const t = s.t, stroke = (side) => (s.back ? -1 : s.turning ? (side < 0 ? 1 : -1) : 1);
    for (let i = 0; i < s.oars.length; i++) {
      const o = s.oars[i], dir = stroke(o.side), ph = s.phi * dir - o.b * 0.12;
      const sweep = -0.42 * Math.cos(ph), inWater = Math.sin(ph) > 0;
      const reachY = o.y + 0.08, dip0 = Math.asin(Math.min(0.95, reachY / (o.len * 0.96))), dip = dip0 - (inWater ? -0.02 : 0.2 * Math.sin(-ph) + 0.04);
      const yaw = o.side > 0 ? sweep : Math.PI - sweep;
      q.setFromEuler(e.set(0, yaw, -dip, 'YZX'));
      v.set(o.x, o.y, o.z);
      Mb.makeTranslation(-0.7, 0, 0); M.compose(v, q, sc.set(1, 1, 1)).multiply(Mb).multiply(Ms.makeScale(o.len + 0.7, 1, 1)); s.shaft.setMatrixAt(i, M);   // the handle reaches 0.7 inside
      Mb.makeTranslation(o.len - 1.05, 0, 0); M.compose(v, q, sc.set(1, 1, 1)).multiply(Mb); s.blade.setMatrixAt(i, M);
    }
    for (const r of s.seats) r.squad.setPose(r.i, r.x, r.y - 0.75, r.z, Math.PI, rowPose(s.phi, stroke(r.o.side)));
    for (const sq of s.rowers) sq.done();
    s.shaft.instanceMatrix.needsUpdate = s.blade.instanceMatrix.needsUpdate = true;
  }

  // Where each ship's deck is, so you can stand on it and be carried along.
  const local = (s, x, z) => { const dx = x - s.x, dz = z - s.z, c = Math.cos(s.yaw), sn = Math.sin(s.yaw); return [dx * c - dz * sn, dx * sn + dz * c]; };
  const onDeck = (s, lx, lz, pad) => Math.abs(lz) < s.t.L / 2 - 2.6 - pad && Math.abs(lx) < halfWidth(s.t, lz) - 0.1 - pad;
  const inHull = (s, lx, lz, pad) => Math.abs(lz) < s.t.L / 2 + pad && Math.abs(lx) < halfWidth(s.t, lz) + pad;
  let riding = null, time = 0;

  return {
    ships,
    /// True if a player-sized body at (x, y, z) would be inside a ship (its deck is a floor you can stand on).
    solid(x, y, z) {
      for (const s of ships) {
        if (Math.abs(x - s.x) > s.t.L || Math.abs(z - s.z) > s.t.L) continue;
        const [lx, lz] = local(s, x, z), top = surface + s.t.dk;
        if (onDeck(s, lx, lz, 0) ? y < top && y + 1.8 > surface - 0.8 : inHull(s, lx, lz, 0.25) && y < surface + s.t.hs + 0.3 && y + 1.8 > surface - 0.8) return true;
      }
      return false;
    },
    /// Moves the ships; carries you along if you're standing on a deck; lifts you aboard if you swim up to one.
    update(dt, P, wantsUp, interact = true) {
      time += dt;
      let carry = null;
      if (interact && P.ground) for (const s of ships) { const [lx, lz] = local(s, P.x, P.z); if (onDeck(s, lx, lz, -0.3) && Math.abs(P.y - (surface + s.t.dk)) < 0.25) { carry = { s, lx, lz }; break; } }
      riding = carry ? carry.s : null;
      for (const s of ships) {
        const t = s.t, near = Math.hypot(P.x - s.x, P.z - s.z);
        const [ax, az] = s.course.a, [bx, bz] = s.course.b;
        if (s.leg === 'row' || s.leg === 'back') {
          // Rowing from one end of the course to the other (or, on a shuttle course, backing water home stern first).
          s.turning = 0; s.back = s.leg === 'back' ? 1 : 0;
          s.u = Math.min(1, s.u + dt * t.speed / s.len * (s.back ? 0.5 : 0.8));
          const k = (1 - Math.cos(Math.PI * s.u)) / 2, fx = s.from ? bx : ax, fz = s.from ? bz : az, tx = s.from ? ax : bx, tz = s.from ? az : bz;
          s.x = fx + (tx - fx) * k; s.z = fz + (tz - fz) * k;
          s.phi += dt * Math.PI * 2 * (0.32 + 0.3 * Math.sin(Math.PI * s.u));
          if (s.u >= 1) {
            s.u = 0; s.from = 1 - s.from;
            if (s.course.mode === 'shuttle') s.leg = s.leg === 'row' ? 'back' : 'row';
            else { s.leg = 'turn'; s.yaw0 = s.yaw; }
          }
        } else {
          // Turn on the spot to face the other end: one side rows, the other backs water.
          s.turning = 1;
          s.u = Math.min(1, s.u + dt / 11);
          s.yaw = s.yaw0 + Math.PI * (1 - Math.cos(Math.PI * s.u)) / 2;
          s.phi += dt * Math.PI * 2 * 0.4;
          if (s.u >= 1) { s.leg = 'row'; s.u = 0; s.turning = 0; const fx = s.from ? bx : ax, fz = s.from ? bz : az, tx = s.from ? ax : bx, tz = s.from ? az : bz; s.yaw = Math.atan2(tx - fx, tz - fz); }
        }
        s.g.position.set(s.x, surface, s.z); s.g.rotation.y = s.yaw;
        s.body.rotation.z = Math.sin(time * 0.8 + s.len) * 0.012; s.body.rotation.x = Math.sin(time * 1.1 + s.len) * 0.006;
        s.g.visible = near < 260;
        if (near < 150) pose(s, time);
      }
      if (carry) {
        // Keep your place on the deck: the same spot relative to the ship, turned as the ship turns.
        const s = carry.s, c = Math.cos(s.yaw), sn = Math.sin(s.yaw), [lx, lz] = [carry.lx, carry.lz];
        const nx = s.x + lx * c + lz * sn, nz = s.z - lx * sn + lz * c;
        P.yaw += s.yaw - (s.lastYaw ?? s.yaw); P.x = nx; P.z = nz;
      }
      for (const s of ships) {
        s.lastYaw = s.yaw;
        // A ship never rows through you: if it reaches you in the water, you're nudged out to its side.
        if (s === riding || !interact) continue;
        const [lx, lz] = local(s, P.x, P.z);
        if (!inHull(s, lx, lz, 0.35) || P.y >= surface + s.t.dk - 0.05) continue;
        const out = Math.sign(lx || 1) * (halfWidth(s.t, lz) + 0.45), c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
        P.x = s.x + out * c + lz * sn; P.z = s.z - out * sn + lz * c;
      }
      // Climbing aboard: swim up against the side of a ship.
      if (interact && wantsUp && P.water && !carry) for (const s of ships) {
        const [lx, lz] = local(s, P.x, P.z);
        if (!inHull(s, lx, lz, 1.5) || Math.abs(lz) > s.t.L / 2 - 3.2) continue;
        const inward = Math.sign(lx) * Math.max(0.1, halfWidth(s.t, lz) - 0.7), c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
        P.x = s.x + inward * c + lz * sn; P.z = s.z - inward * sn + lz * c; P.y = surface + s.t.dk + 0.02; P.vy = 0; P.ground = true;
        return s;
      }
      return null;
    },
    get riding() { return riding; },
    /// The nearest ship to a point, for the "you spotted…" card.
    nearest(x, z) { let best = null, bd = Infinity; for (const s of ships) { const d = Math.hypot(x - s.x, z - s.z); if (d < bd) { bd = d; best = s; } } return best ? { s: best, d: bd } : null; },
  };
}
