/*
 * The chalk title: "ANonABento presents" written on the dark CRT glass, wiped off by her cloth.
 * Plain JS. A CanvasTexture plane just in front of the glass; the cloth's world position stamps an erase mask.
 * Swipes 1-2 smudge (soft brush), swipes 3-4 erase fully; it's gone by the hard cut either way.
 * Assumes the monitor sits at the world origin (the glass faces +z).
 */
export const CHALK = {
  text: ['ANonABento', 'presents'],
  center: [0.085, 0.12],   // world x, y on the glass (the glass camera's centre line)
  maxH: 0.10, maxW: 0.36,  // the text box
  halfH: 0.191,            // visible half-height at the glass (vFOV 46, ~0.45 away)
  plane: [0.44, 0.24],     // the textured plane (world), centred on `center`
  px: 1100,                // canvas px per world unit
  brush: 0.1,              // stamp radius (the cloth is 0.2 across)
  soft: 0.35,              // erase alpha of swipes 1-2
  wipe: [6.75, 7.55, 8.5], // soft from, full from, stop
  fadeIn: [0.8, 1.8], gone: 8.55, opacity: 0.62,
};

/** Stamp alpha for the cloth at time t (0 = not erasing). */
export function stampAlpha(t) {
  if (t < CHALK.wipe[0] || t > CHALK.wipe[2]) return 0;
  return t < CHALK.wipe[1] ? CHALK.soft : 1;
}

/** Text layout for a viewport aspect: one line when wide, two when narrow. Sizes in world units. */
export function chalkBox(aspect) {
  const visW = 2 * CHALK.halfH * aspect;
  const w = Math.min(CHALK.maxW, 0.8 * visW);
  const lines = aspect < 1 ? CHALK.text : [CHALK.text.join(' ')];
  const h = Math.min(CHALK.maxH, lines.length === 1 ? w * 0.16 : w * 0.5);
  return { w, h, lines, x0: CHALK.center[0] - w / 2, x1: CHALK.center[0] + w / 2,
    y0: CHALK.center[1] - h / 2, y1: CHALK.center[1] + h / 2 };
}

/** Mean erased fraction (0..1) over a world rect, from stamps {x, y, r, a}. Soft stamps don't stack (a smudge is a
 *  smudge however often it's rubbed); a full stamp clears. Same rule as compose(). Pure, for tests. */
export function maskCoverage(rect, stamps, n = 48) {
  let sum = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = rect.x0 + (rect.x1 - rect.x0) * (i + 0.5) / n, y = rect.y0 + (rect.y1 - rect.y0) * (j + 0.5) / n;
    let e = 0;
    for (const s of stamps) if ((x - s.x) ** 2 + (y - s.y) ** 2 <= s.r * s.r) e = Math.max(e, s.a);
    sum += e;
  }
  return sum / (n * n);
}

/** Stamps along a segment, spaced a third of the brush. */
export function stampSegment(a, b, alpha, t, r = CHALK.brush) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / (r / 3)));
  const out = [];
  for (let i = 1; i <= k; i++) out.push({ x: a[0] + (b[0] - a[0]) * i / k, y: a[1] + (b[1] - a[1]) * i / k, r, a: alpha, t });
  return out;
}

/** Load the chalk face (Cabin Sketch, OFL) from Google Fonts; resolves to a CSS family, 'cursive' on any failure. */
export async function loadChalkFont(timeoutMs = 4000) {
  const attempt = (async () => {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@700&display=swap')).text();
    const url = css.match(/url\((https:[^)]+)\)/)?.[1];
    if (!url) throw new Error('no font url');
    const face = new FontFace('Cabin Sketch', `url(${url})`, { weight: '700' });
    await face.load();
    document.fonts.add(face);
    return '"Cabin Sketch"';
  })();
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), timeoutMs); });
  try { return await Promise.race([attempt, timeout]); }
  catch (e) { console.warn(`[prologue] chalk font failed (${e?.message}); using cursive`); return 'cursive'; }
  finally { clearTimeout(timer); }
}

const sstep = (x) => x * x * (3 - 2 * x);
const ramp = (t, [a, b]) => Math.min(1, Math.max(0, (t - a) / (b - a)));

