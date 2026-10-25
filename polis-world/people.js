// Polis World (computer version): what the townspeople look like and how they work.
// Bodies are drawn as instances (one mesh per body part for a whole crowd). Each person has a face (eyes, eyebrows,
// nose, mouth), hands, sandals, a belt, hair, sometimes a beard, a necklace or a hat in their city's style.
// About a third of each city's people are at work: standing at their workplace (an oven, a potter's wheel, a block of
// stone, a loom…) with the right tool in hand, doing their job.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// ---------- the body ----------
// Joints: where a part turns from. 'upper' parts lean with the body (round the hips at y 0.75).
export const JOINTS = {
  root: [0, 0, 0], legL: [-0.125, 0.75, 0], legR: [0.125, 0.75, 0],
  armL: [-0.36, 1.48, 0], armR: [0.36, 1.48, 0], head: [0, 1.5, 0], upper: [0, 0, 0],
};
const UPPER = new Set(['upper', 'armL', 'armR', 'head']);
// [name, joint, centre (from the joint), size, colour key]
export const PARTS = [
  ['legL', 'legL', [0, -0.375, 0], [0.25, 0.75, 0.25], 'pants'],
  ['legR', 'legR', [0, -0.375, 0], [0.25, 0.75, 0.25], 'pants'],
  ['footL', 'legL', [0, -0.71, 0.04], [0.26, 0.08, 0.34], 'shoes'],
  ['footR', 'legR', [0, -0.71, 0.04], [0.26, 0.08, 0.34], 'shoes'],
  ['robe', 'root', [0, 0.62, 0], [0.52, 0.62, 0.28], 'shirt'],
  ['body', 'upper', [0, 1.125, 0], [0.5, 0.75, 0.25], 'shirt'],
  ['belt', 'upper', [0, 0.82, 0], [0.53, 0.08, 0.27], 'belt'],
  ['neck', 'upper', [0, 1.47, 0.13], [0.3, 0.05, 0.03], 'gold'],
  ['armL', 'armL', [0, -0.29, 0], [0.22, 0.58, 0.22], 'sleeves'],
  ['armR', 'armR', [0, -0.29, 0], [0.22, 0.58, 0.22], 'sleeves'],
  ['handL', 'armL', [0, -0.66, 0], [0.2, 0.16, 0.2], 'skin'],
  ['handR', 'armR', [0, -0.66, 0], [0.2, 0.16, 0.2], 'skin'],
  ['head', 'head', [0, 0.24, 0], [0.48, 0.48, 0.48], 'skin'],
  ['hairTop', 'head', [0, 0.47, -0.01], [0.5, 0.12, 0.5], 'hair'],
  ['hairBack', 'head', [0, 0.28, -0.22], [0.5, 0.36, 0.08], 'hair'],
  ['eyeL', 'head', [-0.1, 0.27, 0.242], [0.11, 0.07, 0.01], 'white'],
  ['eyeR', 'head', [0.1, 0.27, 0.242], [0.11, 0.07, 0.01], 'white'],
  ['pupilL', 'head', [-0.085, 0.27, 0.248], [0.05, 0.06, 0.01], 'eye'],
  ['pupilR', 'head', [0.115, 0.27, 0.248], [0.05, 0.06, 0.01], 'eye'],
  ['browL', 'head', [-0.1, 0.335, 0.245], [0.13, 0.03, 0.02], 'hair'],
  ['browR', 'head', [0.1, 0.335, 0.245], [0.13, 0.03, 0.02], 'hair'],
  ['nose', 'head', [0, 0.2, 0.26], [0.07, 0.1, 0.05], 'nose'],
  ['mouth', 'head', [0, 0.1, 0.243], [0.14, 0.03, 0.01], 'mouth'],
  ['beard', 'head', [0, 0.04, 0.2], [0.44, 0.16, 0.1], 'hair'],
  // Hats and headcloths: up to three boxes each, sized per person.
  ['hat1', 'head', [0, 0, 0], [1, 1, 1], 'hat1'],
  ['hat2', 'head', [0, 0, 0], [1, 1, 1], 'hat2'],
  ['hat3', 'head', [0, 0, 0], [1, 1, 1], 'hat3'],
];
export const isUpper = (joint) => UPPER.has(joint);

