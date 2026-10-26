// Polis World (computer version): the game itself.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { H, WL, CS, T, BLOCKS, IS_CUBE, IS_SOLID, IS_CROSS, IS_CUT, GLOW, WATER, FALLING, IS_WATER, IS_WATERY, WATER_AMT, World, buildAtlas, tileUV, tileSheet, shared, blockMaterial, waterMaterial, meshChunk, makeSky, waterHeight } from './engine.js';
import { ITEM, SPEED, toolDamage, LOGS, RECIPES, Inventory } from './items.js';
import { createDesigner, scrollPanel } from './designer.js';
import { TALK, ORDERS } from './talk.js';
import { ROLES, REFUGEE_NAMES, WHY, LOOKS as REFUGEE_LOOKS } from './village.js';
import { createScenery } from './scenery.js';
import { createShips, SHIP_TYPES } from './ships.js';
import { WILD, buildWild, GROUP, LAND, wildHere } from './animals.js';
import { createEvents, ARMIES, FLEETS_OF } from './events.js';
import { PARTS as BODY, JOINTS, isUpper, dress, JOBS, pose, boxModel, toolGeometry, useToolModels, LOADS, PROPS, PROP_DIST } from './people.js';
import { paintItem, extrude, toolInHand, PEOPLE_TOOL, TOOL_ITEMS, GRIP as ICON_GRIP, pixelSize, isLongTool } from './icons.js';
import { buildRelic, TOMB_TEXT } from './relics.js';
import { Sound, CITY_LAND } from './audio.js';

// Shown on the launch page. If this doesn't match what you expect, your browser is using an old copy:
// reload the page while holding Shift (or Cmd+Shift+R on a Mac).
const BUILD = '26 Oct 2026, 15:18 UTC';

// Every sound in the game is made here in the browser; there are no sound files to download.
const sound = new Sound();

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'polis-world-web-1';
// Bumped when the world itself changes (2: whole cities). Old saves keep everything, except changes inside the new cities.
const WORLD_VERSION = 8;   // 5: Olympia · 6: the Great Wall reaches round China · 7: Rome rebuilt around a full-size Colosseum · 8: Giza rebuilt at full size, with the tomb inside the Great Pyramid
const LOG_LEAVES = { 7: 8, 9: 10, 11: 12, 24: 25 };

// ---------- input mode: computer (keyboard and mouse) or touch screen ----------
const input = { mode: matchMedia('(hover: none) and (pointer: coarse)').matches ? 'touch' : 'desk', keys: new Set(), joy: { x: 0, y: 0 }, mining: false, buildMode: false, freeLook: false };
function setMode(m) {
  if (input.mode === m) return;
  input.mode = m;
  document.body.dataset.mode = m;
  if (m === 'touch' && document.pointerLockElement) document.exitPointerLock();
  updateHelp();
}
document.body.dataset.mode = input.mode;

// ---------- renderer, scene, lights ----------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 600);
scene.fog = new THREE.Fog(0x9cc4ee, 60, 150);
const sky = makeSky();
scene.add(sky);
const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x6b5a45, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 320 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ---------- game state ----------
let world = null, mats = null, atlasTex = null, scenery = null, ships = null, events = null;
const look = { day: 1, warm: 0, under: false, horizon: new THREE.Color() };   // the light right now, for the sky and its life
const G = {
  clock: 7 * 60, stars: 0, found: new Set(), talked: new Set(), relics: new Set(), hunger: 10, health: 10, placed: {}, cities: {}, camp: null, villagers: [], giftDay: 0,
  edits: new Map(), firstPerson: true, camDist: 5.5, started: false, paused: true,
};
const inv = new Inventory();
let selected = 0;
const P = { x: 0, y: 0, z: 0, vx: 0, vz: 0, vy: 0, yaw: 0, pitch: -0.25, ground: false, water: false, step: 0, walk: 0, swing: 0 };

// ---------- chunks ----------
const chunks = new Map();          // "cx,cz" → THREE.Group
const dirty = new Set();
let viewChunks = 8;
function chunkKey(cx, cz) { return cx + ',' + cz; }
function buildChunk(cx, cz) {
  const k = chunkKey(cx, cz);
  const g = meshChunk(world, cx, cz);
  let group = chunks.get(k);
  if (group) { for (const m of group.children) m.geometry.dispose(); group.clear(); }
  else { group = new THREE.Group(); chunks.set(k, group); scene.add(group); }
  for (const [geo, mat, shadow] of [[g.solid, mats.solid, true], [g.cut, mats.cut, true], [g.water, mats.water, false]]) {
    if (!geo) continue;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow; m.receiveShadow = true;
    if (mat === mats.water) m.renderOrder = 5;
    group.add(m);
  }
}
function markDirty(x, z, reach = 5) {
  for (let cz = Math.floor((z - reach) / CS); cz <= Math.floor((z + reach) / CS); cz++)
    for (let cx = Math.floor((x - reach) / CS); cx <= Math.floor((x + reach) / CS); cx++)
      if (chunks.has(chunkKey(cx, cz))) dirty.add(chunkKey(cx, cz));
}
function streamChunks(budgetMs) {
  const t0 = performance.now();
  // Changed chunks first (nearest first), then new ones around you.
  if (dirty.size) {
    const list = [...dirty].map((k) => k.split(',').map(Number)).sort((a, b) => dist2(a) - dist2(b));
    for (const [cx, cz] of list) { dirty.delete(chunkKey(cx, cz)); buildChunk(cx, cz); if (performance.now() - t0 > budgetMs) return; }
  }
  const pcx = Math.floor(P.x / CS), pcz = Math.floor(P.z / CS), n = Math.ceil(world.n / CS);
  const want = [];
  for (let cz = pcz - viewChunks; cz <= pcz + viewChunks; cz++) for (let cx = pcx - viewChunks; cx <= pcx + viewChunks; cx++) {
    if (cx < 0 || cz < 0 || cx >= n || cz >= n) continue;
    const d = Math.hypot(cx - pcx, cz - pcz);
    if (d <= viewChunks && !chunks.has(chunkKey(cx, cz))) want.push([cx, cz, d]);
  }
  want.sort((a, b) => a[2] - b[2]);
  for (const [cx, cz] of want) { buildChunk(cx, cz); if (performance.now() - t0 > budgetMs) break; }
  for (const [k, group] of chunks) {
    const [cx, cz] = k.split(',').map(Number);
    if (Math.hypot(cx - pcx, cz - pcz) > viewChunks + 2) { for (const m of group.children) m.geometry.dispose(); scene.remove(group); chunks.delete(k); }
  }
}
const dist2 = ([cx, cz]) => (cx * CS + 8 - P.x) ** 2 + (cz * CS + 8 - P.z) ** 2;

// ---------- changing blocks ----------
function setBlock(x, y, z, b) {
  const old = world.get(x, y, z);
  if (old === b) return;
  world.set(x, y, z, b);
  G.edits.set(world.idx(x, y, z), b);
  const wet = (IS_WATER[old] || old === 0) && (IS_WATER[b] || b === 0);
  markDirty(x, z, GLOW[b] > 0 || GLOW[old] > 0 ? 9 : wet ? 1 : 5);
  wakeWater(x, y, z);
}

// ---------- water that flows ----------
// Still water (a source) stays put. Next to an opening it spreads out in thinner and thinner sheets (7 steps), pours
// straight down over edges, and two still waters side by side over solid ground fill the gap between them.
const flowQ = [], flowSet = new Set();
let flowT = 0;
function wakeWater(x, y, z) {
  for (const [dx, dy, dz] of [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const qx = x + dx, qy = y + dy, qz = z + dz;
    if (!world.inb(qx, qz) || qy < 1 || qy >= H - 1) continue;
    const i = world.idx(qx, qy, qz);
    if (!flowSet.has(i)) { flowSet.add(i); flowQ.push(i); }
  }
}
const canFill = (b) => b === 0 || (IS_CROSS[b] && !IS_WATERY[b] && b !== 58);
const isStill = (b) => b === WATER || (IS_WATERY[b] && !IS_WATER[b]);
function spreadFrom(x, y, z) {
  const b = world.get(x, y, z);
  if (!IS_WATER[b]) return 0;
  if (b === FALLING) { const below = world.get(x, y - 1, z); return IS_SOLID[below] ? 8 : 0; }
  return WATER_AMT[b];
}
function washAway(x, y, z) {
  const b = world.get(x, y, z);
  if (IS_CROSS[b] && !IS_WATERY[b]) { const d = b === 56 ? 'torch' : BLOCKS[b].drop; if (d) dropItem(d, 1, x + 0.5, y + 0.5, z + 0.5, 0.5); }
}
function updateWater(i) {
  const n = world.n, x = i % n, z = Math.floor(i / n) % n, y = Math.floor(i / (n * n));
  const b = world.get(x, y, z);
  if (!(IS_WATER[b] || canFill(b)) || siteOf(x, y, z) !== null) return;
  if (b !== WATER) {
    let want;
    if (IS_WATERY[world.get(x, y + 1, z)]) want = FALLING;
    else {
      let best = 0, still = 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nb = world.get(x + dx, y, z + dz); if (isStill(nb)) still++; best = Math.max(best, spreadFrom(x + dx, y, z + dz)); }
      const below = world.get(x, y - 1, z);
      if (still >= 2 && (IS_SOLID[below] || below === WATER)) want = WATER;
      else want = best >= 2 ? 80 + best - 1 : 0;
    }
    if (want === 0 && !IS_WATER[b]) return;
    if (want !== b) { if (!IS_WATER[b]) washAway(x, y, z); setBlock(x, y, z, want); }
    if (want === 0) return;
  }
  const cur = world.get(x, y, z), a = cur === FALLING ? 8 : WATER_AMT[cur];
  const below = world.get(x, y - 1, z);
  if (y > 1 && (canFill(below) || (IS_WATER[below] && below !== WATER && below !== FALLING))) { washAway(x, y - 1, z); setBlock(x, y - 1, z, FALLING); return; }
  // Water only spreads sideways when it can't fall any further: over solid ground or on top of still water.
  if (IS_WATER[below] && below !== WATER) return;
  if (cur === FALLING && IS_WATERY[below]) return;
  if (a <= 1) return;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nb = world.get(x + dx, y, z + dz);
    if (siteOf(x + dx, y, z + dz) !== null) continue;
    if (canFill(nb)) { washAway(x + dx, y, z + dz); setBlock(x + dx, y, z + dz, 80 + a - 1); }
    else if (IS_WATER[nb] && nb !== WATER && nb !== FALLING && WATER_AMT[nb] < a - 1) setBlock(x + dx, y, z + dz, 80 + a - 1);
  }
}
function updateFlow(dt) {
  flowT -= dt;
  if (flowT > 0 || !flowQ.length) return;
  flowT = 0.25;
  const batch = flowQ.splice(0, Math.min(flowQ.length, 400));
  for (const i of batch) flowSet.delete(i);
  for (const i of batch) updateWater(i);
}
/// Which way the water is pushing at a spot (it runs from deeper to shallower, and falls).
function currentAt(x, y, z) {
  const b = world.get(x, y, z);
  if (!IS_WATER[b] || b === WATER) return [0, 0, 0];
  if (b === FALLING) return [0, -1, 0];
  let fx = 0, fz = 0;
  const a = WATER_AMT[b];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nb = world.get(x + dx, y, z + dz);
    if (IS_WATER[nb]) { const d = a - (nb === FALLING ? 0 : WATER_AMT[nb]); fx += dx * d; fz += dz * d; }
    else if (canFill(nb) || IS_WATER[world.get(x + dx, y - 1, z + dz)]) { fx += dx * a; fz += dz * a; }
  }
  const l = Math.hypot(fx, fz);
  return l > 0 ? [fx / l, 0, fz / l] : [0, 0, 0];
}

// ---------- the player's body ----------
function boxMesh(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function person(look) {
  // Built from the same body parts as the townspeople: a face, hands, sandals, a belt, hair (and maybe a beard or hat).
  const g = new THREE.Group(), joints = {};
  const colors = { eye: 0x1e2a44, white: 0xf2efe8, nose: new THREE.Color(look.skin).offsetHSL(0, 0, -0.06).getHex(), mouth: 0x8a3a32, shoes: 0x5a3a22, belt: 0x6b4a2b, gold: 0xe0b84a, sleeves: look.shirt, ...look };
  for (const [j, at] of Object.entries(JOINTS)) { const q = new THREE.Group(); q.position.set(...at); (j === 'upper' || j === 'root' ? g : g).add(q); joints[j] = q; }
  for (const [name, joint, ctr, size, key] of BODY) {
    let cc = ctr, sz = size, col = colors[key];
    if (name.startsWith('hat')) { const piece = look.hat?.find((q) => q[0] === name); if (!piece) continue; sz = piece[1]; cc = piece[2]; col = piece[3]; }
    if ((name === 'robe' && !look.robe) || (name === 'beard' && !look.beard) || (name === 'hairBack' && !look.longHair) || (name === 'neck' && !look.necklace)) continue;
    joints[joint].add(boxMesh(sz[0], sz[1], sz[2], col, cc[0], cc[1], cc[2]));
  }
  return { g, legs: [joints.legL, joints.legR], arms: [joints.armL, joints.armR], head: joints.head };
}
const playerBody = person({ skin: 0xdcae86, shirt: 0xa83226, sleeves: 0xa83226, pants: 0x5a4632, hair: 0x3a2716, belt: 0x3a2a1a });
scene.add(playerBody.g);
let heldMesh = null;
// In first person you see your own right arm and whatever is in your hand, at the bottom right of the screen.
scene.add(camera);
const fpHand = new THREE.Group();
const fpArm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.45), [0, 0, 0, 0, 0, 0].map((_, i) => new THREE.MeshLambertMaterial({ color: i === 4 ? 0xdcae86 : 0xa83226 })));
fpArm.position.set(0, 0, 0.12);
fpHand.add(fpArm);
// Drawn on top of everything, so your hand never disappears into a wall you're standing against.
const onTop = (m) => { m.renderOrder = 999; for (const mat of [].concat(m.material)) { mat.depthTest = false; mat.depthWrite = false; } };
onTop(fpArm);
fpHand.position.set(0.3, -0.3, -0.9);
fpHand.rotation.set(0.25, -0.18, 0);
camera.add(fpHand);
let fpHeld = null;

// ---------- input ----------
const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (openPanel === 'designer') return;
  // With a window open (inventory and crafting, designs, controls, the map…), the arrow keys and Page Up/Down scroll it.
  if (openPanel && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.code)) {
    e.preventDefault();
    const root = document.getElementById(openPanel === 'name' ? 'nameBox' : openPanel);
    scrollPanel(root, e.code === 'ArrowUp' || e.code === 'PageUp' ? -1 : 1, e.code.startsWith('Page'));
    return;
  }
  setMode('desk');
  if (KEYMAP[e.code] || e.code === 'Space') e.preventDefault();
  if (!G.started) return;
  input.keys.add(e.code);
  if (e.repeat) return;
  if (e.code.startsWith('Digit') && e.code !== 'Digit0') selectSlot(Number(e.code.slice(5)) - 1);
  if (e.code === 'KeyE' || e.code === 'KeyI') togglePanel('inventory');
  if (e.code === 'KeyM') togglePanel('map');
  if (e.code === 'KeyV') { G.firstPerson = !G.firstPerson; toast(G.firstPerson ? 'First-person view' : 'Third-person view'); }
  if (e.code === 'KeyF') eat();
  if (e.code === 'KeyH') togglePanel('help');
  if (e.code === 'KeyB') { if (D.mode) endDesign(); togglePanel('designs'); }
  if (e.code === 'KeyR' && D.mode === 'place') { D.rot = (D.rot + 1) % 4; buildGhost(); }
  if (e.code === 'KeyZ') G.camDist = Math.max(2.5, G.camDist - 1);
  if (e.code === 'KeyC') G.camDist = Math.min(14, G.camDist + 1);
  // X builds, the same as right-click: places the block in your hand (or builds the design you're placing).
  if (e.code === 'KeyX' && !openPanel && !dialogueOpen) { if (D.mode) designAction(); else useOrPlace(); }
  if (e.code === 'Escape') { if (D.mode) endDesign(); closePanels(); }
});
addEventListener('keyup', (e) => input.keys.delete(e.code));
addEventListener('blur', () => { input.keys.clear(); input.mining = false; });

canvas.addEventListener('mousedown', (e) => {
  setMode('desk');
  if (!G.started) return;
  if (!document.pointerLockElement && !input.freeLook) { requestLock(); return; }
  if (input.freeLook) drag = { x: e.clientX, y: e.clientY, moved: false };
  if (D.mode) { if (e.button === 2 && D.mode === 'place') { D.rot = (D.rot + 1) % 4; buildGhost(); } else if (e.button === 0) designAction(); return; }
  if (e.button === 0) { const a = aimFrom(); if (a.who) interact(a.who); else input.mining = true; }
  if (e.button === 2) useOrPlace();
});
addEventListener('mouseup', (e) => { if (e.button === 0) input.mining = false; drag = null; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
let drag = null;
const turnBy = (mx, my) => { P.yaw -= mx * 0.0024; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - my * 0.0024)); };
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === canvas) { turnBy(e.movementX, e.movementY); return; }
  // Without the mouse lock (Safari and anything that refuses it) you look by dragging instead.
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 3) { drag.moved = true; input.mining = false; }
  if (drag.moved) turnBy(dx * 1.6, dy * 1.6);
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('wheel', (e) => {
  if (!G.started || openPanel) return;
  if (e.ctrlKey) { G.camDist = Math.max(2.5, Math.min(14, G.camDist + Math.sign(e.deltaY))); e.preventDefault(); return; }
  selectSlot((selected + (e.deltaY > 0 ? 1 : 8)) % 9);
}, { passive: false });
function requestLock() {
  if (input.mode !== 'desk') return;
  if (input.freeLook) { refreshPaused(); return; }
  let asked = false;
  try { const p = canvas.requestPointerLock(); asked = true; if (p && p.catch) p.catch(dragLookInstead); } catch (_) { dragLookInstead(); }
  // Some browsers refuse to hold the mouse and never say so. If it has never once caught, play without it.
  // (Only ever: the game lets go of the mouse itself whenever a window opens, and that mustn't count as a refusal.)
  if (asked) setTimeout(() => { if (!lockEverHeld && document.pointerLockElement !== canvas) dragLookInstead(); }, 700);
}
/// This browser won't let the game hold the mouse, so the player looks around by dragging instead.
function dragLookInstead() {
  if (input.freeLook) return;
  input.freeLook = true;
  updateHelp();
  refreshPaused();
  toast('Drag the mouse to look around', 'freelook');
}
let lockEverHeld = false;
// The browser said no to holding the mouse: don't leave the player staring at the veil, switch to dragging.
document.addEventListener('pointerlockerror', () => { if (!lockEverHeld) { console.warn('Polis World: this browser refused the mouse lock, switching to drag-to-look'); dragLookInstead(); } });
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  if (locked) lockEverHeld = true;
  // A late lock while a window is open (designer, inventory…) would swallow its clicks: let go again.
  if (locked && (openPanel || dialogueOpen)) { document.exitPointerLock(); return; }
  refreshPaused();
  if (!locked) input.mining = false;
});

// Touch: joystick on the left, drag anywhere else to look, tap to dig or build.
const joy = $('joystick'), knob = $('knob');
let joyId = null, lookId = null, lookLast = null, tapStart = null;
joy.addEventListener('touchstart', (e) => { setMode('touch'); const t = e.changedTouches[0]; joyId = t.identifier; moveJoy(t); e.preventDefault(); }, { passive: false });
function moveJoy(t) {
  const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = (t.clientX - cx) / (r.width / 2), dy = (t.clientY - cy) / (r.height / 2);
  const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
  input.joy = { x: dx, y: -dy };
  knob.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
}
canvas.addEventListener('touchstart', (e) => {
  setMode('touch');
  for (const t of e.changedTouches) if (lookId === null) { lookId = t.identifier; lookLast = [t.clientX, t.clientY]; tapStart = [t.clientX, t.clientY, performance.now()]; }
  e.preventDefault();
}, { passive: false });
addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) moveJoy(t);
    if (t.identifier === lookId) {
      P.yaw -= (t.clientX - lookLast[0]) * 0.006;
      P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - (t.clientY - lookLast[1]) * 0.005));
      lookLast = [t.clientX, t.clientY];
      if (tapStart && Math.hypot(t.clientX - tapStart[0], t.clientY - tapStart[1]) > 12) tapStart = null;
    }
  }
}, { passive: false });
addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) { joyId = null; input.joy = { x: 0, y: 0 }; knob.style.transform = ''; }
    if (t.identifier === lookId) {
      lookId = null;
      if (tapStart && performance.now() - tapStart[2] < 400 && G.started) tapAt(t.clientX, t.clientY);
      tapStart = null; input.mining = false;
    }
  }
});
$('btnJump').addEventListener('touchstart', (e) => { input.keys.add('Space'); e.preventDefault(); }, { passive: false });
$('btnJump').addEventListener('touchend', () => input.keys.delete('Space'));
$('btnMode').addEventListener('click', () => { input.buildMode = !input.buildMode; $('btnMode').textContent = input.buildMode ? 'Building' : 'Digging'; $('btnMode').classList.toggle('on', input.buildMode); });
$('btnInv').addEventListener('click', () => togglePanel('inventory'));
$('btnMap').addEventListener('click', () => togglePanel('map'));
$('btnDesign').addEventListener('click', () => { if (D.mode) endDesign(); togglePanel('designs'); });
$('btnView').addEventListener('click', () => { G.firstPerson = !G.firstPerson; });
$('btnEat').addEventListener('click', () => eat());
$('paused').addEventListener('click', () => { if (G.started) requestLock(); });

// ---------- aiming: which block or creature is in front of you ----------
const ray = new THREE.Raycaster();
function aimFrom(sx, sy) {
  if (sx === undefined) ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  else ray.setFromCamera(new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1), camera);
  const o = ray.ray.origin, d = ray.ray.direction;
  const eye = new THREE.Vector3(P.x, P.y + 1.6, P.z);
  const reach = 5.6;
  // Step through the grid (a voxel ray march).
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const sx2 = Math.sign(d.x), sy2 = Math.sign(d.y), sz2 = Math.sign(d.z);
  const tdx = Math.abs(1 / d.x), tdy = Math.abs(1 / d.y), tdz = Math.abs(1 / d.z);
  let tx = (sx2 > 0 ? x + 1 - o.x : o.x - x) * tdx, ty = (sy2 > 0 ? y + 1 - o.y : o.y - y) * tdy, tz = (sz2 > 0 ? z + 1 - o.z : o.z - z) * tdz;
  let face = [0, 0, 0], t = 0, block = null;
  const maxT = o.distanceTo(eye) + reach + 1;
  while (t < maxT) {
    const b = world.get(x, y, z);
    if (b && !IS_WATER[b] && BLOCKS[b].shape !== 'none') {
      const hit = o.clone().addScaledVector(d, t);
      if (hit.distanceTo(eye) <= reach + 0.9) block = { x, y, z, b, face, t };
      break;
    }
    if (tx < ty && tx < tz) { x += sx2; t = tx; tx += tdx; face = [-sx2, 0, 0]; }
    else if (ty < tz) { y += sy2; t = ty; ty += tdy; face = [0, -sy2, 0]; }
    else { z += sz2; t = tz; tz += tdz; face = [0, 0, -sz2]; }
  }
  // Creatures and people.
  let who = null;
  const near = entityGroup.children.filter((g) => g.visible && Math.abs(g.position.x - P.x) < 9 && Math.abs(g.position.z - P.z) < 9);
  const hits = near.length ? ray.intersectObjects(near, true) : [];
  for (const h of hits) {
    if (block && h.distance > block.t) break;
    if (h.point.distanceTo(eye) > reach + 1) break;
    let o2 = h.object; while (o2 && !o2.userData.entity) o2 = o2.parent;
    if (o2) { who = o2.userData.entity; break; }
  }
  if (!who) {
    const c = aimCrowd(ray.ray, block ? block.t : maxT);
    if (c && c.who && new THREE.Vector3(c.who.x, c.who.y + 1, c.who.z).distanceTo(eye) <= reach + 1) who = c.who;
  }
  return { block: who ? null : block, who };
}

// ---------- breaking and building ----------
const crack = new THREE.Mesh(new THREE.BoxGeometry(1.004, 1.004, 1.004), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006, 1.006, 1.006)), new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.55 }));
scene.add(crack, outline);
let breaking = null;
const heldItem = () => inv.slots[selected];
const heldTool = () => { const s = heldItem(); return s ? ITEM[s.id].tool ? ITEM[s.id] : null : null; };

