// Polis World (computer version): whole groups of real people — soldiers in an army, rowers and marines on a ship —
// drawn with the same bodies as the townspeople (faces, hands, sandals, hair), and moving: marching, holding up
// shields, thrusting spears, pulling oars. Each body part is one instanced mesh for the whole group.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { PARTS, JOINTS } from './people.js';
import { mergeBoxes } from './scenery.js';

const LIMBS = ['legL', 'legR', 'armL', 'armR'];
const boxM = (ctr, size, color) => ({ m: new THREE.Matrix4().makeTranslation(...ctr).multiply(new THREE.Matrix4().makeScale(...size)), color });

/// The body as five pieces: the trunk (body, head and face, which turn together) and two legs and two arms, each made
/// around its own joint. look: { colors (as people.js dress), robe, beard, longHair, hat: [[size, centre, colour]…],
/// armour, shield: { round|rect, colour, rim }, spear, cloak }.
export function rig(look) {
  const lists = { body: [], legL: [], legR: [], armL: [], armR: [] };
  const c = look.colors;
  for (const [name, joint, ctr, size, key] of PARTS) {
    if (name.startsWith('hat')) continue;
    if ((name === 'robe' && !look.robe) || (name === 'beard' && !look.beard) || (name === 'hairBack' && !look.longHair) || name === 'neck') continue;
    let col = c[key] ?? 0x888888;
    if (look.armour && (name === 'body')) col = look.armour;
    const part = LIMBS.includes(joint) ? joint : 'body';
    const at = part === 'body' ? [ctr[0] + JOINTS[joint][0], ctr[1] + JOINTS[joint][1], ctr[2] + JOINTS[joint][2]] : ctr;
    lists[part].push(boxM(at, size, col));
  }
  const head = JOINTS.head;
  for (const [size, ctr, color] of look.hat || []) lists.body.push(boxM([ctr[0] + head[0], ctr[1] + head[1], ctr[2] + head[2]], size, color));
  if (look.armour) { lists.body.push(boxM([0, 0.86, 0], [0.56, 0.16, 0.3], c.shirt)); lists.body.push(boxM([0, 1.42, 0], [0.56, 0.08, 0.3], look.armour)); }
  if (look.cloak) lists.body.push(boxM([0, 1.1, -0.17], [0.52, 0.8, 0.06], look.cloak));
  if (look.shield) {
    const s = look.shield;
    if (s.rect) lists.armL.push(boxM([-0.16, -0.45, 0.12], [0.06, 1.0, 0.6], s.colour));
    else { lists.armL.push(boxM([-0.16, -0.42, 0.1], [0.06, 0.66, 0.66], s.colour)); lists.armL.push(boxM([-0.19, -0.42, 0.1], [0.02, 0.4, 0.4], s.rim ?? s.colour)); }
  }
  if (look.spear) { lists.armR.push(boxM([0, -0.66 + 0.45, 0.06], [0.05, look.spear, 0.05], 0x6b4a2a)); lists.armR.push(boxM([0, -0.66 + 0.45 + look.spear / 2 + 0.12, 0.06], [0.08, 0.26, 0.08], 0xc0c4c8)); }
  const out = {};
  for (const k of Object.keys(lists)) out[k] = mergeBoxes(lists[k]);
  return out;
}

/// A crowd of identical-looking people (one look), each posed every frame with setPose.
export class Squad {
  constructor(parent, geos, count, material) {
    this.count = count;
    this.meshes = {};
    for (const k of ['body', ...LIMBS]) {
      const m = new THREE.InstancedMesh(geos[k], material, Math.max(1, count));
      m.count = count; m.castShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      parent.add(m); this.meshes[k] = m;
    }
    this._root = new THREE.Matrix4(); this._up = new THREE.Matrix4(); this._m = new THREE.Matrix4(); this._r = new THREE.Matrix4(); this._e = new THREE.Euler();
  }
  /// x, y, z and turn (radians, 0 = facing +z) place the feet; p = { legL, legR, armL, armR, armLz, armRz, lean }.
  setPose(i, x, y, z, turn, p) {
    const root = this._root.makeRotationY(turn).setPosition(x, y, z);
    // The upper body leans round the hips.
    const up = this._up.copy(root).multiply(this._m.makeTranslation(0, 0.75, 0)).multiply(this._r.makeRotationX(p.lean || 0)).multiply(this._m.makeTranslation(0, -0.75, 0));
    this.meshes.body.setMatrixAt(i, up);
    for (const k of LIMBS) {
      const base = k.startsWith('arm') ? up : root, j = JOINTS[k];
      const m = this._m.copy(base).multiply(new THREE.Matrix4().makeTranslation(j[0], j[1], j[2])).multiply(this._r.makeRotationFromEuler(this._e.set(p[k] || 0, 0, (k === 'armL' ? p.armLz : k === 'armR' ? p.armRz : 0) || 0)));
      this.meshes[k].setMatrixAt(i, m);
    }
  }
  done() { for (const m of Object.values(this.meshes)) m.instanceMatrix.needsUpdate = true; }
  set visible(v) { for (const m of Object.values(this.meshes)) m.visible = v; }
}

const SKINS = [0xc68e64, 0xa8744e, 0xd9a77e, 0x8a5a3a];
const HAIRS = [0x241a12, 0x3a2716, 0x1a1410, 0x5a4632];
/// A soldier of an army (events.js ARMY): helmet with crest, armour over the tunic, shield and spear.
export function soldierLook(a, k = 0) {
  const skin = SKINS[k % SKINS.length];
  const colors = { skin, shirt: a.tunic, sleeves: skin, pants: skin, hair: HAIRS[k % HAIRS.length], eye: 0x1e2a44, white: 0xf2efe8, nose: new THREE.Color(skin).offsetHSL(0, 0, -0.06).getHex(), mouth: 0x8a3a32, shoes: 0x5a3a22, belt: 0x5a3a22 };
  const hat = [[[0.54, 0.22, 0.54], [0, 0.42, 0], a.helm]];
  if (a.crest) hat.push([[0.1, 0.26, 0.5], [0, 0.62, -0.02], a.crest]);
  if (a.wicker) hat[0] = [[0.52, 0.3, 0.52], [0, 0.48, 0], a.helm];   // a felt cap
  return { colors, robe: !!a.wicker, beard: k % 3 === 0, longHair: false, hat, armour: a.wicker ? null : 0xb8a070, shield: { rect: !!a.rect, colour: a.shield, rim: a.rect ? a.shield : 0xe0bd52 }, spear: a.pike ? 4.0 : 2.4, cloak: a.cloak };
}
/// A rower or sailor: a plain tunic, bare arms and legs.
export function rowerLook(tunic = 0xe2d6bb, k = 0) {
  const skin = SKINS[k % SKINS.length];
  return { colors: { skin, shirt: tunic, sleeves: skin, pants: skin, hair: HAIRS[k % HAIRS.length], eye: 0x1e2a44, white: 0xf2efe8, nose: new THREE.Color(skin).offsetHSL(0, 0, -0.06).getHex(), mouth: 0x8a3a32, shoes: skin, belt: 0x6b4a2b }, beard: k % 2 === 0, longHair: k % 3 === 0 };
}
/// Sitting on a bench pulling an oar: phase φ of the stroke (dir -1 backs water).
export function rowPose(phi, dir = 1) {
  const k = Math.cos(phi * dir) * dir;   // 1 at the catch (leaning forward, arms reaching), -1 at the finish (leaning back)
  return { legL: -1.45, legR: -1.45, armL: -1.15 - k * 0.35, armR: -1.15 - k * 0.35, lean: -0.05 + k * 0.3 };
}
