// Polis World (computer version): great battles and other turning points of ancient history, each at a place near the
// city it belongs to. A carved stone marks the spot. At a battle, two armies (or two fleets) re-enact it over and over:
// they advance, push shield against shield, fall back and form up again (nobody gets hurt in this game). Other events
// have something to see: the clay soldiers of the Terracotta Army, Ashoka's lion pillar, Vesuvius smoking.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { mergeBoxes } from './scenery.js';
import { buildWild } from './animals.js';
import { rig, Squad, soldierLook, rowerLook, rowPose } from './figures.js';

// Each army: a name, its tunic colour, its shields and helmet, and the shape of its shields.
const ARMY = {
  athens: { name: 'Athenians', tunic: 0xb83a2e, shield: 0xc9a23a, helm: 0xb8913a, crest: 0x2a2a2a, round: true },
  sparta: { name: 'Spartans', tunic: 0xa8201e, shield: 0xb8913a, helm: 0xb8913a, crest: 0xa8201e, round: true },
  greek: { name: 'Greeks', tunic: 0x3a5aa8, shield: 0xc9a23a, helm: 0xb8913a, crest: 0x2a2a2a, round: true },
  macedon: { name: 'Macedonians', tunic: 0x7a2a8a, shield: 0xc9a23a, helm: 0xc0c4c8, crest: 0xe8e0d0, round: true, pike: true },
  persia: { name: 'Persians', tunic: 0x3a7a5a, shield: 0xd8b878, helm: 0xe8dcc0, crest: null, wicker: true },
  egypt: { name: 'Egyptians', tunic: 0xf0ead8, shield: 0x8a5a32, helm: 0x2f5fb0, crest: null },
  hittite: { name: 'Hittites', tunic: 0x9a6a3a, shield: 0x6a4a2a, helm: 0x8a8a86, crest: null },
  rome: { name: 'Romans', tunic: 0xa3262a, shield: 0xa3262a, helm: 0xc0c4c8, crest: 0xa3262a, rect: true },
  carthage: { name: 'Carthaginians', tunic: 0x6e2a7a, shield: 0xe8dcc0, helm: 0xb8913a, crest: 0xe8dcc0, round: true },
};
const FLEET = {
  greek: { name: 'Greek fleet', hull: 0x262321, sail: 0xf3ecd9, band: 0xb8402e }, persia: { name: 'Persian fleet', hull: 0x4a3a2a, sail: 0x3a7a5a, band: 0xd8b878 },
  octavian: { name: 'Octavian', hull: 0x2b2420, sail: 0xf0e6d0, band: 0xa3262a }, egypt: { name: 'Antony and Cleopatra', hull: 0x3a2a1a, sail: 0x6e2a7a, band: 0xe0b84a },
  wu: { name: 'Wu and Shu', hull: 0x3a2a1a, sail: 0xc23a2a, band: 0x2a2a2a }, wei: { name: 'Wei (Cao Cao)', hull: 0x3a2a1a, sail: 0x2a4a8a, band: 0xe0b84a, fire: true },
  khmer: { name: 'Khmer', hull: 0x5a3a20, sail: 0xd8c48a, band: 0xc9a23a }, cham: { name: 'Cham', hull: 0x4a3020, sail: 0x9a3a2a, band: 0x2a2a2a },
};