function startBreak(t) {
  if (!t) return;
  const info = BLOCKS[t.b];
  if (siteOf(t.x, t.y, t.z) !== null) { message("That's part of a historic site. They're protected — build your own nearby!"); return; }
  if (info.hard < 0) { message(`${info.name} can't be broken`); return; }
  if (breaking && breaking.x === t.x && breaking.y === t.y && breaking.z === t.z) return;
  const tool = heldTool();
  let time = info.hard;
  if (tool && tool.tool === info.tool) time /= SPEED[tool.tier];
  const gets = info.tier === 0 || (tool && tool.tool === 'pickaxe' && tool.tier >= info.tier);
  if (!gets) message(`You need ${['', 'a pickaxe', 'a stone pickaxe', 'a bronze pickaxe', 'an iron pickaxe'][Math.min(info.tier, 4)]} to collect ${info.name}`);
  breaking = { x: t.x, y: t.y, z: t.z, b: t.b, total: Math.max(time, 0.05), t: 0, gets };
}
function updateBreaking(dt) {
  if (!breaking) { crack.visible = false; return; }
  if (world.get(breaking.x, breaking.y, breaking.z) !== breaking.b) { breaking = null; return; }
  breaking.t += dt;
  P.swing = 0.25;
  const p = Math.min(breaking.t / breaking.total, 1);
  crack.visible = !IS_CROSS[breaking.b];
  crack.position.set(breaking.x + 0.5, breaking.y + 0.5, breaking.z + 0.5);
  crack.material.opacity = 0.12 + p * 0.45;
  // A chip of sound each time the pick lands, in the voice of whatever you're digging.
  breaking.sfx = (breaking.sfx || 0) + dt;
  if (breaking.sfx > 0.26) { breaking.sfx = 0; sound.play('dig', soundMat(breaking.b)); }
  if (p >= 1) { const b = breaking; breaking = null; crack.visible = false; finishBreak(b); }
}
function finishBreak(j) {
  const info = BLOCKS[j.b];
  sound.play(LOG_LEAVES[j.b] ? 'chop' : 'break');
  setBlock(j.x, j.y, j.z, IS_WATERY[j.b] ? WATER : 0);
  if (IS_WATERY[j.b]) for (let y = j.y + 1; world.get(j.x, y, j.z) === 65; y++) { setBlock(j.x, y, j.z, WATER); dropItem('kelp', 1, j.x + 0.5, y + 0.5, j.z + 0.5, 0.5); }
  const above = world.get(j.x, j.y + 1, j.z);
  if (IS_CROSS[above] && !IS_WATERY[above]) { if (above === 56) dropItem('torch', 1, j.x + 0.5, j.y + 1.5, j.z + 0.5); if (above === 58) dropItem('campfire', 1, j.x + 0.5, j.y + 1.5, j.z + 0.5); setBlock(j.x, j.y + 1, j.z, 0); }
  if (LOG_LEAVES[j.b]) fellTree(j.x, j.y, j.z, j.b);
  settle(j.x, j.y + 1, j.z);
  burst(j.x + 0.5, j.y + 0.5, j.z + 0.5, info.side);
  const drops = [];
  if (j.gets && info.drop) drops.push([info.drop, 1]);
  // A door comes away whole, whichever half you break.
  if (info.door) { const oy = info.top ? j.y - 1 : j.y + 1; if (BLOCKS[world.get(j.x, oy, j.z)].door) setBlock(j.x, oy, j.z, 0); if (info.top && j.gets) drops.push(['door', 1]); }
  if (j.b === 50) drops.push(['wheatSeeds', 1 + (Math.random() < 0.5 ? 1 : 0)]);
  if (j.b === 30 && Math.random() < 0.3) drops.push(['wheatSeeds', 1]);
  if (j.b >= 67 && j.b <= 69 && Math.random() < 0.4) drops.push(['murex', 1]);   // sea snails live on the reef
  if (j.b === 8) { if (Math.random() < 0.1) drops.push(['apple', 1]); if (Math.random() < 0.12) drops.push(['stick', 1]); }
  else if (info.cut && info.shape === 'cube' && Math.random() < 0.12) drops.push(['stick', 1]);
  for (const [id, n] of drops) dropItem(id, n, j.x + 0.5, j.y + 0.5, j.z + 0.5);
  if (j.b === 59 || j.b === 60) furnaceRemoved(j.x, j.y, j.z);
  scheduleSave();
}
function canPlaceAt(x, y, z) {
  const cur = world.get(x, y, z);
  if (!(cur === 0 || (IS_CROSS[cur] && !IS_WATERY[cur]) || IS_WATER[cur]) || y < 1 || y >= H - 1 || !world.inb(x, z)) return false;
  if (x + 1 > P.x - 0.3 && x < P.x + 0.3 && z + 1 > P.z - 0.3 && z < P.z + 0.3 && y + 1 > P.y && y < P.y + 1.8) return false;
  return !mobs.some((m) => Math.floor(m.x) === x && Math.floor(m.z) === z && y < m.y + 1.2 && y + 1 > m.y);
}
function placeBlock(t) {
  const s = heldItem();
  if (!s || !ITEM[s.id].block) return false;
  sound.play('place');
  let x = t.x, y = t.y, z = t.z;
  if (!IS_CROSS[t.b]) { x += t.face[0]; y += t.face[1]; z += t.face[2]; }
  if (!canPlaceAt(x, y, z)) { message("Something's in the way"); return true; }
  let b = ITEM[s.id].block;
  // Doors and gates go across the way you're facing (a door also needs room for its top half).
  if (BLOCKS[b].door || BLOCKS[b].gate) {
    const alongZ = Math.abs(Math.cos(P.yaw)) > Math.abs(Math.sin(P.yaw));   // looking along z: the doorway's wall runs along x
    if (BLOCKS[b].door) {
      if (!canPlaceAt(x, y + 1, z)) { message('A door needs two blocks of room.'); return true; }
      setBlock(x, y, z, alongZ ? 110 : 112); setBlock(x, y + 1, z, alongZ ? 111 : 113);
    } else setBlock(x, y, z, alongZ ? 118 : 119);
    inv.remove(s.id, 1); P.swing = 0.25; refreshHotbar(); scheduleSave();
    return true;
  }
  if (ITEM[s.id].water && !IS_WATER[world.get(x, y, z)]) { message(`${ITEM[s.id].name} only grows under water.`); return true; }
  if (b === 73 && !nextToWall(x, y, z)) { message('A ladder needs a wall to lean on.'); return true; }
  setBlock(x, y, z, b);
  inv.remove(s.id, 1);
  P.swing = 0.25;
  settle(x, y, z);
  if (b === 72) soakUp(x, y, z);
  if (b === 59) message('Furnace built! Click it to smelt ore into metal. It burns coal or charcoal.');
  refreshHotbar();
  scheduleSave();
  return true;
}
/// Open or shut a door (both halves) or a gate.
const DOOR_SWAP = { 110: 114, 111: 115, 112: 116, 113: 117, 114: 110, 115: 111, 116: 112, 117: 113, 118: 120, 119: 121, 120: 118, 121: 119 };
function toggleDoor(x, y, z) {
  sound.play('door');
  const info = BLOCKS[world.get(x, y, z)];
  const y0 = info.top ? y - 1 : y, cells = info.door ? [y0, y0 + 1] : [y0];
  // Don't shut a door on yourself.
  if (info.open && x + 1 > P.x - 0.3 && x < P.x + 0.3 && z + 1 > P.z - 0.3 && z < P.z + 0.3 && y0 + cells.length > P.y && y0 < P.y + 1.8) { message('Step out of the doorway first.'); return; }
  for (const yy of cells) { const b = world.get(x, yy, z); if (DOOR_SWAP[b] !== undefined) setBlock(x, yy, z, DOOR_SWAP[b]); }
  scheduleSave();
}
const isDoorish = (b) => !!(BLOCKS[b].door || BLOCKS[b].gate);
function nextToWall(x, y, z) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const b = world.get(x + dx, y, z + dz); return IS_CUBE[b] && !IS_CUT[b]; }); }
/// A sponge soaks up the water around it.
function soakUp(x, y, z) {
  let n = 0;
  for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== r || n >= 80) continue;
    if (IS_WATER[world.get(x + dx, y + dy, z + dz)] && siteOf(x + dx, y + dy, z + dz) === null) { world.set(x + dx, y + dy, z + dz, 0); G.edits.set(world.idx(x + dx, y + dy, z + dz), 0); markDirty(x + dx, z + dz, 1); n++; }
  }
  if (n) message(`The sponge soaked up ${n} blocks of water!`);
}
function useOrHit(sx, sy) {
  const a = aimFrom(sx, sy);
  if (a.who) { interact(a.who); input.mining = false; return; }
  if (a.block) startBreak(a.block);
}
function useOrPlace(sx, sy) {
  // Standing by a ship's steering oars: take them, or let them go again.
  if (ships && (ships.helm || ships.helmHere(P.x, P.z, P.y))) {
    const took = ships.takeHelm(P.x, P.z, P.y);
    message(took ? 'You have the steering oars. W rows · S backs water · A and D turn.' : 'You let go of the steering oars.');
    return;
  }
  if (P.ride) { dismount(); return; }
  // Setting a boat you built on the water.
  const inHand = heldItem();
  if (inHand && ITEM[inHand.id].boat && ships) {
    const dx = Math.sin(P.yaw), dz = Math.cos(P.yaw);
    for (const d of [2.5, 3.5, 4.5, 1.5, 5.5]) {
      const bx = P.x + dx * d, bz = P.z + dz * d;
      if (!world.hasWater(Math.floor(bx), Math.floor(bz))) continue;
      const boat = ships.place(ITEM[inHand.id].boat, bx, bz, P.yaw);
      if (!boat) continue;
      inv.remove(inHand.id, 1); refreshHotbar(); scheduleSave();
      message(`You set the ${boat.t.name} afloat. Climb aboard and press X at the back to steer.`);
      if (!G.talked.has('_boat')) { G.talked.add('_boat'); addStars(1, 'Your first boat!'); }
      return;
    }
    message('You need open water in front of you to set it afloat.');
    return;
  }
  const a = aimFrom(sx, sy);
  // Swing up onto a horse or a camel you're looking at — or one you're standing right beside.
  if (a.who && (RIDE[a.who.kind] || NO_RIDE[a.who.kind]) && !a.who.dead && !a.who.mount) {
    const far = Math.hypot(a.who.x - P.x, a.who.z - P.z);
    if (far < 6.5) { mount(a.who); return; }
    message(`Walk right up to the ${SPECIES[a.who.kind].name} first, then press X.`);
    return;
  }
  const beside = mobs.find((m) => RIDE[m.kind] && !m.dead && !m.mount && Math.hypot(m.x - P.x, m.z - P.z) < 3.4 && (Math.sin(P.yaw) * (m.x - P.x) + Math.cos(P.yaw) * (m.z - P.z)) > 0);
  if (beside) { mount(beside); return; }
  if (a.who) { interact(a.who); return; }
  const t = a.block;
  if (t && isDoorish(t.b)) { toggleDoor(t.x, t.y, t.z); return; }
  if (t && (t.b === 59 || t.b === 60)) { openFurnace(); return; }
  if (t && (t.b === 37 || t.b === 38)) { sleep(); return; }
  if (t && t.b === 58) { const s = heldItem(); if (s && ITEM[s.id].cooked) { cook(s.id); return; } }
  const s = heldItem();
  if (s && ITEM[s.id].food && !ITEM[s.id].block) { eat(); return; }
  if (t && placeBlock(t)) return;
  const nearRide = mobs.filter((m) => RIDE[m.kind] && !m.dead && !m.mount && Math.hypot(m.x - P.x, m.z - P.z) < 14)
    .sort((m, n) => Math.hypot(m.x - P.x, m.z - P.z) - Math.hypot(n.x - P.x, n.z - P.z))[0];
  if (nearRide) {
    const name = SPECIES[nearRide.kind].name;
    message(nearRide.tame
      ? `Walk right up to the ${name} and press X to climb on.`
      : `Walk right up to the ${name}, hold an apple, some wheat or a loaf of bread, and press X to make friends with it.`);
  }
}
function tapAt(sx, sy) {
  if (D.mode) return;
  const a = aimFrom(sx, sy);
  if (a.who) { interact(a.who); return; }
  const t = a.block;
  if (!t) return;
  if (isDoorish(t.b) && input.buildMode) { toggleDoor(t.x, t.y, t.z); return; }
  if (t.b === 59 || t.b === 60) { openFurnace(); return; }
  if (t.b === 37 || t.b === 38) { sleep(); return; }
  if (t.b === 58) { const s = heldItem(); if (s && ITEM[s.id].cooked) { cook(s.id); return; } }
  if (input.buildMode && placeBlock(t)) return;
  startBreak(t);
}

// ---------- falling trees, sand and things on the ground ----------
const fx = [];       // falling trees and blocks
const drops = [];
function fellTree(x, y, z, log) {
  const leaf = LOG_LEAVES[log];
  const logs = [], seen = new Set(), q = [[x, y + 1, z]];
  while (q.length) {
    const [cx, cy, cz] = q.pop(), k = world.idx(cx, cy, cz);
    if (seen.has(k) || cy <= y || cy >= H || !world.inb(cx, cz)) continue;
    seen.add(k);
    if (world.get(cx, cy, cz) !== log || Math.abs(cx - x) > 3 || Math.abs(cz - z) > 3) continue;
    if (siteOf(cx, cy, cz) !== null) return;
    logs.push([cx, cy, cz]);
    if (logs.length > 24) return;
    for (let dy = 0; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (dx || dy || dz) q.push([cx + dx, cy + dy, cz + dz]);
  }
  if (!logs.length) return;
  for (const [cx, cy, cz] of logs) { const below = world.get(cx, cy - 1, cz); if (below !== log && below !== 0 && !(cx === x && cz === z && cy === y + 1) && IS_SOLID[below]) return; }
  const leaves = [], lseen = new Set(), lq = [];
  for (const [cx, cy, cz] of logs) for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) lq.push([cx + dx, cy + dy, cz + dz, 1]);
  while (lq.length) {
    const [cx, cy, cz, d] = lq.shift(), k = world.idx(cx, cy, cz);
    if (lseen.has(k) || cy <= y || !world.inb(cx, cz)) continue;
    lseen.add(k);
    if (world.get(cx, cy, cz) !== leaf) continue;
    leaves.push([cx, cy, cz]);
    if (d < 4 && leaves.length < 160) for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) lq.push([cx + dx, cy + dy, cz + dz, d + 1]);
  }
  if (leaves.length < (log === 24 ? 2 : 4)) return;
  // A little world with just the tree in it, drawn with the same blocks.
  const span = 16, cells = new Uint8Array(span * span * H);
  const mini = { n: span, get(a, b, c) { return a < 0 || c < 0 || a >= span || c >= span || b < 0 || b >= H ? 0 : cells[(b * span + c) * span + a]; } };
  const putMini = ([cx, cy, cz], b) => { const lx = cx - x + 8, lz = cz - z + 8, ly = cy - y; if (lx >= 0 && lz >= 0 && lx < span && lz < span) cells[(ly * span + lz) * span + lx] = b; };
  logs.forEach((c) => putMini(c, log)); leaves.forEach((c) => putMini(c, leaf));
  const g = meshChunk(mini, 0, 0, mini);
  const pivot = new THREE.Group(), inner = new THREE.Group();
  for (const [geo, mat] of [[g.solid, mats.solid], [g.cut, mats.cut]]) if (geo) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; inner.add(m); }
  inner.position.set(-8.5, -1, -8.5);
  pivot.add(inner);
  pivot.position.set(x + 0.5, y + 1, z + 0.5);
  scene.add(pivot);
  for (const [cx, cy, cz] of [...leaves, ...logs]) setBlock(cx, cy, cz, 0);
  let away = new THREE.Vector2(x + 0.5 - P.x, z + 0.5 - P.z);
  if (away.length() < 0.1) away.set(Math.sin(P.yaw + Math.PI), Math.cos(P.yaw + Math.PI));
  away.normalize();
  const axis = new THREE.Vector3(away.y, 0, -away.x);
  fx.push({ kind: 'tree', pivot, axis, t: 0, logs: logs.length, logItem: BLOCKS[log].drop, leaves: leaves.length, oak: log === 7, base: [x + 0.5, y + 1, z + 0.5], dir: away });
  message(G.found.has('_tree') ? 'Timber!' : 'Timber! Cut a trunk and the whole tree comes down.');
  G.found.add('_tree');
}
function settle(x, y, z) {
  while (y < H - 1) {
    const b = world.get(x, y, z);
    if (b !== 4 && b !== 5) return;
    const below = world.get(x, y - 1, z);
    if (!(below === 0 || IS_CROSS[below] || IS_WATER[below])) return;
    if (siteOf(x, y, z) !== null) return;
    let land = y - 1;
    while (land > 0 && !IS_SOLID[world.get(x, land - 1, z)]) land--;
    const m = cubeMesh(b, 1);
    m.position.set(x + 0.5, y + 0.5, z + 0.5);
    scene.add(m);
    setBlock(x, y, z, 0);
    fx.push({ kind: 'sand', mesh: m, x, z, b, y, to: land, vy: 0 });
    y++;
  }
}
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    if (f.kind === 'tree') {
      f.t += dt;
      const fall = 2.3;
      if (f.t < fall) { const k = f.t / fall; f.pivot.quaternion.setFromAxisAngle(f.axis, (Math.PI / 2 - 0.08) * k * k); }
      else if (!f.landed) {
        f.landed = true;
        f.pivot.quaternion.setFromAxisAngle(f.axis, Math.PI / 2 - 0.08);
        shake = 0.35;
        const along = [f.dir.x, f.dir.y];
        for (let k = 0; k < f.logs; k++) dropItem(f.logItem, 1, f.base[0] + along[0] * (k + 0.6), f.base[1] + 0.7, f.base[2] + along[1] * (k + 0.6), 1.5);
        let sticks = 0, apples = 0;
        for (let k = 0; k < f.leaves; k++) { if (Math.random() < 0.06) sticks++; if (f.oak && Math.random() < 0.025) apples++; }
        const cx = f.base[0] + along[0] * (f.logs + 1), cz = f.base[2] + along[1] * (f.logs + 1);
        if (sticks) dropItem('stick', sticks, cx, f.base[1] + 1, cz, 2.5);
        for (let k = 0; k < apples; k++) dropItem('apple', 1, cx, f.base[1] + 1, cz, 3);
        for (let k = 0; k < 3; k++) burst(cx + (Math.random() - 0.5) * 3, f.base[1] + 0.8, cz + (Math.random() - 0.5) * 3, f.oak ? T.oakLeaves : T.birchLeaves);
      } else if (f.t > fall + 1.1) {
        f.pivot.traverse((o) => { if (o.material && !o.userData.fade) { o.material = o.material.clone(); o.material.transparent = true; o.userData.fade = true; } });
        const a = 1 - (f.t - fall - 1.1) / 0.6;
        f.pivot.traverse((o) => { if (o.material) o.material.opacity = Math.max(a, 0); });
        if (a <= 0) { scene.remove(f.pivot); f.pivot.traverse((o) => o.geometry?.dispose()); fx.splice(i, 1); }
      }
    } else {
      f.vy -= 24 * dt; f.y += f.vy * dt;
      if (f.y <= f.to) {
        scene.remove(f.mesh);
        const cur = world.get(f.x, f.to, f.z);
        if (cur === 0 || IS_CROSS[cur] || IS_WATER[cur]) setBlock(f.x, f.to, f.z, f.b); else dropItem(f.b === 4 ? 'sand' : 'gravel', 1, f.x + 0.5, f.to + 0.6, f.z + 0.5, 1);
        burst(f.x + 0.5, f.to + 0.2, f.z + 0.5, BLOCKS[f.b].side);
        fx.splice(i, 1);
      } else f.mesh.position.y = f.y + 0.5;
    }
  }
}

// A cube with a block's pictures (for things on the ground and falling sand).
const cubeCache = new Map();
function cubeMesh(b, size) {
  const key = b + ':' + size;
  let geo = cubeCache.get(key);
  if (!geo) {
    geo = new THREE.BoxGeometry(size, size, size);
    const info = BLOCKS[b], uv = geo.attributes.uv;
    // BoxGeometry faces: +x, -x, +y, -y, +z, -z (4 vertices each).
    [info.side, info.side, info.top, info.bottom, info.side, info.side].forEach((tile, f) => {
      for (let v = 0; v < 4; v++) { const u0 = uv.getX(f * 4 + v), v0 = uv.getY(f * 4 + v); const [a, c] = tileUV(tile, u0, 1 - v0); uv.setXY(f * 4 + v, a, c); }
    });
    cubeCache.set(key, geo);
  }
  const m = new THREE.Mesh(geo, cubeMat);
  m.castShadow = true;
  return m;
}
let cubeMat = null;
const iconTex = new Map();
// 3D models made from the detailed item pictures: 'hand' is how a tool sits in a hand (yours in third person, and every
// townsperson's), 'flat' is the picture standing up, for first person and for things lying on the ground.
// Every model is made at the thing's real size (icons.js SIZE): an apple fits in your palm, a spear is taller than you.
const ICON_CANVAS = new Map(), itemGeo = new Map(), itemPx = new Map();
const isHandTool = (id) => !!(ITEM[id]?.tool || TOOL_ITEMS[id] || id === 'stick' || isLongTool(id));
const itemScale = (id) => { if (!itemPx.has(id)) itemPx.set(id, pixelSize(ICON_CANVAS.get(id), id)); return itemPx.get(id); };
function itemModel(id, how) {
  const key = id + how;
  if (!itemGeo.has(key)) {
    const cv = ICON_CANVAS.get(id), W = cv.width, base = extrude(cv, W / 20);   // the same real thickness whatever the picture's size
    const tool = isHandTool(id) && W >= 32;   // the painted tools are held by the handle; anything else in the palm
    if (how === 'hand') itemGeo.set(key, toolInHand(base, tool ? ICON_GRIP.tool : [W / 2, W / 2], tool ? -0.68 : -0.66, itemScale(id).ps));
    else { const g = base.clone(); g.translate(-W / 2, how === 'ground' ? W : W / 2, 0); itemGeo.set(key, g); }
  }
  return itemGeo.get(key);
}
function iconSprite(id) {
  let tex = iconTex.get(id);
  if (!tex) { tex = new THREE.TextureLoader().load(ICONS[id]); tex.magFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; iconTex.set(id, tex); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.4 }));
  s.scale.set(0.45, 0.45, 0.45);
  return s;
}
function dropItem(id, n, x, y, z, spread = 1.4) {
  if (!id || n <= 0) return;
  if (drops.length > 90) { give(id, n); return; }
  const it = ITEM[id];
  const mesh = it && it.block && !IS_CROSS[it.block] ? cubeMesh(it.block, 0.3) : ICON_CANVAS.has(id) ? new THREE.Mesh(itemModel(id, 'ground'), MODEL_MAT) : iconSprite(id);
  if (mesh.isMesh && ICON_CANVAS.has(id)) { const { ps, extent } = itemScale(id); mesh.scale.setScalar(Math.min(2.2, Math.max(0.2, extent * ps)) / extent); mesh.castShadow = true; }   // real size (tiny things a little bigger, so you can spot them)
  mesh.position.set(x, y, z);
  scene.add(mesh);
  const a = Math.random() * Math.PI * 2;
  drops.push({ id, n, mesh, x, y, z, vx: Math.cos(a) * (0.3 + Math.random() * 0.7) * spread, vy: 3 + Math.random() * 2, vz: Math.sin(a) * (0.3 + Math.random() * 0.7) * spread, age: 0, spin: (Math.random() - 0.5) * 8 });
}
function updateDrops(dt) {
  const cx = P.x, cy = P.y + 0.9, cz = P.z;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.age += dt;
    const dx = cx - d.x, dy = cy - d.y, dz = cz - d.z, dist = Math.hypot(dx, dy, dz);
    if ((d.age > 1.2 && dist < 2.4) || d.age > 25) {
      const sp = Math.max(9, dist * 4) * dt / Math.max(dist, 0.001);
      d.x += dx * sp; d.y += dy * sp; d.z += dz * sp;
      if (dist < 0.7 || d.age > 27) { scene.remove(d.mesh); drops.splice(i, 1); give(d.id, d.n); continue; }
    } else {
      const inW = IS_WATERY[world.get(Math.floor(d.x), Math.floor(d.y), Math.floor(d.z))];
      if (inW) {
        // Things float up in water and drift with the current.
        const c = currentAt(Math.floor(d.x), Math.floor(d.y), Math.floor(d.z));
        d.vy += (1.2 - d.vy) * Math.min(dt * 2, 1) - (c[1] ? 3 * dt : 0);
        d.vx += (c[0] * 1.5 - d.vx) * Math.min(dt * 2, 1); d.vz += (c[2] * 1.5 - d.vz) * Math.min(dt * 2, 1);
        if (!IS_WATERY[world.get(Math.floor(d.x), Math.floor(d.y + 0.3), Math.floor(d.z))]) d.vy = Math.min(d.vy, 0.2);
      } else d.vy -= 22 * dt;
      let nx = d.x + d.vx * dt, ny = d.y + d.vy * dt, nz = d.z + d.vz * dt;
      const fy = Math.floor(ny);
      if (world.solid(Math.floor(nx), fy, Math.floor(d.z))) { d.vx *= -0.35; nx = d.x; }
      if (world.solid(Math.floor(nx), fy, Math.floor(nz))) { d.vz *= -0.35; nz = d.z; }
      const ground = world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(d.y + 0.4)) + 0.16;
      if (ny < ground) {
        ny = ground;
        if (d.vy < -1.2) { d.vy = -d.vy * 0.38; d.vx *= 0.65; d.vz *= 0.65; d.spin *= 0.6; }
        else { d.vy = 0; d.vx *= Math.max(0, 1 - dt * 5); d.vz *= Math.max(0, 1 - dt * 5); d.spin *= Math.max(0, 1 - dt * 4); }
      }
      d.x = nx; d.y = ny; d.z = nz;
    }
    d.mesh.position.set(d.x, d.y + (d.vy === 0 ? Math.sin(d.age * 3) * 0.04 : 0), d.z);
    if (!d.mesh.isSprite) d.mesh.rotation.y += (d.spin + 0.6) * dt;
  }
}
const particles = [];
function burst(x, y, z, tile) {
  const c = tileColor(tile);
  for (let k = 0; k < 8; k++) {
    const m = new THREE.Mesh(particleGeo, new THREE.MeshLambertMaterial({ color: c, transparent: true }));
    m.position.set(x + (Math.random() - 0.5) * 0.6, y + (Math.random() - 0.5) * 0.6, z + (Math.random() - 0.5) * 0.6);
    scene.add(m);
    particles.push({ m, vx: (Math.random() - 0.5) * 2.4, vy: 1.5 + Math.random() * 2, vz: (Math.random() - 0.5) * 2.4, t: 0 });
  }
}
const particleGeo = new THREE.BoxGeometry(0.13, 0.13, 0.13);
// Spray and mist where the waterfall crashes into its pool.
let sprayT = 0;
const sprayMat = new THREE.SpriteMaterial({ color: 0xeaf4ff, transparent: true, opacity: 0.5, depthWrite: false });
function updateSpray(dt) {
  const f = G.canyon && G.canyon.falls;
  if (!f || Math.hypot(P.x - f[0], P.z - f[2]) > 48) return;
  sprayT -= dt;
  if (sprayT > 0) return;
  sprayT = 0.06;
  for (let k = 0; k < 2; k++) {
    const m = new THREE.Sprite(sprayMat.clone());
    const sz = 0.5 + Math.random() * 0.9;
    m.scale.set(sz, sz, sz);
    m.position.set(f[0] - 0.6 - Math.random() * 1.6, (G.canyon.fallsBase ?? WL + 3) + 0.2, f[2] - 2 + Math.random() * 4);
    scene.add(m);
    particles.push({ m, vx: -0.6 - Math.random() * 1.4, vy: 1.2 + Math.random() * 1.6, vz: (Math.random() - 0.5) * 1.6, t: -0.6, mist: true });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt; p.vy -= (p.mist ? 2.5 : 14) * dt;
    if (p.mist) p.m.scale.multiplyScalar(1 + dt * 0.9);
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    p.m.material.opacity = Math.max(0, (p.mist ? 0.45 : 1) * (1 - Math.max(p.t, 0) / 0.7));
    if (p.t > 0.7) { scene.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); }
  }
}
let tileColors = null;
function tileColor(t) {
  if (!tileColors) {
    tileColors = [];
    const c = tileSheet(atlasImg, extraImg);
    const d = c.getContext('2d').getImageData(0, 0, 80, 140).data;
    for (let k = 0; k < 104; k++) {
      let r = 0, gg = 0, b = 0, n = 0;
      for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const i = ((Math.floor(k / 8) * 10 + y) * 80 + (k % 8) * 10 + x) * 4; if (d[i + 3] > 100) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } }
      tileColors[k] = new THREE.Color(`rgb(${Math.round(r / Math.max(n, 1))},${Math.round(gg / Math.max(n, 1))},${Math.round(b / Math.max(n, 1))})`);
    }
  }
  return tileColors[t] ?? new THREE.Color(0.5, 0.5, 0.5);
}

// ---------- furnaces, cooking, eating, sleeping ----------
const furnaceJobs = [];
function nearFurnace() {
  const px = Math.floor(P.x), py = Math.floor(P.y), pz = Math.floor(P.z);
  let best = null, bd = 1e9;
  for (let dy = -2; dy <= 3; dy++) for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const b = world.get(px + dx, py + dy, pz + dz);
    if (b === 59 || b === 60) { const d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = [px + dx, py + dy, pz + dz]; } }
  }
  return best;
}
function smelt(rc) {
  const f = nearFurnace();
  if (!f) { message('Stand next to a furnace to smelt. Make one from 8 stones (Smelting), place it, then click it.'); return; }
  for (const [ids, c] of rc.inputs) inv.removeAny(ids, c);
  furnaceJobs.push({ f, out: rc.out, n: rc.n, t: rc.out === 'ironIngot' ? 4 : 3 });
  sound.play('smelt');
  if (world.get(...f) === 59) setBlock(...f, 60);
  toast(`Smelting ${ITEM[rc.out].name}…`, rc.out);
  refreshHotbar(); renderPanel();
}
function updateFurnaces(dt) {
  const busy = new Set();
  for (let i = 0; i < furnaceJobs.length; i++) {
    const j = furnaceJobs[i], k = j.f.join(',');
    if (busy.has(k)) continue;
    busy.add(k);
    j.t -= dt;
    if (j.t <= 0) {
      furnaceJobs.splice(i, 1); i--;
      give(j.out, j.n);
      if (!furnaceJobs.some((o) => o.f.join(',') === k) && world.get(...j.f) === 60) setBlock(...j.f, 59);
    }
  }
  smokeT -= dt;
  if (smokeT <= 0 && furnaceJobs.length) { smokeT = 0.35; for (const k of busy) { const [x, y, z] = k.split(',').map(Number); smoke(x + 0.5, y + 1.1, z + 0.5); } }
}
let smokeT = 0;
function smoke(x, y, z) {
  const m = new THREE.Mesh(particleGeo, new THREE.MeshLambertMaterial({ color: 0x8c8c8c, transparent: true, opacity: 0.7 }));
  m.position.set(x, y, z); m.scale.setScalar(2);
  scene.add(m);
  particles.push({ m, vx: (Math.random() - 0.5) * 0.3, vy: 1.1, vz: (Math.random() - 0.5) * 0.3, t: -1.4 });
}
function furnaceRemoved(x, y, z) {
  for (let i = furnaceJobs.length - 1; i >= 0; i--) if (furnaceJobs[i].f.join(',') === [x, y, z].join(',')) { give(furnaceJobs[i].out, furnaceJobs[i].n); furnaceJobs.splice(i, 1); }
}
function cook(id) {
  inv.remove(id, 1);
  give(ITEM[id].cooked, 1);
  P.swing = 0.25;
  refreshHotbar();
}
function eat() {
  const s = heldItem();
  if (!s || !ITEM[s.id].food) { message('Hold some food to eat it (apples, bread, cooked meat…)'); return; }
  if (G.hunger >= 9.99) { message("You're full!"); return; }
  inv.remove(s.id, 1);
  G.hunger = Math.min(10, G.hunger + ITEM[s.id].food);
  sound.play('eat');
  toast(`Ate ${ITEM[s.id].name}`, s.id);
  refreshHotbar();
}
function sleep() {
  const h = (G.clock % 1440) / 60;
  if (h >= 6 && h < 19) { message('You can only sleep at night.'); return; }
  $('fade').classList.add('on');
  setTimeout(() => { G.clock = Math.floor(G.clock / 1440 + (h >= 19 ? 1 : 0)) * 1440 + 6 * 60; $('fade').classList.remove('on'); message('Good morning!'); }, 900);
}

