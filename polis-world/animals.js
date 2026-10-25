// Polis World (computer version): wild animals of the ancient world, and how each one reacts when you bother it.
// Some fight back (a tiger, a boar, an elephant), some run (a deer, a horse), a parrot flies off, and a turtle heads
// for the sea. Their bodies are built from boxes, all merged into one mesh, with legs (or wings) that move.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { mergeBoxes } from './scenery.js';

// temper: 'fight' bites back when hit · 'flee' runs · 'fly' takes off · 'sea' heads for the water.
// bite: how many hearts a bite costs (out of 10); fast: speed when angry or frightened.
export const WILD = {
  tiger: { hp: 16, speed: 1.6, fast: 4.1, temper: 'fight', bite: 2, drops: [['leather', 1, 2]], name: 'tiger', size: [0.62, 0.62, 1.5],
    fact: 'Tigers live in the forests of India, China and Southeast Asia. They are the biggest cats in the world, and each tiger\'s stripes are different, like fingerprints.' },
  jaguar: { hp: 14, speed: 1.6, fast: 4.0, temper: 'fight', bite: 2, drops: [['leather', 1, 2]], name: 'jaguar', size: [0.55, 0.55, 1.3],
    fact: 'The people of Teotihuacan and the Maya admired the jaguar for its strength. Warriors dressed in jaguar skins.' },
  boar: { hp: 10, speed: 1.5, fast: 3.8, temper: 'fight', bite: 1, drops: [['rawPork', 1, 3], ['leather', 0, 1]], name: 'wild boar', size: [0.6, 0.6, 1.1],
    fact: 'Wild boars are the wild ancestors of farm pigs. In Greek myths, the hero Heracles caught the fierce Erymanthian Boar.' },
  elephant: { hp: 30, speed: 1.0, fast: 3.4, temper: 'fight', bite: 3, push: 9, drops: [['leather', 1, 3]], name: 'elephant', size: [1.4, 1.5, 2.3],
    fact: 'Asian elephants were trained to carry loads and even fight in battles. Hannibal of Carthage took elephants over the Alps!' },
  crocodile: { hp: 16, speed: 0.8, fast: 3.6, temper: 'fight', bite: 2, drops: [['leather', 1, 2]], name: 'crocodile', size: [0.6, 0.35, 2.3], swims: true,
    fact: 'Nile crocodiles were sacred to the Egyptian god Sobek. Some temples kept tame crocodiles wearing golden earrings!' },
  deer: { hp: 8, speed: 1.6, fast: 5.2, temper: 'flee', drops: [['rawBeef', 1, 2], ['leather', 0, 1]], name: 'deer', size: [0.55, 0.75, 1.15],
    fact: 'Deer were hunted all over the ancient world. Artemis, the Greek goddess of hunting, is often shown with a deer.' },
  horse: { hp: 12, speed: 1.5, fast: 5.6, temper: 'flee', drops: [['leather', 1, 2]], name: 'horse', size: [0.6, 0.85, 1.5],
    fact: 'Horses pulled chariots in Egypt, Persia and Rome. The Persian royal road had stations with fresh horses for messengers.' },
  panda: { hp: 14, speed: 0.9, fast: 2.6, temper: 'flee', drops: [], name: 'giant panda', size: [0.8, 0.8, 1.2],
    fact: 'Giant pandas live in the bamboo forests of Sichuan, the land of Shu. They eat bamboo for up to 14 hours a day.' },
  llama: { hp: 10, speed: 1.3, fast: 4.4, temper: 'flee', drops: [['wool', 1, 3]], name: 'llama', size: [0.5, 0.75, 1.0],
    fact: 'Llamas come from the Andes mountains of South America, where the Inca later used them to carry loads.' },
  parrot: { hp: 3, speed: 1.1, fast: 6.5, temper: 'fly', drops: [['feather', 1, 2]], name: 'parrot', size: [0.25, 0.3, 0.35],
    fact: 'Bright macaw feathers were traded hundreds of kilometres across ancient Mexico. Rich Romans kept parrots that could talk!' },
  turtle: { hp: 8, speed: 0.6, fast: 1.5, temper: 'sea', drops: [], name: 'sea turtle', size: [0.75, 0.35, 0.95], swims: true,
    fact: 'Sea turtles come ashore to lay their eggs on sandy beaches, then head back to the sea. Some live for more than 50 years.' },
};

