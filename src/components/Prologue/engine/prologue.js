/*
 * The bentOS prologue: a robot maid wakes in a dark CRT's reflection, tidies up, wipes the glass and switches
 * the TV on; the camera dives into the screen and the boot plays. Script: prototypes/crt-site/PROLOGUE.md.
 *
 * Plain JS shared by the site (src/components/Prologue) and the prototype page (prototypes/crt-site/index.html,
 * which adds the tuning GUI, scrubbing and probes). Everything is a function of time, so it scrubs.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { loadRobot } from './robot.js';
import { createSfx } from './sfx.js';
import { createTimeline } from './timeline.js';

/**
 * Start the prologue in `container` (a positioned element; the canvas fills the window).
 * See prologue.d.ts for the options and the returned controls.
 */
export async function startPrologue(opts) {
const container = opts.container;
const FONT = { display: 'Orbitron', mono: 'VT323', sans: '"Instrument Sans"', ...opts.fonts };
const made = [];

/* Settings: values tuned by eye, here at their defaults. The timeline's "Settings / …" objects carry the edited ones
 * (theatre-state.json). Story times in s, positions in her frame unless noted. Most apply live through setTuning();
 * the click time, the pull-back length and the glass shot are read once (the wipe is laid out from them). */
const TUNE = {
  timing: { click: 11.4, pullBack: 2.6 },                 // the button press; the camera's pull-back that ends just before it
  camera: { glass: [-0.05, 0.2, 0.44], fov: 46,           // the locked shot on the glass (world)
    via1: [0.55, 0.24, 0.47], via2: [0.98, 0.36, 1.25] }, // the pull-back's path, out along the glass and round her right
  poses: { handsUp: [-0.16, 0.26, 0.44], showCloth: [-0.16, 0.46, 0.34], pocket: [-0.17, -0.4, 0.3], bow: [-0.06, -0.5, 0.26] },
  headdress: { roll: 0.17, yaw: 0.1 },                     // how crooked it starts
  eyes: { cold: '#ff7a3a', warm: '#ffe2c4', coldGlow: 0.45, warmGlow: 0.75 },
  light: { darkGlass: 1, ambient: 0.035, rim: 0.25, bloom: 0.9 },
};

/* The timeline (timeline.js, Theatre.js). Settings objects mirror TUNE; the rest are read every frame:
 *   Retime   hold: seconds the scene runs behind the timeline from here on (keyframe it up to add a pause)
 *   Camera   nudge/turn on top of the scripted camera; takeover blends to its own position/target/fov
 *   Her      offsets on top of her scripted motion: hands, head, lean, twist; eye glow, warmth, happy, blink
 *   Lights   multipliers: room, screen, bloom, the reflection, her fill and rim light */
const TL = await createTimeline(opts.theatreState);
const SETTINGS = { timing: 'Settings / timing', camera: 'Settings / camera path', poses: 'Settings / poses',
  headdress: 'Settings / headdress', eyes: 'Settings / eyes', light: 'Settings / light' };
const READ_ONCE = new Set(['timing', 'camera.glass']);
for (const [group, key] of Object.entries(SETTINGS)) {
  TL.define(key, TUNE[group]);
  Object.assign(TUNE[group], TL.read(key));
}
TL.define('Retime', { hold: 0 }, { hold: { range: [0, 10] } });
TL.define('Camera', { nudge: [0, 0, 0], turn: [0, 0, 0], takeover: 0, position: TUNE.camera.glass,
  target: [TUNE.camera.glass[0], TUNE.camera.glass[1], TUNE.camera.glass[2] - 1], fov: TUNE.camera.fov },
{ turn: { step: 0.002 }, takeover: { range: [0, 1] }, fov: { range: [15, 90], step: 0.1 } });
TL.define('Her', { rightHand: [0, 0, 0], leftHand: [0, 0, 0], head: [0, 0, 0], lean: 0, twist: 0,
  eyeGlow: 1, warmth: 0, happy: 0, blink: 0 },
{ head: { step: 0.002 }, eyeGlow: { range: [0, 3] }, warmth: { range: [-1, 1] }, happy: { range: [0, 1] }, blink: { range: [0, 1] } });
TL.define('Lights', { room: 1, screen: 1, bloom: 1, reflection: 1, herFill: 1, herRim: 1 });
const el = (tag, cls) => { const n = document.createElement(tag); n.className = cls; container.append(n); made.push(n); return n; };

/* ------------------------------------------------------------------ *
 * Board facts, mirrored from the site (BentoGrid.constants, globals.css)
 * ------------------------------------------------------------------ */
const STEP = 226;                // cell + wall, px
const GAP = 6 / STEP;            // wall, in cells
const RADIUS = 14 / STEP;        // card corner, in cells
const COLORS = {
  wall: '#2a2421', cell: '#171312', phosphor: '#f6f3ec', orange: '#e8823f', rice: '#f2ece2', ash: '#a39a90', lacquer: '#0e0b0a',
};
const CAT = {
  AI: '#b39dfb', Robotics: '#f0915a', Hardware: '#f2c14e', Software: '#6cc9a4',
  'Developer Tools': '#6db8e3', Games: '#f28aa5',
};
const LIT = new Set(['intro', 'search', 'contact']);

/* ------------------------------------------------------------------ *
 * Tunables (lil-gui)
 * ------------------------------------------------------------------ */
const P = {
  time: 0, playing: true, speed: 1,
  palette: 'category',     // category | mono | rgb
  ppc: 8,                  // phosphor pixels per board cell
  maskGain: 2.4,
  bloom: TUNE.light.bloom,
  dim: true,
  darkGlass: true,         // the moody reflection (crushed shadows); off: the earlier, softer grey one
  replay: () => restart(),
};

// Timeline, in seconds at speed 1.
const T = {
  led: 0.45,
  power: [0.7, 1.15],
  wordmark: [0.95, 1.35],
  lines: 1.3,              // first boot line starts; each takes `lineDur`
  lineDur: 0.22,
  // a beat on the finished boot screen, then one zoom: the dive into the glass runs straight on into the board,
  // the pixels snapping into cards on the way and landing on the home view without a pause
  snow: [2.6, 2.95],
  dive: [2.65, 3.9],
  tint: [3.0, 3.75],
  merge: [3.6, 4.1],
  resolve: [3.95, 4.6],
  zoomIn: [3.75, 5.6],     // from the handoff on, easing out into the fit zoom
  fxOff: [4.8, 5.6],
  end: 5.9,
};

const SPAN0 = 34;                // cells across the screen while it shows text
const INTRO_ZOOM = 0.4;          // the board opens at this multiple of its fit zoom (the site's INTRO.zoom)

/* ------------------------------------------------------------------ */
// the container's size (the site's is the whole window; the tuning page's leaves room for the timeline)
const vpW = () => container.clientWidth || window.innerWidth, vpH = () => container.clientHeight || window.innerHeight;
const fitZoom = () => Math.min(Math.max(Math.min(vpW() / 1760, vpH() / 1040), 0.7), 1.25);
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const ramp = (t, [a, b]) => clamp01((t - a) / (b - a));
const sstep = (x) => x * x * (3 - 2 * x);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
const mix = (a, b, t) => a + (b - a) * t;

await Promise.all([
  document.fonts.load(`700 64px ${FONT.display}`),
  document.fonts.load(`32px ${FONT.mono}`),
  document.fonts.load(`600 24px ${FONT.sans}`),
  document.fonts.load(`400 24px ${FONT.sans}`),
]);
const board = opts.board ?? await (await fetch(opts.boardUrl)).json();
const projectCount = opts.projectCount ?? board.cards.filter((c) => c.title).length;

/* ------------------------------------------------------------------ *
 * Renderer, scene
 * ------------------------------------------------------------------ */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(vpW(), vpH());
renderer.toneMapping = THREE.NoToneMapping;
renderer.domElement.className = 'stage';
container.prepend(renderer.domElement);
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
const BG = new THREE.Color('#0a0807');
scene.background = BG;
scene.fog = new THREE.Fog(BG, 4.5, 11);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(35, vpW() / vpH(), 0.01, 50);

/* ------------------------------------------------------------------ *
 * The monitor
 * ------------------------------------------------------------------ */
const SCREEN_A = Math.min(Math.max(vpW() / vpH(), 1.3), 1.78);
const SH = 1.0, SW = SH * SCREEN_A;
const SCREEN_Z = -0.055;
const BULGE = 0.045;
const BEZ = { side: 0.17, top: 0.15, bottom: 0.32 };
const OUT_W = SW + BEZ.side * 2, OUT_H = SH + BEZ.top + BEZ.bottom;
const OUT_CY = (BEZ.top - BEZ.bottom) / 2;
const BOTTOM_Y = OUT_CY - OUT_H / 2;

function roundedRect(path, cx, cy, w, h, r) {
  const x = cx - w / 2, y = cy - h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

const monitor = new THREE.Group();
scene.add(monitor);

const plastic = new THREE.MeshPhysicalMaterial({ color: '#1b1816', roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.45 });
const plasticDark = new THREE.MeshPhysicalMaterial({ color: '#121010', roughness: 0.7 });

{ // Bezel: a rounded slab with a rounded hole, bevelled
  const shape = roundedRect(new THREE.Shape(), 0, OUT_CY, OUT_W, OUT_H, 0.09);
  shape.holes.push(roundedRect(new THREE.Path(), 0, 0, SW + 0.05, SH + 0.05, 0.075));
  const depth = 0.1, bt = 0.03;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.022, bevelSegments: 5, curveSegments: 20 });
  geo.translate(0, 0, -(depth + bt));
  monitor.add(new THREE.Mesh(geo, plastic));

  // Inner light seal behind the glass so nothing shows through the recess.
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(SW + 0.1, SH + 0.1), new THREE.MeshBasicMaterial({ color: '#050404' }));
  seal.position.z = -0.12;
  monitor.add(seal);

  // Rear shell and the tapered tube housing.
  const shell = new THREE.Mesh(new RoundedBoxGeometry(OUT_W, OUT_H, 0.34, 4, 0.07), plastic);
  shell.position.set(0, OUT_CY, -0.32);
  monitor.add(shell);
  const tube = new THREE.BoxGeometry(OUT_W * 0.86, OUT_H * 0.8, 0.9, 1, 1, 1);
  const pos = tube.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getZ(i) < 0) { pos.setX(i, pos.getX(i) * 0.55); pos.setY(i, pos.getY(i) * 0.6); }
  tube.computeVertexNormals();
  const tubeMesh = new THREE.Mesh(tube, plasticDark);
  tubeMesh.position.set(0, OUT_CY + 0.02, -0.9);
  monitor.add(tubeMesh);

  // Feet.
  for (const x of [-OUT_W * 0.32, OUT_W * 0.32]) {
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.05, 0.5, 2, 0.02), plasticDark);
    foot.position.set(x, BOTTOM_Y - 0.02, -0.4);
    monitor.add(foot);
  }
}