// ---------- animals ----------
const entityGroup = new THREE.Group();
scene.add(entityGroup);
const mobs = [];
const SPECIES = {
  sheep: { body: 0xece8e0, head: 0xd7cdbd, legs: 0x5a4f45, size: [0.7, 0.7, 1.1], hp: 8, speed: 1.4, drops: [['rawMutton', 1, 2], ['wool', 1, 3]], name: 'sheep' },
  cow: { body: 0x5c3c26, head: 0xe9e2d5, legs: 0x3a2618, size: [0.85, 0.85, 1.4], hp: 10, speed: 1.3, drops: [['rawBeef', 1, 3], ['leather', 0, 2]], name: 'cow' },
  pig: { body: 0xe7a6a0, head: 0xeab1aa, legs: 0xd38f88, size: [0.65, 0.6, 1.0], hp: 8, speed: 1.4, drops: [['rawPork', 1, 3]], name: 'pig' },
  chicken: { body: 0xf2f0ea, head: 0xffffff, legs: 0xe5a83a, size: [0.35, 0.4, 0.45], hp: 4, speed: 1.7, drops: [['rawChicken', 1, 1], ['feather', 1, 2]], name: 'chicken' },
  goat: { body: 0xb8ab95, head: 0xc9bea9, legs: 0x5c5040, size: [0.55, 0.6, 0.9], hp: 8, speed: 1.6, drops: [['goatMeat', 1, 2], ['leather', 0, 1]], name: 'goat' },
  camel: { body: 0xc8a36a, head: 0xc8a36a, legs: 0xa9864f, size: [0.8, 1.1, 1.6], hp: 14, speed: 1.3, drops: [['leather', 1, 3]], name: 'camel' },
};
Object.assign(SPECIES, WILD);   // tigers, elephants, parrots, turtles… (animals.js)
// Every animal, wild or kept, is built the same way now: out of boxes in animals.js, with its own
// horns, ears, fleece or feathers. (Sheep, cows, pigs, chickens, goats and camels used to be plain
// blocks with two dots for eyes.)
function makeAnimal(kind) { return buildWild(kind); }
function addMob(kind, x, z, young = false) {
  const { g, legs, wings } = makeAnimal(kind);
  const y = world.groundY(Math.floor(x), Math.floor(z));
  const m = { kind, x, z, y, home: [x, z], tx: x, tz: z, wait: Math.random() * 3, hp: SPECIES[kind].hp, g, legs, wings, phase: 0, flee: 0, dead: false, young, age: 0, bred: -999 };
  if (young) g.scale.setScalar(0.55);
  g.userData.entity = m;
  g.position.set(x, y, z);
  entityGroup.add(g);
  mobs.push(m);
  return m;
}
let herdT = 0;
function updateHerds(dt) {
  herdT -= dt;
  if (herdT > 0) return;
  herdT = 3;
  for (let i = mobs.length - 1; i >= 0; i--) { const m = mobs[i]; if (!isKept(m) && !m.tame && Math.hypot(m.x - P.x, m.z - P.z) > 90) { entityGroup.remove(m.g); mobs.splice(i, 1); } }
  breed();
  if (mobs.filter((m) => !isKept(m) && !m.tame).length >= 22) return;
  const a = Math.random() * Math.PI * 2, d = 28 + Math.random() * 30;
  const [x, z] = world.nearestLand(Math.floor(P.x + Math.cos(a) * d), Math.floor(P.z + Math.sin(a) * d));
  if (Math.hypot(x - P.x, z - P.z) < 20) return;
  const bi = world.bio[z * world.n + x];
  const kinds = bi === 6 ? ['goat', 'camel'] : bi === 9 || bi === 10 ? ['goat', 'sheep'] : bi === 8 ? ['pig', 'cow', 'chicken'] : ['sheep', 'cow', 'chicken', 'pig'];
  let kind = kinds[Math.floor(Math.random() * kinds.length)];
  // Wild animals of this part of the world, on ground that suits them: lions and gazelles in the desert, pandas in
  // the bamboo hills of Shu, hippos in the Nile, ibex up the mountains, turtles on the beaches.
  let near = null, nd = 260;
  for (const [id, c] of Object.entries(G.cities)) { const dd = c ? Math.hypot(c.center[0] - x, c.center[1] - z) : Infinity; if (dd < nd) { nd = dd; near = id; } }
  const wetBy = [[3, 0], [-3, 0], [0, 3], [0, -3], [5, 5], [-5, -5]].some(([ox, oz]) => world.hasWater(x + ox, z + oz));
  const wild = wildHere(near ? LAND[near] : null, bi, wetBy);
  if (bi === 4 && Math.random() < 0.5) kind = 'turtle';
  else if (wild.length && Math.random() < 0.7) kind = wild[Math.floor(Math.random() * wild.length)];
  if (G.camp && Math.hypot(x - G.camp.spawn[0], z - G.camp.spawn[1]) < 45 && WILD[kind]?.temper === 'fight') kind = 'deer';   // nothing fierce right by your camp
  const count = GROUP[kind] ?? (kind === 'chicken' ? 4 : 3);
  for (let k = 0; k < count; k++) { const [mx, mz] = world.nearestLand(x + k * 2 - 2, z + (k % 2) * 2); addMob(kind, mx + 0.5, mz + 0.5); }
}
// ---------- riding ----------
// The same riding as the iPhone game. Each animal has its own pace, the ground it is fastest on, how high you
// sit, and how big a ledge it can step up. This is how the world really worked: a camel crossed sand that would
// kill a horse, a yak climbed where nothing else would go, and an elephant stepped over walls.
const GRASS = [1], SAND = [4, 21], SNOW = [6], ROCK = [3, 5];
const RIDE = {
  horse: { speed: 8.4, fast: 9.5, fastOn: GRASS, seat: 1.22, step: 1.05, back: 1.35, blanket: [0.62, 0.7],
    fact: 'Horses changed history. People on the grassy steppes north of the Black Sea tamed them more than 4,000 years ago, and a rider could suddenly go farther in a day than anyone had ever gone on foot. Feel how fast it is on grass!' },
  camel: { speed: 6.0, fast: 9.0, fastOn: SAND, seat: 1.42, step: 1.05, back: 1.40, blanket: [0.72, 0.66],
    fact: 'Camels can go for days without drinking, and their wide feet do not sink into sand. Caravans of camels carried silk, spices and salt across deserts that would have killed a horse. Feel how fast it is on sand!' },
  elephant: { speed: 5.0, fast: 5.6, fastOn: GRASS, seat: 2.35, step: 2.05, back: 2.12, blanket: [1.34, 1.7],
    fact: 'Asian elephants have carried people and heavy logs in India and Southeast Asia for thousands of years. Hannibal of Carthage even took elephants over the Alps. An elephant can step straight up a two-block ledge!' },
  yak: { speed: 5.5, fast: 7.0, fastOn: SNOW.concat(ROCK), seat: 1.32, step: 1.05, back: 1.42, blanket: [0.88, 0.9],
    fact: 'In the high mountains of Tibet, people ride yaks and live on their milk, wool and strength. The air up there is too thin for a horse. A yak is happiest on cold stone and snow.' },
};
// Animals people never rode, and why. (The iPhone game says the same.)
const NO_RIDE = {
  llama: 'Llamas carried packs for traders high in the Andes, but they are too small for a person to ride. Try a horse, a camel, an elephant or a yak!',
  cow: 'Cattle pulled ploughs and carts, but nobody rode them. Try a horse, a camel, an elephant or a yak!',
  aurochs: 'An aurochs is a wild ox as tall as a grown-up, and far too fierce to ride. Nobody ever tamed one.',
  deer: 'Deer are far too light and far too shy to carry a person.',
  ibex: 'An ibex lives on cliffs no rider could follow. It would never carry you.',
  ostrich: 'An ostrich can outrun a horse, but its back is not strong enough to carry a person.',
};
// No animal lets a stranger climb on its back. Offer it something to eat first, the way people have always
// made friends with animals: an apple, a handful of wheat, bread, figs or dates.
const TREATS = ['apple', 'wheat', 'bread', 'figs', 'dates', 'olives', 'honeyCake', 'puls'];
function offerTreat(m) {
  const s = heldItem();
  if (!s || !TREATS.includes(s.id)) {
    message(`The ${SPECIES[m.kind].name} won't let you near. Hold out an apple or some wheat and try again.`);
    return;
  }
  inv.remove(s.id, 1); refreshHotbar(); scheduleSave();
  m.tame = true; m.flee = 0; m.angry = 0; m.wait = 1;
  sound.play('tame');
  message(`The ${SPECIES[m.kind].name} eats the ${ITEM[s.id].name.toLowerCase()} and lets you stroke it. Press X again to ride.`);
  if (!G.talked.has('_tame')) { G.talked.add('_tame'); addStars(1, 'You tamed an animal!'); }
}
const seatY = (m) => (RIDE[m.kind]?.seat ?? 1.22) * (m.young ? 0.6 : 1);
/// A saddle blanket, so you can see at a glance which animal is yours to ride.
function saddle(m, on) {
  if (!on) { if (m.rug) { m.g.remove(m.rug); m.rug = null; } return; }
  if (m.rug) return;
  const r = RIDE[m.kind]; if (!r) return;
  const g = new THREE.Group(), y = (r.back ?? 1.3) + 0.04, [bw, bl] = r.blanket;
  g.add(boxMesh(bw, 0.08, bl, 0xa83a2e, 0, y, -0.05));
  // A gold band along each edge, the way a saddle cloth was woven.
  g.add(boxMesh(bw + 0.03, 0.06, bl * 0.16, 0xe8c44a, 0, y, -0.05 - bl * 0.42));
  g.add(boxMesh(bw + 0.03, 0.06, bl * 0.16, 0xe8c44a, 0, y, -0.05 + bl * 0.42));
  m.g.add(g); m.rug = g;
}
function mount(m) {
  if (NO_RIDE[m.kind]) { message(NO_RIDE[m.kind]); return; }
  if (m.flee > 0 || m.angry > 0) { message(`The ${SPECIES[m.kind].name} shies away. Come back when it has calmed down.`); return; }
  if (!m.tame) { offerTreat(m); return; }
  P.ride = m; m.ridden = true; m.wait = 0; m.toSea = null;
  saddle(m, true);
  message(`You climbed onto the ${SPECIES[m.kind].name}! W A S D to ride, Shift to go faster, X to get down.`);
  if (!G.talked.has('_ride')) { G.talked.add('_ride'); addStars(1, 'Your first ride!'); }
  // The first time you ride each kind, it has something to tell you.
  const key = 'ride:' + m.kind;
  if (!G.talked.has(key)) { G.talked.add(key); showCard(`Riding ${SPECIES[m.kind].name === 'elephant' ? 'an' : 'a'} ${SPECIES[m.kind].name}`, 'Riding animals', RIDE[m.kind].fact); }
}
function dismount() {
  const m = P.ride;
  P.ride = null;
  if (!m) return;
  m.ridden = false; m.tx = m.x; m.tz = m.z; m.wait = 2; m.home = [m.x, m.z];
  saddle(m, false);
  // Step down beside it, onto whatever ground is there.
  for (const [ox, oz] of [[1.3, 0], [-1.3, 0], [0, 1.3], [0, -1.3], [1.2, 1.2], [-1.2, -1.2], [0, 0]]) {
    const x = m.x + ox, z = m.z + oz, g = world.groundY(Math.floor(x), Math.floor(z), Math.floor(m.y + 1.2));
    if (g <= m.y + 1.2 && g > m.y - 4 && !world.solid(Math.floor(x), Math.floor(g), Math.floor(z)) && !world.solid(Math.floor(x), Math.floor(g) + 1, Math.floor(z))) { P.x = x; P.z = z; P.y = g; break; }
  }
  P.vy = 0; P.ground = true;
  message(`You got down off the ${SPECIES[m.kind].name}.`);
}
/// You steer with the same keys as walking; the animal turns and runs where you point it.
function updateRide(dt, fwd, side) {
  const m = P.ride;
  if (m.dead) { P.ride = null; return; }
  const amt = Math.min(Math.hypot(fwd, side), 1);
  let moved = false;
  if (amt > 0.08) {
    const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
    let vx = sy * fwd - cy * side, vz = cy * fwd + sy * side;
    const l = Math.hypot(vx, vz) || 1; vx /= l; vz /= l;
    const sprint = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
    // Faster on the ground it was made for: a horse on grass, a camel on sand, a yak on snow and stone.
    const r = RIDE[m.kind] ?? { speed: 6, fast: 6, fastOn: [], step: 1.05 };
    const under = world.get(Math.floor(m.x), Math.floor(m.y) - 1, Math.floor(m.z));
    const pace = r.fastOn.includes(under) ? r.fast : r.speed;
    const step = pace * (sprint ? 1.25 : 1) * amt * dt;
    const nx = m.x + vx * step, nz = m.z + vz * step;
    const g = world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(m.y + r.step));
    const wet = world.hasWater(Math.floor(nx), Math.floor(nz)) && g < WL - 0.5;
    if (!wet && g <= m.y + r.step && g > m.y - 3.5 && !world.solid(Math.floor(nx), Math.floor(g), Math.floor(nz)) && !world.solid(Math.floor(nx), Math.floor(g) + 1, Math.floor(nz))) {
      m.x = nx; m.z = nz; moved = true;
    }
    m.g.rotation.y = angleLerp(m.g.rotation.y, Math.atan2(vx, vz), Math.min(dt * 7, 1));
  }
  const g = world.groundY(Math.floor(m.x), Math.floor(m.z), Math.floor(m.y + (RIDE[m.kind]?.step ?? 1.05)));
  m.y = m.y < g ? Math.min(g, m.y + dt * 9) : Math.max(g, m.y - dt * 16);
  m.phase = moved ? m.phase + dt * 14 : 0;
  const sw = moved ? Math.sin(m.phase) * 0.75 : 0;
  m.legs.forEach((l, i) => { l.rotation.x = sw * (i === 0 || i === 3 ? 1 : -1); });
  m.g.position.set(m.x, m.y, m.z);
  // You sit astride, legs forward, reins in both hands, rising a little to the trot.
  P.x = m.x; P.z = m.z; P.y = m.y + seatY(m) + (moved ? Math.abs(Math.sin(m.phase)) * 0.06 : 0);
  P.vx = P.vz = 0; P.vy = 0; P.ground = true; P.water = false; P.walk = 0; P.heading = m.g.rotation.y;
  const b = playerBody;
  b.g.position.set(P.x, P.y, P.z);
  b.g.rotation.y = G.firstPerson ? P.yaw : angleLerp(b.g.rotation.y, m.g.rotation.y, Math.min(dt * 10, 1));
  b.legs[0].rotation.x = -1.35; b.legs[1].rotation.x = -1.35;
  b.arms[0].rotation.x = -0.75; b.arms[1].rotation.x = -0.75;
}

function updateMobs(dt) {
  for (const m of mobs) {
    if (m.dead || m.ridden) continue;   // the one you're riding is moved by updateRide
    const sp0 = SPECIES[m.kind], dP = Math.hypot(m.x - P.x, m.z - P.z);
    // The first time you come near something you could ride, say so — otherwise you'd never know.
    if (RIDE[m.kind] && !m.tame && !P.ride && dP < 7 && !G.talked.has('_ridehint')) {
      G.talked.add('_ridehint');
      message(`You could ride that ${SPECIES[m.kind].name}! Hold an apple, some wheat or a loaf of bread and press X to make friends with it.`);
    }
    // How each animal reacts to you. A frightened turtle heads for the sea, and a parrot takes off if you come close.
    if (sp0.temper === 'sea' && !m.inSea && !m.toSea && dP < 5) goToSea(m);
    if (sp0.temper === 'fly' && !m.fly && dP < 3.5 && !P.water) takeOff(m);
    if (m.fly) { flyMob(m, dt); continue; }
    if (m.angry > 0) {
      // Fighting back: it chases you and bites (twice at most), then gives up and slinks off.
      m.angry -= dt; m.biteT = Math.max(0, (m.biteT || 0) - dt);
      m.tx = P.x; m.tz = P.z; m.wait = 0;
      const reach = sp0.size[2] * 0.5 + 0.7;
      if (dP < reach && m.biteT <= 0 && Math.abs(P.y - m.y) < 1.8) { m.biteT = 1.4; m.bites = (m.bites || 0) + 1; hurt(sp0.bite || 1, m); }
      if (dP > 26 || m.bites >= 2 || G.health <= 0) { m.angry = 0; m.flee = 4; }
    } else if (m.flee > 0) { m.flee -= dt; const ax = m.x - P.x, az = m.z - P.z, l = Math.hypot(ax, az) || 1; m.tx = m.x + ax / l * 4; m.tz = m.z + az / l * 4; m.wait = 0; }
    let moving = false;
    const dx = m.tx - m.x, dz = m.tz - m.z, dist = Math.hypot(dx, dz);
    if (m.wait > 0) m.wait -= dt;
    else if (dist < 0.2) {
      if (m.toSea && m.toSea.n > 0) { m.toSea.n--; m.tx = m.x + m.toSea.dx * 3; m.tz = m.z + m.toSea.dz * 3; }   // keep swimming out a little
      else {
        if (m.toSea) { m.toSea = null; m.home = [m.x, m.z]; }
        m.wait = 1 + Math.random() * 4;
        for (let k = 0; k < 6; k++) {
          const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6, tx = m.home[0] + Math.cos(a) * r, tz = m.home[1] + Math.sin(a) * r;
          // A turtle in the sea stays in the sea; everyone else stays on land.
          if (m.inSea ? world.hasWater(Math.floor(tx), Math.floor(tz)) : true) { m.tx = tx; m.tz = tz; break; }
        }
      }
    } else {
      const fast = m.angry > 0 || m.flee > 0 || m.toSea;
      const sp = (fast ? (sp0.fast ?? sp0.speed * 1.9) : sp0.speed) * dt;
      const nx = m.x + dx / dist * Math.min(sp, dist), nz = m.z + dz / dist * Math.min(sp, dist);
      const g = world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(m.y + 1.05));
      const wet = world.hasWater(Math.floor(nx), Math.floor(nz)) && g < WL;
      if ((sp0.swims || !wet) && g <= m.y + 1.05 && (g > m.y - 3.5 || wet) && !world.solid(Math.floor(nx), Math.floor(Math.max(g, WL - 1)), Math.floor(nz))) {
        m.x = nx; m.z = nz; moving = true;
        m.g.rotation.y = angleLerp(m.g.rotation.y, Math.atan2(dx, dz), Math.min(dt * 6, 1));
      } else { m.tx = m.x; m.tz = m.z; if (m.angry > 0) m.angry = Math.min(m.angry, 0.5); }
    }
    const g = world.groundY(Math.floor(m.x), Math.floor(m.z), Math.floor(m.y + 1.05));
    m.inSea = sp0.swims && world.hasWater(Math.floor(m.x), Math.floor(m.z)) && g < WL;
    const floor = m.inSea ? WL - 0.62 + Math.sin(performance.now() / 700 + m.x) * 0.04 : g;   // swimmers float with their backs out of the water
    m.y = m.y < floor ? Math.min(floor, m.y + dt * 6) : Math.max(floor, m.y - dt * 10);
    m.phase = moving ? m.phase + dt * (m.angry > 0 || m.flee > 0 ? 16 : 10) : 0;
    m.legs.forEach((l, i) => { l.rotation.x = (moving ? Math.sin(m.phase) * 0.6 : 0) * (i === 0 || i === 3 ? 1 : -1); });
    if (m.wings) m.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (Math.sin(performance.now() / 900 + m.x) > 0.97 ? 0.6 : 0.05); });
    m.g.position.set(m.x, m.y, m.z);
    // Young animals grow up over about five minutes.
    if (m.young) { m.age += dt; const k = Math.min(m.age / 300, 1); m.g.scale.setScalar(0.55 + 0.45 * k); if (k >= 1) m.young = false; }
  }
}
/// A frightened sea turtle walks to the nearest water and swims out.
function goToSea(m) {
  const x0 = Math.floor(m.x), z0 = Math.floor(m.z);
  for (let r = 1; r <= 30; r++) for (let k = 0; k < r * 8; k++) {
    const a = k / (r * 8) * Math.PI * 2, x = Math.floor(x0 + Math.cos(a) * r), z = Math.floor(z0 + Math.sin(a) * r);
    if (!world.hasWater(x, z) || world.groundY(x, z) >= WL) continue;
    const l = Math.hypot(x - m.x, z - m.z) || 1;
    m.toSea = { n: 3, dx: (x - m.x) / l, dz: (z - m.z) / l }; m.tx = x + 0.5; m.tz = z + 0.5; m.wait = 0; m.flee = 0;
    return;
  }
  m.flee = 3;
}
/// A parrot takes off away from you, flies a long loop and lands somewhere else.
function takeOff(m) {
  const a = Math.atan2(m.x - P.x, m.z - P.z) + (Math.random() - 0.5);
  m.fly = { t: 0, a, base: m.y, turn: (Math.random() < 0.5 ? -1 : 1) * 0.25 };
}
function flyMob(m, dt) {
  const f = m.fly, sp = SPECIES[m.kind].fast;
  f.t += dt; f.a += f.turn * dt;
  m.x += Math.sin(f.a) * sp * dt; m.z += Math.cos(f.a) * sp * dt;
  m.x = Math.max(3, Math.min(world.n - 3, m.x)); m.z = Math.max(3, Math.min(world.n - 3, m.z));
  const g = world.groundY(Math.floor(m.x), Math.floor(m.z));
  const up = f.t < 7 ? Math.min(8, f.t * 3) : Math.max(0, 8 - (f.t - 7) * 2.5);
  m.y = Math.max(g, Math.max(g, f.base) + up);
  m.g.rotation.y = f.a;
  const flap = Math.sin(f.t * 22) * 0.9;
  m.wings.forEach((w, i) => { w.rotation.z = i ? -flap : flap; });
  m.g.position.set(m.x, m.y, m.z);
  if (f.t > 7 && m.y <= g + 0.01) { m.fly = null; m.home = [m.x, m.z]; m.tx = m.x; m.tz = m.z; m.wait = 2; m.wings.forEach((w) => { w.rotation.z = 0; }); }
}
// ---------- animals have young ----------
// Two or more grown animals of the same kind close together now and then have a baby (a lamb, a calf, a piglet…),
// as long as there's room: at most ten of a kind in one place. Animals kept near your camp stay when you travel, and are saved.
const YOUNG = { sheep: 'lamb', cow: 'calf', pig: 'piglet', chicken: 'chick', goat: 'kid', camel: 'camel calf' };
const isKept = (m) => G.camp && Math.hypot(m.home[0] - G.camp.spawn[0], m.home[1] - G.camp.spawn[1]) < 30;
let breedT = 30;
function breed() {
  breedT -= 3;
  if (breedT > 0) return;
  breedT = 20;
  if (mobs.length >= 48) return;
  const now = G.clock;
  for (const m of mobs) {
    if (m.dead || m.young || m.tame || WILD[m.kind]?.temper === 'fight' || now - m.bred < 180 || Math.random() > 0.3) continue;
    const mate = mobs.find((o) => o !== m && o.kind === m.kind && !o.dead && !o.young && now - o.bred >= 180 && Math.hypot(o.x - m.x, o.z - m.z) < 5);
    if (!mate) continue;
    if (mobs.filter((o) => o.kind === m.kind && Math.hypot(o.x - m.x, o.z - m.z) < 12).length >= 10) continue;
    m.bred = mate.bred = now;
    const baby = addMob(m.kind, (m.x + mate.x) / 2, (m.z + mate.z) / 2, true);
    baby.home = [...m.home];
    if (Math.hypot(m.x - P.x, m.z - P.z) < 30) toast(`A baby ${YOUNG[m.kind] || m.kind} was born!`);
    if (isKept(baby)) scheduleSave();
    return;   // one at a time
  }
}
function hitMob(m) {
  sound.play('hit');
  const dmg = toolDamage(heldTool());
  m.hp -= dmg; P.swing = 0.25;
  // Each animal answers in its own way: some fight back, some run, a parrot flies off, a turtle heads for the sea.
  const temper = SPECIES[m.kind].temper || 'flee';
  if (temper === 'fight' && m.hp > 0) { if (!(m.angry > 0)) { m.angry = 12; m.bites = 0; m.biteT = 0.6; if (!G.talked.has('wild:' + m.kind)) { G.talked.add('wild:' + m.kind); showCard(`The ${SPECIES[m.kind].name} is fighting back!`, 'Wild animals', SPECIES[m.kind].fact + '\n\nRun, or keep hitting it with a sword or spear. It bites twice at most, then gives up.'); } else message(`The ${SPECIES[m.kind].name} is fighting back! Run, or fight it with a sword.`); } }
  else if (temper === 'fly') takeOff(m);
  else if (temper === 'sea') goToSea(m);
  else m.flee = 2.5;
  m.g.traverse((o) => { if (o.material) { o.material.emissive?.setRGB(0.8, 0.1, 0.1); setTimeout(() => o.material.emissive?.setRGB(0, 0, 0), 160); } });
  if (m.hp <= 0) {
    m.dead = true;
    const g = m.g, t0 = performance.now();
    const fall = () => { const k = Math.min((performance.now() - t0) / 350, 1); g.rotation.z = k * Math.PI / 2; if (k < 1) requestAnimationFrame(fall); else setTimeout(() => entityGroup.remove(g), 700); };
    fall();
    for (const [id, a, b] of SPECIES[m.kind].drops) { const n = a + Math.floor(Math.random() * (b - a + 1)); if (n) dropItem(id, n, m.x, m.y + 0.6, m.z, 1.6); }
    mobs.splice(mobs.indexOf(m), 1);
  }
}


