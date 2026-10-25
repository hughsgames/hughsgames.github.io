// Polis World (computer version): the building designer.
// Drag parts (walls, rooms, columns, roofs, domes, towers, stairs, doors, windows…) onto the ground, pick a material for each,
// stretch and turn them, then save the building as a design you can build anywhere in the world.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { BLOCKS, meshChunk } from './engine.js';
import { ITEM } from './items.js';

export const GX = 32, GY = 24, GZ = 32;

// ---------- scrolling windows with the keyboard ----------
// Where the pointer last was, so the arrow keys scroll the list you're looking at.
export const pointerAt = { x: -1, y: -1 };
addEventListener('pointermove', (e) => { pointerAt.x = e.clientX; pointerAt.y = e.clientY; }, true);
const scrollable = (el) => { const cs = getComputedStyle(el); return /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.offsetParent !== null; };
/// Scrolls the scrolling list inside `root` that's under the pointer (or else the biggest one). dir: -1 up, 1 down; page: a whole screenful.
export function scrollPanel(root, dir, page = false) {
  if (!root) return false;
  const all = [root, ...root.querySelectorAll('*')].filter(scrollable);
  if (!all.length) return false;
  const under = document.elementFromPoint(pointerAt.x, pointerAt.y);
  const el = all.find((c) => under && c.contains(under)) || all.sort((a, b) => b.clientHeight - a.clientHeight)[0];
  el.scrollBy({ top: dir * (page ? el.clientHeight * 0.85 : 70) });
  return true;
}

/// Building materials you can pick (block ids).
export const MATERIALS = [55, 42, 52, 21, 53, 41, 43, 23, 7, 22, 61, 54, 76, 45, 62, 63];