// Chin details: badge, knobs, power LED.
const chinY = -SH / 2 - BEZ.bottom / 2 - 0.01;
{
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#8f877d'; g.font = `700 58px ${FONT.display}`; g.textBaseline = 'middle';
  g.fillText('bentOS', 6, 50);
  g.font = `30px ${FONT.mono}`; g.fillStyle = '#6b645c'; g.fillText('PVM-2026 · TRINI-CELL', 262, 52);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.116), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6 }));
  badge.position.set(-SW / 2 + 0.31, chinY, 0.003);
  monitor.add(badge);
}
const knobMat = new THREE.MeshPhysicalMaterial({ color: '#2a2522', roughness: 0.35, metalness: 0.2 });
const knobs = [];
for (const [i, x] of [SW / 2 - 0.42].entries()) {
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.035, 32), knobMat);
  knob.rotation.x = Math.PI / 2; knob.rotation.y = i * 0.7;
  knob.position.set(x, chinY, 0.015);
  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.004, 0.026), new THREE.MeshStandardMaterial({ color: '#8f877d', roughness: 0.5 }));
  notch.position.set(0, 0.0185, 0.013);
  knob.add(notch);
  monitor.add(knob);
  knobs.push(knob);
}
// The power switch: a push button in a dark collar, next to the LED.
const BUTTON_Z = 0.02;
const powerButton = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 32), new THREE.MeshPhysicalMaterial({ color: '#3a3430', roughness: 0.4, metalness: 0.1, clearcoat: 0.3 }));
powerButton.rotation.x = Math.PI / 2;
powerButton.position.set(SW / 2 - 0.28, chinY, BUTTON_Z);
monitor.add(powerButton);
const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, 0.012, 32), plasticDark);
collar.rotation.x = Math.PI / 2;
collar.position.set(SW / 2 - 0.28, chinY, 0.008);
monitor.add(collar);
const ledMat = new THREE.MeshStandardMaterial({ color: '#3a1a0a', emissive: new THREE.Color(COLORS.orange), emissiveIntensity: 0 });
const led = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 24), ledMat);
led.rotation.x = Math.PI / 2;
led.position.set(SW / 2 - 0.1, chinY, 0.006);
monitor.add(led);
const ledLight = new THREE.PointLight(COLORS.orange, 0, 0.6, 2);
ledLight.position.set(SW / 2 - 0.1, chinY, 0.05);
monitor.add(ledLight);

// Desk.
const DESK_FRONT = 0.42;
const desk = new THREE.Mesh(new THREE.BoxGeometry(30, 0.06, 4), new THREE.MeshStandardMaterial({ color: '#100c0a', roughness: 0.42 }));
desk.position.set(0, BOTTOM_Y - 0.075, DESK_FRONT - 2);
scene.add(desk);

// Lights: a warm key, an orange rim, and the screen's own glow.
const key = new THREE.DirectionalLight('#fff1e0', 0);
key.position.set(-3, 3.5, 3);
scene.add(key);
const rim = new THREE.SpotLight(COLORS.orange, 0, 12, 0.6, 0.6, 1.2);
rim.position.set(2.8, 1.8, -2.4);
rim.target.position.set(0, 0, -0.5);
scene.add(rim, rim.target);
const screenLight = new THREE.RectAreaLight('#f3eadf', 0, SW, SH);
screenLight.position.set(0, 0, 0.02);
screenLight.lookAt(0, 0, 1);
monitor.add(screenLight);

/* ------------------------------------------------------------------ *
 * Screen content: text canvas, board textures, card atlas
 * ------------------------------------------------------------------ */
const textCanvas = document.createElement('canvas');
const textCtx = textCanvas.getContext('2d');
const textTex = new THREE.CanvasTexture(textCanvas);
textTex.colorSpace = THREE.SRGBColorSpace;
textTex.minFilter = textTex.magFilter = THREE.NearestFilter;
textTex.generateMipmaps = false;
textTex.flipY = false;

const BOOT_LINES = [
  ['KEVIN JIANG · ROBOTICS & PHYSICAL AI', ''],
  ['> SELF TEST ................. ', 'OK'],
  [`> MOUNTING ${projectCount} PROJECTS ....... `, 'OK'],
];

