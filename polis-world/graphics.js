// Polis World (computer version): turning the 3D world into the picture on the screen.
//
// Three settings. Fast draws straight to the screen, the simple way. Balanced (the phone's choice) and Amazing (the
// computer's) first draw the world into a picture that can hold light far brighter than white — the sun, a torch flame,
// glints on the sea — and then finish it the way a film camera would: a soft glow round bright things, shafts of
// sunlight through trees and windows, water that bends and mirrors what is round it, and the colours of the hour.
//
// Each frame, in order:
//   1. the clouds    a slice of the sky's cloud picture is brought up to date (the whole sky every few frames)
//   2. the world     everything solid, into the high-range picture (with its depth)
//   3. a copy        of that picture and its depth, for the water to look through and reflect
//   4. water and see-through things (rain, glows, smoke) on top
//   5. sunbeams      light scattered by the air, worked out at low resolution from the sun's shadow picture
//   6. glow          the picture shrunk again and again, blurred and added back up
//   7. the screen    all of it toned down to what a screen can show, with the time of day's colour
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { SKY_GLSL, CLOUD_GLSL, PANO_GLSL, HASH_GLSL } from './shaders.js';

export const QUALITY = {
  fast: { name: 'Fast', post: false, maxDpr: 1.25, msaa: 0, shadow: 1024, shadowR: 36, shadowEvery: 2, rays: 0, raysScale: 0, ssr: false, pano: 0, panoRows: 0, bevel: false, normals: false, minScale: 1 },
  balanced: { name: 'Balanced', post: true, maxDpr: 1.5, msaa: 0, shadow: 2048, shadowR: 48, shadowEvery: 2, rays: 10, raysScale: 0.25, ssr: false, pano: 512, panoRows: 32, bevel: true, normals: true, minScale: 0.6 },
  amazing: { name: 'Amazing', post: true, maxDpr: 2, msaa: 4, shadow: 4096, shadowR: 64, shadowEvery: 1, rays: 20, raysScale: 0.5, ssr: true, pano: 1024, panoRows: 64, bevel: true, normals: true, minScale: 0.6 },
};
const STORE = 'polis-graphics';

/// The best setting for this machine: Amazing on a computer with a proper graphics chip, Balanced on a phone or a
/// computer with a modest built-in chip, Fast where there is no graphics chip at all.
export function detectQuality(renderer) {
  if (!renderer.capabilities.isWebGL2) return 'fast';
  const gl = renderer.getContext();
  let gpu = '';
  try { const ext = gl.getExtension('WEBGL_debug_renderer_info'); if (ext) gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || ''); } catch (_) { gpu = ''; }
  if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) return 'fast';
  if (matchMedia('(hover: none) and (pointer: coarse)').matches) return 'balanced';
  if (/intel|mali|adreno|powervr|videocore|tegra/i.test(gpu) && !/arc/i.test(gpu)) return 'balanced';
  return 'amazing';
}

