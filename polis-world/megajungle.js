// Polis World (computer version): Hugh's megajungle — the creatures and the traps.
// Hugh invented this place. It's a jungle on a high plateau where it never stops raining. The ironwood trees hold
// pools of rain in their crowns, full of fish; birds hunt over the canopy; a camouflaged jaguar prowls the floor; and
// almost everything is a trap. The land itself (the plateau, the trees, the pools, the vines and the flood holes) is
// built by worldgen.js; this file brings it to life, but only while you're near it.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { boxUvs } from './graphics.js';

// What each creature is called, how tough it is, what it leaves behind, and what Hugh says about it.
export const JUNGLE = {
  canopyArapaima: { name: 'canopy arapaima', hp: 1, drops: [['rawFish', 2, 3]],
    fact: 'A canopy arapaima! This huge fish lives in the rain pools high up in the ironwood trees. It leaps right out of the water to catch smaller fish — and to jump from one pool to another.' },
  viperEel: { name: 'viper eel', hp: 2, drops: [['rawFish', 1, 1]],
    fact: 'A viper eel! It weaves between the vines and gives anything that touches it an electric shock. Stay out of its pool!' },
  siphonCatfish: { name: 'siphon catfish', hp: 1, drops: [['rawFish', 1, 2]],
    fact: 'A siphon catfish! It climbs right out of its pool and up and down the tree trunks to feed on algae.' },
  torrentLorikeet: { name: 'torrent lorikeet', hp: 3, drops: [['greenFeather', 1, 1], ['redFeather', 0, 1]],
    fact: 'Torrent lorikeets! These little parrots hunt fish at the surface of the pools up in the canopy.' },
  harpyWyvern: { name: 'harpy wyvern', hp: 30, drops: [['whiteFeather', 2, 4], ['yellowFeather', 1, 2], ['leather', 1, 2]],
    fact: 'A harpy wyvern! An enormous harpy eagle that hunts literally everything. When the invisible fauna glows purple or a slick wing macaw calls, it knows where you are — and it comes for you.' },
  slickwingMacaw: { name: 'slick wing macaw', hp: 4, drops: [['blueFeather', 1, 2], ['yellowFeather', 0, 1]],
    fact: 'A slick wing macaw! Its feathers shine like metal. When it spots you it flashes them and screeches, and every harpy wyvern in the jungle knows where you are.' },
  glowMimicAmazon: { name: 'glow mimic amazon', hp: 4, drops: [['greenFeather', 1, 2]],
    fact: 'A glow mimic amazon! This parrot copies the purple flash of the invisible fauna, to confuse you — and the predators. Not every purple flash means danger…' },
  phantomJaguar: { name: 'phantom jaguar', hp: 16, drops: [['leather', 1, 2]],
    fact: 'A phantom jaguar! It is camouflaged so well you can hardly see it, and it never makes the invisible fauna glow. It stalks you, then pounces.' },
  anchorSloth: { name: 'anchor sloth', hp: 999, drops: [],
    fact: 'An anchor sloth! Its fur is made of stone, so it is far too heavy for a flash flood to sweep away. It eats bamboo, and mist mimic moths live in its fur.' },
  vampireKite: { name: 'vampire kite', hp: 2, drops: [['redFeather', 0, 1]],
    fact: 'Vampire kites! Small birds that find you by your body heat and suck your blood. Jump into water to cool off and they will lose you.' },
  purpleFauna: { name: 'purple invisible fauna', hp: 0, drops: [],
    fact: 'You disturbed some purple invisible fauna! You cannot see them until they are disturbed — then they glow purple, and every predator in the jungle sees where you are.' },
  spongeLeech: { name: 'sponge leech', hp: 0, drops: [],
    fact: 'Sponge leeches latched onto you! They make you slow and heavy, so you can\'t run or jump as well. They let go after a while — or straight away if you hold a torch or stand by a fire.' },
  mistMoth: { name: 'mist mimic moths', hp: 0, drops: [],
    fact: 'Mist mimic moths! They live in the anchor sloths\' fur, and when a flash flood bursts they swarm you so you can hardly see.' },
};

// ---------- models ----------
const BOX = boxUvs(new THREE.BoxGeometry(1, 1, 1));   // rounded-box faces (graphics.js)
const MATS = new Map();
const mat = (c, extra) => { const k = c + (extra ? JSON.stringify(extra) : ''); let m = MATS.get(k); if (!m) { m = new THREE.MeshLambertMaterial({ color: c, ...(extra || {}) }); MATS.set(k, m); } return m; };
function box(parent, sx, sy, sz, color, x, y, z, m) {
  const b = new THREE.Mesh(BOX, m || mat(color));
  b.scale.set(sx, sy, sz); b.position.set(x, y, z); b.castShadow = true;
  parent.add(b); return b;
}
const pivot = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
/// A pair of wings on pivots at the shoulders, so they can flap.
function wings(g, span, chord, y, z, c1, c2) {
  const out = [];
  for (const s of [-1, 1]) {
    const w = pivot(g, s * 0.06, y, z);
    box(w, span * 0.55, 0.04, chord, c1, s * span * 0.28, 0, 0);
    box(w, span * 0.45, 0.035, chord * 0.75, c2, s * span * 0.75, 0, -chord * 0.1);
    out.push(w);
  }
  return out;
}