let textSig = '';
function drawText(t) {
  const W = Math.round(SPAN0 * P.ppc), H = Math.round(W / SCREEN_A);
  const wm = ramp(t, T.wordmark);
  const typed = BOOT_LINES.map((_, i) => clamp01((t - (T.lines + i * T.lineDur)) / (T.lineDur * 0.85)));
  const cursorOn = Math.floor(t * 3.2) % 2 === 0;
  const sig = `${W}x${H}|${wm.toFixed(2)}|${typed.map((x) => x.toFixed(2)).join(',')}|${cursorOn}`;
  if (sig === textSig) return;
  textSig = sig;
  if (textCanvas.width !== W || textCanvas.height !== H) { textCanvas.width = W; textCanvas.height = H; }
  const g = textCtx;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  // Wordmark: it ignites, top row first, like a beam drawing it.
  if (wm > 0) {
    const size = Math.round(W * 0.17);
    g.save();
    g.beginPath(); g.rect(0, 0, W, H * 0.12 + size * 1.2 * wm); g.clip();
    g.font = `700 ${size}px ${FONT.display}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = COLORS.phosphor;
    g.globalAlpha = (0.35 + 0.65 * wm) * 0.72;   // under the bloom threshold's worst, so the letters stay legible
    g.fillText('bentOS', W / 2, H * 0.12 + size);
    g.restore();
  }
  const fs = Math.max(9, Math.round(H * 0.072));
  g.font = `${fs}px ${FONT.mono}`; g.textBaseline = 'top'; g.textAlign = 'left';
  const x0 = Math.round(W * 0.13);
  let y = Math.round(H * 0.47);
  let lastTyping = -1;
  BOOT_LINES.forEach(([body, ok], i) => {
    const k = typed[i];
    if (k <= 0) return;
    lastTyping = i;
    const full = body + ok;
    const n = Math.floor(full.length * k);
    const shown = full.slice(0, n);
    const bodyPart = shown.slice(0, body.length), okPart = shown.slice(body.length);
    g.fillStyle = i === 0 ? COLORS.orange : COLORS.phosphor;
    g.fillText(bodyPart, x0, y);
    if (okPart) { g.fillStyle = COLORS.orange; g.fillText(okPart, x0 + g.measureText(body).width, y); }
    if (i === BOOT_LINES.length - 1 && k >= 1 && cursorOn) {
      g.fillStyle = COLORS.phosphor;
      g.fillRect(x0 + g.measureText(full).width + 2, y + fs * 0.12, fs * 0.45, fs * 0.78);
    }
    y += Math.round(fs * (i === 0 ? 1.45 : 1.08));
  });
  textTex.needsUpdate = true;
}

// Which card covers each cell of the tile (0 = none, else index + 1).
const cols = board.cols, rows = board.rows;
const cellData = new Uint8Array(cols * rows * 4);
board.cards.forEach((c, i) => {
  for (let dy = 0; dy < c.h; dy++) for (let dx = 0; dx < c.w; dx++) {
    const x = (c.col + dx) % cols, y = (c.row + dy) % rows;
    cellData[(y * cols + x) * 4] = i + 1;
  }
});
const cellMap = new THREE.DataTexture(cellData, cols, rows, THREE.RGBAFormat, THREE.UnsignedByteType);
cellMap.needsUpdate = true;

// Card faces, packed into one atlas, drawn roughly like the real cards.
const FACE = 0.8;  // atlas px per board px
const loadImage = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = (opts.assetBase ?? '') + src; });
const images = await Promise.all(board.cards.map((c) => (c.image ? loadImage(c.image) : null)));

const rects = [];
{
  let x = 0, y = 0, rowH = 0; const AW = 4096;
  for (const c of board.cards) {
    const w = Math.round((c.w * STEP - 6) * FACE), h = Math.round((c.h * STEP - 6) * FACE);
    if (x + w > AW) { x = 0; y += rowH + 2; rowH = 0; }
    rects.push({ x, y, w, h }); x += w + 2; rowH = Math.max(rowH, h);
  }
  var atlasW = AW, atlasH = y + rowH;
}
const atlas = document.createElement('canvas');
atlas.width = atlasW; atlas.height = atlasH;
const ag = atlas.getContext('2d');

function wrap(g, text, x, y, maxW, lh, maxLines) {
  const words = text.split(/\s+/); let line = ''; let n = 0;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; if (++n >= maxLines - 1) { line += '…'; break; } } else line = test;
  }
  if (line) g.fillText(line, x, y);
}

board.cards.forEach((c, i) => {
  const { x, y, w, h } = rects[i]; const s = FACE; const g = ag;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const cat = CAT[c.category] ?? COLORS.rice;
  if (c.kind === 'search') {
    g.fillStyle = COLORS.orange; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(14,11,10,0.14)'; g.fillRect(x + 18 * s, y + h / 2 - 26 * s, w - 36 * s, 52 * s);
    g.fillStyle = COLORS.lacquer; g.font = `600 ${22 * s}px ${FONT.sans}`; g.textBaseline = 'middle';
    g.fillText('Search projects…', x + 34 * s, y + h / 2);
    g.font = `${26 * s}px ${FONT.mono}`; g.fillText('/', x + w - 46 * s, y + h / 2);
  } else if (c.kind === 'intro') {
    g.fillStyle = COLORS.cell; g.fillRect(x, y, w, h);
    g.fillStyle = COLORS.rice; g.textBaseline = 'top';
    g.font = `600 ${40 * s}px ${FONT.sans}`; g.fillText('Kevin Jiang', x + 30 * s, y + 30 * s);
    g.fillStyle = COLORS.orange; g.font = `600 ${20 * s}px ${FONT.sans}`; g.fillText('Robotics & Physical AI Engineer', x + 30 * s, y + 82 * s);
    g.fillStyle = COLORS.ash; g.font = `400 ${17 * s}px ${FONT.sans}`;
    wrap(g, 'I build robots and the software that runs them, from PCBs and printed joints up to ROS 2, teleop and on-device AI.', x + 30 * s, y + 124 * s, w - 60 * s, 25 * s, 3);
    g.fillStyle = COLORS.rice; g.font = `${20 * s}px ${FONT.mono}`;
    ['SF', "UWaterloo CE '29", 'U.S. & Canadian citizen'].forEach((f, k) => g.fillText(f, x + 30 * s + k * 150 * s, y + 220 * s));
    g.fillStyle = COLORS.ash; g.font = `400 ${15 * s}px ${FONT.sans}`;
    ['Robotics Engineer · RLWRLD', 'Robotics Intern · Reazon', 'Research Assistant · UW'].forEach((r, k) => g.fillText(r, x + 30 * s, y + 270 * s + k * 26 * s));
  } else if (c.kind === 'contact') {
    g.fillStyle = COLORS.cell; g.fillRect(x, y, w, h);
    g.textBaseline = 'middle'; g.font = `600 ${18 * s}px ${FONT.sans}`;
    ['Résumé', 'GitHub', 'LinkedIn', 'Email'].forEach((l, k) => { g.fillStyle = k === 0 ? COLORS.orange : COLORS.rice; g.fillText(l, x + 26 * s + k * 104 * s, y + h / 2); });
  } else {
    g.fillStyle = COLORS.cell; g.fillRect(x, y, w, h);
    const im = images[i];
    if (im) {
      const r = Math.max(w / im.width, h / im.height);
      g.drawImage(im, x + (w - im.width * r) / 2, y + (h - im.height * r) / 2, im.width * r, im.height * r);
      const grad = g.createLinearGradient(0, y + h * 0.45, 0, y + h);
      grad.addColorStop(0, 'rgba(14,11,10,0)'); grad.addColorStop(1, 'rgba(14,11,10,0.92)');
      g.fillStyle = grad; g.fillRect(x, y, w, h);
    } else {
      const grad = g.createRadialGradient(x + w * 0.8, y + h * 0.1, 0, x + w * 0.8, y + h * 0.1, Math.max(w, h));
      grad.addColorStop(0, cat + '33'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(x, y, w, h);
      g.fillStyle = COLORS.ash; g.font = `400 ${15 * s}px ${FONT.sans}`; g.textBaseline = 'top';
      wrap(g, c.desc ?? '', x + 22 * s, y + 64 * s, w - 44 * s, 22 * s, Math.max(2, Math.floor((h / s - 150) / 22)));
    }
    g.textBaseline = 'alphabetic';
    g.fillStyle = cat; g.font = `${17 * s}px ${FONT.mono}`;
    g.fillText((c.category ?? '').toUpperCase(), x + 22 * s, im ? y + h - 52 * s : y + 34 * s);
    g.fillStyle = COLORS.rice; g.font = `600 ${21 * s}px ${FONT.sans}`;
    g.fillText(c.title ?? '', x + 22 * s, im ? y + h - 24 * s : y + 58 * s);
  }
  g.restore();
});
const atlasTex = new THREE.CanvasTexture(atlas);
atlasTex.colorSpace = THREE.SRGBColorSpace;
atlasTex.flipY = false;
atlasTex.anisotropy = 8;
atlasTex.minFilter = THREE.LinearMipmapLinearFilter;

// Per card: [col,row,w,h] [atlas u0,v0,u1,v1] [category rgb, lit]
const N = board.cards.length;
const info = new Float32Array(N * 3 * 4);
board.cards.forEach((c, i) => {
  const r = rects[i];
  info.set([c.col, c.row, c.w, c.h], (0 * N + i) * 4);
  info.set([r.x / atlasW, r.y / atlasH, (r.x + r.w) / atlasW, (r.y + r.h) / atlasH], (1 * N + i) * 4);
  const col = new THREE.Color(c.kind === 'search' ? COLORS.orange : c.kind ? COLORS.phosphor : CAT[c.category] ?? COLORS.rice);
  info.set([col.r, col.g, col.b, LIT.has(c.id) ? 1 : 0], (2 * N + i) * 4);
});
const cardInfo = new THREE.DataTexture(info, N, 3, THREE.RGBAFormat, THREE.FloatType);
cardInfo.needsUpdate = true;

/* ------------------------------------------------------------------ *
 * The screen shader: the whole story happens here.
 * ------------------------------------------------------------------ */
const lin = (hex) => new THREE.Color(hex);
const HOME = new THREE.Vector2(7.5 - GAP / 2, 5 - GAP / 2);
const uniforms = {
  uTime: { value: 0 }, uPower: { value: 0 }, uTextAmt: { value: 1 }, uSnow: { value: 0 },
  uSpan: { value: SPAN0 }, uSpan0: { value: SPAN0 }, uAspect: { value: SCREEN_A }, uPPC: { value: P.ppc },
  uMerge: { value: 0 }, uResolve: { value: 0 }, uMaskAmt: { value: 1 }, uMaskGain: { value: P.maskGain },
  uFx: { value: 1 }, uTint: { value: 0 }, uDim: { value: 0 }, uPalette: { value: 0 }, uMaxR: { value: 8 },
  uCenter: { value: HOME }, uTile: { value: new THREE.Vector2(cols, rows) },
  uGap: { value: GAP }, uRadius: { value: RADIUS },
  uText: { value: textTex }, uCellMap: { value: cellMap }, uCardInfo: { value: cardInfo }, uAtlas: { value: atlasTex },
  tReflect: { value: null }, uReflMat: { value: new THREE.Matrix4() }, uRefl: { value: 0 }, uDarkGlass: { value: 1 },
  uPhosphor: { value: lin('#f3e9dc') }, uWall: { value: lin(COLORS.wall) }, uOff: { value: lin('#0b0c0b') },
};

if (opts.debug) Object.assign(window, { U: uniforms, P }); // debugging
const screenMat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = uv;
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    varying vec2 vUv;
    varying vec3 vWorld;
    uniform sampler2D tReflect;
    uniform mat4 uReflMat;
    uniform float uRefl, uDarkGlass;
    uniform float uTime, uPower, uTextAmt, uSnow, uSpan, uSpan0, uAspect, uPPC, uMerge, uResolve;
    uniform float uMaskAmt, uMaskGain, uFx, uTint, uDim, uPalette, uMaxR, uGap, uRadius;
    uniform vec2 uCenter, uTile;
    uniform sampler2D uText, uCellMap, uCardInfo, uAtlas;
    uniform vec3 uPhosphor, uWall, uOff;

    float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    float h13(vec3 p3) { p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
    vec3 h33(vec3 p3) { p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
    float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

    // One phosphor cell: a square with three vertical R/G/B bars and a dark border.
    // f in 0..1 within the cell; aa is the cell's size in screen pixels, inverted.
    vec3 phosphor(vec2 f, float aa, float gap, float bars) {
      float inside = smoothstep(gap, gap + aa, f.x) * smoothstep(gap, gap + aa, 1.0 - f.x)
                   * smoothstep(gap, gap + aa, f.y) * smoothstep(gap, gap + aa, 1.0 - f.y);
      float sx = clamp((f.x - gap) / (1.0 - 2.0 * gap), 0.0, 0.9999) * 3.0;
      float k = floor(sx), fs = fract(sx);
      float aab = aa * 3.0;
      float bar = smoothstep(0.07, 0.07 + aab, fs) * smoothstep(0.07, 0.07 + aab, 1.0 - fs);
      // Bars balanced by luminance so bloom doesn't turn the mask green.
      vec3 c = k < 0.5 ? vec3(1.25, 0.32, 0.22) : (k < 1.5 ? vec3(0.28, 0.82, 0.3) : vec3(0.3, 0.36, 1.35));
      return mix(vec3(inside), c * bar * inside * 2.6, bars);
    }

    vec3 staticColor(float lum, vec3 rnd, vec3 cat) {
      vec3 mono = uPhosphor * lum;
      vec3 tinted = mix(mono, cat * (0.12 + 0.85 * lum), uTint);
      vec3 rgb = mix(mono, rnd * lum * 1.6, 0.85);
      return uPalette < 0.5 ? tinted : (uPalette < 1.5 ? mono * vec3(1.0, 0.86, 0.7) : rgb);
    }

    void main() {
      vec2 uv = vUv;
      float frame = floor(uTime * 24.0);

      // Board coordinates (cells), y down, and phosphor pixel coordinates.
      vec2 b = uCenter + vec2((uv.x - 0.5) * uSpan, -(uv.y - 0.5) * uSpan / uAspect);
      vec2 q = b * uPPC;

      // Analog tearing while the signal is noisy.
      float tearAmt = uSnow * (1.0 - smoothstep(0.0, 0.5, uMerge));
      float row = floor(q.y);
      float tear = step(0.975, h12(vec2(row * 0.37, frame))) * (h12(vec2(row, frame + 3.0)) - 0.5) * 7.0 * tearAmt;
      q.x += tear; b.x += tear / uPPC;

      vec2 ip = floor(q);
      vec2 fp = fract(q);
      float pxScreen = fwidth(q.x);                 // phosphor cells per screen pixel
      float aa = clamp(pxScreen * 1.2, 0.002, 0.5);
      float maskVis = uMaskAmt * (1.0 - smoothstep(0.1, 0.2, pxScreen));

      // Which card is here (this copy of the tile).
      vec2 cell = floor(b);
      vec2 tc = mod(cell, uTile);
      float idx = floor(texelFetch(uCellMap, ivec2(tc), 0).r * 255.0 + 0.5) - 1.0;
      bool onCard = idx >= 0.0;
      vec4 i0 = vec4(0.0), i1 = vec4(0.0), i2 = vec4(uPhosphor, 0.0);
      vec2 origin = cell, size = vec2(1.0), local = vec2(0.0);
      float mC = 0.0, rC = 0.0, sdf = 1.0, copyHash = 0.0;
      bool home = false;
      if (onCard) {
        i0 = texelFetch(uCardInfo, ivec2(int(idx), 0), 0);
        i1 = texelFetch(uCardInfo, ivec2(int(idx), 1), 0);
        i2 = texelFetch(uCardInfo, ivec2(int(idx), 2), 0);
        vec2 d = mod(tc - i0.xy, uTile);
        origin = cell - d;
        size = i0.zw - uGap;
        local = b - origin;
        sdf = sdRound(local - size * 0.5, size * 0.5, uRadius);
        vec2 copyIdx = floor((origin - i0.xy + 0.5) / uTile);
        home = all(equal(copyIdx, vec2(0.0)));
        copyHash = h12(copyIdx + 7.0) * 97.0;
        float dn = clamp(length(origin + size * 0.5 - uCenter) / uMaxR, 0.0, 1.0);
        mC = clamp((uMerge - dn * 0.45) / 0.55, 0.0, 1.0);
        rC = clamp((uResolve - dn * 0.45) / 0.55, 0.0, 1.0);
      }
      vec3 cat = i2.rgb;

      // ---- Layer 1: text, eaten by snow ----
      vec2 pc = (ip + 0.5) / uPPC;   // this phosphor's centre, in cells
      vec2 tuv = vec2((pc.x - uCenter.x) / uSpan0 + 0.5, (pc.y - uCenter.y) / (uSpan0 / uAspect) + 0.5);
      vec3 txt = (tuv.x > 0.0 && tuv.x < 1.0 && tuv.y > 0.0 && tuv.y < 1.0) ? texture(uText, tuv).rgb : vec3(0.0);
      txt *= 1.35;
      float pixLum = pow(h13(vec3(ip, frame)), 1.6);
      vec3 pixRnd = h33(vec3(ip, frame));
      float eaten = step(h12(ip * 1.37 + 0.5), uSnow);
      vec3 pixColor = mix(txt * uTextAmt, staticColor(pixLum * 1.15, pixRnd, cat), eaten);

      // ---- Layer 2: the merge (pixel -> 2x2 -> 4x4 -> cell -> card) and resolve ----
      vec3 col;
      vec3 patt;
      float flash = 0.0;
      if (!onCard || mC <= 0.0) {
        col = pixColor;
        patt = phosphor(fp, aa, 0.06, 1.0);
      } else {
        vec2 lp = local * uPPC;                       // phosphor coords from the card's corner
        float stage = floor(mC * 5.0);                // 0..5
        flash = exp(-fract(mC * 5.0) * 7.0) * 0.25 * step(mC, 0.999);
        if (stage < 4.0) {
          float L = pow(2.0, stage);                  // 1, 2, 4, 8 phosphors per block
          L = min(L, uPPC);
          vec2 bid = floor(lp / L);
          vec2 bf = fract(lp / L);
          float lum = pow(h13(vec3(bid + idx * 31.0 + copyHash, frame)), 1.4);
          vec3 rnd = h33(vec3(bid + idx * 31.0 + copyHash, frame));
          col = staticColor(lum * 1.1, rnd, cat);
          patt = phosphor(bf, aa / L, 0.06 / L, 1.0 - smoothstep(0.0, 0.15, mC));
          // The card's outline starts to bite as blocks grow.
          float edge = smoothstep(0.0, -aa / uPPC, sdf);
          col = mix(uWall * 0.4, col, mix(1.0, edge, smoothstep(0.35, 0.75, mC)));
        } else {
          // One block per card: a humming slab of signal.
          // A compartment full of live signal: dark body, glowing rim, rolling interference.
          float hum = 0.85 + 0.15 * h13(vec3(idx, copyHash, frame));
          float inner = clamp(-sdf / 0.35, 0.0, 1.0);
          float rimGlow = exp(-(-sdf) * 9.0);
          float band = 0.5 + 0.5 * sin((local.y * 3.0 - uTime * 2.2) * 3.14159 + idx);
          float grainS = h13(vec3(ip, frame));
          float lumS = hum * (0.16 + 0.1 * band + 0.18 * grainS + 0.75 * rimGlow);
          vec3 slab = staticColor(lumS, h33(vec3(ip, frame)), cat);

          // Resolve: the image sharpens through 8 -> 4 -> 2 -> 1 phosphor blocks, then clean.
          if (rC > 0.0) {
            float rs = floor(rC * 5.0);
            float L = rs < 4.0 ? uPPC / pow(2.0, rs) : 0.0;
            vec2 lpq = L > 0.0 ? (floor(lp / L) + 0.5) * L : lp;
            vec2 cuv = clamp(lpq / (size * uPPC), 0.0, 1.0);
            vec3 img = texture(uAtlas, mix(i1.xy, i1.zw, cuv)).rgb;
            float grain = (h13(vec3(lp * 0.0 + floor(lp), frame)) - 0.5) * 0.35 * (1.0 - rC);
            col = mix(slab, img, smoothstep(0.0, 0.18, rC)) + grain;
            vec2 bf = L > 0.0 ? fract(lp / L) : vec2(0.5);
            float gapL = L > 0.0 ? 0.05 / L * uPPC / 8.0 : 0.0;
            patt = L > 0.0 ? phosphor(bf, aa / max(L, 1.0), gapL, L <= 1.0 ? 1.0 : 0.0) : phosphor(fp, aa, 0.06, 1.0);
            flash += exp(-fract(rC * 5.0) * 9.0) * 0.18 * step(rC, 0.999);
            if (home && i2.a > 0.5) {} else col *= mix(1.0, 0.42, uDim);
          } else {
            col = slab;
            patt = phosphor(fp, aa, 0.06, 0.65);
          }
          float edge = smoothstep(aa / uPPC, -aa / uPPC, sdf);
          col = mix(uWall, col, edge);
          patt = mix(vec3(1.0), patt, edge);
        }
      }
      if (!onCard && uMerge > 0.0) col = mix(col, uWall, smoothstep(0.3, 0.8, uMerge));

      col *= 1.0 + flash;

      // Phosphor mask: visible once a cell spans a few screen pixels.
      vec3 masked = col * patt * uMaskGain / 2.6;
      col = mix(col, masked, maskVis * uFx);

      // ---- Glass, beam and tube ----
      float vig = pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.28);
      col *= mix(1.0, vig, uFx);
      col *= 1.0 + uFx * (0.025 * sin(uTime * 113.0) + 0.06 * exp(-pow((fract(uv.y * 0.6 - uTime * 0.18) - 0.5) * 10.0, 2.0)));

      // Power-on: a hot line opens out into the picture.
      float p = uPower;
      float lw = smoothstep(0.0, 0.32, p), lh = mix(0.006, 1.0, pow(smoothstep(0.28, 1.0, p), 2.0));
      float beam = (1.0 - smoothstep(lw * 0.5, lw * 0.5 + 0.004, abs(uv.x - 0.5))) * (1.0 - smoothstep(lh * 0.5, lh * 0.5 + 0.01, abs(uv.y - 0.5)));
      float hot = 1.0 - smoothstep(0.3, 1.0, p);
      vec3 off = uOff + uOff * phosphor(fp, aa, 0.06, 1.0) * 0.6 * maskVis;
      col = mix(off, col + vec3(1.0, 0.96, 0.9) * hot * hot * 1.6, beam * step(0.001, p));
      // A faint afterglow dot lingers at the centre while the tube warms up.
      col += vec3(1.0, 0.9, 0.8) * exp(-length((uv - 0.5) * vec2(uAspect, 1.0)) * 40.0) * smoothstep(0.0, 0.05, p) * hot * 0.8;

      // The dark glass is a mirror: whatever stands in front of the tube shows in it.
      if (uRefl > 0.001) {
        vec4 rc = uReflMat * vec4(vWorld, 1.0);
        vec3 refl = texture(tReflect, rc.xy / rc.w).rgb;
        // dark glass: crushed shadows (on brightness only, so her colours keep their hue), so she comes out of the
        // black and her eyes and whites pop
        refl *= mix(1.0, pow(dot(refl, vec3(0.2126, 0.7152, 0.0722)) + 1e-4, 0.7) * 1.9, uDarkGlass);
        float grain = 0.85 + 0.15 * phosphor(fp, aa, 0.06, 0.0).r * maskVis;
        col += refl * uRefl * 0.75 * grain;
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `,
});

