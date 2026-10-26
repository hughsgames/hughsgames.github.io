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
  // Added later: the rest of the ancient world's wildlife, each kind where it really lived.
  lion: { hp: 18, speed: 1.5, fast: 4.2, temper: 'fight', bite: 2, drops: [['leather', 1, 2]], name: 'lion', size: [0.66, 0.7, 1.6],
    fact: 'Lions once lived all round the Mediterranean and across the Middle East, not just in Africa. Assyrian kings hunted them, and the Greeks told of the lion of Nemea that Heracles fought.' },
  wolf: { hp: 10, speed: 1.8, fast: 5.4, temper: 'fight', bite: 1, drops: [['leather', 1, 2]], name: 'wolf', size: [0.5, 0.55, 1.2],
    fact: 'Rome\'s founding story says a she-wolf fed the twins Romulus and Remus. Wolves hunt in family packs, and every farmer in the ancient world worried about them.' },
  bear: { hp: 22, speed: 1.2, fast: 3.9, temper: 'fight', bite: 2, drops: [['leather', 1, 3]], name: 'brown bear', size: [0.85, 0.9, 1.3],
    fact: 'Brown bears lived in the forests and mountains of Europe and Anatolia. The Romans sometimes brought them to the arena, and the Greeks linked them to Artemis.' },
  aurochs: { hp: 24, speed: 1.2, fast: 4.0, temper: 'fight', bite: 2, push: 7, drops: [['rawBeef', 2, 3], ['leather', 1, 2]], name: 'aurochs', size: [0.9, 1.1, 1.8],
    fact: 'The aurochs was the huge wild ox that all farm cattle came from. It stood as tall as a person at the shoulder. The last one died in Poland in 1627.' },
  ibex: { hp: 9, speed: 1.6, fast: 5.0, temper: 'flee', drops: [['goatMeat', 1, 2], ['leather', 0, 1]], name: 'ibex', size: [0.5, 0.75, 1.0],
    fact: 'Ibex are wild mountain goats with long curved horns. They walk on cliffs so steep nothing can follow them, which is why hunters admired them so much.' },
  gazelle: { hp: 7, speed: 1.8, fast: 6.0, temper: 'flee', drops: [['rawBeef', 1, 2], ['leather', 0, 1]], name: 'gazelle', size: [0.45, 0.7, 1.0],
    fact: 'Gazelles live where there is very little water, in the deserts of Egypt and Arabia. Egyptian tomb paintings show them being hunted, and some were kept almost like pets.' },
  ostrich: { hp: 12, speed: 1.6, fast: 6.2, temper: 'flee', drops: [['feather', 2, 3]], name: 'ostrich', size: [0.6, 1.5, 0.8],
    fact: 'The ostrich is the biggest bird in the world and cannot fly, but it can run faster than a horse. Egyptians used its feathers as a symbol of truth, and its eggs as cups.' },
  hippo: { hp: 30, speed: 0.9, fast: 3.6, temper: 'fight', bite: 3, push: 8, drops: [['leather', 1, 3]], name: 'hippopotamus', size: [1.1, 0.95, 2.2], swims: true,
    fact: 'Hippos filled the Nile in ancient times. Egyptians feared them, because a hippo could smash a reed boat, and the goddess Taweret, who protected mothers and babies, had a hippo\'s body.' },
  monkey: { hp: 6, speed: 1.6, fast: 5.0, temper: 'flee', drops: [], name: 'macaque', size: [0.35, 0.5, 0.5],
    fact: 'Macaques live all through the forests of India and Southeast Asia, and around temples like Angkor. Egyptians kept baboons, and the god Thoth was sometimes shown as one.' },
  peacock: { hp: 5, speed: 1.2, fast: 4.4, temper: 'flee', drops: [['feather', 2, 3]], name: 'peacock', size: [0.4, 0.7, 0.6],
    fact: 'Peacocks come from India. Traders carried them west along the trade routes, and in Greece and Rome they were so rare and so expensive that keeping one showed how rich you were.' },
  yak: { hp: 20, speed: 1.0, fast: 3.4, temper: 'flee', drops: [['rawBeef', 1, 3], ['wool', 1, 3]], name: 'yak', size: [0.85, 1.0, 1.6],
    fact: 'Yaks carry loads high in the mountains of Tibet and western China, where the air is too thin for most animals. Their long shaggy hair keeps out the cold, and they give milk, wool and butter.' },
  fox: { hp: 5, speed: 1.7, fast: 5.2, temper: 'flee', drops: [['leather', 0, 1]], name: 'fox', size: [0.3, 0.38, 0.8],
    fact: 'Foxes live nearly everywhere, from Egypt to Britain. Aesop, who told fables in Greece, made the fox the clever trickster of his stories.' },
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
    // ---------- the animals people keep ----------
    case 'sheep': {
      const wool = 0xf0ece2, face = 0x4a4038;
      legs4(0.2, 0.3, 0.42, 0.11, 0x58504a, 0x332c28);
      cbox(L, 0, 0.76, 0, 0.6, 0.56, 1.0, wool);
      // Lumps of fleece, so a sheep looks woolly instead of square.
      for (const [bx, by, bz] of [[-0.26, 0.98, 0.26], [0.26, 0.98, -0.08], [0, 1.02, 0.08], [-0.2, 0.96, -0.32], [0.24, 1.0, 0.32], [0, 0.94, -0.42], [-0.3, 0.74, 0.0], [0.3, 0.74, 0.14]]) cbox(L, bx, by, bz, 0.3, 0.2, 0.3, wool);
      cbox(L, 0, 0.88, 0.6, 0.28, 0.32, 0.3, face);
      cbox(L, 0, 0.82, 0.76, 0.2, 0.18, 0.06, 0x6a5e54);
      cbox(L, 0, 1.04, 0.54, 0.34, 0.18, 0.26, wool);
      for (const s of [-1, 1]) cbox(L, s * 0.19, 0.94, 0.58, 0.14, 0.07, 0.1, face);
      eyes(0.1, 0.94, 0.755);
      cbox(L, 0, 0.78, -0.54, 0.16, 0.2, 0.1, wool);
      break;
    }
    case 'cow': {
      const hide = 0x5c3c26, patch = 0xe9e2d5, horn = 0xe8dcc0;
      legs4(0.28, 0.5, 0.56, 0.16, 0x3a2618, 0x241610);
      cbox(L, 0, 0.94, 0, 0.78, 0.68, 1.32, hide);
      for (const s of [-1, 1]) cbox(L, s * 0.4, 0.98, s * 0.24, 0.02, 0.38, 0.5, patch);
      cbox(L, 0, 1.27, 0.1, 0.48, 0.02, 0.46, patch);
      cbox(L, 0, 0.62, 0, 0.68, 0.06, 1.2, 0xd8c8b8);
      cbox(L, 0, 1.04, 0.86, 0.44, 0.44, 0.44, hide);
      cbox(L, 0, 0.94, 1.1, 0.32, 0.24, 0.1, patch);
      eyes(0.17, 1.13, 1.085);
      for (const s of [-1, 1]) {
        cbox(L, s * 0.26, 1.27, 0.82, 0.12, 0.09, 0.09, horn);
        cbox(L, s * 0.37, 1.33, 0.82, 0.12, 0.08, 0.08, horn);
        cbox(L, s * 0.29, 1.08, 0.76, 0.16, 0.08, 0.1, hide);
      }
      cbox(L, 0, 0.68, -0.44, 0.22, 0.18, 0.18, 0xe8c0b8);
      cbox(L, 0, 0.94, -0.72, 0.08, 0.42, 0.08, hide);
      cbox(L, 0, 0.7, -0.74, 0.11, 0.18, 0.11, 0x3a2618);
      break;
    }
    case 'pig': {
      const skin = 0xe7a6a0, pale = 0xf0bdb6;
      legs4(0.22, 0.34, 0.3, 0.12, 0xd38f88, 0x8a5a54);
      cbox(L, 0, 0.58, 0, 0.62, 0.56, 0.96, skin);
      cbox(L, 0, 0.6, 0.58, 0.4, 0.38, 0.3, pale);
      cbox(L, 0, 0.54, 0.78, 0.24, 0.2, 0.1, 0xf5cdc6);
      for (const s of [-1, 1]) cbox(L, s * 0.07, 0.54, 0.835, 0.05, 0.07, 0.02, 0xb07a74);
      for (const s of [-1, 1]) cbox(L, s * 0.17, 0.8, 0.56, 0.15, 0.15, 0.05, pale);
      eyes(0.12, 0.7, 0.73);
      cbox(L, 0, 0.7, -0.5, 0.06, 0.06, 0.12, skin);
      cbox(L, 0.07, 0.76, -0.56, 0.14, 0.06, 0.06, skin);
      break;
    }
    case 'chicken': {
      const feather = 0xf2f0ea, comb = 0xd8322a, beak = 0xe5a83a;
      legH = 0.22;
      parts.push(limb(0.05, 0.22, 0.05, beak, -0.08, 0.22, 0), limb(0.05, 0.22, 0.05, beak, 0.08, 0.22, 0));
      cbox(L, 0, 0.42, 0, 0.3, 0.34, 0.42, feather);
      cbox(L, 0, 0.62, 0.13, 0.2, 0.22, 0.2, feather);
      cbox(L, 0, 0.615, 0.27, 0.1, 0.08, 0.1, beak);
      cbox(L, 0, 0.75, 0.11, 0.04, 0.12, 0.15, comb);
      cbox(L, 0, 0.55, 0.25, 0.06, 0.1, 0.05, comb);
      eyes(0.07, 0.655, 0.225);
      for (const s of [-1, 1]) cbox(L, s * 0.16, 0.42, 0, 0.04, 0.24, 0.32, 0xe4e0d2);
      for (let k = 0; k < 3; k++) cbox(L, (k - 1) * 0.07, 0.55 + k * 0.03, -0.27, 0.06, 0.22, 0.16, feather);
      break;
    }
    case 'goat': {
      const c = 0xb8ab95, dk = 0x6a5e4c, horn = 0x3a2e1c;
      legs4(0.2, 0.34, 0.44, 0.1, 0x5c5040, 0x2a241c);
      cbox(L, 0, 0.72, 0, 0.5, 0.46, 0.9, c);
      cbox(L, 0, 0.84, 0.54, 0.28, 0.3, 0.34, 0xc9bea9);
      cbox(L, 0, 0.77, 0.74, 0.18, 0.16, 0.08, dk);
      eyes(0.1, 0.88, 0.715);
      for (const s of [-1, 1]) {
        cbox(L, s * 0.16, 0.9, 0.48, 0.16, 0.06, 0.09, c);
        for (let k = 0; k < 4; k++) cbox(L, s * 0.08, 1.0 + k * 0.09, 0.44 - k * 0.09, 0.06, 0.11, 0.11, horn);
      }
      cbox(L, 0, 0.66, 0.76, 0.08, 0.18, 0.08, dk);
      cbox(L, 0, 0.82, -0.46, 0.1, 0.15, 0.08, c);
      break;
    }
    case 'camel': {
      const c = 0xc8a36a, dk = 0xa9864f, pale = 0xdcc097;
      legs4(0.28, 0.5, 0.66, 0.14, dk, 0x6a5436);
      cbox(L, 0, 1.03, 0, 0.7, 0.74, 1.3, c);
      cbox(L, 0, 1.6, -0.02, 0.46, 0.4, 0.6, c);
      cbox(L, 0, 1.78, -0.02, 0.3, 0.1, 0.44, dk);
      cbox(L, 0, 1.4, 0.64, 0.28, 0.76, 0.3, c);
      cbox(L, 0, 1.78, 0.78, 0.26, 0.26, 0.44, c);
      cbox(L, 0, 1.72, 0.98, 0.2, 0.16, 0.1, pale);
      eyes(0.13, 1.85, 0.985);
      for (const s of [-1, 1]) cbox(L, s * 0.12, 1.93, 0.7, 0.08, 0.09, 0.06, c);
      cbox(L, 0, 1.06, -0.7, 0.08, 0.32, 0.08, c);
      cbox(L, 0, 0.88, -0.72, 0.1, 0.16, 0.1, dk);
      break;
    }
    case 'tiger': case 'jaguar': case 'lion': {
      const fur = kind === 'tiger' ? 0xd9822b : kind === 'lion' ? 0xc9a05e : 0xd8a842, mark = kind === 'lion' ? 0x6b4a28 : 0x1d1712, belly = kind === 'lion' ? 0xe4d2ac : 0xf1e6d2;
      legs4(0.2, 0.5, 0.5, 0.16, fur, 0x2a1f16);
      cbox(L, 0, 0.78, 0, 0.6, 0.48, 1.35, fur); cbox(L, 0, 0.56, 0, 0.5, 0.06, 1.2, belly);
      if (kind === 'tiger') for (let k = 0; k < 7; k++) { const z = -0.55 + k * 0.18; cbox(L, 0, 0.885, z, 0.615, 0.28, 0.05, mark); }
      else if (kind === 'jaguar') for (let k = 0; k < 14; k++) { const z = -0.55 + (k % 7) * 0.18, x = k < 7 ? -0.31 : 0.31; cbox(L, x, 0.82 + (k % 3) * 0.08, z, 0.02, 0.07, 0.07, mark); cbox(L, 0, 1.025, z + 0.05, 0.08, 0.02, 0.08, mark); }
      cbox(L, 0, 0.95, 0.85, 0.46, 0.42, 0.42, fur); cbox(L, 0, 0.84, 1.08, 0.26, 0.2, 0.12, belly); cbox(L, 0, 0.88, 1.15, 0.08, 0.06, 0.02, 0x2a1a14);
      cbox(L, -0.17, 1.2, 0.8, 0.1, 0.1, 0.06, fur); cbox(L, 0.17, 1.2, 0.8, 0.1, 0.1, 0.06, fur);
      if (kind === 'tiger') { cbox(L, 0, 1.12, 0.92, 0.48, 0.04, 0.04, mark); cbox(L, -0.24, 0.98, 0.85, 0.02, 0.2, 0.05, mark); cbox(L, 0.24, 0.98, 0.85, 0.02, 0.2, 0.05, mark); }
      // A lion's mane: a thick ruff of darker fur all round his head and under his chin.
      if (kind === 'lion') {
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2, r = 0.34 + (k % 3) * 0.045;
          cbox(L, Math.sin(a) * r, 0.95 + Math.cos(a) * r * 0.95, 0.74, 0.22, 0.22, 0.4 + (k % 2) * 0.12, k % 2 ? mark : 0x7d5a30);
        }
        cbox(L, 0, 0.66, 0.92, 0.3, 0.26, 0.2, mark);
      }
      eyes(0.12, 1.03, 1.065, 0xd8c23a);
      cbox(L, 0, 0.9, -0.85, 0.09, 0.09, 0.5, fur);
      cbox(L, 0, 0.85, -1.1, kind === 'lion' ? 0.16 : 0.1, kind === 'lion' ? 0.16 : 0.1, kind === 'lion' ? 0.2 : 0.12, mark);
      // Haunches and shoulders, so it looks like a cat gathered to spring rather than a box on legs.
      for (const s of [-1, 1]) {
        cbox(L, s * 0.3, 0.74, -0.45, 0.14, 0.44, 0.46, fur);
        cbox(L, s * 0.3, 0.78, 0.42, 0.13, 0.38, 0.4, fur);
        cbox(L, s * 0.17, 1.195, 0.815, 0.05, 0.05, 0.02, 0xe0a898);     // the pink inside of an ear
        cbox(L, s * 0.2, 0.88, 1.03, 0.26, 0.012, 0.012, 0xf4efe2);      // whiskers
        cbox(L, s * 0.2, 0.845, 1.03, 0.24, 0.012, 0.012, 0xf4efe2);
      }
      cbox(L, 0, 0.78, 1.1, 0.2, 0.08, 0.1, belly);                       // chin
      if (kind === 'tiger') for (const s of [-1, 1]) { cbox(L, s * 0.31, 0.74, -0.45, 0.025, 0.3, 0.07, mark); cbox(L, s * 0.31, 0.78, 0.42, 0.025, 0.26, 0.07, mark); }
      if (kind === 'jaguar') for (const s of [-1, 1]) for (let q = 0; q < 3; q++) cbox(L, s * 0.315, 0.66 + q * 0.14, -0.52 + (q % 2) * 0.14, 0.02, 0.07, 0.07, mark);
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
      // The heavy shoulders a boar carries, a pale ring round its snout, and a little curled tail.
      cbox(L, 0, 0.82, 0.24, 0.52, 0.3, 0.5, 0x3f2c1f);
      cbox(L, 0, 0.55, 0.955, 0.26, 0.2, 0.03, 0x8a6a58);
      for (const s of [-1, 1]) { cbox(L, s * 0.15, 0.885, 0.615, 0.05, 0.07, 0.03, 0xa07868); cbox(L, s * 0.26, 0.6, -0.3, 0.12, 0.34, 0.4, c); }
      cbox(L, 0, 0.72, -0.56, 0.06, 0.06, 0.16, 0x3a281c); cbox(L, 0, 0.8, -0.62, 0.06, 0.14, 0.06, 0x3a281c);
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
      // Great ears that stand out from the head, a tufted tail, and tusks that curve up at the tips.
      for (const s of [-1, 1]) {
        cbox(L, s * 0.68, 1.72, 0.92, 0.1, 0.92, 0.72, dk);
        cbox(L, s * 0.62, 1.74, 1.02, 0.08, 0.74, 0.5, 0x7d7a76);
        cbox(L, s * 0.25, 1.42, 1.82, 0.1, 0.18, 0.1, 0xf2ecdc);
        cbox(L, s * 0.2, 1.62, 1.44, 0.26, 0.05, 0.06, dk);                 // a wrinkle over each eye
      }
      cbox(L, 0, 0.72, -1.05, 0.12, 0.2, 0.12, dk);
      cbox(L, 0, 1.46, 1.44, 0.36, 0.06, 0.1, dk);                          // the mouth under the trunk
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
      // Two more rows of scutes down the tail, a mouthful of teeth, raised eyes and nostrils.
      for (let k = 0; k < 6; k++) for (const s of [-1, 1]) cbox(L, s * 0.1, 0.44 - k * 0.012, -0.95 - k * 0.14, 0.08, 0.06, 0.07, 0x3a4622);
      for (let k = 0; k < 7; k++) for (const s of [-1, 1]) cbox(L, s * 0.135, 0.235, 1.14 + k * 0.095, 0.03, 0.05, 0.03, 0xf6f2e4);
      for (const s of [-1, 1]) { cbox(L, s * 0.14, 0.5, 0.95, 0.13, 0.06, 0.14, c); cbox(L, s * 0.07, 0.34, 1.66, 0.06, 0.05, 0.05, 0x3a4622); }
      cbox(L, 0, 0.33, 1.4, 0.26, 0.03, 0.55, 0x3a4622);
      break;
    }
    case 'deer': case 'horse': case 'llama': case 'ibex': case 'gazelle': {
      const c = kind === 'deer' ? 0xa86f3e : kind === 'horse' ? 0x6b4329 : kind === 'ibex' ? 0x9a8056 : kind === 'gazelle' ? 0xc9a068 : 0xe9e0cc;
      const dk = kind === 'horse' ? 0x2a1a12 : kind === 'deer' ? 0x7a4e2a : kind === 'ibex' ? 0x5a4a2e : kind === 'gazelle' ? 0x7a5a34 : 0xc9bea8;
      const tall = kind === 'llama' ? 0.85 : kind === 'horse' ? 0.85 : kind === 'gazelle' ? 0.74 : 0.68;
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
      // An ibex's horns sweep back over its shoulders in a long curve; a gazelle's are short and almost straight.
      if (kind === 'ibex') for (const s of [-1, 1]) for (let k = 0; k < 7; k++) { const t2 = k / 6; cbox(L, s * (0.09 + t2 * 0.06), hy + 0.24 + Math.sin(t2 * 1.5) * 0.52, hz - 0.08 - t2 * 0.85, 0.08, 0.15, 0.17, k % 2 ? 0x4a3a24 : 0x5f4b2e); }
      if (kind === 'gazelle') for (const s of [-1, 1]) for (let k = 0; k < 4; k++) cbox(L, s * (0.08 + k * 0.01), hy + 0.24 + k * 0.1, hz - 0.06 - k * 0.03, 0.05, 0.12, 0.05, 0x3a2e1c);
      if (kind === 'gazelle') { cbox(L, 0, tall + 0.3, -bl / 2 - 0.06, 0.1, 0.16, 0.08, 0xf2ece0); for (const s of [-1, 1]) cbox(L, s * 0.26, tall + 0.2, 0.1, 0.06, 0.1, 0.9, 0x7a5a34); }
      if (kind === 'ibex') cbox(L, 0, hy - 0.16, hz + 0.18, 0.1, 0.16, 0.1, 0x3a2e1c);   // a beard under the chin
      // Shoulders and haunches, so the body isn't one flat slab, and a few touches each.
      for (const s of [-1, 1]) {
        cbox(L, s * (bw / 2 - 0.04), tall + 0.2, -bl / 2 + 0.24, 0.12, 0.42, 0.42, c);
        cbox(L, s * (bw / 2 - 0.04), tall + 0.24, bl / 2 - 0.26, 0.11, 0.36, 0.34, c);
        cbox(L, s * 0.09, hy + 0.285, hz - 0.08, 0.05, 0.05, 0.04, 0xe0a898);            // inside of an ear
      }
      cbox(L, 0, tall + 0.02, 0, bw - 0.1, 0.05, bl - 0.16, kind === 'horse' ? 0x4a2e1c : 0xe8dcc2);  // a paler belly
      if (kind === 'horse') { cbox(L, 0, hy + 0.04, hz + 0.3, 0.07, 0.3, 0.03, 0xf2ece0); cbox(L, 0, hy + 0.24, hz + 0.06, 0.16, 0.12, 0.2, dk); }
      if (kind === 'deer') for (const s of [-1, 1]) for (let q = 0; q < 3; q++) cbox(L, s * (bw / 2 + 0.005), tall + 0.32 - q * 0.02, -0.3 + q * 0.3, 0.02, 0.06, 0.06, 0xf0e2c8);
      if (kind === 'llama') { cbox(L, 0, ny + neckH * 0.6, nz + 0.1, 0.32, neckH * 0.7, 0.34, 0xf4ece0); for (const s of [-1, 1]) cbox(L, s * 0.1, hy + 0.34, hz - 0.08, 0.05, 0.14, 0.05, c); }
      if (kind === 'gazelle') cbox(L, 0, tall + 0.3, -bl / 2 - 0.02, 0.26, 0.26, 0.05, 0xf2ece0);     // the white rump
      if (kind === 'ibex') cbox(L, 0, tall + 0.52, 0, 0.1, 0.06, bl - 0.2, 0x4a3a24);                  // a dark stripe down the back
      break;
    }
    case 'wolf': case 'fox': {
      const fox = kind === 'fox';
      const c = fox ? 0xc46a2a : 0x7a7368, dk = fox ? 0x8a4418 : 0x4e4942, pale = fox ? 0xf2ece0 : 0xd8d2c6;
      legs4(0.18, fox ? 0.26 : 0.38, fox ? 0.32 : 0.46, fox ? 0.09 : 0.12, c, 0x2a241c);
      const bl = fox ? 0.7 : 1.05, bw = fox ? 0.3 : 0.44, by = legH + (fox ? 0.18 : 0.26);
      cbox(L, 0, by, 0, bw, fox ? 0.3 : 0.42, bl, c);
      cbox(L, 0, by - 0.14, 0, bw - 0.06, 0.06, bl - 0.1, pale);
      const chz = bl / 2 + (fox ? 0.12 : 0.2), chy = by + (fox ? 0.16 : 0.24);
      cbox(L, 0, chy, chz, fox ? 0.26 : 0.34, fox ? 0.24 : 0.3, fox ? 0.3 : 0.36, c);
      cbox(L, 0, chy - 0.05, chz + 0.22, 0.14, 0.12, 0.24, fox ? c : dk);
      cbox(L, 0, chy - 0.04, chz + 0.34, 0.07, 0.06, 0.03, 0x1a1512);
      for (const s of [-1, 1]) cbox(L, s * 0.11, chy + 0.2, chz - 0.02, 0.1, 0.18, 0.06, dk);
      eyes(0.1, chy + 0.04, chz + 0.16, 0xd8b23a);
      cbox(L, 0, by + 0.04, -bl / 2 - 0.2, fox ? 0.2 : 0.16, fox ? 0.2 : 0.16, fox ? 0.5 : 0.44, fox ? c : dk);
      if (fox) cbox(L, 0, by + 0.04, -bl / 2 - 0.46, 0.18, 0.18, 0.12, pale);
      // A ruff at the chest, haunches behind, white cheeks on a fox and a grey saddle on a wolf.
      cbox(L, 0, chy - 0.12, chz - 0.14, bw + 0.03, fox ? 0.18 : 0.22, 0.12, fox ? pale : 0xa8a196);
      for (const s of [-1, 1]) {
        cbox(L, s * (bw / 2 - 0.02), by, -bl / 2 + 0.18, 0.1, fox ? 0.26 : 0.36, 0.3, c);
        cbox(L, s * 0.1, chy - 0.02, chz + 0.1, 0.07, 0.12, 0.12, pale);
        cbox(L, s * 0.11, chy + 0.19, chz - 0.015, 0.05, 0.1, 0.04, 0xe0a898);
      }
      if (!fox) cbox(L, 0, by + 0.16, 0, bw + 0.015, 0.11, bl - 0.24, dk);
      break;
    }
    case 'aurochs': case 'yak': {
      const yak = kind === 'yak';
      const c = yak ? 0x2e241c : 0x5a4030, dk = yak ? 0x241c16 : 0x33241a, horn = 0xe8dcc0;
      legs4(0.3, 0.6, yak ? 0.6 : 0.72, 0.18, dk, 0x1a1410);
      cbox(L, 0, legH + 0.42, 0, 0.85, 0.8, 1.6, c);
      cbox(L, 0, legH + 0.78, 0.3, 0.9, 0.3, 0.7, c);
      if (yak) { for (const s of [-1, 1]) cbox(L, s * 0.46, legH + 0.06, 0, 0.12, 0.72, 1.55, 0x6b5436); cbox(L, 0, legH - 0.02, 0, 0.82, 0.16, 1.55, 0x6b5436); cbox(L, 0, legH + 0.86, -0.2, 0.7, 0.14, 1.0, 0x6b5436); }
      const by2 = legH + 0.62, bz2 = 0.95;
      cbox(L, 0, by2, bz2, 0.46, 0.46, 0.5, c); cbox(L, 0, by2 - 0.12, bz2 + 0.3, 0.3, 0.26, 0.16, dk);
      eyes(0.2, by2 + 0.1, bz2 + 0.26);
      for (const s of [-1, 1]) { cbox(L, s * 0.3, by2 + 0.2, bz2 - 0.04, 0.24, 0.1, 0.1, horn); cbox(L, s * 0.46, by2 + 0.32, bz2 - 0.02, 0.1, 0.26, 0.1, horn); cbox(L, s * 0.46, by2 + 0.48, bz2 + 0.12, 0.09, 0.1, 0.22, horn); }
      cbox(L, 0, legH + 0.5, -0.86, 0.12, 0.12, 0.3, c);
      if (yak) cbox(L, 0, legH + 0.3, -1.05, 0.26, 0.5, 0.26, 0x6b5436); else cbox(L, 0, legH + 0.2, -1.0, 0.1, 0.5, 0.1, dk);
      // The loose fold of skin under the throat, a pale muzzle, and heavy haunches.
      cbox(L, 0, by2 - 0.34, bz2 - 0.12, 0.34, 0.4, 0.34, c);
      cbox(L, 0, by2 - 0.16, bz2 + 0.44, 0.26, 0.2, 0.05, yak ? 0x6b5436 : 0x9a7a60);
      for (const s of [-1, 1]) {
        cbox(L, s * 0.42, legH + 0.36, -0.52, 0.14, 0.52, 0.52, c);
        cbox(L, s * 0.3, by2 + 0.26, bz2 - 0.1, 0.12, 0.1, 0.14, dk);       // an ear below each horn
      }
      if (!yak) cbox(L, 0, legH + 0.84, 0, 0.1, 0.06, 1.5, 0xc9a878);       // the pale line down an aurochs' back
      break;
    }
    case 'hippo': {
      const c = 0x7a6460, dk = 0x5e4c4a, pale = 0xb08a84;
      legs4(0.42, 0.62, 0.42, 0.26, dk, 0x3a2a28);
      cbox(L, 0, legH + 0.42, 0, 1.1, 0.84, 1.9, c);
      cbox(L, 0, legH + 0.08, 0, 1.0, 0.2, 1.8, pale);
      cbox(L, 0, legH + 0.44, 1.15, 0.9, 0.7, 0.7, c);
      cbox(L, 0, legH + 0.26, 1.46, 0.86, 0.38, 0.4, pale);
      for (const s of [-1, 1]) { cbox(L, s * 0.3, legH + 0.84, 1.1, 0.16, 0.16, 0.16, c); cbox(L, s * 0.26, legH + 0.76, 1.32, 0.12, 0.1, 0.06, 0x1a1210); }
      for (const s of [-1, 1]) cbox(L, s * 0.26, legH + 0.12, 1.62, 0.1, 0.18, 0.08, 0xf2ece0);
      cbox(L, 0, legH + 0.5, -1.0, 0.12, 0.2, 0.22, dk);
      // The line of that huge mouth, nostrils on top of the muzzle so it can breathe while it floats, pink ears.
      cbox(L, 0, legH + 0.2, 1.49, 0.82, 0.04, 0.03, 0x4a3a38);
      for (const s of [-1, 1]) {
        cbox(L, s * 0.18, legH + 0.48, 1.46, 0.14, 0.1, 0.1, c);
        cbox(L, s * 0.18, legH + 0.53, 1.47, 0.06, 0.04, 0.06, 0x2a1e1c);
        cbox(L, s * 0.3, legH + 0.835, 1.115, 0.08, 0.08, 0.08, 0xc29a94);
        cbox(L, s * 0.44, legH + 0.3, -0.4, 0.14, 0.5, 0.6, c);              // back haunches
      }
      break;
    }
    case 'monkey': {
      const c = 0x8a7250, face = 0xc9a088, dk = 0x5a4832;
      legH = 0.3;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(limb(0.09, 0.3, 0.09, c, sx * 0.13, 0.3, sz * 0.14));
      cbox(L, 0, 0.46, 0, 0.3, 0.34, 0.42, c);
      cbox(L, 0, 0.72, 0.1, 0.26, 0.26, 0.26, c);
      cbox(L, 0, 0.7, 0.24, 0.18, 0.18, 0.06, face);
      for (const s of [-1, 1]) cbox(L, s * 0.16, 0.74, 0.08, 0.06, 0.12, 0.1, face);
      eyes(0.06, 0.74, 0.272);
      for (let k = 0; k < 5; k++) cbox(L, Math.sin(k) * 0.08, 0.42 + k * 0.06, -0.26 - k * 0.1, 0.07, 0.07, 0.14, dk);
      // A pale chest, a brow over its eyes, a little muzzle, and dark hands and feet.
      cbox(L, 0, 0.44, 0.2, 0.22, 0.26, 0.04, 0xcdbba0);
      cbox(L, 0, 0.8, 0.235, 0.2, 0.05, 0.05, dk);
      cbox(L, 0, 0.665, 0.25, 0.13, 0.09, 0.06, face);
      cbox(L, 0, 0.645, 0.275, 0.06, 0.03, 0.02, 0x3a2a24);
      for (const s of [-1, 1]) { cbox(L, s * 0.13, 0.17, 0.14, 0.1, 0.06, 0.12, dk); cbox(L, s * 0.13, 0.17, -0.14, 0.1, 0.06, 0.12, dk); }
      break;
    }
    case 'ostrich': {
      const body = 0x3a332c, neck = 0xd8b89a, plume = 0xf2ece0;
      legH = 0.8;
      parts.push(limb(0.1, 0.8, 0.1, neck, -0.12, 0.8, 0), limb(0.1, 0.8, 0.1, neck, 0.12, 0.8, 0));
      cbox(L, 0, 1.12, 0, 0.56, 0.6, 0.8, body);
      cbox(L, 0, 1.3, -0.32, 0.4, 0.3, 0.3, plume);
      for (const s of [-1, 1]) cbox(L, s * 0.3, 1.12, 0, 0.08, 0.4, 0.5, plume);
      for (let k = 0; k < 5; k++) cbox(L, 0, 1.42 + k * 0.17, 0.3 + k * 0.03, 0.14, 0.2, 0.14, neck);
      cbox(L, 0, 2.3, 0.4, 0.2, 0.18, 0.24, neck);
      cbox(L, 0, 2.26, 0.54, 0.1, 0.08, 0.12, 0xd8a03a);
      eyes(0.09, 2.34, 0.49);
      // Feathery thighs over those long bare legs, wing tips, and lashes over the eyes.
      for (const s of [-1, 1]) {
        cbox(L, s * 0.16, 0.95, 0, 0.22, 0.34, 0.3, body);
        cbox(L, s * 0.31, 0.95, -0.14, 0.1, 0.26, 0.26, plume);
        cbox(L, s * 0.09, 2.42, 0.47, 0.11, 0.03, 0.05, 0x2a2420);
      }
      cbox(L, 0, 1.26, -0.5, 0.3, 0.26, 0.2, plume);
      cbox(L, 0, 2.24, 0.6, 0.11, 0.05, 0.06, 0xb87c28);
      break;
    }
    case 'peacock': {
      const blue = 0x1a5a8a, green = 0x1a7a5a, gold = 0xd8b23a;
      legH = 0.3;
      parts.push(limb(0.05, 0.3, 0.05, 0xb08a4a, -0.07, 0.3, 0), limb(0.05, 0.3, 0.05, 0xb08a4a, 0.07, 0.3, 0));
      cbox(L, 0, 0.52, 0, 0.3, 0.32, 0.46, blue);
      cbox(L, 0, 0.78, 0.18, 0.18, 0.2, 0.2, blue);
      cbox(L, 0, 0.76, 0.3, 0.1, 0.08, 0.08, 0xe8e2d0);
      eyes(0.07, 0.8, 0.272);
      for (let k = 0; k < 3; k++) cbox(L, (k - 1) * 0.05, 0.96, 0.16, 0.02, 0.12, 0.02, blue);
      // The fan: a half circle of green feathers, each with a golden eye.
      for (let k = 0; k < 13; k++) {
        const a = (k - 6) * 0.2, r = 1.0;
        cbox(L, Math.sin(a) * r * 0.92, 0.5 + Math.cos(a) * r, -0.46, 0.2, 0.3, 0.07, k % 2 ? green : 0x2a8a6a);
        cbox(L, Math.sin(a) * r * 0.95, 0.5 + Math.cos(a) * r * 1.02, -0.41, 0.11, 0.12, 0.04, gold);
        for (const u of [0.4, 0.6, 0.78]) cbox(L, Math.sin(a) * r * u, 0.5 + Math.cos(a) * r * u, -0.44, 0.17, 0.22, 0.05, u > 0.6 ? 0x1a7a5a : 0x166a4e);
      }
      // Folded wings at its sides, a white flash by each eye, and the shimmer down its neck.
      for (const s of [-1, 1]) {
        cbox(L, s * 0.16, 0.52, -0.02, 0.06, 0.22, 0.34, 0x16486e);
        cbox(L, s * 0.08, 0.805, 0.255, 0.05, 0.04, 0.03, 0xf2ece0);
      }
      for (let k = 0; k < 3; k++) cbox(L, 0, 0.66 + k * 0.07, 0.17, 0.17 - k * 0.02, 0.05, 0.17, k % 2 ? 0x2a7aa8 : blue);
      cbox(L, 0, 0.98, 0.16, 0.12, 0.03, 0.03, gold);
      break;
    }
    case 'panda': case 'bear': {
      const w = kind === 'bear' ? 0x6b4a2c : 0xf2f0ea, k = kind === 'bear' ? 0x4a3420 : 0x1e1e1e;
      legs4(0.24, 0.38, 0.38, 0.22, k);
      cbox(L, 0, 0.72, 0, 0.78, 0.66, 1.1, w); cbox(L, 0, 0.75, 0.3, 0.8, 0.5, 0.3, k);
      cbox(L, 0, 0.92, 0.72, 0.56, 0.5, 0.42, w);
      cbox(L, -0.2, 1.2, 0.68, 0.14, 0.14, 0.1, k); cbox(L, 0.2, 1.2, 0.68, 0.14, 0.14, 0.1, k);
      cbox(L, -0.14, 0.97, 0.935, 0.14, 0.12, 0.02, k); cbox(L, 0.14, 0.97, 0.935, 0.14, 0.12, 0.02, k);
      cbox(L, -0.14, 0.98, 0.945, 0.04, 0.04, 0.01, 0xffffff); cbox(L, 0.14, 0.98, 0.945, 0.04, 0.04, 0.01, 0xffffff);
      cbox(L, 0, 0.84, 0.95, 0.16, 0.1, 0.06, w); cbox(L, 0, 0.87, 0.985, 0.08, 0.05, 0.02, k);
      // A bear's humped shoulder and claws; a panda's black arms and legs and a stub of a tail.
      cbox(L, 0, 1.04, 0.22, 0.66, 0.2, 0.46, kind === 'bear' ? 0x7a5634 : w);
      for (const s of [-1, 1]) {
        cbox(L, s * 0.3, 0.68, -0.38, 0.16, 0.5, 0.42, kind === 'bear' ? w : k);
        cbox(L, s * 0.3, 0.72, 0.36, 0.15, 0.44, 0.36, kind === 'bear' ? w : k);
        for (let q = 0; q < 3; q++) cbox(L, s * (0.16 + q * 0.07), 0.055, 0.42, 0.04, 0.05, 0.1, kind === 'bear' ? 0xe8dcc0 : 0x3a3a3a);
      }
      cbox(L, 0, 0.6, -0.57, 0.14, 0.14, 0.12, kind === 'bear' ? 0x4a3420 : w);
      cbox(L, 0, 0.95, 0.955, 0.3, 0.1, 0.03, kind === 'bear' ? 0xa8865c : w);   // the muzzle bridge
      // A bear is all one brown, so give it a tan face and ears to tell it apart from its coat.
      if (kind === 'bear') {
        cbox(L, 0, 0.86, 0.98, 0.34, 0.26, 0.06, 0xa8865c);
        cbox(L, 0, 0.9, 1.015, 0.14, 0.09, 0.03, 0x2a1d12);
        for (const s of [-1, 1]) { cbox(L, s * 0.21, 1.21, 0.68, 0.17, 0.17, 0.11, w); cbox(L, s * 0.21, 1.21, 0.735, 0.09, 0.09, 0.02, 0x3a2718); }
        cbox(L, 0, 0.62, 0.84, 0.3, 0.28, 0.1, 0x8a6442);
      }
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
      // A crest of feathers on its head, white cheeks, and bands of colour down the tail.
      for (let k = 0; k < 3; k++) cbox(L, (k - 1) * 0.05, 0.58 + (k === 1 ? 0.04 : 0), 0.06, 0.03, 0.12, 0.05, k === 1 ? yel : red);
      for (const s of [-1, 1]) { cbox(L, s * 0.085, 0.46, 0.16, 0.025, 0.1, 0.1, 0xeae4d4); cbox(L, s * 0.085, 0.46, 0.16, 0.03, 0.03, 0.11, 0x2a2a2a); }
      cbox(L, 0, 0.225, -0.42, 0.06, 0.04, 0.2, yel);
      cbox(L, 0, 0.34, 0.06, 0.2, 0.1, 0.2, yel);                              // a yellow shoulder patch
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
      // The shell's plates, drawn as a grid of scutes, and a beak and pale throat on the head.
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) cbox(L, a * 0.17, 0.355, b * 0.22, 0.13, 0.02, 0.17, (a + b) % 2 ? 0x6f7d3c : 0x55622d);
      for (let a = -1; a <= 1; a++) { cbox(L, a * 0.26, 0.3, 0.42, 0.11, 0.02, 0.08, 0x6f7d3c); cbox(L, a * 0.26, 0.3, -0.42, 0.11, 0.02, 0.08, 0x6f7d3c); }
      cbox(L, 0, 0.2, 0.62, 0.14, 0.06, 0.06, 0xd8cc9c);
      cbox(L, 0, 0.3, 0.615, 0.18, 0.05, 0.06, 0x6f7d3c);
      for (const s of [-1, 1]) cbox(L, s * 0.3, 0.2, 0.3, 0.1, 0.03, 0.12, 0xb8c498);
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

