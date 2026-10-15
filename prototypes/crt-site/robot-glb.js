import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/*
 * The maid robot from a rigged GLB (assets/robot.glb), behind the same interface
 * as robot.js: { root, head, headPivot, hand, reach, aim, grip, setEyes }.
 *
 * Temp model: the CC0 "Maid Character" by 413 Games, restyled by
 * prototypes/robot/blender/temp_maid.py (Mixamo rig with finger bones,
 * morphs: blink, happy, irisOff; emissive iris material).
 *
 * Local frame (same as robot.js): +z is her forward, +y up, origin at the chest,
 * head centre at y≈0.59, right arm (her right is -x) ≈0.97 long to the wrist.
 */

const HEAD_Y = 0.59;     // head centre in the robot.js frame
const ARM_LEN = 0.97;    // shoulder to wrist in the robot.js frame
const POLE = new THREE.Vector3(-0.7, -1, -0.15);

const _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

export async function loadRobot(url = new URL('./assets/robot.glb', import.meta.url).href) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
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

  // ---------- materials ----------
  let iris = null, body = null;
  model.traverse((o) => {
    if (!o.isMesh) return;
    if (o.morphTargetDictionary && 'blink' in o.morphTargetDictionary) body = o;
    for (const m of [o.material].flat()) {
      if (/iris/i.test(m.name)) { iris = m; m.emissive = new THREE.Color('#ff8a3d'); m.toneMapped = true; }
      // whites stay below clipping under the screen light; gloss on hair and shoes only
      if (/cloth/i.test(m.name)) { m.color.multiplyScalar(0.62); m.roughness = 0.6; }
      if (/skin|face/i.test(m.name)) { m.color.multiplyScalar(0.8); m.roughness = 0.5; }
      if (/hair/i.test(m.name)) { m.roughness = 0.42; }   // less mirror-like: point lights read as sheen, not hot spots
    }
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

  // ---------- right arm: two-bone IK ----------
  const upper = B('RightArm'), fore = B('RightForeArm'), handB = B('RightHand');
  [upper, fore, handB].forEach(remember);
  const S0 = toRoot(upper), E0 = toRoot(fore), W0 = toRoot(handB);
  const LA = S0.distanceTo(E0), LB = E0.distanceTo(W0);
  const restDir = E0.clone().sub(S0).normalize();
  const restHinge = new THREE.Vector3(0, 1, 0);   // T-pose, palm down: the elbow flexes about +y
  const restFrame = (u, n) => {
    const w = new THREE.Vector3().crossVectors(u, n).normalize();
    return new THREE.Matrix4().makeBasis(u, n.clone().sub(u.clone().multiplyScalar(n.dot(u))).normalize(), w);
  };
  const qRestArm = new THREE.Quaternion().setFromRotationMatrix(restFrame(restDir, restHinge));
  const state = { elbow: new THREE.Vector3(), wrist: new THREE.Vector3() };

  /** Solve the right arm so the wrist reaches `target` (robot-local). */
  function reach(target) {
    const S = toRoot(upper);
    const toT = new THREE.Vector3().subVectors(target, S);
    const d = Math.min(toT.length(), LA + LB - 1e-3);
    const dir = toT.normalize();
    const cosA = (LA * LA + d * d - LB * LB) / (2 * LA * d);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const perp = POLE.clone().sub(dir.clone().multiplyScalar(POLE.dot(dir))).normalize();
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

  // ---------- hand orientation ----------
  const fingerNames = ['Index', 'Middle', 'Ring', 'Pinky'];
  const fingerBones = fingerNames.map((f) => [1, 2, 3].map((i) => B(`RightHand${f}${i}`)));
  const thumbBones = [1, 2, 3].map((i) => B(`RightHandThumb${i}`));
  [...fingerBones.flat(), ...thumbBones].forEach(remember);
  const f0 = toRoot(B('RightHandMiddle1')).sub(W0).normalize();               // rest finger direction
  const side = toRoot(B('RightHandIndex1')).sub(toRoot(B('RightHandPinky1'))).normalize();
  const b0 = new THREE.Vector3().crossVectors(f0, side).normalize();          // rest back-of-hand
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

  // ---------- fingers ----------
  const flexAxisRoot = new THREE.Vector3().crossVectors(f0, b0.clone().negate()).normalize();  // curls toward the palm
  const thumbDir = toRoot(thumbBones[1]).sub(toRoot(thumbBones[0])).normalize();
  const thumbAxisRoot = new THREE.Vector3().crossVectors(thumbDir, b0.clone().negate()).normalize();
  // Axes in each bone's own rest frame (constant, so they follow the hand wherever it goes).
  const localAxis = (b, axisRoot) => axisRoot.clone().applyQuaternion(rest.get(b).inRoot.clone().invert()).normalize();
  const fingerRig = fingerBones.map((chain, fi) => chain.map((b) => ({
    b, flex: localAxis(b, flexAxisRoot), splay: localAxis(b, b0), sign: [1, 0.3, -0.4, -1][fi],
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

  // ---------- left arm hangs at her side ----------
  {
    const la = B('LeftArm'), lf = B('LeftForeArm');
    const ls = toRoot(la), le = toRoot(lf);
    const dRest = le.clone().sub(ls).normalize();
    const qDown = new THREE.Quaternion().setFromUnitVectors(dRest, new THREE.Vector3(0.18, -1, 0.04).normalize());
    setWorldQ(la, rootQ().multiply(qDown).multiply(rootQ().invert()).multiply(la.getWorldQuaternion(new THREE.Quaternion())));
  }

  // ---------- head ----------
  // headPivot is a stand-in Object3D: the prologue sets its rotation (robot-local Euler)
  // and every change is applied to the head bone, pivoting at the top of the neck.
  remember(headBone);
  const headPivot = new THREE.Object3D();
  const pivotChanged = headPivot.rotation._onChangeCallback;
  headPivot.rotation._onChange(() => {
    pivotChanged();
    const R = rootQ();
    const q = new THREE.Quaternion().setFromEuler(headPivot.rotation);
    setWorldQ(headBone, R.clone().multiply(q).multiply(R.clone().invert()).multiply(restWorld(headBone)));
  });

  // ---------- eyes ----------
  const morph = body ? body.morphTargetDictionary : {};
  /** Eye glow 0..1 and lid opening 0..1. */
  function setEyes(glow, open) {
    if (iris) {
      iris.emissiveIntensity = glow * 2.4;
      iris.color.copy(irisBase).multiplyScalar(0.25 + 0.75 * glow);
    }
    if (body) {
      body.morphTargetInfluences[morph.blink] = THREE.MathUtils.clamp(1 - open, 0, 1);
    }
  }

  setEyes(0, 0);
  grip(0.2);
  reach(new THREE.Vector3(-0.3, -0.72, 0.12));
  aim(new THREE.Vector3(0, -1, 0.2), new THREE.Vector3(0, 0, -1));

  const shoulder = S0;
  return { root, head: headBone, headPivot, hand: handB, mats: { iris }, reach, aim, grip, setEyes, shoulder, state, bones, morph: body };
}