// ---------- sea creatures: fish in schools, sea turtles and jellyfish ----------
const swimmers = [];
const FISH = {
  clownfish: { body: 0xf2701c, stripe: 0xffffff, len: 0.32, speed: 1.5, school: [2, 4], name: 'clownfish' },
  blueTang: { body: 0x2456d6, stripe: 0xf2d22a, len: 0.4, speed: 1.8, school: [2, 5], name: 'blue tang' },
  yellowTang: { body: 0xf3d321, stripe: 0xfff2a0, len: 0.34, speed: 1.7, school: [3, 6], name: 'yellow tang' },
  sardine: { body: 0xaebccb, stripe: 0x4f6a85, len: 0.26, speed: 2.6, school: [8, 14], name: 'sardine' },
  turtle: { body: 0x7d8f45, shell: 0x5c4a2a, len: 1.0, speed: 0.8, school: [1, 1], name: 'sea turtle' },
  jellyfish: { body: 0xf2a6d8, len: 0.55, speed: 0.35, school: [2, 4], name: 'jellyfish' },
};
const fishMat = new Map();
function fmat(color, opts = {}) { const k = color + JSON.stringify(opts); let m = fishMat.get(k); if (!m) { m = new THREE.MeshLambertMaterial({ color, ...opts }); fishMat.set(k, m); } return m; }
function fbox(w, h, d, color, x, y, z, opts) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fmat(color, opts)); m.position.set(x, y, z); return m; }
function makeSwimmer(kind) {
  const f = FISH[kind], g = new THREE.Group(), L = f.len;
  let tail = null, fins = [];
  if (kind === 'turtle') {
    g.add(fbox(0.75, 0.22, 0.95, f.shell, 0, 0, 0));
    g.add(fbox(0.6, 0.12, 0.8, 0x8a6a3a, 0, 0.14, 0));
    g.add(fbox(0.26, 0.2, 0.3, f.body, 0, 0.02, 0.6));
    g.add(fbox(0.05, 0.05, 0.02, 0x111111, -0.09, 0.07, 0.75)); g.add(fbox(0.05, 0.05, 0.02, 0x111111, 0.09, 0.07, 0.75));
    for (const [x, z, l] of [[-0.5, 0.25, 0.5], [0.5, 0.25, 0.5], [-0.42, -0.35, 0.3], [0.42, -0.35, 0.3]]) { const p = new THREE.Group(); p.position.set(x, 0, z); p.add(fbox(l, 0.05, 0.2, f.body, Math.sign(x) * l / 2, 0, 0)); g.add(p); fins.push(p); }
  } else if (kind === 'jellyfish') {
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), fmat(f.body, { transparent: true, opacity: 0.6, emissive: 0x552244 }));
    g.add(bell); tail = bell;
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.add(fbox(0.025, 0.5, 0.025, 0xf7c6e6, Math.cos(a) * 0.14, -0.25, Math.sin(a) * 0.14, { transparent: true, opacity: 0.5 })); }
  } else {
    g.add(fbox(L * 0.32, L * 0.55, L, f.body, 0, 0, 0));
    if (kind === 'clownfish') for (const z of [-0.18, 0.12]) g.add(fbox(L * 0.34, L * 0.57, L * 0.12, f.stripe, 0, 0, z * L * 2));
    else g.add(fbox(L * 0.33, L * 0.12, L * 0.8, f.stripe, 0, -L * 0.18, 0));
    g.add(fbox(L * 0.06, L * 0.3, L * 0.3, f.body, 0, L * 0.38, -L * 0.05));
    g.add(fbox(0.03, 0.04, 0.04, 0x111111, -L * 0.17, L * 0.08, L * 0.32)); g.add(fbox(0.03, 0.04, 0.04, 0x111111, L * 0.17, L * 0.08, L * 0.32));
    tail = new THREE.Group(); tail.position.z = -L / 2;
    tail.add(fbox(L * 0.06, L * 0.5, L * 0.32, kind === 'blueTang' ? f.stripe : f.body, 0, 0, -L * 0.14));
    g.add(tail);
  }
  return { g, tail, fins };
}
function waterDepthAt(x, z) { let d = 0; for (let y = WL - 1; y > 0 && IS_WATERY[world.get(x, y, z)]; y--) d++; return d; }
let swimT = 0;
function spawnSwimmers(dt) {
  swimT -= dt;
  if (swimT > 0) return;
  swimT = 1.2;
  for (let i = swimmers.length - 1; i >= 0; i--) { const f = swimmers[i]; if (Math.hypot(f.x - P.x, f.z - P.z) > 64) { entityGroup.remove(f.g); swimmers.splice(i, 1); } }
  if (swimmers.length > 46) return;
  const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 22;
  const x = Math.floor(P.x + Math.cos(a) * d), z = Math.floor(P.z + Math.sin(a) * d);
  if (!world.inb(x, z)) return;
  const depth = waterDepthAt(x, z);
  if (depth < 2) return;
  const warm = z > world.n * 0.5, r = Math.random();
  let kind = 'sardine';
  if (warm) kind = r < 0.25 ? 'clownfish' : r < 0.47 ? 'blueTang' : r < 0.66 ? 'yellowTang' : r < 0.76 && depth >= 4 ? 'turtle' : r < 0.86 && depth >= 5 ? 'jellyfish' : 'sardine';
  else kind = r < 0.12 && depth >= 5 ? 'jellyfish' : 'sardine';
  const f = FISH[kind], count = f.school[0] + Math.floor(Math.random() * (f.school[1] - f.school[0] + 1));
  const y = WL - 1.5 - Math.random() * Math.max(0, depth - 2);
  let leader = null;
  for (let k = 0; k < count; k++) {
    const m = makeSwimmer(kind);
    const fish = { kind, x: x + 0.5 + (Math.random() - 0.5) * 2, y: y + (Math.random() - 0.5) * 0.6, z: z + 0.5 + (Math.random() - 0.5) * 2, vx: 0, vy: 0, vz: 0, tx: x, ty: y, tz: z, wait: 0, t: Math.random() * 10, leader, off: [(Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 2.2], ...m };
    if (!leader) leader = fish;
    fish.g.userData.entity = fish;
    entityGroup.add(fish.g);
    swimmers.push(fish);
  }
}
function wet(x, y, z) { return IS_WATERY[world.get(Math.floor(x), Math.floor(y), Math.floor(z))] === 1 && IS_WATERY[world.get(Math.floor(x), Math.floor(y + 0.35), Math.floor(z))] === 1; }
function updateSwimmers(dt) {
  spawnSwimmers(dt);
  for (const f of swimmers) {
    const spec = FISH[f.kind];
    f.t += dt;
    if (f.leader && swimmers.includes(f.leader)) { f.tx = f.leader.x + f.off[0]; f.ty = f.leader.y + f.off[1]; f.tz = f.leader.z + f.off[2]; }
    else {
      f.wait -= dt;
      if (f.wait <= 0 || Math.hypot(f.tx - f.x, f.ty - f.y, f.tz - f.z) < 0.4) {
        f.wait = 2 + Math.random() * 4;
        for (let tries = 0; tries < 6; tries++) {
          const tx = f.x + (Math.random() - 0.5) * 12, ty = f.y + (Math.random() - 0.5) * 3, tz = f.z + (Math.random() - 0.5) * 12;
          if (wet(tx, ty, tz)) { f.tx = tx; f.ty = ty; f.tz = tz; break; }
        }
      }
    }
    // Fish dart away from you.
    const px = f.x - P.x, py = f.y - (P.y + 1), pz = f.z - P.z, pd = Math.hypot(px, py, pz);
    let speed = spec.speed;
    if (pd < 3.2 && f.kind !== 'jellyfish' && f.kind !== 'turtle') { f.tx = f.x + px / pd * 5; f.ty = f.y + py / pd; f.tz = f.z + pz / pd * 5; speed *= 2.2; f.wait = 1; }
    const dx = f.tx - f.x, dy = f.ty - f.y, dz = f.tz - f.z, dl = Math.hypot(dx, dy, dz) || 1;
    const k = Math.min(dt * 2.5, 1);
    f.vx += (dx / dl * speed - f.vx) * k; f.vy += (dy / dl * speed * 0.5 - f.vy) * k; f.vz += (dz / dl * speed - f.vz) * k;
    if (f.kind === 'jellyfish') { f.vy += Math.sin(f.t * 1.6) * 0.25; }
    const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt, nz = f.z + f.vz * dt;
    if (wet(nx, ny, nz)) { f.x = nx; f.y = ny; f.z = nz; }
    else { f.vx = -f.vx * 0.5; f.vz = -f.vz * 0.5; f.vy = -f.vy; f.wait = 0; if (f.leader) { f.off[0] *= -1; f.off[2] *= -1; } }
    f.g.position.set(f.x, f.y, f.z);
    if (f.kind === 'jellyfish') { const s = 1 + Math.sin(f.t * 3.2) * 0.12; f.tail.scale.set(s, 1 / s, s); }
    else {
      const hv = Math.hypot(f.vx, f.vz);
      if (hv > 0.05) f.g.rotation.y = angleLerp(f.g.rotation.y, Math.atan2(f.vx, f.vz), Math.min(dt * 6, 1));
      f.g.rotation.x = -Math.atan2(f.vy, Math.max(hv, 0.2)) * 0.5;
      if (f.tail) f.tail.rotation.y = Math.sin(f.t * (6 + hv * 6)) * 0.45;
      f.fins.forEach((p, i) => { p.rotation.z = Math.sin(f.t * 2 + i) * 0.4 * (i % 2 ? 1 : -1); });
    }
  }
}
function touchSwimmer(f) {
  if (f.kind === 'turtle') { message('Sea turtles are endangered in the real world. Just enjoy watching this one glide by!'); return; }
  if (f.kind === 'jellyfish') { message("Careful! Jellyfish sting. Better to leave it alone."); P.vx -= Math.sin(P.yaw) * 4; P.vz -= Math.cos(P.yaw) * 4; return; }
  P.swing = 0.25;
  if (Math.random() < 0.6) {
    entityGroup.remove(f.g); swimmers.splice(swimmers.indexOf(f), 1);
    give('rawFish', 1);
    if (!G.found.has('_fish')) { G.found.add('_fish'); message(`You caught a ${FISH[f.kind].name}! Cook fish on a campfire.`); }
  } else { f.tx = f.x + (f.x - P.x) * 3; f.tz = f.z + (f.z - P.z) * 3; f.wait = 1; message('It got away!'); }
}

// ---------- the three relics of Atlantis ----------
const relicObjs = [];
let haloTex = null;
function spawnRelics() {
  if (!haloTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,230,140,0.9)'); gr.addColorStop(0.4, 'rgba(120,230,255,0.35)'); gr.addColorStop(1, 'rgba(120,230,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    haloTex = new THREE.CanvasTexture(c);
  }
  for (const r of G.relicSpots || []) {
    if (G.relics.has(r.id)) continue;
    const grp = new THREE.Group();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.set(1.6, 1.6, 1.6);
    // A detailed little sculpture (relics.js), turning slowly, with sparkles round it.
    const { g: model } = buildRelic(r.id);
    const sparkles = [];
    for (let k = 0; k < 5; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: 0xfff2b0 })); sp.scale.setScalar(0.18); grp.add(sp); sparkles.push(sp); }
    grp.add(halo, model);
    grp.userData.model = model; grp.userData.sparkles = sparkles;
    grp.position.set(r.x, r.y + 0.75, r.z);
    const ent = { kind: 'relic', id: r.id, x: r.x, z: r.z, base: r.y + 0.75, g: grp };
    grp.userData.entity = ent;
    entityGroup.add(grp);
    relicObjs.push(ent);
  }
}
function updateRelics(dt) {
  const t = performance.now() / 1000;
  for (const r of relicObjs) {
    r.g.position.y = r.base + Math.sin(t * 1.8 + r.x) * 0.12; r.g.children[0].material.opacity = 0.7 + Math.sin(t * 3 + r.z) * 0.25;
    const { model, sparkles } = r.g.userData;
    if (model) model.rotation.y = t * 0.6 + r.x;
    if (sparkles) sparkles.forEach((sp, k) => { const a = t * (0.8 + k * 0.13) + k * 1.3; sp.position.set(Math.cos(a) * 0.55, -0.3 + ((t * 0.4 + k * 0.2) % 1) * 1.1, Math.sin(a) * 0.55); sp.material.opacity = 0.5 + Math.sin(t * 6 + k * 2) * 0.5; });
  }
}
function takeRelic(r) {
  if (Math.hypot(r.x - P.x, r.z - P.z) > 4.5) { message('Walk closer to take it.'); return; }
  entityGroup.remove(r.g); relicObjs.splice(relicObjs.indexOf(r), 1);
  G.relics.add(r.id);
  give(r.id, 1);
  if (TOMB_TEXT[r.id]) {
    const got = [...G.relics].filter((x) => TOMB_TEXT[x]).length, left = 5 - got;
    addStars(left ? 1 : 3);
    const t = TOMB_TEXT[r.id];
    showCard(t.name, `Out of the tomb · ${got} of 5 · the Great Pyramid of Giza`, t.body
      + (left ? `\n\n${left} more lie somewhere in the pyramid.` : '\n\nYou have everything the pharaoh was buried with! Darius the trader would give a great deal for these.'));
  } else {
    const mine = [...G.relics].filter((x) => RELIC_TEXT[x]).length, all = mine >= 3;
    addStars(all ? 3 : 1);
    const t = RELIC_TEXT[r.id];
    showCard(t.name, `Relic ${mine} of 3 · Atlantis (a legend)`, t.body + (all ? '\n\nYou found all three relics of Atlantis! Three extra stars for you.' : `\n\n${3 - mine} more to find in this cave.`));
  }
  scheduleSave();
}

