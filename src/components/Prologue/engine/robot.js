import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { fetchWithRetry } from './net.js';

/*
 * The robot maid from a rigged GLB: public/prologue/robot-maid.glb, CC0 VRoid sample E restyled with robot hardware
 * by prototypes/robot/blender/vroid_maid.py (bones renamed to Mixamo names; morphs blink, happy, irisOff; an emissive
 * iris; hardware parts parented to bones, the neon ones named hw_glow). Any GLB with the same bones and morphs drops in.
 * Interface: { root, head, headPivot, hand, reach, aim, grip, setEyes, left, body, look, ... }.
 *
 * Local frame: +z is her forward, +y up, origin at the chest,
 * head centre at y≈0.59, right arm (her right is -x) ≈0.97 long to the wrist.
 */

const HEAD_Y = 0.59;     // head centre in the robot.js frame
const ARM_LEN = 0.97;    // shoulder to wrist in the robot.js frame
const POLE = new THREE.Vector3(-0.7, -1, -0.15);

const _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

export async function loadRobot(url) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // Downloaded with retries (net.js), then parsed: a dropped connection on the GLB used to skip the prologue.
  const data = await fetchWithRetry(url, 'arrayBuffer', { label: url.split('/').pop() });
  const gltf = await loader.parseAsync(data, url.slice(0, url.lastIndexOf('/') + 1));
  const model = gltf.scene;

  const root = new THREE.Group();
  root.name = 'robot';
  root.add(model);

  const bones = {};
  model.traverse((o) => {
    if (o.isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o;
    if (o.isMesh) { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; }
  });
  const B = (n) => { if (!bones[n]) throw new Error(`robot.glb: no bone ${n}`); return bones[n]; };

  // ---------- fit the model to the robot.js frame ----------
  model.updateMatrixWorld(true);
  const wp = (b) => b.getWorldPosition(new THREE.Vector3());
  // She must face +z with her right arm at -x; VRM 0.x exports face the other way.
  if (wp(B('LeftArm')).x < wp(B('RightArm')).x) { model.rotation.y = Math.PI; model.updateMatrixWorld(true); }
  const armLen = wp(B('RightArm')).distanceTo(wp(B('RightForeArm'))) + wp(B('RightForeArm')).distanceTo(wp(B('RightHand')));
  const s = ARM_LEN / armLen;
  model.scale.setScalar(s);
  model.updateMatrixWorld(true);
  const headC = bones.HeadTop_End ? wp(B('Head')).lerp(wp(B('HeadTop_End')), 0.4) : wp(B('RightEye')).setX(wp(B('Head')).x);
  const shoulderMid = wp(B('RightArm')).lerp(wp(B('LeftArm')), 0.5);
  model.position.set(-shoulderMid.x, HEAD_Y - headC.y, -shoulderMid.z);
  root.updateMatrixWorld(true);

  // ---------- materials: one anime (MToon-style) toon shader for everything ----------
  // The VRoid export mixes unlit materials (hair, clothes, eye whites: full brightness in any light) with lit
  // PBR ones (skin, face: black in the dark), which looks wrong. Every part gets the same toon model instead:
  //   lit / shade colour step (a 3-tone ramp), a shade floor tinted by the material's own colour (never black),
  //   a fresnel rim light, and on the face, normals bent toward a sphere so it shades softly (the anime face trick).
  const toon = {
    uAmb: { value: 0.04 },                                 // shade floor: how much of its own colour shows unlit (linear; small)
    uRimColor: { value: new THREE.Color('#9fb4e0') },
    uRim: { value: 0.14 }, uRimPow: { value: 5.0 },
    uHeadLocal: { value: new THREE.Vector3() },            // head centre in the face mesh's space (for sphere normals)
  };
  const ramp = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 180, 180, 180, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  function toonOf(m, { face = false, tint = 1 } = {}) {
    const t = new THREE.MeshToonMaterial({
      name: m.name, map: m.map, color: m.color.clone().multiplyScalar(tint), gradientMap: ramp,
      transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest, side: m.side, depthWrite: m.depthWrite,
    });
    t.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, toon);
      // the armoured maid's mask ('Face') has no nose to keep: fully spherical, so leftover bumps can't step the ramp
      sh.uniforms.uFaceSphere = { value: face ? (m.name === 'Face' ? 1 : 0.75) : 0 };
      sh.vertexShader = 'uniform vec3 uHeadLocal;\nuniform float uFaceSphere;\n' + sh.vertexShader.replace('#include <skinning_vertex>', `#include <skinning_vertex>
        if (uFaceSphere > 0.0) vNormal = normalize(normalMatrix * mix(objectNormal, normalize(transformed - uHeadLocal), uFaceSphere));`);
      sh.fragmentShader = 'uniform float uAmb, uRim, uRimPow, uFaceSphere;\nuniform vec3 uRimColor;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
        outgoingLight += diffuseColor.rgb * uAmb;
        outgoingLight += uRimColor * uRim * (1.0 - uFaceSphere) * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), uRimPow);
        #include <opaque_fragment>`);
    };
    return t;
  }
  let iris = null, bodyMesh = null, faceMesh = null;
  const glows = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    // The export dropped normals on the parts that were unlit (clothes, hair, eye whites); lit shading needs them.
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    if (o.morphTargetDictionary && 'blink' in o.morphTargetDictionary) bodyMesh = o;
    const mats = [o.material].flat().map((m) => {
      if (/iris/i.test(m.name)) { iris = m; m.emissive = new THREE.Color('#ff8a3d'); m.toneMapped = true; return m; }
      // the hardware's neon (ear rings, joint lines) stays unlit so it glows in the dark and blooms
      if (/hw_glow/i.test(m.name)) { const g = new THREE.MeshBasicMaterial({ name: m.name, color: '#ff8a3d' }); glows.push(g); return g; }
      const face = /face/i.test(m.name);
      if (face) faceMesh = o;
      // whites stay below clipping under the screen light
      return toonOf(m, { face, tint: /cloth/i.test(m.name) ? 0.7 : /hair/i.test(m.name) ? 0.82 : /EYE/.test(m.name) ? 0.8 : 1 });
    });
    o.material = Array.isArray(o.material) ? mats : mats[0];
  });
  const irisBase = iris ? iris.color.clone() : null;

  // No eye light: on this glossy hair a point light reads as a hot orb; emissive + bloom carry the glow.
  const headBone = B('Head');

  // ---------- rest pose, in root space ----------
  const rootQ = () => root.getWorldQuaternion(new THREE.Quaternion());
  const rest = new Map();
  function remember(b) {
    rest.set(b, {
      local: b.quaternion.clone(),
      // world rotation relative to the root, so it survives the root moving
      inRoot: rootQ().invert().multiply(b.getWorldQuaternion(new THREE.Quaternion())),
    });
  }
  const restWorld = (b) => rootQ().multiply(rest.get(b).inRoot);
  function setWorldQ(b, qWorld) {
    b.parent.getWorldQuaternion(_q);
    b.quaternion.copy(_q.invert().multiply(qWorld));
    b.updateMatrixWorld(true);
  }
  const toRoot = (b) => root.worldToLocal(wp(b));

  // ---------- arms: two-bone IK, hand aim, fingers (one rig per side) ----------
  // T-pose, palm down: the right elbow flexes about +y, the left about -y.
  function makeArm(side, restHinge, pole) {
    const upper = B(`${side}Arm`), fore = B(`${side}ForeArm`), handB = B(`${side}Hand`);
    [upper, fore, handB].forEach(remember);
    const S0 = toRoot(upper), E0 = toRoot(fore), W0 = toRoot(handB);
    const LA = S0.distanceTo(E0), LB = E0.distanceTo(W0);
    const restDir = E0.clone().sub(S0).normalize();
    const restFrame = (u, n) => {
      const w = new THREE.Vector3().crossVectors(u, n).normalize();
      return new THREE.Matrix4().makeBasis(u, n.clone().sub(u.clone().multiplyScalar(n.dot(u))).normalize(), w);
    };
    const qRestArm = new THREE.Quaternion().setFromRotationMatrix(restFrame(restDir, restHinge));
    const state = { elbow: new THREE.Vector3(), wrist: new THREE.Vector3() };

    /** Solve the arm so the wrist reaches `target` (robot-local). */
    function reach(target) {
      const S = toRoot(upper);
      const toT = new THREE.Vector3().subVectors(target, S);
      const d = Math.min(toT.length(), LA + LB - 1e-3);
      const dir = toT.normalize();
      const cosA = (LA * LA + d * d - LB * LB) / (2 * LA * d);
      const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
      const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
      const E = S.clone().addScaledVector(dir, LA * cosA).addScaledVector(perp, LA * sinA);
      const W = S.clone().addScaledVector(dir, d);
      const u = E.clone().sub(S).normalize(), v = W.clone().sub(E).normalize();
      let n = new THREE.Vector3().crossVectors(u, v);
      if (n.lengthSq() < 1e-8) n = perp.clone().cross(u);
      n.normalize();
      // upper arm: map the rest (direction, hinge) frame onto the solved one
      const qArm = new THREE.Quaternion().setFromRotationMatrix(restFrame(u, n)).multiply(qRestArm.clone().invert());
      const R = rootQ();
      const qArmW = R.clone().multiply(qArm).multiply(R.clone().invert());
      setWorldQ(upper, qArmW.clone().multiply(restWorld(upper)));
      // forearm: same, then bend about the hinge
      const bend = Math.acos(THREE.MathUtils.clamp(u.dot(v), -1, 1));
      const nW = n.clone().applyQuaternion(R);
      setWorldQ(fore, new THREE.Quaternion().setFromAxisAngle(nW, bend).multiply(qArmW).multiply(restWorld(fore)));
      state.elbow.copy(E); state.wrist.copy(W);
      return W;
    }

    const fingerNames = ['Index', 'Middle', 'Ring', 'Pinky'];
    const fingerBones = fingerNames.map((f) => [1, 2, 3].map((i) => B(`${side}Hand${f}${i}`)));
    const thumbBones = [1, 2, 3].map((i) => B(`${side}HandThumb${i}`));
    [...fingerBones.flat(), ...thumbBones].forEach(remember);
    const f0 = toRoot(B(`${side}HandMiddle1`)).sub(W0).normalize();               // rest finger direction
    const across = toRoot(B(`${side}HandIndex1`)).sub(toRoot(B(`${side}HandPinky1`))).normalize();
    const b0 = new THREE.Vector3().crossVectors(f0, across).multiplyScalar(side === 'Right' ? 1 : -1).normalize();  // rest back-of-hand (up)
    const qRestHand = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(b0, f0), b0, f0));

    /** Point the hand: fingers along `dir`, back of the hand toward `up`, then twist about `dir`. */
    function aim(dir, up = new THREE.Vector3(0, 1, 0), twist = 0) {
      const z = dir.clone().normalize();
      const x = new THREE.Vector3().crossVectors(up, z).normalize();
      const y = new THREE.Vector3().crossVectors(z, x);
      const qT = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, y, z))
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), twist));
      const qDelta = qT.multiply(qRestHand.clone().invert());                     // root space
      const R = rootQ();
      setWorldQ(handB, R.clone().multiply(qDelta).multiply(R.invert()).multiply(restWorld(handB)));
      updateFingers();
    }

    const flexAxisRoot = new THREE.Vector3().crossVectors(f0, b0.clone().negate()).normalize();  // curls toward the palm
    const thumbDir = toRoot(thumbBones[1]).sub(toRoot(thumbBones[0])).normalize();
    const thumbAxisRoot = new THREE.Vector3().crossVectors(thumbDir, b0.clone().negate()).normalize();
    // Axes in each bone's own rest frame (constant, so they follow the hand wherever it goes).
    const localAxis = (b, axisRoot) => axisRoot.clone().applyQuaternion(rest.get(b).inRoot.clone().invert()).normalize();
    const fingerRig = fingerBones.map((chain, fi) => chain.map((b) => ({
      b, flex: localAxis(b, flexAxisRoot), splay: localAxis(b, b0), sign: [1, 0.3, -0.4, -1][fi] * (side === 'Right' ? 1 : -1),
    })));
    const thumbRig = thumbBones.map((b) => ({ b, flex: localAxis(b, thumbAxisRoot) }));
    let gripState = { curl: 0.2, spread: 0, thumb: 0.2, per: null };
    function updateFingers() {
      const { curl, spread, thumb, per } = gripState;
      fingerRig.forEach((chain, fi) => chain.forEach((j, i) => {
        const c = per ? per[fi] : curl;
        const q = rest.get(j.b).local.clone()
          .multiply(_q.setFromAxisAngle(j.flex, c * (i === 0 ? 1.15 : 1.35)));
        if (i === 0) q.multiply(new THREE.Quaternion().setFromAxisAngle(j.splay, -j.sign * spread * 0.22));
        j.b.quaternion.copy(q);
      }));
      thumbRig.forEach((j, i) => {
        j.b.quaternion.copy(rest.get(j.b).local).multiply(_q.setFromAxisAngle(j.flex, thumb * (i === 0 ? 0.5 : 0.9)));
      });
    }
    /** curl 0 = flat, 1 = fist; spread 0..1; thumb curl separately; `per` = [index, middle, ring, pinky] curls override `curl`. */
    function grip(curl, spread = 0, thumbCurl = curl, per = null) {
      gripState = { curl, spread, thumb: thumbCurl, per };
      updateFingers();
    }
    return { reach, aim, grip, state, hand: handB, shoulder: S0 };
  }

  // ---------- spine and hips ----------
  const hips = B('Hips'), spineChain = [B('Spine'), B('Spine1'), B('Spine2')], neck = B('Neck');
  [hips, ...spineChain, neck].forEach(remember);
  const hipsLocal0 = hips.position.clone();
  const hipsRoot0 = toRoot(hips);
  const SPLIT = [0.3, 0.35, 0.35];
  const _e = new THREE.Euler(0, 0, 0, 'YXZ');
  /**
   * Whole-body pose, robot-local: `hips` offset (m), then `lean` (forward, rad), `roll` (toward her right, rad)
   * and `twist` (toward her right, rad) spread over the spine. Call before the arms and head each frame.
   */
  function body({ hips: off = null, lean = 0, roll = 0, twist = 0 } = {}) {
    hips.position.copy(hipsLocal0);
    if (off) {
      hips.updateMatrixWorld(true);
      const w = root.localToWorld(hipsRoot0.clone().add(off));
      hips.position.copy(hips.parent.worldToLocal(w));
    }
    hips.updateMatrixWorld(true);
    spineChain.forEach((b) => b.quaternion.copy(rest.get(b).local));
    const R = rootQ();
    spineChain.forEach((b, i) => {
      b.updateMatrixWorld(true);
      // her right is -x, so roll and twist toward it are negative rotations about z and y
      const q = new THREE.Quaternion().setFromEuler(_e.set(lean * SPLIT[i], -twist * SPLIT[i], -roll * SPLIT[i]));
      setWorldQ(b, R.clone().multiply(q).multiply(R.clone().invert()).multiply(b.getWorldQuaternion(new THREE.Quaternion())));
    });
    root.updateMatrixWorld(true);
  }

  // The frame a bone's parent carries, aligned with the root at rest (equals rootQ() when nothing above it moved).
  const carried = (b) => b.getWorldQuaternion(new THREE.Quaternion()).multiply(rest.get(b).inRoot.clone().invert());

  const armR = makeArm('Right', new THREE.Vector3(0, 1, 0), POLE);
  const armL = makeArm('Left', new THREE.Vector3(0, -1, 0), new THREE.Vector3(0.7, -1, -0.15));
  const { reach, aim, grip, state, hand: handB } = armR;

  // ---------- left arm hangs at her side (its IK target when idle) ----------
  let leftHang;
  {
    const la = B('LeftArm'), lf = B('LeftForeArm');
    const ls = toRoot(la), le = toRoot(lf);
    const dRest = le.clone().sub(ls).normalize();
    const qDown = new THREE.Quaternion().setFromUnitVectors(dRest, new THREE.Vector3(0.18, -1, 0.04).normalize());
    setWorldQ(la, rootQ().multiply(qDown).multiply(rootQ().invert()).multiply(la.getWorldQuaternion(new THREE.Quaternion())));
    leftHang = toRoot(B('LeftHand'));
  }

  // ---------- head ----------
  // headPivot is a stand-in Object3D: the prologue sets its rotation (robot-local Euler)
  // and every change is applied to the head bone, pivoting at the top of the neck, on top of whatever the spine does.
  remember(headBone);
  const headPivot = new THREE.Object3D();
  const pivotChanged = headPivot.rotation._onChangeCallback;
  function applyHead() {
    const C = carried(neck);
    const q = new THREE.Quaternion().setFromEuler(headPivot.rotation);
    setWorldQ(headBone, C.clone().multiply(q).multiply(rest.get(headBone).inRoot));
  }
  headPivot.rotation._onChange(() => { pivotChanged(); applyHead(); });

  // ---------- headdress ----------
  // The frill and its band hang off a pivot at the head's centre whose axes are the robot frame at rest, so it can
  // sit askew (rotation.z rolls it toward her right, .y turns it) and be put right; ends() gives its two tips.
  const headdress = new THREE.Object3D();
  const tips = [];
  {
    const parts = [];
    model.traverse((o) => { if (/^headdress/.test(o.name)) parts.push(o); });
    const eyesMid = wp(B('LeftEye')).lerp(wp(B('RightEye')), 0.5);
    headBone.add(headdress);
    headdress.position.copy(headBone.worldToLocal(eyesMid.lerp(wp(headBone), 0.6)));
    headdress.quaternion.copy(headBone.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rootQ()));
    headdress.updateMatrixWorld(true);
    parts.forEach((o) => headdress.attach(o));
    // where her hands take it: the frill's outer edge on either side, a third of the way up from her ears (furthest
    // out along that direction), like gripping a headband at the temples; the very ends are tucked into the hair
    const frill = parts.map((o) => o.getObjectByProperty('isMesh', true) ?? o).find((o) => o.isMesh && /frill/.test(o.name + o.parent?.name));
    if (frill) {
      const pos = frill.geometry.attributes.position, v = new THREE.Vector3();
      let lo = null, hi = null, loD = -Infinity, hiD = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        const r = root.worldToLocal(frill.localToWorld(v.fromBufferAttribute(pos, i)));
        const dl = -r.x * 0.85 + r.y * 0.53, dh = r.x * 0.85 + r.y * 0.53;
        if (dl > loD) { loD = dl; lo = r.clone(); }
        if (dh > hiD) { hiD = dh; hi = r.clone(); }
      }
      for (const p of [lo, hi]) tips.push(headdress.worldToLocal(root.localToWorld(p.clone())));
    }
  }
  /** The headdress tips in her frame: [her right (-x), her left (+x)]. Sorted here, since which vertex search found
   *  which side depends on how the model was turned when it loaded. */
  const headdressEnds = () => tips.map((p) => root.worldToLocal(headdress.localToWorld(p.clone()))).sort((a, b) => a.x - b.x);

  // ---------- eye look ----------
  const eyes = [B('LeftEye'), B('RightEye')];
  eyes.forEach(remember);
  /** Eyes: `down` and `right` (her right) in rad, relative to the head. Call after the head. */
  function look(down = 0, right = 0) {
    const C = carried(headBone);
    const q = new THREE.Quaternion().setFromEuler(_e.set(down, -right, 0));
    eyes.forEach((b) => setWorldQ(b, C.clone().multiply(q).multiply(rest.get(b).inRoot)));
  }

  // ---------- eyes ----------
  const morph = bodyMesh ? bodyMesh.morphTargetDictionary : {};
  /** Eye glow 0..1 and lid opening 0..1. */
  function setEyes(glow, open) {
    glows.forEach((g) => g.color.set('#ff8a3d').multiplyScalar(0.15 + 0.85 * glow));
    if (iris) {
      iris.emissiveIntensity = glow * 2.4;
      iris.color.copy(irisBase).multiplyScalar(0.25 + 0.75 * glow);
    }
    if (bodyMesh) {
      bodyMesh.morphTargetInfluences[morph.blink] = THREE.MathUtils.clamp(1 - open, 0, 1);
    }
  }

  /** Call once per frame after posing: keeps the face's sphere normals centred on her head. */
  function updateToon() {
    if (!faceMesh) return;
    const e = wp(B('LeftEye')).lerp(wp(B('RightEye')), 0.5);
    toon.uHeadLocal.value.copy(faceMesh.worldToLocal(e.lerp(wp(headBone), 0.7)));
  }

  setEyes(0, 0);
  grip(0.2);
  reach(new THREE.Vector3(-0.3, -0.72, 0.12));
  aim(new THREE.Vector3(0, -1, 0.2), new THREE.Vector3(0, 0, -1));

  const shoulder = armR.shoulder;
  return {
    root, head: headBone, headPivot, hand: handB, mats: { iris }, reach, aim, grip, setEyes, shoulder, state, bones, morph: bodyMesh,
    left: { reach: armL.reach, aim: armL.aim, grip: armL.grip, hang: leftHang }, body, look, applyHead, headdress, headdressEnds,
    /** The head's frame (robot-local axes carried by the head): +z is where her face points. */
    headFrame: () => carried(headBone),
    toon, updateToon,
  };
}
