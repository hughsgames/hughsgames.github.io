// Polis World (computer version): the three relics of the Atlantis legend, as detailed little sculptures that turn
// slowly above their pedestals: Poseidon's trident, the orichalcum tablet of laws and the golden hippocamp.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { mergeBoxes } from './scenery.js';

const GOLD = 0xe8c040, GOLD_DK = 0xb88a20, GOLD_LT = 0xffe48a, ORI = 0xd8743a, ORI_DK = 0x8a3a1a, ORI_LT = 0xf0a060, GEM = 0x36c8e8, GEM_DK = 0x1a6a9a, PEARL = 0xf4f0e6;
const at = (list, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) => {
  const m = new THREE.Matrix4().makeTranslation(x, y, z);
  if (rx || ry || rz) m.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
  list.push({ m: m.multiply(new THREE.Matrix4().makeScale(w, h, d)), color });
};

function trident(L) {
  // The shaft, wrapped in bands where you'd hold it, with a pearl at the foot.
  at(L, 0, 0.62, 0, 0.07, 1.2, 0.07, GOLD);
  for (let k = 0; k < 6; k++) at(L, 0, 0.32 + k * 0.07, 0, 0.09, 0.035, 0.09, k % 2 ? GOLD_DK : ORI);
  at(L, 0, 0.0, 0, 0.13, 0.13, 0.13, PEARL); at(L, 0, 0.06, 0, 0.1, 0.04, 0.1, GOLD_DK);
  // The head: a crossbar with curls, a blue gem, and three barbed prongs.
  at(L, 0, 1.24, 0, 0.5, 0.07, 0.08, GOLD);
  at(L, 0, 1.18, 0, 0.16, 0.12, 0.1, GOLD_DK); at(L, 0, 1.18, 0.05, 0.08, 0.08, 0.03, GEM);
  for (const s of [-1, 1]) {
    at(L, s * 0.27, 1.2, 0, 0.06, 0.12, 0.06, GOLD_LT, 0, 0, s * 0.5); at(L, s * 0.3, 1.13, 0, 0.06, 0.06, 0.06, GOLD);   // curls
    at(L, s * 0.21, 1.42, 0, 0.055, 0.34, 0.055, GOLD, 0, 0, -s * 0.12);                                                  // side prongs
    at(L, s * 0.235, 1.6, 0, 0.09, 0.06, 0.05, GOLD_LT, 0, 0, s * 0.6); at(L, s * 0.16, 1.55, 0, 0.05, 0.08, 0.04, GOLD_DK, 0, 0, -s * 0.9); // barbs
  }
  at(L, 0, 1.5, 0, 0.065, 0.5, 0.065, GOLD);
  at(L, 0, 1.78, 0, 0.11, 0.09, 0.06, GOLD_LT, 0, 0, Math.PI / 4);
  at(L, -0.05, 1.68, 0, 0.04, 0.08, 0.04, GOLD_DK, 0, 0, 0.8); at(L, 0.05, 1.68, 0, 0.04, 0.08, 0.04, GOLD_DK, 0, 0, -0.8);
  for (const y of [0.9, 1.05]) at(L, 0, y, 0, 0.1, 0.02, 0.1, ORI);
  return 0.95;
}
function tablet(L) {
  // A slab of orichalcum (the legend's red-gold metal), framed, with seven lines of carved laws and Poseidon's sign on top.
  at(L, 0, 0.06, 0, 0.8, 0.12, 0.34, ORI_DK);
  at(L, 0, 0.66, 0, 0.72, 1.06, 0.1, ORI);
  at(L, 0, 0.66, 0, 0.78, 1.12, 0.07, ORI_DK);
  at(L, 0, 1.24, 0, 0.46, 0.14, 0.1, ORI); at(L, 0, 1.33, 0, 0.24, 0.08, 0.1, ORI);
  for (const s of [-1, 0, 1]) at(L, s * 0.06, 1.3, 0.055, 0.025, s ? 0.06 : 0.09, 0.02, GOLD_LT);
  at(L, 0, 1.25, 0.055, 0.14, 0.02, 0.02, GOLD_LT);
  for (let row = 0; row < 7; row++) {
    const y = 1.06 - row * 0.115;
    at(L, 0, y - 0.05, 0.052, 0.6, 0.008, 0.012, ORI_DK);
    let x = -0.27;
    for (let k = 0; x < 0.26; k++) { const w = 0.02 + ((row * 7 + k * 3) % 5) * 0.012; at(L, x + w / 2, y, 0.053, w, 0.05 - ((k + row) % 3) * 0.012, 0.012, (k + row) % 4 ? ORI_DK : ORI_LT); x += w + 0.025; }
  }
  for (const [x, y] of [[-0.33, 1.17], [0.33, 1.17], [-0.33, 0.17], [0.33, 0.17]]) at(L, x, y, 0.06, 0.06, 0.06, 0.03, GEM);
  return 0.85;
}
function hippocamp(L) {
  // Half horse, half fish: a golden horse's head and front legs with webbed hooves, and a curling fish's tail.
  at(L, 0, 1.08, 0.18, 0.2, 0.42, 0.22, GOLD, -0.35);                 // neck
  at(L, 0, 1.36, 0.32, 0.2, 0.2, 0.34, GOLD, 0.25);                   // head
  at(L, 0, 1.3, 0.5, 0.15, 0.14, 0.16, GOLD_DK, 0.25);                // snout
  at(L, 0, 1.27, 0.585, 0.13, 0.04, 0.02, GOLD_DK);
  for (const s of [-1, 1]) { at(L, s * 0.105, 1.4, 0.34, 0.02, 0.05, 0.05, GEM); at(L, s * 0.06, 1.5, 0.22, 0.04, 0.12, 0.05, GOLD_LT, -0.3); }   // eyes, ears
  for (let k = 0; k < 6; k++) at(L, 0, 1.46 - k * 0.1, 0.12 - k * 0.04, 0.05, 0.12, 0.08, k % 2 ? GEM : GEM_DK, -0.6);   // a fin for a mane
  at(L, 0, 0.82, 0.05, 0.26, 0.34, 0.34, GOLD);                         // chest
  for (const s of [-1, 1]) {
    at(L, s * 0.09, 0.62, 0.2, 0.07, 0.3, 0.07, GOLD, 0.6); at(L, s * 0.09, 0.5, 0.36, 0.07, 0.07, 0.15, GOLD_DK, 0.2);   // front legs
    at(L, s * 0.11, 0.46, 0.44, 0.12, 0.03, 0.12, GEM_DK);                                                                 // webbed hooves
    at(L, s * 0.15, 0.86, -0.02, 0.03, 0.18, 0.22, GEM, 0.4);                                                              // side fins
  }
  // The tail curls round behind in a spiral, getting thinner, with scales and a fan of fins at the end.
  let x = 0, y = 0.72, z = -0.12, a = Math.PI * 1.15, size = 0.26;
  for (let k = 0; k < 14; k++) {
    const r = 0.2 - k * 0.008; a += 0.42; y += Math.sin(a) * r * 0.42; z += Math.cos(a) * r * 0.42 - 0.02;
    at(L, x, y, z, size * 0.9, size, size, k % 2 ? GOLD : GOLD_DK, a); if (k % 3 === 1) at(L, 0, y + size * 0.5, z, 0.03, 0.06, size * 0.6, GEM_DK, a);
    size *= 0.9;
  }
  for (const s of [-1, 0, 1]) at(L, s * 0.08, y + 0.08, z - 0.06, 0.04, 0.22, 0.12, GEM, 0.6, 0, s * 0.5);
  at(L, 0, 0.12, 0, 0.5, 0.12, 0.5, 0x1e2a3a); at(L, 0, 0.2, 0, 0.42, 0.04, 0.42, GEM_DK);   // a little sea-stone base
  for (let k = 0; k < 6; k++) at(L, Math.cos(k) * 0.16, 0.25, Math.sin(k) * 0.16, 0.05, 0.05, 0.05, PEARL);
  return 0.95;
}

const cache = new Map();
/// A relic's sculpture (about a block tall). Also returns a few sparkles to twinkle round it.
export function buildRelic(id) {
  if (!cache.has(id)) {
    const L = [];
    const scale = id === 'trident' ? trident(L) : id === 'lawTablet' ? tablet(L) : hippocamp(L);
    cache.set(id, { geo: mergeBoxes(L), scale });
  }
  const { geo, scale } = cache.get(id);
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 90, specular: 0x8a7a50, emissive: 0x2a1e08 }));
  mesh.castShadow = true; mesh.scale.setScalar(scale); mesh.position.y = -0.55;
  g.add(mesh);
  return { g, mesh };
}