// ---------- clothes and hats in each city's style ----------
const HAIR = [0x241a12, 0x1a1410, 0x3a2716, 0x2e2018, 0x5a4632, 0x8a8a86];
const SHOES = [0x5a3a22, 0x6b4a2b, 0x4a3222, 0x8a6a42];
const BELTS = [0x6b4a2b, 0x8a3226, 0xc9a24a, 0x3a2a1a, 0x2f4f8a];
// Hats: [chance, pieces [part, size, centre (from the head joint), colour]]
const HATS = {
  roman: [[0.12, [['hat1', [0.52, 0.06, 0.52], [0, 0.44, 0], 0x4f8a3a]]]],                       // a laurel wreath
  greek: [[0.25, [['hat1', [0.52, 0.06, 0.52], [0, 0.4, 0], 0xece8dd]]], [0.12, [['hat1', [0.7, 0.04, 0.7], [0, 0.5, 0], 0xc9a26a], ['hat2', [0.4, 0.14, 0.4], [0, 0.58, 0], 0xc9a26a]]]],
  egyptian: [[0.4, [['hat1', [0.54, 0.12, 0.54], [0, 0.46, 0], 0x2f5fb0], ['hat2', [0.08, 0.34, 0.2], [-0.27, 0.22, 0.04], 0xd9b34a], ['hat3', [0.08, 0.34, 0.2], [0.27, 0.22, 0.04], 0xd9b34a]]]],
  mesopotamian: [[0.45, [['hat1', [0.52, 0.16, 0.52], [0, 0.48, 0], 0x9c4b33], ['hat2', [0.4, 0.08, 0.4], [0, 0.6, 0], 0x7a3a26]]]],
  persian: [[0.55, [['hat1', [0.44, 0.38, 0.44], [0, 0.62, 0], 0xd2bb8c]]], [0.2, [['hat1', [0.52, 0.14, 0.52], [0, 0.48, 0], 0x4d5f99]]]],
  indus: [[0.5, [['hat1', [0.52, 0.07, 0.52], [0, 0.38, 0], 0xc75c38]]]],
  mesoamerican: [[0.5, [['hat1', [0.52, 0.08, 0.52], [0, 0.42, 0], 0xcc4d33], ['hat2', [0.06, 0.34, 0.05], [0, 0.6, -0.22], 0x2f9a5a], ['hat3', [0.06, 0.26, 0.05], [0.08, 0.56, -0.22], 0xd9b34a]]]],
  khmer: [[0.35, [['hat1', [0.8, 0.05, 0.8], [0, 0.5, 0], 0xd8c48a], ['hat2', [0.5, 0.1, 0.5], [0, 0.57, 0], 0xd8c48a], ['hat3', [0.24, 0.1, 0.24], [0, 0.66, 0], 0xd8c48a]]]],
  // A head cloth over the head and down the back.
  judean: [[0.45, [['hat1', [0.54, 0.12, 0.54], [0, 0.46, 0], 0xece6d6], ['hat2', [0.54, 0.4, 0.08], [0, 0.26, -0.26], 0xece6d6]]], [0.15, [['hat1', [0.54, 0.12, 0.54], [0, 0.46, 0], 0x6a5a4a], ['hat2', [0.54, 0.4, 0.08], [0, 0.26, -0.26], 0x6a5a4a]]]],
  // Phoenician men's tall rounded caps.
  punic: [[0.45, [['hat1', [0.48, 0.2, 0.48], [0, 0.52, 0], 0xece6d6], ['hat2', [0.32, 0.16, 0.32], [0, 0.68, 0], 0xece6d6]]], [0.15, [['hat1', [0.48, 0.2, 0.48], [0, 0.52, 0], 0x6a2a6a]]]],
  // Hair in a topknot, or a black cap.
  chinese: [[0.4, [['hat1', [0.2, 0.18, 0.2], [0, 0.58, -0.02], 0x1a1410], ['hat2', [0.06, 0.06, 0.3], [0, 0.66, -0.02], 0xd9b34a]]], [0.3, [['hat1', [0.5, 0.18, 0.5], [0, 0.52, 0], 0x1a1a22], ['hat2', [0.2, 0.2, 0.2], [0, 0.64, -0.1], 0x1a1a22]]]],
};
const BEARD = { roman: 0.2, greek: 0.45, egyptian: 0.05, mesopotamian: 0.7, persian: 0.75, indus: 0.4, mesoamerican: 0.05, khmer: 0.1, judean: 0.75, punic: 0.5, chinese: 0.3 };
const ROBE = { roman: 0.35, greek: 0.55, egyptian: 0.3, mesopotamian: 0.75, persian: 0.7, indus: 0.55, mesoamerican: 0.15, khmer: 0.5, judean: 0.8, punic: 0.75, chinese: 0.85 };