// ---------- people: guides at the wonders, and townspeople in the cities ----------
const npcs = [];
const LOOKS = {
  roman: [[0xdcae86, 0xece8dd, 0x8a3226], [0xc69772, 0xa83226, 0xece8dd], [0xb48262, 0x5d6d9c, 0x8c7656]],
  greek: [[0xdcae86, 0xf2efe2, 0x5d6d9c], [0xc69772, 0x5d6d9c, 0xf2efe2]],
  egyptian: [[0x9e6b47, 0xf2efe2, 0xf2efe2], [0x8c5e3d, 0xe9e4d4, 0xe9e4d4]],
  mesopotamian: [[0xbd8a61, 0x9c4b33, 0x9c4b33], [0xa87850, 0x4d5f99, 0x4d5f99]],
  persian: [[0xbd8a61, 0x4d5f99, 0x4d5f99], [0xa87850, 0xd2bb8c, 0xd2bb8c]],
  indus: [[0x94664a, 0xebe0c7, 0xc75c38], [0x805638, 0xc75c38, 0xebe0c7]],
  mesoamerican: [[0x9e6b47, 0xeae6d6, 0x338c73], [0x8c5e3d, 0xcc4d33, 0xeae6d6]],
  khmer: [[0xa37350, 0xb34d73, 0xd99a40], [0x94664a, 0x4d7359, 0xeae0cc]],
  judean: [[0xc69772, 0xece6d6, 0x8a7a5a], [0xb48262, 0x6a5a4a, 0xece6d6], [0xa87850, 0x3a5a8a, 0xd8c8a8]],
  punic: [[0xb48262, 0xf0e8d8, 0x6a2a6a], [0xa87850, 0x6a2a6a, 0xf0e8d8], [0x8c5e3d, 0xc9a46a, 0x5a4632]],
  chinese: [[0xe0bc94, 0x3a5a8a, 0x2a2a2a], [0xd4ac84, 0x6a6e74, 0x3a3a3a], [0xe0bc94, 0x8a3a2a, 0x2a2a2a], [0xd4ac84, 0x4a6a4a, 0x3a3a3a]],
};
function addNpc(kind, name, title, x, z, look, extra = {}) {
  const lk = { skin: look[0], shirt: look[1], sleeves: look[1], pants: look[2], hair: extra.hair ?? 0x8a8a86, robe: true, beard: extra.beard ?? kind === 'guide', longHair: true, necklace: true, hat: extra.hat };
  const body = person(lk);
  const y = world.groundY(Math.floor(x), Math.floor(z));
  const n = { kind, name, title, x, z, y, home: [x, z], tx: x, tz: z, wait: Math.random() * 3, roam: extra.roam ?? 8, body, phase: 0, ...extra };
  body.g.userData.entity = n;
  body.g.position.set(x, y, z);
  if (kind === 'guide') {
    const mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xffcc33 }));
    mark.position.y = 2.55; body.g.add(mark); n.mark = mark;
  }
  entityGroup.add(body.g);
  npcs.push(n);
  return n;
}
function spawnGuides() {
  for (const [id, p] of Object.entries(G.placed)) {
    const t = SITE_TEXT[id];
    if (!t) continue;
    const [gx, gz] = world.nearestLand(p.x + (id === 'greatWall' ? 3 : -14), p.z + 3);
    addNpc('guide', t.guide, t.title, gx + 0.5, gz + 0.5, [0xd2a07a, 0xd9b34a, 0x6b4e2e], { site: id, roam: 2.5 });
  }
}
// ---------- townspeople: crowds in the city streets ----------
// Each city's people are drawn as instances (one mesh per body part for the whole crowd), so a city can have
// well over a hundred people walking about without slowing the game down.
const crowds = new Map();
const PART_GEO = new THREE.BoxGeometry(1, 1, 1);
const MODEL_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const CROWD_MAT = new THREE.MeshLambertMaterial({ color: 0xffffff });   // one material for every body part of every crowd
const MODELS = {};   // tool, load and workplace models, made once and shared by every city
const modelGeo = (kind, name) => MODELS[kind + name] ??= kind === 'tool' ? toolGeometry(name) : boxModel(kind === 'load' ? LOADS[name] : PROPS[name]);
const _o = new THREE.Matrix4(), _m = new THREE.Matrix4(), _p = new THREE.Matrix4(), _r = new THREE.Matrix4(), _r2 = new THREE.Matrix4(), _s = new THREE.Matrix4(), _t = new THREE.Matrix4(), _l = new THREE.Matrix4(), _u = new THREE.Matrix4(), _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function seeded(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5 | 0; h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
const instanced = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); m.count = n; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; };
function makeCrowd(id, city) {
  const info = CITY_INFO[id], looks = LOOKS[info.style] || LOOKS.roman, n = city.count, rnd = seeded(id);
  const meshes = {};
  for (const [name] of BODY) meshes[name] = instanced(PART_GEO, CROWD_MAT, n);
  // About a third of the people are at work: each at their own workplace in front of a house or in a square,
  // spread out so no two workplaces are crowded together.
  const nWork = Math.round(n * 0.34), taken = [];
  const free = (q) => taken.every((t) => Math.abs(t[0] - q[0]) + Math.abs(t[1] - q[1]) > 3.5);
  // Only spots you can really stand on: a few street squares end up under a later building or the city wall, and a
  // person put there would be stuck inside it, walking on the spot.
  const standable = (q) => { if (q.length < 3) return false; const g = walkable(q[0], q[2], q[1]); return g !== null && Math.abs(g - q[2]) < 1.1; };
  const doorSpots = city.doors.filter(standable), streetSpots = city.streets.filter(standable);
  city.okStreets = streetSpots;
  if (scenery) scenery.decorateCity(id, city, info.style);
  const order = (arr) => arr.map((q) => [rnd(), q]).sort((u, v) => u[0] - v[0]).map((u) => u[1]);
  const homes = order(scenery?.stats[id]?.found?.map((f) => ({ f })) ?? []);
  const workPlaces = order([...doorSpots, ...order(streetSpots).slice(0, 400)]);
  const spots = [...streetSpots, ...streetSpots, ...doorSpots];
  const people = [], extras = { tool: {}, load: {}, prop: {} };
  for (let k = 0; k < n; k++) {
    const jobName = info.jobs[k % info.jobs.length][0], job = JOBS[jobName] || {};
    const worker = k < nWork;
    let sp = spots[(k * 7919 + 13) % spots.length] || city.center;
    let work = null;
    let fixedRot, homeDoor;
    // Craftspeople work at home: just inside the door of their own house, where you can see them through the doorway.
    if (worker && INDOOR.has(jobName)) {
      for (const door of homes) {
        if (door.used) continue;
        const spot = indoorSpot(door, job.prop);
        if (spot) { door.used = true; work = spot; sp = spot; fixedRot = spot[3]; homeDoor = door.f; break; }
      }
    }
    if (worker && !job.walks && !work) { const q = workPlaces.find(free); if (q) { taken.push(q); work = q; sp = q; } }
    const x = work ? sp[0] : sp[0] + (Math.random() - 0.5) * 0.6, z = work ? sp[1] : sp[1] + (Math.random() - 0.5) * 0.6;
    const d = dress(info.style, looks[k % looks.length], rnd);
    const pe = {
      kind: 'citizen', city: id, job: k, name: info.names[k % info.names.length], x, z, y: sp[2] ?? world.groundY(Math.floor(x), Math.floor(z)), rot: Math.random() * 6.28,
      tx: x, tz: z, wait: Math.random() * 4, phase: Math.random() * 6, t0: Math.random() * 10, moving: false, idle: Math.random() < 0.3, speed: 1 + Math.random() * 0.5,
      ...d, anim: worker ? job.anim : null, work, settled: false, lift: 0, fixedRot, indoor: fixedRot !== undefined, homeDoor,
    };
    if (worker && job.anim === 'run') pe.speed = 2.6 + Math.random() * 0.4;
    // What they hold, carry or work at (counted now, made into instanced models below).
    for (const [kind, name] of [['tool', worker && job.tool], ['load', worker && job.load], ['prop', work && job.prop]]) {
      if (!name) continue;
      const list = extras[kind][name] ??= [];
      pe[kind] = { name, i: list.length }; list.push(pe);
    }
    people.push(pe);
    BODY.forEach(([name, , , , key]) => meshes[name].setColorAt(k, _c.setHex(pe.colors[key])));
  }
  for (const m of Object.values(meshes)) m.instanceColor.needsUpdate = true;
  const models = {};
  for (const kind of ['tool', 'load', 'prop']) for (const [name, list] of Object.entries(extras[kind])) models[kind + name] = instanced(modelGeo(kind, name), MODEL_MAT, list.length);
  // Workplaces stay hidden until the ground under them has been built and we've found which way they can face.
  for (const pe of people) if (pe.prop) models['prop' + pe.prop.name].setMatrixAt(pe.prop.i, ZERO);
  const crowd = { id, city, meshes, models, people, visible: true };
  crowds.set(id, crowd);
  drawCrowd(crowd, 0);
  return crowd;
}
/// A worker's workplace goes in front of them, on level open ground; they face whichever way has room.
function settleWorker(c, pe) {
  const cx = Math.floor(pe.x), cz = Math.floor(pe.z);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (!chunks.has(chunkKey(Math.floor((cx + a * 3) / CS), Math.floor((cz + b * 3) / CS)))) return;
  pe.settled = true;
  const job = JOBS[CITY_INFO[pe.city].jobs[pe.job % CITY_INFO[pe.city].jobs.length][0]] || {};
  const g0 = walkable(pe.x, pe.y, pe.z);
  if (g0 === null) { pe.work = null; pe.anim = job.walks ? job.anim : null; if (pe.prop) c.models['prop' + pe.prop.name].setMatrixAt(pe.prop.i, ZERO); pe.prop = null; return; }
  pe.y = g0;
  if (pe.fixedRot !== undefined) {
    // At home: the workplace goes where we worked out when we chose the house.
    pe.workRot = pe.rot = pe.fixedRot;
    if (pe.prop) {
      const dist = PROP_DIST[pe.prop.name] ?? 0.85, fx = Math.sin(pe.fixedRot), fz = Math.cos(pe.fixedRot);
      _p.makeRotationY(pe.fixedRot + Math.PI).setPosition(pe.x + fx * dist, pe.y, pe.z + fz * dist);
      pe.propAt = [pe.x + fx * dist, pe.y, pe.z + fz * dist];
      c.models['prop' + pe.prop.name].setMatrixAt(pe.prop.i, _p);
      c.models['prop' + pe.prop.name].instanceMatrix.needsUpdate = true;
    }
    return;
  }
  if (!pe.prop) { pe.workRot = pe.rot = Math.floor(rnd4() * 4) * Math.PI / 2; return; }
  const dist = PROP_DIST[pe.prop.name] ?? 0.85, start = Math.floor(rnd4() * 4);
  for (let i = 0; i < 4; i++) {
    const r = ((start + i) % 4) * Math.PI / 2, fx = Math.sin(r), fz = Math.cos(r);
    // The workplace's spot (and, for long ones like a sledge, the ground halfway) must be clear and level.
    let ok = true;
    for (const f of dist > 1.2 ? [0.9, dist, dist + 0.8] : [Math.max(dist, 0.6)]) {
      const gx = walkable(pe.x + fx * f, pe.y, pe.z + fz * f);
      if (gx === null || Math.abs(gx - pe.y) > 0.01) ok = false;
    }
    if (!ok) continue;
    pe.workRot = pe.rot = r;
    _p.makeRotationY(r + Math.PI).setPosition(pe.x + fx * dist, pe.y, pe.z + fz * dist);
    pe.propAt = [pe.x + fx * dist, pe.y, pe.z + fz * dist];
    c.models['prop' + pe.prop.name].setMatrixAt(pe.prop.i, _p);
    c.models['prop' + pe.prop.name].instanceMatrix.needsUpdate = true;
    if (job.lift) { pe.lift = job.lift; }
    return;
  }
  // Nowhere to put it: they just work standing (a stall or loom that won't fit stays hidden).
  pe.workRot = pe.rot;
}
// Jobs done at home, in a workshop room (the others work out in the streets, fields and squares).
const INDOOR = new Set(['baker', 'potter', 'vase painter', 'sculptor', 'papyrus maker', 'glassblower', 'bead maker', 'weaver', 'seal carver', 'obsidian worker', 'mural painter', 'scribe', 'paper maker', 'silk weaver']);
/// A spot inside a house, near its door, with room in front for the workplace: [x, z, floor, facing], or null.
function indoorSpot({ f: [x, z, h, dx, dz] }, prop) {
  const qx = x - dx, qz = z - dz, ux = -dz, uz = dx;            // the doorway, and the direction along the wall
  const inside = (cx, cz) => world.get(cx, h, cz) === 0 && world.get(cx, h + 1, cz) === 0 && world.solid(cx, h - 1, cz) && !world.skyOpen(cx, h, cz);
  const path = (cx, cz) => (cx === qx - dx && cz === qz - dz) || (cx === qx - dx * 2 && cz === qz - dz * 2);   // keep the way in clear
  const dist = prop ? (PROP_DIST[prop] ?? 0.85) : 0;
  if (dist > 1.2) return null;
  for (const k of [1, 2, 3]) for (const l of [1, -1, 2, -2, 0]) {
    const wx = qx - dx * k + ux * l, wz = qz - dz * k + uz * l;
    if (!inside(wx, wz) || path(wx, wz)) continue;
    // Face sideways first (so you see them side-on from the door), then inward.
    for (const [fx, fz] of [[-ux * Math.sign(l || 1), -uz * Math.sign(l || 1)], [-dx, -dz], [ux * Math.sign(l || 1), uz * Math.sign(l || 1)]]) {
      if (prop) {
        const px = Math.floor(wx + 0.5 + fx * dist), pz = Math.floor(wz + 0.5 + fz * dist);
        if ((px !== wx || pz !== wz) && (!inside(px, pz) || path(px, pz))) continue;
      }
      return [wx + 0.5, wz + 0.5, h, Math.atan2(fx, fz)];
    }
  }
  return null;
}
let _seed4 = 1; const rnd4 = () => (_seed4 = (_seed4 * 16807) % 2147483647) / 2147483647;
const _joint = {};
function drawCrowd(c, time) {
  c.people.forEach((pe, k) => {
    const hidden = !chunks.has(chunkKey(Math.floor(pe.x / CS), Math.floor(pe.z / CS)));
    if (hidden) {
      for (const name in c.meshes) c.meshes[name].setMatrixAt(k, ZERO);
      if (pe.tool) c.models['tool' + pe.tool.name].setMatrixAt(pe.tool.i, ZERO);
      if (pe.load) c.models['load' + pe.load.name].setMatrixAt(pe.load.i, ZERO);
      return;
    }
    const po = pose(pe.talking ? null : pe.anim, time + pe.t0, pe.moving, pe.phase);
    _p.makeRotationY(pe.rot).setPosition(pe.x, pe.y + pe.lift, pe.z);
    // The upper body leans round the hips.
    _u.copy(_p).multiply(_t.makeTranslation(0, 0.75, 0)).multiply(_r.makeRotationX(po.lean)).multiply(_m.makeTranslation(0, -0.75, 0));
    for (const j in JOINTS) {
      const J = JOINTS[j], M = (_joint[j] ??= new THREE.Matrix4());
      M.copy(isUpper(j) ? _u : _p).multiply(_t.makeTranslation(J[0], J[1], J[2]));
      if (j === 'legL') M.multiply(_r.makeRotationX(po.legL));
      else if (j === 'legR') M.multiply(_r.makeRotationX(po.legR));
      else if (j === 'armL') M.multiply(_r.makeRotationX(po.armLx)).multiply(_r2.makeRotationZ(po.armLz));
      else if (j === 'armR') M.multiply(_r.makeRotationX(po.armRx)).multiply(_r2.makeRotationZ(po.armRz));
      else if (j === 'head') M.multiply(_r.makeRotationX(po.head));
    }
    for (const [name, joint, ctr, size] of BODY) {
      let cc = ctr, sz = size;
      if (name[0] === 'h' && name[1] === 'a' && name[2] === 't') {
        const piece = pe.hat?.find((q) => q[0] === name);
        if (!piece) { c.meshes[name].setMatrixAt(k, ZERO); continue; }
        sz = piece[1]; cc = piece[2];
      } else if ((name === 'robe' && !pe.robe) || (name === 'beard' && !pe.beard) || (name === 'hairBack' && !pe.longHair) || (name === 'neck' && !pe.necklace)) { c.meshes[name].setMatrixAt(k, ZERO); continue; }
      _o.copy(_joint[joint]).multiply(_t.makeTranslation(cc[0], cc[1], cc[2])).multiply(_s.makeScale(sz[0], sz[1], sz[2]));
      c.meshes[name].setMatrixAt(k, _o);
    }
    if (pe.tool) c.models['tool' + pe.tool.name].setMatrixAt(pe.tool.i, _joint.armR);
    if (pe.load) c.models['load' + pe.load.name].setMatrixAt(pe.load.i, _o.copy(_joint.head).multiply(_t.makeTranslation(0, 0.54, 0)));
  });
  for (const m of Object.values(c.meshes)) m.instanceMatrix.needsUpdate = true;
  for (const [key, m] of Object.entries(c.models)) if (!key.startsWith('prop')) m.instanceMatrix.needsUpdate = true;
}
function walkable(x, y, z) {
  const fx = Math.floor(x), fz = Math.floor(z);
  const g = world.groundY(fx, fz, Math.floor(y + 1.05));
  if (g > y + 1.05 || g < y - 2.5) return null;
  if (world.solid(fx, Math.floor(g), fz) || world.solid(fx, Math.floor(g) + 1, fz)) return null;
  if (IS_WATERY[world.get(fx, Math.floor(g), fz)]) return null;
  return g;
}
let crowdClock = 0, pathBudget = 0;
const STEPS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
/// The way from (x0, z0) to (x1, z1) over open ground, as square centres to walk through (null if there's no way within
/// about 24 blocks). Steps up or down at most one block; diagonal steps only where both squares beside them are open,
/// so nobody cuts through the corner of a wall. Then straight stretches are merged so people walk in smooth lines.
function findPath(x0, y0, z0, x1, z1) {
  const sx = Math.floor(x0), sz = Math.floor(z0), tx = Math.floor(x1), tz = Math.floor(z1);
  if (sx === tx && sz === tz) return [[x1, z1]];
  const key = (x, z) => (x + 2048) * 4096 + (z + 2048);
  const prev = new Map([[key(sx, sz), -1]]), ys = new Map([[key(sx, sz), y0]]), q = [[sx, sz]];
  const open = (x, z, y) => { const g = walkable(x + 0.5, y, z + 0.5); return g !== null && Math.abs(g - y) <= 1.05 ? g : null; };
  let found = false;
  for (let h = 0; h < q.length && q.length < 1400; h++) {
    const [x, z] = q[h], y = ys.get(key(x, z));
    if (x === tx && z === tz) { found = true; break; }
    for (const [dx, dz] of STEPS8) {
      const nx = x + dx, nz = z + dz, k = key(nx, nz);
      if (prev.has(k) || Math.abs(nx - sx) > 24 || Math.abs(nz - sz) > 24) continue;
      if (dx && dz && (open(x + dx, z, y) === null || open(x, z + dz, y) === null)) continue;
      const g = open(nx, nz, y);
      if (g === null) continue;
      prev.set(k, key(x, z)); ys.set(k, g); q.push([nx, nz]);
    }
  }
  if (!found) return null;
  const cells = [];
  for (let k = key(tx, tz); k !== -1; k = prev.get(k)) cells.push([Math.floor(k / 4096) - 2048 + 0.5, (k % 4096) - 2048 + 0.5]);
  cells.reverse();
  // Keep only the corners.
  const path = [];
  for (let i = 1; i < cells.length; i++) {
    const last = i === cells.length - 1;
    if (last) { path.push([x1, z1]); break; }
    const [ax, az] = cells[i - 1], [bx, bz] = cells[i], [cx, cz] = cells[i + 1];
    if (bx - ax !== cx - bx || bz - az !== cz - bz) path.push([bx, bz]);
  }
  return path;
}
function updateCities(dt) {
  crowdClock += dt;
  pathBudget = 8;      // ways worked out per frame, so a busy street never makes the game stutter
  for (const [id, city] of Object.entries(G.cities)) {
    if (!city || !city.count || !CITY_INFO[id]) continue;
    const d = Math.hypot(city.center[0] - P.x, city.center[1] - P.z) - city.R;
    let c = crowds.get(id);
    if (!c && d < 120) c = makeCrowd(id, city);
    if (!c) continue;
    const show = d < 150;
    if (show !== c.visible) { c.visible = show; for (const m of [...Object.values(c.meshes), ...Object.values(c.models)]) m.visible = show; }
    if (!show) continue;
    // Smoke rises from the bakers' ovens and the glassblowers' kilns.
    c.smokeT = (c.smokeT ?? 0) - dt;
    if (c.smokeT <= 0 && d < 60) {
      c.smokeT = 0.7;
      for (const pe of c.people) if (pe.propAt && (pe.prop?.name === 'oven' || pe.prop?.name === 'kiln') && Math.abs(pe.x - P.x) < 50 && Math.abs(pe.z - P.z) < 50 && Math.random() < 0.6)
        smoke(pe.propAt[0] + (Math.random() - 0.5) * 0.2, pe.propAt[1] + (pe.prop.name === 'kiln' ? 1.4 : 1.0), pe.propAt[2] + (Math.random() - 0.5) * 0.2);
    }
    for (const pe of c.people) {
      if (pe.talking) { pe.moving = false; pe.rot = angleLerp(pe.rot, Math.atan2(P.x - pe.x, P.z - pe.z), Math.min(dt * 8, 1)); continue; }
      if (Math.abs(pe.x - P.x) > 90 || Math.abs(pe.z - P.z) > 90) continue;
      // Workers stay at their workplace and get on with their job (turning back to it after a chat).
      if (pe.work) { if (!pe.settled) settleWorker(c, pe); else if (pe.workRot !== undefined) pe.rot = angleLerp(pe.rot, pe.workRot, Math.min(dt * 4, 1)); pe.moving = false; continue; }
      pe.moving = false;
      if (pe.wait > 0) {
        // Standing about: now and then glance round, like people do.
        pe.wait -= dt;
        if (pe.look !== undefined) pe.rot = angleLerp(pe.rot, pe.look, Math.min(dt * 3, 1));
        if (Math.random() < dt * 0.25) pe.look = pe.rot + (Math.random() - 0.5) * 2.2;
        continue;
      }
      if (!pe.path || !pe.path.length) {
        // Somewhere new: another spot in the streets nearby, and the way there along open ground (round corners,
        // never through walls). If there's no way through, try somewhere else in a moment.
        if (pathBudget <= 0) continue;
        pathBudget--;
        const streets = city.okStreets || city.streets;
        const near = streets.filter((q) => Math.abs(q[0] - pe.x) < 16 && Math.abs(q[1] - pe.z) < 16);
        const q = near.length ? near[Math.floor(Math.random() * near.length)] : streets[Math.floor(Math.random() * streets.length)];
        pe.path = q ? findPath(pe.x, pe.y, pe.z, q[0], q[1]) : null;
        pe.look = undefined;
        if (!pe.path) { pe.wait = 0.5 + Math.random(); continue; }
        continue;
      }
      const [wx, wz] = pe.path[0], dx = wx - pe.x, dz = wz - pe.z, dist = Math.hypot(dx, dz);
      if (dist < 0.12) {
        pe.path.shift();
        if (!pe.path.length) pe.wait = pe.idle ? 4 + Math.random() * 10 : 0.5 + Math.random() * 3;   // there: stop for a while
        continue;
      }
      const step = Math.min(pe.speed * dt, dist), nx = pe.x + dx / dist * step, nz = pe.z + dz / dist * step;
      const g = walkable(nx, pe.y, nz);
      if (g === null) { pe.path = null; pe.wait = 0.4; continue; }       // something new in the way (you built a wall?): find another way
      pe.x = nx; pe.z = nz; pe.y = pe.y < g ? Math.min(g, pe.y + dt * 8) : Math.max(g, pe.y - dt * 10); pe.moving = true;
      pe.phase += dt * 8;
      // Face the way you're walking (turning smoothly round corners).
      pe.rot = angleLerp(pe.rot, Math.atan2(dx, dz), Math.min(dt * 7, 1));
    }
    drawCrowd(c, crowdClock);
  }
}
/// The townsperson your pointer is on, if any (a quick box test instead of testing every body part).
const _box = new THREE.Box3(), _hit = new THREE.Vector3();
function aimCrowd(r, maxT) {
  let best = null, bt = maxT;
  for (const c of crowds.values()) {
    if (!c.visible) continue;
    for (const pe of c.people) {
      if (Math.abs(pe.x - P.x) > 8 || Math.abs(pe.z - P.z) > 8) continue;
      _box.min.set(pe.x - 0.32, pe.y, pe.z - 0.32); _box.max.set(pe.x + 0.32, pe.y + 2.05, pe.z + 0.32);
      if (r.intersectBox(_box, _hit)) { const t = _hit.distanceTo(r.origin); if (t < bt) { bt = t; best = pe; } }
    }
  }
  return best ? { who: best, t: bt } : null;
}
function updateNpcs(dt) {
  villageClock += dt;
  for (const n of npcs) {
    if (!n.body.g.visible) continue;
    if (Math.hypot(n.x - P.x, n.z - P.z) > 120) continue;
    // In the saddle: he goes wherever his horse goes, and sits there while he talks to you.
    if (n.mounted && !n.mounted.dead) {
      const h = n.mounted;
      n.x = h.x; n.z = h.z; n.y = h.y + (h.kind === 'camel' ? 1.42 : 1.22);
      n.body.g.position.set(n.x, n.y, n.z);
      n.body.g.rotation.y = n.talking ? angleLerp(n.body.g.rotation.y, Math.atan2(P.x - n.x, P.z - n.z), Math.min(dt * 8, 1)) : h.g.rotation.y;
      n.body.legs[0].rotation.x = -1.35; n.body.legs[1].rotation.x = -1.35;
      n.body.arms[0].rotation.x = -0.8; n.body.arms[1].rotation.x = -0.8;
      continue;
    }
    // Villagers with a job stay at their workplace and get on with it.
    if (n.kind === 'villager' && n.v.spot && !n.talking) {
      const r = ROLES[n.v.role], po = pose(r.anim, villageClock + n.phase0, false, 0);
      n.body.g.rotation.y = angleLerp(n.body.g.rotation.y, n.v.spot[3], Math.min(dt * 4, 1));
      n.body.legs[0].rotation.x = po.legL; n.body.legs[1].rotation.x = po.legR;
      n.body.arms[0].rotation.set(po.armLx, 0, po.armLz); n.body.arms[1].rotation.set(po.armRx, 0, po.armRz);
      n.body.g.position.set(n.x, n.y, n.z);
      continue;
    }
    // A refugee who has just arrived walks straight up to you to ask for help (and you decide their job).
    if (n.seek) {
      const d = Math.hypot(P.x - n.x, P.z - n.z);
      if (d > 70 || n.v.role) n.seek = false;
      else if (d < 2.6 && !openPanel && !dialogueOpen && !D.mode) { n.seek = false; n.talking = true; if (document.pointerLockElement) document.exitPointerLock(); villageTalk(n, 'start'); }
      else { n.tx = P.x + (n.x - P.x) / d * 1.8; n.tz = P.z + (n.z - P.z) / d * 1.8; n.wait = 0; }
    }
    let moving = false;
    if (n.talking) { n.body.g.rotation.y = angleLerp(n.body.g.rotation.y, Math.atan2(P.x - n.x, P.z - n.z), Math.min(dt * 8, 1)); }
    else {
      const dx = n.tx - n.x, dz = n.tz - n.z, dist = Math.hypot(dx, dz);
      if (n.wait > 0) n.wait -= dt;
      else if (dist < 0.2) { n.wait = 2 + Math.random() * 5; const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * n.roam; n.tx = n.home[0] + Math.cos(a) * r; n.tz = n.home[1] + Math.sin(a) * r; }
      else {
        const spd = n.seek ? 2.4 : 1.2, nx = n.x + dx / dist * Math.min(spd * dt, dist), nz = n.z + dz / dist * Math.min(spd * dt, dist);
        const g = world.groundY(Math.floor(nx), Math.floor(nz), Math.floor(n.y + 1.05));
        if (g <= n.y + 1.05 && g > n.y - 2.5 && !world.solid(Math.floor(nx), Math.floor(g), Math.floor(nz)) && !world.solid(Math.floor(nx), Math.floor(g) + 1, Math.floor(nz)) && !(world.hasWater(Math.floor(nx), Math.floor(nz)) && g < WL)) {
          n.x = nx; n.z = nz; moving = true;
          n.body.g.rotation.y = angleLerp(n.body.g.rotation.y, Math.atan2(dx, dz), Math.min(dt * 8, 1));
        } else { n.tx = n.x; n.tz = n.z; }
      }
    }
    const g = world.groundY(Math.floor(n.x), Math.floor(n.z), Math.floor(n.y + 1.05));
    n.y = n.y < g ? Math.min(g, n.y + dt * 8) : Math.max(g, n.y - dt * 10);
    n.phase = moving ? n.phase + dt * 8 : 0;
    const sw = moving ? Math.sin(n.phase) * 0.6 : 0;
    n.body.legs[0].rotation.x = sw; n.body.legs[1].rotation.x = -sw; n.body.arms[0].rotation.x = -sw; n.body.arms[1].rotation.x = sw;
    n.body.g.position.set(n.x, n.y, n.z);
    if (n.mark) n.mark.rotation.y += dt * 2;
  }
}
function interact(who) {
  if (SPECIES[who.kind]) { hitMob(who); return; }
  if (FISH[who.kind]) { touchSwimmer(who); return; }
  if (who.kind === 'relic') { takeRelic(who); return; }
  if (Math.hypot(who.x - P.x, who.z - P.z) > 5) { message(`Walk closer to talk to ${who.name}`); return; }
  who.talking = true;
  talkPage(who, 'start');
}
function talkPage(who, page) {
  if (who.kind === 'refugee' || who.kind === 'villager') { villageTalk(who, page); return; }
  if (who.kind === 'trader' || who.kind === 'hunter') { travellerTalk(who, page); return; }
  let text = '', choices = [];
  if (who.kind === 'guide') {
    const t = SITE_TEXT[who.site];
    if (page === 'more') { text = t.more; if (!G.talked.has(who.site)) { G.talked.add(who.site); addStars(1, `${who.name} taught you about ${t.name}!`); } choices = [['Back', 'start'], ['Goodbye', null]]; }
    else { text = `${t.hello} I'm ${who.name}, ${who.title.toLowerCase()}. ${t.fact}`; choices = [['Tell me more', 'more'], ['Goodbye', null]]; }
    showDialogue(who.name, who.title, text, choices.map(([l, p]) => [l, () => p ? talkPage(who, p) : closeDialogue(who)]));
    return;
  }
  const info = CITY_INFO[who.city], job = info.jobs[who.job % info.jobs.length], city = SITE_TEXT[who.city].name;
  const talk = TALK[who.city];
  if (!G.talked.has(who.name + who.city)) { G.talked.add(who.name + who.city); }
  const title = job[0][0].toUpperCase() + job[0].slice(1);
  // Each person starts at a different fact on each subject, and tells you the next one if you ask again.
  who.asked ??= {};
  const pick = (key, list) => {
    const n = who.asked[key] ?? 0; who.asked[key] = n + 1;
    const i = (who.job * 7 + who.name.length + n) % list.length;
    const id = `fact:${who.city}:${key}:${i}`;
    if (!G.talked.has(id)) {
      G.talked.add(id);
      const learned = [...G.talked].filter((k) => k.startsWith('fact:')).length;
      if (learned % 5 === 0) addStars(1, `You've learned ${learned} facts from the people of the ancient world! A star for you.`);
    }
    return list[i];
  };
  const go = (p) => () => talkPage(who, p);
  const bye = ['Goodbye', () => closeDialogue(who)];
  const more = ['Ask something else', go('ask')];
  const topics = [['What do you eat?', 'food'], ['What do children do here?', 'kids'], ['What are homes like?', 'home'], ['What do people believe?', 'gods'], ['What do you do for fun?', 'fun']];
  const show = (text, choices) => showDialogue(who.name, title, text, choices);
  if (!talk) {   // (every city has its own facts; this is only a safety net)
    show(`Hello! I'm ${who.name}, ${/^[aeiou]/i.test(job[0]) ? 'an' : 'a'} ${job[0]} here in ${city}. ${job[1]}`, [bye]);
    return;
  }
  const jobFacts = talk.jobs[job[0]] || [job[1]];
  const order = ORDERS[job[0]], askOrder = order ? [['Could you make something for me?', go('order')]] : [];
  if (page === 'start') {
    const hello = talk.hello[(who.job + who.name.length) % talk.hello.length];
    const me = info.style === 'indus'
      ? `We don't know what people here called themselves, because nobody can read our writing yet. Just call me ${who.name}.`
      : `I'm ${who.name}, ${/^[aeiou]/i.test(job[0]) ? 'an' : 'a'} ${job[0]} here in ${city}.`;
    show(`${hello} ${me} ${pick('job', jobFacts)}`, [['Tell me more about your work', go('job')], ...askOrder, ['Ask about life here', go('life')], ['Tell me about the famous buildings', go('wonder')], ['Teach me a word', go('word')], bye]);
  } else if (page === 'ask') {
    show('What would you like to know?', [['Tell me more about your work', go('job')], ...askOrder, ['Ask about life here', go('life')], ['Tell me about the famous buildings', go('wonder')], ['Teach me a word', go('word')], bye]);
  } else if (page === 'order' && order) {
    // Ask a craftsperson to make you something, in return for goods (people often bartered, goods for goods).
    const [item, n] = order.make, wants = order.want.map(([w, c]) => `${c} ${ITEM[w].name.toLowerCase()}`).join(' and ');
    const have = order.want.every(([w, c]) => inv.count(w) >= c);
    show(`I can make you ${n > 1 ? n + ' ' : (/^[aeiou]/i.test(ITEM[item].name) ? 'an ' : 'a ')}${ITEM[item].name.toLowerCase()}. In return, I'd like ${wants}.${have ? '' : ' Come back when you have them!'}`,
      have ? [[`Deal! (give ${wants})`, go('deal')], ['Maybe later', go('ask')], bye] : [['All right', go('ask')], bye]);
  } else if (page === 'deal' && order) {
    if (!order.want.every(([w, c]) => inv.count(w) >= c)) { talkPage(who, 'order'); return; }
    for (const [w, c] of order.want) inv.remove(w, c);
    const [item, n] = order.make, left = inv.add(item, n);
    if (left) dropItem(item, left, P.x, P.y + 1, P.z);
    refreshHotbar(); scheduleSave();
    if (!G.talked.has('order:' + who.city + ':' + job[0])) { G.talked.add('order:' + who.city + ':' + job[0]); addStars(1, `${who.name} made you something! A star for trading in ${city}.`); }
    show(order.done, [['Thank you!', go('ask')], bye]);
  } else if (page === 'life') {
    show(`Ask me anything about life in ${city} ${info.when}!`, [...topics.map(([l, k]) => [l, go(k)]), ['How many people live here?', go('people')], ['Back', go('ask')]]);
  } else if (page === 'job') {
    show(pick('job', jobFacts), [['Tell me more', go('job')], more, bye]);
  } else if (page === 'wonder') {
    show(pick('wonder', talk.wonder), [['Tell me more', go('wonder')], more, bye]);
  } else if (page === 'word') {
    show(pick('words', talk.words), [['Another word', go('word')], more, bye]);
  } else if (page === 'people') {
    const people = crowds.get(who.city)?.people.length || 1;
    const each = Math.round(info.population / people / (info.population / people > 10000 ? 1000 : 100)) * (info.population / people > 10000 ? 1000 : 100);
    show(`${info.guess ? 'Nobody counted for sure, but historians think perhaps' : 'About'} ${info.population.toLocaleString()} people lived in ${city} ${info.when}. In this game, each person you meet in the streets stands for about ${each.toLocaleString()} real people, so imagine how crowded it really was!`, [['Ask about life here', go('life')], more, bye]);
  } else if (talk[page]) {
    show(pick(page, talk[page]), [['Tell me more', go(page)], ['Ask about life here', go('life')], bye]);
  }
}

// ---------- refugees and your village ----------
let villageClock = 0, refugeeT = 70;   // the first refugee comes along about a minute after you start
/// A spot near camp for someone's work, with level ground in front for their workplace: [x, z, y, facing].
// ---------- the travellers from the phone game ----------
// Darius the trader with his llama, and Tarkan the hunter with his horse, iron spear and eagle, camp near your home.
// (The third, the refugee looking for a new home, arrives on the road now and then: see updateVillage.)
const TRADES = {
  darius: [[['planks', 3], ['wheatSeeds', 4]], [['copperOre', 3], ['tea', 2]], [['planks', 8], ['silk', 2]], [['goldIngot', 1], ['blueCloth', 4]], [['tea', 1], ['coal', 4]], [['wool', 4], ['dates', 3]],
    // What came out of the pharaoh's tomb. Darius has never seen the like, and pays for it.
    [['goldenMask', 1], ['goldIngot', 9]], [['ankh', 1], ['goldIngot', 6]], [['canopicJar', 1], ['goldIngot', 5]],
    [['scarab', 1], ['goldIngot', 4]], [['shabti', 1], ['goldIngot', 4]]],
  tarkan: [[['leather', 4], ['ironSpear', 1]], [['leather', 2], ['ironOre', 2]], [['apple', 3], ['leather', 1]], [['rawBeef', 2], ['feather', 3]], [['wool', 2], ['fishingRod', 1]]],
};
let eagle = null;
function spawnTravellers() {
  if (!G.camp) return;
  const [cx, cz] = G.camp.spawn;
  const [dx, dz] = world.nearestLand(Math.floor(cx + 10), Math.floor(cz + 6));
  const d = addNpc('trader', 'Darius', 'Traveller', dx + 0.5, dz + 0.5, [0xbd8a5c, 0x1f3a8c, 0x1f3a8c], { roam: 4, who: 'darius',
    hat: [['hat1', [0.56, 0.2, 0.56], [0, 0.5, 0], 0xf0c24c], ['hat2', [0.42, 0.14, 0.42], [0, 0.66, 0], 0xe8b438]], beard: true, hair: 0x1e140c });
  d.body.g.add(boxMesh(0.62, 0.18, 0.18, 0x2a5fb0, 0, 1.55, -0.24));   // a rolled blue silk rug on his back
  d.body.g.add(boxMesh(0.66, 0.06, 0.2, 0xe0b84a, 0, 1.55, -0.24));
  const llama = addMob('llama', d.x + 1.5, d.z - 1); llama.follow = d; llama.tame = true;
  const [hx, hz] = world.nearestLand(Math.floor(cx - 11), Math.floor(cz - 8));
  const h = addNpc('hunter', 'Tarkan', 'Hunter', hx + 0.5, hz + 0.5, [0xcc9a70, 0x75522e, 0x4c3c2a], { roam: 5, who: 'tarkan',
    hat: [['hat1', [0.56, 0.22, 0.56], [0, 0.5, 0], 0x8a7058], ['hat2', [0.62, 0.08, 0.62], [0, 0.4, 0], 0xb8a080]], hair: 0x5a3820 });
  h.body.g.add(boxMesh(0.16, 0.6, 0.16, 0x6e4428, 0.18, 1.25, -0.22));   // a quiver of arrows on his back
  for (const ox of [0.14, 0.2, 0.24]) h.body.g.add(boxMesh(0.03, 0.2, 0.03, 0xe8e2d0, ox, 1.63, -0.22));
  if (ICON_CANVAS.has('ironSpear')) { const spear = new THREE.Mesh(itemModel('ironSpear', 'hand'), MODEL_MAT); h.body.arms[1].add(spear); }
  // Tarkan hunts from horseback, the way hunters did from Persia to the steppe. The horse roams near camp and he
  // rides it; nobody else can take his horse.
  const [phx, phz] = world.nearestLand(Math.floor(h.x + 2), Math.floor(h.z - 1));
  const horse = addMob('horse', phx + 0.5, phz + 0.5); horse.tame = true; horse.mount = h; horse.home = [phx + 0.5, phz + 0.5]; h.mounted = horse;
  // His eagle circles high overhead.
  const g = new THREE.Group(), wings = [];
  g.add(boxMesh(0.22, 0.2, 0.5, 0x5a3a20, 0, 0, 0)); g.add(boxMesh(0.18, 0.18, 0.18, 0xf2efe6, 0, 0.04, 0.32)); g.add(boxMesh(0.06, 0.06, 0.08, 0xe8b830, 0, 0.02, 0.44)); g.add(boxMesh(0.2, 0.04, 0.22, 0xf2efe6, 0, 0, -0.34));
  for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 0.1, 0.04, 0); w.add(boxMesh(0.7, 0.03, 0.3, 0x4a2e18, sx * 0.35, 0, 0)); g.add(w); wings.push(w); }
  scene.add(g); eagle = { g, wings, owner: h, a: 0 };
}
function updateTravellers(dt) {
  for (const m of mobs) if (m.follow && !m.angry && !(m.flee > 0)) { m.home = [m.follow.x + 1.4, m.follow.z - 1]; if (Math.hypot(m.x - m.home[0], m.z - m.home[1]) > 3) { m.tx = m.home[0]; m.tz = m.home[1]; m.wait = 0; } }
  if (eagle) { eagle.a += dt * 0.35; const o = eagle.owner, r = 9; eagle.g.position.set(o.x + Math.cos(eagle.a) * r, o.y + 13 + Math.sin(eagle.a * 2) * 0.8, o.z + Math.sin(eagle.a) * r); eagle.g.rotation.y = -eagle.a; eagle.g.rotation.z = -0.3; eagle.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(performance.now() / 260) * 0.25; }); }
}
const itemName = (id, n) => `${n} ${ITEM[id].name}`;
function travellerTalk(who, page) {
  const go = (pg) => () => travellerTalk(who, pg), bye = ['Goodbye', () => closeDialogue(who)];
  const trades = TRADES[who.who];
  if (page.startsWith('trade:')) {
    const [[give, gn], [get, n]] = trades[Number(page.slice(6))];
    if (inv.count(give) < gn) { showDialogue(who.name, who.title, `You need ${itemName(give, gn)} for that. Come back when you have them!`, [['Back', go('trade')], bye]); return; }
    inv.remove(give, gn); const left = inv.add(get, n); if (left) dropItem(get, left, P.x, P.y + 1, P.z); refreshHotbar();
    if (!G.talked.has('trade:' + who.who)) { G.talked.add('trade:' + who.who); addStars(1, `Your first trade with ${who.name}!`); }
    scheduleSave();
    showDialogue(who.name, who.title, `A fair trade! Here ${n > 1 ? 'are' : 'is'} your ${itemName(get, n).toLowerCase()}. People traded like this for thousands of years before coins were invented.`, [['More trades', go('trade')], bye]);
    return;
  }
  if (page === 'trade') {
    const text = who.who === 'darius' ? 'Take a look. Fair prices, I promise. I\'ve had the same llama for nine years, so you know I\'m trustworthy.' : 'Bring me hides and I\'ll share my gear. A good hunter never wastes a skin.';
    showDialogue(who.name, who.title, text, [...trades.map(([[g, gn], [t, n]], k) => [`${itemName(t, n)} for ${itemName(g, gn)}${inv.count(g) >= gn ? '' : ' (you need more)'}`, go('trade:' + k)]), ['Back', go('start')]]);
    return;
  }
  if (who.who === 'darius') {
    if (page === 'story') { showDialogue(who.name, who.title, 'West, along the Silk Road, to the great cities. Rome pays well for Chinese silk! But the roads are not safe. When empires go to war, whole villages lose their homes. You may meet people looking for refuge. Oh, and plant wheat beside a river. Every great city started with farms by the water.', [['Let\'s trade', go('trade')], bye]); return; }
    showDialogue(who.name, who.title, 'Greetings, friend! I am Darius. My llama and I have crossed deserts and mountains. I carry blue silk rugs from the East, and tea that makes any meal sing.', [['Let\'s trade', go('trade')], ['Where are you going?', go('story')], bye]);
    return;
  }
  if (page === 'teach') { showDialogue(who.name, who.title, 'Click an animal to strike it. Swords and spears hit much harder than your fists. But be careful: tigers, jaguars, boars, crocodiles and elephants fight back! Deer and horses run, parrots fly off and sea turtles head for the water. Cows give leather, sheep give wool, chickens give feathers. My eagle spots them all from the sky.', [['Let\'s trade', go('trade')], bye]); return; }
  showDialogue(who.name, who.title, 'Shh… you\'ll scare the game. I\'m Tarkan, a hunter. My horse carries me far, and my eagle finds prey from the sky. This iron spear has never missed.', [['Let\'s trade', go('trade')], ['Teach me to hunt', go('teach')], bye]);
}

