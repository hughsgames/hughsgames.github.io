// Polis World (computer version): Leonardo da Vinci's machines, built as moving models so you can use them.
// Leonardo filled his notebooks with machines that nobody built for hundreds of years. Here they stand in the yard
// in front of his workshop in Florence, and every one of them works: you can fly the flying machine, glide off the
// tower, lift off in the aerial screw, wind up the self-propelled cart, drive the armoured car and fire its guns,
// shoot the great crossbow, paddle the paddle boat on the Arno, and set the mechanical knight and the mechanical
// lion going. (Some of them could never have worked for real — Leonardo tells you which when you ask him.)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { boxUvs } from './graphics.js';

// ---------- what each machine is ----------
// kind says how it moves: fly (flaps up), glide (only ever down), lift (straight up), drive (on the ground),
// boat (on water), aim (stands still and shoots), robot (does something by itself when you press X).
export const MACHINES = {
  ornithopter: { name: "Leonardo's Flying Machine", kind: 'fly', seat: [0, 0.02, -0.25], pose: 'sit', reach: 3.6,
    help: 'Space flaps the wings to climb · W A S D to fly where you look · Shift to go down · X to climb out.',
    fact: 'Leonardo watched birds and bats for years and drew this flying machine around 1490: great wings of wood and linen, beaten by the pilot\'s arms and legs. It could never have flown — a person\'s muscles are far too weak to flap wings that big. Later he realised that and drew gliders instead. But in this game it flies!' },
  glider: { name: "Leonardo's Glider", kind: 'glide', seat: [0, 0, 0], pose: 'hang', reach: 3.2,
    help: 'Space to jump off and glide (or just walk off the edge) · steer by looking where you want to go · W dives faster, S floats slower · X to let go.',
    fact: 'Later in life Leonardo stopped trying to flap like a bird and drew wings that stay still, like a soaring eagle\'s. A story says one of his helpers tried to fly from Monte Ceceri, a hill outside Florence — nobody knows if it is true. In 2002 a glider built to his drawings flew in England, carrying a pilot a few metres off the ground.' },
  aerialScrew: { name: 'The Aerial Screw', kind: 'lift', seat: [0, 0.22, -1.25], pose: 'stand', reach: 3.4,
    help: 'Space to spin the screw and rise · Shift to go down · W A S D to drift · X to step off.',
    fact: 'Leonardo drew the aerial screw around 1489: a spiral of stiffened linen, nearly five metres across, that was meant to screw its way up into the air the way a screw goes into wood. Four men would have run round pushing bars to turn it. It could not really have flown, but it is the first drawing of anything like a helicopter. Real helicopters came 450 years later.' },
  cart: { name: 'The Self-Propelled Cart', kind: 'drive', seat: [0, 0.22, -0.2], pose: 'sit', reach: 3.0, speed: 7,
    help: 'W A S D to drive · Space winds up the spring when it runs down · X to climb off.',
    fact: 'Leonardo drew this cart around 1478. It has no horse: big springs, wound up like a clock, turn the wheels, and it could be set to steer by itself. Some people call it the first robot car. In 2004 a museum in Florence built one from his drawing — and it worked!' },
  tank: { name: 'The Armoured Car', kind: 'drive', seat: [0, 1.3, 0], pose: 'sit', reach: 4.2, speed: 3.4, guns: true,
    help: 'W A S D to drive · Space (or click) fires the guns · X to climb out.',
    fact: 'Leonardo drew this armoured car around 1487 for the Duke of Milan: a wooden shell like a turtle\'s, with guns pointing out all the way round and a lookout on top. Eight men inside would turn cranks to move it. In his drawing the gears would turn the front and back wheels opposite ways, so it could never move — some people think he did that on purpose, so nobody could build it. Real tanks were first used in 1916.' },
  crossbow: { name: 'The Great Crossbow', kind: 'aim', seat: [0, 0, -3.2], pose: 'stand', reach: 4.5,
    help: 'Look where you want to shoot · Space (or click) to fire · X to step away. Can you hit the red targets?',
    fact: 'Leonardo drew a giant crossbow about 24 metres across, on six wheels, around 1485. Its bow was made of thin layers of wood so it would bend without breaking, and it was meant to frighten an enemy as much as to hurt them. Nobody knows if one was ever built in his time.' },
  paddleBoat: { name: 'The Paddle Boat', kind: 'boat', seat: [0, 0.0, -0.6], pose: 'sit', reach: 3.6, speed: 4.6,
    help: 'W A S D to paddle · X to climb out onto the bank.',
    fact: 'Leonardo sketched boats moved by paddle wheels on their sides, turned by a crank instead of rowed with oars. Steamboats used paddle wheels just like these three hundred years later.' },
  knight: { name: 'The Mechanical Knight', kind: 'robot', reach: 3.0,
    fact: 'Around 1495 Leonardo built a knight in armour for a party in Milan. Inside it, cables and pulleys made it sit up, stand, move its arms and lift its visor, all by itself. In 2002 a robot engineer built one from his notes, and it worked. It is one of the first robots ever designed.' },
  lion: { name: 'The Mechanical Lion', kind: 'robot', reach: 3.4,
    fact: 'In 1515 Leonardo made a mechanical lion for the new King of France. At the celebration it walked forward a few steps by itself, stopped, and its chest opened up — full of lilies, the flower of the kings of France. Everyone was amazed. Nobody knows exactly how it worked, but in 2009 a team built one from his ideas.' },
};

// ---------- building the models ----------
const BOX = boxUvs(new THREE.BoxGeometry(1, 1, 1));   // rounded-box faces (graphics.js)
const MATS = new Map();
const mat = (c) => { let m = MATS.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: c }); MATS.set(c, m); } return m; };
function box(parent, sx, sy, sz, color, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(BOX, mat(color));
  m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
const joint = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
function wheel(parent, r, w, color, x, y, z) {
  const g = joint(parent, x, y, z);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), mat(color)); m.rotation.z = Math.PI / 2; m.castShadow = true; g.add(m);
  for (let k = 0; k < 3; k++) box(g, w + 0.02, r * 1.8, 0.07, 0x3a2614, 0, 0, 0, k * Math.PI / 3, 0, 0);   // spokes, so you can see it turn
  return g;
}
const WOOD = 0x9a6b3c, DARK = 0x5e3e22, LINEN = 0xeee3c8, RED = 0xa8322b, BRONZE = 0xb07a35, IRON = 0x6a6a72, ROPE = 0xc9a86a, STEEL = 0xbfc5cc;