/// How one townsperson looks. `look` = [skin, shirt, pants] from the city's palette; r() = this person's own random numbers.
export function dress(style, look, r) {
  const c = new THREE.Color();
  const shirt = c.setHex(look[1]).offsetHSL((r() - 0.5) * 0.06, (r() - 0.5) * 0.2, (r() - 0.5) * 0.16).getHex();
  const skin = c.setHex(look[0]).offsetHSL(0, 0, (r() - 0.5) * 0.08).getHex();
  const robe = r() < (ROBE[style] ?? 0.3);
  const hair = HAIR[Math.floor(r() * (r() < 0.85 ? 4 : HAIR.length))];
  const hats = HATS[style] || [];
  let hat = null; let roll = r();
  for (const [chance, pieces] of hats) { if (roll < chance) { hat = pieces; break; } roll -= chance; }
  return {
    robe, beard: r() < (BEARD[style] ?? 0.2), longHair: r() < 0.45, necklace: r() < 0.3, hat,
    colors: {
      skin, shirt, sleeves: r() < 0.5 ? shirt : skin, pants: robe ? shirt : look[2], hair, eye: 0x1e2a44, white: 0xf2efe8,
      nose: c.setHex(skin).offsetHSL(0, 0, -0.06).getHex(), mouth: 0x8a3a32, shoes: SHOES[Math.floor(r() * SHOES.length)],
      belt: BELTS[Math.floor(r() * BELTS.length)], gold: 0xe0b84a, hat1: hat?.[0]?.[3] ?? 0, hat2: hat?.[1]?.[3] ?? 0, hat3: hat?.[2]?.[3] ?? 0,
    },
  };
}

// ---------- jobs ----------
// tool: what's in the right hand; prop: the workplace in front of them; anim: how they move; walks: they do their job on the move.
export const JOBS = {
  baker: { prop: 'oven', anim: 'knead' }, potter: { prop: 'wheel', anim: 'knead' },
  stonemason: { tool: 'hammer', prop: 'block', anim: 'hammer' }, shopkeeper: { prop: 'stall', anim: 'wave' },
  'water carrier': { load: 'jar', anim: 'carry', walks: true },
  'olive farmer': { prop: 'olive', anim: 'reach' }, 'vase painter': { tool: 'brush', prop: 'vase', anim: 'paint' },
  sculptor: { tool: 'hammer', prop: 'statue', anim: 'hammer' }, rower: { tool: 'oar', anim: 'oarWalk', walks: true },
  'stone hauler': { prop: 'sledge', anim: 'pull' }, 'quarry worker': { tool: 'pick', prop: 'block', anim: 'hammer' },
  'papyrus maker': { prop: 'papyrus', anim: 'knead' }, sailor: { prop: 'rope', anim: 'pull' },
  glassblower: { tool: 'pipe', prop: 'kiln', anim: 'blow' }, 'brick maker': { prop: 'bricks', anim: 'knead' },
  'canal digger': { tool: 'hoe', anim: 'dig' }, astronomer: { tool: 'tablet', anim: 'lookup' },
  'stone carver': { tool: 'hammer', prop: 'relief', anim: 'hammer' }, gardener: { tool: 'hoe', prop: 'flowers', anim: 'dig' },
  messenger: { tool: 'scroll', anim: 'run', walks: true }, 'bead maker': { prop: 'beads', anim: 'drill' },
  weaver: { prop: 'loom', anim: 'weave' }, 'seal carver': { tool: 'chisel', prop: 'table', anim: 'paint' },
  'obsidian worker': { tool: 'hammer', prop: 'obsidian', anim: 'hammer' }, farmer: { tool: 'hoe', prop: 'maize', anim: 'dig' },
  'mural painter': { tool: 'brush', prop: 'mural', anim: 'paint' }, 'rice farmer': { tool: 'sickle', prop: 'rice', anim: 'dig' },
  'temple carver': { tool: 'hammer', prop: 'relief', anim: 'hammer' }, fisher: { tool: 'rod', prop: 'fishbasket', anim: 'fish' },
  // Jerusalem, Carthage, Beijing and the Three Kingdoms.
  scribe: { tool: 'brush', prop: 'table', anim: 'paint' }, 'purple dyer': { prop: 'dyeVat', anim: 'knead' }, shipwright: { tool: 'hammer', prop: 'hull', anim: 'hammer' },
  carpenter: { tool: 'hammer', prop: 'beam', anim: 'hammer' }, 'beam painter': { tool: 'brush', prop: 'paintedBeam', anim: 'paint' },
  'millet farmer': { tool: 'sickle', prop: 'millet', anim: 'dig' }, 'paper maker': { prop: 'pulpVat', anim: 'knead' }, blacksmith: { tool: 'hammer', prop: 'anvil', anim: 'hammer' },
  'silk weaver': { prop: 'loom', anim: 'weave' },
  // Olympia.
  athlete: { anim: 'run', walks: true }, judge: { tool: 'scroll', anim: 'wave' }, 'salt worker': { prop: 'brine', anim: 'pull' }, 'tea farmer': { prop: 'tea', anim: 'reach' },
};