// ---------- the parts ----------
// Each part has sizes you can change (w = across, d = deep, h = high), and draws itself in its own little space
// (lx 0…w-1, ly 0…h-1, lz 0…d-1); the designer turns it and moves it into place. "Cut" parts make holes.
const ring = (lx, lz, w, d) => lx === 0 || lz === 0 || lx === w - 1 || lz === d - 1;
const PARTS = {
  room: {
    label: 'Room', tip: 'Four walls with a doorway. Stretch it to any size.', group: 'Walls',
    dims: { w: [3, 32, 7], d: [3, 32, 6], h: [2, 12, 4] },
    gen(p, s, put) {
      const door = Math.floor(s.w / 2);
      for (let y = 0; y < s.h; y++) for (let z = 0; z < s.d; z++) for (let x = 0; x < s.w; x++) {
        if (!ring(x, z, s.w, s.d)) continue;
        if (z === 0 && x === door && y < 2) continue;
        put(x, y, z, p.mat);
      }
    },
  },
  wall: {
    label: 'Wall', tip: 'A straight wall. Make it longer or taller.', group: 'Walls',
    dims: { w: [1, 32, 6], h: [1, 14, 4] }, fixed: { d: 1 },
    gen(p, s, put) { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) put(x, y, 0, p.mat); },
  },
  cityWall: {
    label: 'Battlements', tip: 'A thick city wall with a walkway and notches on top, like a castle.', group: 'Walls',
    dims: { w: [3, 32, 9], h: [3, 14, 6] }, fixed: { d: 3 }, extraH: 1,
    gen(p, s, put) {
      for (let y = 0; y < s.h - 1; y++) for (let z = 0; z < 3; z++) for (let x = 0; x < s.w; x++) put(x, y, z, p.mat);
      for (let x = 0; x < s.w; x++) { if (x % 2 === 0) { put(x, s.h - 1, 0, p.mat); put(x, s.h - 1, 2, p.mat); } }
    },
  },
  floor: {
    label: 'Floor', tip: 'A flat floor or platform. Put it on top of walls to make an upstairs.', group: 'Floors',
    dims: { w: [1, 32, 6], d: [1, 32, 6] }, fixed: { h: 1 },
    gen(p, s, put) { for (let z = 0; z < s.d; z++) for (let x = 0; x < s.w; x++) put(x, 0, z, p.mat); },
  },
  steps: {
    label: 'Stepped base', tip: 'A platform with steps all round, like the base of a Greek temple.', group: 'Floors',
    dims: { w: [5, 32, 13], d: [5, 32, 9], h: [1, 4, 3] },
    gen(p, s, put) { for (let y = 0; y < s.h; y++) for (let z = y; z < s.d - y; z++) for (let x = y; x < s.w - y; x++) put(x, y, z, p.mat); },
  },
  stairs: {
    label: 'Stairs', tip: 'Steps going up. Turn them to face the way you want.', group: 'Floors',
    dims: { w: [1, 8, 2], d: [2, 16, 4] }, heightFrom: 'd',
    gen(p, s, put) { for (let z = 0; z < s.d; z++) for (let y = 0; y <= z; y++) for (let x = 0; x < s.w; x++) put(x, y, z, p.mat); },
  },
  column: {
    label: 'Column', tip: 'A tall column. In marble it becomes a Greek column.', group: 'Columns & towers',
    dims: { h: [1, 14, 5] }, fixed: { w: 1, d: 1 },
    gen(p, s, put) { for (let y = 0; y < s.h; y++) put(0, y, 0, p.mat === 42 ? 44 : p.mat); },
  },
  colonnade: {
    label: 'Row of columns', tip: 'Columns every other block. Great around a temple.', group: 'Columns & towers',
    dims: { w: [3, 31, 9], h: [1, 14, 5] }, fixed: { d: 1 },
    gen(p, s, put) { for (let x = 0; x < s.w; x += 2) for (let y = 0; y < s.h; y++) put(x, y, 0, p.mat === 42 ? 44 : p.mat); },
  },
  tower: {
    label: 'Tower', tip: 'A round tower with a door and battlements.', group: 'Columns & towers',
    dims: { w: [3, 13, 5], h: [3, 22, 9] }, lock: true, extraH: 1,
    gen(p, s, put) {
      const r = s.w / 2;
      for (let z = 0; z < s.w; z++) for (let x = 0; x < s.w; x++) {
        const dd = Math.hypot(x + 0.5 - r, z + 0.5 - r);
        if (dd > r || dd <= r - 1.15) continue;
        for (let y = 0; y < s.h - 1; y++) { if (z === 0 && x === Math.floor(r) && y < 2) continue; put(x, y, z, p.mat); }
        if ((x + z) % 2 === 0) put(x, s.h - 1, z, p.mat);
      }
      // A floor at the top to stand on.
      for (let z = 0; z < s.w; z++) for (let x = 0; x < s.w; x++) if (Math.hypot(x + 0.5 - r, z + 0.5 - r) <= r - 1.15) put(x, s.h - 2, z, p.mat === 7 ? 23 : p.mat);
    },
  },
  obelisk: {
    label: 'Obelisk', tip: 'A tall stone needle, like the ones in Egypt.', group: 'Columns & towers',
    dims: { h: [3, 20, 9] }, fixed: { w: 1, d: 1 },
    gen(p, s, put) { for (let y = 0; y < s.h; y++) put(0, y, 0, y === s.h - 1 ? 45 : p.mat); },
  },
  gable: {
    label: 'Roof', tip: 'A sloping roof with two sides. Put it on top of a room.', group: 'Roofs',
    dims: { w: [3, 31, 9], d: [1, 32, 8] }, heightFrom: 'gable',
    gen(p, s, put) {
      for (let k = 0; 2 * k < s.w; k++) {
        const a = k, b = s.w - 1 - k;
        for (let z = 0; z < s.d; z++) { put(a, k, z, p.mat); put(b, k, z, p.mat); }
        for (const z of [0, s.d - 1]) for (let x = a; x <= b; x++) put(x, k, z, p.mat);
      }
    },
  },
  hip: {
    label: 'Pointed roof', tip: 'A roof that slopes down on all four sides.', group: 'Roofs',
    dims: { w: [3, 31, 9], d: [3, 31, 9] }, heightFrom: 'hip',
    gen(p, s, put) {
      for (let k = 0; 2 * k < Math.min(s.w, s.d); k++) for (let z = k; z < s.d - k; z++) for (let x = k; x < s.w - k; x++) {
        if (x === k || z === k || x === s.w - 1 - k || z === s.d - 1 - k || 2 * (k + 1) >= Math.min(s.w, s.d)) put(x, k, z, p.mat);
      }
    },
  },
  flat: {
    label: 'Flat roof', tip: 'A flat roof with a low wall round the edge, like houses in hot countries.', group: 'Roofs',
    dims: { w: [3, 32, 8], d: [3, 32, 7] }, fixed: { h: 2 },
    gen(p, s, put) { for (let z = 0; z < s.d; z++) for (let x = 0; x < s.w; x++) { put(x, 0, z, p.mat); if (ring(x, z, s.w, s.d)) put(x, 1, z, p.mat); } },
  },
  dome: {
    label: 'Dome', tip: 'A round dome, like the Pantheon in Rome.', group: 'Roofs',
    dims: { w: [3, 25, 9] }, lock: true, heightFrom: 'dome',
    gen(p, s, put) {
      const r = s.w / 2;
      for (let y = 0; y < s.h; y++) for (let z = 0; z < s.w; z++) for (let x = 0; x < s.w; x++) {
        const dd = Math.hypot(x + 0.5 - r, y + 0.5, z + 0.5 - r);
        if (dd <= r && dd > r - 1.25) put(x, y, z, p.mat);
      }
    },
  },
  pyramid: {
    label: 'Pyramid', tip: 'A solid pyramid, like Giza. Make it as big as you like.', group: 'Wonders',
    dims: { w: [3, 31, 15], d: [3, 31, 15] }, heightFrom: 'hip',
    gen(p, s, put) { for (let k = 0; 2 * k < Math.min(s.w, s.d); k++) for (let z = k; z < s.d - k; z++) for (let x = k; x < s.w - k; x++) put(x, k, z, p.mat); },
  },
  ziggurat: {
    label: 'Ziggurat', tip: 'A stepped temple-mountain with a stair up the front, like Babylon and Ur.', group: 'Wonders',
    dims: { w: [7, 31, 17], d: [7, 31, 15], h: [2, 6, 3] }, heightFrom: 'zig',
    gen(p, s, put) {
      // The stepped mass sits behind a long stair that climbs up the front to the shrine on top.
      const step = s.zigStep, tiers = s.zigTiers, top = tiers * step, S = top, md = s.d - S;
      for (let t = 0; t < tiers; t++) for (let y = 0; y < step; y++) {
        const yy = t * step + y, k = t * 2;
        for (let z = k; z < md - k; z++) for (let x = k; x < s.w - k; x++) put(x, yy, S + z, p.mat);
      }
      const mid = Math.floor(s.w / 2);
      for (let z = 0; z < S + 2 * (tiers - 1); z++) for (let x = mid - 1; x <= mid + 1; x++) for (let y = 0; y <= Math.min(z, top - 1); y++) put(x, y, z, p.mat);
      // A little shrine on top.
      const k = 2 * (tiers - 1), z0 = S + k + 1, z1 = S + md - k - 2;
      for (let z = z0; z <= z1; z++) for (let x = k + 1; x < s.w - k - 1; x++) if (x === k + 1 || x === s.w - k - 2 || z === z0 || z === z1) for (let y = top; y < top + 2; y++) if (!(z === z0 && x === mid)) put(x, y, z, 43);
    },
  },
  arch: {
    label: 'Arch', tip: 'Drag onto a wall to cut a rounded opening.', group: 'Openings', cut: true,
    dims: { w: [3, 9, 3], h: [2, 8, 3] }, fixed: { d: 1 },
    gen(p, s, put) { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { if (y === s.h - 1 && (x === 0 || x === s.w - 1) && s.w > 2) continue; put(x, y, 0, 0); } },
  },
  door: {
    label: 'Doorway', tip: 'Drag onto a wall to make a doorway.', group: 'Openings', cut: true,
    dims: { w: [1, 3, 1], h: [2, 4, 2] }, fixed: { d: 1 },
    gen(p, s, put) { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) put(x, y, 0, 0); },
  },
  window: {
    label: 'Window', tip: 'Drag onto a wall to make a window.', group: 'Openings', cut: true, noSnap: true,
    dims: { w: [1, 6, 1], h: [1, 4, 1] }, fixed: { d: 1 },
    gen(p, s, put) { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) put(x, y, 0, 0); },
  },
  block: {
    label: 'One block', tip: 'A single block, for small details.', group: 'Details',
    dims: {}, fixed: { w: 1, d: 1, h: 1 },
    gen(p, s, put) { put(0, 0, 0, p.mat); },
  },
  fence: {
    label: 'Fence', tip: 'A wooden fence.', group: 'Details', noMat: true,
    dims: { w: [1, 32, 5] }, fixed: { d: 1, h: 1 },
    gen(p, s, put) { for (let x = 0; x < s.w; x++) put(x, 0, 0, 34); },
  },
  lamp: {
    label: 'Oil lamp', tip: 'A clay oil lamp that glows at night.', group: 'Details', noMat: true,
    dims: {}, fixed: { w: 1, d: 1, h: 1 },
    gen(p, s, put) { put(0, 0, 0, 46); },
  },
  torch: {
    label: 'Torch', tip: 'A torch on a stand.', group: 'Details', noMat: true,
    dims: {}, fixed: { w: 1, d: 1, h: 1 },
    gen(p, s, put) { put(0, 0, 0, 56); },
  },
};
const GROUPS = ['Walls', 'Floors', 'Columns & towers', 'Roofs', 'Wonders', 'Openings', 'Details'];