const BUILD = {
  ornithopter(g, parts) {
    box(g, 0.24, 0.24, 4.2, WOOD, 0, 0.95, 0);                       // the long boom
    box(g, 1.7, 0.18, 0.18, WOOD, 0, 0.95, 0.35);                     // the cross-spar the wings hang from
    box(g, 0.9, 0.1, 1.6, DARK, 0, 0.55, -0.25);                      // the pilot's cradle
    for (const s of [-1, 1]) {
      box(g, 0.12, 0.12, 2.8, WOOD, s * 0.62, 0.06, 0);               // skids to land on
      for (const z of [-0.8, 0.8]) box(g, 0.09, 0.85, 0.09, WOOD, s * 0.62, 0.5, z);
    }
    box(g, 2.0, 0.05, 1.0, LINEN, 0, 1.0, -2.3);                      // the tail
    box(g, 0.05, 0.75, 0.9, LINEN, 0, 1.38, -2.3);
    box(g, 0.08, 0.08, 1.1, ROPE, 0, 1.25, -1.7, -0.5, 0, 0);
    parts.wings = [];
    for (const s of [-1, 1]) {
      const w = joint(g, s * 0.3, 1.1, 0.35);
      box(w, 4.8, 0.12, 0.12, WOOD, s * 2.4, 0, 0.55);                 // the leading edge
      for (let k = 0; k < 5; k++) {
        const x = s * (0.7 + k * 0.95), d = 2.1 - k * 0.28;
        box(w, 0.06, 0.06, d, WOOD, x, 0.02, 0.55 - d / 2);           // the finger bones, like a bat's
        box(w, 0.95, 0.03, d - 0.1, LINEN, x - s * 0.47, -0.01, 0.55 - d / 2);
      }
      parts.wings.push(w);
    }
    box(g, 0.1, 0.1, 0.6, ROPE, 0, 0.75, 0.35);                       // the pedal cords
  },
  glider(g, parts) {
    // A hang glider: fixed wings overhead, an A-frame and a bar to hold on to.
    for (const s of [-1, 1]) {
      const w = joint(g, 0, 2.25, 0); w.rotation.z = s * 0.08;          // a little upward tilt, to keep it steady
      box(w, 4.2, 0.1, 0.1, WOOD, s * 2.1, 0, 0.6);
      for (let k = 0; k < 5; k++) { const d = 2.4 - k * 0.32; box(w, 0.05, 0.05, d, WOOD, s * (0.4 + k * 0.85), 0, 0.6 - d / 2); box(w, 0.85, 0.03, d - 0.1, LINEN, s * (0.4 + k * 0.85 - 0.42), -0.02, 0.6 - d / 2); }
    }
    box(g, 0.12, 0.12, 3.2, WOOD, 0, 2.3, -0.4);
    box(g, 1.4, 0.04, 0.8, LINEN, 0, 2.3, -1.8);
    for (const s of [-1, 1]) box(g, 0.07, 1.4, 0.07, WOOD, s * 0.45, 1.6, 0.25, 0, 0, s * 0.3);
    box(g, 1.3, 0.07, 0.07, WOOD, 0, 0.95, 0.25);                     // the bar you hold
    box(g, 0.05, 1.2, 0.05, ROPE, 0, 1.65, -0.1);
  },
  aerialScrew(g, parts) {
    box(g, 3.2, 0.2, 3.2, WOOD, 0, 0.1, 0);                           // the platform the men stood on
    for (const s of [-1, 1]) { box(g, 3.0, 0.1, 0.1, DARK, 0, 0.95, s * 0.7); box(g, 0.1, 0.1, 3.0, DARK, s * 0.7, 0.95, 0); }   // the bars they pushed
    box(g, 0.22, 4.4, 0.22, WOOD, 0, 2.3, 0);                         // the mast
    const rotor = joint(g, 0, 0, 0);
    // One and a quarter turns of stiffened linen, laid as many thin overlapping slices so it reads as one smooth spiral.
    const N = 44;
    for (let k = 0; k < N; k++) {
      const a = k * 0.18, h = 2.0 + k * 0.042, rr = 1.45;
      const seg = joint(rotor, 0, h, 0); seg.rotation.y = -a;
      box(seg, 2.5, 0.035, 0.58, k % 4 < 2 ? LINEN : 0xe6d9b8, rr, 0, 0, 0.08, 0, 0);
      box(seg, 0.05, 0.05, 0.5, ROPE, rr + 1.27, 0, 0);                // the wire round the rim
      if (k % 6 === 0) box(seg, 2.6, 0.05, 0.05, WOOD, rr, -0.03, 0);   // a rib every so often
    }
    box(rotor, 0.4, 0.15, 0.4, BRONZE, 0, 4.5, 0);
    parts.rotor = rotor;
  },
  cart(g, parts) {
    box(g, 2.2, 0.22, 2.7, WOOD, 0, 0.62, 0);
    parts.wheels = [wheel(g, 0.55, 0.16, DARK, -1.15, 0.55, -0.75), wheel(g, 0.55, 0.16, DARK, 1.15, 0.55, -0.75), wheel(g, 0.42, 0.16, DARK, 0, 0.42, 1.25)];
    // The two great springs, coiled flat under round wooden covers, and the gears between them.
    parts.springs = [];
    for (const s of [-1, 1]) {
      const sp = joint(g, s * 0.55, 0.85, -0.35);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.2, 14), mat(WOOD)); drum.castShadow = true; sp.add(drum);
      box(sp, 0.86, 0.22, 0.08, DARK, 0, 0.02, 0);
      parts.springs.push(sp);
    }
    for (const s of [-1, 1]) box(g, 0.1, 0.5, 1.6, DARK, s * 0.95, 0.95, 0.3);
    box(g, 0.14, 0.6, 0.14, BRONZE, 0, 1.0, 0.9);                      // the steering post
    box(g, 0.9, 0.12, 0.6, RED, 0, 0.79, -0.2);                        // a cushion for you
  },
  tank(g, parts) {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 3.1, 2.1, 12, 1, true), mat(WOOD));
    shell.material.side = THREE.DoubleSide; shell.position.y = 1.35; shell.castShadow = true; g.add(shell);
    for (let k = 0; k < 12; k++) box(g, 0.1, 3.1, 0.12, DARK, Math.sin(k * Math.PI / 6) * 1.94, 1.35, Math.cos(k * Math.PI / 6) * 1.94).rotation.set(-0.84, k * Math.PI / 6, 0, 'YXZ');   // the planks, running up the slope
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.15, 0.3, 14), mat(DARK)); base.position.y = 0.32; g.add(base);
    const look = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.7, 10), mat(BRONZE)); look.position.y = 2.75; g.add(look);
    box(g, 0.08, 1.0, 0.08, WOOD, 0, 3.4, 0); box(g, 0.5, 0.32, 0.03, RED, 0.26, 3.75, 0);   // a little banner
    parts.guns = [];
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, x = Math.sin(a) * 2.75, z = Math.cos(a) * 2.75;
      const gun = joint(g, x, 0.72, z); gun.rotation.y = a;
      box(gun, 0.26, 0.26, 0.8, IRON, 0, 0, 0.2);
      parts.guns.push(gun);
    }
    parts.wheels = [];
    for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) parts.wheels.push(wheel(g, 0.42, 0.18, DARK, x, 0.42, z));
  },
  crossbow(g, parts) {
    for (const s of [-1, 1]) for (const z of [-1.6, 0, 1.6]) wheel(g, 0.45, 0.16, DARK, s * 0.75, 0.45, z);
    box(g, 1.3, 0.25, 4.2, WOOD, 0, 0.75, 0);                          // the carriage
    const aim = joint(g, 0, 1.0, 0);
    box(aim, 0.42, 0.32, 5.0, WOOD, 0, 0.15, 0.3);                      // the stock
    box(aim, 0.3, 0.12, 0.9, BRONZE, 0, 0.35, -1.9);                    // the trigger
    // The bow: thin layers of wood, curved back at the tips.
    const bow = [];
    for (let k = -7; k <= 7; k++) {
      if (k === 0) continue;
      const x = k * 0.55, bend = (k * k) * 0.012;
      bow.push(box(aim, 0.58, 0.22, 0.2, k % 2 ? WOOD : DARK, x, 0.2, 2.6 - bend, 0, -Math.sign(k) * Math.abs(k) * 0.02, 0));
    }
    box(aim, 0.5, 0.4, 0.3, BRONZE, 0, 0.2, 2.65);
    parts.strL = joint(aim, -3.85, 0.25, 2.0); parts.strR = joint(aim, 3.85, 0.25, 2.0);
    parts.strL.add(new THREE.Mesh(BOX, mat(ROPE))); parts.strR.add(new THREE.Mesh(BOX, mat(ROPE)));
    parts.bolt = joint(aim, 0, 0.42, 0.6);
    box(parts.bolt, 0.09, 0.09, 1.9, WOOD, 0, 0, 0); box(parts.bolt, 0.16, 0.16, 0.3, IRON, 0, 0, 1.0);
    parts.aim = aim;
  },
  paddleBoat(g, parts) {
    box(g, 1.7, 0.55, 3.6, DARK, 0, 0.1, 0);
    box(g, 1.2, 0.5, 0.8, DARK, 0, 0.12, 2.1, 0, Math.PI / 4, 0).scale.set(1.15, 0.5, 1.15);
    box(g, 1.5, 0.08, 3.4, WOOD, 0, 0.4, 0);
    box(g, 0.9, 0.12, 0.5, RED, 0, 0.5, -0.6);                          // the seat
    box(g, 0.1, 0.5, 0.1, BRONZE, 0, 0.7, 0.3); box(g, 0.6, 0.08, 0.08, BRONZE, 0, 0.95, 0.3);   // the crank
    parts.paddles = [];
    for (const s of [-1, 1]) {
      const w = joint(g, s * 1.05, 0.35, 0.1);
      box(w, 0.08, 0.2, 0.2, BRONZE, 0, 0, 0);
      for (let k = 0; k < 6; k++) { const p = joint(w, 0, 0, 0); p.rotation.x = k * Math.PI / 3; box(p, 0.3, 0.06, 0.7, WOOD, s * 0.1, 0, 0.4); box(p, 0.32, 0.4, 0.06, WOOD, s * 0.1, 0, 0.74); }
      parts.paddles.push(w);
    }
  },
  knight(g, parts) {
    const legs = [], arms = [];
    for (const s of [-1, 1]) {
      const l = joint(g, s * 0.16, 0.92, 0);
      box(l, 0.24, 0.9, 0.26, STEEL, 0, -0.45, 0); box(l, 0.26, 0.12, 0.36, IRON, 0, -0.88, 0.05);
      legs.push(l);
    }
    box(g, 0.56, 0.28, 0.34, IRON, 0, 1.02, 0);                          // the hips
    box(g, 0.62, 0.62, 0.38, STEEL, 0, 1.45, 0);                         // the breastplate
    box(g, 0.5, 0.5, 0.06, RED, 0, 1.25, 0.2);                           // the red tabard of Milan
    for (const s of [-1, 1]) {
      const a = joint(g, s * 0.4, 1.68, 0);
      box(a, 0.2, 0.36, 0.22, STEEL, 0, -0.12, 0); box(a, 0.17, 0.62, 0.19, STEEL, 0, -0.5, 0); box(a, 0.2, 0.16, 0.22, IRON, 0, -0.85, 0);
      arms.push(a);
    }
    const head = joint(g, 0, 1.78, 0);
    box(head, 0.4, 0.44, 0.42, STEEL, 0, 0.2, 0);
    box(head, 0.06, 0.18, 0.36, RED, 0, 0.5, -0.04);                     // a plume
    const visor = joint(head, 0, 0.3, 0.2);
    box(visor, 0.42, 0.22, 0.08, IRON, 0, -0.06, 0.02);
    box(visor, 0.3, 0.03, 0.1, 0x1a1a1e, 0, -0.04, 0.04);                // the eye slit
    parts.legs = legs; parts.arms = arms; parts.head = head; parts.visor = visor;
    // a little iron face behind the visor, for when it lifts
    box(head, 0.3, 0.2, 0.04, 0x2a2a30, 0, 0.22, 0.2);
  },
  lion(g, parts) {
    const GOLD = 0xc99a44, MANE = 0x8a5a24;
    box(g, 0.9, 0.82, 2.0, GOLD, 0, 1.15, 0);
    const legs = [];
    for (const [x, z] of [[-0.3, 0.7], [0.3, 0.7], [-0.3, -0.7], [0.3, -0.7]]) { const l = joint(g, x, 0.85, z); box(l, 0.24, 0.85, 0.26, GOLD, 0, -0.42, 0); box(l, 0.28, 0.12, 0.34, MANE, 0, -0.82, 0.04); legs.push(l); }
    const head = joint(g, 0, 1.6, 1.0);
    box(head, 0.95, 0.95, 0.5, MANE, 0, 0, 0);                             // the mane
    box(head, 0.6, 0.6, 0.5, GOLD, 0, -0.04, 0.32);
    box(head, 0.34, 0.24, 0.2, 0xd8b06a, 0, -0.18, 0.62);
    box(head, 0.12, 0.08, 0.06, 0x3a2614, 0, -0.08, 0.72);
    for (const s of [-1, 1]) { box(head, 0.1, 0.08, 0.04, 0x1e140c, s * 0.15, 0.08, 0.58); box(head, 0.16, 0.16, 0.1, MANE, s * 0.25, 0.35, 0.3); }
    const tail = joint(g, 0, 1.4, -1.0); box(tail, 0.1, 0.1, 0.8, GOLD, 0, 0, -0.4, 0.5, 0, 0); box(tail, 0.2, 0.2, 0.22, MANE, 0, -0.33, -0.75);
    // The chest doors, and the lilies hidden behind them.
    const doors = [];
    for (const s of [-1, 1]) { const d = joint(g, s * 0.4, 1.15, 1.01); box(d, 0.4, 0.6, 0.05, 0xb88a3a, -s * 0.2, 0, 0); doors.push(d); }
    const lilies = joint(g, 0, 1.0, 0.8);
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2, f = joint(lilies, Math.cos(a) * 0.18, 0, Math.sin(a) * 0.1);
      box(f, 0.04, 0.4, 0.04, 0x4f8a3a, 0, 0.2, 0);
      for (let q = 0; q < 3; q++) box(f, 0.06, 0.2, 0.06, 0xfaf6ea, Math.cos(q * 2.1) * 0.06, 0.44, Math.sin(q * 2.1) * 0.06, Math.sin(q * 2.1) * 0.5, 0, -Math.cos(q * 2.1) * 0.5);
      box(f, 0.05, 0.08, 0.05, 0xe8c040, 0, 0.42, 0);
    }
    lilies.scale.setScalar(0.01); lilies.visible = false;
    parts.legs = legs; parts.head = head; parts.tail = tail; parts.doors = doors; parts.lilies = lilies;
  },
};