/// Joint angles for a moment of a job (or of walking). Returns { legL, legR, armLx, armRx, armLz, armRz, lean, head }.
export function pose(anim, t, moving, phase) {
  const s = Math.sin, p = { legL: 0, legR: 0, armLx: 0, armRx: 0, armLz: 0, armRz: 0, lean: 0, head: 0 };
  const walk = (k = 0.6) => { const w = s(phase) * k; p.legL = w; p.legR = -w; p.armLx = -w; p.armRx = w; };
  if (moving) walk(anim === 'run' ? 0.95 : 0.6);
  switch (anim) {
    case 'hammer': { const k = Math.max(0, s(t * 5)); p.armRx = -2.2 + k * 1.3; p.armLx = -0.9; p.lean = 0.25; break; }
    case 'knead': p.armLx = -1.0 + s(t * 4) * 0.18; p.armRx = -1.0 - s(t * 4) * 0.18; p.lean = 0.3; break;
    case 'paint': p.armRx = -1.25 + s(t * 3) * 0.15; p.armRz = s(t * 2.3) * 0.18; p.armLx = -0.25; break;
    case 'dig': { const k = s(t * 2.2); p.armLx = p.armRx = -0.9 + k * 0.5; p.lean = 0.35 + k * 0.15; break; }
    case 'pull': p.armLx = p.armRx = -1.35 + s(t * 1.6) * 0.15; p.lean = -0.22 + s(t * 1.6) * 0.06; p.legL = 0.35; p.legR = -0.25; break;
    case 'carry': if (!moving) { p.legL = p.legR = 0; } p.armLx = p.armRx = -2.95; p.armLz = 0.25; p.armRz = -0.25; break;
    case 'row': { const k = s(t * 2); p.armLx = p.armRx = -1.25 + k * 0.45; p.lean = k * 0.25; break; }
    case 'blow': p.armRx = -1.45; p.armLx = -1.25; p.armLz = -0.3; p.head = 0.05 + s(t * 2) * 0.03; break;
    case 'lookup': p.head = -0.55; p.armRx = -2.7; p.armLx = -0.7; break;
    case 'weave': p.armLx = p.armRx = -1.05; p.armLz = s(t * 3) * 0.25; p.armRz = s(t * 3) * 0.25; break;
    case 'wave': { const k = (t % 7) < 1.6; p.armRx = k ? -2.8 : 0; p.armRz = k ? -0.3 + s(t * 9) * 0.3 : 0; p.armLx = -0.5; break; }
    case 'fish': p.armLx = p.armRx = -1.05 + s(t * 0.7) * 0.05 + (s(t * 3.1) > 0.97 ? -0.2 : 0); break;
    case 'reach': p.armLx = -2.6 + s(t * 2) * 0.2; p.armRx = -2.6 - s(t * 2) * 0.2; p.head = -0.3; break;
    case 'drill': p.armRx = -1.0; p.armRz = s(t * 9) * 0.3; p.armLx = -0.9; p.lean = 0.3; break;
    default: break;
  }
  return p;
}