// ---------- where each animal lives ----------
// Two things decide what you meet: which part of the world you're in, and what the ground is like there. A lion
// belongs around the Mediterranean and the Middle East but not in China; a panda belongs in the bamboo hills of Shu
// and nowhere else; an ibex is only ever up a mountain.
export const GROUND = ['ocean', 'sea', 'lake', 'river', 'beach', 'oasis', 'desert', 'plain', 'forest', 'hill', 'mountain'];
/// The part of the ancient world each great city stands in.
export const LAND = {
  rome: 'medit', athens: 'medit', olympia: 'medit', carthage: 'africa', atlantis: 'medit',
  jerusalem: 'levant', giza: 'egypt', alexandria: 'egypt', babylon: 'mesopotamia', persepolis: 'persia',
  mohenjoDaro: 'india', angkor: 'seasia', forbiddenCity: 'china', wei: 'china', shu: 'china', wu: 'china',
  greatWall: 'steppe', teotihuacan: 'america',
};
const ALL_LANDS = ['medit', 'africa', 'levant', 'egypt', 'mesopotamia', 'persia', 'india', 'seasia', 'china', 'steppe', 'america'];
/// lands: where in the world · ground: what sort of country · water: only near a river, lake or sea.
export const HOME = {
  lion: { lands: ['medit', 'africa', 'levant', 'egypt', 'mesopotamia', 'persia'], ground: ['desert', 'plain', 'hill', 'oasis'] },
  tiger: { lands: ['india', 'seasia', 'china'], ground: ['forest', 'plain', 'hill'] },
  jaguar: { lands: ['america'], ground: ['forest', 'plain', 'hill'] },
  wolf: { lands: ['medit', 'steppe', 'china', 'persia', 'levant'], ground: ['forest', 'hill', 'mountain', 'plain'] },
  bear: { lands: ['medit', 'steppe', 'china'], ground: ['forest', 'hill', 'mountain'] },
  fox: { lands: ALL_LANDS, ground: ['plain', 'forest', 'hill', 'desert'] },
  boar: { lands: ['medit', 'levant', 'china', 'seasia', 'steppe', 'persia'], ground: ['forest', 'hill', 'plain'] },
  deer: { lands: ['medit', 'levant', 'china', 'steppe', 'persia', 'america'], ground: ['forest', 'plain', 'hill'] },
  aurochs: { lands: ['medit', 'steppe', 'levant'], ground: ['plain', 'forest'] },
  ibex: { lands: ['levant', 'persia', 'medit', 'china', 'egypt'], ground: ['mountain', 'hill'] },
  gazelle: { lands: ['egypt', 'levant', 'mesopotamia', 'persia', 'africa'], ground: ['desert', 'plain', 'oasis'] },
  ostrich: { lands: ['egypt', 'africa', 'levant', 'mesopotamia'], ground: ['desert', 'plain'] },
  camel: { lands: ['egypt', 'africa', 'mesopotamia', 'persia', 'steppe', 'levant'], ground: ['desert', 'oasis', 'plain'] },
  horse: { lands: ['steppe', 'persia', 'china', 'mesopotamia', 'medit'], ground: ['plain', 'hill'] },
  yak: { lands: ['china', 'steppe'], ground: ['mountain', 'hill'] },
  panda: { lands: ['china'], ground: ['forest', 'hill'] },
  elephant: { lands: ['india', 'seasia', 'africa'], ground: ['forest', 'plain', 'hill'] },
  monkey: { lands: ['india', 'seasia', 'china', 'egypt'], ground: ['forest', 'hill'] },
  peacock: { lands: ['india', 'seasia'], ground: ['forest', 'plain'] },
  parrot: { lands: ['america', 'seasia'], ground: ['forest', 'plain'] },
  llama: { lands: ['america'], ground: ['mountain', 'hill', 'plain'] },
  crocodile: { lands: ['egypt', 'india', 'seasia', 'africa'], ground: ['river', 'lake', 'plain', 'beach'], water: true },
  hippo: { lands: ['egypt', 'africa'], ground: ['river', 'lake', 'plain'], water: true },
  turtle: { lands: ALL_LANDS, ground: ['beach'] },
};
/// Everything that could turn up on this ground, in this part of the world.
export function wildHere(land, biome, byWater) {
  const g = GROUND[biome];
  const out = [];
  for (const [kind, h] of Object.entries(HOME)) {
    if (!h.ground.includes(g)) continue;
    if (h.water && !byWater) continue;
    if (land && !h.lands.includes(land)) continue;
    if (!land && !h.lands.includes('medit')) continue;   // out beyond the known cities, keep to the familiar ones
    out.push(kind);
  }
  return out;
}
/// How many turn up together: cats and bears alone, deer and horses in herds.
export const GROUP = {
  tiger: 1, jaguar: 1, lion: 2, wolf: 3, bear: 1, fox: 1, crocodile: 1, hippo: 2, elephant: 2, panda: 1,
  parrot: 3, peacock: 2, ostrich: 2, monkey: 4, turtle: 2, boar: 2, deer: 3, horse: 3, llama: 2,
  aurochs: 2, yak: 2, ibex: 3, gazelle: 4, camel: 2,
};