const box = (list, x0, y0, z0, x1, y1, z1, color) => {
  const m = new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2).multiply(new THREE.Matrix4().makeScale(x1 - x0, y1 - y0, z1 - z0));
  list.push({ m, color });
};
const cbox = (list, x, y, z, w, h, d, color) => box(list, x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2, color);
const geoCache = new Map();

/// A leg (or flipper, or wing) that swings from a pivot.
function limb(w, h, d, color, x, y, z, hoof) {
  const list = [];
  box(list, -w / 2, -h, -d / 2, w / 2, 0, d / 2, color);
  if (hoof) box(list, -w / 2 - 0.005, -h, -d / 2 - 0.005, w / 2 + 0.005, -h + 0.08, d / 2 + 0.005, hoof);
  const key = 'limb' + [w, h, d, color, hoof].join();
  if (!geoCache.has(key)) geoCache.set(key, mergeBoxes(list));
  const p = new THREE.Group(); p.position.set(x, y, z);
  return { p, geo: geoCache.get(key) };
}

/// Builds the body (one merged mesh) and the moving parts of a wild animal. Bow is +z.
export function buildWild(kind) {
  const L = [], parts = [];
  let legH = 0.4;
  const legs4 = (w, l, h, thick, color, hoof, y = h) => { legH = h; for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(limb(thick, h, thick, color, sx * w, y, sz * l, hoof)); };
  const eyes = (x, y, z, c = 0x111111) => { cbox(L, -x, y, z, 0.07, 0.07, 0.02, c); cbox(L, x, y, z, 0.07, 0.07, 0.02, c); };
  switch (kind) {
    case 'tiger': case 'jaguar': {
      const fur = kind === 'tiger' ? 0xd9822b : 0xd8a842, mark = 0x1d1712, belly = 0xf1e6d2;
      legs4(0.2, 0.5, 0.5, 0.16, fur, 0x2a1f16);
      cbox(L, 0, 0.78, 0, 0.6, 0.48, 1.35, fur); cbox(L, 0, 0.56, 0, 0.5, 0.06, 1.2, belly);
      if (kind === 'tiger') for (let k = 0; k < 7; k++) { const z = -0.55 + k * 0.18; cbox(L, 0, 0.9, z, 0.62, 0.3, 0.05, mark); }
      else for (let k = 0; k < 14; k++) { const z = -0.55 + (k % 7) * 0.18, x = k < 7 ? -0.31 : 0.31; cbox(L, x, 0.82 + (k % 3) * 0.08, z, 0.02, 0.07, 0.07, mark); cbox(L, 0, 1.025, z + 0.05, 0.08, 0.02, 0.08, mark); }
      cbox(L, 0, 0.95, 0.85, 0.46, 0.42, 0.42, fur); cbox(L, 0, 0.84, 1.08, 0.26, 0.2, 0.12, belly); cbox(L, 0, 0.88, 1.15, 0.08, 0.06, 0.02, 0x2a1a14);
      cbox(L, -0.17, 1.2, 0.8, 0.1, 0.1, 0.06, fur); cbox(L, 0.17, 1.2, 0.8, 0.1, 0.1, 0.06, fur);
      if (kind === 'tiger') { cbox(L, 0, 1.12, 0.92, 0.48, 0.04, 0.04, mark); cbox(L, -0.24, 0.98, 0.85, 0.02, 0.2, 0.05, mark); cbox(L, 0.24, 0.98, 0.85, 0.02, 0.2, 0.05, mark); }
      eyes(0.12, 1.03, 1.065, 0xd8c23a);
      cbox(L, 0, 0.9, -0.85, 0.09, 0.09, 0.5, fur); cbox(L, 0, 0.85, -1.1, 0.1, 0.1, 0.12, mark);
      break;
    }
    case 'boar': {
      const c = 0x4a3426;
      legs4(0.18, 0.38, 0.36, 0.13, 0x3a281c, 0x1d140e);
      cbox(L, 0, 0.62, 0, 0.6, 0.55, 1.05, c); cbox(L, 0, 0.93, 0, 0.12, 0.1, 0.9, 0x2a1d14);
      cbox(L, 0, 0.62, 0.66, 0.44, 0.42, 0.34, c); cbox(L, 0, 0.55, 0.88, 0.24, 0.2, 0.16, 0x6a4a38); cbox(L, 0, 0.55, 0.965, 0.18, 0.12, 0.02, 0x2a1a14);
      cbox(L, -0.15, 0.55, 0.9, 0.05, 0.16, 0.05, 0xf0ead8); cbox(L, 0.15, 0.55, 0.9, 0.05, 0.16, 0.05, 0xf0ead8);
      cbox(L, -0.15, 0.88, 0.62, 0.1, 0.12, 0.05, c); cbox(L, 0.15, 0.88, 0.62, 0.1, 0.12, 0.05, c);
      eyes(0.13, 0.72, 0.83);
      break;
    }
    case 'elephant': {
      const c = 0x8a8784, dk = 0x6f6c69;
      legs4(0.42, 0.65, 0.95, 0.38, c, 0xd9d2c2);
      cbox(L, 0, 1.55, 0, 1.3, 1.15, 2.0, c); cbox(L, 0, 2.15, -0.1, 1.0, 0.12, 1.6, dk);
      cbox(L, 0, 1.75, 1.2, 0.85, 0.85, 0.6, c);
      cbox(L, -0.55, 1.75, 1.05, 0.12, 0.75, 0.6, dk); cbox(L, 0.55, 1.75, 1.05, 0.12, 0.75, 0.6, dk);
      cbox(L, -0.25, 1.28, 1.55, 0.1, 0.1, 0.5, 0xf2ecdc); cbox(L, 0.25, 1.28, 1.55, 0.1, 0.1, 0.5, 0xf2ecdc);
      eyes(0.3, 1.92, 1.505);
      cbox(L, 0, 1.0, -1.05, 0.08, 0.7, 0.08, c);
      parts.push(limb(0.24, 0.95, 0.24, c, 0, 1.55, 1.5, dk));   // the trunk swings too
      break;
    }
    case 'crocodile': {
      const c = 0x4b5a2c, belly = 0xb7b47a;
      legs4(0.32, 0.55, 0.2, 0.16, c);
      cbox(L, 0, 0.32, 0, 0.6, 0.26, 1.4, c); cbox(L, 0, 0.2, 0, 0.52, 0.04, 1.3, belly);
      for (let k = 0; k < 7; k++) cbox(L, 0, 0.48, -0.6 + k * 0.2, 0.3, 0.06, 0.08, 0x3a4622);
      cbox(L, 0, 0.32, 0.92, 0.42, 0.22, 0.44, c); cbox(L, 0, 0.27, 1.4, 0.3, 0.12, 0.6, c); cbox(L, 0, 0.21, 1.4, 0.3, 0.02, 0.58, 0xf2ecdc);
      cbox(L, -0.14, 0.46, 0.95, 0.09, 0.08, 0.1, 0xc2b13a); cbox(L, 0.14, 0.46, 0.95, 0.09, 0.08, 0.1, 0xc2b13a);
      cbox(L, 0, 0.3, -1.05, 0.32, 0.18, 0.7, c); cbox(L, 0, 0.27, -1.6, 0.16, 0.12, 0.5, c);
      break;
    }
    case 'deer': case 'horse': case 'llama': {
      const c = kind === 'deer' ? 0xa86f3e : kind === 'horse' ? 0x6b4329 : 0xe9e0cc, dk = kind === 'horse' ? 0x2a1a12 : kind === 'deer' ? 0x7a4e2a : 0xc9bea8;
      const tall = kind === 'llama' ? 0.85 : kind === 'horse' ? 0.85 : 0.72;
      legs4(0.2, kind === 'horse' ? 0.55 : 0.42, tall, 0.13, c, kind === 'llama' ? 0x5a4a3a : 0x2a1f16);
      const bw = kind === 'horse' ? 0.6 : 0.5, bl = kind === 'horse' ? 1.45 : kind === 'llama' ? 0.95 : 1.05;
      cbox(L, 0, tall + 0.25, 0, bw, 0.5, bl, c);
      if (kind === 'deer') { cbox(L, 0, tall + 0.05, 0, bw - 0.08, 0.06, bl - 0.1, 0xead8bc); cbox(L, 0, tall + 0.4, -bl / 2 - 0.04, 0.16, 0.18, 0.08, 0xf5efe2); }
      const nz = bl / 2 - 0.05, ny = tall + 0.45, neckH = kind === 'llama' ? 0.85 : 0.55;
      cbox(L, 0, ny + neckH / 2, nz + 0.08, 0.24, neckH, 0.26, c);
      const hy = ny + neckH, hz = nz + 0.22;
      cbox(L, 0, hy, hz + 0.08, 0.28, 0.28, kind === 'horse' ? 0.6 : 0.42, c);
      cbox(L, 0, hy - 0.06, hz + (kind === 'horse' ? 0.36 : 0.28), 0.22, 0.14, 0.04, dk);
      eyes(0.145, hy + 0.06, hz + 0.02);
      cbox(L, -0.1, hy + 0.2, hz - 0.08, 0.06, 0.16, 0.05, c); cbox(L, 0.1, hy + 0.2, hz - 0.08, 0.06, 0.16, 0.05, c);
      if (kind === 'horse') { cbox(L, 0, ny + neckH / 2 + 0.12, nz - 0.02, 0.08, neckH + 0.2, 0.12, dk); cbox(L, 0, tall + 0.2, -bl / 2 - 0.2, 0.12, 0.6, 0.12, dk); }
      if (kind === 'deer') for (const s of [-1, 1]) { cbox(L, s * 0.12, hy + 0.32, hz - 0.05, 0.04, 0.3, 0.04, 0x8a6a48); cbox(L, s * 0.2, hy + 0.45, hz - 0.05, 0.18, 0.04, 0.04, 0x8a6a48); cbox(L, s * 0.27, hy + 0.55, hz - 0.08, 0.04, 0.2, 0.04, 0x8a6a48); }
      if (kind === 'llama') cbox(L, 0, tall + 0.35, -bl / 2 - 0.05, 0.12, 0.2, 0.1, c);
      break;
    }
    case 'panda': {
      const w = 0xf2f0ea, k = 0x1e1e1e;
      legs4(0.24, 0.38, 0.38, 0.22, k);
      cbox(L, 0, 0.72, 0, 0.78, 0.66, 1.1, w); cbox(L, 0, 0.75, 0.3, 0.8, 0.5, 0.3, k);
      cbox(L, 0, 0.92, 0.72, 0.56, 0.5, 0.42, w);
      cbox(L, -0.2, 1.2, 0.68, 0.14, 0.14, 0.1, k); cbox(L, 0.2, 1.2, 0.68, 0.14, 0.14, 0.1, k);
      cbox(L, -0.14, 0.97, 0.935, 0.14, 0.12, 0.02, k); cbox(L, 0.14, 0.97, 0.935, 0.14, 0.12, 0.02, k);
      cbox(L, -0.14, 0.98, 0.945, 0.04, 0.04, 0.01, 0xffffff); cbox(L, 0.14, 0.98, 0.945, 0.04, 0.04, 0.01, 0xffffff);
      cbox(L, 0, 0.84, 0.95, 0.16, 0.1, 0.06, w); cbox(L, 0, 0.87, 0.985, 0.08, 0.05, 0.02, k);
      break;
    }
    case 'parrot': {
      const red = 0xd8282a, blue = 0x2a5fc8, yel = 0xf2c230;
      legH = 0.12;
      parts.push(limb(0.04, 0.12, 0.04, 0x3a3a3a, -0.06, 0.12, 0), limb(0.04, 0.12, 0.04, 0x3a3a3a, 0.06, 0.12, 0));
      cbox(L, 0, 0.3, 0, 0.22, 0.28, 0.3, red); cbox(L, 0, 0.47, 0.1, 0.18, 0.18, 0.18, red);
      cbox(L, 0, 0.45, 0.22, 0.08, 0.1, 0.08, 0xeae4d4); cbox(L, 0, 0.41, 0.25, 0.06, 0.08, 0.05, 0x2a2a2a);
      eyes(0.06, 0.5, 0.19);
      cbox(L, 0, 0.22, -0.3, 0.08, 0.05, 0.34, blue); cbox(L, 0, 0.23, -0.12, 0.12, 0.08, 0.12, yel);
      // Wings: pivots on the shoulders that flap.
      for (const s of [-1, 1]) {
        const list = []; box(list, s > 0 ? 0 : -0.3, -0.03, -0.18, s > 0 ? 0.3 : 0, 0.03, 0.12, blue); box(list, s > 0 ? 0 : -0.14, -0.035, -0.06, s > 0 ? 0.14 : 0, 0.035, 0.12, yel);
        const key = 'pwing' + s; if (!geoCache.has(key)) geoCache.set(key, mergeBoxes(list));
        const p = new THREE.Group(); p.position.set(s * 0.11, 0.36, 0); parts.push({ p, geo: geoCache.get(key), wing: s });
      }
      break;
    }
    case 'turtle': {
      const shell = 0x5e6b33, pat = 0x7c8a44, skin = 0x8aa070;
      legH = 0.14;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(limb(sz > 0 ? 0.32 : 0.2, 0.08, 0.16, skin, sx * 0.32, 0.18, sz * 0.32));
      cbox(L, 0, 0.22, 0, 0.66, 0.16, 0.84, shell); cbox(L, 0, 0.33, 0, 0.5, 0.1, 0.66, pat); cbox(L, 0, 0.4, 0, 0.3, 0.06, 0.4, shell);
      for (let k = 0; k < 3; k++) cbox(L, 0, 0.385, -0.2 + k * 0.2, 0.32, 0.02, 0.02, 0x3c4620);
      cbox(L, 0, 0.12, 0, 0.6, 0.06, 0.78, 0xd2c89a);
      cbox(L, 0, 0.24, 0.52, 0.24, 0.16, 0.24, skin); eyes(0.1, 0.27, 0.645);
      cbox(L, 0, 0.18, -0.48, 0.08, 0.06, 0.14, skin);
      break;
    }
  }
  if (!geoCache.has(kind)) geoCache.set(kind, mergeBoxes(L));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const g = new THREE.Group(), body = new THREE.Mesh(geoCache.get(kind), mat);
  body.castShadow = true; g.add(body);
  const legs = [], wings = [];
  for (const q of parts) { const m = new THREE.Mesh(q.geo, mat); m.castShadow = true; q.p.add(m); g.add(q.p); if (q.wing) wings.push(q.p); else legs.push(q.p); }
  return { g, legs, wings, mat };
}

/// Which wild animals live near each great city (on top of the farm animals that live everywhere).
export const REGION = {
  angkor: ['tiger', 'elephant', 'parrot', 'deer'], mohenjoDaro: ['tiger', 'elephant', 'deer'], forbiddenCity: ['tiger', 'horse', 'deer'],
  wei: ['horse', 'tiger', 'deer'], shu: ['panda', 'panda', 'tiger', 'deer'], wu: ['tiger', 'deer', 'boar'],
  teotihuacan: ['jaguar', 'parrot', 'deer'], giza: ['crocodile', 'camel'], alexandria: ['crocodile', 'camel'], babylon: ['horse', 'boar', 'camel'],
  persepolis: ['horse', 'deer'], rome: ['boar', 'deer', 'horse'], athens: ['boar', 'deer'], carthage: ['elephant', 'horse', 'boar'],
  jerusalem: ['deer', 'boar'], greatWall: ['horse', 'tiger', 'deer'],
};
export const GROUP = { tiger: 1, jaguar: 1, crocodile: 1, elephant: 2, panda: 1, parrot: 3, turtle: 2, boar: 2, deer: 3, horse: 3, llama: 2 };