// Curved screen + glass share one geometry; the bulge flattens as we dive in.
const screenGeo = new THREE.PlaneGeometry(SW, SH, 64, 40);
const flat = Float32Array.from(screenGeo.attributes.position.array);
let lastBulge = -1;
function setBulge(k) {
  if (Math.abs(k - lastBulge) < 1e-4) return;
  lastBulge = k;
  const pos = screenGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = flat[i * 3] / (SW / 2), y = flat[i * 3 + 1] / (SH / 2);
    pos.setZ(i, BULGE * k * (1 - x * x * 0.85) * (1 - y * y * 0.85));
  }
  pos.needsUpdate = true;
  screenGeo.computeVertexNormals();
}
setBulge(1);
const screen = new THREE.Mesh(screenGeo, screenMat);
screen.position.z = SCREEN_Z;
monitor.add(screen);

const glassMat = new THREE.MeshPhysicalMaterial({
  color: '#000000', roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
  transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.7,
});
const glass = new THREE.Mesh(screenGeo, glassMat);
glass.position.z = SCREEN_Z + 0.004;
glass.renderOrder = 2;
monitor.add(glass);

const reflSize = () => [Math.min(2048, Math.round(vpW() * renderer.getPixelRatio())), Math.min(2048, Math.round(vpH() * renderer.getPixelRatio()))];
const reflector = new Reflector(new THREE.PlaneGeometry(SW, SH), { textureWidth: reflSize()[0], textureHeight: reflSize()[1], clipBias: 0.003 });
reflector.position.z = SCREEN_Z + BULGE + 0.012;
reflector.visible = false;
monitor.add(reflector);
uniforms.tReflect.value = reflector.getRenderTarget().texture;
const reflInv = new THREE.Matrix4();
function renderReflection() {
  scene.updateMatrixWorld();
  camera.updateMatrixWorld(); // not in the scene, so not updated above
  reflector.visible = true;
  reflector.onBeforeRender(renderer, scene, camera);
  reflector.visible = false;
  reflInv.copy(reflector.matrixWorld).invert();
  uniforms.uReflMat.value.copy(reflector.material.uniforms.textureMatrix.value).multiply(reflInv);
}

/* ------------------------------------------------------------------ *
 * The robot, and a cold moonlight so silhouettes read in the dark
 * ------------------------------------------------------------------ */
// The robot maid (assets/robot-maid.glb: CC0 VRoid sample E restyled with robot hardware by
// prototypes/robot/blender/vroid_maid.py). ?robot=t3 / c1 load the earlier generated maids (gitignored), ?robot=vroid
// the first placeholder, ?robot=shapes the procedural robot, ?robot=<file>.glb any model in assets/.
const robot = await loadRobot(opts.robotUrl);
scene.add(robot.root);
if (opts.debug) window.dbg = { robot, scene, camera, reflector, THREE, uniforms };
// Moonlight from her left (a window off-screen): a side key, so the toon ramp puts a light/shade edge across her face.
const moon = new THREE.DirectionalLight('#c4cce6', 0.24);
moon.position.set(-2.6, 1.6, 0.3);
scene.add(moon);
// A cool key from her front-right: the reveal and the knob insert (prologue only).
const proRim = new THREE.SpotLight('#9fb4e0', 0, 4, 0.55, 0.7, 1.5);
proRim.position.set(1.4, -0.3, 0.55);       // below her head: it lights the arm and knob, not the (white) hair
proRim.target.position.set(0.5, -0.62, 0.3);
scene.add(proRim, proRim.target);
// A narrow cool rim on her hand from the glass side, so its edges separate from the dark set.
const handFill = new THREE.SpotLight('#b8c6e8', 0, 1.6, 0.32, 0.7, 1.5);
handFill.position.set(0.3, 0.1, 0.05);
handFill.target.position.set(0.18, -0.24, 0.3);
scene.add(handFill, handFill.target);

/* ------------------------------------------------------------------ *
 * Post
 * ------------------------------------------------------------------ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(vpW(), vpH()), 0.9, 0.5, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ------------------------------------------------------------------ *
 * Camera path
 * ------------------------------------------------------------------ */
const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
function fillDistance() {
  const a = vpW() / vpH();
  return Math.min(SH, SW / a) / (2 * tanHalf);
}
function spanEnd() {
  const d = fillDistance();
  const visW = 2 * d * tanHalf * (vpW() / vpH());
  return (vpW() / (STEP * fitZoom())) / (visW / SW);
}

// The boot starts where the prologue's pull-back settles, over her right shoulder (P0).
// Move 3: from there, one push back into the TV. It starts as the screen powers on, creeps while the boot text
// plays, and runs on into the dive, ending square on the glass.
const P0 = new THREE.Vector3(1.0, 0.55, 2.35), L_END = new THREE.Vector3(0.28, -0.22, 0);
const INTO = [T.power[0], T.dive[1]];
const tmpTarget = new THREE.Vector3();
function placeCamera(t) {
  const e = skew(0.75)(ramp(t, INTO));
  // Exponential approach reads as a constant-rate zoom into the glass.
  const Q = P0.clone().setZ(P0.z - SCREEN_Z);   // P0 relative to the glass
  const d0 = Q.length(), d1 = fillDistance();
  const dist = Math.exp(mix(Math.log(d0), Math.log(d1), e));
  const lateral = 1 - sstep(e);
  const dir = new THREE.Vector3(Q.x * lateral, Q.y * lateral, Math.sqrt(Math.max(1e-6, Q.lengthSq() - (Q.x * lateral) ** 2 - (Q.y * lateral) ** 2))).normalize();
  camera.position.copy(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, 0, SCREEN_Z));
  tmpTarget.lerpVectors(L_END, new THREE.Vector3(0, 0, SCREEN_Z), sstep(e));
  camera.lookAt(tmpTarget);
}

/* ------------------------------------------------------------------ *
 * The timeline: everything is a function of t, so scrubbing works.
 * ------------------------------------------------------------------ */
function apply(t) {
  drawText(t);
  const u = uniforms;
  u.uTime.value = t;
  u.uDarkGlass.value = P.darkGlass ? TUNE.light.darkGlass : 0;
  u.uPower.value = ramp(t, T.power);
  u.uSnow.value = sstep(ramp(t, T.snow));
  u.uTextAmt.value = 1;
  u.uPPC.value = P.ppc;
  u.uMaskGain.value = P.maskGain;
  u.uPalette.value = { category: 0, mono: 1, rgb: 2 }[P.palette];
  u.uTint.value = sstep(ramp(t, T.tint));
  u.uMerge.value = ramp(t, T.merge);
  u.uResolve.value = ramp(t, T.resolve);
  u.uDim.value = P.dim ? sstep(ramp(t, [T.resolve[1] - 0.3, T.end])) : 0;
  const fxOff = sstep(ramp(t, T.fxOff));
  u.uFx.value = 1 - fxOff;
  u.uMaskAmt.value = 1;
  const sEnd = spanEnd();
  // Content zoom, like the site's own boot: it reaches the board zoomed well out (INTRO_ZOOM of the fit zoom) at the
  // handoff, where the site's board takes over at that zoom and glides on in; here the pixels merge into cards and it
  // glides in to the fit zoom as they resolve.
  const sWide = sEnd / INTRO_ZOOM;
  u.uMaxR.value = sWide * 0.55;
  // speeding up into the handoff, then easing out from it at about the same rate: one continuous zoom
  const zOut = easeInQuad(ramp(t, [T.dive[0] + 0.3, T.zoomIn[0]]));
  const zIn = easeOutCubic(ramp(t, T.zoomIn));
  u.uSpan.value = Math.exp(mix(mix(Math.log(SPAN0), Math.log(sWide), zOut), Math.log(sEnd), zIn));

  placeCamera(t);
  setBulge(1 - sstep(ramp(t, [T.dive[0] + 0.6, T.dive[1]])));
  // the glass's sheen goes as the static starts: close up, the room's ceiling light glints in it as a white blob
  glassMat.opacity = 1 - sstep(ramp(t, [T.snow[0] - 0.3, T.dive[0] + 0.1]));

  // Room lights: up a touch at the start, out as we enter the screen.
  const roomIn = sstep(ramp(t, [T.led, T.led + 1.4])), roomOut = 1 - sstep(ramp(t, [T.dive[0], T.dive[1] - 0.3]));
  key.intensity = 1.6 * roomIn * roomOut;
  rim.intensity = 30 * roomIn * roomOut;
  scene.environmentIntensity = 0.35 * roomIn;
  // Standby: a dim red LED that lights the knobs in the dark; on the click it goes orange.
  const on = t > T.led || ledForce ? 1 : 0;
  ledMat.emissive.set(on ? COLORS.orange : '#ff3a1a');
  ledLight.color.set(on ? COLORS.orange : '#ff3a1a');
  ledMat.emissiveIntensity = on ? 3 + Math.sin(t * 3) * 0.2 : 0.9 + 0.25 * Math.sin(t * 2.2);
  ledLight.intensity = on ? 0.25 : 0.06;
  ledLight.distance = on ? 0.6 : 0.45;
  const screenOn = ramp(t, T.power);
  screenLight.intensity = (2.2 + 3 * (1 - sstep(ramp(t, [T.power[0] + 0.2, T.power[1] + 0.3])))) * screenOn * roomOut;

  uniforms.uRefl.value = (1 - 0.88 * sstep(ramp(t, [T.power[0], T.power[1] + 0.4]))) * (1 - sstep(ramp(t, [T.dive[0], T.dive[0] + 0.8])));
  bloom.strength = P.bloom * (1 + 0.25 * (1 - sstep(ramp(t, [T.power[0] + 0.25, T.power[1] + 0.4]))) * screenOn) * (1 - 0.55 * sstep(ramp(t, T.dive))) * (1 - fxOff);
}