function build(kind) {
  const g = new THREE.Group(), parts = {};
  switch (kind) {
    case 'canopyArapaima': {
      // Long and heavy, olive above and red towards the tail, the way real arapaima are.
      box(g, 0.32, 0.3, 1.5, 0x5a6a3a, 0, 0, 0);
      box(g, 0.3, 0.12, 1.3, 0xb8b090, 0, -0.14, 0.05);
      box(g, 0.26, 0.26, 0.4, 0xa8382a, 0, 0, -0.7);
      parts.tail = pivot(g, 0, 0, -0.9); box(parts.tail, 0.06, 0.4, 0.35, 0xa8382a, 0, 0, -0.15);
      box(g, 0.28, 0.24, 0.3, 0x4a5a30, 0, 0.02, 0.78);
      for (const s of [-1, 1]) box(g, 0.02, 0.05, 0.05, 0x111111, s * 0.14, 0.06, 0.82);
      break;
    }
    case 'viperEel': {
      // A string of segments that ripples as it swims; dark green with electric-blue bands.
      parts.segs = [];
      for (let k = 0; k < 7; k++) { const s = pivot(g, 0, 0, 0.6 - k * 0.2); box(s, 0.14, 0.14, 0.22, k % 2 ? 0x2a4a2a : 0x3a8ab8, 0, 0, 0); parts.segs.push(s); }
      box(parts.segs[0], 0.16, 0.12, 0.12, 0x2a4a2a, 0, 0, 0.14);
      for (const s of [-1, 1]) box(parts.segs[0], 0.02, 0.04, 0.04, 0xf0e040, s * 0.08, 0.04, 0.12);
      break;
    }
    case 'siphonCatfish': {
      box(g, 0.34, 0.2, 0.7, 0x6a5a48, 0, 0, 0);
      box(g, 0.4, 0.18, 0.24, 0x7a6a52, 0, 0, 0.36);
      for (const s of [-1, 1]) { box(g, 0.25, 0.02, 0.02, 0x3a2a1e, s * 0.28, -0.02, 0.48); box(g, 0.2, 0.04, 0.22, 0x5a4a38, s * 0.24, -0.08, 0.1); }   // whiskers, and the fins it climbs with
      parts.tail = pivot(g, 0, 0, -0.35); box(parts.tail, 0.04, 0.22, 0.25, 0x5a4a38, 0, 0, -0.12);
      box(g, 0.24, 0.12, 0.16, 0xd8c8a8, 0, -0.06, 0.46);     // the sucker mouth
      break;
    }
    case 'torrentLorikeet': {
      box(g, 0.16, 0.16, 0.26, 0x2a9a3a, 0, 0, 0);
      box(g, 0.14, 0.13, 0.13, 0x3a5ad8, 0, 0.06, 0.15);
      box(g, 0.13, 0.08, 0.1, 0xe8402a, 0, -0.03, 0.12);
      box(g, 0.05, 0.05, 0.07, 0xf0a020, 0, 0.03, 0.24);
      box(g, 0.06, 0.03, 0.22, 0x2a9a3a, 0, 0, -0.22);
      parts.wings = wings(g, 0.55, 0.16, 0.04, 0, 0x2a9a3a, 0xf0d040);
      break;
    }
    case 'harpyWyvern': {
      // A harpy eagle grown enormous: grey wings, a pale chest, a black band, a double crest and huge yellow feet.
      box(g, 0.7, 0.7, 1.6, 0x5a5e62, 0, 0, 0);
      box(g, 0.66, 0.5, 0.9, 0xeae6dc, 0, -0.14, 0.2);
      box(g, 0.72, 0.18, 0.3, 0x2a2a2e, 0, 0.12, 0.62);
      box(g, 0.46, 0.46, 0.5, 0x8a8e92, 0, 0.3, 0.95);
      box(g, 0.2, 0.2, 0.26, 0x2a2a2a, 0, 0.22, 1.28);
      box(g, 0.12, 0.16, 0.12, 0x2a2a2a, 0, 0.1, 1.38);
      for (const s of [-1, 1]) { box(g, 0.08, 0.32, 0.12, 0x2a2a2e, s * 0.14, 0.65, 0.82); box(g, 0.05, 0.05, 0.03, 0xf0c020, s * 0.2, 0.36, 1.18); }
      box(g, 0.5, 0.06, 0.9, 0x5a5e62, 0, 0.05, -1.1);
      for (const s of [-1, 1]) { const f = pivot(g, s * 0.2, -0.4, 0.3); box(f, 0.12, 0.4, 0.12, 0xf0c020, 0, -0.15, 0); box(f, 0.3, 0.06, 0.34, 0x2a2a2a, 0, -0.36, 0.06); }
      parts.wings = wings(g, 5.2, 1.2, 0.2, 0.1, 0x5a5e62, 0x3a3e42);
      break;
    }
    case 'slickwingMacaw': {
      // Metallic feathers: shiny materials that catch the light.
      const shine = (c) => new THREE.MeshPhongMaterial({ color: c, specular: 0xffffff, shininess: 120 });
      box(g, 0.26, 0.28, 0.42, 0, 0, 0, 0, shine(0x2ab8c8));
      box(g, 0.22, 0.22, 0.22, 0, 0, 0.14, 0.26, shine(0xe8b830));
      box(g, 0.12, 0.14, 0.12, 0x2a2a2a, 0, 0.08, 0.42);
      box(g, 0.08, 0.04, 0.6, 0, 0, -0.02, -0.46, shine(0x2a6ad8));
      for (const s of [-1, 1]) box(g, 0.03, 0.06, 0.06, 0xffffff, s * 0.1, 0.18, 0.34);
      parts.wings = wings(g, 1.2, 0.3, 0.06, 0, 0x2ab8c8, 0xe8b830);
      for (const w of parts.wings) w.traverse((o) => { if (o.isMesh) o.material = shine(o.material.color.getHex()); });
      parts.glint = box(g, 1.6, 0.04, 0.04, 0xffffff, 0, 0.25, 0, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
      break;
    }
    case 'glowMimicAmazon': {
      box(g, 0.24, 0.24, 0.36, 0x3a9a3a, 0, 0, 0);
      box(g, 0.2, 0.2, 0.2, 0x4ab84a, 0, 0.12, 0.22);
      box(g, 0.12, 0.06, 0.04, 0xd8d040, 0, 0.18, 0.32);
      box(g, 0.1, 0.12, 0.1, 0x3a3a3a, 0, 0.06, 0.36);
      box(g, 0.08, 0.04, 0.34, 0x2a7a2a, 0, -0.02, -0.32);
      parts.wings = wings(g, 0.95, 0.26, 0.05, 0, 0x3a9a3a, 0x8a3ad8);
      break;
    }
    case 'phantomJaguar': {
      // Almost see-through: you notice it by the way the rain bends round it.
      const m = new THREE.MeshLambertMaterial({ color: 0x6a8a5a, transparent: true, opacity: 0.12, depthWrite: false });
      const spot = new THREE.MeshLambertMaterial({ color: 0x2a3a22, transparent: true, opacity: 0.12, depthWrite: false });
      box(g, 0.6, 0.48, 1.35, 0, 0, 0.78, 0, m); box(g, 0.46, 0.42, 0.42, 0, 0, 0.95, 0.85, m);
      for (const s of [-1, 1]) box(g, 0.1, 0.1, 0.06, 0, s * 0.17, 1.2, 0.8, m);
      for (let k = 0; k < 8; k++) box(g, 0.62, 0.08, 0.08, 0, 0, 0.82 + (k % 2) * 0.12, -0.5 + k * 0.15, spot);
      box(g, 0.09, 0.09, 0.6, 0, 0, 0.9, -0.95, m);
      for (const s of [-1, 1]) box(g, 0.06, 0.04, 0.02, 0, s * 0.12, 1.03, 1.065, new THREE.MeshBasicMaterial({ color: 0xd8f040, transparent: true, opacity: 0.5 }));
      parts.legs = [];
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = pivot(g, sx * 0.2, 0.55, sz * 0.48); box(l, 0.15, 0.55, 0.15, 0, 0, -0.27, 0, m); parts.legs.push(l); }
      parts.mats = [m, spot];
      break;
    }
    case 'anchorSloth': {
      // Stone fur: grey and lumpy, like a mossy boulder with a sleepy face.
      const stone = 0x7a7a74, dark = 0x5a5a56, moss = 0x4a6a3a;
      box(g, 0.8, 0.85, 0.9, stone, 0, 0.6, 0);
      for (const [x, y, z] of [[-0.3, 0.95, 0.2], [0.32, 0.9, -0.2], [0, 1.05, -0.1], [-0.28, 0.5, -0.3], [0.3, 0.45, 0.3]]) box(g, 0.32, 0.26, 0.32, (x + z) > 0 ? dark : moss, x, y, z);
      box(g, 0.44, 0.4, 0.36, stone, 0, 1.1, 0.42);
      box(g, 0.32, 0.22, 0.06, 0xc8c0a8, 0, 1.06, 0.6);
      for (const s of [-1, 1]) { box(g, 0.1, 0.06, 0.04, 0x2a2420, s * 0.09, 1.1, 0.63); box(g, 0.14, 0.5, 0.14, dark, s * 0.42, 0.6, 0.32); box(g, 0.1, 0.05, 0.2, 0xe8e0c8, s * 0.42, 0.33, 0.4); }
      parts.head = g.children[6];
      break;
    }
    case 'vampireKite': {
      box(g, 0.12, 0.1, 0.22, 0x5a1a2a, 0, 0, 0);
      box(g, 0.1, 0.09, 0.09, 0x3a0a1a, 0, 0.03, 0.13);
      box(g, 0.03, 0.03, 0.06, 0xe8e0d0, 0, 0, 0.19);
      for (const s of [-1, 1]) box(g, 0.02, 0.02, 0.02, 0xff3020, s * 0.04, 0.05, 0.17);
      box(g, 0.14, 0.02, 0.12, 0x3a0a1a, 0, 0, -0.16);
      parts.wings = wings(g, 0.5, 0.14, 0.02, 0, 0x5a1a2a, 0x3a0a1a);
      break;
    }
    case 'purpleFauna': {
      // You only ever see one when it glows: a little ghostly six-legged thing, all purple light.
      const m = new THREE.MeshBasicMaterial({ color: 0xc040ff, transparent: true, opacity: 0, depthWrite: false });
      box(g, 0.34, 0.16, 0.5, 0, 0, 0.12, 0, m);
      box(g, 0.2, 0.14, 0.18, 0, 0, 0.16, 0.3, m);
      for (let k = 0; k < 3; k++) for (const s of [-1, 1]) box(g, 0.22, 0.03, 0.04, 0, s * 0.22, 0.06, -0.15 + k * 0.15, m);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 24), new THREE.MeshBasicMaterial({ color: 0xc040ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
      parts.m = m; parts.ring = ring;
      break;
    }
  }
  return { g, parts };
}

// ---------- the jungle ----------
export function createMegajungle({ scene, group, world, H, IS_WATER, IS_SOLID, mj, sound, say, spotted, hurt, drop, held, nearFire }) {
  const { cx, cz, ph, PY, pools, holes } = mj;
  const edge = (a) => mj.R * (1 + 0.12 * Math.sin(3 * a + ph[0]) + 0.08 * Math.sin(5 * a + ph[1]) + 0.05 * Math.sin(9 * a + ph[2]));
  const inside = (x, z) => Math.hypot(x - cx, z - cz) <= edge(Math.atan2(z - cz, x - cx));
  const floorAt = (x, z) => world.groundY(Math.floor(x), Math.floor(z), PY + 3);       // the jungle floor, under the canopy
  const topAt = (x, z) => world.groundY(Math.floor(x), Math.floor(z));                 // the very top: the canopy
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const fx = new THREE.Group(); scene.add(fx);
  let live = false, all = [], fauna = [], puffs = [], swarm = null;
  const state = { leeches: [], kites: 0, slow: 1, inside: false };
  const leechGroup = new THREE.Group(); scene.add(leechGroup);

  // A random spot on the jungle floor, well in from the cliffs.
  function floorSpot(margin = 4) {
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * (edge(a) - margin);
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y = floorAt(x, z);
      if (y >= PY - 1 && !IS_SOLID[world.get(Math.floor(x), y, Math.floor(z))] && !IS_SOLID[world.get(Math.floor(x), y + 1, Math.floor(z))]) return [x, y, z];
    }
    return [cx, floorAt(cx, cz), cz];
  }
  /// Somewhere on top of the canopy for a bird to sit.
  function perch() {
    for (let k = 0; k < 30; k++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * (edge(a) - 6);
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y = topAt(x, z);
      if (y > PY + 12) return [x, y, z];
    }
    return [cx, PY + 25, cz];
  }
  function add(kind, x, y, z, extra = {}) {
    const { g, parts } = build(kind);
    const c = { kind, g, parts, x, y, z, yaw: Math.random() * 6.28, hp: JUNGLE[kind].hp, t: 0, st: 'idle', cool: rand(2, 8), ...extra };
    g.position.set(x, y, z);
    if (kind !== 'purpleFauna') { g.userData.entity = { kind: 'jungle', c, name: JUNGLE[kind].name, x, z }; c.ent = g.userData.entity; }
    group.add(g);
    all.push(c);
    return c;
  }
  function spawn() {
    live = true;
    // Fish in every pool.
    pools.forEach((p, i) => {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        const kind = pick(['canopyArapaima', 'canopyArapaima', 'viperEel', 'siphonCatfish', 'siphonCatfish']);
        const c = add(kind, p.x, p.y - 0.55, p.z, { pool: p, st: 'swim', ang: Math.random() * 6.28, spd: rand(0.4, 0.9) * (Math.random() < 0.5 ? 1 : -1) });
        c.cool = rand(4, 14);
      }
    });
    // Birds.
    for (let f = 0; f < 2; f++) { const p = pick(pools) || { x: cx, y: PY + 25, z: cz }; for (let k = 0; k < 5; k++) add('torrentLorikeet', p.x + rand(-3, 3), p.y + 4, p.z + rand(-3, 3), { flock: f, off: [rand(-2, 2), rand(-1, 1), rand(-2, 2)] }); }
    for (let k = 0; k < 2; k++) add('harpyWyvern', cx + rand(-20, 20), Math.min(H - 3, PY + 31), cz + rand(-20, 20), { ang: Math.random() * 6.28, st: 'patrol', cool: rand(15, 30) });
    for (let k = 0; k < 5; k++) { const [x, y, z] = perch(); add('slickwingMacaw', x, y, z, { st: 'perch', cool: rand(3, 10), call: 0 }); }
    for (let k = 0; k < 4; k++) { const [x, y, z] = perch(); add('glowMimicAmazon', x, y, z, { st: 'perch', cool: rand(6, 14), flash: rand(5, 12) }); }
    // On the jungle floor.
    for (let k = 0; k < 2; k++) { const [x, y, z] = floorSpot(); add('phantomJaguar', x, y, z, { st: 'prowl', tx: x, tz: z }); }
    for (let k = 0; k < 4; k++) { const [x, y, z] = floorSpot(); const s = add('anchorSloth', x, y, z, { tx: x, tz: z }); s.moths = mothCloud(s); }
    for (let k = 0; k < 40; k++) { const [x, y, z] = floorSpot(2); fauna.push(add('purpleFauna', x, y, z, { cool: 0, glow: 0 })); }
  }
  function despawn() {
    live = false;
    for (const c of all) { group.remove(c.g); if (c.moths) fx.remove(c.moths.g); }
    all = []; fauna = [];
    clearSwarm();
  }
  const remove = (c) => { group.remove(c.g); if (c.moths) fx.remove(c.moths.g); all.splice(all.indexOf(c), 1); };

  // ---------- effects ----------
  function puff(x, y, z, color, n = 6, speed = 2, life = 0.8, size = 0.15, up = 1) {
    for (let k = 0; k < n; k++) {
      const p = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
      p.position.set(x, y, z); p.scale.setScalar(size); fx.add(p);
      puffs.push({ p, vx: rand(-1, 1) * speed, vy: rand(0.3, 1) * speed * up, vz: rand(-1, 1) * speed, life, t: 0, size });
    }
  }
  function glowRing(x, y, z, color = 0xc040ff) {
    // Brighter than white, so on Balanced and Amazing it glows. (No real light: a light coming and going would make
    // every material in the world rebuild itself, and the game would freeze for a moment.)
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    mat.color.multiplyScalar(4);
    const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.45, 24), mat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, y + 0.1, z); fx.add(r);
    puffs.push({ p: r, vx: 0, vy: 0, vz: 0, life: 1.4, t: 0, size: 1, ring: true });
  }
  function updatePuffs(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i]; q.t += dt;
      if (q.ring) { q.p.scale.setScalar(1 + q.t * 5); q.p.material.opacity = Math.max(0, 0.9 * (1 - q.t / q.life)); }
      else {
        q.vy -= 6 * dt; q.p.position.x += q.vx * dt; q.p.position.y += q.vy * dt; q.p.position.z += q.vz * dt;
        q.p.material.opacity = Math.max(0, 0.9 * (1 - q.t / q.life));
      }
      if (q.t >= q.life) { fx.remove(q.p); if (q.p.material) q.p.material.dispose(); puffs.splice(i, 1); }
    }
  }
  // The moths that live in an anchor sloth's fur.
  function mothCloud(s) {
    const g = new THREE.Group(), list = [];
    for (let k = 0; k < 8; k++) { const m = box(g, 0.08, 0.02, 0.06, 0xd8d4c8, 0, 0, 0, new THREE.MeshLambertMaterial({ color: 0xd8d4c8 })); list.push({ m, a: Math.random() * 6.28, r: rand(0.5, 1.0), h: rand(0.6, 1.4), s: rand(1.5, 3) }); }
    fx.add(g);
    return { g, list };
  }
  function clearSwarm() { if (swarm) { fx.remove(swarm.g); swarm = null; } }

  // ---------- telling the hunters where you are ----------
  // Only the nearest wyvern that isn't already busy answers, so there's a chance to get away.
  function alert(x, y, z, why, decoy = null) {
    const w = all.filter((o) => o.kind === 'harpyWyvern' && o.st !== 'hunt' && o.st !== 'climb' && Math.hypot(o.x - x, o.z - z) < 90)
      .sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
    if (!w) return;
    w.st = 'hunt'; w.target = { x, y, z, decoy, why }; w.t = 0;
  }
  const ouch = (c, n, push = 4) => hurt(n, { x: c.x, z: c.z, kind: c.kind, name: JUNGLE[c.kind].name, push });

  // ---------- each kind, every frame ----------
  function fish(c, dt, P) {
    const p = c.pool;
    if (c.st === 'leap') {
      c.t += dt; const k = Math.min(1, c.t / c.dur);
      c.x = c.from[0] + (c.to.x - c.from[0]) * k; c.z = c.from[2] + (c.to.z - c.from[2]) * k;
      c.y = c.from[1] + (c.to.y - 0.55 - c.from[1]) * k + Math.sin(k * Math.PI) * c.peak;
      c.g.rotation.x = -Math.cos(k * Math.PI) * 0.9;
      c.yaw = Math.atan2(c.to.x - c.from[0], c.to.z - c.from[2]);
      if (k >= 1) { c.pool = c.to; c.st = 'swim'; c.g.rotation.x = 0; puff(c.x, c.y + 0.5, c.z, 0x9fd0f0, 8, 2.5); sound.play('splash'); }
    } else if (c.st === 'climb') {
      // The siphon catfish: out over the edge of its pool, down the trunk to graze, and back up again.
      c.t += dt;
      const path = c.path, seg = Math.min(path.length - 2, Math.floor(c.t / 2.2)), k = Math.min(1, (c.t - seg * 2.2) / 2.2);
      const a = path[seg], b = path[seg + 1];
      c.x = a[0] + (b[0] - a[0]) * k; c.y = a[1] + (b[1] - a[1]) * k; c.z = a[2] + (b[2] - a[2]) * k;
      c.g.rotation.x = b[1] < a[1] - 0.5 ? Math.PI / 2 : b[1] > a[1] + 0.5 ? -Math.PI / 2 : 0;
      c.yaw = Math.atan2(c.face[0], c.face[1]) + Math.PI;
      if (c.t >= (path.length - 1) * 2.2) { c.st = 'swim'; c.g.rotation.x = 0; c.x = p.x; c.z = p.z; c.y = p.y - 0.55; }
    } else {
      c.ang += c.spd * dt * (c.kind === 'viperEel' ? 1.6 : 1);
      const r = Math.max(0.2, p.r - 0.3);
      c.x = p.x + Math.cos(c.ang) * r; c.z = p.z + Math.sin(c.ang) * r; c.y = p.y - 0.55 + Math.sin(c.ang * 3) * 0.08;
      c.yaw = c.ang + (c.spd > 0 ? 0 : Math.PI);
      c.cool -= dt;
      if (c.cool <= 0 && c.kind === 'canopyArapaima') {
        // Leap: to another pool if one is near enough, or straight up and back into its own.
        c.cool = rand(7, 16);
        const near = pools.filter((q) => q !== p && Math.hypot(q.x - p.x, q.z - p.z) < 20 && Math.abs(q.y - p.y) < 9);
        const to = near.length && Math.random() < 0.7 ? pick(near) : p;
        c.st = 'leap'; c.t = 0; c.from = [c.x, c.y, c.z]; c.to = to; c.dur = to === p ? 0.9 : 1.6; c.peak = to === p ? 2.4 : 3.5 + Math.abs(to.y - p.y) * 0.5;
        puff(c.x, c.y + 0.5, c.z, 0x9fd0f0, 8, 2.5); sound.play('splash');
      } else if (c.cool <= 0 && c.kind === 'siphonCatfish') {
        c.cool = rand(14, 28);
        const dir = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), off = p.ts / 2 + 0.2;
        const sx = p.tx + dir[0] * off, sz = p.tz + dir[1] * off;
        c.face = dir;
        c.path = [[c.x, c.y, c.z], [p.x, p.y + 0.3, p.z], [sx, p.top - 3, sz], [sx, p.gy + 3, sz], [sx, p.gy + 3, sz], [sx, p.top - 3, sz], [p.x, p.y + 0.3, p.z], [p.x, p.y - 0.55, p.z]];
        c.st = 'climb'; c.t = 0;
      }
    }
    // The eel's body ripples; a fish's tail sweeps.
    const now = performance.now() / 1000;
    if (c.parts.segs) c.parts.segs.forEach((s, i) => { s.position.x = Math.sin(now * 7 - i * 0.9) * 0.08 * i; });
    if (c.parts.tail) c.parts.tail.rotation.y = Math.sin(now * 9) * 0.5;
    // Touch a viper eel in its pool and it shocks you.
    if (c.kind === 'viperEel' && c.st === 'swim') {
      c.zap = Math.max(0, (c.zap || 0) - dt);
      if (P.water && c.zap <= 0 && Math.hypot(P.x - c.x, P.z - c.z) < 2.4 && Math.abs(P.y - c.y) < 2.2) {
        c.zap = 2.5;
        puff(c.x, c.y + 0.3, c.z, 0x60d0ff, 12, 4, 0.5, 0.08);
        sound.play('zap');
        say('ZAP! A viper eel shocked you. Get out of its pool!');
        ouch(c, 1, 2);
      }
    }
  }
  function flyTo(c, tx, ty, tz, speed, dt) {
    const dx = tx - c.x, dy = ty - c.y, dz = tz - c.z, d = Math.hypot(dx, dy, dz);
    if (d < 0.05) return 0;
    const s = Math.min(d, speed * dt);
    c.x += dx / d * s; c.y += dy / d * s; c.z += dz / d * s;
    if (Math.hypot(dx, dz) > 0.05) c.yaw = angTo(c.yaw, Math.atan2(dx, dz), dt * 5);
    return d;
  }
  const angTo = (a, b, step) => { const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + Math.max(-step, Math.min(step, d)); };
  function flap(c, rate, amp = 0.8) { const a = Math.sin(performance.now() / 1000 * rate + c.x) * amp; if (c.parts.wings) { c.parts.wings[0].rotation.z = a; c.parts.wings[1].rotation.z = -a; } }

  function lorikeet(c, dt) {
    const lead = all.find((o) => o.kind === 'torrentLorikeet' && o.flock === c.flock);
    if (lead === c) {
      if (!c.goal || c.t > 6) { const p = pick(pools) || { x: cx, y: PY + 25, z: cz }; c.goal = p; c.t = 0; }
      c.t += dt;
      const p = c.goal, skim = c.t > 2.2 && c.t < 3.4;      // fly there, swoop down to skim the water, climb away
      flyTo(c, p.x, skim ? p.y + 0.3 : p.y + 4, p.z, 7, dt);
      if (skim && !c.splashed && Math.hypot(c.x - p.x, c.z - p.z) < 2) { c.splashed = true; puff(c.x, p.y, c.z, 0x9fd0f0, 5, 1.5); }
      if (!skim) c.splashed = false;
    } else if (lead) flyTo(c, lead.x + c.off[0], lead.y + c.off[1], lead.z + c.off[2], 8, dt);
    flap(c, 26);
  }
  function wyvern(c, dt, P) {
    c.cool -= dt;
    const high = Math.min(H - 3, PY + 31);
    if (c.st === 'patrol') {
      c.ang += dt * 0.25;
      flyTo(c, cx + Math.cos(c.ang) * 26, high, cz + Math.sin(c.ang) * 26, 6, dt);
      flap(c, 3, 0.35);
      // It hunts literally everything: now and then it picks some other creature to go after.
      if (c.cool <= 0) {
        c.cool = rand(25, 45);
        const prey = all.filter((o) => ['torrentLorikeet', 'slickwingMacaw', 'glowMimicAmazon', 'phantomJaguar', 'anchorSloth', 'canopyArapaima'].includes(o.kind));
        if (prey.length) { c.st = 'prey'; c.prey = pick(prey); c.t = 0; }
      }
    } else if (c.st === 'prey') {
      c.t += dt;
      const q = c.prey;
      if (!all.includes(q) || c.t > 10) { c.st = 'climb'; c.t = 0; return; }
      const d = flyTo(c, q.x, q.y + 0.6, q.z, 13, dt);
      flap(c, 6, 0.5);
      if (d < 1.6) {
        if (q.kind === 'anchorSloth') { puff(q.x, q.y + 1, q.z, 0x9a9a92, 8, 2); sound.play('thunk'); }   // talons on stone fur: no chance
        else if (q.kind !== 'phantomJaguar') { remove(q); setTimeout(() => { if (live && all.length < 140) respawn(q.kind); }, 40000); }
        c.st = 'climb'; c.t = 0;
      }
    } else if (c.st === 'hunt') {
      c.t += dt;
      const tg = c.target;
      // Diving at you (or at whatever flashed purple), straight through the leaves.
      const tx = tg.decoy ? tg.decoy.x : (tg.why === 'player' ? P.x : tg.x), tz = tg.decoy ? tg.decoy.z : (tg.why === 'player' ? P.z : tg.z), ty = tg.decoy ? tg.decoy.y : (tg.why === 'player' ? P.y + 1 : tg.y);
      const d = flyTo(c, tx, ty, tz, 12, dt);
      flap(c, 7, 0.55);
      if (!tg.decoy && tg.why === 'player' && Math.hypot(P.x - c.x, P.z - c.z) < 2.2 && Math.abs(P.y + 1 - c.y) < 2.2) {
        sound.play('screech'); ouch(c, 2, 8);
        say('The harpy wyvern struck you with its talons! Get under cover, or fight it with a sword.');
        c.st = 'climb'; c.t = 0;
      } else if (d < 1.5 || c.t > 14) { c.st = 'climb'; c.t = 0; }
    } else {   // climbing back up after an attack
      c.t += dt;
      flyTo(c, c.x + Math.sin(c.yaw) * 3, high, c.z + Math.cos(c.yaw) * 3, 8, dt);
      flap(c, 5, 0.6);
      if (c.t > 4) c.st = 'patrol';
    }
  }
  function perchBird(c, dt, P) {
    c.cool -= dt;
    if (c.st === 'perch') {
      flap(c, 0, 0);
      if (c.cool <= 0) { c.st = 'fly'; c.goal = perch(); c.t = 0; }
    } else {
      c.t += dt;
      const [gx, gy, gz] = c.goal;
      const mid = c.t < 1.2 ? 3 : 0;
      const d = flyTo(c, gx, gy + mid, gz, 6, dt);
      flap(c, 20, 0.9);
      if (d < 0.3 || c.t > 12) { c.st = 'perch'; c.cool = rand(8, 20); if (c.parts.wings) c.parts.wings.forEach((w) => { w.rotation.z = 0; }); }
    }
    const dP = Math.hypot(P.x - c.x, P.z - c.z), dy = Math.abs(P.y - c.y);
    if (c.kind === 'slickwingMacaw') {
      c.call = Math.max(0, c.call - dt);
      if (c.call <= 0 && dP < 11 && dy < 30 && state.inside) {
        c.call = 45;
        sound.play('screech');
        c.glintT = 0.8;
        alert(P.x, P.y, P.z, 'player');
        say('A slick wing macaw flashes its metal feathers and screeches — the harpy wyverns know where you are!');
      }
      c.glintT = Math.max(0, (c.glintT || 0) - dt);
      c.parts.glint.material.opacity = c.glintT > 0 ? Math.abs(Math.sin(c.glintT * 20)) : 0;
      c.parts.glint.rotation.y = performance.now() / 120;
    } else if (c.kind === 'glowMimicAmazon') {
      c.flash -= dt;
      if (c.flash <= 0) {
        c.flash = rand(9, 16);
        glowRing(c.x, c.y, c.z);
        if (Math.hypot(P.x - c.x, P.z - c.z) < 30) sound.play('glow');
        // A trick: any wyvern that is hunting might take the bait.
        for (const w of all) if (w.kind === 'harpyWyvern' && w.st === 'hunt' && Math.random() < 0.5 && Math.hypot(w.x - c.x, w.z - c.z) < 50) { w.target = { decoy: { x: c.x, y: c.y, z: c.z } }; w.t = 0; }
      }
    }
  }
  function walk(c, tx, tz, pace, dt) {
    const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz);
    if (d < 0.1) return 0;
    const s = Math.min(d, pace * dt), nx = c.x + dx / d * s, nz = c.z + dz / d * s;
    const g = floorAt(nx, nz);
    if (!inside(nx, nz) || g > c.y + 1.1 || g < c.y - 3 || IS_SOLID[world.get(Math.floor(nx), g, Math.floor(nz))]) return -1;
    c.x = nx; c.z = nz; c.yaw = angTo(c.yaw, Math.atan2(dx, dz), dt * 6);
    return s;
  }
  function jaguar(c, dt, P) {
    c.t += dt;
    const dP = Math.hypot(P.x - c.x, P.z - c.z), near = state.inside && dP < 20 && Math.abs(P.y - c.y) < 3;
    let moved = 0, see = 0.12;
    if (c.st === 'prowl') {
      if (Math.hypot(c.tx - c.x, c.tz - c.z) < 0.3 || c.t > 8) { const [x, , z] = floorSpot(); c.tx = x; c.tz = z; c.t = 0; }
      moved = walk(c, c.tx, c.tz, 1.6, dt);
      if (moved < 0) { c.t = 99; moved = 0; }
      if (near && c.cool <= 0) { c.st = 'stalk'; c.t = 0; }
    } else if (c.st === 'stalk') {
      // Creeping closer, keeping its distance, waiting for its moment.
      if (dP > 7) moved = Math.max(0, walk(c, P.x, P.z, 1.4, dt));
      else c.yaw = angTo(c.yaw, Math.atan2(P.x - c.x, P.z - c.z), dt * 4);
      if (!near) c.st = 'prowl';
      if (c.t > 4.5 && dP < 9) { c.st = 'pounce'; c.t = 0; sound.play('growl'); }
    } else if (c.st === 'pounce') {
      see = 0.6;
      moved = Math.max(0, walk(c, P.x, P.z, 7.5, dt));
      if (dP < 1.5 && Math.abs(P.y - c.y) < 2) { ouch(c, 2, 6); say('A phantom jaguar pounced on you out of nowhere!'); c.st = 'retreat'; c.t = 0; const a = Math.atan2(c.x - P.x, c.z - P.z); c.tx = c.x + Math.sin(a) * 15; c.tz = c.z + Math.cos(a) * 15; }
      if (c.t > 4) { c.st = 'retreat'; c.t = 0; c.tx = c.x; c.tz = c.z; }
    } else {
      see = Math.max(0.12, 0.6 - c.t * 0.3);
      moved = Math.max(0, walk(c, c.tx, c.tz, 5.5, dt));
      if (c.t > 6) { c.st = 'prowl'; c.cool = rand(20, 35); c.t = 0; }
    }
    c.cool -= dt;
    for (const m of c.parts.mats) m.opacity += (see - m.opacity) * Math.min(dt * 4, 1);
    const g = floorAt(c.x, c.z); c.y += (g - c.y) * Math.min(dt * 10, 1);
    c.phase = (c.phase || 0) + (moved > 0 ? dt * (c.st === 'pounce' ? 16 : 9) : 0);
    c.parts.legs.forEach((l, i) => { l.rotation.x = moved > 0 ? Math.sin(c.phase) * 0.6 * (i === 0 || i === 3 ? 1 : -1) : 0; });
  }
  function sloth(c, dt) {
    c.t += dt;
    if (Math.hypot(c.tx - c.x, c.tz - c.z) < 0.2 || c.t > 30) { c.tx = c.x + rand(-3, 3); c.tz = c.z + rand(-3, 3); c.t = 0; }
    walk(c, c.tx, c.tz, 0.25, dt);
    // Munching bamboo.
    c.g.children[6].rotation.x = Math.sin(performance.now() / 300) * 0.12;
    const g = floorAt(c.x, c.z); c.y += (g - c.y) * Math.min(dt * 5, 1);
    if (c.moths && !c.moths.away) {
      c.moths.g.position.set(c.x, c.y, c.z);
      const now = performance.now() / 1000;
      for (const m of c.moths.list) { m.m.position.set(Math.cos(now * m.s + m.a) * m.r, m.h + Math.sin(now * 3 + m.a) * 0.15, Math.sin(now * m.s + m.a) * m.r); m.m.rotation.y = now * m.s; }
    }
  }
  // The vampire kites home in on your warmth. A torch makes you easier to find.
  function kite(c, dt, P) {
    const torch = held() === 'torch';
    if (c.st === 'lost') {
      c.t += dt; flyTo(c, c.x + Math.sin(c.yaw) * 3, Math.min(H - 3, PY + 28), c.z + Math.cos(c.yaw) * 3, 5, dt); flap(c, 24);
      if (c.t > 25) c.st = 'seek';
      return;
    }
    if (!state.inside) { flyTo(c, cx, PY + 26, cz, 4, dt); flap(c, 24); return; }
    if (c.st === 'seek') {
      const d = flyTo(c, P.x, P.y + 1.6, P.z, torch ? 8 : 4.5, dt);
      flap(c, 24);
      if (d < 0.9) { c.st = 'latched'; c.t = 0; c.drain = 2; if (!state.toldKite) { state.toldKite = true; } spottedNow(c); say('A vampire kite latched on and is drinking your blood! Hit it, or jump into water to cool off and lose it.'); }
    } else {
      // Clinging on beside your head, drinking.
      c.t += dt; c.drain -= dt;
      const a = c.t * 3 + c.x;
      c.x = P.x + Math.cos(a) * 0.45; c.z = P.z + Math.sin(a) * 0.45; c.y = P.y + 1.7 + Math.sin(c.t * 9) * 0.05;
      c.yaw = a + Math.PI / 2; flap(c, 30, 0.4);
      if (c.drain <= 0) { c.drain = 8; ouch(c, 1, 0.5); }
      if (P.water) { c.st = 'lost'; c.t = 0; say('You cooled off in the water — the vampire kites lost you!'); }
    }
  }
  function respawn(kind) {
    if (kind === 'torrentLorikeet') { const p = pick(pools) || { x: cx, y: PY + 25, z: cz }; add(kind, p.x, p.y + 6, p.z, { flock: Math.floor(Math.random() * 2), off: [rand(-2, 2), rand(-1, 1), rand(-2, 2)] }); }
    else if (kind === 'slickwingMacaw' || kind === 'glowMimicAmazon') { const [x, y, z] = perch(); add(kind, x, y, z, { st: 'perch', cool: rand(3, 10), call: 10, flash: rand(5, 12) }); }
    else if (kind === 'canopyArapaima' || kind === 'viperEel' || kind === 'siphonCatfish') { const p = pick(pools); if (p) add(kind, p.x, p.y - 0.55, p.z, { pool: p, st: 'swim', ang: 0, spd: 0.6, cool: rand(5, 12) }); }
    else if (kind === 'phantomJaguar') { const [x, y, z] = floorSpot(); add(kind, x, y, z, { st: 'prowl', tx: x, tz: z }); }
    else if (kind === 'harpyWyvern') add(kind, cx, Math.min(H - 3, PY + 31), cz, { ang: 0, st: 'patrol', cool: 20 });
    else if (kind === 'vampireKite') { const a = Math.random() * 6.28; add(kind, cx + Math.cos(a) * 30, PY + 20, cz + Math.sin(a) * 30, { st: 'seek' }); }
  }
  function spottedNow(c) { if (!c.seen) { c.seen = true; spotted(c.kind, JUNGLE[c.kind]); } }

  // ---------- the traps on the ground ----------
  let checkT = 0;
  function traps(dt, P) {
    checkT -= dt;
    for (const f of fauna) {
      f.cool = Math.max(0, f.cool - dt);
      if (f.glow > 0) {
        f.glow -= dt;
        const o = Math.max(0, Math.min(1, f.glow / 0.6)) * 0.85;
        f.parts.m.opacity = o; f.parts.ring.material.opacity = o * 0.8; f.parts.ring.scale.setScalar(1 + (2.5 - f.glow) * 2);
      }
    }
    for (const h of holes) h.cool = Math.max(0, (h.cool || 0) - dt);
    if (checkT > 0) return;
    checkT = 0.12;
    // Purple invisible fauna: stumble on one and it lights up — and the wyverns see you.
    for (const f of fauna) {
      if (f.cool > 0 || Math.hypot(P.x - f.x, P.z - f.z) > 1.7 || Math.abs(P.y - f.y) > 2) continue;
      f.cool = 18; f.glow = 2.5;
      glowRing(f.x, f.y, f.z);
      sound.play('glow');
      spottedNow(f);
      alert(P.x, P.y, P.z, 'player');
      if (state.toldFauna) say('Purple glow! The fauna lit up — the harpy wyverns know where you are!');
      state.toldFauna = true;
    }
    // Flash-flood holes: water bursts out and sweeps you towards the edge of the cliff.
    for (const h of holes) {
      if (h.cool > 0 || Math.hypot(P.x - h.x, P.z - h.z) > 2.1 || Math.abs(P.y - h.y) > 2.5) continue;
      h.cool = 25;
      sound.play('gush');
      for (let k = 0; k < 4; k++) setTimeout(() => puff(h.x, h.y, h.z, 0x7ab8e8, 10, 4, 1.2, 0.22, 2.2), k * 180);
      P.pushX = h.dx * 11; P.pushZ = h.dz * 11; P.pushT = 1.3; P.vy = Math.max(P.vy, 6); P.ground = false;
      say('FLASH FLOOD! Water bursts out of the hole and sweeps you towards the cliff edge!');
      // The mist mimic moths come pouring out of the nearest sloth's fur.
      const s = all.filter((o) => o.kind === 'anchorSloth').sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
      clearSwarm();
      const g = new THREE.Group(), list = [];
      for (let k = 0; k < 40; k++) { const m = box(g, 0.1, 0.02, 0.08, 0xe8e4d8, 0, 0, 0, new THREE.MeshLambertMaterial({ color: 0xe8e4d8 })); list.push({ m, a: Math.random() * 6.28, r: rand(0.4, 1.6), h: rand(0.3, 2.2), s: rand(2, 5) }); }
      fx.add(g);
      swarm = { g, list, t: 0, from: s ? [s.x, s.y + 1, s.z] : [P.x, P.y + 4, P.z] };
      if (s && s.moths) { s.moths.away = true; s.moths.g.visible = false; swarm.sloth = s; }
      spotted('mistMoth', JUNGLE.mistMoth);
    }
    // Sponge leeches, in the canopy pools and on the wet moss.
    const under = world.get(Math.floor(P.x), Math.floor(P.y - 0.5), Math.floor(P.z));
    const chance = P.water ? 0.04 : under === 159 ? 0.012 : 0;
    if (chance && state.leeches.length < 3 && Math.random() < chance) {
      const m = box(leechGroup, 0.12, 0.1, 0.16, 0x3a2a3a, rand(-0.18, 0.18), rand(0.2, 0.9), rand(-0.16, 0.16), new THREE.MeshLambertMaterial({ color: 0x3a2a3a }));
      state.leeches.push({ m, t: 25 });
      sound.play('squelch');
      if (state.leeches.length === 1) spotted('spongeLeech', JUNGLE.spongeLeech);
      say(`A sponge leech latched onto you! (${state.leeches.length}) You feel slow and heavy.`);
    }
  }

  function update(dt, P) {
    const dc = Math.hypot(P.x - cx, P.z - cz);
    state.inside = inside(P.x, P.z) && P.y > PY - 6;
    if (!live && dc < mj.R + 40) spawn();
    else if (live && dc > mj.R + 90) despawn();
    // Leeches drop off in time, or at once by a fire or with a torch in your hand.
    const fire = held() === 'torch' || nearFire();
    for (let i = state.leeches.length - 1; i >= 0; i--) {
      const l = state.leeches[i]; l.t -= dt;
      if (l.t <= 0 || fire) { leechGroup.remove(l.m); state.leeches.splice(i, 1); if (!state.leeches.length) say(fire ? 'The heat made the sponge leeches let go!' : 'The last sponge leech dropped off. You feel light again.'); }
    }
    leechGroup.position.set(P.x, P.y, P.z);
    state.slow = 1 - state.leeches.length * 0.15;
    updatePuffs(dt);
    // The moth swarm round your head, then back to their sloth.
    if (swarm) {
      swarm.t += dt;
      const k = Math.min(1, swarm.t / 0.8), back = swarm.t > 6 ? Math.min(1, (swarm.t - 6) / 1.2) : 0;
      const [fx0, fy0, fz0] = swarm.from;
      const px = fx0 + (P.x - fx0) * k, py = fy0 + (P.y - fy0) * k, pz = fz0 + (P.z - fz0) * k;
      swarm.g.position.set(px + (fx0 - px) * back, py + (fy0 - py) * back, pz + (fz0 - pz) * back);
      const now = performance.now() / 1000;
      for (const m of swarm.list) { m.m.position.set(Math.cos(now * m.s + m.a) * m.r, m.h + Math.sin(now * 4 + m.a) * 0.3, Math.sin(now * m.s + m.a) * m.r); m.m.rotation.y = now * m.s * 2; }
      if (swarm.t > 7.2) { if (swarm.sloth && swarm.sloth.moths) { swarm.sloth.moths.away = false; swarm.sloth.moths.g.visible = true; } clearSwarm(); }
    }
    state.mist = swarm && swarm.t < 6 ? 1 : 0;
    if (!live) return;
    // Vampire kites come only while you're up in the jungle.
    const kites = all.filter((c) => c.kind === 'vampireKite').length;
    if (state.inside && kites < 2) { state.kiteT = (state.kiteT ?? 25) - dt; if (state.kiteT <= 0) { state.kiteT = 45; respawn('vampireKite'); } }
    for (const c of [...all]) {
      if (c.kind === 'purpleFauna') continue;
      switch (c.kind) {
        case 'canopyArapaima': case 'viperEel': case 'siphonCatfish': fish(c, dt, P); break;
        case 'torrentLorikeet': lorikeet(c, dt); break;
        case 'harpyWyvern': wyvern(c, dt, P); break;
        case 'slickwingMacaw': case 'glowMimicAmazon': perchBird(c, dt, P); break;
        case 'phantomJaguar': jaguar(c, dt, P); break;
        case 'anchorSloth': sloth(c, dt); break;
        case 'vampireKite': kite(c, dt, P); break;
      }
      c.g.position.set(c.x, c.y, c.z); c.g.rotation.y = c.yaw;
      if (c.ent) { c.ent.x = c.x; c.ent.z = c.z; }
      // Spotting something new: a jaguar only counts once you've really seen it.
      if (!c.seen && Math.hypot(P.x - c.x, P.z - c.z) < (c.kind === 'phantomJaguar' ? (c.st === 'pounce' ? 9 : 3) : c.kind === 'harpyWyvern' ? 30 : 10) && Math.abs(P.y - c.y) < 30) spottedNow(c);
    }
    traps(dt, P);
  }

  /// You hit one of them.
  function hit(c, dmg, P) {
    sound.play('hit');
    if (c.kind === 'anchorSloth') { say('Your blow bounces off the anchor sloth\'s stone fur. It doesn\'t even notice.'); puff(c.x, c.y + 1, c.z, 0x9a9a92, 5, 1.5); return; }
    if (c.kind === 'viperEel') { ouch(c, 1, 2); puff(c.x, c.y + 0.3, c.z, 0x60d0ff, 10, 3, 0.5, 0.08); sound.play('zap'); say('ZAP! Touching a viper eel shocks you — even when you\'re the one hitting it.'); }
    c.hp -= dmg;
    if (c.kind !== 'phantomJaguar') c.g.traverse((o) => { if (o.material && o.material.emissive) { o.material = o.material.clone(); o.material.emissive.setRGB(0.8, 0.1, 0.1); const m = o.material; setTimeout(() => m.emissive.setRGB(0, 0, 0), 160); } });
    if (c.kind === 'harpyWyvern' && c.hp > 0) { c.st = 'hunt'; c.target = { why: 'player' }; c.t = 0; say('The harpy wyvern turns on you!'); }
    if (c.kind === 'phantomJaguar' && c.hp > 0) { c.st = 'pounce'; c.t = 0; }
    if (c.kind === 'vampireKite' && c.hp > 0) { c.st = 'lost'; c.t = 0; }
    if (c.hp <= 0) {
      for (const [id, a, b] of JUNGLE[c.kind].drops) { const n = a + Math.floor(Math.random() * (b - a + 1)); if (n) drop(id, n, c.x, c.y + 0.5, c.z); }
      puff(c.x, c.y + 0.5, c.z, 0xffffff, 6, 2);
      remove(c);
      const k = c.kind;
      setTimeout(() => { if (live) respawn(k); }, k === 'harpyWyvern' ? 120000 : 45000);
    }
  }

  return { update, hit, inside, state, get live() { return live; }, get all() { return all; }, alert };
}