function villageSpot(prop) {
  const c = G.camp, [hx, hz] = c.house, [px0, pz0, px1, pz1] = c.pen;
  const busy = (x, z) => (x >= hx - 1 && x <= hx + 5 && z >= hz - 1 && z <= hz + 6) || (x >= px0 - 1 && x <= px1 + 1 && z >= pz0 - 1 && z <= pz1 + 1)
    || G.villagers.some((v) => v.spot && Math.abs(v.spot[0] - x - 0.5) + Math.abs(v.spot[1] - z - 0.5) < 3.5);
  const dist = PROP_DIST[prop] ?? 0.85;
  for (let r = 6; r <= 14; r++) for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2 + r, x = Math.floor(hx + 2 + Math.cos(a) * r), z = Math.floor(hz + 2 + Math.sin(a) * r);
    if (busy(x, z)) continue;
    const y = walkable(x + 0.5, world.groundY(x, z), z + 0.5);
    if (y === null || IS_WATER[world.get(x, Math.floor(y) - 1, z)]) continue;
    for (let q = 0; q < 4; q++) {
      const rot = q * Math.PI / 2, fx = Math.sin(rot), fz = Math.cos(rot);
      const py = walkable(x + 0.5 + fx * dist, y, z + 0.5 + fz * dist);
      if (py === null || Math.abs(py - y) > 0.01 || busy(Math.floor(x + 0.5 + fx * dist), Math.floor(z + 0.5 + fz * dist))) continue;
      return [x + 0.5, z + 0.5, y, rot];
    }
  }
  return null;
}
function addVillager(v) {
  const look = REFUGEE_LOOKS[v.look % REFUGEE_LOOKS.length];
  const body = person({ skin: look[0], shirt: look[1], sleeves: look[1], pants: look[2], hair: [0x241a12, 0x3a2716, 0x1a1410, 0x5a4632][v.look % 4], robe: v.look % 2 === 0, beard: v.look % 3 === 1, longHair: v.look % 2 === 1, belt: 0x5a3a22 });
  const at = v.spot || v.home;
  const n = { kind: v.role ? 'villager' : 'refugee', name: v.name, title: v.role ? ROLES[v.role].title : 'Refugee', x: at[0], z: at[1], y: world.groundY(Math.floor(at[0]), Math.floor(at[1])),
    home: v.home, tx: v.home[0], tz: v.home[1], wait: 1, roam: 3, body, phase: 0, phase0: Math.random() * 10, v };
  if (!v.role) { const pack = boxMesh(0.42, 0.42, 0.3, 0xa8946a, 0, 1.2, -0.3); body.g.add(pack); n.pack = pack; }   // everything they own, in a bundle
  body.g.userData.entity = n;
  body.g.position.set(n.x, n.y, n.z);
  entityGroup.add(body.g);
  npcs.push(n);
  if (v.role) setUpWork(n);
  return n;
}
/// Give a villager the tool for their job and build their workplace.
function setUpWork(n) {
  const v = n.v, r = ROLES[v.role];
  if (n.toolMesh) { n.body.arms[1].remove(n.toolMesh); n.toolMesh = null; }
  if (n.propMesh) { entityGroup.remove(n.propMesh); n.propMesh = null; }
  if (n.pack) { n.body.g.remove(n.pack); n.pack = null; }
  if (!v.spot) v.spot = villageSpot(r.prop);
  if (!v.spot) v.spot = [n.x, n.z, n.y, 0];
  [n.x, n.z, n.y] = v.spot; n.home = [n.x, n.z]; n.tx = n.x; n.tz = n.z;
  if (r.tool) { n.toolMesh = new THREE.Mesh(modelGeo('tool', r.tool), MODEL_MAT); n.toolMesh.castShadow = true; n.body.arms[1].add(n.toolMesh); }
  if (r.prop) {
    const d = PROP_DIST[r.prop] ?? 0.85, rot = v.spot[3];
    n.propMesh = new THREE.Mesh(modelGeo('prop', r.prop), MODEL_MAT); n.propMesh.castShadow = n.propMesh.receiveShadow = true;
    n.propMesh.position.set(n.x + Math.sin(rot) * d, n.y, n.z + Math.cos(rot) * d); n.propMesh.rotation.y = rot + Math.PI;
    entityGroup.add(n.propMesh);
  }
  n.kind = 'villager'; n.title = r.title;
}
function spawnVillagers() { for (const v of G.villagers) addVillager(v); }
function updateVillage(dt) {
  if (!G.camp || openPanel || dialogueOpen) return;
  // A refugee arrives every four to six minutes, while you're near camp and the village has room.
  refugeeT -= dt;
  if (refugeeT <= 0) {
    refugeeT = 240 + Math.random() * 120;
    const [cx, cz] = G.camp.spawn;
    if (G.villagers.length < 8 && Math.hypot(P.x - cx, P.z - cz) < 90) {
      const used = new Set(G.villagers.map((v) => v.name)), freeNames = REFUGEE_NAMES.filter((nm) => !used.has(nm)), name = freeNames[Math.floor(Math.random() * freeNames.length)];
      const a = Math.random() * Math.PI * 2, [sx, sz] = world.nearestLand(Math.floor(cx + Math.cos(a) * 22), Math.floor(cz + Math.sin(a) * 22));
      const v = { name: name || 'Traveller', role: null, look: Math.floor(Math.random() * 20), home: [cx + (Math.random() - 0.5) * 6, cz + 2 + Math.random() * 2], why: Math.floor(Math.random() * WHY.length), spot: null };
      G.villagers.push(v);
      const n = addVillager(v);
      n.x = sx + 0.5; n.z = sz + 0.5; n.y = world.groundY(sx, sz); n.tx = v.home[0]; n.tz = v.home[1]; n.wait = 0; n.seek = true;
      toast(`A refugee called ${v.name} is coming to find you…`);
      scheduleSave();
    }
  }
  // Every morning, your villagers bring you what they've made.
  const day = Math.floor(G.clock / 1440), hour = (G.clock % 1440) / 60;
  if (day > G.giftDay && hour >= 6) {
    G.giftDay = day;
    const got = new Map();
    for (const v of G.villagers) if (v.role) for (const [id, k] of ROLES[v.role].gift) got.set(id, (got.get(id) || 0) + k);
    if (got.size) {
      for (const [id, k] of got) { const left = inv.add(id, k); if (left) dropItem(id, left, P.x, P.y + 1, P.z); }
      refreshHotbar();
      toast('Good morning! Your villagers brought you: ' + [...got].map(([id, k]) => `${k} ${ITEM[id].name.toLowerCase()}`).join(', ') + '.');
      scheduleSave();
    }
  }
}
function villageTalk(who, page) {
  const v = who.v, go = (p) => () => villageTalk(who, p), bye = ['Goodbye', () => closeDialogue(who)];
  const jobs = Object.entries(ROLES).map(([k, r]) => [r.title, go('job:' + k)]);
  if (page.startsWith('job:')) {
    const role = page.slice(4), r = ROLES[role], first = !v.role;
    if (v.role !== role) { v.role = role; v.spot = null; setUpWork(who); }
    if (first && !G.talked.has('village:first')) { G.talked.add('village:first'); addStars(1, `${v.name} joined your village!`); }
    scheduleSave();
    showDialogue(v.name, r.title, `${first ? 'Thank you! We have a home again. ' : ''}${r.say} Every morning I'll bring you ${r.gift.map(([id, k]) => `${k} ${ITEM[id].name.toLowerCase()}`).join(' and ')}.`, [['Welcome to the village!', () => closeDialogue(who)]]);
    return;
  }
  if (!v.role) {
    // You decide what work each newcomer does: they set up their workplace beside your camp straight away.
    if (page === 'jobs') { showDialogue(v.name, 'Refugee', `Thank you… thank you! I'll work hard. You choose: what job should I do in your village?`, [...jobs, ['Let me think about it', () => closeDialogue(who)]]); return; }
    if (page === 'later') { showDialogue(v.name, 'Refugee', 'I understand. I\'ll wait by your camp. Come and find me if you change your mind.', [bye]); return; }
    showDialogue(v.name, 'Refugee', `Please… help me. ${WHY[v.why ?? 0]} I've walked for days. I'm ${v.name}. May I find refuge here with you?`, [["Yes, you're safe here", go('jobs')], ["I can't help right now", go('later')]]);
    return;
  }
  const r = ROLES[v.role];
  if (page === 'change') { showDialogue(v.name, r.title, 'What would you like me to do instead?', [...jobs, ['Stay as you are', go('start')]]); return; }
  showDialogue(v.name, r.title, `Hello! ${r.say} Every morning I bring you ${r.gift.map(([id, k]) => `${k} ${ITEM[id].name.toLowerCase()}`).join(' and ')}.`, [['Could you do a different job?', go('change')], bye]);
}

// ---------- discovering the wonders ----------
const rectDist = (r, px, pz) => Math.max(Math.max(r[0] - px, 0, px - (r[2] + 1)), Math.max(r[1] - pz, 0, pz - (r[3] + 1)));
function siteOf(x, y, z) { const v = world.protected.get(world.idx(x, y, z)); return v === undefined ? null : v; }
let discoverT = 0;
function updateDiscovery(dt) {
  discoverT -= dt;
  if (discoverT > 0) return;
  discoverT = 0.5;
  for (const [id, p] of Object.entries(G.placed)) {
    if (G.found.has(id) || rectDist(p.rect, P.x, P.z) > 9) continue;
    G.found.add(id);
    const t = SITE_TEXT[id];
    addStars(1);
    showCard(`You found ${['giza', 'greatWall'].includes(id) ? 'the ' : ''}${t.name}!`, `${t.place} · ${t.date}`, `${t.fact}\n\nLook for ${t.guide} (the gold diamond) to learn more and earn another star.` + (id === 'atlantis' ? '\n\nIn this game, a narrow shaft in the floor of Poseidon\'s temple leads down to a hidden cave with three relics. Climb down the ladder!' : '')
      + (id === 'giza' ? '\n\nThere is a doorway on the north face of the Great Pyramid, nine courses up, with steps leading to it. Inside are the passages to the burial chamber — and the pharaoh\'s treasure. Take a torch.' : ''));
    return;
  }
  // The famous buildings inside each city: a note the first time you walk up to one.
  for (const [id, city] of Object.entries(G.cities)) {
    if (!city || !city.monuments) continue;
    for (const m of city.monuments) {
      const key = 'm:' + m.name;
      if (G.found.has(key) || Math.hypot(m.x - P.x, m.z - P.z) > 11) continue;
      G.found.add(key);
      message(`${m.name} · ${SITE_TEXT[id]?.name ?? ''}`);
      scheduleSave();
      return;
    }
  }
  // Battles and other great events: a card (and a star) the first time you reach each one's marker stone.
  const ne = events && events.nearest(P.x, P.z);
  if (ne && ne.d < 24 && !G.found.has('ev:' + ne.e.id)) {
    const e = ne.e;
    G.found.add('ev:' + e.id); addStars(1);
    const who = e.kind === 'land' ? `\n\nWatch the ${ARMIES[e.sides[0]].name} and the ${ARMIES[e.sides[1]].name} re-enact it.` : e.kind === 'sea' ? `\n\nWatch the fleets re-enact it: ${FLEETS_OF[e.sides[0]].name} against ${FLEETS_OF[e.sides[1]].name}.` : '';
    showCard(e.name, `${e.date} · ${e.kind === 'event' ? 'A turning point in history' : 'A great battle'}`, e.text + who);
    return;
  }
  // The ships: a card about each kind the first time you get close to one — the warships out at sea, and the
  // working boats tied up in the ports.
  const ns = ships && ships.nearest(P.x, P.z);
  if (ns && ns.d < 40 && !G.found.has('ship:' + ns.s.type)) {
    const t = ns.s.t;
    G.found.add('ship:' + ns.s.type); addStars(1);
    const where = t.yours ? 'Yours, and nobody else\'s' : `${t.civil ? 'In the port of' : 'Warship ·'} ${SITE_TEXT[ns.s.city]?.name ?? ''}`;
    showCard(`You spotted ${t.title.replace(/^An? /, (a) => a.toLowerCase())}!`, where,
      t.body + '\n\nSwim up to its side and press Space (or the jump button) to climb aboard. Then walk to the stern and press X to take the steering oars yourself.');
    return;
  }
  const cy = G.canyon;
  if (cy && !G.found.has('_canyon') && P.x >= cy.rect[0] && P.x <= cy.rect[2] && P.z >= cy.rect[1] && P.z <= cy.rect[3] && P.y < WL + 12) {
    G.found.add('_canyon'); addStars(1);
    showCard(`You found ${CANYON_TEXT.name}!`, CANYON_TEXT.place, CANYON_TEXT.body);
    return;
  }
  const rs = G.relicSpots;
  if (rs && rs.length && !G.found.has('_cave')) {
    const mx = rs.reduce((a, r) => a + r.x, 0) / rs.length, mz = rs.reduce((a, r) => a + r.z, 0) / rs.length;
    if (Math.hypot(P.x - mx, P.z - mz) < 9 && P.y < rs[0].y + 4) { G.found.add('_cave'); addStars(1); showCard(CAVE_TEXT.name, CAVE_TEXT.place, CAVE_TEXT.body); }
  }
}
function addStars(n, why) { sound.play('star'); G.stars += n; if (why) toast(why); refreshHud(); scheduleSave(); }

// ---------- the player ----------
function blockTop(b) { return b === 34 || BLOCKS[b].gate ? 1.5 : BLOCKS[b].shape === 'bed' ? 0.56 : 1; }
function collides(x, y, z) {
  for (let by = Math.floor(y); by <= Math.floor(y + 1.79); by++)
    for (let bz = Math.floor(z - 0.3); bz <= Math.floor(z + 0.3); bz++)
      for (let bx = Math.floor(x - 0.3); bx <= Math.floor(x + 0.3); bx++) {
        const b = world.get(bx, by, bz);
        if (IS_SOLID[b] && y < by + blockTop(b) && y + 1.8 > by) return true;
      }
  return !!ships && ships.solid(x, y, z);   // a warship's hull, and its deck to stand on
}
function updatePlayer(dt) {
  if (G.hover) { P.vx = P.vy = P.vz = 0; playerBody.g.position.set(P.x, P.y, P.z); return; }   // (testing: hang in the air for overview pictures)
  const k = input.keys;
  let fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
  let side = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
  if (input.mode === 'touch') { fwd = input.joy.y; side = input.joy.x; }
  if (openPanel || dialogueOpen) { fwd = 0; side = 0; }
  if (P.steering) { fwd = 0; side = 0; }   // at the steering oars your hands are full: W A S D sails the ship instead
  if (P.ride) { updateRide(dt, fwd, side); return; }   // in the saddle, W A S D rides
  const amt = Math.min(Math.hypot(fwd, side), 1);
  const fx0 = Math.floor(P.x), fz0 = Math.floor(P.z);
  const feet = world.get(fx0, Math.floor(P.y + 0.4), fz0);
  P.water = IS_WATERY[feet] === 1 || IS_WATERY[world.get(fx0, Math.floor(P.y + 1.2), fz0)] === 1;
  P.ladder = world.get(fx0, Math.floor(P.y + 0.2), fz0) === 73 || world.get(fx0, Math.floor(P.y + 1.2), fz0) === 73;
  const flowV = P.water ? currentAt(fx0, Math.floor(P.y + 0.4), fz0) : [0, 0, 0];
  const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
  const speed = (P.water ? 2.6 : sprint ? 6.4 : 4.3) * (G.hunger <= 0 ? 0.7 : 1);
  let vx = 0, vz = 0;
  if (amt > 0.08) {
    const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
    // Forward is where the camera looks.
    const fx2 = sy, fz2 = cy, rx = -cy, rz = sy;
    vx = (fx2 * fwd + rx * side) / Math.max(amt, 1e-3) * amt * speed;
    vz = (fz2 * fwd + rz * side) / Math.max(amt, 1e-3) * amt * speed;
    P.heading = Math.atan2(vx, vz);
    P.walk += dt * 9 * amt;
    breaking = null;
  } else P.walk = 0;
  // Running water carries you along.
  vx += flowV[0] * 2.2; vz += flowV[2] * 2.2;
  P.vx += (vx - P.vx) * Math.min(dt * (P.water ? 6 : 14), 1);
  P.vz += (vz - P.vz) * Math.min(dt * (P.water ? 6 : 14), 1);
  // Gravity, jumping, swimming and climbing.
  if (P.ladder) {
    const up = k.has('Space') || (input.mode === 'touch' ? false : fwd > 0.5 && blockedAhead()), down = k.has('ShiftLeft') || k.has('ShiftRight') || fwd < -0.5;
    P.vy = up ? 3.2 : down ? -3.2 : -0.6;
    P.ground = false;
  } else if (P.water) {
    // Water holds you up: you sink slowly, and Space swims you up. Falling water pushes you down.
    P.vy += (k.has('Space') ? 5 : -1.6) * dt * 4 + flowV[1] * dt * 14;
    P.vy *= Math.max(0, 1 - dt * 1.5);
    P.vy = Math.max(-3, Math.min(P.vy, 4));
    // Look down and swim forward (or hold Shift) to dive; look up to come back up.
    const diving = k.has('ShiftLeft') || k.has('ShiftRight');
    if (amt > 0.08) P.vy += Math.sin(P.pitch) * fwd * dt * 12;
    if (diving) P.vy -= dt * 10;
    P.vy = Math.max(-3.5, Math.min(P.vy, 4));
    if (!k.has('Space') && !diving && !(amt > 0.08 && P.pitch < -0.3) && world.get(Math.floor(P.x), Math.floor(P.y + 1.5), Math.floor(P.z)) === 0) P.vy = Math.max(P.vy, 0) * 0.5;
  } else {
    P.vy -= 28 * dt;
    if (P.ground && k.has('Space')) { P.vy = 8.6; P.ground = false; sound.play('jump'); }
  }
  // Move one axis at a time; step up one block automatically.
  for (const axis of ['x', 'z']) {
    const step = (axis === 'x' ? P.vx : P.vz) * dt;
    if (!step) continue;
    const nx = axis === 'x' ? P.x + step : P.x, nz = axis === 'z' ? P.z + step : P.z;
    if (!collides(nx, P.y, nz)) { P.x = nx; P.z = nz; }
    else if ((P.ground || P.water) && !collides(nx, P.y + 1.05, nz) && !collides(P.x, P.y + 1.05, P.z)) {
      // A step up (only one block: two-block walls are too tall to walk up).
      let top = P.y + 1.05;
      while (top > P.y && !collides(nx, top - 0.05, nz)) top -= 0.05;
      // Your eyes rise smoothly onto the step instead of jumping up a whole block in one frame.
      P.eyeLag = Math.max(-1.2, (P.eyeLag || 0) - (top - P.y));
      P.y = top; P.x = nx; P.z = nz;
    }
  }
  const ny = P.y + P.vy * dt;
  if (collides(P.x, ny, P.z)) {
    if (P.vy < 0) {
      // Land exactly on the surface (a search between where you were and where you'd fall to). Landing to the nearest
      // centimetre used to leave you hovering a little, so you'd drop and land again every few frames: a shiver, and
      // sometimes no step-up because you weren't "on the ground" that frame.
      P.ground = true;
      if (!collides(P.x, P.y, P.z)) { let lo = ny, hi = P.y; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (collides(P.x, m, P.z)) lo = m; else hi = m; } P.y = hi; }
      else { let y = ny; while (collides(P.x, y, P.z) && y < ny + 2) y += 0.01; P.y = y; }
    }
    P.vy = 0;
  } else { P.y = ny; P.ground = false; }
  P.x = Math.max(1, Math.min(world.n - 1, P.x)); P.z = Math.max(1, Math.min(world.n - 1, P.z));
  if (P.y < -10) { P.y = world.groundY(Math.floor(P.x), Math.floor(P.z)) + 1; P.vy = 0; }
  // Body.
  const b = playerBody;
  b.g.position.set(P.x, P.y, P.z);
  b.g.rotation.y = G.firstPerson ? P.yaw : angleLerp(b.g.rotation.y, P.heading ?? b.g.rotation.y, Math.min(dt * 12, 1));
  const sw = P.walk ? Math.sin(P.walk) * 0.75 : 0;
  b.legs[0].rotation.x = sw; b.legs[1].rotation.x = -sw; b.arms[0].rotation.x = -sw;
  if (breaking || P.swing > 0) { P.swing = Math.max(0, P.swing - dt); b.arms[1].rotation.x = breaking ? -1.3 + Math.sin(performance.now() / 60) * 0.6 : -1.6 * Math.sin(P.swing / 0.25 * Math.PI); }
  else b.arms[1].rotation.x = sw;
}
function blockedAhead() { const x = P.x + Math.sin(P.yaw) * 0.45, z = P.z + Math.cos(P.yaw) * 0.45; return collides(x, P.y + 0.05, z) || world.get(Math.floor(x), Math.floor(P.y + 0.5), Math.floor(z)) === 73; }
const angleLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };

let shake = 0;
function updateCamera(dt) {
  if (P.eyeLag) { P.eyeLag *= Math.exp(-dt * 14); if (P.eyeLag > -0.002) P.eyeLag = 0; }
  const head = new THREE.Vector3(P.x, P.y + 1.62 + (P.eyeLag || 0), P.z);
  const dir = new THREE.Vector3(Math.sin(P.yaw) * Math.cos(P.pitch), Math.sin(P.pitch), Math.cos(P.yaw) * Math.cos(P.pitch));
  let fp = G.firstPerson;
  if (!fp) {
    // Back off behind your head until something solid is in the way.
    const back = dir.clone().negate();
    let d = 0.4, allowed = G.camDist;
    while (d < G.camDist) { const q = head.clone().addScaledVector(back, d); const bb = world.get(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z)); if (IS_CUBE[bb] && !IS_CUT[bb]) { allowed = Math.max(d - 0.35, 0.3); break; } d += 0.2; }
    camCur = allowed < camCur ? allowed : camCur + (allowed - camCur) * Math.min(dt * 3, 1);
    if (camCur < 1.1) fp = true;
    else camera.position.copy(head).addScaledVector(back, camCur).add(new THREE.Vector3(0, 0.25, 0));
  }
  if (fp) camera.position.copy(head);
  playerBody.g.visible = !fp;
  // The hand bobs as you walk and swings when you dig, hit or build.
  fpHand.visible = fp && !D.mode;
  if (fp) {
    const bob = P.walk ? Math.sin(P.walk) : 0, sw = breaking ? Math.sin(performance.now() / 70) * 0.5 + 0.5 : P.swing > 0 ? Math.sin(P.swing / 0.25 * Math.PI) : 0;
    fpHand.position.set(0.3 + bob * 0.02, -0.3 - Math.abs(bob) * 0.025 - sw * 0.04, -0.9 - sw * 0.06);
    fpHand.rotation.set(0.25 - sw * 0.9, -0.18, sw * 0.15);
  }
  camera.lookAt(camera.position.clone().add(dir));
  if (shake > 0) { shake = Math.max(0, shake - dt); const s = shake * 0.3; camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s; }
  sky.position.copy(camera.position);
}
let camCur = 5.5;

// ---------- day and night ----------
let localLight = 1, localT = 0;
const SUN_STEP = Math.PI / 720, SHADOW_TEXEL = 96 / 2048;      // the shadow camera is 96 blocks across, 2048 texels
const _toSun = new THREE.Vector3(), _sx = new THREE.Vector3(), _sy = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _target = new THREE.Vector3();
const C = (r, g, b) => new THREE.Color(r, g, b);
function updateDaylight(dt) {
  G.clock += dt * (openPanel || dialogueOpen ? 0 : 1);
  const hour = (G.clock % 1440) / 60;
  let light = 1;
  if (hour < 5 || hour >= 20) light = 0.38; else if (hour < 7) light = 0.38 + (hour - 5) / 2 * 0.62; else if (hour >= 18) light = 1 - (hour - 18) / 2 * 0.62;
  const dayK = (light - 0.38) / 0.62;
  const warm = Math.max(0, 1 - Math.abs(hour - 6.5) / 1.5) + Math.max(0, 1 - Math.abs(hour - 18.8) / 1.5);
  const up = hour >= 6 && hour <= 18;
  // The sun moves in small steps (a quarter of a degree, about once a second), not every frame: a shadow map that turns a
  // tiny bit each frame makes every shadow edge crawl and shimmer.
  const arc = Math.round(Math.PI * (up ? (hour - 6) / 12 : (((hour + 6) % 24) / 12)) / SUN_STEP) * SUN_STEP;
  const toSun = _toSun.set(Math.cos(arc), Math.max(Math.sin(arc), 0.28), 0.45).normalize();
  // The shadow follows you, but only in whole shadow-map texels (measured across the sun's view), so the shadows stay
  // perfectly still as you walk instead of jumping every few steps.
  _sx.crossVectors(_up, toSun).normalize(); _sy.crossVectors(toSun, _sx);
  const u = Math.round((_sx.x * P.x + _sx.y * P.y + _sx.z * P.z) / SHADOW_TEXEL) * SHADOW_TEXEL;
  const v = Math.round((_sy.x * P.x + _sy.y * P.y + _sy.z * P.z) / SHADOW_TEXEL) * SHADOW_TEXEL;
  const w = toSun.x * P.x + toSun.y * P.y + toSun.z * P.z;
  const target = _target.set(0, 0, 0).addScaledVector(_sx, u).addScaledVector(_sy, v).addScaledVector(toSun, w);
  sun.position.copy(target).addScaledVector(toSun, 150);
  sun.target.position.copy(target);
  sun.color = C(1, 0.96, 0.88).lerp(C(1, 0.66, 0.4), Math.min(warm, 1) * 0.85);
  if (dayK < 0.05) sun.color = C(0.6, 0.68, 1);
  sun.intensity = 0.35 + 2.4 * dayK;
  localT -= dt;
  if (localT <= 0) { localT = 0.25; localGoal = world.skyLight(Math.floor(P.x), Math.floor(P.y + 1.5), Math.floor(P.z)); }
  localLight += (localGoal - localLight) * Math.min(dt * 1.5, 1);
  const adapt = 0.55 + 0.45 * localLight;
  hemi.intensity = (0.35 + 1.25 * dayK) * adapt;
  hemi.color = C(0.55, 0.64, 1).lerp(C(0.78, 0.86, 1), dayK);
  hemi.groundColor = C(0.25, 0.22, 0.2).lerp(C(0.45, 0.38, 0.3), dayK);
  const top = C(0.04, 0.06, 0.16).lerp(C(0.28, 0.5, 0.86), dayK);
  const horizon = C(0.1, 0.13, 0.25).lerp(C(0.72, 0.84, 0.96), dayK).lerp(C(0.98, 0.6, 0.38), Math.min(warm, 1) * 0.6 * (0.3 + dayK));
  sky.material.uniforms.top.value.copy(top);
  sky.material.uniforms.horizon.value.copy(horizon);
  sky.material.uniforms.sunDir.value.copy(up ? toSun : toSun.clone().negate());
  sky.material.uniforms.night.value = 1 - dayK;
  sky.material.uniforms.warm.value = Math.min(warm, 1) * (0.25 + 0.75 * dayK);
  look.day = dayK; look.warm = warm; look.horizon.copy(horizon);
  const fogC = horizon.clone().multiplyScalar(0.12 + 0.88 * localLight);
  // Water: its colour follows the daylight, and with your eyes under water everything fades into blue close by.
  const deep = C(0.02, 0.17, 0.36).multiplyScalar(0.15 + 0.85 * dayK);
  shared.uDeep.value.copy(deep); shared.uDay.value = 0.12 + 0.88 * dayK;
  shared.uSunDir.value.copy(up ? toSun : toSun.clone().negate()); shared.uSunCol.value.copy(sun.color).multiplyScalar(dayK);
  shared.uSkyCol.value.copy(horizon); shared.uSkyTop.value.copy(top);
  const cx = Math.floor(camera.position.x), cy = Math.floor(camera.position.y), cz = Math.floor(camera.position.z), cb = world.get(cx, cy, cz);
  const under = IS_WATERY[cb] === 1 && camera.position.y < cy + waterHeight(cb, world.get(cx, cy + 1, cz)) - 0.02;
  shared.uCamUnder.value = under ? 1 : 0;
  look.under = under;
  if (under) { scene.fog.color.copy(deep).multiplyScalar(0.9 * localLight + 0.1); scene.fog.near = 0.5; scene.fog.far = 18 + 22 * dayK * localLight; }
  else { scene.fog.color.copy(fogC); scene.fog.near = viewChunks * CS * 0.45; scene.fog.far = viewChunks * CS * 1.15; }
  $('underwater').hidden = !under;
  shared.uTime.value += dt;
  const torch = heldItem()?.id === 'torch';
  shared.uHand.value.set(P.x, P.y + 1.5, P.z, torch ? 9 : 0);
}
let localGoal = 1;