// Simple line pictures for the parts.
const ICON = {
  room: '<path d="M4 18V9l8-4 8 4v9z M10 18v-5h4v5"/>',
  wall: '<path d="M3 17h18M3 13h18M3 9h18M3 5h18M8 5v4M15 9v4M8 13v4"/>',
  cityWall: '<path d="M3 20V8h3v2h3V8h3v2h3V8h3v2h3V8v12z"/>',
  floor: '<path d="M2 15l10-5 10 5-10 5z"/>',
  steps: '<path d="M2 19h20M4 19v-3h16v3M6 16v-3h12v3"/>',
  stairs: '<path d="M3 20h4v-4h4v-4h4V8h4V4"/>',
  column: '<path d="M8 4h8M9 4v16M15 4v16M7 20h10M12 4v16"/>',
  colonnade: '<path d="M3 5h18M3 20h18M5 5v15M10 5v15M14 5v15M19 5v15"/>',
  tower: '<path d="M7 21V7h10v14M6 7V4h2v2h2V4h4v2h2V4h2v3 M11 21v-4h2v4"/>',
  obelisk: '<path d="M10 21l1-15 1-2 1 2 1 15z M8 21h8"/>',
  gable: '<path d="M2 16l10-9 10 9 M5 14v6h14v-6"/>',
  hip: '<path d="M2 17l10-11 10 11z M12 6v11"/>',
  flat: '<path d="M3 9h18v3H3z M5 12v8M19 12v8M3 7v2M21 7v2"/>',
  dome: '<path d="M3 18a9 9 0 0 1 18 0z M12 9V5"/>',
  pyramid: '<path d="M2 20L12 4l10 16z M12 4v16"/>',
  ziggurat: '<path d="M2 20h20v-4H2z M5 16v-4h14v4 M8 12V8h8v4 M11 20V8h2v12"/>',
  arch: '<path d="M4 20V10a8 8 0 0 1 16 0v10 M8 20v-9a4 4 0 0 1 8 0v9"/>',
  door: '<path d="M7 21V4h10v17 M14 13h1"/>',
  window: '<path d="M5 5h14v14H5z M12 5v14M5 12h14"/>',
  block: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M12 12l8-4.5M12 12L4 7.5M12 12v9"/>',
  fence: '<path d="M5 20V6l1-2 1 2v14M17 20V6l1-2 1 2v14M3 10h18M3 15h18"/>',
  lamp: '<path d="M5 15h12l3-3H8z M11 12c0-3 2-4 1-7 2 2 2 4 1 7"/>',
  torch: '<path d="M11 21l1-11 1 11z M12 10c-2-2-1-5 0-7 1 2 3 4 0 7"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ''}</svg>`;

/// A part's real size (some heights come from other sizes, like a roof's from how wide it is).
export function partSize(p) {
  const spec = PARTS[p.type];
  const s = { w: 1, d: 1, h: 1, ...spec.fixed };
  for (const [k, [, , def]] of Object.entries(spec.dims)) s[k] = p[k] ?? def;
  if (spec.lock) s.d = s.w;
  if (spec.heightFrom === 'd') s.h = s.d;
  else if (spec.heightFrom === 'gable') s.h = Math.ceil(s.w / 2);
  else if (spec.heightFrom === 'hip') s.h = Math.ceil(Math.min(s.w, s.d) / 2);
  else if (spec.heightFrom === 'dome') s.h = Math.ceil(s.w / 2);
  else if (spec.heightFrom === 'zig') {
    s.zigStep = p.h ?? spec.dims.h[2];
    s.zigTiers = Math.max(1, Math.floor((Math.min(s.w, s.d) - 1) / 4));
    s.h = s.zigTiers * s.zigStep + 2;
    s.d += s.zigTiers * s.zigStep;      // the stair in front
  }
  return s;
}
/// Width and depth on the ground after turning.
function footprint(p) { const s = partSize(p); return p.rot % 2 ? [s.d, s.w, s.h] : [s.w, s.d, s.h]; }
function drawPart(p, put) {
  const s = partSize(p), spec = PARTS[p.type];
  spec.gen(p, s, (lx, ly, lz, b) => {
    let X, Z;
    switch (p.rot) { case 1: X = s.d - 1 - lz; Z = lx; break; case 2: X = s.w - 1 - lx; Z = s.d - 1 - lz; break; case 3: X = lz; Z = s.w - 1 - lx; break; default: X = lx; Z = lz; }
    put(p.x + X, p.y + ly, p.z + Z, b);
  });
}
/// All the parts as blocks: solid parts first, then the holes. `owner` says which part made each block.
export function compileParts(parts) {
  const cells = new Uint8Array(GX * GY * GZ), owner = new Int16Array(GX * GY * GZ).fill(-1);
  const order = parts.map((p, i) => i).sort((a, b) => (PARTS[parts[a].type].cut ? 1 : 0) - (PARTS[parts[b].type].cut ? 1 : 0));
  for (const i of order) {
    drawPart(parts[i], (x, y, z, b) => {
      if (x < 0 || y < 0 || z < 0 || x >= GX || y >= GY || z >= GZ) return;
      const k = (y * GZ + z) * GX + x;
      if (b === 0 && !cells[k]) return;
      cells[k] = b; owner[k] = b ? i : -1;
    });
  }
  return { cells, owner };
}

// ---------- ready-made examples to start from ----------
const EXAMPLES = {
  house: { name: 'Little house', parts: [
    { type: 'floor', x: 11, y: 0, z: 11, rot: 0, mat: 23, w: 9, d: 8 },
    { type: 'room', x: 12, y: 1, z: 12, rot: 0, mat: 53, w: 7, d: 6, h: 4 },
    { type: 'gable', x: 11, y: 5, z: 11, rot: 1, mat: 41, w: 8, d: 9 },
    { type: 'window', x: 13, y: 2, z: 12, rot: 0, w: 1, h: 1 }, { type: 'window', x: 17, y: 2, z: 12, rot: 0, w: 1, h: 1 },
    { type: 'window', x: 12, y: 2, z: 14, rot: 1, w: 2, h: 1 }, { type: 'window', x: 18, y: 2, z: 14, rot: 1, w: 2, h: 1 },
    { type: 'lamp', x: 13, y: 1, z: 11, rot: 0 }, { type: 'lamp', x: 17, y: 1, z: 11, rot: 0 },
  ] },
  temple: { name: 'Greek temple', parts: [
    { type: 'steps', x: 8, y: 0, z: 10, rot: 0, mat: 42, w: 17, d: 13, h: 3 },
    { type: 'colonnade', x: 10, y: 3, z: 12, rot: 0, mat: 42, w: 13, h: 6 },
    { type: 'colonnade', x: 10, y: 3, z: 20, rot: 0, mat: 42, w: 13, h: 6 },
    { type: 'colonnade', x: 10, y: 3, z: 12, rot: 1, mat: 42, w: 9, h: 6 },
    { type: 'colonnade', x: 22, y: 3, z: 12, rot: 1, mat: 42, w: 9, h: 6 },
    { type: 'room', x: 13, y: 3, z: 14, rot: 0, mat: 52, w: 7, d: 5, h: 6 },
    { type: 'floor', x: 10, y: 9, z: 12, rot: 0, mat: 42, w: 13, d: 9 },
    { type: 'gable', x: 10, y: 10, z: 12, rot: 1, mat: 41, w: 9, d: 13 },
  ] },
  tower: { name: 'Castle', parts: [
    { type: 'cityWall', x: 9, y: 0, z: 8, rot: 0, mat: 55, w: 15, h: 6 },
    { type: 'cityWall', x: 9, y: 0, z: 21, rot: 0, mat: 55, w: 15, h: 6 },
    { type: 'cityWall', x: 8, y: 0, z: 9, rot: 1, mat: 55, w: 13, h: 6 },
    { type: 'cityWall', x: 21, y: 0, z: 9, rot: 1, mat: 55, w: 13, h: 6 },
    { type: 'tower', x: 6, y: 0, z: 6, rot: 0, mat: 22, w: 5, h: 9 }, { type: 'tower', x: 21, y: 0, z: 6, rot: 0, mat: 22, w: 5, h: 9 },
    { type: 'tower', x: 6, y: 0, z: 20, rot: 0, mat: 22, w: 5, h: 9 }, { type: 'tower', x: 21, y: 0, z: 20, rot: 0, mat: 22, w: 5, h: 9 },
    { type: 'arch', x: 15, y: 0, z: 8, rot: 0, w: 3, h: 4 }, { type: 'arch', x: 15, y: 0, z: 9, rot: 0, w: 3, h: 4 }, { type: 'arch', x: 15, y: 0, z: 10, rot: 0, w: 3, h: 4 },
  ] },
  pyramid: { name: 'Pyramid', parts: [
    { type: 'pyramid', x: 4, y: 0, z: 4, rot: 0, mat: 52, w: 23, d: 23 },
    { type: 'block', x: 15, y: 11, z: 15, rot: 0, mat: 45 },
    { type: 'obelisk', x: 15, y: 0, z: 1, rot: 0, mat: 21, h: 7 },
  ] },
  ziggurat: { name: 'Ziggurat', parts: [{ type: 'ziggurat', x: 6, y: 0, z: 1, rot: 0, mat: 53, w: 21, d: 17, h: 3 }] },
};

// ---------- the designer window ----------
export function createDesigner(env) {
  // env: { mats, ghostTex, iconOf(itemId) → url, itemOf(block) → itemId, count(itemId), free(), onSave(design, index), onClose(), rle, message }
  const root = document.getElementById('designer');
  root.innerHTML = `
    <div class="dz panel">
      <div class="dz-head">
        <h2>Design a building</h2>
        <input id="dzName" maxlength="28" autocomplete="off" aria-label="Name of your building">
        <div class="dz-headbtns">
          <select id="dzExample" aria-label="Start from an example"><option value="">Start from…</option><option value="house">A little house</option><option value="temple">A Greek temple</option><option value="tower">A castle</option><option value="pyramid">A pyramid</option><option value="ziggurat">A ziggurat</option><option value="clear">An empty plot</option></select>
          <button id="dzUndo" title="Undo (Ctrl+Z)">Undo</button>
          <button id="dzSave" class="go">Save design</button>
          <button id="dzClose">Close</button>
        </div>
      </div>
      <div class="dz-body">
        <div class="dz-left">
          <div class="dz-sec">Material</div>
          <div id="dzMats" class="dz-mats"></div>
          <div class="dz-sec">Parts <small>drag onto the ground</small></div>
          <div id="dzParts"></div>
        </div>
        <div class="dz-mid"><canvas id="dzCanvas" aria-label="Your building in 3D"></canvas>
          <div class="dz-hint" id="dzHint"></div>
          <div class="dz-zoom"><button id="dzIn" aria-label="Zoom in">+</button><button id="dzOut" aria-label="Zoom out">−</button><button id="dzTurnView" aria-label="Turn the view">⟳</button></div>
        </div>
        <div class="dz-right">
          <div id="dzInspect"></div>
          <div class="dz-sec">Blocks needed</div>
          <div id="dzCost" class="needs dz-cost"></div>
        </div>
      </div>
    </div>`;
  const $ = (id) => document.getElementById(id);
  const canvas = $('dzCanvas');

  // 3D view.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9cc4ee);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x7a6a55, 1.5));
  const sunL = new THREE.DirectionalLight(0xfff2dd, 2.2); sunL.position.set(30, 50, 20); scene.add(sunL);
  // The building plot: grass with a grid, and dirt sides.
  const plot = new THREE.Mesh(new THREE.BoxGeometry(GX, 1, GZ), [
    new THREE.MeshLambertMaterial({ color: 0x7a5a3a }), new THREE.MeshLambertMaterial({ color: 0x7a5a3a }),
    new THREE.MeshLambertMaterial({ color: 0x6aa04a }), new THREE.MeshLambertMaterial({ color: 0x5a4028 }),
    new THREE.MeshLambertMaterial({ color: 0x7a5a3a }), new THREE.MeshLambertMaterial({ color: 0x7a5a3a })]);
  plot.position.set(GX / 2, -0.5, GZ / 2); scene.add(plot);
  const grid = new THREE.GridHelper(GX, GX, 0x2f5a22, 0x4f8a3a); grid.position.set(GX / 2, 0.01, GZ / 2); grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);
  const building = new THREE.Group(); scene.add(building);
  const ghostMat = new THREE.MeshLambertMaterial({ map: env.ghostTex, transparent: true, opacity: 0.55, depthWrite: false, alphaTest: 0.1 });
  const ghost = new THREE.Group(); scene.add(ghost);
  const cutMat = new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.32, depthWrite: false });
  const cutGeo = new THREE.BoxGeometry(1, 1, 1);
  const cutGroup = new THREE.Group(); scene.add(cutGroup);
  const selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffd34d, depthTest: false, transparent: true }));
  selBox.renderOrder = 10; selBox.visible = false; scene.add(selBox);
  const orbit = { theta: 0.75, phi: 0.62, r: 46, target: new THREE.Vector3(GX / 2, 3, GZ / 2) };

  // State.
  let parts = [], sel = -1, mat = 55, editing = -1, open = false, compiled = null, undo = [], drag = null, armed = null, raf = 0, dirty = true;
  const pointers = new Map();

  // Palettes.
  const partsBox = $('dzParts');
  for (const g of GROUPS) {
    const sec = document.createElement('div'); sec.className = 'dz-group';
    sec.innerHTML = `<div class="dz-gname">${g}</div>`;
    const row = document.createElement('div'); row.className = 'dz-row';
    for (const [k, spec] of Object.entries(PARTS)) {
      if (spec.group !== g) continue;
      const b = document.createElement('button');
      b.className = 'dz-part' + (spec.cut ? ' cut' : ''); b.dataset.type = k; b.title = spec.tip;
      b.innerHTML = svg(k) + `<span>${spec.label}</span>`;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = { kind: 'new', type: k, sx: e.clientX, sy: e.clientY, moved: false, id: e.pointerId }; });
      row.appendChild(b);
    }
    sec.appendChild(row); partsBox.appendChild(sec);
  }
  const matsBox = $('dzMats');
  function renderMats() {
    matsBox.innerHTML = '';
    for (const b of MATERIALS) {
      const id = env.itemOf(b), el = document.createElement('button');
      el.className = 'dz-mat' + (b === mat ? ' on' : '');
      el.title = BLOCKS[b].name; el.setAttribute('aria-label', BLOCKS[b].name);
      el.innerHTML = `<img src="${env.iconOf(id)}" width="28" height="28" alt="">`;
      el.addEventListener('click', () => {
        mat = b;
        if (sel >= 0 && !PARTS[parts[sel].type].cut && !PARTS[parts[sel].type].noMat) { snapshot(); parts[sel].mat = b; rebuild(); }
        renderMats(); renderInspector();
      });
      matsBox.appendChild(el);
    }
  }

  // ---------- building the 3D picture ----------
  function rebuild() {
    compiled = compileParts(parts);
    for (const m of building.children) m.geometry.dispose();
    building.clear();
    const c = compiled.cells;
    const mini = { n: GX, get(x, y, z) { return x < 0 || z < 0 || x >= GX || z >= GZ || y < 0 || y >= GY ? 0 : c[(y * GZ + z) * GX + x]; } };
    for (let cz = 0; cz * 16 < GZ; cz++) for (let cx = 0; cx * 16 < GX; cx++) {
      const g = meshChunk(mini, cx, cz, mini);
      if (g.solid) building.add(new THREE.Mesh(g.solid, env.mats.solid));
      if (g.cut) building.add(new THREE.Mesh(g.cut, env.mats.cut));
    }
    // Holes show as see-through red boxes so you can find and move them.
    cutGroup.clear();
    parts.forEach((p, i) => {
      if (!PARTS[p.type].cut) return;
      const [fw, fd, fh] = footprint(p);
      const m = new THREE.Mesh(cutGeo, cutMat); m.scale.set(fw + 0.04, fh + 0.04, fd + 0.04); m.position.set(p.x + fw / 2, p.y + fh / 2, p.z + fd / 2);
      m.userData.part = i; cutGroup.add(m);
    });
    renderCost(); renderSel(); dirty = true;
  }
  function renderSel() {
    if (sel < 0 || !parts[sel]) { selBox.visible = false; return; }
    const p = parts[sel], [fw, fd, fh] = footprint(p);
    selBox.visible = true; selBox.scale.set(fw + 0.08, fh + 0.08, fd + 0.08); selBox.position.set(p.x + fw / 2, p.y + fh / 2, p.z + fd / 2);
    dirty = true;
  }
  function showGhost(p) {
    for (const m of ghost.children) if (m.geometry !== cutGeo) m.geometry.dispose();
    ghost.clear();
    if (!p) { dirty = true; return; }
    if (PARTS[p.type].cut) {
      const [fw, fd, fh] = footprint(p);
      const m = new THREE.Mesh(cutGeo, cutMat); m.scale.set(fw + 0.1, fh + 0.1, fd + 0.1); m.position.set(p.x + fw / 2, p.y + fh / 2, p.z + fd / 2); ghost.add(m);
    } else {
      const c = new Uint8Array(GX * GY * GZ);
      drawPart(p, (x, y, z, b) => { if (x >= 0 && y >= 0 && z >= 0 && x < GX && y < GY && z < GZ) c[(y * GZ + z) * GX + x] = b; });
      const mini = { n: GX, get(x, y, z) { return x < 0 || z < 0 || x >= GX || z >= GZ || y < 0 || y >= GY ? 0 : c[(y * GZ + z) * GX + x]; } };
      for (let cz = 0; cz * 16 < GZ; cz++) for (let cx = 0; cx * 16 < GX; cx++) {
        const g = meshChunk(mini, cx, cz, mini);
        for (const geo of [g.solid, g.cut]) if (geo) ghost.add(new THREE.Mesh(geo, ghostMat));
      }
    }
    dirty = true;
  }

  // ---------- what's under the pointer ----------
  const ray = new THREE.Raycaster();
  function setRay(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), cam);
    return ray.ray;
  }
  /// Steps through the blocks along the ray; returns the first block hit and which face, or a spot on the ground.
  function pick(cx, cy) {
    const R = setRay(cx, cy);
    const box = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(GX, GY, GZ));
    const entry = R.intersectBox(box, new THREE.Vector3());
    let block = null;
    if (entry && compiled) {
      const o = R.origin, d = R.direction;
      let t = o.distanceTo(entry) + 1e-3;
      const p = o.clone().addScaledVector(d, t);
      let x = Math.floor(p.x), y = Math.floor(p.y), z = Math.floor(p.z);
      const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
      const tdx = Math.abs(1 / d.x), tdy = Math.abs(1 / d.y), tdz = Math.abs(1 / d.z);
      let tx = t + (sx > 0 ? x + 1 - p.x : p.x - x) * tdx, ty = t + (sy > 0 ? y + 1 - p.y : p.y - y) * tdy, tz = t + (sz > 0 ? z + 1 - p.z : p.z - z) * tdz;
      // Which face we came in through.
      const e = [Math.abs(entry.x) < 0.01 ? -1 : Math.abs(entry.x - GX) < 0.01 ? 1 : 0, Math.abs(entry.y - GY) < 0.01 ? 1 : 0, Math.abs(entry.z) < 0.01 ? -1 : Math.abs(entry.z - GZ) < 0.01 ? 1 : 0];
      let n = e[1] ? [0, 1, 0] : e[0] ? [e[0], 0, 0] : e[2] ? [0, 0, e[2]] : [0, 1, 0];
      for (let k = 0; k < 200; k++) {
        if (x < 0 || y < 0 || z < 0 || x >= GX || y >= GY || z >= GZ) break;
        const b = compiled.cells[(y * GZ + z) * GX + x];
        if (b) { block = { cell: [x, y, z], n, t, owner: compiled.owner[(y * GZ + z) * GX + x] }; break; }
        if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; n = [-sx, 0, 0]; }
        else if (ty < tz) { y += sy; t = ty; ty += tdy; n = [0, -sy, 0]; }
        else { z += sz; t = tz; tz += tdz; n = [0, 0, -sz]; }
      }
    }
    // Holes (see-through boxes) can be picked too.
    let hole = null;
    const hits = ray.intersectObjects(cutGroup.children, false);
    if (hits.length && (!block || hits[0].distance < block.t + 0.5)) hole = hits[0].object.userData.part;
    let ground = null;
    if (R.direction.y < 0) {
      const t = -R.origin.y / R.direction.y, g = R.origin.clone().addScaledVector(R.direction, t);
      if (g.x >= 0 && g.z >= 0 && g.x < GX && g.z < GZ) ground = [Math.floor(g.x), 0, Math.floor(g.z), g];
    }
    return { block, hole, ground };
  }
  /// Where a new part would go if dropped at the pointer.
  function dropSpot(type, cx, cy, base) {
    const spec = PARTS[type], hit = pick(cx, cy);
    const p = { type, rot: base?.rot ?? 0, mat: spec.noMat ? undefined : mat, x: 0, y: 0, z: 0 };
    for (const [k, [, , def]] of Object.entries(spec.dims)) p[k] = base?.[k] ?? def;
    if (spec.cut) {
      if (!hit.block) return null;
      const [x, y, z] = hit.block.cell, n = hit.block.n;
      if (n[1] !== 0) return null;               // Holes go into the side of a wall.
      p.rot = n[0] !== 0 ? 1 : 0;
      const s = partSize(p);
      if (p.rot === 0) { p.x = x - Math.floor(s.w / 2); p.z = n[2] > 0 ? z - (s.d - 1) : z; }
      else { p.z = z - Math.floor(s.w / 2); p.x = n[0] > 0 ? x - (s.d - 1) : x; }
      // Doors and arches start at the bottom of the wall.
      let yy = y;
      if (!spec.noSnap) while (yy > 0 && compiled.cells[((yy - 1) * GZ + z) * GX + x] && !(compiled.cells[((yy - 1) * GZ + z + n[2]) * GX + x + n[0]])) yy--;
      p.y = yy;
      return clampPart(p);
    }
    let c;
    // Roofs, domes and floors dropped on top of a room (or any part) fit themselves to it.
    const COVER = { gable: 2, hip: 2, flat: 0, floor: 0, dome: 0 };
    let under = -1;
    if (!base && COVER[type] !== undefined) {
      if (hit.block && hit.block.owner >= 0 && (hit.block.n[1] === 1 || type !== 'floor')) under = hit.block.owner;
      else if (!hit.block && hit.ground && type !== 'floor') {
        // Pointing at the ground inside a room: the roof goes on that room.
        let best = -1;
        parts.forEach((q, i) => { if (PARTS[q.type].cut) return; const [qw, qd, qh] = footprint(q); if (hit.ground[0] >= q.x && hit.ground[0] < q.x + qw && hit.ground[2] >= q.z && hit.ground[2] < q.z + qd && (best < 0 || q.y + qh > parts[best].y + footprint(parts[best])[2])) best = i; });
        under = best;
      }
    }
    if (under >= 0 && parts[under] && !PARTS[parts[under].type].cut) {
      const o = parts[under], [ow, od, oh] = footprint(o), extra = COVER[type], dims = spec.dims;
      const lim = (k, v) => Math.max(dims[k][0], Math.min(dims[k][1], v));
      if (type === 'gable') { if (ow >= od) { p.rot = 1; p.w = lim('w', od + extra); p.d = lim('d', ow + extra); } else { p.rot = 0; p.w = lim('w', ow + extra); p.d = lim('d', od + extra); } }
      else if (type === 'dome') p.w = lim('w', Math.min(ow, od));
      else { p.w = lim('w', ow + extra); p.d = lim('d', od + extra); }
      const [fw, fd] = footprint(p);
      p.x = Math.round(o.x + ow / 2 - fw / 2); p.z = Math.round(o.z + od / 2 - fd / 2); p.y = o.y + oh;
      return clampPart(p);
    }
    if (hit.block) { const [x, y, z] = hit.block.cell, n = hit.block.n; c = [x + n[0], y + n[1], z + n[2]]; if (n[1] < 0) return null; }
    else if (hit.ground) c = hit.ground;
    else return null;
    const [fw, fd] = footprint(p);
    p.x = c[0] - Math.floor(fw / 2); p.z = c[2] - Math.floor(fd / 2); p.y = c[1];
    return clampPart(p);
  }
  function clampPart(p) {
    const [fw, fd, fh] = footprint(p);
    p.x = Math.max(0, Math.min(GX - fw, p.x)); p.z = Math.max(0, Math.min(GZ - fd, p.z)); p.y = Math.max(0, Math.min(GY - fh, p.y));
    return p;
  }

  // ---------- pointer: drag parts in, move them, orbit the view ----------
  function overCanvas(e) { const r = canvas.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) { drag = { kind: 'pinch', d: pinchDist(), r: orbit.r }; return; }
    if (armed) {
      const p = dropSpot(armed, e.clientX, e.clientY);
      if (p) addPart(p); else env.message(PARTS[armed].cut ? 'Point at the side of a wall.' : 'Point at the ground or a block.');
      armed = null; markArmed(); showGhost(null); hint();
      return;
    }
    const hit = pick(e.clientX, e.clientY);
    const who = hit.hole ?? (hit.block ? hit.block.owner : -1);
    if (e.button === 0 && who !== undefined && who >= 0) {
      select(who);
      const p = parts[who];
      const pt = planeHit(e.clientX, e.clientY, p.y);
      drag = { kind: 'move', grab: pt ? [pt.x - p.x, pt.z - p.z] : [0, 0], start: JSON.stringify(parts), moved: false };
      return;
    }
    if (e.button === 0 && who === -1 && hit.block === null) select(-1);
    drag = { kind: 'orbit', x: e.clientX, y: e.clientY, moved: false };
  });
  function planeHit(cx, cy, y) {
    const R = setRay(cx, cy);
    if (Math.abs(R.direction.y) < 1e-4) return null;
    const t = (y - R.origin.y) / R.direction.y;
    return t > 0 ? R.origin.clone().addScaledVector(R.direction, t) : null;
  }
  function pinchDist() { const v = [...pointers.values()]; return Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); }
  addEventListener('pointermove', (e) => {
    if (!open) return;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (armed && !drag) { const p = overCanvas(e) ? dropSpot(armed, e.clientX, e.clientY) : null; showGhost(p); return; }
    if (!drag) return;
    if (drag.kind === 'new') {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
      const p = drag.moved && overCanvas(e) ? dropSpot(drag.type, e.clientX, e.clientY) : null;
      drag.spot = p; showGhost(p);
    } else if (drag.kind === 'move') {
      const p = parts[sel]; if (!p) return;
      const pt = planeHit(e.clientX, e.clientY, p.y);
      if (!pt) return;
      const nx = Math.round(pt.x - drag.grab[0]), nz = Math.round(pt.z - drag.grab[1]);
      if (nx !== p.x || nz !== p.z) { if (!drag.moved) { pushUndo(drag.start); drag.moved = true; } p.x = nx; p.z = nz; clampPart(p); rebuild(); }
    } else if (drag.kind === 'orbit') {
      orbit.theta -= (e.clientX - drag.x) * 0.008;
      orbit.phi = Math.max(0.12, Math.min(1.45, orbit.phi + (e.clientY - drag.y) * 0.006));
      drag.x = e.clientX; drag.y = e.clientY; drag.moved = true; dirty = true;
    } else if (drag.kind === 'pinch' && pointers.size === 2) {
      orbit.r = Math.max(14, Math.min(90, drag.r * drag.d / Math.max(pinchDist(), 1))); dirty = true;
    }
  });
  addEventListener('pointerup', (e) => {
    pointers.delete(e.pointerId);
    if (!open || !drag) return;
    if (drag.kind === 'new') {
      if (!drag.moved) { armed = armed === drag.type ? null : drag.type; markArmed(); hint(); }
      else if (drag.spot) addPart(drag.spot);
      showGhost(null);
    }
    drag = null;
  });
  addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); if (drag && drag.kind === 'new') showGhost(null); drag = null; });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); orbit.r = Math.max(14, Math.min(90, orbit.r * (1 + Math.sign(e.deltaY) * 0.1))); dirty = true; }, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  $('dzIn').addEventListener('click', () => { orbit.r = Math.max(14, orbit.r * 0.85); dirty = true; });
  $('dzOut').addEventListener('click', () => { orbit.r = Math.min(90, orbit.r * 1.18); dirty = true; });
  $('dzTurnView').addEventListener('click', () => { orbit.theta += Math.PI / 4; dirty = true; });
  function markArmed() { for (const b of partsBox.querySelectorAll('.dz-part')) b.classList.toggle('armed', b.dataset.type === armed); }

  // ---------- changing parts ----------
  function snapshot() { pushUndo(JSON.stringify(parts)); }
  function pushUndo(s) { undo.push(s); if (undo.length > 80) undo.shift(); }
  function addPart(p) { snapshot(); parts.push(p); sel = parts.length - 1; rebuild(); renderInspector(); hint(); }
  function select(i) { sel = i; renderSel(); renderInspector(); hint(); }
  function removeSel() { if (sel < 0) return; snapshot(); parts.splice(sel, 1); sel = -1; rebuild(); renderInspector(); hint(); }
  function turnSel() {
    if (sel < 0) return;
    snapshot();
    const p = parts[sel], [fw, fd] = footprint(p), cx = p.x + fw / 2, cz = p.z + fd / 2;
    p.rot = (p.rot + 1) % 4;
    const [nw, nd] = footprint(p);
    p.x = Math.round(cx - nw / 2); p.z = Math.round(cz - nd / 2); clampPart(p);
    rebuild(); renderInspector();
  }
  function nudge(dx, dy, dz) {
    if (sel < 0) return;
    snapshot();
    const p = parts[sel]; p.x += dx; p.y += dy; p.z += dz; clampPart(p); rebuild(); renderInspector();
  }
  function copySel() {
    if (sel < 0) return;
    const p = { ...parts[sel] }, [fw, fd] = footprint(p);
    if (p.x + fw * 2 + 1 <= GX) p.x += fw + 1; else if (p.z + fd * 2 + 1 <= GZ) p.z += fd + 1; else p.x = Math.max(0, p.x - fw - 1);
    addPart(clampPart(p));
  }
  $('dzUndo').addEventListener('click', () => doUndo());
  function doUndo() { if (!undo.length) return; parts = JSON.parse(undo.pop()); if (sel >= parts.length) sel = -1; rebuild(); renderInspector(); hint(); }

  const DIM_NAMES = { w: 'Width', d: 'Depth', h: 'Height' };
  function dimName(type, k) {
    if (k === 'w' && ['wall', 'cityWall', 'fence', 'colonnade'].includes(type)) return 'Length';
    if (k === 'w' && ['tower', 'dome'].includes(type)) return 'Across';
    if (k === 'd' && type === 'stairs') return 'Steps';
    if (k === 'h' && type === 'ziggurat') return 'Step height';
    return DIM_NAMES[k];
  }
  function renderInspector() {
    const box = $('dzInspect');
    if (sel < 0 || !parts[sel]) {
      box.innerHTML = `<div class="dz-sec">How to design</div><p class="dz-help">Drag a part from the left onto the green plot. Click a part to change it: pick a material, stretch it, turn it, or drag it somewhere else. Drag a doorway, window or arch onto a wall to cut a hole. Drag the empty sky to look around.</p>`;
      return;
    }
    const p = parts[sel], spec = PARTS[p.type];
    let html = `<div class="dz-sec">${spec.label}</div><p class="dz-help">${spec.tip}</p>`;
    for (const k of Object.keys(spec.dims)) {
      const [lo, hi] = spec.dims[k];
      const v = p[k] ?? spec.dims[k][2];
      html += `<label class="dz-dim"><span>${dimName(p.type, k)}</span><button data-dim="${k}" data-step="-1" aria-label="Smaller">−</button><input type="range" min="${lo}" max="${hi}" value="${v}" data-dim="${k}"><button data-dim="${k}" data-step="1" aria-label="Bigger">+</button><b>${v}</b></label>`;
    }
    if (!spec.cut && !spec.noMat) html += `<div class="dz-matnow">${BLOCKS[p.mat] ? `<img src="${env.iconOf(env.itemOf(p.mat))}" width="20" height="20" alt=""> ${BLOCKS[p.mat].name}` : ''} <small>(pick a material on the left to change it)</small></div>`;
    html += `<div class="dz-btns"><button data-act="turn">Turn</button><button data-act="up">Up</button><button data-act="down">Down</button><button data-act="copy">Copy</button><button data-act="del" class="del">Delete</button></div>`;
    html += `<small class="dz-keys">Keys: R turn · arrows move · PgUp/PgDn up/down · Delete removes · Ctrl+Z undo</small>`;
    box.innerHTML = html;
    let undoTaken = false;
    for (const el of box.querySelectorAll('input[type=range]')) {
      el.addEventListener('pointerdown', () => { if (!undoTaken) { snapshot(); undoTaken = true; } });
      el.addEventListener('input', () => { setDim(el.dataset.dim, Number(el.value), false); el.nextElementSibling.nextElementSibling.textContent = el.value; });
      el.addEventListener('change', () => { undoTaken = false; renderInspector(); });
    }
    for (const el of box.querySelectorAll('button[data-dim]')) el.addEventListener('click', () => { snapshot(); const k = el.dataset.dim, p = parts[sel]; setDim(k, (p[k] ?? PARTS[p.type].dims[k][2]) + Number(el.dataset.step), true); });
    for (const el of box.querySelectorAll('button[data-act]')) el.addEventListener('click', () => {
      const a = el.dataset.act;
      if (a === 'turn') turnSel(); else if (a === 'up') nudge(0, 1, 0); else if (a === 'down') nudge(0, -1, 0); else if (a === 'copy') copySel(); else if (a === 'del') removeSel();
    });
  }
  function setDim(k, v, redraw) {
    const p = parts[sel], [lo, hi] = PARTS[p.type].dims[k];
    p[k] = Math.max(lo, Math.min(hi, v));
    clampPart(p); rebuild();
    if (redraw) renderInspector();
  }
  function renderCost() {
    const need = new Map();
    let total = 0;
    for (const b of compiled.cells) { if (!b) continue; total++; const id = env.itemOf(b); if (id) need.set(id, (need.get(id) || 0) + 1); }
    const free = env.free();
    $('dzCost').innerHTML = total ? [...need].sort((a, b) => b[1] - a[1]).map(([id, n]) => {
      const have = env.count(id), ok = free || have >= n;
      return `<span class="${ok ? 'ok' : 'no'}" title="${ITEM[id]?.name ?? id}"><img src="${env.iconOf(id)}" width="16" height="16" alt="">${free ? n : `${Math.min(have, n)}/${n}`} ${ITEM[id]?.name ?? id}</span>`;
    }).join('') + `<small class="dz-total">${total} blocks${free ? ' · free building is on' : ''}</small>` : '<small class="dz-total">Nothing yet</small>';
  }
  function hint() {
    const h = $('dzHint');
    if (armed) h.textContent = PARTS[armed].cut ? `Click the side of a wall to cut a ${PARTS[armed].label.toLowerCase()}.` : `Click the plot to put down: ${PARTS[armed].label}.`;
    else if (!parts.length) h.textContent = 'Drag a part onto the green plot, or start from an example.';
    else h.textContent = sel >= 0 ? 'Drag the part to move it. Drag the sky to look around.' : 'Click a part to change it. Drag the sky to look around.';
  }

  // Keys (only while the designer is open; typing in the name box still works).
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) { if (e.key === 'Escape') e.target.blur(); e.stopImmediatePropagation(); return; }
    e.stopImmediatePropagation();
    const k = e.key;
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); doUndo(); return; }
    if (k === 'Escape') { if (armed) { armed = null; markArmed(); showGhost(null); hint(); } else if (sel >= 0) select(-1); else close(); return; }
    // Up/Down (and Page Up/Down) scroll the parts list or the right-hand column: always when the pointer is over one of them,
    // and anywhere when no part is chosen (with a part chosen, the arrows move it).
    const vertical = k === 'ArrowUp' || k === 'ArrowDown', page = k === 'PageUp' || k === 'PageDown';
    if (vertical || (page && sel < 0)) {
      const under = document.elementFromPoint(pointerAt.x, pointerAt.y);
      const col = under && under.closest('.dz-left, .dz-right');
      if (col || sel < 0) { e.preventDefault(); scrollPanel(col || root.querySelector('.dz-left') || root, k === 'ArrowUp' || k === 'PageUp' ? -1 : 1, page); return; }
    }
    if (sel < 0) return;
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); removeSel(); }
    else if (k === 'r' || k === 'R') turnSel();
    else if (k === 'PageUp') { e.preventDefault(); nudge(0, 1, 0); }
    else if (k === 'PageDown') { e.preventDefault(); nudge(0, -1, 0); }
    else if (k.startsWith('Arrow')) {
      e.preventDefault();
      // Arrows move the part the way you're looking at it.
      const f = [-Math.sin(orbit.theta), -Math.cos(orbit.theta)], r = [Math.cos(orbit.theta), -Math.sin(orbit.theta)];
      const v = k === 'ArrowUp' ? f : k === 'ArrowDown' ? [-f[0], -f[1]] : k === 'ArrowRight' ? r : [-r[0], -r[1]];
      if (Math.abs(v[0]) > Math.abs(v[1])) nudge(Math.sign(v[0]), 0, 0); else nudge(0, 0, Math.sign(v[1]));
    }
  }, true);

  // Header buttons.
  $('dzExample').addEventListener('change', (e) => {
    const v = e.target.value; e.target.value = '';
    if (!v) return;
    snapshot();
    if (v === 'clear') { parts = []; } else { parts = JSON.parse(JSON.stringify(EXAMPLES[v].parts)); if ($('dzName').value.startsWith('My building')) $('dzName').value = EXAMPLES[v].name; }
    sel = -1; rebuild(); renderInspector(); hint();
  });
  $('dzClose').addEventListener('click', () => close());
  $('dzSave').addEventListener('click', () => {
    if (!compiled) return;
    const c = compiled.cells;
    let lo = [GX, GY, GZ], hi = [-1, -1, -1], count = 0;
    for (let y = 0; y < GY; y++) for (let z = 0; z < GZ; z++) for (let x = 0; x < GX; x++) {
      if (!c[(y * GZ + z) * GX + x]) continue;
      count++;
      lo = [Math.min(lo[0], x), Math.min(lo[1], y), Math.min(lo[2], z)]; hi = [Math.max(hi[0], x), Math.max(hi[1], y), Math.max(hi[2], z)];
    }
    if (!count) { env.message('Put some parts on the plot first.'); return; }
    // Keep the bottom of the design at the ground even if the lowest part was lifted.
    lo[1] = 0;
    const w = hi[0] - lo[0] + 1, h = hi[1] + 1, d = hi[2] - lo[2] + 1, out = new Uint8Array(w * h * d);
    for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) out[(y * d + z) * w + x] = c[(y * GZ + z + lo[2]) * GX + x + lo[0]];
    const name = $('dzName').value.trim() || 'My building';
    env.onSave({ name, w, h, d, cells: env.rle([...out]), count, parts: JSON.parse(JSON.stringify(parts)) }, editing);
    close(true);
  });

  // ---------- open, close, draw ----------
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); dirty = true;
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  function frame() {
    if (!open) return;
    raf = requestAnimationFrame(frame);
    if (!dirty) return;
    dirty = false;
    const o = orbit;
    cam.position.set(o.target.x + Math.sin(o.theta) * Math.cos(o.phi) * o.r, o.target.y + Math.sin(o.phi) * o.r, o.target.z + Math.cos(o.theta) * Math.cos(o.phi) * o.r);
    cam.lookAt(o.target);
    renderer.render(scene, cam);
  }
  function openDesigner(design, index) {
    editing = design && design.parts ? index : -1;
    parts = design && design.parts ? JSON.parse(JSON.stringify(design.parts)) : [];
    $('dzName').value = design && design.parts ? design.name : `My building ${index ?? ''}`.trim();
    sel = -1; undo = []; armed = null; drag = null; markArmed();
    root.hidden = false; open = true;
    renderMats(); rebuild(); renderInspector(); hint(); resize();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function close(saved) {
    if (!open) return;
    open = false; root.hidden = true; showGhost(null); cancelAnimationFrame(raf);
    env.onClose(saved);
  }
  return { open: openDesigner, close, isOpen: () => open, refreshCost: () => { if (open && compiled) renderCost(); }, debug: { dropSpot, pick: (x, y) => { const h = pick(x, y); return JSON.stringify({ b: h.block && { c: h.block.cell, n: h.block.n, o: h.block.owner }, hole: h.hole, g: h.ground && h.ground.slice(0, 3) }); }, parts: () => parts } };
}