// ---------- the machines in the world ----------
export function createMachines({ scene, group, world, WL, H, IS_WATER, IS_SOLID, spots, targets, saved, sound, say, onFirst, onBullseye }) {
  const list = [];
  const bolts = [];
  const puffs = [];
  let riding = null;
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const groundAt = (x, z, from) => world.groundY(Math.floor(x), Math.floor(z), Math.floor(from));
  // The top of the water under a spot (or null if there's no water there).
  function waterTop(x, z, from) {
    const bx = Math.floor(x), bz = Math.floor(z);
    for (let y = Math.floor(from) + 1; y >= Math.max(1, WL - 6); y--) {
      const b = world.get(bx, y, bz);
      if (IS_WATER[b]) return y + 0.88;
      if (IS_SOLID[b]) return null;
    }
    return null;
  }
  // Is there room for a machine of radius r and height h here? (Checked at a few points round its edge.)
  /// The ground under a machine's whole footprint, not just its middle: it rests on the highest point beneath it,
  /// so it never settles with a wing or a skid sunk into a hillside or a step (which used to leave it stuck there).
  function floorUnder(x, z, r, from) {
    let y = 0;
    for (const [ox, oz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, -r * 0.7]]) y = Math.max(y, groundAt(x + ox, z + oz, from));
    const wt = waterTop(x, z, from);
    return wt !== null && wt > y ? wt - 0.1 : y;   // a flying machine skims the water rather than sinking
  }
  function clear(x, y, z, r, h) {
    for (const [ox, oz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) for (let dy = 0.3; dy < h; dy += 0.9) {
      if (IS_SOLID[world.get(Math.floor(x + ox), Math.floor(y + dy), Math.floor(z + oz))]) return false;
    }
    return true;
  }
  const SIZE = { ornithopter: [1.0, 1.6], glider: [0.9, 2.4], aerialScrew: [1.2, 4.6], cart: [1.0, 1.2], tank: [2.2, 2.4], crossbow: [1, 1.5], paddleBoat: [0.9, 1.0], knight: [0.35, 2.0], lion: [0.5, 1.8] };

  for (const sp of spots) {
    const t = MACHINES[sp.id]; if (!t) continue;
    const g = new THREE.Group(), parts = {};
    BUILD[sp.id](g, parts);
    const m = { id: sp.id, t, g, parts, x: sp.x, y: sp.y, z: sp.z, yaw: sp.yaw || 0, vy: 0, vx: 0, vz: 0, spin: 0, phase: 0, wound: 1, cool: 0, home: { ...sp }, kind: 'machine' };
    const s = saved && saved.find((q) => q.id === sp.id);
    if (s && Number.isFinite(s.x) && world.inb(Math.floor(s.x), Math.floor(s.z))) {
      m.x = s.x; m.y = s.y; m.z = s.z; m.yaw = s.yaw || 0; m.wound = s.wound ?? 1;
      if (t.kind !== 'boat') { const gr = groundAt(m.x, m.z, m.y + 1); if (m.y > gr + 0.3 || m.y < gr - 2) m.y = gr; }   // a machine saved in mid-air comes down
    }
    if (sp.id === 'lion') { m.x = sp.x; m.y = sp.y; m.z = sp.z; m.yaw = sp.yaw; }
    g.userData.entity = { kind: 'machine', m, name: t.name };
    m.ent = g.userData.entity;
    g.position.set(m.x, m.y, m.z); g.rotation.y = m.yaw;
    group.add(g);
    list.push(m);
  }
  const by = (id) => list.find((m) => m.id === id);

  // ---------- getting in and out ----------
  function seatPos(m) {
    const s = m.t.seat || [0, 0, 0], c = Math.cos(m.yaw), sn = Math.sin(m.yaw);
    return [m.x + s[0] * c + s[2] * sn, m.y + s[1], m.z - s[0] * sn + s[2] * c];
  }
  function board(m) {
    if (m.t.kind === 'robot') { robot(m); return; }
    if (m.id === 'paddleBoat' && waterTop(m.x, m.z, m.y + 2) === null) { say('The paddle boat is stuck on dry land. Ask Leonardo to put it back on the river.'); return; }
    riding = m; m.g.userData.entity = null;
    m.vy = 0; m.vx = 0; m.vz = 0;
    say(`You climbed into ${m.t.name.replace(/^The /, 'the ')}! ${m.t.help}`);
    sound.play('door');
    onFirst(m);
  }
  function leave(P, force = false) {
    const m = riding; if (!m) return true;
    const airborne = m.t.kind !== 'boat' && m.t.kind !== 'aim' && m.y > groundAt(m.x, m.z, m.y + 0.6) + 1.2;
    const c = Math.cos(m.yaw), s = Math.sin(m.yaw);
    const r = (SIZE[m.id] || [1])[0] + 0.9;
    let spot = null;
    if (m.t.kind === 'aim') spot = seatPos(m);
    else if (airborne) spot = [P.x, P.y, P.z];   // you can let go in mid-air — with a parachute that's even safe!
    else for (const [ox, oz] of [1, 1.6, 2.3, 3.1].flatMap((f) => [[r * f, 0], [-r * f, 0], [0, -r * f], [0, r * f], [r * f, -r * f], [-r * f, -r * f], [r * f, r * f], [-r * f, r * f]])) {
      const x = m.x + ox * c + oz * s, z = m.z - ox * s + oz * c;
      const g = groundAt(x, z, m.y + 1.6);
      const wet = IS_WATER[world.get(Math.floor(x), Math.floor(g), Math.floor(z))] || IS_WATER[world.get(Math.floor(x), Math.floor(g) - 1, Math.floor(z))];
      if (wet && m.t.kind === 'boat') continue;
      if (g <= m.y + 1.6 && g > m.y - 4 && !IS_SOLID[world.get(Math.floor(x), Math.floor(g), Math.floor(z))] && !IS_SOLID[world.get(Math.floor(x), Math.floor(g) + 1, Math.floor(z))]) { spot = [x, g, z]; break; }
    }
    if (!spot) {
      if (m.t.kind === 'boat' && !force) { say('Paddle over to the bank first, then climb out.'); return false; }
      spot = [m.x, m.y + 2.6, m.z];
    }
    [P.x, P.y, P.z] = spot; P.vx = P.vz = 0; P.vy = 0;
    riding = null; m.g.userData.entity = m.ent;
    if (m.id === 'cart' || m.id === 'tank') m.vx = m.vz = 0;
    say(airborne ? `You let go of ${m.t.name.replace(/^The /, 'the ')}!` : `You climbed out of ${m.t.name.replace(/^The /, 'the ')}.`);
    return true;
  }

  // ---------- driving ----------
  // ctl: { fwd, side, up, down, fire, yaw, pitch } — fwd/side are where you're steering, relative to where you look.
  function drive(dt, ctl, P) {
    const m = riding; if (!m) return;
    const k = m.t.kind;
    const sy = Math.sin(ctl.yaw), cy = Math.cos(ctl.yaw);
    let wx = sy * ctl.fwd - cy * ctl.side, wz = cy * ctl.fwd + sy * ctl.side;
    const amt = Math.min(Math.hypot(wx, wz), 1);
    if (amt > 0.05) { const l = Math.hypot(wx, wz); wx /= l; wz /= l; } else { wx = 0; wz = 0; }
    const [r, h] = SIZE[m.id] || [1, 1.5];
    const ground = groundAt(m.x, m.z, m.y + 0.6);
    const air = m.y > ground + 0.05;
    let moved = 0;

    if (k === 'fly' || k === 'lift') {
      const fly = k === 'fly';
      const top = fly ? 5.2 : 3.4, sink = fly ? -1.1 : -0.25;
      const want = ctl.up ? top : ctl.down ? -4.5 : (air ? sink : 0);
      m.vy += (want - m.vy) * Math.min(dt * (fly ? 2.6 : 3.5), 1);
      const pace = fly ? (air ? 10.5 : 3) : 3.6;
      m.vx += (wx * amt * pace - m.vx) * Math.min(dt * (fly ? 1.8 : 2.5), 1);
      m.vz += (wz * amt * pace - m.vz) * Math.min(dt * (fly ? 1.8 : 2.5), 1);
      if (fly) {
        m.phase += dt * (ctl.up ? 10 : air && amt > 0.05 ? 6 : air ? 3.2 : 0);
        const a = air || ctl.up ? Math.sin(m.phase) * 0.6 + 0.08 : -0.12;
        m.parts.wings[0].rotation.z = -a; m.parts.wings[1].rotation.z = a;
        if (ctl.up || (air && amt > 0.05)) { m.flapT = (m.flapT || 0) - dt; if (m.flapT <= 0) { m.flapT = Math.PI * 2 / (ctl.up ? 10 : 6); sound.play('flap'); } }
      } else {
        m.spin += ((ctl.up || air ? 9 : 0) - m.spin) * Math.min(dt * 1.5, 1);
        m.parts.rotor.rotation.y += m.spin * dt;
        if (m.spin > 2) { m.whT = (m.whT || 0) - dt; if (m.whT <= 0) { m.whT = 0.35; sound.play('whirr'); } }
      }
    } else if (k === 'glide') {
      if (!air && !m.launched) {
        // On the ground (or the tower's platform): you carry it at a walk. Space or W runs and jumps off.
        m.vx = wx * amt * 2.6; m.vz = wz * amt * 2.6;
        m.vy = Math.min(m.vy, 0);
        if (ctl.upEdge) { m.vy = 4.6; m.launched = true; m.yaw = ctl.yaw; m.vx = Math.sin(m.yaw) * 7; m.vz = Math.cos(m.yaw) * 7; sound.play('jump'); }
      } else {
        // In the air: always moving forward, always coming down slowly. Look where you want to go.
        m.yaw = angleTo(m.yaw, ctl.yaw, dt * 1.6);
        const fast = ctl.fwd > 0.3, slow = ctl.fwd < -0.3;
        const pace = fast ? 12 : slow ? 6.5 : 9, sink = fast ? -3.2 : slow ? -1.0 : -1.6;
        m.vx += (Math.sin(m.yaw) * pace - m.vx) * Math.min(dt * 1.5, 1);
        m.vz += (Math.cos(m.yaw) * pace - m.vz) * Math.min(dt * 1.5, 1);
        m.vy += (sink - m.vy) * Math.min(dt * 1.2, 1);
        m.windT = (m.windT || 0) - dt; if (m.windT <= 0) { m.windT = 0.9; sound.play('wind'); }
      }
    } else if (k === 'drive') {
      let pace = m.t.speed;
      if (m.id === 'cart') {
        pace *= Math.min(1, m.wound * 1.6);
        if (ctl.upEdge) { m.wound = Math.min(1, m.wound + 0.34); sound.play('ratchet'); if (m.wound >= 1) say('The spring is wound up tight. Off you go!'); }
        if (m.wound <= 0 && amt > 0.05 && !m.toldWind) { m.toldWind = true; say('The spring has run down! Press Space to wind it up again.'); }
        if (m.wound > 0) m.toldWind = false;
      }
      m.vx += (wx * amt * pace - m.vx) * Math.min(dt * 4, 1);
      m.vz += (wz * amt * pace - m.vz) * Math.min(dt * 4, 1);
      if (m.t.guns && ctl.fire) fireGuns(m);
    } else if (k === 'boat') {
      m.vx += (wx * amt * m.t.speed - m.vx) * Math.min(dt * 2, 1);
      m.vz += (wz * amt * m.t.speed - m.vz) * Math.min(dt * 2, 1);
    } else if (k === 'aim') {
      m.vx = m.vz = 0;
      m.yaw = angleTo(m.yaw, ctl.yaw + Math.PI * 0, dt * 3);
      m.parts.aim.rotation.x = Math.max(-0.35, Math.min(0.5, -ctl.pitch * 0.8));
      if (ctl.fire) fireBolt(m, ctl);
    }

    // Move, one axis at a time, so you slide along walls instead of sticking to them.
    const wedged = (k === 'fly' || k === 'lift' || k === 'glide') && !clear(m.x, m.y + 0.05, m.z, r, h);
    if (k !== 'aim') {
      for (const axis of ['x', 'z']) {
        const step = (axis === 'x' ? m.vx : m.vz) * dt;
        if (!step) continue;
        const nx = axis === 'x' ? m.x + step : m.x, nz = axis === 'z' ? m.z + step : m.z;
        if (k === 'drive') {
          const g = groundAt(nx, nz, m.y + 1.1);
          const wet = waterTop(nx, nz, g + 0.5) !== null && IS_WATER[world.get(Math.floor(nx), Math.floor(g), Math.floor(nz))];
          if (!wet && g <= m.y + 1.05 && g > m.y - 4 && clear(nx, g, nz, r * 0.8, Math.min(h, 1.8))) { if (axis === 'x') m.x = nx; else m.z = nz; moved += Math.abs(step); }
          else if (axis === 'x') m.vx = 0; else m.vz = 0;
        } else if (k === 'boat') {
          const wt = waterTop(nx, nz, m.y + 1.5);
          const tip = waterTop(nx + Math.sign(m.vx) * r * 0.8 * (axis === 'x'), nz + Math.sign(m.vz) * r * 0.8 * (axis === 'z'), m.y + 1.5);
          if (wt !== null && tip !== null && clear(nx, wt, nz, r * 0.6, 1)) { if (axis === 'x') m.x = nx; else m.z = nz; moved += Math.abs(step); }
          else if (axis === 'x') m.vx = 0; else m.vz = 0;
        } else {
          // Blocked only if this step would take it from clear air into something. If it's already touching
          // something (it was parked against a wall, or a block was built beside it), it can always move away.
          if (clear(nx, m.y + 0.05, nz, r, h) || wedged) { if (axis === 'x') m.x = nx; else m.z = nz; moved += Math.abs(step); }
          else if (!air && clear(nx, m.y + 1.1, nz, r, h) && floorUnder(nx, nz, r * 0.8, m.y + 1.6) <= m.y + 1.1) {
            // On the ground, it bumps up a one-block step instead of stopping dead, the way you walk up one.
            if (axis === 'x') m.x = nx; else m.z = nz; m.y = floorUnder(nx, nz, r * 0.8, m.y + 1.6); moved += Math.abs(step);
          }
          else if (axis === 'x') m.vx *= -0.2; else m.vz *= -0.2;
        }
      }
      if (moved > 0.0005 && k !== 'glide' && Math.hypot(m.vx, m.vz) > 0.4) m.yaw = angleTo(m.yaw, Math.atan2(m.vx, m.vz), dt * (k === 'drive' || k === 'boat' ? 4 : 2.5));
    }

    // Up and down.
    if (k === 'boat') {
      const wt = waterTop(m.x, m.z, m.y + 1.5);
      if (wt !== null) m.y += ((wt - 0.32) - m.y) * Math.min(dt * 5, 1);
      for (const p of m.parts.paddles) p.rotation.x += moved * 1.6;
    } else if (k === 'drive') {
      const g = groundAt(m.x, m.z, m.y + 1.1);
      m.y = m.y < g ? Math.min(g, m.y + dt * 8) : Math.max(g, m.y - dt * 14);
      const turn = moved * 1.8;
      for (const w of m.parts.wheels || []) w.rotation.x += turn;
      if (m.id === 'cart') {
        m.wound = Math.max(0, m.wound - moved / 110);
        for (const sp of m.parts.springs) sp.rotation.y += moved * 1.2;
        if (moved > 0) { m.whT = (m.whT || 0) - dt; if (m.whT <= 0) { m.whT = 0.4; sound.play('whirr'); } }
      } else if (moved > 0) { m.whT = (m.whT || 0) - dt; if (m.whT <= 0) { m.whT = 0.55; sound.play('clank'); } }
    } else if (k !== 'aim') {
      let ny = m.y + m.vy * dt;
      // A ceiling stops you climbing — but only a real one just over your head, and never when you're already wedged.
      if (m.vy > 0 && !wedged && !clear(m.x, ny + 0.2, m.z, r * 0.6, Math.min(h, 2))) { ny = m.y; m.vy = 0; }
      const floor = floorUnder(m.x, m.z, r * 0.8, m.y + 0.6);
      if (ny <= floor) {
        if (m.vy < -2.5) sound.play('land');
        ny = floor; m.vy = Math.max(0, m.vy);
        if (k === 'glide' && m.launched && m.y > floor + 0.01) { m.launched = false; m.vx *= 0.3; m.vz *= 0.3; say('You landed! Press X to let go of the glider.'); }
        if (k === 'glide') { m.vx *= Math.max(0, 1 - dt * 4); m.vz *= Math.max(0, 1 - dt * 4); }
      }
      m.y = Math.min(ny, H - 4);
      // Tilt into turns and dives, the way a bird does.
      if (k === 'fly' || k === 'glide') {
        const bank = Math.max(-0.5, Math.min(0.5, ((m.lastYaw ?? m.yaw) - m.yaw) / Math.max(dt, 1e-3) * 0.35));
        m.g.rotation.z += (bank - m.g.rotation.z) * Math.min(dt * 3, 1);
        m.g.rotation.x += ((air ? -m.vy * 0.05 : 0) - m.g.rotation.x) * Math.min(dt * 3, 1);
      }
    }
    m.x = Math.max(3, Math.min(world.n - 3, m.x)); m.z = Math.max(3, Math.min(world.n - 3, m.z));   // the edge of the world stops you
    m.lastYaw = m.yaw;
    m.g.position.set(m.x, m.y, m.z);
    m.g.rotation.y = m.yaw;

    // You go where it goes.
    const [px, py, pz] = seatPos(m);
    P.x = px; P.y = py; P.z = pz;
    P.vx = P.vz = 0; P.vy = 0; P.ground = true; P.water = false; P.walk = 0;
  }
  const angleTo = (a, b, step) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + Math.max(-step, Math.min(step, d)); };

  // ---------- the guns and the crossbow ----------
  function puff(x, y, z, vx, vy, vz, size = 0.5, color = 0xd8d4cc, life = 1.6) {
    const p = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }));
    p.position.set(x, y, z); p.scale.setScalar(size); scene.add(p);
    puffs.push({ p, vx, vy, vz, life, t: 0, size });
  }
  function fireGuns(m) {
    if (m.cool > 0) return;
    m.cool = 1.4;
    sound.play('boom');
    for (const gun of m.parts.guns) {
      const v = new THREE.Vector3(); gun.getWorldPosition(v);
      const a = gun.rotation.y + m.yaw, dx = Math.sin(a), dz = Math.cos(a);
      puff(v.x + dx * 0.7, v.y, v.z + dz * 0.7, dx * 0.4, 0.3, dz * 0.4, 0.3, 0xffb040, 0.18);   // the flash
      for (let k = 0; k < 4; k++) puff(v.x + dx * (0.8 + k * 0.3), v.y + Math.random() * 0.2, v.z + dz * (0.8 + k * 0.3), dx * (1.5 + Math.random()), 0.5 + Math.random() * 0.4, dz * (1.5 + Math.random()), 0.4 + Math.random() * 0.3);
    }
    if (!m.toldGuns) { m.toldGuns = true; say('BOOM! The guns all fire at once — in Leonardo\'s day they would have shot stone balls. (These only make smoke.)'); }
  }
  function fireBolt(m, ctl) {
    if (m.cool > 0) return;
    m.cool = 1.6;
    sound.play('twang');
    const v = new THREE.Vector3(); m.parts.bolt.getWorldPosition(v);
    const cp = Math.cos(ctl.pitch), dir = [Math.sin(m.yaw) * cp, Math.sin(ctl.pitch) + 0.04, Math.cos(m.yaw) * cp];
    const g = new THREE.Group();
    box(g, 0.09, 0.09, 1.9, WOOD, 0, 0, 0); box(g, 0.16, 0.16, 0.3, IRON, 0, 0, 1.0);
    box(g, 0.02, 0.24, 0.3, LINEN, 0, 0, -0.8); box(g, 0.24, 0.02, 0.3, LINEN, 0, 0, -0.8);
    g.position.set(v.x + dir[0] * 1.5, v.y + dir[1] * 1.5, v.z + dir[2] * 1.5);
    scene.add(g);
    bolts.push({ g, x: g.position.x, y: g.position.y, z: g.position.z, vx: dir[0] * 34, vy: dir[1] * 34, vz: dir[2] * 34, stuck: 0 });
    m.parts.bolt.visible = false;
  }
  function updateBolts(dt) {
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      if (b.stuck) { b.stuck += dt; if (b.stuck > 30) { scene.remove(b.g); bolts.splice(i, 1); } continue; }
      for (let s = 0; s < 4 && !b.stuck; s++) {
        const h = dt / 4;
        b.vy -= 9 * h;
        const nx = b.x + b.vx * h, ny = b.y + b.vy * h, nz = b.z + b.vz * h;
        const tipX = nx + b.vx * 0.03, tipY = ny + b.vy * 0.03, tipZ = nz + b.vz * 0.03;
        const cell = world.get(Math.floor(tipX), Math.floor(tipY), Math.floor(tipZ));
        if (IS_SOLID[cell] || IS_WATER[cell] || tipY < 1 || !world.inb(Math.floor(tipX), Math.floor(tipZ))) {
          b.stuck = 0.001;
          sound.play(IS_WATER[cell] ? 'splash' : 'thunk');
          for (const t of targets || []) if (Math.hypot(tipX - t.x, tipY - t.y, tipZ - t.z) < 1.6) {
            onBullseye();
            for (let k = 0; k < 6; k++) puff(tipX, tipY, tipZ, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 0.15, 0xe8d090, 0.7);
          }
        } else { b.x = nx; b.y = ny; b.z = nz; }
        if (b.y > H + 20 || Math.abs(b.vx) + Math.abs(b.vz) > 300) b.stuck = 25;
      }
      b.g.position.set(b.x, b.y, b.z);
      if (!b.stuck || b.stuck < 0.01) b.g.lookAt(b.x + b.vx, b.y + b.vy, b.z + b.vz);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i]; q.t += dt;
      q.p.position.x += q.vx * dt; q.p.position.y += q.vy * dt; q.p.position.z += q.vz * dt;
      q.vx *= 1 - dt * 1.5; q.vz *= 1 - dt * 1.5;
      q.p.scale.setScalar(q.size * (1 + q.t * 1.4)); q.p.material.opacity = Math.max(0, 0.85 * (1 - q.t / q.life));
      if (q.t >= q.life) { scene.remove(q.p); q.p.material.dispose(); puffs.splice(i, 1); }
    }
  }

  // ---------- the robots ----------
  function robot(m) {
    onFirst(m);
    if (m.id === 'lion') {
      if (m.show) { say('The lion is busy — watch!'); return; }
      m.show = { t: 0, from: [m.x, m.z, m.y] };
      sound.play('roar');
      say('Click… click… whirr. The mechanical lion begins to walk!');
      return;
    }
    // The knight: sets off after you, or stops and waits.
    m.follow = !m.follow;
    m.salute = 1.6;
    sound.play('clank');
    say(m.follow ? 'The knight lifts its visor, salutes — and starts marching after you! Press X on it again to make it wait.' : 'The knight salutes and stands guard right here.');
  }
  function walkTo(m, tx, tz, pace, dt) {
    const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const step = Math.min(d, pace * dt), nx = m.x + dx / d * step, nz = m.z + dz / d * step;
    const g = groundAt(nx, nz, m.y + 1.1);
    if (g <= m.y + 1.05 && g > m.y - 4 && !IS_WATER[world.get(Math.floor(nx), Math.floor(g), Math.floor(nz))] && !IS_SOLID[world.get(Math.floor(nx), Math.floor(g), Math.floor(nz))] && !IS_SOLID[world.get(Math.floor(nx), Math.floor(g) + 1, Math.floor(nz))]) {
      m.x = nx; m.z = nz;
      m.yaw = angleTo(m.yaw, Math.atan2(dx, dz), dt * 6);
      return step;
    }
    return -1;
  }
  function updateRobots(dt, P) {
    const kn = by('knight');
    if (kn) {
      let moved = 0;
      const d = Math.hypot(P.x - kn.x, P.z - kn.z);
      if (kn.follow && d > 2.6 && d < 45 && kn.salute <= 0) {
        moved = walkTo(kn, P.x, P.z, d > 8 ? 5.4 : 4.2, dt);
        if (moved < 0) moved = 0;
      }
      const g = groundAt(kn.x, kn.z, kn.y + 1.1);
      kn.y = kn.y < g ? Math.min(g, kn.y + dt * 8) : Math.max(g, kn.y - dt * 14);
      kn.phase = moved > 0 ? kn.phase + dt * 9 : kn.phase * 0.9;
      const sw = Math.sin(kn.phase) * (moved > 0 ? 0.6 : 0);
      kn.parts.legs[0].rotation.x = sw; kn.parts.legs[1].rotation.x = -sw;
      kn.salute = Math.max(0, (kn.salute || 0) - dt);
      if (kn.salute > 0) {
        const k = Math.sin(Math.min(1, (1.6 - kn.salute) / 1.6) * Math.PI);
        kn.parts.arms[1].rotation.x = -2.6 * k; kn.parts.arms[1].rotation.z = 0.5 * k;
        kn.parts.visor.rotation.x = -1.3 * k;
        kn.parts.arms[0].rotation.x = 0;
      } else {
        kn.parts.arms[0].rotation.x = -sw; kn.parts.arms[1].rotation.x = sw; kn.parts.arms[1].rotation.z = 0;
        kn.parts.visor.rotation.x = 0;
        // Standing guard, it looks round now and then.
        kn.parts.head.rotation.y = moved > 0 ? 0 : Math.sin(performance.now() / 1900) * 0.5;
      }
      if (moved > 0) { kn.stepT = (kn.stepT || 0) - dt; if (kn.stepT <= 0) { kn.stepT = 0.36; if (d < 20) sound.play('clank'); } }
      kn.g.position.set(kn.x, kn.y, kn.z); kn.g.rotation.y = kn.yaw;
    }
    const li = by('lion');
    if (li) {
      const s = li.show;
      let moving = false;
      if (s) {
        s.t += dt;
        const [hx, hz] = s.from, fx = Math.sin(li.home.yaw), fz = Math.cos(li.home.yaw);
        if (s.t < 2.4) { const k = s.t / 2.4; li.x = hx + fx * 3 * k; li.z = hz + fz * 3 * k; moving = true; }
        else if (s.t < 3.0) { /* it stops, and looks at you */ }
        else if (s.t < 9.5) {
          const open = Math.min(1, (s.t - 3.0) / 0.8), rise = Math.max(0, Math.min(1, (s.t - 3.6) / 0.9));
          const close = s.t > 8.5 ? Math.min(1, (s.t - 8.5) / 1.0) : 0;
          const o = open * (1 - close), l = rise * (1 - close);
          li.parts.doors[0].rotation.y = -1.9 * o; li.parts.doors[1].rotation.y = 1.9 * o;
          li.parts.lilies.visible = l > 0.02; li.parts.lilies.scale.setScalar(Math.max(0.01, l)); li.parts.lilies.position.z = 0.8 + l * 0.45; li.parts.lilies.position.y = 1.0 + l * 0.25;
          if (!s.told && s.t > 4.2) { s.told = true; say('Its chest swings open — and it is full of lilies! The lily was the flower of the kings of France.'); sound.play('star'); }
        } else if (s.t < 12.2) {
          const k = (s.t - 9.5) / 2.7; li.x = hx + fx * 3 * (1 - k); li.z = hz + fz * 3 * (1 - k); moving = true;
          li.parts.lilies.visible = false;
        } else { li.x = hx; li.z = hz; li.show = null; li.parts.doors[0].rotation.y = 0; li.parts.doors[1].rotation.y = 0; }
        li.yaw = s.t >= 9.5 && s.t < 12.2 ? li.home.yaw + Math.PI : li.home.yaw;   // it turns round to walk home
      }
      li.phase = moving ? li.phase + dt * 8 : 0;
      const sw = Math.sin(li.phase) * (moving ? 0.5 : 0);
      li.parts.legs.forEach((l, i) => { l.rotation.x = sw * (i === 0 || i === 3 ? 1 : -1); });
      li.parts.tail.rotation.y = Math.sin(performance.now() / 600) * 0.3;
      li.parts.head.rotation.y = s && s.t > 2.4 && s.t < 9.5 ? Math.atan2(P.x - li.x, P.z - li.z) - li.yaw : 0;
      if (Math.abs(li.parts.head.rotation.y) > 0.7) li.parts.head.rotation.y = Math.sign(li.parts.head.rotation.y) * 0.7;
      const g = groundAt(li.x, li.z, li.y + 1.1); li.y = g;
      if (moving) { li.stepT = (li.stepT || 0) - dt; if (li.stepT <= 0) { li.stepT = 0.4; sound.play('clank'); } }
      li.g.position.set(li.x, li.y, li.z); li.g.rotation.y = li.yaw;
    }
  }

  // Everything that happens whether or not you're riding.
  function update(dt, P) {
    for (const m of list) {
      m.cool = Math.max(0, m.cool - dt);
      if (m.id === 'crossbow') {
        // The string pulls back (and a new bolt drops in) while it reloads.
        const drawn = m.cool > 0 ? Math.max(0, 1 - m.cool / 1.6) : 1;
        if (m.cool <= 0.05) m.parts.bolt.visible = true;
        const nutZ = 2.0 - drawn * 1.5;
        for (const [st, sx] of [[m.parts.strL, -3.85], [m.parts.strR, 3.85]]) {
          const dx = -sx, dz = nutZ - 2.0, len = Math.hypot(dx, dz) || 0.01;
          st.position.set(sx + dx / 2, 0.25, 2.0 + dz / 2); st.rotation.y = Math.atan2(dx, dz);
          st.children[0].scale.set(0.05, 0.05, len);
        }
      }
      if (m === riding) continue;
      // An empty flying machine settles to the ground; an empty boat bobs.
      if (m.t.kind === 'fly' || m.t.kind === 'glide' || m.t.kind === 'lift' || m.t.kind === 'drive') {
        const [rr] = SIZE[m.id] || [1];
        const floor = m.t.kind === 'drive' ? groundAt(m.x, m.z, m.y + 0.6) : floorUnder(m.x, m.z, rr * 0.8, m.y + 0.6);
        if (m.y < floor - 0.01) m.y = floor;   // sunk into something (an old save, or a block put under it): lift it out
        if (m.y > floor + 0.01) { m.vy = Math.max(-12, m.vy - 20 * dt); m.y = Math.max(floor, m.y + m.vy * dt); if (m.y <= floor) m.vy = 0; }
        if (m.t.kind === 'fly') { m.parts.wings[0].rotation.z += (0.12 - m.parts.wings[0].rotation.z) * Math.min(dt * 3, 1); m.parts.wings[1].rotation.z = -m.parts.wings[0].rotation.z; }
        if (m.t.kind === 'lift') { m.spin *= Math.max(0, 1 - dt * 0.6); m.parts.rotor.rotation.y += m.spin * dt; }
        m.launched = false;
        m.g.rotation.x *= 0.9; m.g.rotation.z *= 0.9;
        m.g.position.set(m.x, m.y + (m.t.kind === 'drive' ? 0 : 0), m.z);
      } else if (m.t.kind === 'boat') {
        const wt = waterTop(m.x, m.z, m.y + 1.5);
        if (wt !== null) m.g.position.y = wt - 0.32 + Math.sin(performance.now() / 700) * 0.04;
      }
    }
    updateRobots(dt, P);
    updateBolts(dt);
  }

  function reset() {
    for (const m of list) {
      if (m === riding) continue;
      Object.assign(m, { x: m.home.x, y: m.home.y, z: m.home.z, yaw: m.home.yaw, vy: 0, vx: 0, vz: 0, wound: 1, follow: false, show: null });
      m.g.position.set(m.x, m.y, m.z); m.g.rotation.set(0, m.yaw, 0);
    }
  }
  const state = () => list.map((m) => ({ id: m.id, x: +m.x.toFixed(2), y: +m.y.toFixed(2), z: +m.z.toFixed(2), yaw: +m.yaw.toFixed(3), wound: +m.wound.toFixed(2) }));
  return { list, by, board, leave, drive, update, reset, state, get riding() { return riding; } };
}