// ---------- survival ----------
let hungerWarn = 10;
// ---------- health ----------
// Ten hearts. Only animals you've attacked can hurt you; if your hearts run out you faint and wake up safe at camp,
// with everything you were carrying. Hearts come back by themselves while you're not hungry.
let regenT = 0;
function hurt(n, from) {
  sound.play('hurt');
  G.health = Math.max(0, G.health - n);
  shake = 0.35;
  const f = $('hurt'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  if (from) { const ax = P.x - from.x, az = P.z - from.z, l = Math.hypot(ax, az) || 1, push = SPECIES[from.kind]?.push ?? 5; P.vx = ax / l * push; P.vz = az / l * push; if (!P.water) { P.vy = 5; P.ground = false; } }
  refreshHud();
  if (G.health <= 0) faint(from);
}
function faint(from) {
  $('fade').classList.add('on');
  setTimeout(() => {
    [P.x, P.z] = G.camp.spawn; P.y = world.groundY(Math.floor(P.x), Math.floor(P.z)); P.vx = P.vy = P.vz = 0;
    G.health = 10; G.hunger = Math.max(G.hunger, 5);
    for (const m of mobs) if (m.angry > 0) { m.angry = 0; m.flee = 3; }
    $('fade').classList.remove('on'); refreshHud();
    showCard('You fainted!', 'Back at camp', `${from ? `The ${SPECIES[from.kind]?.name ?? 'animal'} was too strong. ` : ''}You woke up safe at your camp, with everything you were carrying. Wild animals only fight back if you attack them, so be careful who you pick a fight with!`);
  }, 900);
}
function updateSurvival(dt) {
  if (openPanel || dialogueOpen) return;
  if (G.health < 10 && G.hunger > 3) { regenT += dt; if (regenT > 6) { regenT = 0; G.health = Math.min(10, G.health + 1); refreshHud(); } }
  G.hunger = Math.max(0, G.hunger - dt / 60 * 0.5);
  if (G.hunger < 3 && hungerWarn >= 3) message("You're getting hungry. Hold some food and press F (or right-click) to eat.");
  if (G.hunger <= 0 && hungerWarn > 0) message('Your hunger bar is empty — you walk slowly until you eat.');
  hungerWarn = G.hunger;
}

// ---------- user interface ----------
let openPanel = null, dialogueOpen = false;
function selectSlot(i) { selected = i; breaking = null; refreshHotbar(); }
function give(id, n) {
  sound.play('pickup');
  const left = inv.add(id, n);
  if (left < n) toast(`+${n - left} ${ITEM[id]?.name ?? id}`, id);
  if (left > 0) message('Your bag is full!');
  refreshHotbar();
  if (openPanel === 'inventory') renderPanel();
}
function iconImg(id, size = 32) { return `<img src="${ICONS[id] ?? ''}" width="${size}" height="${size}" alt="">`; }
function refreshHotbar() {
  const bar = $('hotbar');
  bar.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const s = inv.slots[i], el = document.createElement('button');
    el.className = 'slot' + (i === selected ? ' sel' : '');
    el.setAttribute('aria-label', s ? `${ITEM[s.id].name}, ${s.n}` : `Empty slot ${i + 1}`);
    el.innerHTML = (s ? iconImg(s.id) + (s.n > 1 ? `<span class="n">${s.n}</span>` : '') : '') + `<span class="k">${i + 1}</span>`;
    el.addEventListener('click', () => selectSlot(i));
    bar.appendChild(el);
  }
  const s = heldItem();
  $('heldName').textContent = s ? ITEM[s.id].name : '';
  // What's in your hand.
  if (heldMesh) { playerBody.arms[1].remove(heldMesh); heldMesh = null; }
  if (fpHeld) { fpHand.remove(fpHeld); fpHeld = null; }
  if (s) {
    const it = ITEM[s.id];
    if (ICON_CANVAS.has(s.id)) {
      // A solid 3D model of the picture: a tool held by its handle, or the thing itself in your hand.
      heldMesh = new THREE.Mesh(itemModel(s.id, 'hand'), MODEL_MAT); heldMesh.castShadow = true;
      playerBody.arms[1].add(heldMesh);
      fpHeld = new THREE.Mesh(itemModel(s.id, 'flat'), MODEL_MAT.clone()); onTop(fpHeld);
      // Seen in first person, close to your eyes: true to size, but never so small you can't see it or so big it fills the screen.
      const tool = isHandTool(s.id), { ps, extent } = itemScale(s.id), seen = Math.min(0.42, Math.max(0.07, extent * ps * 0.33));
      fpHeld.scale.setScalar(seen / extent);
      fpHeld.position.set(tool ? 0.02 : 0, tool ? 0.1 : 0.06, tool ? -0.12 : -0.13);
      fpHeld.rotation.set(tool ? -0.15 : 0, tool ? -1.15 : -0.5, tool ? 0.25 : 0);
      fpHand.add(fpHeld);
    } else {
      heldMesh = it.block && !IS_CROSS[it.block] ? cubeMesh(it.block, 0.28) : iconSprite(s.id);
      heldMesh.position.set(0, -0.72, 0.15);
      playerBody.arms[1].add(heldMesh);
      fpHeld = it.block && !IS_CROSS[it.block] ? cubeMesh(it.block, 0.2) : iconSprite(s.id);
      if (fpHeld.isSprite) fpHeld.scale.set(0.13, 0.13, 0.13); else fpHeld.scale.setScalar(0.45);
      fpHeld.material = fpHeld.material.clone(); onTop(fpHeld);
      fpHeld.position.set(-0.01, 0.07, -0.1);
      fpHeld.rotation.y = 0.5;
      fpHand.add(fpHeld);
    }
  }
}
function refreshHud() {
  $('stars').textContent = G.stars;
  const h = Math.floor((G.clock % 1440) / 60), m = Math.floor(G.clock % 60);
  $('clock').textContent = `Day ${Math.floor(G.clock / 1440) + 1} · ${h}:${String(m).padStart(2, '0')}`;
  $('hunger').style.width = `${G.hunger * 10}%`;
  $('hunger').classList.toggle('low', G.hunger < 3);
  $('health').style.width = `${G.health * 10}%`;
  $('healthPill').hidden = G.health >= 10;   // the hearts bar shows only while you're hurt
}
let msgTimer = null, lastMsg = '', lastMsgT = 0;
function message(text) {
  if (text === lastMsg && performance.now() - lastMsgT < 1500) return;
  lastMsg = text; lastMsgT = performance.now();
  const el = $('message');
  el.textContent = text; el.hidden = false;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.hidden = true; }, 4200);
}
function toast(text, id) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = (id ? iconImg(id, 16) : '') + `<span>${text}</span>`;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function showCard(title, sub, body) {
  $('cardTitle').textContent = title; $('cardSub').textContent = sub; $('cardBody').textContent = body;
  openPanel = 'card'; $('card').hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
  refreshPaused();
}
$('cardOk').addEventListener('click', () => { closePanels(); });
for (const id of ['invDone', 'mapDone', 'helpDone']) $(id).addEventListener('click', () => closePanels());
function showDialogue(name, title, text, choices) {
  dialogueOpen = true;
  $('dlgName').textContent = name; $('dlgTitle').textContent = title; $('dlgText').textContent = text;
  const box = $('dlgChoices'); box.innerHTML = '';
  for (const [label, fn] of choices) { const b = document.createElement('button'); b.textContent = label; b.addEventListener('click', fn); box.appendChild(b); }
  $('dialogue').hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
  refreshPaused();
}
function closeDialogue(who) {
  if (who) who.talking = false;
  dialogueOpen = false; $('dialogue').hidden = true;
  if (input.mode === 'desk') requestLock();
}
function refreshPaused() { $('paused').hidden = document.pointerLockElement === canvas || input.freeLook || !G.started || input.mode !== 'desk' || !!openPanel || dialogueOpen; }
function togglePanel(name) { if (openPanel === name) closePanels(); else { closePanels(true); openPanel = name; renderPanel(); if (document.pointerLockElement) document.exitPointerLock(); } }
function closePanels(keepUnlocked) {
  for (const id of ['inventory', 'map', 'help', 'card', 'designs']) $(id).hidden = true;
  if (designer && designer.isOpen()) designer.close();
  const was = openPanel;
  openPanel = null;
  if (!keepUnlocked && was && input.mode === 'desk' && G.started) requestLock();
  refreshPaused();
}
let craftCat = 'All', picked = null;
function openFurnace() { craftCat = 'Smelting'; if (openPanel !== 'inventory') togglePanel('inventory'); else renderPanel(); }
function renderPanel() {
  if (openPanel === 'inventory') {
    $('inventory').hidden = false;
    const grid = $('invGrid'); grid.innerHTML = '';
    const order = [...Array(27).keys()].map((i) => i + 9).concat([...Array(9).keys()]);
    order.forEach((i, k) => {
      const s = inv.slots[i], el = document.createElement('button');
      el.className = 'slot' + (picked === i ? ' sel' : '') + (k === 27 ? ' gap' : '');
      el.setAttribute('aria-label', s ? `${ITEM[s.id].name}, ${s.n}` : 'Empty slot');
      el.innerHTML = s ? iconImg(s.id) + (s.n > 1 ? `<span class="n">${s.n}</span>` : '') : '';
      el.title = s ? ITEM[s.id].name : '';
      el.addEventListener('click', () => {
        if (picked !== null) { const a = inv.slots[picked], b = inv.slots[i]; if (a && b && a.id === b.id && picked !== i) { const p = Math.min(ITEM[b.id].max - b.n, a.n); b.n += p; a.n -= p; if (!a.n) inv.slots[picked] = null; } else { inv.slots[picked] = b; inv.slots[i] = a; } picked = null; refreshHotbar(); }
        else if (s) picked = i;
        renderPanel();
      });
      grid.appendChild(el);
    });
    $('invHint').textContent = picked !== null && inv.slots[picked] ? `${ITEM[inv.slots[picked].id].name} — click another slot to move it` : 'Click an item, then another slot to move it. The bottom row is your hotbar.';
    const cats = ['All', 'Basics', 'Food', 'Building', 'Decor', 'Tools', 'Travel', 'Smelting'];
    const chips = $('chips'); chips.innerHTML = '';
    for (const c of cats) { const b = document.createElement('button'); b.className = 'chip' + (c === craftCat ? ' on' : ''); b.textContent = c; b.addEventListener('click', () => { craftCat = c; renderPanel(); }); chips.appendChild(b); }
    const list = RECIPES.filter((r) => craftCat === 'All' || r.cat === craftCat);
    const sorted = list.filter((r) => inv.canMake(r)).concat(list.filter((r) => !inv.canMake(r)));
    const furnace = nearFurnace();
    const box = $('recipes'); box.innerHTML = '';
    for (const r of sorted) {
      const can = inv.canMake(r) && (!r.furnace || furnace);
      const row = document.createElement('div'); row.className = 'recipe';
      row.innerHTML = `<div class="ri">${iconImg(r.out, 32)}${r.n > 1 ? `<span class="n">${r.n}</span>` : ''}</div>
        <div class="rt"><b>${ITEM[r.out].name}</b>${r.furnace && !furnace ? '<em>Stand next to a furnace</em>' : ''}${r.note ? `<small>${r.note}</small>` : ''}
        <div class="needs">${r.inputs.map(([ids, c]) => { const have = inv.countAny(ids); return `<span class="${have >= c ? 'ok' : 'no'}">${iconImg(ids[0], 16)}${have}/${c}</span>`; }).join('')}</div></div>`;
      const btn = document.createElement('button');
      btn.className = 'make'; btn.disabled = !can; btn.textContent = r.furnace ? 'Smelt' : 'Craft';
      btn.addEventListener('click', () => {
        if (r.furnace) { smelt(r); return; }
        for (const [ids, c] of r.inputs) inv.removeAny(ids, c);
        give(r.out, r.n);
        sound.play('craft');
        renderPanel();
      });
      row.appendChild(btn); box.appendChild(row);
    }
  } else if (openPanel === 'map') {
    $('map').hidden = false;
    drawMap();
  } else if (openPanel === 'help') {
    $('help').hidden = false;
  } else if (openPanel === 'designs') {
    renderDesigns();
  }
}
// The map: the whole world from above, the wonders, and you.
let mapBase = null;
function drawMap() {
  const c = $('mapCanvas'), n = world.n;
  if (!mapBase) {
    mapBase = document.createElement('canvas'); mapBase.width = mapBase.height = n;
    const g = mapBase.getContext('2d'), img = g.createImageData(n, n);
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
      let y = H - 1, b = 0;
      while (y > 0) { b = world.cells[(y * n + z) * n + x]; if (b && !IS_CROSS[b]) break; y--; }
      let col = b === WATER ? new THREE.Color(0.16, 0.36, 0.62) : tileColor(BLOCKS[b].top);
      if (b === WATER) { let f = y; while (f > 0 && world.cells[(f * n + z) * n + x] === WATER) f--; col = col.clone().multiplyScalar(Math.max(0.5, 1 - (y - f) * 0.05)); }
      const shade = 0.7 + (y - 23) / 48 * 0.7;
      const i = (z * n + x) * 4;
      img.data[i] = Math.min(255, col.r * shade * 255); img.data[i + 1] = Math.min(255, col.g * shade * 255); img.data[i + 2] = Math.min(255, col.b * shade * 255); img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  const size = c.width, s = size / n, g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(mapBase, 0, 0, size, size);
  const pins = $('mapPins'); pins.innerHTML = '';
  for (const [id, p] of Object.entries(G.placed)) {
    const b = document.createElement('button');
    // Every city is named on the map, so you can learn where they are; ones you haven't visited yet are grey, and you
    // can only travel to a place once you've walked there yourself. Atlantis stays a mystery until you find it.
    const found = G.found.has(id), secret = id === 'atlantis' && !found;
    b.className = 'pin' + (found ? ' found' : ' unfound');
    b.style.left = `${(p.x / n) * 100}%`; b.style.top = `${(p.z / n) * 100}%`;
    b.textContent = secret ? '?' : SITE_TEXT[id].name;
    b.title = found ? `Travel to ${SITE_TEXT[id].name}` : secret ? 'A legend… somewhere under the sea?' : `${SITE_TEXT[id].name}: not visited yet. Walk there to unlock travel.`;
    b.addEventListener('click', () => { if (!G.found.has(id)) { message(secret ? 'Nobody knows where Atlantis is. Keep exploring!' : `Walk to ${SITE_TEXT[id].name} first; after that you can travel there from the map.`); return; } travel(p.x - 14, p.z + 3); });
    pins.appendChild(b);
  }
  const home = document.createElement('button');
  home.className = 'pin home'; home.textContent = 'Home';
  home.style.left = `${(G.camp.spawn[0] / n) * 100}%`; home.style.top = `${(G.camp.spawn[1] / n) * 100}%`;
  home.addEventListener('click', () => travel(G.camp.spawn[0], G.camp.spawn[1]));
  pins.appendChild(home);
  // Every animal you've tamed, so you can always find your horse again (the iPhone game does this too).
  for (const m of mobs) {
    if (!m.tame || m.dead) continue;
    const t = document.createElement('div');
    t.className = 'pin tamed'; t.title = `Your ${SPECIES[m.kind].name}`;
    t.style.left = `${(m.x / n) * 100}%`; t.style.top = `${(m.z / n) * 100}%`;
    pins.appendChild(t);
  }
  // You: a red dot on top of everything (it used to hide under the Home label).
  const me = document.createElement('div');
  me.className = 'pin you'; me.title = 'You are here';
  me.style.left = `${(P.x / n) * 100}%`; me.style.top = `${(P.z / n) * 100}%`;
  pins.appendChild(me);
  void s;
}
function travel(x, z) {
  if (P.ride) { const m = P.ride; P.ride = null; m.ridden = false; m.tx = m.x; m.tz = m.z; m.home = [m.x, m.z]; }   // your horse stays where it was grazing
  const [lx, lz] = world.nearestLand(Math.floor(x), Math.floor(z));
  P.x = lx + 0.5; P.z = lz + 0.5; P.y = world.groundY(lx, lz); P.vy = 0;
  closePanels();
  message('You travelled there.');
}
function updateHelp() {
  $('helpDesk').hidden = input.mode !== 'desk';
  $('helpTouch').hidden = input.mode !== 'touch';
  $('pausedHint').textContent = input.mode === 'desk' ? 'Click to play' : 'Tap to play';
  $('helpLook').textContent = input.freeLook ? 'Drag to look around (hold the button and move)' : 'Look around';
}


// ---------- designs: save something you built as a design, then build copies of it anywhere ----------
const DESIGN_KEY = 'polis-world-designs-1', MAX_DESIGN = 40;
let designs = (() => { try { return JSON.parse(localStorage.getItem(DESIGN_KEY) || '[]'); } catch (_) { return []; } })();
const saveDesigns = () => { try { localStorage.setItem(DESIGN_KEY, JSON.stringify(designs)); } catch (_) { /* storage off: designs last until you close the page */ } };
const D = { mode: null, a: null, pick: null, rot: 0, ghost: null, anchor: null, jobs: [], free: false };
try { D.free = localStorage.getItem('polis-world-free-build') === '1'; } catch (_) { /* ignore */ }
const selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffd34d }));
selBox.visible = false; scene.add(selBox);
/// The item a block is built from (and what building it costs).
const blockItem = (() => { const m = new Map(); for (const [id, it] of Object.entries(ITEM)) if (it.block && !m.has(it.block)) m.set(it.block, id); m.set(60, 'furnace'); m.set(1, 'dirt'); m.set(26, 'dirt'); m.set(51, 'dirt'); return (b) => m.get(b) ?? null; })();
function rle(arr) { const out = []; for (let i = 0; i < arr.length;) { let j = i; while (j < arr.length && arr[j] === arr[i] && j - i < 65535) j++; out.push(arr[i], j - i); i = j; } return out; }
function unrle(r, n) { const a = new Uint8Array(n); let k = 0; for (let i = 0; i < r.length; i += 2) for (let c = 0; c < r[i + 1]; c++) a[k++] = r[i]; return a; }
function designCells(d) { if (!d._cells) d._cells = unrle(d.cells, d.w * d.h * d.d); return d._cells; }
/// The design turned `rot` quarter-turns: returns its size and a function giving the block at (x, y, z).
function rotated(d, rot) {
  const c = designCells(d), W = rot % 2 ? d.d : d.w, Dp = rot % 2 ? d.w : d.d;
  const at = (x, y, z) => {
    let sx, sz;
    if (rot === 0) { sx = x; sz = z; } else if (rot === 1) { sx = z; sz = d.d - 1 - x; } else if (rot === 2) { sx = d.w - 1 - x; sz = d.d - 1 - z; } else { sx = d.w - 1 - z; sz = x; }
    return c[(y * d.d + sz) * d.w + sx];
  };
  return { w: W, h: d.h, d: Dp, at };
}
function designCost(d) {
  const need = new Map(), c = designCells(d);
  for (const b of c) { if (!b || IS_WATER[b]) continue; const id = blockItem(b); if (id) need.set(id, (need.get(id) || 0) + 1); }
  return need;
}
function missing(need) { const out = []; for (const [id, n] of need) { const have = inv.count(id); if (have < n) out.push([id, n - have]); } return out; }
function startDesign(mode, pick = null) {
  closePanels(true);
  D.mode = mode; D.a = null; D.pick = pick; D.rot = 0;
  if (D.ghost) { scene.remove(D.ghost); D.ghost = null; }
  if (mode === 'place') buildGhost();
  $('designBar').hidden = false; document.body.classList.add('designing');
  designText();
  if (input.mode === 'desk') requestLock();
}
function endDesign() {
  D.mode = null; D.a = null; selBox.visible = false;
  if (D.ghost) { scene.remove(D.ghost); D.ghost.traverse((o) => o.geometry?.dispose()); D.ghost = null; }
  $('designBar').hidden = true; document.body.classList.remove('designing');
}
function designText() {
  const t = $('designText'), go = $('designGo'), rot = $('designRotate');
  rot.hidden = D.mode !== 'place';
  if (D.mode === 'corner1') { t.textContent = 'Point at one bottom corner of your building and ' + (input.mode === 'desk' ? 'click.' : 'press Mark.'); go.textContent = 'Mark'; }
  else if (D.mode === 'corner2') { t.textContent = 'Now point at the opposite top corner and ' + (input.mode === 'desk' ? 'click.' : 'press Mark.'); go.textContent = 'Mark'; }
  else if (D.mode === 'place') {
    const d = designs[D.pick], miss = D.free ? [] : missing(designCost(d));
    t.textContent = `${d.name}: ` + (miss.length ? `you still need ${miss.slice(0, 3).map(([id, n]) => `${n} ${ITEM[id].name}`).join(', ')}${miss.length > 3 ? '…' : ''}` : (input.mode === 'desk' ? 'click to build it here · R or right-click to turn it' : 'press Build here'));
    go.textContent = 'Build here';
  }
}
function aimCell() {
  const a = aimFrom();
  if (!a.block) return null;
  const t = a.block;
  return IS_CROSS[t.b] ? [t.x, t.y, t.z] : [t.x + t.face[0], t.y + t.face[1], t.z + t.face[2]];
}
function designAction() {
  if (D.mode === 'corner1' || D.mode === 'corner2') {
    const a = aimFrom();
    if (!a.block) { message('Point at a block.'); return; }
    const c = [a.block.x, a.block.y, a.block.z];
    if (D.mode === 'corner1') { D.a = c; D.mode = 'corner2'; designText(); return; }
    const lo = [0, 1, 2].map((k) => Math.min(D.a[k], c[k])), hi = [0, 1, 2].map((k) => Math.max(D.a[k], c[k]));
    const size = [0, 1, 2].map((k) => hi[k] - lo[k] + 1);
    if (size.some((v) => v > MAX_DESIGN)) { message(`That's too big: a design can be up to ${MAX_DESIGN} blocks each way.`); return; }
    const cells = new Uint8Array(size[0] * size[1] * size[2]);
    let count = 0;
    for (let y = 0; y < size[1]; y++) for (let z = 0; z < size[2]; z++) for (let x = 0; x < size[0]; x++) {
      let b = world.get(lo[0] + x, lo[1] + y, lo[2] + z);
      if (IS_WATER[b] || (IS_CROSS[b] && b !== 56 && b !== 58 && !(b >= 47 && b <= 50)) || b === 20) b = 0;
      cells[(y * size[2] + z) * size[0] + x] = b; if (b) count++;
    }
    if (!count) { message('There are no blocks in there.'); return; }
    D.pending = { w: size[0], h: size[1], d: size[2], cells: rle([...cells]), count };
    endDesign();
    $('designName').value = `My building ${designs.length + 1}`;
    $('nameBox').hidden = false; openPanel = 'name';
    if (document.pointerLockElement) document.exitPointerLock();
    setTimeout(() => { $('designName').focus(); $('designName').select(); }, 50);
    return;
  }
  if (D.mode === 'place') buildHere();
}
function buildGhost() {
  if (D.ghost) { scene.remove(D.ghost); D.ghost.traverse((o) => o.geometry?.dispose()); }
  const d = designs[D.pick], r = rotated(d, D.rot);
  const mini = { n: Math.max(r.w, r.d), get(x, y, z) { return x < 0 || z < 0 || x >= r.w || z >= r.d || y < 0 || y >= r.h ? 0 : r.at(x, y, z); } };
  const g = new THREE.Group();
  if (!D.ghostMat) D.ghostMat = new THREE.MeshLambertMaterial({ map: atlasTex, transparent: true, opacity: 0.55, depthWrite: false, alphaTest: 0.1 });
  for (let cz = 0; cz * CS < mini.n; cz++) for (let cx = 0; cx * CS < mini.n; cx++) {
    const m = meshChunk(mini, cx, cz, mini);
    for (const geo of [m.solid, m.cut]) if (geo) g.add(new THREE.Mesh(geo, D.ghostMat));
  }
  g.userData.size = r;
  D.ghost = g; scene.add(g);
}
function updateDesign(dt) {
  // Building a design, one layer at a time.
  for (let i = D.jobs.length - 1; i >= 0; i--) {
    const j = D.jobs[i];
    j.t -= dt;
    if (j.t > 0) continue;
    j.t = 0.12;
    const y = j.layer++;
    for (let z = 0; z < j.r.d; z++) for (let x = 0; x < j.r.w; x++) {
      const b = j.r.at(x, y, z);
      if (!b) continue;
      const wx = j.o[0] + x, wy = j.o[1] + y, wz = j.o[2] + z, cur = world.get(wx, wy, wz);
      if ((cur === 0 || (IS_CROSS[cur] && !IS_WATERY[cur]) || IS_WATER[cur]) && siteOf(wx, wy, wz) === null && wy > 0 && wy < H - 1) setBlock(wx, wy, wz, b);
      else { const id = blockItem(b); if (id && !j.free) j.refund.set(id, (j.refund.get(id) || 0) + 1); }
    }
    if (y % 2 === 0) burst(j.o[0] + j.r.w / 2, j.o[1] + y + 0.5, j.o[2] + j.r.d / 2, T.planks);
    if (j.layer >= j.r.h) {
      D.jobs.splice(i, 1);
      for (const [id, n] of j.refund) give(id, n);
      message(`${j.name} is built!` + (j.refund.size ? ' (Some spots were blocked, so you got those blocks back.)' : ''));
      scheduleSave();
    }
  }
  if (!D.mode) return;
  if (D.mode === 'corner1' || D.mode === 'corner2') {
    const a = aimFrom();
    const c = a.block ? [a.block.x, a.block.y, a.block.z] : null;
    const p = D.a || c;
    if (!p) { selBox.visible = false; return; }
    const q = D.a && c ? c : p;
    const lo = [0, 1, 2].map((k) => Math.min(p[k], q[k])), hi = [0, 1, 2].map((k) => Math.max(p[k], q[k]));
    selBox.visible = true;
    selBox.scale.set(hi[0] - lo[0] + 1.02, hi[1] - lo[1] + 1.02, hi[2] - lo[2] + 1.02);
    selBox.position.set((lo[0] + hi[0] + 1) / 2, (lo[1] + hi[1] + 1) / 2, (lo[2] + hi[2] + 1) / 2);
    return;
  }
  if (D.mode === 'place' && D.ghost) {
    const c = aimCell();
    D.ghost.visible = !!c;
    if (!c) return;
    const r = D.ghost.userData.size;
    // The building starts where you point and stretches away from you, so it never lands on top of you.
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    if (Math.abs(fx) > Math.abs(fz)) D.anchor = [fx > 0 ? c[0] : c[0] - r.w + 1, c[1], c[2] - Math.floor(r.d / 2)];
    else D.anchor = [c[0] - Math.floor(r.w / 2), c[1], fz > 0 ? c[2] : c[2] - r.d + 1];
    D.ghost.position.set(...D.anchor);
    const miss = D.free ? [] : missing(designCost(designs[D.pick]));
    D.ghostMat.color.setHex(miss.length ? 0xff7a6a : 0x9cff9c);
  }
}
function buildHere() {
  if (!D.anchor) { message('Point at the ground where you want it.'); return; }
  const d = designs[D.pick], need = designCost(d), miss = D.free ? [] : missing(need);
  const r = D.ghost.userData.size, o = D.anchor;
  if (P.x + 0.3 > o[0] && P.x - 0.3 < o[0] + r.w && P.z + 0.3 > o[2] && P.z - 0.3 < o[2] + r.d && P.y + 1.8 > o[1] && P.y < o[1] + r.h) { message("Step back a little: you're standing where it would go."); return; }
  if (miss.length) { message(`You need ${miss.slice(0, 3).map(([id, n]) => `${n} more ${ITEM[id].name}`).join(', ')}${miss.length > 3 ? ', and more' : ''}.`); return; }
  if (!D.free) for (const [id, n] of need) inv.remove(id, n);
  refreshHotbar();
  D.jobs.push({ name: d.name, r: rotated(d, D.rot), o: D.anchor.slice(), layer: 0, t: 0, refund: new Map(), free: D.free });
  endDesign();
}
function renderDesigns() {
  $('designs').hidden = false;
  $('designFree').checked = D.free;
  const box = $('designList'); box.innerHTML = '';
  if (!designs.length) { box.innerHTML = '<p class="maphint">No designs yet. Press “Design a building” to make one.</p>'; return; }
  designs.forEach((d, i) => {
    const need = designCost(d), miss = missing(need);
    const row = document.createElement('div'); row.className = 'recipe';
    const parts = [...need].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => { const have = inv.count(id); return `<span class="${have >= n || D.free ? 'ok' : 'no'}">${iconImg(id, 16)}${have}/${n}</span>`; }).join('');
    row.innerHTML = `<div class="ri">${iconImg('_plan', 32)}</div><div class="rt"><b></b><small>${d.w} × ${d.h} × ${d.d} blocks · ${d.count} blocks to build</small><div class="needs">${parts}${need.size > 5 ? '<span>…</span>' : ''}</div></div>`;
    row.querySelector('b').textContent = d.name;
    if (d.parts) { const ed = document.createElement('button'); ed.className = 'make edit'; ed.textContent = 'Change'; ed.title = 'Change this design in the designer'; ed.addEventListener('click', () => openDesigner(d, i)); row.appendChild(ed); }
    const go = document.createElement('button'); go.className = 'make'; go.textContent = 'Place';
    go.disabled = !D.free && miss.length > 0;
    go.title = go.disabled ? 'Collect the blocks first, or turn on free building' : 'Place a copy';
    go.addEventListener('click', () => startDesign('place', i));
    const del = document.createElement('button'); del.className = 'make del'; del.textContent = 'Delete';
    del.addEventListener('click', () => { if (del.dataset.sure) { designs.splice(i, 1); saveDesigns(); renderDesigns(); } else { del.dataset.sure = '1'; del.textContent = 'Sure?'; } });
    row.appendChild(go); row.appendChild(del); box.appendChild(row);
  });
}
$('designNew').addEventListener('click', () => startDesign('corner1'));
$('designDraw').addEventListener('click', () => openDesigner(null, designs.length + 1));
// The designer window (designer.js): made once the block pictures are ready.
let designer = null;
function openDesigner(d, i) {
  if (!designer) return;
  closePanels(true);
  openPanel = 'designer';
  if (document.pointerLockElement) document.exitPointerLock();
  input.keys.clear(); input.mining = false;
  designer.open(d, d ? i : i);
  refreshPaused();
}
function makeDesigner() {
  designer = createDesigner({
    mats, ghostTex: atlasTex, rle, message,
    iconOf: (id) => ICONS[id] ?? '', itemOf: (b) => blockItem(b), count: (id) => inv.count(id), free: () => D.free,
    onSave(design, index) {
      if (index >= 0 && designs[index]) designs[index] = design; else designs.push(design);
      saveDesigns();
      toast(`Saved the design “${design.name}”`, '_plan');
    },
    onClose(saved) {
      if (openPanel === 'designer') openPanel = null;
      if (saved) { openPanel = 'designs'; renderPanel(); } else if (input.mode === 'desk' && G.started) requestLock();
      refreshPaused();
    },
  });
}
$('designFree').addEventListener('change', (e) => { D.free = e.target.checked; try { localStorage.setItem('polis-world-free-build', D.free ? '1' : '0'); } catch (_) { /* ignore */ } renderDesigns(); });
$('designsDone').addEventListener('click', () => closePanels());
$('designGo').addEventListener('click', () => designAction());
$('designRotate').addEventListener('click', () => { D.rot = (D.rot + 1) % 4; buildGhost(); });
$('designCancel').addEventListener('click', () => { endDesign(); message('Cancelled.'); });
$('nameSave').addEventListener('click', () => {
  const name = $('designName').value.trim() || `My building ${designs.length + 1}`;
  designs.push({ name, ...D.pending }); D.pending = null; saveDesigns();
  $('nameBox').hidden = true; openPanel = null;
  toast(`Saved the design “${name}”`, '_plan');
  togglePanel('designs');
});
$('nameCancel').addEventListener('click', () => { D.pending = null; $('nameBox').hidden = true; openPanel = null; closePanels(); });
$('designName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('nameSave').click(); e.stopPropagation(); });

// ---------- saving (in this browser) ----------
let saveTimer = 0, saveSoon = false;
function scheduleSave() { saveSoon = true; }
function save() {
  try {
    const edits = [];
    for (const [i, b] of G.edits) edits.push(i, b);
    const bag = new Inventory(); bag.slots = inv.slots.map((s) => s && { ...s });
    for (const d of drops) bag.add(d.id, d.n);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, wv: WORLD_VERSION, n: world.n, edits, inv: bag.slots, p: [P.x, P.y, P.z, P.yaw, P.pitch], clock: G.clock, stars: G.stars, found: [...G.found], talked: [...G.talked], hunger: G.hunger, health: G.health, sel: selected, fp2: G.firstPerson, relics: [...G.relics], villagers: G.villagers, giftDay: G.giftDay,
      animals: mobs.filter((m) => !m.dead && !m.mount && !m.follow && (isKept(m) || m.tame)).map((m) => ({ kind: m.kind, x: m.x, z: m.z, home: m.home, young: m.young, age: m.age, bred: m.bred, tame: !!m.tame })) }));
  } catch (_) { /* storage may be off (private window): the game still plays */ }
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (_) { return null; }
}
// Only save once the game has started: on the launch page there's nothing to save yet, and saving then would write an empty world over yours.
addEventListener('visibilitychange', () => { if (document.hidden && world && G.started) save(); });
addEventListener('pagehide', () => { if (world && G.started) save(); });