const FS_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function createGraphics(renderer, { shared, sun }) {
  const gl = renderer.getContext();
  const isGL2 = renderer.capabilities.isWebGL2;
  // The high-range picture only needs half-float colour; some phones offer just that (not full float).
  const floatOK = isGL2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
  let maxSamples = 0;
  if (floatOK) { try { const s = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA16F, gl.SAMPLES); maxSamples = s && s.length ? Math.max(...s) : 0; } catch (_) { maxSamples = 0; } }

  // ---------- settings (kept in this browser; nothing to do with the saved world) ----------
  const S = { q: null, auto: true };
  try { const v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v && QUALITY[v.q]) { S.q = v.q; S.auto = v.auto !== false; } } catch (_) { /* no storage */ }
  if (!S.q) S.q = detectQuality(renderer);
  if (QUALITY[S.q].post && !floatOK) S.q = 'fast';
  const store = () => { try { localStorage.setItem(STORE, JSON.stringify({ q: S.q, auto: S.auto })); } catch (_) { /* no storage */ } };
  let Q = QUALITY[S.q];
  const listeners = [];
  const knobs = { samples: null, shadowEvery: null };   // for measuring on real machines; never saved

  // ---------- full-screen passes ----------
  const fsGeo = new THREE.BufferGeometry();
  fsGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const fsMesh = new THREE.Mesh(fsGeo); fsMesh.frustumCulled = false;
  const fsScene = new THREE.Scene(); fsScene.add(fsMesh);
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const passMat = (frag, uniforms, defines = {}) => new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, defines, depthTest: false, depthWrite: false, toneMapped: false });
  function pass(mat, target) { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }

  // ---------- the cloud picture (the upper half of the sky, all the way round) ----------
  const panoMat = passMat(/* glsl */ `
    #include <common>
    ${HASH_GLSL}
    ${SKY_GLSL}
    ${CLOUD_GLSL}
    ${PANO_GLSL}
    uniform vec3 uCam; uniform vec3 uCloudSunDir; uniform vec3 uCloudSun; uniform vec3 uCloudAmb; uniform float uFrame;
    varying vec2 vUv;
    void main() {
      vec3 rd = panoDir(vUv);
      if (rd.y < 0.012) { gl_FragColor = vec4(0.0); return; }
      vec3 ro = uCam;
      float t0 = (CLOUD_BASE - ro.y) / rd.y, t1 = (CLOUD_TOP - ro.y) / rd.y;
      if (t0 > 11000.0) { gl_FragColor = vec4(0.0); return; }
      t1 = min(t1, t0 + 1100.0);
      float dt = (t1 - t0) / float(STEPS);
      float mu = dot(rd, uCloudSunDir);
      float ph = mix(hgPhase(mu, 0.6), hgPhase(mu, -0.2), 0.4) * 12.566;
      float T = 1.0; vec3 L = vec3(0.0);
      float t = t0 + dt * hash12(vUv * 997.0 + uFrame * 0.618);
      for (int i = 0; i < STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = cloudDensityDetail(p);
        if (d > 0.004) {
          float l1 = cloudDensity(p + uCloudSunDir * 20.0), l2 = cloudDensity(p + uCloudSunDir * 60.0);
          float od = (l1 * 20.0 + l2 * 40.0) * 0.05;
          float beer = exp(-od) + exp(-od * 0.22) * 0.35;           // light that got through, plus light bounced inside
          float powder = 1.0 - exp(-d * 5.0) * 0.55;               // dark edges where the cloud is thin
          float h = clamp((p.y - CLOUD_BASE) / (CLOUD_TOP - CLOUD_BASE), 0.0, 1.0);
          vec3 S = uCloudSun * beer * ph * powder + uCloudAmb * (0.5 + 0.6 * h);
          float a = 1.0 - exp(-d * dt * 0.055);
          L += T * a * S; T *= 1.0 - a;
          if (T < 0.02) break;
        }
        t += dt;
      }
      float alpha = 1.0 - T;
      float haze = 1.0 - exp(-t0 / 5200.0);
      L = mix(L, skyColor(rd) * alpha, haze * 0.9);
      float far = 1.0 - smoothstep(6500.0, 11000.0, t0);
      gl_FragColor = vec4(L * far, alpha * far);
    }`, Object.assign({ uCam: { value: new THREE.Vector3() }, uFrame: { value: 0 } }, shared), { STEPS: 12 });
  let panoRT = null, panoRow = 0;

  // ---------- render targets ----------
  let sceneRT = null, refrRT = null, volRT = null, volRT2 = null, blooms = [];
  let W = 1, H = 1, dpr = 1, scale = 1, rw = 1, rh = 1;
  const hdr = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  function freeTargets() {
    for (const t of [sceneRT, refrRT, volRT, volRT2, ...blooms]) if (t) { if (t.depthTexture) t.depthTexture.dispose(); t.dispose(); }
    sceneRT = refrRT = volRT = volRT2 = null; blooms = [];
  }
  function allocTargets() {
    freeTargets();
    if (!Q.post) return;
    rw = Math.max(16, Math.round(W * dpr * scale)); rh = Math.max(16, Math.round(H * dpr * scale));
    const samples = knobs.samples ?? Math.min(Q.msaa, maxSamples);
    sceneRT = new THREE.WebGLRenderTarget(rw, rh, { ...hdr, depthBuffer: true, samples, depthTexture: new THREE.DepthTexture(rw, rh, THREE.UnsignedIntType) });
    sceneRT.depthTexture.minFilter = sceneRT.depthTexture.magFilter = THREE.NearestFilter;
    refrRT = new THREE.WebGLRenderTarget(Math.ceil(rw / 2), Math.ceil(rh / 2), hdr);
    if (Q.rays) {
      const vw = Math.max(8, Math.round(rw * Q.raysScale)), vh = Math.max(8, Math.round(rh * Q.raysScale));
      volRT = new THREE.WebGLRenderTarget(vw, vh, hdr); volRT2 = new THREE.WebGLRenderTarget(vw, vh, hdr);
    }
    let bw = Math.ceil(rw / 2), bh = Math.ceil(rh / 2);
    for (let i = 0; i < 6 && bw >= 4 && bh >= 4; i++) { blooms.push({ down: new THREE.WebGLRenderTarget(bw, bh, hdr), up: new THREE.WebGLRenderTarget(bw, bh, hdr) }); bw = Math.ceil(bw / 2); bh = Math.ceil(bh / 2); }
    for (const b of blooms) { b.dispose = () => { b.down.dispose(); b.up.dispose(); }; }
    shared.tRefr.value = refrRT.texture;
    shared.uRefrSize.value.set(refrRT.width, refrRT.height);
    shared.uScreen.value.set(rw, rh);
  }
  function allocPano() {
    if (panoRT) { panoRT.dispose(); panoRT = null; }
    shared.uPanoOn.value = 0;
    if (!Q.pano) return;
    panoRT = new THREE.WebGLRenderTarget(Q.pano, Q.pano / 4, { ...hdr, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, wrapS: THREE.RepeatWrapping });
    panoRT.texture.wrapS = THREE.RepeatWrapping;
    panoRT.scissorTest = true;
    panoRow = 0; panoFull = true;
    shared.tPano.value = panoRT.texture;
  }
  let panoFull = true;

  // ---------- 3. the copy: colour and how far away each spot is ----------
  const copyMat = passMat(/* glsl */ `
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform mat4 uInvProj;
    varying vec2 vUv;
    void main() {
      float z = texture2D(tDepth, vUv).r;
      vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
      float dist = z >= 0.999999 ? 60000.0 : length(v.xyz / v.w);
      gl_FragColor = vec4(texture2D(tColor, vUv).rgb, dist);
    }`, { tColor: { value: null }, tDepth: { value: null }, uInvProj: { value: new THREE.Matrix4() } });

  // ---------- 5. sunbeams ----------
  const volMat = passMat(/* glsl */ `
    #include <packing>
    ${HASH_GLSL}
    uniform sampler2D tDepth; uniform sampler2D tShadow; uniform sampler2D uNoise;
    uniform mat4 uShadowMat; uniform mat4 uInvProj; uniform mat4 uCamWorld;
    uniform vec3 uCam; uniform vec3 uLightDir; uniform vec3 uLightCol;
    uniform float uDensity; uniform float uMaxDist; uniform float uExt; uniform float uFrame; uniform float uG;
    uniform float uUnder; uniform float uWaterY; uniform float uTime;
    varying vec2 vUv;
    float hg(float mu, float g) { float g2 = g * g; return (1.0 - g2) / (12.566 * pow(max(1.0 + g2 - 2.0 * g * mu, 1e-4), 1.5)); }
    void main() {
      float z = texture2D(tDepth, vUv).r;
      vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
      vec3 wp = (uCamWorld * vec4(v.xyz / v.w, 1.0)).xyz;
      vec3 rd = wp - uCam; float dist = length(rd); rd /= max(dist, 1e-4);
      float len = min(dist, uMaxDist);
      float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy + uFrame * 5.588238, vec2(0.06711056, 0.00583715))));
      float acc = 0.0;
      // Steps bunch up close to the eye, where shafts of light are sharpest, and spread out further away.
      for (int i = 0; i < STEPS; i++) {
        float a = (float(i) + jit) / float(STEPS), t = len * a * a, stepL = len * 2.0 * a / float(STEPS);
        vec3 p = uCam + rd * t;
        vec4 sc = uShadowMat * vec4(p, 1.0);
        vec3 s = sc.xyz / sc.w;
        float lit = 1.0;
        if (s.x > 0.0 && s.x < 1.0 && s.y > 0.0 && s.y < 1.0 && s.z < 1.0) lit = step(s.z - 0.0015, unpackRGBAToDepth(texture2D(tShadow, s.xy)));
        if (uUnder > 0.5) {
          // Under the sea the light comes down in rippling curtains, focused by the waves on the surface.
          vec2 q = p.xz + uLightDir.xz / max(uLightDir.y, 0.2) * (uWaterY - p.y);
          float c = texture2D(uNoise, q * 0.045 + vec2(uTime * 0.013, uTime * 0.009)).b * texture2D(uNoise, q * 0.031 - vec2(uTime * 0.011, -uTime * 0.007)).b;
          lit *= smoothstep(0.12, 0.5, c) * 2.2;
        }
        acc += lit * exp(-t * uExt) * stepL;
      }
      float mu = dot(rd, uLightDir);
      float ph = hg(mu, uG) * 0.75 + 0.25 * 0.0796;
      gl_FragColor = vec4(uLightCol * (uDensity * acc * ph), 1.0);
    }`, { tDepth: { value: null }, tShadow: { value: null }, uNoise: shared.uNoise, uShadowMat: { value: new THREE.Matrix4() }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
    uCam: { value: new THREE.Vector3() }, uLightDir: { value: new THREE.Vector3(0, 1, 0) }, uLightCol: { value: new THREE.Color() }, uDensity: { value: 0 }, uMaxDist: { value: 48 }, uExt: { value: 0.01 },
    uFrame: { value: 0 }, uG: { value: 0.7 }, uUnder: { value: 0 }, uWaterY: { value: 31.9 }, uTime: shared.uTime }, { STEPS: 16 });
  // A small blur to smooth the speckle the sunbeam steps leave.
  const blurMat = passMat(/* glsl */ `
    uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270;
      c += (texture2D(tSrc, vUv + uDir * 1.3846153).rgb + texture2D(tSrc, vUv - uDir * 1.3846153).rgb) * 0.3162162;
      c += (texture2D(tSrc, vUv + uDir * 3.2307692).rgb + texture2D(tSrc, vUv - uDir * 3.2307692).rgb) * 0.0702703;
      gl_FragColor = vec4(c, 1.0);
    }`, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });

  // ---------- 6. glow ----------
  const downMat = passMat(/* glsl */ `
    uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uFirst; varying vec2 vUv;
    vec3 tap(vec2 o) { vec3 c = texture2D(tSrc, vUv + o * uTexel).rgb; return (c == c) ? min(c, vec3(40.0)) : vec3(0.0); }
    float w(vec3 c) { return uFirst > 0.5 ? 1.0 / (1.0 + dot(c, vec3(0.2126, 0.7152, 0.0722))) : 1.0; }
    void main() {
      vec3 a = tap(vec2(-1.0, -1.0)), b = tap(vec2(1.0, -1.0)), c = tap(vec2(-1.0, 1.0)), d = tap(vec2(1.0, 1.0)), e = tap(vec2(0.0));
      float wa = w(a), wb = w(b), wc = w(c), wd = w(d), we = w(e) * 2.0;
      gl_FragColor = vec4((a * wa + b * wb + c * wc + d * wd + e * we) / (wa + wb + wc + wd + we), 1.0);
    }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 } });
  const upMat = passMat(/* glsl */ `
    uniform sampler2D tSrc; uniform sampler2D tAdd; uniform vec2 uTexel; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
      c += (texture2D(tSrc, vUv + vec2(uTexel.x, 0.0)).rgb + texture2D(tSrc, vUv - vec2(uTexel.x, 0.0)).rgb + texture2D(tSrc, vUv + vec2(0.0, uTexel.y)).rgb + texture2D(tSrc, vUv - vec2(0.0, uTexel.y)).rgb) * 2.0;
      c += texture2D(tSrc, vUv + uTexel).rgb + texture2D(tSrc, vUv - uTexel).rgb + texture2D(tSrc, vUv + vec2(uTexel.x, -uTexel.y)).rgb + texture2D(tSrc, vUv + vec2(-uTexel.x, uTexel.y)).rgb;
      gl_FragColor = vec4(c / 16.0 + texture2D(tAdd, vUv).rgb, 1.0);
    }`, { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } });

  // ---------- 7. the screen ----------
  const grade = { exposure: 1.1, bloom: 0.045, sat: 1.08, contrast: 1.03, vignette: 0.22, tint: new THREE.Color(1, 1, 1), volK: 1, flare: 1 };
  const compMat = passMat(/* glsl */ `
    ${HASH_GLSL}
    uniform sampler2D tScene; uniform sampler2D tBloom; uniform sampler2D tVol; uniform sampler2D tDepth; uniform sampler2D tPano;
    uniform vec3 uSunUV; uniform vec3 uFlareCol; uniform float uAspect; uniform vec2 uCloudUV;
    uniform float uBloom; uniform float uExposure; uniform float uSat; uniform float uContrast; uniform float uVignette; uniform float uTime; uniform float uVolK;
    uniform vec3 uTint; uniform float uLevels;
    varying vec2 vUv;
    vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
    vec3 aces(vec3 c) {
      const mat3 inM = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
      const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
      c = inM * (c / 0.6); c = RRTAndODTFit(c); return clamp(outM * c, 0.0, 1.0);
    }
    vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
    uniform vec2 uTexel;
    float lum(vec3 c) { c = (c == c) ? c : vec3(0.0); float l = dot(c, vec3(0.299, 0.587, 0.114)) * uExposure; return l / (1.0 + l); }
    void main() {
      vec3 c = texture2D(tScene, vUv).rgb;
      #ifdef FXAA
        // Smooth the jagged edges: find which way an edge runs and blend along it (a light FXAA).
        float lM = lum(c), lN = lum(texture2D(tScene, vUv + vec2(0.0, uTexel.y)).rgb), lS = lum(texture2D(tScene, vUv - vec2(0.0, uTexel.y)).rgb);
        float lE = lum(texture2D(tScene, vUv + vec2(uTexel.x, 0.0)).rgb), lW = lum(texture2D(tScene, vUv - vec2(uTexel.x, 0.0)).rgb);
        float lMin = min(lM, min(min(lN, lS), min(lE, lW))), lMax = max(lM, max(max(lN, lS), max(lE, lW)));
        if (lMax - lMin > max(0.04, lMax * 0.12)) {
          vec2 dir = vec2(-(lN - lS), lE - lW);   // along the edge, across the steepest change
          float r = 1.0 / (min(abs(dir.x), abs(dir.y)) + 0.02);
          dir = clamp(dir * r, -2.5, 2.5) * uTexel;
          vec3 a = 0.5 * (texture2D(tScene, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tScene, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
          vec3 b = a * 0.5 + 0.25 * (texture2D(tScene, vUv - dir * 0.5).rgb + texture2D(tScene, vUv + dir * 0.5).rgb);
          float lb = lum(b);
          c = (lb < lMin || lb > lMax) ? a : b;
        }
      #endif
      c = (c == c) ? c : vec3(0.0);
      #ifdef VOL
        c += texture2D(tVol, vUv).rgb * uVolK;
      #endif
      #ifdef BLOOM
        c = mix(c, texture2D(tBloom, vUv).rgb / uLevels, uBloom);
      #endif
      #ifdef FLARE
        // A lens flare when you look towards the sun: a glow and a horizontal streak round it, and soft coloured rings
        // along the line from the sun through the middle of the picture. Only as much as the sun itself is showing:
        // hidden behind a hill or a cloud, it fades away.
        if (uSunUV.z > 0.0) {
          float vis = 0.0;
          for (int i = 0; i < 5; i++) {
            vec2 o = vec2(float(i == 1) - float(i == 2), float(i == 3) - float(i == 4)) * 0.006;
            vis += step(0.99999, texture2D(tDepth, uSunUV.xy + o).r);
          }
          vis *= 0.2 * uSunUV.z * (1.0 - texture2D(tPano, uCloudUV).a);
          if (vis > 0.001) {
            vec2 asp = vec2(uAspect, 1.0), d = (vUv - uSunUV.xy) * asp;
            float r = length(d);
            vec3 fl = uFlareCol * (exp(-r * 16.0) * 0.22 + exp(-abs(d.y) * 220.0) * exp(-abs(d.x) * 2.6) * 0.25);
            vec2 axis = (vec2(0.5) - uSunUV.xy);
            for (int k = 0; k < 5; k++) {
              float t = float(k) == 0.0 ? 0.35 : float(k) == 1.0 ? 0.7 : float(k) == 2.0 ? 1.15 : float(k) == 3.0 ? 1.45 : 1.9;
              float sz = float(k) == 0.0 ? 0.035 : float(k) == 1.0 ? 0.07 : float(k) == 2.0 ? 0.02 : float(k) == 3.0 ? 0.11 : 0.05;
              vec3 tint = float(k) == 0.0 ? vec3(0.4, 0.7, 1.0) : float(k) == 1.0 ? vec3(0.5, 1.0, 0.6) : float(k) == 2.0 ? vec3(1.0, 0.8, 0.5) : float(k) == 3.0 ? vec3(0.7, 0.5, 1.0) : vec3(1.0, 0.6, 0.4);
              float g = length((vUv - (uSunUV.xy + axis * t)) * asp);
              fl += uFlareCol * tint * smoothstep(sz, sz * 0.55, g) * 0.035 * (0.6 + 0.4 * smoothstep(sz * 0.5, sz, g));
            }
            float ring = length((vUv - (uSunUV.xy + axis * 1.0)) * asp);
            fl += uFlareCol * vec3(0.6, 0.8, 1.0) * smoothstep(0.02, 0.0, abs(ring - 0.28)) * 0.02;
            c += fl * vis;
          }
        }
      #endif
      c = aces(c * uTint * uExposure);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = max(mix(vec3(l), c, uSat), 0.0);
      c = toSRGB(c);
      c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
      vec2 q = vUv - 0.5;
      c *= 1.0 - uVignette * dot(q, q) * 1.5;
      c += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * (1.5 / 255.0);
      gl_FragColor = vec4(c, 1.0);
    }`, { tScene: { value: null }, tBloom: { value: null }, tVol: { value: null }, uBloom: { value: 0.04 }, uExposure: { value: 1.1 }, uSat: { value: 1 }, uContrast: { value: 1 }, uVignette: { value: 0.2 },
    uTime: shared.uTime, uVolK: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) }, uLevels: { value: 6 }, uTexel: { value: new THREE.Vector2() },
    tDepth: { value: null }, tPano: { value: null }, uSunUV: { value: new THREE.Vector3() }, uFlareCol: { value: new THREE.Color() }, uAspect: { value: 1 }, uCloudUV: { value: new THREE.Vector2() } });

  // ---------- which pass each thing is drawn in ----------
  // Layer 0: everything solid. Layer 1: water (drawn after a copy of the world is made, so it can look through it).
  // Layer 2: things you can see through, drawn last.
  // Also: only things fairly near you cast shadows. A townsperson forty blocks away throws a shadow a few pixels
  // big, and drawing it into the sun's shadow picture costs as much as drawing them on screen.
  const _bc = new THREE.Vector3();
  function classify(scene, camera) {
    const reach = Q.shadowR * 0.65, cx = camera.position.x, cz = camera.position.z;
    scene.traverse((o) => {
      if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
      let want = 1;
      if (o.userData.water) want = 2;
      else { const m = o.material; if (Array.isArray(m) ? m.some((x) => x && x.transparent) : m && m.transparent) want = 4; }
      if (o.layers.mask !== want) o.layers.mask = want;
      if (o.isMesh && !o.isInstancedMesh) {
        const u = o.userData;
        if (u.castBase === undefined) u.castBase = o.castShadow;
        if (u.castBase) {
          const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
          _bc.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
          o.castShadow = Math.hypot(_bc.x - cx, _bc.z - cz) - g.boundingSphere.radius < reach;
        }
      }
    });
  }

  // ---------- sizes, quality and the automatic resolution ----------
  const dyn = { ema: 1 / 60, t: 0, wait: 6 };
  function resize(w, h) {
    W = w; H = h;
    dpr = Math.min(devicePixelRatio || 1, Q.maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    allocTargets();
  }
  function applyQuality() {
    Q = QUALITY[S.q];
    scale = 1; dyn.t = 0; dyn.wait = 6;
    renderer.toneMapping = Q.post ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    sun.shadow.mapSize.set(Q.shadow, Q.shadow);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    Object.assign(sun.shadow.camera, { left: -Q.shadowR, right: Q.shadowR, top: Q.shadowR, bottom: -Q.shadowR });
    sun.shadow.camera.updateProjectionMatrix();
    shared.uPost.value = Q.post ? 1 : 0;
    volMat.defines.STEPS = Math.max(4, Q.rays); volMat.needsUpdate = true;
    panoMat.defines.STEPS = Q.pano >= 1024 ? 14 : 10; panoMat.needsUpdate = true;
    compMat.defines = {}; if (Q.rays) compMat.defines.VOL = ''; if (Q.post) compMat.defines.BLOOM = ''; if (Q.pano) compMat.defines.FLARE = ''; if (Math.min(Q.msaa, maxSamples) === 0) compMat.defines.FXAA = ''; compMat.needsUpdate = true;
    resize(W, H);
    allocPano();
    for (const f of listeners) f(Q, S.q);
  }
  function adapt(dt) {
    if (!S.auto || !Q.post) return;
    dyn.ema += (Math.min(dt, 0.1) - dyn.ema) * 0.04;
    dyn.t += dt;
    if (dyn.t < 2.5) return;
    // Down quickly when frames are slow; back up slowly, and after coming down wait longer before trying again, so it
    // settles instead of see-sawing.
    if (dyn.ema > 1 / 44 && scale > Q.minScale + 0.01) { scale = Math.max(Q.minScale, scale - 0.1); dyn.t = 0; dyn.wait = Math.min(dyn.wait * 2, 60); allocTargets(); }
    else if (dyn.ema < 1 / 57 && scale < 0.999 && dyn.t > dyn.wait) { scale = Math.min(1, scale + 0.05); dyn.t = 0; allocTargets(); }
  }

  // ---------- drawing a frame ----------
  let frame = 0;
  const invProj = new THREE.Matrix4();
  function renderPano(camera) {
    if (!panoRT) return;
    panoMat.uniforms.uCam.value.copy(camera.position);
    panoMat.uniforms.uFrame.value = frame % 64;
    const rows = panoFull ? panoRT.height : Q.panoRows;
    panoRT.scissor.set(0, panoRow, panoRT.width, Math.min(rows, panoRT.height - panoRow));
    pass(panoMat, panoRT);
    panoRow += rows; if (panoRow >= panoRT.height) { panoRow = 0; if (panoFull) { panoFull = false; shared.uPanoOn.value = 1; } }
  }
  renderer.info.autoReset = false;   // count everything drawn in a frame, across all the passes
  function render(scene, camera, dt = 1 / 60) {
    frame++;
    renderer.info.reset();
    // The sun's shadow picture is redrawn every frame on Amazing, every other frame otherwise (things move slowly
    // enough that nobody can tell, and it is one of the most expensive things in a frame).
    renderer.shadowMap.autoUpdate = false;
    const every = knobs.shadowEvery ?? (scale < 0.999 ? 2 : Q.shadowEvery ?? 1);   // a struggling machine redraws them half as often
    renderer.shadowMap.needsUpdate = frame % every === 0 || !sun.shadow.map;
    if (!Q.post) {
      if ((frame & 1) === 0) classify(scene, camera);
      camera.layers.mask = 0xffffffff;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }
    adapt(dt);
    classify(scene, camera);
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderPano(camera);
    // 2. the world
    renderer.autoClear = true;
    camera.layers.mask = 1;
    renderer.setRenderTarget(sceneRT);
    renderer.render(scene, camera);
    // 3. the copy
    invProj.copy(camera.projectionMatrixInverse);
    copyMat.uniforms.tColor.value = sceneRT.texture; copyMat.uniforms.tDepth.value = sceneRT.depthTexture; copyMat.uniforms.uInvProj.value.copy(invProj);
    renderer.autoClear = false;
    pass(copyMat, refrRT);
    // 4. water, then see-through things (the shadow picture is not redrawn for this pass)
    renderer.shadowMap.needsUpdate = false;
    camera.layers.mask = 2 | 4;
    renderer.setRenderTarget(sceneRT);
    renderer.render(scene, camera);
    camera.layers.mask = 0xffffffff;
    // 5. sunbeams
    if (volRT && sun.shadow.map && volUniforms.density > 0.0005) {
      const u = volMat.uniforms;
      u.tDepth.value = sceneRT.depthTexture; u.tShadow.value = sun.shadow.map.texture;
      u.uShadowMat.value.copy(sun.shadow.matrix); u.uInvProj.value.copy(invProj); u.uCamWorld.value.copy(camera.matrixWorld);
      u.uCam.value.copy(camera.position); u.uFrame.value = frame % 64;
      u.uDensity.value = volUniforms.density; u.uLightCol.value.copy(volUniforms.color); u.uLightDir.value.copy(volUniforms.dir);
      u.uMaxDist.value = volUniforms.maxDist; u.uExt.value = volUniforms.ext; u.uG.value = volUniforms.g; u.uUnder.value = volUniforms.under; u.uWaterY.value = volUniforms.waterY;
      pass(volMat, volRT);
      blurMat.uniforms.tSrc.value = volRT.texture; blurMat.uniforms.uDir.value.set(1 / volRT.width, 0); pass(blurMat, volRT2);
      blurMat.uniforms.tSrc.value = volRT2.texture; blurMat.uniforms.uDir.value.set(0, 1 / volRT.height); pass(blurMat, volRT);
      compMat.uniforms.tVol.value = volRT.texture; compMat.uniforms.uVolK.value = 1;
    } else compMat.uniforms.uVolK.value = 0;
    // 6. glow
    let src = sceneRT.texture, sw = rw, sh = rh;
    blooms.forEach((b, i) => {
      downMat.uniforms.tSrc.value = src; downMat.uniforms.uTexel.value.set(1 / sw, 1 / sh); downMat.uniforms.uFirst.value = i === 0 ? 1 : 0;
      pass(downMat, b.down); src = b.down.texture; sw = b.down.width; sh = b.down.height;
    });
    for (let i = blooms.length - 1; i >= 0; i--) {
      const b = blooms[i];
      if (i === blooms.length - 1) { upMat.uniforms.tSrc.value = b.down.texture; upMat.uniforms.uTexel.value.set(1 / b.down.width, 1 / b.down.height); upMat.uniforms.tAdd.value = blackTex; pass(upMat, b.up); continue; }
      const lo = blooms[i + 1].up;
      upMat.uniforms.tSrc.value = lo.texture; upMat.uniforms.uTexel.value.set(1 / lo.width, 1 / lo.height); upMat.uniforms.tAdd.value = b.down.texture;
      pass(upMat, b.up);
    }
    // 7. the screen
    const cu = compMat.uniforms;
    cu.tScene.value = sceneRT.texture; cu.tBloom.value = blooms.length ? blooms[0].up.texture : blackTex; cu.uLevels.value = Math.max(1, blooms.length); cu.uTexel.value.set(1 / rw, 1 / rh);
    // Where the sun is on the screen, for the lens flare (z: how strongly, 0 when it's behind you or down).
    _sv.copy(shared.uSunDir.value).multiplyScalar(1000).add(camera.position).project(camera);
    const sunUp = Math.max(0, Math.min(1, shared.uSunDir.value.y * 8));
    const onScreen = _sv.z < 1 && Math.abs(_sv.x) < 1.15 && Math.abs(_sv.y) < 1.15;
    cu.uSunUV.value.set(_sv.x * 0.5 + 0.5, _sv.y * 0.5 + 0.5, onScreen ? sunUp * grade.flare : 0);
    cu.uFlareCol.value.copy(shared.uSunDisk.value).multiplyScalar(0.02);
    cu.uAspect.value = rw / rh; cu.tDepth.value = sceneRT.depthTexture; cu.tPano.value = panoRT ? panoRT.texture : blackTex;
    const sd = shared.uSunDir.value; cu.uCloudUV.value.set(Math.atan2(sd.z, sd.x) * 0.15915494 + 0.5, Math.sqrt(Math.max(sd.y, 0)));
    cu.uBloom.value = grade.bloom; cu.uExposure.value = grade.exposure; cu.uSat.value = grade.sat; cu.uContrast.value = grade.contrast; cu.uVignette.value = grade.vignette; cu.uTint.value.copy(grade.tint);
    pass(compMat, null);
    renderer.autoClear = autoClear;
  }
  const blackTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); blackTex.needsUpdate = true;
  const _sv = new THREE.Vector3();
  // What the sunbeams look like right now (set by the game from the time of day and the weather).
  const volUniforms = { density: 0, color: new THREE.Color(1, 0.9, 0.7), dir: new THREE.Vector3(0, 1, 0), maxDist: 48, ext: 0.01, g: 0.7, under: 0, waterY: 31.9 };

  applyQuality();
  return {
    render, resize, grade, beams: volUniforms,
    get quality() { return S.q; }, get pixelHeight() { return Q.post ? rh : H * dpr; }, get settings() { return Q; }, get auto() { return S.auto; }, get scale() { return scale; }, get floatOK() { return floatOK; }, get samples() { return Math.min(Q.msaa, maxSamples); },
    setQuality(q) { if (!QUALITY[q] || (QUALITY[q].post && !floatOK)) return false; S.q = q; store(); applyQuality(); return true; },
    setAuto(v) { S.auto = !!v; store(); if (!S.auto && scale !== 1) { scale = 1; allocTargets(); } },
    onChange(f) { listeners.push(f); },
    get targets() { return { sceneRT, refrRT, volRT, panoRT, blooms }; },
    knobs, setScale(v) { scale = v; allocTargets(); }, realloc: () => allocTargets(),
  };
}

// ---------- rounded boxes ----------
// People, animals, machines and props are all built from boxes. Box faces carry texture coordinates shifted up by 2
// (see boxUvs), and every plain-coloured material bends its surface near the edges of such a face, so the boxes catch
// the light like softly rounded wooden blocks instead of sharp cardboard. The rounding grows with the box (small for an
// eye, bigger for a body) and other meshes are left alone.
let roundInstalled = false;
export function installRoundBoxes() {
  if (roundInstalled) return; roundInstalled = true;
  const L = THREE.ShaderLib.lambert;
  L.vertexShader = L.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vBoxUv;')
    .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBoxUv = uv;');
  L.fragmentShader = L.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vBoxUv;')
    .replace('#include <normal_fragment_maps>', /* glsl */ `#include <normal_fragment_maps>
      if (vBoxUv.x > 1.5) {
        vec2 bu = vBoxUv - 2.0;
        vec3 dp1 = dFdx(-vViewPosition), dp2 = dFdy(-vViewPosition);
        vec2 du1 = dFdx(bu), du2 = dFdy(bu);
        float det = du1.x * du2.y - du2.x * du1.y;
        if (abs(det) > 1e-14) {
          vec3 Tu = (dp1 * du2.y - dp2 * du1.y) / det, Tv = (dp2 * du1.x - dp1 * du2.x) / det;
          float su = length(Tu), sv = length(Tv);
          float r = min(min(su, sv) * 0.32, 0.055);
          vec2 dd = vec2(min(bu.x, 1.0 - bu.x) * su, min(bu.y, 1.0 - bu.y) * sv);
          float tx = 1.0 - smoothstep(0.0, r, dd.x), ty = 1.0 - smoothstep(0.0, r, dd.y);
          vec3 bend = (Tu / su) * (bu.x < 0.5 ? -tx : tx) + (Tv / sv) * (bu.y < 0.5 ? -ty : ty);
          normal = normalize(normal + bend * 0.9);
        }
      }`);
}
/// Mark a box geometry's faces as rounded-box faces (shift its texture coordinates up by 2).
export function boxUvs(geo) {
  const uv = geo.attributes.uv;
  if (!uv || geo.userData.boxUv) return geo;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + 2, uv.getY(i) + 2);
  uv.needsUpdate = true; geo.userData.boxUv = true;
  return geo;
}