/** The plane, its texture and the per-frame update. */
export function createChalk(THREE, { font = 'cursive', z = 0, aspect = 16 / 9 } = {}) {
  const [PW, PH] = CHALK.plane, [CX, CY] = CHALK.center;
  const cw = Math.round(PW * CHALK.px), ch = Math.round(PH * CHALK.px);
  const mk = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
  const textC = mk(), outC = mk(), softC = mk();
  const tex = new THREE.CanvasTexture(outC);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat);
  mesh.position.set(CX, CY, z);
  mesh.renderOrder = 3;
  mesh.visible = false;
  const toPx = (x, y) => [(x - (CX - PW / 2)) / PW * cw, (CY + PH / 2 - y) / PH * ch];
  let stamps = [], last = null, lastT = -1, box = null;

  function drawText(blur) {
    const g = textC.getContext('2d');
    g.clearRect(0, 0, cw, ch);
    g.filter = blur ? 'blur(2.5px)' : 'none';
    g.fillStyle = '#f4f1e8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lh = box.h / box.lines.length;
    let size = lh * 0.82 * CHALK.px;
    g.font = `700 ${size}px ${font}, cursive`;
    const widest = Math.max(...box.lines.map((l) => g.measureText(l).width));
    if (widest > box.w * CHALK.px) { size *= box.w * CHALK.px / widest; g.font = `700 ${size}px ${font}, cursive`; }
    box.lines.forEach((l, i) => { const [px, py] = toPx(CX, box.y1 - lh * (i + 0.5)); g.fillText(l, px, py); });
    g.filter = 'none';
    // chalk grain: knock out specks (seeded, so it's the same every redraw)
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 0.5;
    let s = 7;
    for (let i = 0; i < 2600; i++) {
      s = (s * 16807) % 2147483647; const x = (s / 2147483647) * cw;
      s = (s * 16807) % 2147483647; const y = (s / 2147483647) * ch;
      g.fillRect(x, y, 1.6, 1.6);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  function dab(g, s) {
    const [px, py] = toPx(s.x, s.y), r = s.r * CHALK.px;
    const grad = g.createRadialGradient(px, py, r * 0.6, px, py, r);
    grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
  }

  function compose() {
    // soft stamps: their union, knocked out at CHALK.soft; full stamps: knocked out outright
    const sg = softC.getContext('2d');
    sg.clearRect(0, 0, cw, ch);
    for (const s of stamps) if (s.a < 1) dab(sg, s);
    const g = outC.getContext('2d');
    g.clearRect(0, 0, cw, ch);
    g.drawImage(textC, 0, 0);
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = CHALK.soft; g.drawImage(softC, 0, 0); g.globalAlpha = 1;
    for (const s of stamps) if (s.a >= 1) dab(g, s);
    g.globalCompositeOperation = 'source-over';
    tex.needsUpdate = true;
  }

  function rebuild() { drawText(stamps.some((s) => s.a < 1)); compose(); }

  function layout(a) { box = chalkBox(a); rebuild(); }
  layout(aspect);

  /** t: prologue time. clothPos: the cloth's world position (Vector3) or null when it's away. */
  function update(t, clothPos) {
    if (t < lastT - 1e-3) {               // scrubbed back: keep only the stamps made before t
      const n = stamps.length;
      stamps = stamps.filter((s) => s.t <= t);
      last = null;
      if (stamps.length !== n) rebuild();
    }
    lastT = t;
    const alpha = stampAlpha(t);
    if (alpha > 0 && clothPos) {
      const p = [clothPos.x, clothPos.y];
      const hadSoft = stamps.some((s) => s.a < 1);
      stamps.push(...stampSegment(last ?? p, p, alpha, t));
      last = p;
      if (!hadSoft && alpha < 1) drawText(true);  // the first smudge blurs the letters
      compose();
    } else last = null;
    mat.opacity = CHALK.opacity * sstep(ramp(t, CHALK.fadeIn)) * (t < CHALK.gone ? 1 : 0);
    mesh.visible = mat.opacity > 0.001;
  }

  function dispose() { tex.dispose(); mat.dispose(); mesh.geometry.dispose(); }
  return { mesh, update, layout, dispose };
}