// at: [city, direction (0 = east, π/2 = south), distance]. kind: 'land' | 'sea' | 'event'.
export const EVENTS = [
  { id: 'marathon', name: 'The Battle of Marathon', date: '490 BCE', at: ['athens', 0.5, 55], kind: 'land', sides: ['athens', 'persia'],
    text: 'A Persian army landed at Marathon, near Athens. About 10,000 Athenians and 1,000 men from Plataea charged at a run, and won. A later story says a messenger ran about 40 km back to Athens with the news. That\'s why a long race is called a marathon today.' },
  { id: 'thermopylae', name: 'The Battle of Thermopylae', date: '480 BCE', at: ['athens', -1.7, 78], kind: 'land', sides: ['sparta', 'persia'], narrow: true,
    text: 'King Leonidas of Sparta and a few thousand Greeks held a narrow pass between the mountains and the sea for three days against the huge army of the Persian king Xerxes. They lost in the end, but they gave the rest of Greece time to get ready.' },
  { id: 'salamis', name: 'The Battle of Salamis', date: '480 BCE', at: ['athens', 2.2, 45], kind: 'sea', sides: ['greek', 'persia'],
    text: 'The Athenian leader Themistocles tricked the much bigger Persian fleet into the narrow strait of Salamis, where its ships couldn\'t turn. Greek triremes rammed them with their bronze rams. The victory saved Greece, and helped make Athens the leading sea power.' },
  { id: 'gaugamela', name: 'The Battle of Gaugamela', date: '331 BCE', at: ['babylon', -1.4, 70], kind: 'land', sides: ['macedon', 'persia'],
    text: 'Alexander the Great of Macedon beat the Persian king Darius III on a wide, flat plain near the river Tigris. Then Alexander marched into Babylon. In a few years he ruled an empire from Greece to India.' },
  { id: 'kadesh', name: 'The Battle of Kadesh', date: '1274 BCE', at: ['jerusalem', -0.7, 70], kind: 'land', sides: ['egypt', 'hittite'],
    text: 'Pharaoh Ramesses II of Egypt fought the Hittite Empire at Kadesh, in Syria, in one of the biggest chariot battles ever. Neither side really won. About 15 years later they signed one of the oldest peace treaties ever found.' },
  { id: 'cannae', name: 'The Battle of Cannae', date: '216 BCE', at: ['rome', 0.9, 80], kind: 'land', sides: ['carthage', 'rome'],
    text: 'Hannibal of Carthage had marched his army, and his elephants, over the Alps into Italy. At Cannae he let a much bigger Roman army push into the middle of his line, then closed in from both sides and surrounded it. Generals still study his plan today.' },
  { id: 'zama', name: 'The Battle of Zama', date: '202 BCE', at: ['carthage', 2.4, 70], kind: 'land', sides: ['rome', 'carthage'], elephants: true,
    text: 'The Roman general Scipio beat Hannibal near Carthage. When Hannibal\'s war elephants charged, Scipio\'s soldiers opened lanes in their lines, and the elephants ran straight through. Rome won the Second Punic War.' },
  { id: 'actium', name: 'The Battle of Actium', date: '31 BCE', at: ['alexandria', -2.2, 60], kind: 'sea', sides: ['octavian', 'egypt'],
    text: 'Octavian\'s fleet beat Mark Antony and Queen Cleopatra of Egypt off the coast of Greece. Octavian became Augustus, the first Roman emperor, and Egypt became part of the Roman Empire.' },
  { id: 'redCliffs', name: 'The Battle of Red Cliffs', date: '208 CE', at: ['wu', 3.0, 55], kind: 'sea', sides: ['wu', 'wei'],
    text: 'Cao Cao sailed down the Yangtze with a huge fleet to conquer the south. Sun Quan of Wu and Liu Bei sent in boats full of burning straw, and the fire spread through Cao Cao\'s ships. China stayed split into Three Kingdoms.' },
  { id: 'cham', name: 'The Khmer–Cham War on the Water', date: '1177–1181 CE', at: ['angkor', 2.6, 50], kind: 'sea', sides: ['khmer', 'cham'],
    text: 'In 1177 the Cham sailed up the river and attacked Angkor. Prince Jayavarman VII fought back and won a great battle on the water. The walls of the Bayon temple show it: boats full of warriors, with crocodiles in the water!' },
  { id: 'cyrus', name: 'Cyrus the Great Takes Babylon', date: '539 BCE', at: ['babylon', 0.2, 60], kind: 'event', show: 'cylinder',
    text: 'Cyrus the Great of Persia took Babylon, it is said without a big battle. A clay cylinder found in Babylon, the Cyrus Cylinder, tells how he let people who had been taken from their homes go back. Among them were the Jews, who returned to rebuild the Temple in Jerusalem.' },
  { id: 'terracotta', name: 'The Terracotta Army', date: 'about 210 BCE', at: ['wei', 3.1, 60], kind: 'event', show: 'terracotta',
    text: 'Qin Shi Huang, the first emperor to unite China, was buried with about 8,000 life-size clay soldiers, each with a different face. They were forgotten for over 2,000 years, until farmers digging a well found them in 1974.' },
  { id: 'greatWallBuilt', name: 'The First Great Wall', date: '221 BCE', at: ['greatWall', 1.6, 40], kind: 'event', show: 'builders',
    text: 'After uniting China, Qin Shi Huang joined older walls into one long wall to keep out raiders from the north. Soldiers and farmers built it from rammed earth. Much later, the Ming emperors rebuilt it in stone and brick: that is the wall you can visit today.' },
  { id: 'ashoka', name: 'Ashoka Chooses Peace', date: 'about 261 BCE', at: ['mohenjoDaro', 1.0, 65], kind: 'event', show: 'pillar',
    text: 'The Mauryan emperor Ashoka won a terrible war in Kalinga. Afterwards he was so sorry for all the suffering that he gave up war, followed the Buddha\'s teaching, and carved messages about kindness on stone pillars all over India. His lion pillar is on India\'s flag and money today.' },
];