/* ------------------------------------------------------------------ *
 * The prologue, v7 (script: PROLOGUE.md). One shot on her reflection: her eyes wake cold in the dark glass, she
 * lifts her hands and tries her fingers, puts her crooked headdress right, takes a handkerchief from her apron
 * pocket and reaches for the glass; her real hand entering the frame is the reveal. Four quick swipes, and as the
 * last crosses her reflected face her eyes come back warm (moody → cute). Only then does the camera pull back,
 * as she reaches down to click the TV on. She tucks the cloth away, bows in the screen's glow and steps aside.
 * Story time s; the boot runs on tb, which reaches T.led as the button clicks (s = CLICK).
 * ------------------------------------------------------------------ */
const CLICK = TUNE.timing.click;
const WARM = 0.6;        // CRT warm-up: the LED lights on the click, the screen a moment later
const PRO_END = CLICK - 0.25;   // the prologue's camera has settled over her shoulder; the boot's camera takes over
const ASIDE = [CLICK + 1.3, CLICK + 2.1];   // she steps out of the boot camera's way
// Speed ramp: story time runs at 0.6× through the press.
const SLOW = [CLICK - 0.2, CLICK], SLOW_K = 0.6, SLOW_EXTRA = (SLOW[1] - SLOW[0]) * (1 / SLOW_K - 1);
const story = (t) => (t < SLOW[0] ? t : t < SLOW[0] + (SLOW[1] - SLOW[0]) / SLOW_K ? SLOW[0] + (t - SLOW[0]) * SLOW_K : t - SLOW_EXTRA);
const TOTAL = CLICK + WARM - T.led + T.end + SLOW_EXTRA;
let ledForce = false;

const ROBOT_HOME = new THREE.Vector3(0.1, -0.5, 1.08);    // close enough to wipe the glass with a lean
const ROBOT_AWAY = new THREE.Vector3(-1.0, -0.5, 1.85);
const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInQuad = (x) => x * x;
const easeOutBack = (x, o = 1.4) => 1 + (o + 1) * Math.pow(x - 1, 3) + o * Math.pow(x - 1, 2);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const bump = (x) => Math.sin(Math.PI * clamp01(x)) ** 2;   // 0 → 1 → 0 over x in [0, 1]

/**
 * A channel: starts at v0, then each [t0, t1, to, ease] move runs from wherever the last one left it.
 * Moves are sequential; a move that starts before the last one ends cuts it off from where it was.
 */
function track(t, v0, moves) {
  let v = v0;
  for (const [t0, t1, to, ease = easeOutCubic] of moves) {
    if (t <= t0) break;
    v = mix(v, to, ease(clamp01((t - t0) / (t1 - t0))));
  }
  return v;
}
/** Same, for vectors; a move with `lift` travels on a quadratic bezier through its raised midpoint (an arc). */
function trackV(t, v0, moves) {
  const v = v0.clone();
  for (const [t0, t1, to, ease = easeOutCubic, lift = null] of moves) {
    if (t <= t0) break;
    const k = ease(clamp01((t - t0) / (t1 - t0)));
    if (lift) {
      const c = v.clone().lerp(to, 0.5).add(lift), a = v.clone();
      v.copy(a.multiplyScalar((1 - k) ** 2)).addScaledVector(c, 2 * k * (1 - k)).addScaledVector(to, k * k);
    } else v.lerp(to, k);
  }
  return v;
}

// Servo hold: small stepped corrections every ~1.3 s, each a 70 ms snap. Deterministic in t, so it scrubs.
function servo(t, seed, amp) {
  const P = 1.3, x = t + seed * 0.71;
  const i = Math.floor(x / P), f = x - i * P;
  const h = (n) => (Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453) % 1;
  return amp * mix(h(i - 1), h(i), easeOutCubic(clamp01(f / 0.07)));
}

// Eye ignition flicker, like a tube striking: [time, glow] keys.
const FLICKER = [[0.6, 0], [0.64, 0.55], [0.69, 0.05], [0.76, 0.8], [0.8, 0.25], [0.92, 1]];
function eyeGlow(t) {
  if (t < FLICKER[0][0]) return 0;
  for (let i = 1; i < FLICKER.length; i++) if (t < FLICKER[i][0]) return FLICKER[i - 1][1];
  return 1;
}

// Ease-in-out with the fastest point at p: a slow start, a long settle.
const skew = (p) => (x) => (x < p ? (x * x) / p : 1 - ((1 - x) * (1 - x)) / (1 - p));

// Hand poses in her frame (robot-local: +z forward, her right is -x, origin at the chest, head centre y≈0.59).
const R_REST = V(-0.3, -0.72, 0.12), REST_DIR = V(0, -1, 0.25);
const mirrorX = ([x, y, z]) => V(-x, y, z);
const UP = { R: V(...TUNE.poses.handsUp), L: mirrorX(TUNE.poses.handsUp) };   // both hands up in front of her, in the reflection
const UP_DIR = { R: V(0.1, 1, 0.3), L: V(-0.1, 1, 0.3) };
const TIDY_DIR = { R: V(0.4, 1, -0.4), L: V(-0.4, 1, -0.4) };            // fingers up, in and back: the hands at her temples, in front of the hair
const TIDY_UP = { R: V(-1, 0.1, 0.3), L: V(1, 0.1, 0.3) };
const PINCH_REACH = 0.27;                                  // wrist to the pinch between thumb and index
const ASKEW = TUNE.headdress;                              // how crooked the headdress starts
const POCKET = V(...TUNE.poses.pocket), POCKET_DIR = V(0.05, -1, 0.2);         // fingers into the apron pocket
const SHOW = V(...TUNE.poses.showCloth), SHOW_DIR = V(0.2, 0.3, 1);   // the cloth held up by her face, hanging from her fingers
const CLASP = { R: V(...TUNE.poses.bow), L: mirrorX(TUNE.poses.bow) };         // hands folded in front for the bow
const CLASP_DIR = { R: V(0.8, -0.6, 0.3), L: V(-0.8, -0.6, 0.3) };
const FINGER_TIP = 0.3;                                   // wrist to index fingertip
const POINT_DIR = V(0.2, -0.3, -1).normalize();          // world: the press goes in along this
// The wipe, in world space on the glass (x, y), laid around where her reflected face shows from the wipe camera:
// three swipes around it, and the last one across it (the flip). Her eyes during the wipe are measured with ?probe.
const GLASS_Z = 0.045;                                    // palm height off the glass, with the cloth under it
const WIPE_CAM = V(...TUNE.camera.glass);                  // clear of her head (eyes at z≈0.74) and her elbow
const EYES_WIPING = V(0.085, 0.05, 0.74);
const FACE_ON_GLASS = (() => {
  const mirrored = V(EYES_WIPING.x, EYES_WIPING.y, -EYES_WIPING.z);
  return WIPE_CAM.clone().lerp(mirrored, (WIPE_CAM.z - 0.09) / (WIPE_CAM.z - mirrored.z));   // at the cloth's depth
})();
const CLOTH_ABOVE_WRIST = 0.12;                           // the cloth's centre sits this far up from the wrist
const W = (dx, dy) => V(FACE_ON_GLASS.x + dx, FACE_ON_GLASS.y - CLOTH_ABOVE_WRIST + dy, 0);
const WIPE = [[6.75, W(0.24, -0.08)], [7.15, W(-0.14, -0.1)], [7.55, W(0.2, 0.0)], [7.95, W(-0.13, -0.06)], [8.5, W(0.24, 0.0)]];
const WIPE_LIFT = [null, V(0, 0.03, 0), V(0, 0.03, 0), V(0, -0.03, 0), V(0, 0.02, 0)];
const FLIP = 8.17;                                         // the last swipe crosses her reflected eyes
const WIGGLE = [2.75, 2.97, 3.19, 3.41];                   // forward, back, forward, back

// Camera: three moves (the third, the dive, is placeCamera's).
// 1. Locked on the glass, square to it (nothing gives away that it's a reflection): all the motion is hers, through
//    the wake, the hands, the headdress and the wipe; her real hand entering this still frame is the reveal.
// 2. Once the wipe is done, as she reaches down for the button, one slow pull-back out to her right and round
//    behind her shoulder, settling on her finger at the button. Even speed along its path (no surges between keys),
//    eased at both ends, and the view turns by one slerp from the glass to the button. She clicks once it settles.
const GLASS = { p: WIPE_CAM.clone(), l: WIPE_CAM.clone().add(V(0, 0, -1)), fov: TUNE.camera.fov };
const AWAY = { t0: PRO_END - TUNE.timing.pullBack, t1: PRO_END, path: new THREE.CatmullRomCurve3([
  GLASS.p,
  V(...TUNE.camera.via1), // first sideways along the glass, clear of her head as she leans in (head ≈ (0.09, 0.1, 0.85))
  V(...TUNE.camera.via2), // then back past her right side
  P0.clone(),
], false, 'centripetal') };
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _look = new THREE.Matrix4();
function lookQ(q, from, to) { return q.setFromRotationMatrix(_look.lookAt(from, to, camera.up)); }
function move(t) {
  if (t < AWAY.t0) return { p: GLASS.p, q: lookQ(_qa, GLASS.p, GLASS.l), fov: GLASS.fov };
  const u = easeInOutCubic(clamp01((t - AWAY.t0) / (AWAY.t1 - AWAY.t0)));
  lookQ(_qa, GLASS.p, GLASS.l); lookQ(_qb, P0, L_END);
  return { p: AWAY.path.getPointAt(u), q: _qa.slerp(_qb, u), fov: mix(GLASS.fov, 35, u) };
}