// ---------- tools and workplaces, as little models made of boxes ----------
/// One mesh from a list of coloured boxes [x0, y0, z0, x1, y1, z1, colour].
export function boxModel(boxes) {
  const pos = [], nrm = [], col = [], idx = [], c = new THREE.Color();
  for (const [x0, y0, z0, x1, y1, z1, hex] of boxes) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const base = pos.length / 3;
    c.setHex(hex);
    pos.push(...g.attributes.position.array); nrm.push(...g.attributes.normal.array);
    for (let i = 0; i < g.attributes.position.count; i++) col.push(c.r, c.g, c.b);
    for (const i of g.index.array) idx.push(base + i);
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}
const W = 0x7a5232, DW = 0x5a3a22, IRON = 0x8a8f96, STONE = 0xc9c2b0, CLAY = 0xb5643a, GOLD = 0xe0b84a, LEAF = 0x4f8a3a;
// Tools sit in the right hand: the hand is at (0, -0.66, 0) from the shoulder; +z points forward when the arm hangs down.
export const TOOLS = {
  hammer: [[-0.03, -0.7, -0.03, 0.03, -0.66, 0.42, W], [-0.07, -0.74, 0.36, 0.07, -0.6, 0.5, IRON]],
  pick: [[-0.03, -0.7, -0.03, 0.03, -0.66, 0.5, W], [-0.04, -0.86, 0.44, 0.04, -0.5, 0.52, IRON]],
  chisel: [[-0.025, -0.7, 0, 0.025, -0.66, 0.26, IRON]],
  brush: [[-0.02, -0.69, 0, 0.02, -0.66, 0.3, W], [-0.03, -0.7, 0.28, 0.03, -0.65, 0.36, 0x3a6ab0]],
  hoe: [[-0.03, -0.7, -0.5, 0.03, -0.64, 0.7, W], [-0.08, -0.84, 0.64, 0.08, -0.64, 0.7, IRON]],
  sickle: [[-0.03, -0.7, 0, 0.03, -0.66, 0.2, W], [-0.02, -0.7, 0.18, 0.02, -0.66, 0.42, IRON], [-0.02, -0.7, 0.4, 0.14, -0.66, 0.44, IRON]],
  oar: [[-0.03, -0.7, -0.5, 0.03, -0.64, 1.1, W], [-0.03, -0.82, 0.95, 0.03, -0.52, 1.3, W]],
  pipe: [[-0.02, -0.7, 0, 0.02, -0.66, 0.8, IRON], [-0.08, -0.76, 0.78, 0.08, -0.6, 0.94, 0xff9a3a]],
  tablet: [[-0.12, -0.74, 0.02, 0.12, -0.62, 0.18, CLAY]],
  scroll: [[-0.04, -0.74, 0.02, 0.04, -0.62, 0.28, 0xece2c4]],
  rod: [[-0.02, -0.7, -0.1, 0.02, -0.66, 1.9, DW]],
};
// How each tool is tipped in the hand (radians, toward the ground): a hoe points down at the soil, a rod up at the sky.
const GRIP = { hoe: 1.15, sickle: 0.9, pick: 0.5, hammer: 0.35, chisel: 0.4, brush: 0.2, oar: 1.0, rod: -0.5, pipe: 1.5, tablet: 0, scroll: 0 };
const HAND = -0.68;
/// The model of a tool, as it sits in the right hand (in the shoulder's frame).
// The game can give the townspeople the very same tool models you hold (made from the item pictures in icons.js).
let toolOverride = null;
export function useToolModels(fn) { toolOverride = fn; }
export function toolGeometry(name) {
  const g = (toolOverride && toolOverride(name)) || boxModel(TOOLS[name]);
  return g.translate(0, -HAND, 0).rotateX(GRIP[name] ?? 0).translate(0, HAND, 0);
}
// How far in front of the worker each workplace stands.
export const PROP_DIST = { sledge: 1.75, olive: 1.15, stall: 0.75, rope: 0.6, boat: 0, loom: 0.75, mural: 0.65, relief: 0.7, statue: 0.85 , hull: 1.6, brine: 0.7, beam: 0.8, paintedBeam: 0.8 };
export const LOADS = { jar: [[-0.14, 0, -0.14, 0.14, 0.34, 0.14, CLAY], [-0.08, 0.34, -0.08, 0.08, 0.42, 0.08, CLAY]] };
// Workplaces stand on the ground in front of the worker; their +z side faces the worker.
export const PROPS = {
  oven: [[-0.5, 0, -0.4, 0.5, 0.7, 0.4, 0x9c6a4a], [-0.4, 0.7, -0.3, 0.4, 0.95, 0.3, 0x9c6a4a], [-0.2, 0.15, 0.39, 0.2, 0.45, 0.42, 0xff8a2a], [-0.7, 0, -0.75, -0.45, 0.6, -0.45, W], [-0.68, 0.6, -0.73, -0.47, 0.66, -0.47, 0xd9a85a]],
  wheel: [[-0.08, 0, -0.08, 0.08, 0.45, 0.08, DW], [-0.32, 0.45, -0.32, 0.32, 0.52, 0.32, W], [-0.13, 0.52, -0.13, 0.13, 0.78, 0.13, CLAY], [0.5, 0, -0.2, 0.75, 0.45, 0.05, CLAY], [0.55, 0.45, -0.15, 0.7, 0.55, 0.0, CLAY]],
  block: [[-0.45, 0, -0.35, 0.45, 0.7, 0.35, STONE], [0.5, 0, -0.1, 0.62, 0.08, 0.1, 0xd8d2c0], [-0.6, 0, 0.1, -0.48, 0.06, 0.2, 0xd8d2c0]],
  statue: [[-0.35, 0, -0.35, 0.35, 0.25, 0.35, STONE], [-0.16, 0.25, -0.12, 0.16, 1.1, 0.12, 0xeeeae2], [-0.12, 1.1, -0.1, 0.12, 1.36, 0.14, 0xeeeae2], [-0.3, 0.75, -0.08, -0.16, 1.05, 0.08, 0xeeeae2]],
  stall: [[-0.7, 0, -0.3, 0.7, 0.75, 0.3, W], [-0.7, 0.75, -0.3, 0.7, 0.8, 0.3, DW], [-0.5, 0.8, -0.15, -0.3, 1.0, 0.05, 0xd94a3a], [-0.1, 0.8, -0.15, 0.1, 0.95, 0.05, 0xe8c040], [0.3, 0.8, -0.15, 0.5, 1.05, 0.05, CLAY], [-0.75, 0, -0.35, -0.68, 1.9, -0.28, DW], [0.68, 0, -0.35, 0.75, 1.9, -0.28, DW], [-0.8, 1.9, -0.6, 0.8, 1.96, 0.3, 0xc0392b]],
  olive: [[-0.07, 0, -0.07, 0.07, 1.3, 0.07, DW], [-0.6, 1.2, -0.6, 0.6, 1.9, 0.6, 0x6f8f4a], [-0.3, 1.9, -0.3, 0.3, 2.15, 0.3, 0x6f8f4a], [0.5, 0, 0.3, 0.8, 0.28, 0.6, 0xa8834a]],
  vase: [[-0.25, 0, -0.25, 0.25, 0.4, 0.25, W], [-0.15, 0.4, -0.15, 0.15, 0.85, 0.15, 0xc8642a], [-0.1, 0.85, -0.1, 0.1, 0.95, 0.1, 0x1a1410], [-0.16, 0.55, -0.16, 0.16, 0.6, 0.16, 0x1a1410]],
  sledge: [[-0.4, 0, -0.9, 0.4, 0.12, 0.9, W], [-0.42, 0.12, -0.6, 0.42, 0.9, 0.6, STONE], [-0.03, 0.06, 0.9, 0.03, 0.12, 1.5, 0xc9b27a], [-0.03, 0.12, 1.45, 0.03, 1.2, 1.51, 0xc9b27a]],
  boat: [[-0.45, 0.1, -1.1, 0.45, 0.2, 1.1, W], [-0.5, 0.1, -1.1, -0.4, 0.5, 1.1, DW], [0.4, 0.1, -1.1, 0.5, 0.5, 1.1, DW], [-0.5, 0.1, 1.0, 0.5, 0.5, 1.15, DW], [-0.5, 0.1, -1.15, 0.5, 0.5, -1.0, DW], [-0.4, 0.3, -0.75, 0.4, 0.38, -0.55, W], [-0.3, 0, -0.9, -0.2, 0.1, 0.9, DW], [0.2, 0, -0.9, 0.3, 0.1, 0.9, DW]],
  papyrus: [[-0.6, 0, -0.35, 0.6, 0.7, 0.35, W], [-0.5, 0.7, -0.25, 0.5, 0.72, 0.25, 0xf0e6c4], [0.7, 0, -0.1, 0.78, 1.1, -0.02, 0x6f9a3a], [0.82, 0, 0.05, 0.9, 1.0, 0.13, 0x6f9a3a]],
  rope: [[-0.35, 0, -0.35, 0.35, 0.12, 0.35, 0xc9b27a], [-0.25, 0.12, -0.25, 0.25, 0.22, 0.25, 0xb59e6a], [-0.04, 0.16, 0.3, 0.04, 1.2, 0.36, 0xc9b27a]],
  kiln: [[-0.45, 0, -0.45, 0.45, 0.9, 0.45, 0x8a7a6a], [-0.2, 0.3, 0.44, 0.2, 0.6, 0.47, 0xffa040], [-0.15, 0.9, -0.15, 0.15, 1.3, 0.15, 0x6a5a4a]],
  bricks: [[-0.6, 0, -0.4, -0.2, 0.12, -0.2, 0xa8834a], [-0.1, 0, -0.4, 0.3, 0.12, -0.2, 0xa8834a], [-0.6, 0, -0.05, -0.2, 0.12, 0.15, 0xa8834a], [-0.1, 0, -0.05, 0.3, 0.12, 0.15, 0x9a7542], [0.45, 0, -0.2, 0.85, 0.18, 0.2, W]],
  relief: [[-0.6, 0, -0.15, 0.6, 1.3, 0.15, STONE], [-0.4, 0.4, 0.15, -0.2, 0.9, 0.18, 0xb8b09c], [0.0, 0.5, 0.15, 0.3, 1.0, 0.18, 0xb8b09c]],
  flowers: [[-0.6, 0, -0.4, 0.6, 0.05, 0.4, 0x5a3a22], [-0.45, 0.05, -0.25, -0.35, 0.3, -0.15, 0xd94a6a], [-0.05, 0.05, 0.0, 0.05, 0.3, 0.1, 0xe8c040], [0.3, 0.05, -0.2, 0.4, 0.3, -0.1, 0xd94a6a], [0.2, 0.05, 0.2, 0.3, 0.28, 0.3, LEAF]],
  beads: [[-0.4, 0, -0.3, 0.4, 0.6, 0.3, W], [-0.2, 0.6, -0.1, -0.15, 0.65, -0.05, 0xc84a2a], [-0.05, 0.6, 0.0, 0.0, 0.65, 0.05, 0xc84a2a], [0.1, 0.6, -0.12, 0.15, 0.65, -0.07, 0xe86a3a], [0.2, 0.6, 0.05, 0.25, 0.65, 0.1, 0xc84a2a]],
  loom: [[-0.6, 0, -0.1, -0.52, 1.5, 0.0, W], [0.52, 0, -0.1, 0.6, 1.5, 0.0, W], [-0.6, 1.42, -0.1, 0.6, 1.5, 0.0, W], [-0.52, 0.3, -0.07, 0.52, 1.42, -0.04, 0xd8c8a8], [-0.52, 0.6, -0.08, 0.52, 0.9, -0.03, 0xc75c38]],
  table: [[-0.45, 0, -0.3, 0.45, 0.65, 0.3, W], [-0.1, 0.65, -0.1, 0.1, 0.72, 0.1, 0xd8d2c0]],
  obsidian: [[-0.35, 0, -0.3, 0.35, 0.4, 0.3, 0x1a1a22], [0.4, 0, 0.1, 0.5, 0.04, 0.2, 0x2a2a34], [-0.55, 0, -0.2, -0.47, 0.03, -0.1, 0x2a2a34]],
  maize: [[-0.6, 0, -0.5, 0.6, 0.05, 0.5, 0x5a3a22], ...[-0.4, 0, 0.4].flatMap((x) => [[x - 0.04, 0.05, -0.04, x + 0.04, 1.3, 0.04, 0x7aa04a], [x - 0.08, 0.8, 0.0, x + 0.0, 1.0, 0.08, 0xe8c040]])],
  rice: [[-0.7, 0, -0.5, 0.7, 0.04, 0.5, 0x4a7a9a], ...[-0.5, -0.2, 0.1, 0.4].flatMap((x) => [[x - 0.03, 0.04, -0.3, x + 0.03, 0.5, -0.24, 0x8ab04a], [x - 0.03, 0.04, 0.2, x + 0.03, 0.45, 0.26, 0x9ab84a]])],
  mural: [[-0.7, 0, -0.1, 0.7, 1.6, 0.05, 0xe8dcc4], [-0.5, 0.5, 0.05, -0.1, 1.1, 0.07, 0xcc4d33], [0.0, 0.7, 0.05, 0.4, 1.3, 0.07, 0x338c73], [-0.3, 1.2, 0.05, 0.1, 1.4, 0.07, 0xd9b34a]],
  fishbasket: [[-0.25, 0, -0.25, 0.25, 0.3, 0.25, 0xa8834a], [-0.15, 0.3, -0.05, 0.15, 0.36, 0.05, 0x9ab0c0]],
  // A dyer's vat of purple, and a paper maker's vat of white pulp with a bamboo screen.
  dyeVat: [[-0.4, 0, -0.4, 0.4, 0.55, 0.4, DW], [-0.32, 0.5, -0.32, 0.32, 0.56, 0.32, 0x6a2a6a], [0.5, 0, -0.2, 0.75, 0.2, 0.1, 0xd8c8a0]],
  pulpVat: [[-0.45, 0, -0.35, 0.45, 0.5, 0.35, DW], [-0.38, 0.45, -0.28, 0.38, 0.51, 0.28, 0xf2efe6], [-0.3, 0.52, -0.2, 0.3, 0.55, 0.2, 0xc9b27a]],
  // A ship's hull being built: keel and ribs.
  hull: [[-0.08, 0, -1.0, 0.08, 0.15, 1.0, W], ...[-0.7, -0.2, 0.3, 0.8].flatMap((z) => [[-0.5, 0.1, z - 0.05, -0.42, 0.8, z + 0.05, W], [0.42, 0.1, z - 0.05, 0.5, 0.8, z + 0.05, W], [-0.5, 0.1, z - 0.05, 0.5, 0.18, z + 0.05, W]])],
  // A big timber on trestles, plain for the carpenter and painted for the beam painter.
  beam: [[-0.7, 0, -0.1, -0.6, 0.55, 0.1, DW], [0.6, 0, -0.1, 0.7, 0.55, 0.1, DW], [-0.9, 0.55, -0.15, 0.9, 0.8, 0.15, 0xa8763a]],
  paintedBeam: [[-0.7, 0, -0.1, -0.6, 0.55, 0.1, DW], [0.6, 0, -0.1, 0.7, 0.55, 0.1, DW], [-0.9, 0.55, -0.15, 0.9, 0.8, 0.15, 0x2f6a5a], [-0.6, 0.6, 0.15, -0.2, 0.75, 0.16, 0x2f5fa8], [0.1, 0.6, 0.15, 0.5, 0.75, 0.16, 0xd9b34a]],
  millet: [[-0.6, 0, -0.5, 0.6, 0.05, 0.5, 0x5a3a22], ...[-0.4, -0.1, 0.2, 0.45].flatMap((x) => [[x - 0.03, 0.05, -0.03, x + 0.03, 0.9, 0.03, 0x9ab04a], [x - 0.06, 0.8, -0.06, x + 0.06, 1.05, 0.06, 0xd9b34a]])],
  // A brine well: a tall bamboo frame and a rope.
  brine: [[-0.3, 0, -0.3, 0.3, 0.3, 0.3, 0x8a8f96], [-0.05, 0.3, -0.05, 0.05, 2.0, 0.05, 0xb8a050], [-0.3, 1.9, -0.05, 0.3, 2.0, 0.05, 0xb8a050], [-0.02, 0.4, 0.3, 0.02, 1.9, 0.34, 0xc9b27a]],
  tea: [[-0.7, 0, -0.3, -0.1, 0.6, 0.3, 0x3f7a3a], [0.1, 0, -0.3, 0.7, 0.55, 0.3, 0x4a8a42], [0.75, 0, 0.1, 1.0, 0.25, 0.35, 0xa8834a]],
  // A smith's anvil on a tree stump, with a little charcoal fire beside it.
  anvil: [[-0.22, 0, -0.22, 0.22, 0.45, 0.22, DW], [-0.28, 0.45, -0.12, 0.28, 0.62, 0.12, 0x3a3a40], [0.28, 0.5, -0.06, 0.42, 0.58, 0.06, 0x3a3a40], [0.55, 0, -0.25, 0.95, 0.25, 0.15, 0x6a5a4a], [0.62, 0.25, -0.18, 0.88, 0.32, 0.08, 0xff8a2a]],
  // A shepherd's hurdle (a little woven fence) and a water trough.
  trough: [[-0.6, 0, -0.2, 0.6, 0.35, 0.2, W], [-0.5, 0.25, -0.12, 0.5, 0.33, 0.12, 0x4a7a9a]],
};
