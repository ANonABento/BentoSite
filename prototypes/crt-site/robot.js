import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/*
 * The bentOS maid robot, built from simple shapes after concept C
 * (prototypes/robot/concept-c.webp): ceramic doll face, black bob,
 * frilled headdress, ringed neck, glowing orange eyes behind lid shutters,
 * and a jointed right hand driven by two-bone IK.
 *
 * Local frame: +z is her forward, +y up, origin at the chest.
 * Everything animatable is exposed on the returned object.
 */

const Y = new THREE.Vector3(0, 1, 0);

export function createRobot() {
  const mats = {
    ceramic: new THREE.MeshPhysicalMaterial({ color: '#efe8dd', roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.3 }),
    black: new THREE.MeshPhysicalMaterial({ color: '#131012', roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
    joint: new THREE.MeshStandardMaterial({ color: '#2d2724', roughness: 0.4, metalness: 0.7 }),
    fabric: new THREE.MeshStandardMaterial({ color: '#f3ede3', roughness: 0.78 }),
    dress: new THREE.MeshStandardMaterial({ color: '#17141a', roughness: 0.82 }),
    lens: new THREE.MeshPhysicalMaterial({ color: '#060504', roughness: 0.06, clearcoat: 1 }),
    iris: new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#ff8a3d'), emissiveIntensity: 0 }),
    core: new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#ffd2a6'), emissiveIntensity: 0 }),
    ribbon: new THREE.MeshPhysicalMaterial({ color: '#e8823f', roughness: 0.45, clearcoat: 0.5 }),
    line: new THREE.MeshBasicMaterial({ color: '#8a7d74' }),
    handGlow: new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#ff8a3d'), emissiveIntensity: 0 }),
    knuckle: new THREE.MeshStandardMaterial({ color: '#6d6460', roughness: 0.35, metalness: 0.6 }),
  };

  const root = new THREE.Group();
  root.name = 'robot';

  // ---------- Body (a bust: dress, collar, ribbon, puff sleeves) ----------
  const torsoProfile = [
    [0.0, -0.42], [0.19, -0.42], [0.235, -0.2], [0.255, 0.02], [0.245, 0.14], [0.2, 0.23], [0.12, 0.285], [0.055, 0.3],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 48), mats.dress);
  torso.scale.z = 0.72;
  root.add(torso);

  const apron = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.26, 0.012, 2, 0.006), mats.fabric);
  apron.position.set(0, 0.0, 0.178);
  apron.rotation.x = -0.12;
  root.add(apron);
  for (let i = 0; i < 9; i++) {
    const frill = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mats.fabric);
    frill.scale.set(0.017, 0.012, 0.008);
    frill.position.set(-0.09 + i * 0.0225, 0.135, 0.19);
    root.add(frill);
  }

  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.013, 10, 32), mats.fabric);
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.y = 0.29;
  root.add(collarRing);
  for (const s of [-1, 1]) {
    const flap = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.05, 0.01, 2, 0.004), mats.fabric);
    flap.position.set(s * 0.042, 0.262, 0.105);
    flap.rotation.set(-0.5, 0, s * 0.55);
    root.add(flap);
  }
  // The ribbon: the one orange note, like the site's links.
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), mats.ribbon);
  knot.position.set(0, 0.245, 0.125);
  root.add(knot);
  for (const s of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.045, 12), mats.ribbon);
    loop.rotation.z = s * Math.PI / 2;
    loop.position.set(s * 0.03, 0.245, 0.12);
    loop.scale.z = 0.4;
    root.add(loop);
    const tail = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.05, 0.004, 1, 0.002), mats.ribbon);
    tail.position.set(s * 0.012, 0.21, 0.128);
    tail.rotation.z = s * 0.25;
    root.add(tail);
  }

  const sleeves = {};
  for (const s of [-1, 1]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 16), mats.dress);
    puff.scale.set(1, 0.85, 0.95);
    puff.position.set(s * 0.255, 0.17, 0);
    root.add(puff);
    sleeves[s] = puff;
  }

  // ---------- Neck ----------
  const neck = new THREE.Group();
  root.add(neck);
  for (let k = 0; k < 4; k++) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.052, 0.022, 28), k % 2 ? mats.joint : mats.black);
    ring.position.y = 0.31 + k * 0.026;
    neck.add(ring);
  }

  // ---------- Head ----------
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.39, 0);
  root.add(headPivot);
  const head = new THREE.Group();
  head.position.set(0, 0.2, 0.01);
  headPivot.add(head);

  const faceGeo = new THREE.SphereGeometry(0.2, 72, 54);
  {
    const p = faceGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i) * 1.04, z = p.getZ(i) * (p.getZ(i) > 0 ? 0.9 : 0.75);
      const f = Math.min(Math.max(-y / 0.22, 0), 1);
      x *= 1 - 0.24 * f * f;
      z *= 1 - 0.08 * f * f;
      p.setXYZ(i, x, y, z);
    }
    faceGeo.computeVertexNormals();
  }
  const face = new THREE.Mesh(faceGeo, mats.ceramic);
  head.add(face);

  // Put features on the face surface by casting at it from the front.
  const ray = new THREE.Raycaster();
  function onFace(x, y) {
    ray.set(new THREE.Vector3(x, y, 1), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(face, false)[0];
    return { point: hit.point.clone(), normal: hit.face.normal.clone() };
  }
  function stick(obj, x, y, lift = 0) {
    const { point, normal } = onFace(x, y);
    obj.position.copy(point).addScaledVector(normal, lift);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    head.add(obj);
    return obj;
  }

  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    const socket = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.0055, 10, 40), mats.joint);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.039, 40), mats.lens);
    lens.position.z = 0.001;
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.029, 40), mats.iris);
    iris.position.z = 0.002;
    const core = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.013, 32), mats.core);
    core.position.z = 0.003;
    // Lid shutter, hinged at its top edge: scale.y 1 = shut, 0 = open.
    const lidGeo = new THREE.CircleGeometry(0.041, 40);
    lidGeo.translate(0, -0.041, 0);
    const lid = new THREE.Mesh(lidGeo, mats.ceramic);
    lid.position.set(0, 0.041, 0.0045);
    eye.add(socket, lens, iris, core, lid);
    stick(eye, s * 0.074, -0.004, 0.006);
    const light = new THREE.PointLight('#ff8a3d', 0, 1.1, 2);
    light.position.copy(eye.position).add(new THREE.Vector3(s * 0.02, 0.03, 0.13));
    head.add(light);
    eyes.push({ group: eye, lid, light });
  }
  // Cheek marks and a tiny mouth, as in the concept.
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.016, 0.002), mats.line);
    mark.rotation.z = s * 0.35;
    stick(mark, s * (0.082 + k * 0.009), -0.058, 0.001);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.0024, 0.002), mats.line);
  stick(mouth, 0, -0.128, 0.001);

  // Hair: a black bob shell open at the face, flared at the jaw, plus straight-cut bangs.
  const bobGeo = new THREE.SphereGeometry(0.236, 72, 40, Math.PI / 2 + 0.74, Math.PI * 2 - 1.48, 0, 2.2);
  {
    const p = bobGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i) * 1.1, z = p.getZ(i);
      const k = Math.max(0, -y / 0.2);
      // Flare at the jaw like a bob, tuck in toward the face at the front edges.
      x *= 1 + 0.16 * k; z *= 1 + 0.06 * k;
      if (z > 0.05) x *= 0.96;
      p.setXYZ(i, x, y, z - 0.012);
    }
    bobGeo.computeVertexNormals();
  }
  const hairMat = mats.black.clone();
  hairMat.side = THREE.DoubleSide;
  head.add(new THREE.Mesh(bobGeo, hairMat));
  const bangsGeo = new THREE.SphereGeometry(0.238, 64, 16, Math.PI / 2 - 0.86, 1.72, 0, 1.17);
  bangsGeo.scale(1, 1.05, 0.93);
  bangsGeo.translate(0, 0, 0.004);
  head.add(new THREE.Mesh(bangsGeo, hairMat));

  // Headdress: a band over the top with a row of frills.
  const dress = new THREE.Group();
  dress.rotation.x = -0.3;
  dress.position.set(0, 0.005, -0.02);
  head.add(dress);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.009, 8, 64, Math.PI), mats.fabric);
  band.scale.y = 1.08;
  dress.add(band);
  for (let row = 0; row < 2; row++) {
    const n = row ? 13 : 15;
    for (let i = 0; i < n; i++) {
      const a = 0.16 + (i / (n - 1)) * (Math.PI - 0.32);
      const frill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mats.fabric);
      const r = 0.262 + row * 0.012;
      frill.position.set(Math.cos(a) * r, Math.sin(a) * r * 1.08, -row * 0.012);
      frill.rotation.z = a - Math.PI / 2;
      frill.scale.set(0.025 - row * 0.004, 0.036 - row * 0.005, 0.009);
      dress.add(frill);
    }
  }

  // ---------- Arms ----------
  // Right arm (her right is -x) is driven by IK; the left hangs.
  const segGeo = (r0, r1) => { const g = new THREE.CylinderGeometry(r1, r0, 1, 20); g.translate(0, 0.5, 0); return g; };
  const upper = new THREE.Mesh(segGeo(0.042, 0.036), mats.dress);
  const fore = new THREE.Mesh(segGeo(0.034, 0.027), mats.ceramic);
  const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.046, 20, 14), mats.joint);
  const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.038, 20, 14), mats.joint);
  const wristBall = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), mats.joint);
  root.add(upper, fore, shoulderBall, elbowBall, wristBall);
  const shoulder = new THREE.Vector3(-0.27, 0.15, 0);
  shoulderBall.position.copy(shoulder);
  const LEN = { upper: 0.5, fore: 0.47 };

  {
    // Left arm, hanging at her side.
    const s = new THREE.Vector3(0.27, 0.15, 0), e = new THREE.Vector3(0.31, -0.33, 0.02), w = new THREE.Vector3(0.3, -0.78, 0.08);
    const u = new THREE.Mesh(segGeo(0.042, 0.036), mats.dress), f = new THREE.Mesh(segGeo(0.034, 0.027), mats.ceramic);
    place(u, s, e); place(f, e, w);
    const eb = new THREE.Mesh(new THREE.SphereGeometry(0.038, 20, 14), mats.joint); eb.position.copy(e);
    root.add(u, f, eb);
  }

  function place(mesh, a, b) {
    const d = new THREE.Vector3().subVectors(b, a);
    mesh.position.copy(a);
    mesh.quaternion.setFromUnitVectors(Y, d.clone().normalize());
    mesh.scale.set(1, d.length(), 1);
  }

  // ---------- Hand ----------
  // Fingers along +z, palm facing -y, thumb at +x (a right hand, palm down).
  const hand = new THREE.Group();
  root.add(hand);
  const palm = new THREE.Mesh(new RoundedBoxGeometry(0.098, 0.034, 0.11, 3, 0.013), mats.ceramic);
  palm.position.z = 0.058;
  hand.add(palm);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.066, 0.006, 0.07, 2, 0.003), mats.joint);
  plate.position.set(0, 0.018, 0.06);
  hand.add(plate);
  const glowLine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.002, 0.004), mats.handGlow);
  glowLine.position.set(0, 0.022, 0.035);
  hand.add(glowLine);

  const fingers = [];
  const fingerDefs = [
    { x: 0.035, len: [0.044, 0.03, 0.024], spread: 0.12 },
    { x: 0.012, len: [0.047, 0.033, 0.025], spread: 0.03 },
    { x: -0.012, len: [0.045, 0.031, 0.024], spread: -0.05 },
    { x: -0.035, len: [0.036, 0.025, 0.02], spread: -0.14 },
  ];
  function buildFinger(lens) {
    const joints = [];
    let parent = null;
    for (const len of lens) {
      const pivot = new THREE.Group();
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.0102, 12, 10), mats.knuckle);
      const bone = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, Math.max(0.001, len - 0.019), 4, 12), mats.ceramic);
      bone.rotation.x = Math.PI / 2;
      bone.position.z = len / 2;
      pivot.add(knuckle, bone);
      if (parent) { pivot.position.z = parent.len; parent.pivot.add(pivot); }
      joints.push(pivot);
      parent = { pivot, len };
    }
    return joints;
  }
  for (const d of fingerDefs) {
    const joints = buildFinger(d.len);
    joints[0].position.set(d.x, 0, 0.113);
    hand.add(joints[0]);
    fingers.push({ joints, spread: d.spread });
  }
  const thumbBase = new THREE.Group();
  thumbBase.position.set(0.047, -0.012, 0.05);
  thumbBase.rotation.set(-0.12, 0.6, 0);
  hand.add(thumbBase);
  const thumb = buildFinger([0.036, 0.028, 0.022]);
  thumbBase.add(thumb[0]);
  fingers.push({ joints: thumb, spread: 0.2, thumb: true });

  // ---------- Posing ----------
  const state = { elbow: new THREE.Vector3(), wrist: new THREE.Vector3() };
  const pole = new THREE.Vector3(-0.7, -1, -0.15);

  /** Solve the right arm so the wrist reaches `target` (robot-local). */
  function reach(target) {
    const S = shoulder;
    const toT = new THREE.Vector3().subVectors(target, S);
    const d = Math.min(toT.length(), LEN.upper + LEN.fore - 1e-3);
    const dir = toT.normalize();
    const a = LEN.upper, b = LEN.fore;
    const cosA = (a * a + d * d - b * b) / (2 * a * d);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const E = S.clone().addScaledVector(dir, a * cosA).addScaledVector(perp, a * sinA);
    const W = S.clone().addScaledVector(dir, d);
    place(upper, S, E); place(fore, E, W);
    elbowBall.position.copy(E); wristBall.position.copy(W);
    hand.position.copy(W);
    state.elbow.copy(E); state.wrist.copy(W);
    return W;
  }

  /** Point the hand: fingers along `dir`, back of the hand toward `up`, then twist about `dir`. */
  const basis = new THREE.Matrix4();
  function aim(dir, up = new THREE.Vector3(0, 1, 0), twist = 0) {
    const z = dir.clone().normalize();
    const x = new THREE.Vector3().crossVectors(up, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    basis.makeBasis(x, y, z);
    hand.quaternion.setFromRotationMatrix(basis);
    hand.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), twist));
  }

  /** curl 0 = flat, 1 = fist; spread 0..1; thumb curl separately. */
  function grip(curl, spread = 0, thumbCurl = curl) {
    for (const f of fingers) {
      const c = f.thumb ? thumbCurl : curl;
      f.joints.forEach((j, i) => { j.rotation.x = c * (i === 0 ? 1.05 : 1.25); });
      f.joints[0].rotation.y = f.spread * spread * (f.thumb ? 1 : 2.2);
    }
  }

  /** Eye glow 0..1 and lid opening 0..1. */
  function setEyes(glow, open) {
    for (const e of eyes) {
      e.lid.scale.y = Math.max(0.001, 1 - open);
      e.light.intensity = glow * 0.07;
    }
    mats.iris.emissiveIntensity = glow * 2.2;
    mats.core.emissiveIntensity = glow * 3.4;
    mats.handGlow.emissiveIntensity = glow * 0.9;
  }

  setEyes(0, 0);
  grip(0.2);
  reach(new THREE.Vector3(-0.3, -0.72, 0.12));
  aim(new THREE.Vector3(0, -1, 0.2), new THREE.Vector3(0, 0, -1));

  return { root, head, headPivot, hand, mats, reach, aim, grip, setEyes, shoulder, state };
}