// ---- the handkerchief: white lawn with a lace edge and an orange stitched hem; it blends between gathered in her
// fingers and spread on the glass ----
const CLOTH = 0.2;
const clothGeo = new THREE.PlaneGeometry(CLOTH, CLOTH, 24, 24);
const clothFlat = Float32Array.from(clothGeo.attributes.position.array);
const clothBunch = clothFlat.slice();
for (let i = 0; i < clothFlat.length; i += 3) {
  const x = clothFlat[i] / CLOTH, y = clothFlat[i + 1] / CLOTH;    // -0.5..0.5
  // spread: never quite flat, a few soft creases from being folded in a pocket
  // and the corners, out past her palm, lift off the glass toward her hand
  clothFlat[i + 2] = 0.004 * Math.sin(x * 9 + y * 4) + 0.003 * Math.sin(y * 13 - x * 5) - 0.09 * Math.max(0, Math.abs(x) + Math.abs(y) - 0.55) ** 1.5;
  // gathered: pinched at the top centre, hanging in soft folds that open out toward the bottom
  const g = Math.max(0, 0.5 - y);                                     // 0 at the fingers, 1 at the far edge (rounding can dip below 0)
  const open = 0.12 + 0.5 * Math.pow(g, 0.8);
  clothBunch[i] = x * CLOTH * open;
  clothBunch[i + 1] = -g * CLOTH * 0.8;
  clothBunch[i + 2] = 0.014 * Math.sin(x * Math.PI * 4) * g + 0.02 * g * g;
}
const clothTex = (() => {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  // lace: a scalloped edge with little eyelets; outside it transparent (alphaTest cuts it)
  const inset = 14, n = 18, step = (S - 2 * inset) / n;
  g.fillStyle = '#faf7f2';
  g.beginPath();
  g.rect(inset, inset, S - 2 * inset, S - 2 * inset);
  g.fill();
  for (let k = 0; k < n; k++) for (const [cx, cy] of [
    [inset + step * (k + 0.5), inset], [inset + step * (k + 0.5), S - inset], [inset, inset + step * (k + 0.5)], [S - inset, inset + step * (k + 0.5)]]) {
    g.beginPath(); g.arc(cx, cy, step * 0.55, 0, Math.PI * 2); g.fill();
  }
  // eyelets punched through the lace band
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < n; k++) for (const [cx, cy] of [
    [inset + step * (k + 0.5), inset + 2], [inset + step * (k + 0.5), S - inset - 2], [inset + 2, inset + step * (k + 0.5)], [S - inset - 2, inset + step * (k + 0.5)]]) {
    g.beginPath(); g.arc(cx, cy, 2.6, 0, Math.PI * 2); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  // a faint weave
  g.globalAlpha = 0.03; g.fillStyle = '#000';
  for (let k = inset + 8; k < S - inset - 8; k += 3) { g.fillRect(k, inset + 8, 1, S - 2 * inset - 16); g.fillRect(inset + 8, k, S - 2 * inset - 16, 1); }
  g.globalAlpha = 1;
  // the orange hem: a dashed running stitch, and a small embroidered flower in one corner
  g.strokeStyle = COLORS.orange; g.lineWidth = 2.5; g.setLineDash([7, 5]);
  g.strokeRect(inset + 14, inset + 14, S - 2 * inset - 28, S - 2 * inset - 28);
  g.setLineDash([]); g.fillStyle = COLORS.orange;
  const fx = S - inset - 42, fy = S - inset - 42;
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.ellipse(fx + Math.cos(a) * 8, fy + Math.sin(a) * 8, 6, 4, a, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#f4efe8'; g.beginPath(); g.arc(fx, fy, 3.5, 0, Math.PI * 2); g.fill();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
})();
// a faint self-lit floor (like her toon shading) so it reads as white cloth in the dark, not a black hole
const cloth = new THREE.Mesh(clothGeo, new THREE.MeshStandardMaterial({ map: clothTex, roughness: 0.95, side: THREE.DoubleSide,
  emissive: '#ffffff', emissiveMap: clothTex, emissiveIntensity: 0.07, alphaTest: 0.5 }));
cloth.visible = false;
scene.add(cloth);
const _cx = new THREE.Vector3(), _cy = new THREE.Vector3(), _cz = new THREE.Vector3(), _cm = new THREE.Matrix4();
/** Place the cloth from the hand's pose (world): `flat` 0 = bunched in the fingers, 1 = spread under the palm. */
function placeCloth(wristW, dirW, upW, flat) {
  const pos = clothGeo.attributes.position;
  for (let i = 0; i < pos.array.length; i++) pos.array[i] = mix(clothBunch[i], clothFlat[i], flat);
  pos.needsUpdate = true;
  clothGeo.computeVertexNormals();
  // flat: centred on the palm, a little proud of it toward the glass; bunched: hanging from the fingertips
  _cy.copy(dirW).lerp(V(0, 1, 0), 1 - flat).normalize();               // the cloth's up: along the fingers, or up
  _cz.copy(upW).multiplyScalar(-1);                                    // its face: off the palm
  _cx.crossVectors(_cy, _cz).normalize(); _cz.crossVectors(_cx, _cy);
  cloth.quaternion.setFromRotationMatrix(_cm.makeBasis(_cx, _cy, _cz));
  cloth.position.copy(wristW).addScaledVector(dirW, mix(0.29, 0.21, flat)).addScaledVector(upW, -mix(0.02, 0.05, flat));
}

let ledPulse = 1;
const _warmEye = new THREE.Color();
function prologue(t) {
  const her = TL.read('Her'), lights = TL.read('Lights');   // the timeline's offsets and multipliers, right now
  const r = robot.root;
  // Where she stands: at the TV, then she steps aside to the left before the dive.
  const away = easeInOutCubic(ramp(t, ASIDE));
  r.position.lerpVectors(ROBOT_HOME, ROBOT_AWAY, away);
  r.position.y += Math.sin(Math.PI * away) * 0.025;
  r.rotation.set(0, Math.PI - 0.62 * away, 0);
  r.updateMatrixWorld(true);
  const inv = r.quaternion.clone().invert();
  const loc = (v) => r.worldToLocal(v.clone());
  const dirL = (v) => v.clone().normalize().applyQuaternion(inv);
  const dirW = (v) => v.clone().normalize().applyQuaternion(r.quaternion);
  const C = CLICK;

  // ---- body: powered-down slump, the power-on lock, a lean in for the wipe and the press, the bow ----
  const lean = track(t, 0.07, [[1.1, 1.3, 0, easeOutBack], [6.05, 6.75, 0.24, easeInOutSine], [8.6, C - 0.8, 0.2, easeInOutSine],
    [C + 0.2, C + 0.7, 0, easeOutBack], [C + 0.85, C + 1.1, 0.4, easeOutCubic], [C + 1.2, C + 1.45, 0, easeOutBack]]);
  const roll = track(t, 0, [[6.05, 6.75, 0.05, easeInOutSine], [C + 0.2, C + 0.7, 0, easeOutBack]]);
  // the swipes swing her shoulders a little with each stroke
  const twist = track(t, 0, [[6.05, 6.75, 0.1, easeInOutSine], ...WIPE.slice(1).map(([t1], i) => [WIPE[i][0], t1, i % 2 ? 0.1 : -0.04, easeInOutSine]),
    [8.6, C - 0.8, 0.12, easeInOutSine], [C + 0.2, C + 0.7, 0, easeOutBack]]);
  const hips = trackV(t, V(0, 0, 0), [[6.05, 6.75, V(-0.02, -0.01, 0.07), easeInOutSine], [C + 0.2, C + 0.7, V(0, 0, 0)],
    [C + 0.85, C + 1.1, V(0, 0, -0.05)], [C + 1.2, C + 1.45, V(0, 0, 0), easeOutBack]]);
  robot.body({ hips, lean: lean + her.lean, roll, twist: twist + her.twist });

  // ---- head: lifts in two servo steps; down at her hands; up at herself for the headdress; the pocket; the glass ----
  const idle = sstep(ramp(t, [2.0, 2.3]));
  const hx = track(t, 0.21, [[1.3, 1.55, 0.09], [1.7, 1.95, -0.017, easeOutBack], [2.1, 2.4, 0.12], [3.55, 3.8, -0.02],
    [5.2, 5.45, 0.2], [5.65, 5.9, 0.02], [6.75, 7.0, 0.06], [8.6, 9.2, 0.28], [C + 0.2, C + 0.5, 0.0],
    [C + 0.85, C + 1.1, 0.25, easeOutCubic], [C + 1.2, C + 1.45, 0, easeOutBack]]);
  const hy = track(t, 0, [[2.1, 2.4, -0.05], [3.55, 3.8, 0], [5.2, 5.45, -0.12], [5.65, 5.9, 0], [8.6, 9.2, -0.25], [C + 0.2, C + 0.5, 0],
    [ASIDE[0], ASIDE[1], 0.25, easeInOutCubic]]);
  // a curious tilt at her hands; she rights her head with the headdress; a happy tilt as the glass comes clean
  const hz = track(t, 0, [[2.5, 2.7, 0.08, easeOutBack], [3.55, 3.8, 0.06], [4.35, 4.7, -0.03, easeOutBack], [4.85, 5.0, 0],
    [5.9, 6.1, 0.1, easeOutBack], [6.75, 7.0, 0], [FLIP + 0.05, FLIP + 0.35, -0.09, easeOutBack], [8.6, 9.2, 0]]);
  robot.headPivot.rotation.set(hx + her.head[0] + idle * servo(t, 1, 0.009), hy + her.head[1] + idle * servo(t, 2, 0.007),
    hz + her.head[2] + idle * servo(t, 3, 0.008));

  // ---- the headdress: crooked from the start; her hands carry it straight, and it locks ----
  const straight = easeOutBack(clamp01((t - 4.35) / 0.4), 1.8);
  robot.headdress.rotation.set(0, ASKEW.yaw * (1 - straight), -ASKEW.roll * (1 - straight));
  robot.headdress.updateMatrixWorld(true);
  const [tipR, tipL] = robot.headdressEnds();

  // ---- eyes: they lead every look; cold until the last swipe clears them, then warm and a happy blink ----
  const down = track(t, 0, [[2.05, 2.15, 0.28, easeOutQuint], [3.5, 3.6, -0.04, easeOutQuint], [5.15, 5.25, 0.32, easeOutQuint],
    [5.6, 5.7, 0.04, easeOutQuint], [8.55, 8.65, 0.18, easeOutQuint], [C + 0.15, C + 0.3, 0, easeOutQuint]]);
  const right = track(t, 0, [[2.05, 2.15, 0.05, easeOutQuint], [3.5, 3.6, 0, easeOutQuint], [5.15, 5.25, 0.15, easeOutQuint],
    [5.6, 5.7, 0, easeOutQuint], [8.55, 8.65, 0.22, easeOutQuint], [C + 0.15, C + 0.3, 0, easeOutQuint]]);
  robot.look(down, right);
  const blink = Math.max(bump((t - 2.0) / 0.14), bump((t - 5.0) / 0.14), bump((t - (C + 0.35)) / 0.14), bump((t - (ASIDE[0] + 0.3)) / 0.14));
  const warm = clamp01(sstep(ramp(t, [FLIP, FLIP + 0.15])) + her.warmth);
  const happy = bump((t - FLIP - 0.12) / 0.75);
  robot.setEyes(eyeGlow(t) * her.eyeGlow, sstep(ramp(t, [0.95, 1.2])) * (1 - Math.max(blink, her.blink)));
  // cold: a dim, deep red-orange, the iris texture's detail kept but darkened; warm: bright, a light orange matching
  // the site (#e8823f) over the texture's own highlights
  if (robot.mats.iris) {
    const iris = robot.mats.iris;
    iris.emissive.set(TUNE.eyes.cold).lerp(_warmEye.set(TUNE.eyes.warm), warm);
    iris.emissiveIntensity *= mix(TUNE.eyes.coldGlow, TUNE.eyes.warmGlow, warm);
    iris.color.multiplyScalar(mix(0.35, 1, warm));
  }
  if (robot.morph && 'happy' in robot.morph.morphTargetDictionary) {
    robot.morph.morphTargetInfluences[robot.morph.morphTargetDictionary.happy] = clamp01(Math.max(happy, 0.85 * bump((t - (C + 0.9)) / 0.7)) + her.happy);
  }

  // ---- arms ----
  const button = powerButton.getWorldPosition(new THREE.Vector3()).add(V(0, 0, 0.015));   // its face
  const TIP_FIX = V(0.05, 0, -0.02);   // the curled hand puts the fingertip off the wrist's pointing line
  const tipAt = (gap) => loc(button.clone().add(TIP_FIX).addScaledVector(POINT_DIR, -(FINGER_TIP + gap)));
  const press = track(t, 0.02, [[C - 0.35, C - 0.2, 0.03, easeInQuad], [C - 0.2, C, -0.006, easeInQuad],
    [C + 0.1, C + 0.25, 0.01, easeOutBack]]);
  // the headdress: the wrist sits back from the tip along the pinching fingers
  const pinchAt = (tip, side) => tip.clone().add(V(0, 0, 0.04)).addScaledVector(TIDY_DIR[side].clone().normalize(), -PINCH_REACH);
  // the wipe: the palm on the glass (world), fingers up, the back of the hand toward her
  const palmOnGlass = (p) => loc(V(p.x, p.y - 0.1, GLASS_Z + 0.02));
  const wipeDirL = dirL(V(-0.05, 1, 0.15)), wipeUpL = dirL(V(0, 0, 1));
  const R = trackV(t, R_REST, [
    [2.1, 2.6, UP.R, easeOutCubic, V(0, 0.04, 0.1)],                    // hands up, to look at them
    [3.75, 4.2, pinchAt(tipR, 'R'), easeOutCubic, V(0, 0.05, 0.05)],     // to the headdress tips
    [4.95, 5.25, R_REST, easeInOutSine],
    [5.25, 5.55, POCKET, easeOutCubic, V(0, 0.03, 0.06)],                // into the apron pocket
    [5.68, 6.0, SHOW, easeOutCubic, V(0, 0.05, 0.05)],                   // the cloth, held up
    [6.05, 6.75, palmOnGlass(WIPE[0][1]), easeInOutSine, V(0, 0.08, 0.06)],   // the reach: her real hand enters the frame
    ...WIPE.slice(1).map(([t1, p], i) => [WIPE[i][0], t1, palmOnGlass(p), easeInOutSine, WIPE_LIFT[i + 1]]),
    [8.7, C - 0.6, tipAt(0.02), easeInOutSine, V(0, 0.05, 0.04)],           // down to the button, cloth in hand
    [C + 0.15, C + 0.55, POCKET, easeOutCubic, V(0, 0.04, 0.06)],       // tuck it away
    [C + 0.6, C + 0.85, CLASP.R, easeOutCubic],
    [ASIDE[0], ASIDE[1], R_REST, easeOutCubic],
  ]);
  if (t > 4.2 && t < 4.95) R.copy(pinchAt(tipR, 'R'));   // holding the tip while the headdress swings straight
  if (t > C - 0.6 && t < C + 0.15) R.copy(tipAt(press));    // her finger waits on the button while the camera settles
  const rDir = trackV(t, REST_DIR, [[2.1, 2.6, UP_DIR.R], [3.75, 4.2, TIDY_DIR.R], [4.95, 5.25, REST_DIR], [5.25, 5.55, POCKET_DIR],
    [5.68, 6.0, SHOW_DIR], [6.05, 6.6, wipeDirL, easeInOutCubic], [8.6, 9.6, dirL(POINT_DIR), easeInOutCubic],
    [C + 0.15, C + 0.55, POCKET_DIR], [C + 0.6, C + 0.85, CLASP_DIR.R], [ASIDE[0], ASIDE[1], REST_DIR]]);
  const rUp = trackV(t, V(0, 0, 1), [[2.1, 2.6, V(0, 0, 1)], [3.75, 4.2, TIDY_UP.R], [4.95, 5.25, V(0, 0, 1)], [5.68, 6.0, V(0, 1, -0.2)],
    [6.05, 6.6, wipeUpL, easeInOutCubic], [8.6, 9.6, V(0, 1, 0), easeInOutCubic], [C + 0.15, C + 0.55, V(0, 0, 1)]]);
  robot.reach(R.clone().add(V(...her.rightHand)));
  robot.aim(rDir, rUp.normalize(), 0.08 * Math.sin((t - 2.7) * 4) * bump((t - 2.6) / 1.0));

  const L = trackV(t, robot.left.hang, [
    [2.15, 2.65, UP.L, easeOutCubic, V(0, 0.04, 0.1)],
    [3.8, 4.25, pinchAt(tipL, 'L'), easeOutCubic, V(0, 0.05, 0.05)],
    [4.95, 5.35, robot.left.hang, easeInOutSine, V(0, 0, 0.06)],
    [C + 0.6, C + 0.85, CLASP.L, easeOutCubic],
    [ASIDE[0], ASIDE[1], robot.left.hang, easeOutCubic],
  ]);
  if (t > 4.25 && t < 4.95) L.copy(pinchAt(tipL, 'L'));
  const lDir = trackV(t, REST_DIR, [[2.15, 2.65, UP_DIR.L], [3.8, 4.25, TIDY_DIR.L], [4.95, 5.35, REST_DIR], [C + 0.6, C + 0.85, CLASP_DIR.L],
    [ASIDE[0], ASIDE[1], REST_DIR]]);
  const lUp = trackV(t, V(0, 0, 1), [[2.15, 2.65, V(0, 0, 1)], [3.8, 4.25, TIDY_UP.L], [4.95, 5.35, V(0, 0, 1)]]);
  robot.left.reach(L.clone().add(V(...her.leftHand)));
  robot.left.aim(lDir, lUp.normalize(), -0.08 * Math.sin((t - 2.75) * 4) * bump((t - 2.65) / 1.0));

  // Fingers. Hands up: a quick human wiggle, two passes thumb→pinky and back, on both hands. Headdress: thumb and
  // index pinch the tips. Pocket: a loose grab. Wipe: flat on the cloth. Button: index out, the cloth held by the
  // other three. Clasp: a soft fold.
  const wave = (j, amp) => WIGGLE.reduce((acc, t0, k) => acc + amp * bump((t - t0 - 0.03 * (k % 2 ? 4 - j : j)) / 0.15), 0);
  const pinch = track(t, 0, [[4.05, 4.25, 1, easeOutBack], [4.85, 4.95, 0]]);
  const hold = track(t, 0, [[5.5, 5.68, 1, easeOutBack], [6.35, 6.75, 0], [8.5, 8.8, 1], [C + 0.45, C + 0.6, 0]]);
  const point = track(t, 0, [[C - 1.8, C - 1.4, 1, easeOutBack], [C + 0.15, C + 0.4, 0]]);
  const fold = track(t, 0, [[C + 0.6, C + 0.85, 1], [ASIDE[0], ASIDE[0] + 0.4, 0]]);
  const open = track(t, 0, [[2.1, 2.6, 1], [3.6, 3.8, 0]]);   // fingers spread to look at them
  const flatHand = track(t, 0, [[6.35, 6.75, 1], [8.5, 8.8, 0]]);   // on the cloth: the thumb tucked in beside the fingers
  const fingers = (side) => {
    const h = side === 'R' ? hold : 0, k = side === 'R' ? point : 0;
    const per = [0, 1, 2, 3].map((i) => {
      let c = 0.25 - open * 0.13 + pinch * (i === 0 ? 0.35 : 0.7) + h * 0.55 + fold * 0.35 + wave(i + 1, 0.4);
      if (k) c = mix(c, i === 0 ? 0.02 : 0.95, k);
      return c;
    });
    return { per, thumb: 0.25 - open * 0.05 + pinch * 0.55 + h * 0.4 + (side === 'R' ? flatHand * 0.45 : 0) + fold * 0.2 - k * 0.1 + wave(0, 0.35), spread: 0.25 * open + 0.1 * (1 - pinch) * (1 - open) };
  };
  const fr = fingers('R'), fl = fingers('L');
  robot.grip(0.25, fr.spread, fr.thumb, fr.per);
  robot.left.grip(0.25, fl.spread, fl.thumb, fl.per);
  powerButton.position.z = BUTTON_Z - 0.008 * clamp01(track(t, 0, [[C - 0.1, C, 1, easeInQuad], [C + 0.1, C + 0.25, 0, easeOutBack]]));

  // The cloth: out of the pocket at 5.6, flat under her palm through the swipes, back in the pocket after the click.
  cloth.visible = t > 5.6 && t < C + 0.5;
  if (cloth.visible) {
    const hw = robot.hand.getWorldPosition(new THREE.Vector3());
    // never quite flat: a little drape keeps it reading as cloth, and it ripples as it's pushed across the glass
    const flat = (0.8 + 0.06 * Math.sin(t * 9)) * sstep(ramp(t, [6.4, 6.75])) * (1 - sstep(ramp(t, [8.5, 8.8])));
    placeCloth(hw, dirW(rDir), dirW(rUp), flat);
  }

  // ---- light ----
  handFill.intensity = lights.herFill * 0.25 * sstep(ramp(t, [2.1, 2.6])) * (1 - sstep(ramp(t, [8.0, 8.6])));
  proRim.intensity = lights.herFill * 1.4 * sstep(ramp(t, [8.6, 9.5])) * (1 - sstep(ramp(t, [ASIDE[0], ASIDE[1]])));
  // The standby LED pulses slowly; it brightens as she turns to it.
  ledPulse = (0.85 + 0.25 * Math.sin(t * (2 * Math.PI / 1.4))) * (1 + 0.6 * sstep(ramp(t, [8.6, 9.2])));
  // Toon shading: a dim floor and a cool moonlit rim in the dark; once the screen is on she's lit by it.
  const lit = sstep(ramp(t, [C + WARM + 0.3, C + WARM + 1.0]));
  robot.toon.uAmb.value = mix(TUNE.light.ambient, 0.08, lit);
  robot.toon.uRim.value = lights.herRim * mix(TUNE.light.rim, 0.9, lit);   // the screen behind the glass makes a bright halo on her silhouette
  robot.toon.uRimColor.value.set(lit > 0.5 ? '#e8eefc' : '#9fb4e0');

  // ---- camera ----
  robot.updateToon();
  // the click kicks the camera (after PRO_END the boot's placeCamera has already placed it)
  const kick = t > C ? Math.exp(-(t - C) / 0.06) * Math.cos((t - C) * 90) * 0.003 : 0;
  if (t >= PRO_END) {
    camera.position.add(V(kick, kick * 0.6, 0));
    if (camera.fov !== 35) { camera.fov = 35; camera.updateProjectionMatrix(); }
    return;
  }
  const { p, q, fov } = move(t);
  camera.position.copy(p);
  camera.quaternion.copy(q);
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

// Sound cues, in story time (sfx.js; off until the visitor turns it on).
const POWER_ON = CLICK + WARM - T.led + T.power[0];
const CUES = [[0.6, 'wake'], [1.3, 'servo'], [1.7, 'servo'], [2.1, 'servo'], ...WIGGLE.map((t) => [t, 'fine']), [3.55, 'servo'], [3.75, 'servo'],
  [4.1, 'fine'], [4.72, 'lock'], [5.2, 'servo'], [5.5, 'fine'],
  [6.05, 'servo'], ...WIPE.slice(0, 4).map(([t]) => [t, 'squeak']), [8.6, 'servo'], [CLICK, 'click'], [POWER_ON, 'degauss'],
  [CLICK + 0.85, 'servo'], [ASIDE[0], 'servo']];
const sfx = opts.sfx ?? createSfx({ base: `${opts.assetBase ?? ''}/prologue/sfx/` });
const soundBtn = el('button', 'prologue-sound'); soundBtn.type = 'button';
const showSound = () => { soundBtn.textContent = `SOUND: ${sfx.on ? 'ON' : 'OFF'}`; };
soundBtn.addEventListener('click', () => { sfx.setOn(!sfx.on); showSound(); });
showSound();
let prevStory = 0;

const flash = el('div', 'prologue-flash');
function master(time) {
  const t = story(time);
  sfx.cue(prevStory, t, CUES);
  prevStory = t;
  const tb = t - CLICK - WARM + T.led;
  ledForce = t > CLICK;
  apply(tb);
  prologue(t);
  if (t < CLICK + WARM) uniforms.uRefl.value = 1;   // the glass stays a mirror until the tube warms up
  if (t < CLICK) {
    // Standby: only her eyes, the moon and the red LED. Her reflection is dim while we're in her eyes.
    ledMat.emissiveIntensity *= ledPulse; ledLight.intensity *= ledPulse;
    uniforms.uRefl.value = 1;
  }
  if (t < PRO_END) {
    key.intensity = 0; rim.intensity = 0; scene.environmentIntensity = 0;
    bloom.strength = Math.max(bloom.strength * 0.7, P.bloom * 0.6);
  }
  // Room light waits until she has stepped out of the boot's shot (it blows out her hair).
  if (t < ASIDE[1]) { const k = sstep(ramp(t, [ASIDE[1] - 1.0, ASIDE[1]])); key.intensity *= k; rim.intensity *= k; }
  // Impact frame: two inverted frames on the click.
  flash.style.opacity = t >= CLICK && t < CLICK + 0.035 ? 1 : 0;
  const L = TL.read('Lights');
  key.intensity *= L.room; rim.intensity *= L.room; scene.environmentIntensity *= L.room;
  screenLight.intensity *= L.screen; bloom.strength *= L.bloom; uniforms.uRefl.value *= L.reflection;
}

/** The timeline's camera on top of whatever the script placed: a nudge and a turn, then a blend (takeover) to its
 *  own keyframed position, target and fov. */
const _camQ = new THREE.Quaternion(), _camM = new THREE.Matrix4();
function timelineCamera() {
  const c = TL.read('Camera');
  camera.position.add(V(...c.nudge));
  camera.rotateX(c.turn[0]); camera.rotateY(c.turn[1]); camera.rotateZ(c.turn[2]);
  if (c.takeover > 0) {
    const p = V(...c.position);
    _camQ.setFromRotationMatrix(_camM.lookAt(p, V(...c.target), camera.up));
    camera.position.lerp(p, c.takeover);
    camera.quaternion.slerp(_camQ, c.takeover);
    camera.fov = mix(camera.fov, c.fov, c.takeover);
  }
  camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------------ *
 * Loop, controls
 * ------------------------------------------------------------------ */
let t0 = performance.now(), tPaused = 0;
// The clock. On the tuning page (opts.studio) Theatre's playhead is the clock: its timeline scrubs and plays the
// scene. Elsewhere the wall clock drives the playhead, so keyframed values play back. Either way the scene runs
// `hold` (Retime) seconds behind the playhead.
const seq = TL.sheet.sequence;
const studioClock = !!opts.studio;
let seqPlaying = false;
const seekTo = (pos) => { P.playing = false; tPaused = pos; if (studioClock) { seq.pause(); seqPlaying = false; seq.position = pos; } };
function togglePlay() {
  if (studioClock) {
    if (seqPlaying) { seq.pause(); seqPlaying = false; return; }
    seqPlaying = true;
    seq.play().then(() => { seqPlaying = false; });
    return;
  }
  P.playing = !P.playing;
  if (P.playing) t0 = performance.now() - (P.time / P.speed) * 1000; else tPaused = P.time;
}
function restart() {
  if (studioClock) { seq.position = 0; if (!seqPlaying) togglePlay(); return; }
  t0 = performance.now(); P.playing = true;
}
/** Where the playhead is when the scene reaches story time `s` (the holds push it later). */
function positionAt(s) {
  const keep = seq.position;
  let pos = s;
  for (; pos < s + 60; pos += 0.02) { seq.position = pos; if (story(pos - TL.read('Retime').hold) >= s) break; }
  seq.position = keep;
  return pos;
}
const HANDOFF = CLICK + WARM - T.led + (opts.handoffAt ?? T.dive[1] - 0.15);   // story time the site takes over: the screen fills the view
// The story beats, in story time (for the tuning page's readout; PROLOGUE.md has the script).
const BEATS = [[0, 'dark glass'], [0.6, 'eyes wake'], [2.1, 'hands up'], [2.75, 'finger wiggle'], [3.75, 'headdress fix'],
  [5.25, 'apron pocket'], [5.68, 'handkerchief shown'], [6.05, 'reach: her hand enters'],
  [WIPE[0][0], 'wipe 1'], [WIPE[1][0], 'wipe 2'], [WIPE[2][0], 'wipe 3'], [WIPE[3][0], 'wipe 4: eyes go warm'],
  [AWAY.t0, 'pull-back'], [CLICK, 'click'], [CLICK + WARM, 'TV warms up'], [CLICK + 0.85, 'bow'], [ASIDE[0], 'steps aside'],
  [CLICK + WARM - T.led + T.wordmark[0], 'bentOS boot screen'], [CLICK + WARM - T.led + T.dive[0], 'dive into the screen'],
  [HANDOFF, 'board takes over (site)'], [CLICK + WARM - T.led + T.merge[0], 'pixels → cards (tuning page only)']];

let handedOff = false;
function handoff() {
  if (handedOff) return;
  handedOff = true;
  opts.onHandoff?.();
}
const listeners = [];
const listen = (target, type, fn) => { target.addEventListener(type, fn); listeners.push([target, type, fn]); };
if (opts.gui) {
  const { default: GUI } = await import('three/addons/libs/lil-gui.module.min.js');
  const gui = new GUI({ title: 'bentOS prologue' });
  made.push(gui.domElement);   // removed with everything else on dispose
  if (studioClock) gui.close();   // the studio has the timeline; this keeps the render settings
  gui.add(P, 'time', 0, TOTAL + 0.5, 0.01).listen().onChange((v) => seekTo(v));
  if (!studioClock) gui.add(P, 'playing').listen().onChange((v) => { if (v) t0 = performance.now() - (P.time / P.speed) * 1000; });
  gui.add(P, 'speed', 0.25, 2, 0.05);
  gui.add(P, 'palette', ['category', 'mono', 'rgb']);
  gui.add(P, 'ppc', [4, 6, 8, 12, 16]).name('pixels / cell').onChange(() => { textSig = ''; });
  gui.add(P, 'maskGain', 1, 6, 0.1).name('mask gain');
  gui.add(P, 'bloom', 0, 2.5, 0.05);
  gui.add(P, 'darkGlass').name('dark glass');
  gui.add(P, 'dim').name('spotlight dim');
  gui.add(P, 'replay');
  listen(window, 'keydown', (e) => {
    if (e.target.closest?.('input, textarea, [contenteditable]')) return;   // typing in the studio's fields
    if (e.code === 'Space') { e.preventDefault(); if (studioClock) togglePlay(); else restart(); }
    if (e.key === 'p') togglePlay();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') seekTo(Math.max(0, (studioClock ? seq.position : P.time) + (e.key === 'ArrowRight' ? 0.1 : -0.1)));
  });
}
listen(window, 'resize', () => {
  renderer.setSize(vpW(), vpH()); composer.setSize(vpW(), vpH());
  camera.aspect = vpW() / vpH(); camera.updateProjectionMatrix();
  reflector.getRenderTarget().setSize(...reflSize());
});
// probe: after the first frame, write key world positions into the page (read with --dump-dom).
if (opts.probe) setTimeout(() => {
  const w = (o) => o.getWorldPosition(new THREE.Vector3()).toArray().map((x) => +x.toFixed(3));
  const b = robot.bones;
  const out = { cam: camera.position.toArray().map((x) => +x.toFixed(3)), button: w(powerButton), cloth: w(cloth), clothOn: cloth.visible };
  for (const n of ['LeftEye', 'RightEye', 'RightHandIndex1', 'Head', 'Neck', 'Spine2', 'Hips', 'RightArm', 'RightForeArm', 'RightHand', 'RightHandMiddle3', 'LeftArm', 'LeftForeArm', 'LeftHand', 'LeftFoot']) out[n] = w(b[n]);
  const pre = el('pre', 'probe'); pre.id = 'probe'; pre.textContent = JSON.stringify(out);
}, 500);
// startAt opens paused at that moment (for screenshots).
if (opts.startAt != null) seekTo(opts.startAt);
// debug: window.prologueSeek(t) pauses at story-clock time t (frame-by-frame recording); returns the length.
if (opts.debug) Object.assign(window, { prologueSeek: (t) => { seekTo(t); return TOTAL; }, prologueTimes: { CLICK, WARM, TOTAL, SLOW_EXTRA, HANDOFF, story: (t) => story(t), positionAt, BEATS },
  prologueNow: () => (studioClock ? seq.position : P.time), prologueScene: () => ({ time: P.time, story: story(P.time) }) });

renderer.setAnimationLoop(() => {
  let pos;
  if (studioClock) pos = seq.position;
  else { pos = P.playing ? ((performance.now() - t0) / 1000) * P.speed : tPaused; seq.position = pos; }
  P.time = Math.min(Math.max(0, pos - TL.read('Retime').hold), TOTAL + 0.5);
  master(P.time);
  timelineCamera();
  if (opts.onHandoff && story(P.time) >= HANDOFF) handoff();
  if (uniforms.uRefl.value > 0.001) renderReflection();
  composer.render();
});

// Settings edited in the studio (or keyframed) apply live; the read-once ones ask the page to restart the scene.
for (const [group, key] of Object.entries(SETTINGS)) {
  TL.onChange(key, (vals) => {
    const changed = Object.keys(vals).filter((k) => JSON.stringify(vals[k]) !== JSON.stringify(TUNE[group][k]));
    if (!changed.length) return;
    if (changed.some((k) => READ_ONCE.has(group) || READ_ONCE.has(`${group}.${k}`))) { Object.assign(TUNE[group], vals); opts.onRestartNeeded?.(); }
    else setTuning({ [group]: vals });
  });
}

/** Apply edited values live (see TUNE). The click time and the glass shot need a restart to take effect. */
function setTuning(partial) {
  mergeDeep(TUNE, partial);
  const { camera: c, poses: p } = TUNE;
  GLASS.p.set(...c.glass); GLASS.l.copy(GLASS.p).add(V(0, 0, -1)); GLASS.fov = c.fov;
  AWAY.path.points[1].set(...c.via1); AWAY.path.points[2].set(...c.via2); AWAY.path.updateArcLengths();
  UP.R.set(...p.handsUp); UP.L.copy(mirrorX(p.handsUp));
  SHOW.set(...p.showCloth); POCKET.set(...p.pocket);
  CLASP.R.set(...p.bow); CLASP.L.copy(mirrorX(p.bow));
  P.bloom = TUNE.light.bloom;
}

return {
  sfx,
  timeline: TL,
  /** Jump straight to the handoff (the visitor skipped). */
  skip: handoff,
  dispose() {
    renderer.setAnimationLoop(null);
    for (const [target, type, fn] of listeners) target.removeEventListener(type, fn);
    for (const node of made) node.remove();
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  },
};
}

/** Copy b's leaves onto a (arrays and values replace; objects merge). */
function mergeDeep(a, b) {
  for (const [k, v] of Object.entries(b ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object') mergeDeep(a[k], v);
    else a[k] = v;
  }
  return a;
}