const box = (list, x0, y0, z0, x1, y1, z1, color) => list.push({ m: new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2).multiply(new THREE.Matrix4().makeScale(x1 - x0, y1 - y0, z1 - z0)), color });
const SKINS = [0xc68e64, 0xa8744e, 0xd9a77e, 0x8a5a3a];
function soldierGeo(a, skin) {
  const L = [];
  box(L, -0.18, 0, -0.1, -0.03, 0.72, 0.1, skin); box(L, 0.03, 0, -0.1, 0.18, 0.72, 0.1, skin);
  box(L, -0.25, 0.62, -0.15, 0.25, 0.92, 0.15, a.tunic);
  box(L, -0.24, 0.9, -0.14, 0.24, 1.38, 0.14, a.wicker ? a.tunic : 0xb8a070);
  box(L, -0.34, 0.92, -0.08, -0.24, 1.36, 0.08, skin); box(L, 0.24, 0.92, -0.08, 0.34, 1.36, 0.08, skin);
  box(L, -0.15, 1.4, -0.15, 0.15, 1.72, 0.15, skin);
  box(L, -0.18, 1.62, -0.18, 0.18, 1.84, 0.18, a.helm);
  if (a.crest) box(L, -0.04, 1.84, -0.18, 0.04, 2.08, 0.18, a.crest);
  if (a.rect) box(L, -0.42, 0.5, 0.12, 0.12, 1.5, 0.2, a.shield);          // a tall Roman scutum
  else if (a.wicker) box(L, -0.42, 0.55, 0.12, 0.08, 1.45, 0.18, a.shield);
  else { box(L, -0.46, 0.72, 0.12, 0.16, 1.34, 0.18, a.shield); box(L, -0.36, 0.82, 0.18, 0.06, 1.24, 0.2, a.shield === 0xc9a23a ? 0xe0bd52 : a.shield); }
  const len = a.pike ? 4.2 : 2.6;
  box(L, 0.3, 0.6, 0.12, 0.36, 0.6 + len, 0.18, 0x6b4a2a); box(L, 0.27, 0.6 + len, 0.1, 0.39, 0.6 + len + 0.28, 0.2, 0xc0c4c8);
  return mergeBoxes(L);
}
function terracottaGeo() { const a = { tunic: 0xa8744e, shield: 0x9a6a48, helm: 0x8a5a3a, crest: null }; const L = []; box(L, -0.18, 0, -0.1, 0.18, 0.75, 0.1, 0x9a6a48); box(L, -0.26, 0.7, -0.15, 0.26, 1.4, 0.15, 0xa8744e); box(L, -0.34, 0.8, -0.08, -0.25, 1.35, 0.08, 0x9a6a48); box(L, 0.25, 0.8, -0.08, 0.34, 1.35, 0.08, 0x9a6a48); box(L, -0.15, 1.42, -0.15, 0.15, 1.75, 0.15, 0xb07e58); box(L, -0.08, 1.75, -0.12, 0.08, 1.88, 0.06, 0x8a5a3a); void a; return mergeBoxes(L); }
function galleyGeo(f) {
  const L = [], Lh = 9, B = 1.8;
  for (let z = -Lh / 2; z < Lh / 2; z += 0.5) { const u = Math.abs(z + 0.25) / (Lh / 2), hw = Math.max(0.2, B / 2 * Math.sqrt(Math.max(0, 1 - u ** 2.5))); box(L, -hw, -0.4, z, hw, 0.55, z + 0.5, f.hull); box(L, -hw - 0.02, 0.4, z, hw + 0.02, 0.52, z + 0.5, f.band); }
  box(L, -0.18, -0.3, Lh / 2 - 0.3, 0.18, 0.1, Lh / 2 + 0.8, 0xb08d3c);
  box(L, -0.08, 0.5, -0.2, 0.08, 4.8, 0, 0x6b4a2a); box(L, -1.5, 4.6, 0, 1.5, 4.72, 0.1, 0x6b4a2a); box(L, -1.4, 2.3, 0.1, 1.4, 4.6, 0.14, f.sail);
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) { const z = -2.5 + k; box(L, s > 0 ? B / 2 : -B / 2 - 2.2, 0.05, z - 0.04, s > 0 ? B / 2 + 2.2 : -B / 2, 0.12, z + 0.04, 0xb89466); }
  return mergeBoxes(L);
}
function stoneGeo() {
  const L = [];
  box(L, -0.9, 0, -0.35, 0.9, 0.35, 0.35, 0x8f8a80); box(L, -0.65, 0.35, -0.22, 0.65, 2.3, 0.22, 0xb7b0a2); box(L, -0.5, 1.3, 0.22, 0.5, 2.05, 0.26, 0xb08d3c);
  box(L, -0.75, 2.3, -0.26, 0.75, 2.45, 0.26, 0xa8a090);
  box(L, 1.2, 0, -0.06, 1.32, 4.2, 0.06, 0x6b4a2a); box(L, 1.32, 3.1, -0.04, 2.4, 4.1, 0.04, 0xb8402e); box(L, 1.32, 3.4, -0.045, 2.4, 3.55, 0.045, 0xe0b84a);
  return mergeBoxes(L);
}
function showGeo(kind) {
  const L = [];
  if (kind === 'pillar') { box(L, -0.6, 0, -0.6, 0.6, 0.5, 0.6, 0xc9b98a); box(L, -0.3, 0.5, -0.3, 0.3, 7, 0.3, 0xd8c89a); box(L, -0.5, 7, -0.5, 0.5, 7.4, 0.5, 0xd8c89a); for (const [x, z] of [[-0.25, 0], [0.25, 0], [0, -0.25], [0, 0.25]]) { box(L, x - 0.2, 7.4, z - 0.2, x + 0.2, 8.0, z + 0.2, 0xe8dcb0); box(L, x - 0.14, 8.0, z - 0.14, x + 0.14, 8.3, z + 0.14, 0xe8dcb0); } box(L, -0.35, 8.3, -0.35, 0.35, 8.5, 0.35, 0x6a5a3a); }
  if (kind === 'cylinder') { box(L, -1, 0, -0.6, 1, 0.8, 0.6, 0x8a7a68); box(L, -0.8, 0.8, -0.35, 0.8, 1.5, 0.35, 0xd2b48a); for (let k = 0; k < 6; k++) box(L, -0.7 + k * 0.28, 0.85, 0.35, -0.62 + k * 0.28, 1.45, 0.37, 0x6a5038); }
  if (kind === 'track') { box(L, -14, 0, -1.2, 14, 0.06, 1.2, 0xd8c08a); for (const x of [-14, 14]) box(L, x - 0.2, 0, -1.4, x + 0.2, 1.4, 1.4, 0xece8dc); for (let k = -1; k <= 1; k++) box(L, -14, 0.06, k * 0.8 - 0.03, 14, 0.07, k * 0.8 + 0.03, 0xf2efe6); }
  if (kind === 'volcano') {
    // A cone of dark rock and ash with a glowing crater.
    for (let z = -10; z <= 10; z++) for (let x = -10; x <= 10; x++) { const d = Math.hypot(x, z); if (d > 10.4) continue; const h = Math.round(Math.min(10, 11 - d * 1.05 + Math.sin(x * 1.7 + z) * 0.6)); if (h <= 0) continue; const top = d < 1.6 ? 9 : h; box(L, x - 0.5, 0, z - 0.5, x + 0.5, top, z + 0.5, d < 1.6 ? 0xff6a2a : top > 7 ? 0x4a3e3a : d > 7 ? 0x7a6e5e : 0x62564c); }
  }
  if (kind === 'builders') { for (let k = 0; k < 10; k++) box(L, k * 1.1 - 5.5, 0, -1, k * 1.1 - 4.4, 1 + Math.min(k, 6) * 0.35, 1, 0xa88a62); box(L, -6, 0, 1.5, 6, 0.3, 2.2, 0x8a6a48); }
  return L.length ? mergeBoxes(L) : null;
}