// ---------- the launch page ----------
// Continue your world, or start a new one. Starting over never throws a world away: the old one is kept as a backup
// (as many as storage holds), and the newest backup can be brought back from this page, swapping places with the current one.
const BACKUP_PREFIX = SAVE_KEY + '-backup-';
let launchGo;
const launched = new Promise((r) => { launchGo = r; });
function readSave(key) { try { const s = JSON.parse(localStorage.getItem(key) || 'null'); return s && s.v === 1 ? s : null; } catch (_) { return null; } }
function backupKeys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(BACKUP_PREFIX)) out.push(k); } } catch (_) { /* no storage */ } return out.sort(); }
function describeSave(s) {
  const places = (s.found || []).filter((k) => SITE_TEXT[k]).length;
  return `<b>${s.stars || 0}</b> stars · <b>${places}</b> of ${Object.keys(SITE_TEXT).length} places found · day <b>${Math.floor((s.clock || 0) / 1440) + 1}</b>`;
}
function setUpLaunch(note) {
  const cur = readSave(SAVE_KEY), keys = backupKeys(), bak = keys.length ? readSave(keys[keys.length - 1]) : null;
  $('btnBackup').hidden = !$('backupBox').hidden;
  $('saveInfo').hidden = !cur && !note;
  $('saveInfo').innerHTML = note || (cur ? 'Your world: ' + describeSave(cur) : '');
  $('btnPlay').textContent = cur ? 'Continue my world' : 'Start a new world';
  $('btnNew').hidden = !cur; $('newConfirm').hidden = true;
  $('btnRestore').hidden = !bak;
  if (bak) $('btnRestore').textContent = `Bring back my older world (${bak.stars || 0} stars)`;
}
function launch() { $('launch').hidden = true; launchGo(); }
// The browser only lets a page make a sound after a click, so the first touch of mouse or keyboard
// anywhere starts the music, whichever way the game was opened.
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, () => sound.start(), { capture: true });
$('btnPlay').addEventListener('click', () => sound.start());
$('btnPlay').addEventListener('click', launch);
function refreshSoundBtns() {
  for (const id of ['btnSound', 'btnSound2']) { const b = $(id); if (b) b.textContent = 'Sound: ' + (sound.on ? 'on' : 'off'); }
  for (const id of ['btnMusic', 'btnMusic2']) { const b = $(id); if (b) b.textContent = 'Music: ' + (sound.musicOn ? 'on' : 'off'); }
}
for (const id of ['btnSound', 'btnSound2']) $(id)?.addEventListener('click', () => { sound.start(); sound.setOn(!sound.on, sound.musicOn); refreshSoundBtns(); sound.play('click'); });
for (const id of ['btnMusic', 'btnMusic2']) $(id)?.addEventListener('click', () => { sound.start(); sound.setOn(sound.on, !sound.musicOn); refreshSoundBtns(); sound.play('click'); });
refreshSoundBtns();
if ($('buildStamp')) $('buildStamp').textContent = BUILD;
$('btnNew').addEventListener('click', () => { $('newConfirm').hidden = false; $('btnNew').hidden = true; });
$('btnNewNo').addEventListener('click', () => setUpLaunch());
$('btnNewYes').addEventListener('click', () => {
  try {
    const cur = localStorage.getItem(SAVE_KEY);
    if (cur) localStorage.setItem(BACKUP_PREFIX + Date.now(), cur);   // if this fails (storage full), the old world stays put
    localStorage.removeItem(SAVE_KEY);
  } catch (_) { setUpLaunch('There isn\'t room to keep a backup of your world, so it hasn\'t been reset.'); return; }
  launch();
});
// Backing up a world as text: it can be kept anywhere, pasted back after a browser clears its storage, and carried
// to another computer (or to a new web address, where the browser's own storage starts empty again).
$('btnBackup').addEventListener('click', () => {
  const cur = (() => { try { return localStorage.getItem(SAVE_KEY); } catch (_) { return null; } })();
  $('backupText').value = cur || '';
  $('backupBox').hidden = false;
  $('btnBackup').hidden = true;
  if (!cur) { $('backupText').value = ''; $('backupText').placeholder = "You don't have a world saved yet. Play for a moment, then come back."; }
  else { $('backupText').focus(); $('backupText').select(); }
});
$('btnBackupDone').addEventListener('click', () => { $('backupBox').hidden = true; $('btnBackup').hidden = false; setUpLaunch(); });
$('btnCopy').addEventListener('click', async () => {
  const b = $('btnCopy'), text = $('backupText').value;
  if (!text) return;
  try { await navigator.clipboard.writeText(text); b.textContent = 'Copied!'; }
  catch (_) { $('backupText').focus(); $('backupText').select(); b.textContent = 'Press Ctrl+C (or Cmd+C)'; }
  setTimeout(() => { b.textContent = 'Copy it'; }, 2500);
});
$('btnPasteBack').addEventListener('click', () => {
  const text = $('restoreText').value.trim();
  if (!text) { setUpLaunch('Paste your backup text into the box first.'); return; }
  let save = null;
  try { save = JSON.parse(text); } catch (_) { /* not a backup */ }
  if (!save || save.v !== 1 || !Array.isArray(save.inv)) { setUpLaunch("That doesn't look like a Polis World backup. Copy the whole text, from the first { to the last }."); return; }
  try {
    const cur = localStorage.getItem(SAVE_KEY);
    if (cur) localStorage.setItem(BACKUP_PREFIX + Date.now(), cur);   // the world that was here is kept too
    localStorage.setItem(SAVE_KEY, text);
  } catch (_) { setUpLaunch("There isn't room in this browser to store that world."); return; }
  $('backupBox').hidden = true; $('btnBackup').hidden = false;
  setUpLaunch('That world is back. Press Continue to play it.');
});
$('btnRestore').addEventListener('click', () => {
  try {
    const keys = backupKeys(), k = keys[keys.length - 1], old = localStorage.getItem(k), cur = localStorage.getItem(SAVE_KEY);
    if (cur) localStorage.setItem(BACKUP_PREFIX + Date.now(), cur);
    localStorage.setItem(SAVE_KEY, old); localStorage.removeItem(k);
    setUpLaunch('Your older world is back. Press Continue to play it.');
  } catch (_) { setUpLaunch('Couldn\'t swap worlds: storage is full.'); }
});
setUpLaunch();
if (new URLSearchParams(location.search).has('debug')) launch();   // (testing: straight into the game)

// ---------- start-up ----------
const atlasImg = new Image(), extraImg = new Image(), extraIcons = new Image();
const loadImg = (img, src) => new Promise((res) => { img.onload = res; img.onerror = res; img.src = src; });
function loadAtlas() { return Promise.all([loadImg(atlasImg, ATLAS_PNG), loadImg(extraImg, EXTRA_TILES_PNG), loadImg(extraIcons, EXTRA_ICONS_PNG)]); }
/// Icons for the new items: a little cube for blocks (drawn like the iPhone game's), a picture for everything else.
const SHEET_ICONS = { ancientMetal: 0, ancientPickaxe: 1, ancientAxe: 2, ancientShovel: 3, ancientSword: 4, kelp: 5, seagrass: 6, purpleFan: 7, yellowFan: 8, ladder: 9, trident: 10, lawTablet: 11, seahorse: 12, driedKelp: 13, _plan: 14 };
async function makeIcons() {
  const sheet = tileSheet(atlasImg, extraImg);
  const tileCanvas = (t) => { const c = document.createElement('canvas'); c.width = c.height = 10; c.getContext('2d').drawImage(sheet, (t % 8) * 10, Math.floor(t / 8) * 10, 10, 10, 0, 0, 10, 10); return c; };
  // Detailed pictures painted in code (icons.js): tools, food, ingots and the newer things to make. They replace the
  // older 16-pixel pictures, and each one can become a 3D model for your hand.
  for (const id of Object.keys(ITEM)) { const pic = paintItem(id, ITEM[id]); if (pic) { const cv = pic.canvas(); ICON_CANVAS.set(id, cv); ICONS[id] = cv.toDataURL(); } }
  useToolModels((name) => { const id = PEOPLE_TOOL[name]; return id && ICON_CANVAS.has(id) ? itemModel(id, 'hand') : null; });
  for (const [id, it] of Object.entries(ITEM)) {
    if (ICONS[id]) continue;
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    if (SHEET_ICONS[id] !== undefined) {
      const k = SHEET_ICONS[id];
      g.drawImage(extraIcons, (k % 8) * 16, Math.floor(k / 8) * 16, 16, 16, 0, 0, 32, 32);
    } else if (it.block && BLOCKS[it.block].shape === 'cube') {
      const info = BLOCKS[it.block];
      const face = (t, m, dark) => { g.setTransform(...m); g.drawImage(tileCanvas(t), 0, 0, 16, 16); if (dark) { g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, 16, 16); } };
      face(info.top, [14 / 16, 7 / 16, -14 / 16, 7 / 16, 16, 2], 0);
      face(info.side, [14 / 16, 7 / 16, 0, 1, 2, 9], 0.22);
      face(info.side, [14 / 16, -7 / 16, 0, 1, 16, 16], 0.4);
    } else continue;
    ICONS[id] = c.toDataURL();
    if (!it.block || IS_CROSS[it.block]) ICON_CANVAS.set(id, c);
  }
  // The older 16-pixel pictures from the phone game (meat, wheat, torches…) become 3D models too.
  await Promise.all(Object.entries(ITEM).filter(([id, it]) => ICONS[id] && !ICON_CANVAS.has(id) && (!it.block || IS_CROSS[it.block])).map(async ([id]) => {
    const img = new Image(); img.src = ICONS[id];
    try { await img.decode(); } catch (_) { return; }
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0);
    ICON_CANVAS.set(id, c);
  }));
  ICONS._plan = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(extraIcons, 6 * 16, 16, 16, 16, 0, 0, 32, 32); return c.toDataURL(); })();
}
function setLoading(text, p) { $('loadText').textContent = text; $('loadBar').style.width = `${Math.round(p * 100)}%`; }

async function boot() {
  updateHelp();
  setLoading('Loading pictures…', 0.02);
  await loadAtlas();
  await makeIcons();
  const atlasCanvas = buildAtlas(atlasImg, extraImg);
  atlasTex = new THREE.CanvasTexture(atlasCanvas);
  atlasTex.colorSpace = THREE.SRGBColorSpace;
  atlasTex.magFilter = THREE.NearestFilter;
  atlasTex.minFilter = THREE.NearestMipmapLinearFilter;
  atlasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  mats = { solid: blockMaterial(atlasTex, 'solid'), cut: blockMaterial(atlasTex, 'cut'), water: waterMaterial(atlasTex) };
  cubeMat = new THREE.MeshLambertMaterial({ map: atlasTex });
  makeDesigner();
  setLoading('Building the world…', 0.05);
  const cityInfo = Object.fromEntries(Object.entries(CITY_INFO).map(([k, v]) => [k, { population: v.population, style: v.style }]));
  const worker = new Worker(new URL('./worldgen.js', import.meta.url));
  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'progress') { setLoading(m.msg, 0.05 + m.p * 0.85); return; }
    worker.terminate();
    world = new World(m.n, m.cells, m.bio);
    scenery = createScenery({ scene, world, H, WL, isSolid: (x, y, z) => world.solid(x, y, z), isAir: (x, y, z) => world.get(x, y, z) === 0,
      groundY: (x, z) => world.groundY(x, z), lights: world.lights, glow: (b) => GLOW[b] > 0, skyOpen: (x, y, z) => world.skyOpen(x, y, z) });
    for (let i = 0; i < m.prot.length; i += 2) world.protected.set(m.prot[i], m.prot[i + 1]);
    G.placed = m.placed; G.cities = m.cities; G.camp = m.camp; G.relicSpots = m.relics; G.canyon = m.canyon; G.wake = m.wake;
    launched.then(start);   // wait for Continue / New world on the launch page
  };
  worker.onerror = () => setLoading('Something went wrong building the world. Reload the page to try again.', 0);
  worker.postMessage({ map: { rows: MAP_ROWS.map((r) => [...r].map((c) => MAP_KEY[c])), settle: MAP_SETTLE }, seed: WORLD_SEED, cityInfo });
}

function start() {
  const s = load();
  // A world made at a different size (before the October 23 bigger map): your things, stars, discoveries, villagers and
  // animals all come with you, but buildings can't, because the land under them has moved. You start at your new camp.
  const resized = !!s && (s.n || 560) !== world.n;
  if (s && resized) { s.edits = []; s.p = null; for (const v of s.villagers || []) { v.home = [G.camp.spawn[0] + (Math.random() - 0.5) * 6, G.camp.spawn[1] + 2]; v.spot = null; } }
  if (s) {
    // Cities that are new or rebuilt since this world was saved replace anything built where they now stand.
    const changed = s.wv >= WORLD_VERSION ? [] : s.wv === 7 ? ['giza'] : s.wv === 6 || s.wv === 5 ? ['rome', 'giza'] : s.wv === 4 ? ['olympia', 'rome', 'giza'] : Object.keys(G.cities);
    const inCity = (x, z) => changed.some((id) => { const c = G.cities[id], p = G.placed[id]; return (c && Math.abs(x - c.center[0]) <= c.R + 8 && Math.abs(z - c.center[1]) <= c.R + 8) || (p && x >= p.rect[0] - 2 && x <= p.rect[2] + 2 && z >= p.rect[1] - 2 && z <= p.rect[3] + 2); });
    for (let i = 0; i + 1 < s.edits.length; i += 2) { const idx = s.edits[i], b = s.edits[i + 1]; const n = world.n, x = idx % n, z = Math.floor(idx / n) % n, y = Math.floor(idx / (n * n)); if (inCity(x, z)) continue; world.set(x, y, z, b); G.edits.set(idx, b); }
    inv.slots = s.inv.map((x) => x && ITEM[x.id] ? x : null);
    if (s.p) [P.x, P.y, P.z, P.yaw, P.pitch] = s.p;
    else { [P.x, P.z] = G.camp.spawn; P.y = world.groundY(Math.floor(P.x), Math.floor(P.z)); P.yaw = 0; P.pitch = -0.2; }
    G.clock = s.clock; G.stars = s.stars; G.found = new Set(s.found); G.talked = new Set(s.talked); G.hunger = s.hunger; G.health = s.health ?? 10; selected = s.sel ?? 0; G.firstPerson = s.fp2 ?? true; G.relics = new Set(s.relics || []); G.villagers = s.villagers || []; G.giftDay = s.giftDay ?? Math.floor(G.clock / 1440);
    for (const [i, b] of G.edits) if (b === 60) { const n = world.n; world.set(i % n, Math.floor(i / (n * n)), Math.floor(i / n) % n, 59); }
  } else {
    inv.add('bronzePickaxe', 1); inv.add('bronzeAxe', 1); inv.add('apple', 4); inv.add('torch', 3);
    [P.x, P.z] = G.camp.spawn; P.y = world.groundY(Math.floor(P.x), Math.floor(P.z));
    const tx = G.camp.door[0] + 0.5 - P.x, tz = G.camp.door[1] + 0.5 - P.z;
    P.yaw = Math.atan2(tx, tz); P.pitch = -0.2;
  }
  // Sheep in the pen, guides at the wonders.
  const pen = G.camp.pen;
  const penMid = [(pen[0] + pen[2]) / 2 + 0.5, (pen[1] + pen[3]) / 2 + 0.5];
  if (s && s.animals) for (const a of s.animals) {
    if (!SPECIES[a.kind]) continue;
    const m = resized ? addMob(a.kind, penMid[0] + (Math.random() - 0.5) * 3, penMid[1] + (Math.random() - 0.5) * 2, a.young) : addMob(a.kind, a.x, a.z, a.young);
    m.home = resized ? [...penMid] : a.home; m.age = a.age || 0; m.bred = a.bred ?? -999; m.tame = !!a.tame;
  }
  else for (let k = 0; k < 3; k++) { const m = addMob('sheep', (pen[0] + pen[2]) / 2 + k - 1 + 0.5, (pen[1] + pen[3]) / 2 + 0.5); m.home = [(pen[0] + pen[2]) / 2 + 0.5, (pen[1] + pen[3]) / 2 + 0.5]; }
  spawnGuides();
  spawnVillagers();
  spawnTravellers();
  spawnRelics();
  try { ships = createShips({ scene, world, WL, IS_WATERY, cities: G.cities }); } catch (err) { console.warn('ships', err); ships = null; }
  try {
    const avoid = [...Object.values(G.placed).map((p) => p.rect), ...Object.values(G.cities).filter(Boolean).map((c) => [c.center[0] - c.R - 4, c.center[1] - c.R - 4, c.center[0] + c.R + 4, c.center[1] + c.R + 4]),
      [G.camp.spawn[0] - 40, G.camp.spawn[1] - 40, G.camp.spawn[0] + 40, G.camp.spawn[1] + 40]];
    const lanes = ships ? ships.ships.map((q) => [...q.course.a, ...q.course.b, q.t.L / 2 + 3]) : [];   // and out of the warships' way
    events = createEvents({ scene, world, WL, cities: G.cities, placed: G.placed, avoid, lanes });
  } catch (err) { console.warn('events', err); events = null; }
  for (const [x, y, z] of G.wake || []) wakeWater(x, y, z);
  refreshHotbar(); refreshHud();
  // Build the chunks right around you before showing the world.
  setLoading('Drawing the land…', 0.92);
  streamChunks(500);
  G.started = true;
  $('loading').hidden = true;
  refreshPaused();
  if (resized) showCard('The world got bigger!', 'Polis World · October 2026', 'The map is now twice as big, and the great cities are further apart. Your things, stars, discoveries, villagers and animals all came with you to your new camp. Anything you built was on land that has moved, so it stayed behind in the old world.');
  else if (!s) showCard('Welcome to Polis World!', 'The computer version', 'Explore the ancient world: find the wonders, from the Pyramids of Giza to Angkor Wat, and talk to their guides. Chop trees, dig into caves, smelt bronze in a furnace and build anything you like.\n\nYour camp is right here, with your house and your sheep. Darius the trader and Tarkan the hunter are camped nearby, and before long someone will come asking for a new home. Press H any time to see the controls.');
  last = performance.now();
  requestAnimationFrame(loop);
}

/// What a block sounds like underfoot or under a pick.
function soundMat(b) {
  if (b === 1 || b === 2 || b === 51) return 'dirt';
  if (b === 4 || b === 5 || b === 24) return 'sand';
  if ([7, 9, 11, 24, 23, 26, 73, 92, 110, 118].includes(b)) return 'wood';
  return 'stone';
}
let soundT = 0, stepDist = 0, lastSx = 0, lastSz = 0, chirpT = 3, wasWet = false;
/// Everything the world does to your ears, once a frame.
function updateSound(dt) {
  if (!sound.started) return;
  // Footsteps, and hoofbeats when you're in the saddle.
  const moved = Math.hypot(P.x - lastSx, P.z - lastSz);
  lastSx = P.x; lastSz = P.z;
  const underB = world.get(Math.floor(P.x), Math.floor(P.y) - 1, Math.floor(P.z));
  if (!P.water && (P.ground || P.ride) && moved > 0.0005) {
    stepDist += moved;
    if (stepDist > (P.ride ? 1.9 : 1.9)) { stepDist = 0; sound.play(P.ride ? 'hoof' : 'step', soundMat(underB)); }
  }
  // Going into the water, and swimming in it.
  if (P.water && !wasWet) sound.play('splash');
  if (P.water && moved > 0.02 && Math.random() < dt * 3) sound.play('swim');
  wasWet = P.water;

  soundT -= dt;
  if (soundT > 0) return;
  soundT = 1.1;
  // Which land's music? The great city you're nearest to, if you're anywhere near one.
  let best = null, bd = 1e9;
  for (const [id, c] of Object.entries(G.cities)) {
    if (!c) continue;
    const d = Math.hypot(c.center[0] - P.x, c.center[1] - P.z);
    if (d < c.R + 80 && d < bd) { bd = d; best = id; }
  }
  const hour = (G.clock % 1440) / 60, night = hour >= 19.5 || hour < 5.5;
  sound.setLand(best ? (CITY_LAND[best] || 'wild') : (night ? 'night' : 'wild'));
  // Wind outside and waves by the sea; both muffled when you're underground or indoors.
  const surf = world.groundY(Math.floor(P.x), Math.floor(P.z));
  const roofed = P.y < surf - 2;
  let sea = false;
  for (const [ox, oz] of [[8, 0], [-8, 0], [0, 8], [0, -8], [14, 14], [-14, -14]]) if (world.hasWater(Math.floor(P.x + ox), Math.floor(P.z + oz))) sea = true;
  sound.setBed(roofed ? 0.25 : 1, sea);
  // Birds by day, crickets at night, both only out of doors.
  chirpT -= 1.1;
  if (chirpT <= 0 && !roofed) {
    chirpT = night ? 1.2 + Math.random() * 2 : 3 + Math.random() * 7;
    sound.play(night ? 'cricket' : 'bird');
  }
}

let last = 0, hudT = 0;
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (world) {
    if (ships) {
      const k = input.keys, atHelm = !!ships.helm, canSteer = atHelm && !openPanel && !dialogueOpen;
      const drive = canSteer ? { fwd: (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) || (input.mode === 'touch' ? input.joy.y : 0), turn: (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) || (input.mode === 'touch' ? input.joy.x : 0) } : {};
      P.steering = atHelm;   // a card or window pauses the ship, but you keep the oars
      const boarded = ships.update(dt, P, input.keys.has('Space'), !G.hover, drive);
      if (boarded) { input.keys.delete('Space'); message(`You climbed aboard the ${boarded.t.name}! Walk to the back and press X to take the steering oars.`); }
    }
    updatePlayer(dt);
    // Hold the mouse button to dig; let go and digging stops (on a touch screen one tap digs the whole block).
    if (input.mode === 'desk') {
      if (input.mining && !openPanel && !dialogueOpen) {
        const a = aimFrom();
        if (a.block && (!breaking || breaking.x !== a.block.x || breaking.y !== a.block.y || breaking.z !== a.block.z)) startBreak(a.block);
        if (!a.block) breaking = null;
      } else breaking = null;
    }
    updateBreaking(dt);
    updateFx(dt); updateDrops(dt); updateParticles(dt); updateFurnaces(dt);
    updateMobs(dt); updateTravellers(dt); updateNpcs(dt); updateHerds(dt); updateCities(dt); updateDiscovery(dt); updateVillage(dt);
    updateFlow(dt); updateSwimmers(dt); updateRelics(dt); updateDesign(dt); updateSpray(dt);
    updateSurvival(dt); updateDaylight(dt);
    updateSound(dt); sound.tick();
    if (scenery) scenery.update(dt, { P, ...look });
    if (events) events.update(dt, P);
    updateCamera(dt);
    // What you're pointing at.
    if (input.mode === 'desk' && !openPanel) { const a = aimFrom(); outline.visible = !!a.block; if (a.block) outline.position.set(a.block.x + 0.5, a.block.y + 0.5, a.block.z + 0.5); }
    else outline.visible = false;
    streamChunks(6);
    hudT -= dt; if (hudT <= 0) { hudT = 0.5; refreshHud(); refreshPaused(); }
    saveTimer -= dt; if (saveTimer <= 0 || (saveSoon && saveTimer < 12)) { saveTimer = 15; saveSoon = false; save(); }
  }
  if (openPanel !== 'designer') renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// For testing: open the page with ?debug to reach the game from the browser console.
if (new URLSearchParams(location.search).has('debug')) window.polisDebug = { P, G, inv, input, wildHere, LAND, get world() { return world; }, travel, setBlock, give, camera, shared, scene, swimmers, D, designs, spawnSwimmers, waterDepthAt, simWater: (k) => { for (let i = 0; i < k; i++) { flowT = 0; updateFlow(1); } return flowQ.length; }, closePanels, wakeWater, flowQ, chunks, renderer, openDesigner, crowds, JOBS, talk: (who, p) => talkPage(who, p), findPath, get scenery() { return scenery; }, get ships() { return ships; }, get events() { return events; }, npcs, updateNpcs, mobs, addMob, hitMob, hurt, mount, dismount, RIDE, NO_RIDE, updateRide, heldItem, offerTreat, sound, updateSound, mobStep: (dt, n) => { for (let i = 0; i < n; i++) updateMobs(dt); }, breed: () => { breedT = 0; herdT = 0; breed(); return mobs.length; }, save, toggleDoor, villageTalk, get refugeeT() { return refugeeT; }, set refugeeT(v) { refugeeT = v; }, stepCities: (dt, n) => { for (let i = 0; i < n; i++) updateCities(dt); }, get designer() { return designer; } };
boot();
