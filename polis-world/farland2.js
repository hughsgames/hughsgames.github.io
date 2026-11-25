// Polis World 2: the land far away, out to the horizon.
//
// The blocks near you are drawn in full (about 80 m round). Past them, two coarse sheets of land made from the map's
// shape: one with a point every 4 m out to about 1.3 km, and one with a point every 32 m out to about 6 km. Each is
// cut out in the middle where the finer one (or the real blocks) take over, and made again in the background as you
// walk. Nothing here is saved or touched by the game: it's only a picture.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createFarLand2({ mapId, scene, holeNear }) {
  const worker = new Worker(new URL('./chunkworker.js', import.meta.url), { type: 'module' });
  const center = new THREE.Vector3();
  const levels = [
    { step: 8, n: 320, hole: holeNear, mesh: null, at: null, busy: false },
    { step: 64, n: 200, hole: 8 * 320 * 0.42, mesh: null, at: null, busy: false },
  ];
  const group = new THREE.Group();
  scene.add(group);
  const material = (lv) => {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.userData.hole = { value: lv.hole };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uCenter = { value: center }; sh.uniforms.uHole = m.userData.hole;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFarW;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvFarW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFarW;\nuniform vec3 uCenter;\nuniform float uHole;')
        .replace('void main() {', 'void main() {\n  if (length(vFarW.xz - uCenter.xz) < uHole) discard;');
    };
    return m;
  };
  for (const lv of levels) lv.mat = material(lv);
  let id = 0;
  worker.onmessage = (e) => {
    const r = e.data, lv = levels.find((l) => l.step === r.step);
    if (!lv) return;
    lv.busy = false;
    const n = r.n, geo = new THREE.BufferGeometry(), pos = new Float32Array((n + 1) * (n + 1) * 3), col = new Float32Array((n + 1) * (n + 1) * 3);
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const k = j * (n + 1) + i;
      pos[k * 3] = r.x0 + i * r.step; pos[k * 3 + 1] = r.h[k]; pos[k * 3 + 2] = r.z0 + j * r.step;
      // (sRGB bytes to the linear light the shaders work in)
      col[k * 3] = Math.pow(r.col[k * 3] / 255, 2.2); col[k * 3 + 1] = Math.pow(r.col[k * 3 + 1] / 255, 2.2); col[k * 3 + 2] = Math.pow(r.col[k * 3 + 2] / 255, 2.2);
    }
    const idx = new Uint32Array(n * n * 6);
    let q = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    if (lv.mesh) { group.remove(lv.mesh); lv.mesh.geometry.dispose(); }
    lv.mesh = new THREE.Mesh(geo, lv.mat);
    lv.mesh.receiveShadow = false; lv.mesh.castShadow = false;
    lv.mesh.frustumCulled = false;
    group.add(lv.mesh);
  };
  return {
    group,
    /// Each frame: re-centre the sheets once you've walked far enough from where they were made.
    update(px, pz) {
      center.set(px, 0, pz);
      for (const lv of levels) {
        const span = lv.step * lv.n, snap = lv.step * 8;
        const x0 = Math.round((px - span / 2) / snap) * snap, z0 = Math.round((pz - span / 2) / snap) * snap;
        if (lv.busy || (lv.at && lv.at[0] === x0 && lv.at[1] === z0)) continue;
        if (lv.at && Math.hypot(lv.at[0] - x0, lv.at[1] - z0) < span / 10) continue;
        lv.busy = true; lv.at = [x0, z0];
        worker.postMessage({ kind: 'far', map: mapId, id: ++id, x0, z0, step: lv.step, n: lv.n });
      }
    },
    dispose() { worker.terminate(); scene.remove(group); },
  };
}