export function createEvents({ scene, world, WL, cities, placed, avoid, lanes = [] }) {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const list = [];
  const busy = (x, z, pad) => avoid.some((r) => x >= r[0] - pad && x <= r[2] + pad && z >= r[1] - pad && z <= r[3] + pad) || lanes.some((l) => segD(x, z, l) < l[4] + pad);
  const TREE = new Set([7, 8, 9, 10, 11, 12, 24, 25]);
  /// The ground under any trees (armies and statues stand among the trunks, never on the treetops).
  const ground = (x, z) => { let g = world.groundY(x, z); while (g > 1 && (TREE.has(world.get(x, g - 1, z)) || world.get(x, g - 1, z) === 0)) g--; return g; };
  const land = (x, z) => world.inb(x, z) && !world.hasWater(x, z) && ground(x, z) > WL;
  const segD = (px, pz, l) => { const dx = l[2] - l[0], dz = l[3] - l[1], q = dx * dx + dz * dz, u = q ? Math.max(0, Math.min(1, ((px - l[0]) * dx + (pz - l[1]) * dz) / q)) : 0; return Math.hypot(px - l[0] - dx * u, pz - l[1] - dz * u); };
  const sea = (x, z) => { if (!world.inb(x, z) || !world.hasWater(x, z)) return false; for (let y = WL; y < WL + 6; y++) if (world.get(x, y, z)) return false; return true; };
  /// Somewhere near the preferred spot: open land fairly flat (for an army), or open water (for a fleet).
  function findSpot(px, pz, kind) {
    const need = kind === 'sea' ? 7 : kind === 'land' ? 8 : 5;
    for (let r = 0; r <= (kind === 'sea' ? 170 : 110); r += 3) for (let k = 0; k < Math.max(1, r * 2); k++) {
      const a = k / Math.max(1, r * 2) * Math.PI * 2, x = Math.round(px + Math.cos(a) * r), z = Math.round(pz + Math.sin(a) * r);
      if (busy(x, z, need + 3)) continue;
      let ok = true, lo = Infinity, hi = -Infinity;
      for (let dz = -need; dz <= need && ok; dz += 3) for (let dx = -need; dx <= need && ok; dx += 3) {
        if (kind === 'sea') ok = sea(x + dx, z + dz);
        else { if (!land(x + dx, z + dz)) ok = false; else { const g = ground(x + dx, z + dz); lo = Math.min(lo, g); hi = Math.max(hi, g); } }
      }
      if (ok && (kind === 'sea' || hi - lo <= (kind === 'land' ? 9 : 10))) return [x + 0.5, z + 0.5];
    }
    return null;
  }
  for (const ev of EVENTS) {
    const c = cities[ev.at[0]] || (placed[ev.at[0]] && { center: [placed[ev.at[0]].x, placed[ev.at[0]].z] });
    if (!c) continue;
    const px = c.center[0] + Math.cos(ev.at[1]) * ev.at[2], pz = c.center[1] + Math.sin(ev.at[1]) * ev.at[2];
    const spot = findSpot(px, pz, ev.kind);
    if (!spot) continue;
    const e = { ...ev, x: spot[0], z: spot[1], g: new THREE.Group(), t: Math.random() * 10, movers: [] };
    e.g.position.set(e.x, 0, e.z);
    scene.add(e.g);
    avoid.push([e.x - 14, e.z - 14, e.x + 14, e.z + 14]);
    // The marker stone with its bronze plaque and a banner, on the nearest dry ground.
    let sx = e.x, sz = e.z;
    if (ev.kind === 'sea') { outer: for (let r = 6; r < 40; r++) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = Math.floor(e.x + Math.cos(a) * r), z = Math.floor(e.z + Math.sin(a) * r); if (land(x, z)) { sx = x + 0.5; sz = z + 0.5; break outer; } } }
    else sz = e.z + (ev.kind === 'land' ? 9 : 6);
    const stone = new THREE.Mesh(stoneGeo(), mat); stone.position.set(sx - e.x, world.groundY(Math.floor(sx), Math.floor(sz)), sz - e.z); stone.castShadow = true; e.g.add(stone);
    e.stone = [sx, sz];
    if (ev.kind === 'land') {
      // Two armies, three ranks each, facing each other along x.
      for (const [side, dir] of [[0, 1], [1, -1]]) {
        const a = ARMY[ev.sides[side]], ranks = 3, files = ev.narrow ? 6 : 9;
        // Real people: four looks (faces, skin and hair differ), each one instanced body part for the whole army.
        const men = [];
        for (let r = 0; r < ranks; r++) for (let f = 0; f < files; f++) men.push({ r, f, k: (r * 7 + f * 3 + side) % 4, i: 0, ph: (r * 3 + f * 5) % 7 });
        const count = [0, 0, 0, 0]; for (const m of men) m.i = count[m.k]++;
        const squads = count.map((n, k) => new Squad(e.g, rig(soldierLook(a, k + side * 2)), n, mat));
        e.movers.push({ type: 'army', side, dir, men, squads, files });
      }
      if (ev.elephants) for (const z of [-3, 3]) { const el = buildWild('elephant'); el.g.scale.setScalar(0.9); e.g.add(el.g); e.movers.push({ type: 'elephant', el, z }); }
    } else if (ev.kind === 'sea') {
      for (const [side, dir] of [[0, 1], [1, -1]]) {
        const f = FLEET[ev.sides[side]], geo = galleyGeo(f);
        for (let k = 0; k < 3; k++) {
          // Each galley: its hull, and a crew of real people: six rowers on their benches and a captain at the stern.
          const m = new THREE.Group(), hull = new THREE.Mesh(geo, mat); hull.castShadow = true; m.add(hull); e.g.add(m);
          const crew = new Squad(m, rig(rowerLook(f.band === 0x2a2a2a ? 0xe2d6bb : f.sail, k + side)), 7, mat);
          e.movers.push({ type: 'ship', side, dir, k, m, fire: f.fire, crew });
        }
      }
      if (e.movers.some((m) => m.fire)) {
        const fireMat = new THREE.SpriteMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
        for (const m of e.movers.filter((q) => q.fire)) { const s = new THREE.Sprite(fireMat); s.scale.set(3, 3, 1); s.position.set(0, 2.2, -1); m.m.add(s); m.flame = s; }
      }
    } else if (ev.show === 'terracotta') {
      const geo = terracottaGeo(), m = new THREE.InstancedMesh(geo, mat, 48); m.castShadow = true;
      const M = new THREE.Matrix4(); let k = 0;
      for (let r = 0; r < 6; r++) for (let f = 0; f < 8; f++) { const x = (f - 3.5) * 1.4, z = (r - 2.5) * 1.6 - 2; M.makeTranslation(x, ground(Math.floor(e.x + x), Math.floor(e.z + z)), z); m.setMatrixAt(k++, M); }
      e.g.add(m);
    } else if (ev.show) {
      const geo = showGeo(ev.show);
      if (geo) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.y = world.groundY(Math.floor(e.x), Math.floor(e.z)) - (ev.show === 'volcano' ? 0.5 : 0); m.position.z = -3; e.g.add(m); }
      if (ev.show === 'volcano') {
        const smoke = new THREE.SpriteMaterial({ color: 0x8a8580, transparent: true, opacity: 0.55, depthWrite: false });
        e.smoke = []; for (let k = 0; k < 10; k++) { const s = new THREE.Sprite(smoke.clone()); e.g.add(s); e.smoke.push(s); }
        e.top = world.groundY(Math.floor(e.x), Math.floor(e.z)) + 10;
      }
    }
    list.push(e);
  }

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
  function update(dt, P) {
    for (const e of list) {
      const d = Math.hypot(P.x - e.x, P.z - e.z);
      e.g.visible = d < 230;
      if (d > 140) continue;
      e.t += dt;
      // The battle's rhythm: advance, clash, push back and forth, then fall back and form up again (a 24-second loop).
      const ph = (e.t % 24) / 24, adv = ph < 0.35 ? ph / 0.35 : ph < 0.7 ? 1 : 1 - (ph - 0.7) / 0.3, clash = ph >= 0.35 && ph < 0.7;
      const k = (1 - Math.cos(Math.PI * adv)) / 2;
      for (const mv of e.movers) {
        if (mv.type === 'army') {
          const gap = 12 - k * 9.6, push = clash ? Math.sin(e.t * 2.2) * 0.35 * (mv.side ? -1 : 1) : 0, turn = mv.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          const walking = !clash && adv > 0 && adv < 1;
          for (const m of mv.men) {
            const x = -mv.dir * (gap / 2 + m.r * 1.15) + push, z = (m.f - (mv.files - 1) / 2) * 0.95 + (m.r % 2) * 0.3;
            // Marching (legs and the spear arm swing), or at the clash: shields up, front rank thrusting spears, feet braced.
            const sw = walking ? Math.sin(e.t * 7 + m.ph) * 0.5 : 0, thrust = clash && m.r === 0 ? Math.max(0, Math.sin(e.t * 3.1 + m.ph)) : 0;
            const pose = clash ? { legL: 0.35, legR: -0.25, armL: -0.95, armR: -0.35 - thrust * 1.1, lean: 0.12 + thrust * 0.1 } : { legL: sw, legR: -sw, armL: -0.55, armR: -0.15 - sw * 0.3, lean: 0 };
            mv.squads[m.k].setPose(m.i, x, ground(Math.floor(e.x + x), Math.floor(e.z + z)), z, turn, pose);
          }
          for (const sq of mv.squads) sq.done();
        } else if (mv.type === 'elephant') {
          const x = -12 + k * 22;   // Hannibal's elephants charge through the lanes in the Roman line
          mv.el.g.position.set(x, ground(Math.floor(e.x + x), Math.floor(e.z + mv.z)), mv.z); mv.el.g.rotation.y = Math.PI / 2;
          mv.el.legs.forEach((l, i) => { l.rotation.x = adv > 0 && adv < 1 ? Math.sin(e.t * 6) * 0.5 * (i % 3 ? 1 : -1) : 0; });
        } else if (mv.type === 'ship') {
          const gap = 18 - k * 12, x = -mv.dir * gap / 2 + (clash ? Math.sin(e.t * 1.3 + mv.k) * 0.6 : 0), z = (mv.k - 1) * 5 + (mv.side ? 1.2 : -1.2);
          mv.m.position.set(x, WL - 0.15 + Math.sin(e.t * 1.2 + mv.k) * 0.05, z);
          mv.m.rotation.y = mv.dir > 0 ? Math.PI / 2 : -Math.PI / 2; mv.m.rotation.z = Math.sin(e.t + mv.k) * 0.03;
          if (mv.flame) { mv.flame.visible = clash; mv.flame.scale.setScalar(2.6 + Math.sin(e.t * 9 + mv.k) * 0.5); }
          let c = 0;
          for (const zz of [-2, 0, 2]) for (const sd of [-1, 1]) mv.crew.setPose(c++, sd * 0.5, 0.2 - 0.75, zz, Math.PI, rowPose(e.t * 3.4 + mv.k));
          mv.crew.setPose(c, 0, 0.55, -3.6, 0, { armL: -0.5, armR: -1.2, armRz: -0.2 });   // the captain, pointing the way
          mv.crew.done();
        }
      }
      if (e.smoke) e.smoke.forEach((s, i) => { const u = ((e.t * 0.12 + i / e.smoke.length) % 1); s.position.set(Math.sin(i * 2.1) * u * 3, e.top + u * 22, -3 + Math.cos(i * 1.7) * u * 3); s.scale.setScalar(2 + u * 9); s.material.opacity = 0.55 * (1 - u); });
    }
  }
  return { list, update, nearest(x, z) { let best = null, bd = Infinity; for (const e of list) { const d = Math.min(Math.hypot(x - e.x, z - e.z), Math.hypot(x - e.stone[0], z - e.stone[1])); if (d < bd) { bd = d; best = e; } } return best ? { e: best, d: bd } : null; } };
}
export const ARMIES = ARMY, FLEETS_OF = FLEET;
