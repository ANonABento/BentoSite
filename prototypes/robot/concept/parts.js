// Shared drawing code for the B-01 concept sheets (sheet.html, options.html).

const NS = 'http://www.w3.org/2000/svg';
const sheet = document.getElementById('sheet');
const C = { k: '#0e0b0a', w: '#f2ece2', o: '#e8823f', g: '#5d5f63', ink: '#2a2420', line: '#3b3430' };

function el(tag, attrs = {}, parent = sheet) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent.appendChild(e);
  return e;
}
function g(parent = sheet, attrs = {}) { return el('g', attrs, parent); }
function txt(parent, x, y, s, attrs = {}) { const t = el('text', { x, y, ...attrs }, parent); t.textContent = s; return t; }

// ---------- defs: toon fills + glow ----------
const defs = el('defs');
defs.innerHTML = `
  <linearGradient id="wT" x1="0" x2="1"><stop offset="0" stop-color="#fbf7f0"/><stop offset=".58" stop-color="#f2ece2"/><stop offset=".58" stop-color="#d8cfc1"/><stop offset="1" stop-color="#cbc1b2"/></linearGradient>
  <linearGradient id="kT" x1="0" x2="1"><stop offset="0" stop-color="#2b2522"/><stop offset=".5" stop-color="#16110f"/><stop offset=".5" stop-color="#0e0b0a"/><stop offset="1" stop-color="#070505"/></linearGradient>
  <linearGradient id="gT" x1="0" x2="1"><stop offset="0" stop-color="#8b8e93"/><stop offset=".55" stop-color="#5d5f63"/><stop offset=".55" stop-color="#46484c"/><stop offset="1" stop-color="#3a3b3f"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2422"/><stop offset=".35" stop-color="#0e0b0a"/><stop offset="1" stop-color="#050404"/></linearGradient>
  <radialGradient id="eyeGlow"><stop offset="0" stop-color="#ffd9b0" stop-opacity="1"/><stop offset=".35" stop-color="#e8823f" stop-opacity=".9"/><stop offset="1" stop-color="#e8823f" stop-opacity="0"/></radialGradient>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="2.2" result="b1"/><feGaussianBlur stdDeviation="7" result="b2" in="SourceGraphic"/>
    <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="bigGlow" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur stdDeviation="6" result="b1"/><feGaussianBlur stdDeviation="22" result="b2" in="SourceGraphic"/>
    <feMerge><feMergeNode in="b2"/><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <radialGradient id="chrome" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#c9ccd1"/><stop offset=".6" stop-color="#5d5f63"/><stop offset="1" stop-color="#232427"/></radialGradient>
  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#d6cec1" stroke-width="1"/></pattern>
`;

// Draw a part for the right half (x >= 0) and its mirror.
function sym(parent, fn) { fn(g(parent)); fn(g(parent, { transform: 'scale(-1,1)' })); }
const S = (cls) => ({
  w: { fill: 'url(#wT)', stroke: C.line, 'stroke-width': 1.1, 'stroke-linejoin': 'round' },
  k: { fill: 'url(#kT)', stroke: '#000', 'stroke-width': 1.1, 'stroke-linejoin': 'round' },
  g: { fill: 'url(#gT)', stroke: '#1d1d1f', 'stroke-width': 1, 'stroke-linejoin': 'round' },
  glass: { fill: 'url(#glass)', stroke: '#000', 'stroke-width': 1.1 },
  pl: { fill: 'none', stroke: '#6f655c', 'stroke-width': .7 },       // panel line on ceramic
  plk: { fill: 'none', stroke: '#3c3532', 'stroke-width': .7 },      // panel line on lacquer
  neon: { fill: 'none', stroke: C.o, 'stroke-width': 1.6, filter: 'url(#glow)', 'stroke-linecap': 'round' },
  neonF: { fill: C.o, filter: 'url(#glow)' },
}[cls]);
const P = (parent, d, cls, extra = {}) => el('path', { d, ...S(cls), ...extra }, parent);
function symShape(parent, d, cls, extra = {}) {
  const sw = (S(cls)['stroke-width'] || 1) * 2;
  P(g(parent, { transform: 'scale(-1,1)' }), d, cls, { ...extra, 'stroke-width': sw });
  P(parent, d, cls, { ...extra, 'stroke-width': sw });
  // then both fills, overlapping a hair across x=0, so neither outline nor antialiasing leaves a seam
  P(g(parent, { transform: 'scale(-1,1) translate(-.5,0)' }), d, cls, { ...extra, stroke: 'none' });
  P(g(parent, { transform: 'translate(-.5,0)' }), d, cls, { ...extra, stroke: 'none' });
}
// scalloped frill on an arc around (0, cy): n bumps per half
function frillPath(cy, r0, r1, n, a0 = -90, span = 64) {
  const pt = (a, r) => [Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r];
  const step = span / n; let [x, y] = pt(a0, r0); let d = `M${x} ${y}`;
  [x, y] = pt(a0, r1); d += ` L${x} ${y}`;
  for (let i = 0; i < n; i++) {
    const [cx, cyy] = pt(a0 + (i + .5) * step, r1 + 7 - i * .8), [ex, ey] = pt(a0 + (i + 1) * step, r1 - i * .8);
    d += ` Q${cx} ${cyy} ${ex} ${ey}`;
  }
  [x, y] = pt(a0 + span, r0); d += ` L${x} ${y}`;
  for (let a = a0 + span; a >= a0; a -= 4) { [x, y] = pt(a, r0); d += ` L${x} ${y}`; }
  return d + ' Z';
}
function frillLines(h, cy, r0, r1, n, a0 = -90, span = 64) {
  const step = span / n;
  for (let i = 1; i < n; i++) {
    const a = (a0 + i * step) * Math.PI / 180;
    P(h, `M${Math.cos(a) * (r0 + 1)} ${cy + Math.sin(a) * (r0 + 1)} L${Math.cos(a) * (r1 - 1 - i * .8)} ${cy + Math.sin(a) * (r1 - 1 - i * .8)}`, 'pl');
  }
}

// Concept sheet v2 drawing parts: porcelain doll face, hime-cut glossy hair,
// aperture-iris anime eyes. Loaded by sheet.html after the shared helpers.

// ======================================================================
// HEAD (front). Crown of hair y≈-4, chin y=96, centre x=0. No mouth, no nose.
// expr:  open | blink | happy | focus | off | boot
// eyes:  aperture | almond | pill | ring | tareme
// hair:  hime | bob | odango | twintails | none
// marks: blush | seams | facet | clean
// ======================================================================
const EYE = {
  // socket outline, lid-liner plate, liner flick (right half: inner corner x≈3, outer x≈25)
  aperture: { sock: 'M3 54 Q13 46 25 51.5 L24.4 62 Q14 70.5 5 64.5 Z', lid: 'M1.5 53.5 Q13 44.5 26 50.2 L26.6 47.8 Q13 41.8 .8 51.4 Z', flick: 'M25.6 49.4 L30 46.4 L27.2 51 Z' },
  almond: { sock: 'M2.5 56 Q12 46 26 50 Q24 62 13 65.5 Q5 64.5 2.5 56 Z', lid: 'M1.4 55.4 Q12 44 27 49.2 L27.6 46.8 Q12 41.6 .6 53.4 Z', flick: 'M26.4 48 L31.4 44.4 L28.6 49.6 Z' },
  pill: { sock: 'M4 50.5 L23.5 48 Q27 48 27 52 L26.6 62 Q26.4 65.5 23 66 L6 67.5 Q2.4 67.6 2.6 64 L2.8 54 Q2.8 50.8 4 50.5 Z', lid: null, flick: null },
  ring: { sock: 'M14 48 A10.2 10.2 0 1 1 13.99 48 Z', lid: 'M3 53 Q14 41.5 25.5 52 L26 49.6 Q14 39 2.4 50.6 Z', flick: null },
  tareme: { sock: 'M3 51.5 Q14 47 25 54.5 L23.6 63.4 Q14 68.6 4.4 62 Z', lid: 'M1.6 51 Q14 44.4 26.4 53.6 L27 51.2 Q14 41.6 1 48.8 Z', flick: 'M26 53 L29.8 56.6 L25.6 55.8 Z' },
};
function eye(h, expr, lit, style = 'aperture') {
  const E = EYE[style], cx = 14, cy = 58.5;
  if (expr === 'blink') {
    P(h, 'M3 58 Q14 63.5 25 56.5', '', { fill: 'none', stroke: C.k, 'stroke-width': 2.6, 'stroke-linecap': 'round' });
    P(h, 'M6 59.6 Q14 63 22 58.6', '', { fill: 'none', stroke: C.o, 'stroke-width': .8, opacity: .7, filter: 'url(#glow)' });
    return;
  }
  if (expr === 'happy') {
    P(h, 'M4 61 Q14 49 24 60', '', { fill: 'none', stroke: C.o, 'stroke-width': 2.6, 'stroke-linecap': 'round', filter: 'url(#glow)' });
    P(h, 'M4 61 Q14 49 24 60', '', { fill: 'none', stroke: '#ffe4c4', 'stroke-width': .8, 'stroke-linecap': 'round' });
    return;
  }
  P(h, E.sock, 'glass');
  const glowOn = lit && expr !== 'off';
  if (glowOn) el('circle', { cx, cy, r: 12, fill: 'url(#eyeGlow)', opacity: .45 }, h);
  const hot = (a) => ({ ...a, fill: glowOn ? C.o : '#3a2215', ...(glowOn ? { filter: 'url(#glow)' } : {}) });
  if (expr === 'boot') {
    el('circle', { cx, cy, r: 6, fill: 'none', stroke: C.o, 'stroke-width': 1.2, filter: 'url(#glow)' }, h);
    el('circle', { cx, cy, r: 1.3, fill: C.o, filter: 'url(#glow)' }, h);
  } else if (style === 'aperture' || style === 'tareme') {
    el('circle', hot({ cx, cy, r: 6.4 }), h);
    if (style === 'aperture') for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, r0 = 2.5, r1 = 5.4;
      P(h, `M${cx + Math.cos(a) * r0} ${cy + Math.sin(a) * r0} L${cx + Math.cos(a + .55) * r1} ${cy + Math.sin(a + .55) * r1}`, '', { stroke: '#a24c1c', 'stroke-width': .55 });
    } else el('circle', { cx, cy, r: 4.4, fill: 'none', stroke: '#ffcf9e', 'stroke-width': .5, opacity: .7 }, h);
    el('circle', { cx, cy, r: 2.5, fill: '#1a0d07' }, h);
  } else if (style === 'almond') {
    // solid glowing almond with a vertical slit pupil
    P(h, 'M5 56.4 Q12 49 23.4 51.6 Q22.4 60.6 13 63 Q6.6 62.4 5 56.4 Z', '', hot({}));
    P(h, 'M14.2 51.6 Q12.6 57 14.2 62.4 Q15.8 57 14.2 51.6 Z', '', { fill: '#1a0d07' });
  } else if (style === 'pill') {
    // screen eye: glowing capsule with a pixel-row pupil
    P(h, 'M7 55 L21 53.4 Q24 53.4 24 56.6 L23.8 59.8 Q23.6 63 20.6 63.2 L7.4 64 Q5 64 5 61.4 L5 57.6 Q5 55.2 7 55 Z', '', hot({}));
    for (let i = 0; i < 3; i++) P(h, `M${8 + i * 0} ${57 + i * 2.2} L${21.5} ${56.2 + i * 2.2}`, '', { stroke: '#a24c1c', 'stroke-width': .45, opacity: .8 });
    P(h, 'M13 56 H16.6 V61.4 H13 Z', '', { fill: '#1a0d07' });
  } else if (style === 'ring') {
    el('circle', { cx, cy, r: 6.4, fill: 'none', ...hot({}), fill: 'none', stroke: glowOn ? C.o : '#3a2215', 'stroke-width': 2.4 }, h);
    el('circle', hot({ cx, cy, r: 1.8 }), h);
  }
  if (expr !== 'off' && expr !== 'boot') {
    el('circle', { cx: 11.2, cy: 55.6, r: 1.6, fill: '#fff' }, h);
    el('circle', { cx: 16.8, cy: 61.6, r: .75, fill: '#fff', opacity: .85 }, h);
  }
  if (expr === 'focus') P(h, 'M2 53 Q13 44 27 50 L26.6 57 Q14 54 2.4 58.4 Z', '', { fill: '#2b2523', stroke: '#000', 'stroke-width': .5 });
  if (E.lid) P(h, E.lid, 'k', { stroke: 'none' });
  if (E.flick) P(h, E.flick, 'k', { stroke: 'none' });
}

const HAIR = {
  // back: drawn behind the face; side: locks in front of the face edge; bangs: fringe
  hime: {
    back: 'M0 -4 C30 -4 47 16 47 46 L49 150 Q40 156 32 150 L30 104 Q16 98 0 100 Z',
    side: 'M31 30 Q37 26 42 30 L43.5 90 L33.5 92 Q31.5 60 31 30 Z', sideLine: 'M37 34 L38.2 88',
  },
  bob: {
    back: 'M0 -4 C30 -4 48 16 48 46 Q50 76 44 92 Q36 98 28 90 L0 92 Z',
    side: 'M31 30 Q40 26 45 38 Q48 66 42 90 L37 94 L32 86 Q33 58 31 30 Z', sideLine: 'M39 34 Q42 62 38 88',
  },
  odango: {
    back: 'M0 -4 C30 -4 47 16 47 46 Q48 70 44 84 L36 84 L0 88 Z',
    side: 'M31 30 Q37 27 41 32 L40 96 Q38 102 35 96 Q33 60 31 30 Z', sideLine: 'M36.4 36 L37 94',
    buns: true,
  },
  twintails: {
    back: 'M0 -4 C30 -4 47 16 47 46 Q48 70 44 84 L36 84 L0 88 Z',
    side: 'M31 30 Q37 27 41 32 L41 78 L33 82 Q32 56 31 30 Z', sideLine: 'M36.4 36 L37 76',
    tails: true,
  },
};
const BANGS = 'M0 -2 C26 -2 41 14 41 34 L40 44 L32 41.5 L26 45 L19 42 L12 45.5 L6 42.5 L0 45 Z';

function headFront(p, { lit = true, expr = 'open', hair = 'hime', eyes = 'aperture', marks = 'blush' } = {}) {
  if (hair === true) hair = 'hime';
  const H = HAIR[hair];
  if (H && H.tails) sym(p, h => {
    P(h, 'M36 6 Q64 16 64 66 Q64 118 54 166 Q46 174 40 164 Q50 116 48 70 Q46 34 32 18 Z', 'k');
    P(h, 'M44 30 Q56 70 50 158', 'plk');
    P(h, 'M44 70 Q56 66 62 74', '', { fill: 'none', stroke: '#8a8079', 'stroke-width': 2, opacity: .5, 'stroke-linecap': 'round' });
  });
  if (H) symShape(p, H.back, 'k');
  if (H && H.tails) sym(p, h => {                                        // tie: chrome ring + small ceramic bow
    ball(h, 42, 14, 5.4, lit);
    P(h, 'M44 8 Q56 0 58 10 Q52 16 45 14 Z', 'w');
  });
  if (H && H.buns) sym(p, h => {
    el('circle', { cx: 37, cy: 2, r: 14, ...S('k') }, h);
    P(h, 'M27 -4 Q37 -14 48 -2', 'plk');
    P(h, 'M29 -6 Q36 -12 44 -8', '', { fill: 'none', stroke: '#8a8079', 'stroke-width': 2, opacity: .55, 'stroke-linecap': 'round' });
    ball(h, 46, -8, 4.6, lit);
  });
  P(p, 'M-7 88 H7 V116 H-7 Z', 'g');
  for (let i = 0; i < 4; i++) P(p, `M-7 ${98 + i * 4.5} H7`, '', { stroke: '#1d1d1f', 'stroke-width': .8 });
  // headdress: scalloped ceramic frill on a band, bento-grid pin
  symShape(p, frillPath(38, 36, 50, 4), 'w');
  sym(p, h => frillLines(h, 38, 36, 50, 4));
  symShape(p, 'M0 1 Q24 1 39 14 L37 19 Q22 7 0 7 Z', 'k');
  P(p, 'M-4 -6 H4 V2 H-4 Z', '', { fill: C.k, stroke: '#000', 'stroke-width': .6 });
  P(p, 'M.5 -5.5 H3.5 V-2.5 H.5 Z', 'neonF');
  // ear bolt with ring light
  sym(p, h => {
    el('circle', { cx: 42, cy: 58, r: 5.6, fill: 'url(#chrome)', stroke: '#1d1d1f', 'stroke-width': .7 }, h);
    el('circle', { cx: 42, cy: 58, r: 3.2, fill: 'none', stroke: C.o, 'stroke-width': 1, filter: lit ? 'url(#glow)' : '', opacity: lit ? 1 : .3 }, h);
  });
  // porcelain mask: wide cheeks, small pointed chin, no nose, no mouth
  symShape(p, 'M0 14 C21 14 33 30 33 52 C33 70 23 86 0 96 Z', 'w');
  sym(p, h => P(h, 'M31 66 Q24 84 8 93', 'pl'));
  if (marks === 'facet') {                                                // faceted mask: a soft ridge down the centre, one side in shade
    P(p, 'M0 46 L0 96 Q12 90 20 80 L8 74 Z', '', { fill: '#d8cfc1', opacity: .55 });
    P(p, 'M0 46 L0 92', '', { stroke: '#b9ae9f', 'stroke-width': .6 });
  }
  sym(p, h => eye(h, expr, lit, eyes));
  if (marks === 'blush') sym(p, h => {
    for (let i = 0; i < 3; i++) P(h, `M${18 + i * 3.4} 74.5 L${20 + i * 3.4} 71`, '', { stroke: C.o, 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: lit ? .9 : .25, ...(lit ? { filter: 'url(#glow)' } : {}) });
  });
  if (marks === 'seams') sym(p, h => {                                   // doll-joint seam under each eye + a tiny screw
    P(h, 'M20 68 Q22 76 21 84', 'pl', { 'stroke-width': .8 });
    el('circle', { cx: 25.6, cy: 72, r: 1, fill: '#9c9083' }, h);
  });
  if (!H) return;
  sym(p, h => { P(h, H.side, 'k'); P(h, H.sideLine, 'plk'); });
  symShape(p, BANGS, 'k');
  sym(p, h => {
    P(h, 'M6 8 L6 42 M12 10 L12 45 M19 9 L19 42 M26 12 L26 44', 'plk');
    P(h, 'M3 16 Q20 14 34 24', '', { fill: 'none', stroke: '#8a8079', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: .55 });
  });
}

// ======================================================================
// HEAD (profile, facing +x).
// ======================================================================
function headSide(p) {
  // long hair, falling straight down the back
  P(p, 'M-40 22 Q-38 -6 -2 -6 Q22 -6 32 18 L8 30 L-14 40 L-22 150 Q-34 158 -46 150 L-44 70 Z', 'k');
  P(p, 'M-30 20 L-34 146 M-20 14 L-26 120', 'plk');
  P(p, 'M-34 6 Q-20 -2 -4 0', '', { fill: 'none', stroke: '#8a8079', 'stroke-width': 2.4, opacity: .55, 'stroke-linecap': 'round' });
  // headdress frill seen from the side
  P(p, frillPath(36, 36, 48, 5, -128, 76), 'w');
  frillLines(p, 36, 36, 48, 5, -128, 76);
  P(p, 'M-28 4 Q0 -8 22 4 L20 9 Q0 -2 -26 9 Z', 'k');
  // porcelain face profile
  P(p, 'M-12 20 Q12 12 26 26 Q32 38 32 50 L34.5 60 Q33.6 64 31 66 Q29.5 82 18 91 Q8 97 -2 94 L-12 70 Z', 'w');
  P(p, 'M24 70 Q20 84 8 92', 'pl');
  // eye sliver
  P(p, 'M24 50.5 L30 52 L29.4 63 L24.5 64 Z', 'glass');
  el('ellipse', { cx: 28.4, cy: 57.6, rx: 3.5, ry: 8, fill: 'url(#eyeGlow)', opacity: .6 }, p);
  el('ellipse', { cx: 28.4, cy: 57.6, rx: 1.4, ry: 4.6, fill: C.o, filter: 'url(#glow)' }, p);
  P(p, 'M23 50.6 L31.2 51.6 L30.4 49.4 L23 48.4 Z', 'k', { stroke: 'none' });
  P(p, 'M24 75 L27 71.5 M27.4 76 L30.2 72.6', '', { stroke: C.o, 'stroke-width': 1.1, filter: 'url(#glow)', 'stroke-linecap': 'round' });
  // bangs (side), side lock, ear bolt
  P(p, 'M-12 2 Q18 -6 32 18 L34 42 L27 44 L22 28 Q8 22 -10 28 Z', 'k');
  el('circle', { cx: 0, cy: 60, r: 7, fill: 'url(#chrome)', stroke: '#1d1d1f', 'stroke-width': .7 }, p);
  el('circle', { cx: 0, cy: 60, r: 4, fill: 'none', stroke: C.o, 'stroke-width': 1.1, filter: 'url(#glow)' }, p);
  P(p, 'M4 28 L16 29 L17.5 91 L6 93 Z', 'k');
  P(p, 'M11 32 L12 88', 'plk');
  // chrome neck
  P(p, 'M-6 92 L8 90 L9 112 L-7 112 Z', 'g');
}

// chrome ball joint with a glowing seam ring
function ball(h, x, y, r, lit = true) {
  el('circle', { cx: x, cy: y, r, fill: 'url(#chrome)', stroke: '#1d1d1f', 'stroke-width': .8 }, h);
  el('ellipse', { cx: x, cy: y, rx: r, ry: r * .32, fill: 'none', stroke: C.o, 'stroke-width': 1.1, opacity: lit ? 1 : .3, ...(lit ? { filter: 'url(#glow)' } : {}) }, h);
}

// ======================================================================
// BODY (front). One head = 96 units; ~6.6 heads tall (anime figure, not chibi).
// ======================================================================
function legs(h, back = false, style = 'thighhigh') {
  if (style === 'boots') {
    P(h, 'M4 292 L33 292 Q34 380 28 440 L11 440 Q4 380 4 292 Z', 'w');  // full ceramic thigh
    if (!back) P(h, 'M18 300 Q20 380 19 432', 'pl');
    ball(h, 19.5, 448, 9);
    // knee-high glossy boot with a ceramic cuff and lit buckle
    P(h, 'M10 458 L29.5 458 Q31 520 27 600 L30 628 Q30 640 21 640 L13 640 Q9 638 10 626 L12 600 Q8 520 10 458 Z', 'k');
    P(h, 'M9 456 L30.5 456 L30 466 L9.6 466 Z', 'w');
    P(h, 'M12 470 L28 470', 'neon');
    if (!back) P(h, 'M19.6 474 L19.6 590', 'plk');
    P(h, 'M14 636 L14 646 L22 646 L22 640 Z', 'k');
    return;
  }
  P(h, 'M4 292 L33 292 L31 352 L8 352 Z', 'w');                          // ceramic thigh (zettai ryouiki)
  P(h, 'M8 350 L31 350 L28 440 L11 440 Z', 'k');                        // thigh-high
  for (let i = 0; i < 4; i++) {                                         // ceramic frill band on the stocking top
    const x0 = 8 + i * 5.8;
    P(h, `M${x0} 350 Q${x0 + 2.9} ${358} ${x0 + 5.8} 350 Z`, 'w');
  }
  P(h, 'M10 359 L28 359', 'neon');
  ball(h, 19.5, 448, 9);                                                // knee
  P(h, 'M11 456 L28.5 456 Q30 500 26 584 L14 584 Q10 500 11 456 Z', 'k');                   // shin
  if (!back) P(h, 'M19.6 468 L19.6 574', 'plk');
  ball(h, 20, 588, 5.2);                                                // ankle
  // Mary-Jane shoe: rounded toe, strap, chunky heel
  P(h, 'M11 592 L29 592 L31 628 Q30 640 21 640 L13 640 Q9 638 10 626 Z', 'k');
  P(h, 'M11 606 L29.5 604 L29.8 609 L11.2 611 Z', 'w');
  el('circle', { cx: 27, cy: 606.6, r: 1.4, fill: C.o, filter: 'url(#glow)' }, h);
  P(h, 'M14 636 L14 646 L22 646 L22 640 Z', 'k');
}

function arm(h, back = false, style = 'puff') {
  ball(h, 49, 124, 8);                                                  // shoulder
  P(h, 'M45 132 L56 131 L61 196 L51 198 Z', 'w');                      // upper arm
  ball(h, 57, 204, 7);                                                  // elbow
  P(h, 'M51 210 L64 209 L69 260 L56 262 Z', 'w');                      // forearm
  P(h, 'M54 248 L69.5 246 L70.5 262 L55.5 264 Z', 'k');                 // black cuff
  for (let i = 0; i < 3; i++) {                                         // ceramic frill cuff
    const x0 = 54.5 + i * 5.6;
    P(h, `M${x0} ${263 - i * .5} Q${x0 + 2.8} ${271 - i * .5} ${x0 + 5.6} ${262.4 - i * .5} Z`, 'w');
  }
  ball(h, 63, 272, 4.6);                                                // wrist
  // slim gunmetal hand, relaxed
  P(h, 'M57 276 L70 274 L72.5 296 L60.5 298 Z', 'g');
  P(h, 'M59.5 280 L69.5 278.6 L71.2 293 L61.2 294.4 Z', 'w', { 'stroke-width': .6 });
  for (let i = 0; i < 4; i++) {
    const x = 61 + i * 3.1;
    P(h, `M${x} 297 L${x + 1} 314 L${x + 3} 314 L${x + 2.6} 296.6`, 'g', { 'stroke-width': .6 });
    el('circle', { cx: x + 1.4, cy: 298, r: 1.2, fill: '#2b2b2e' }, h);
  }
  P(h, 'M57.5 282 L53.6 296 L56 299 L60 287', 'g', { 'stroke-width': .6 });
  if (style === 'bell') {
    // long flared black sleeve from the elbow, ceramic trim, hand emerging below
    P(h, 'M50 212 L64 210 L84 276 Q70 284 50 282 Z', 'k');
    P(h, 'M57 216 L66 278 M62 214 L76 279', 'plk');
    P(h, 'M50 278 Q70 280 84 272 L85 278 Q70 287 50.4 284 Z', 'w');
  }
}

function figureFront(p, o = {}) {
  sym(p, h => legs(h, false, o.legs));
  // skirt: glossy A-line with ceramic scalloped petticoat
  symShape(p, 'M0 208 L30 208 L64 292 Q34 302 0 302 Z', 'k');
  sym(p, h => {
    P(h, 'M14 212 L26 298 M26 212 L46 296', 'plk');
    P(h, 'M8 222 Q24 220 38 236', '', { fill: 'none', stroke: '#6b625c', 'stroke-width': 2, opacity: .5, 'stroke-linecap': 'round' });
    for (let i = 0; i < 5; i++) {
      const x0 = i * 13.4, y0 = 297 + i * .9;
      P(h, `M${x0} ${y0 + 1} Q${x0 + 6.7} ${y0 + 12} ${x0 + 13.4} ${y0} L${x0 + 13.4} ${y0 - 4} L${x0} ${y0 - 3} Z`, 'w');
    }
  });
  // apron skirt with scalloped hem
  symShape(p, 'M0 212 L22 212 L28 270 L0 272 Z', 'w');
  sym(p, h => {
    for (let i = 0; i < 3; i++) {
      const x0 = i * 9.4, y0 = 271 - i * .6;
      P(h, `M${x0} ${y0} Q${x0 + 4.7} ${y0 + 9} ${x0 + 9.4} ${y0 - .6} Z`, 'w');
    }
    P(h, 'M0 226 L22.5 225', 'pl');
  });
  // apron pocket emblem: bento grid, one cell lit
  P(p, 'M-7 240 H7 V252 H-7 Z M0 240 V252 M-7 246 H7', '', { fill: 'none', stroke: C.line, 'stroke-width': .9 });
  P(p, 'M1 241 H6 V245 H1 Z', 'neonF');
  // waist sash
  symShape(p, 'M0 198 L29 196 L30 210 L0 212 Z', 'w'); sym(p, h => P(h, 'M3 205 L27 203.6', 'neon'));
  sym(p, h => arm(h, false, o.sleeve));
  // bodice
  symShape(p, 'M0 112 L22 112 L40 120 L41 146 Q36 170 29 198 L0 198 Z', 'k');
  sym(p, h => P(h, 'M10 150 Q24 146 36 140', '', { fill: 'none', stroke: '#6b625c', 'stroke-width': 2, opacity: .45, 'stroke-linecap': 'round' }));
  // apron bib with ruffled top, ruffle "wings" over the shoulders
  symShape(p, 'M0 140 L17 140 L16 198 L0 198 Z', 'w');
  sym(p, h => {
    for (let i = 0; i < 2; i++) { const x0 = i * 8.5; P(h, `M${x0} 141 Q${x0 + 4.25} 133 ${x0 + 8.5} 141 Z`, 'w'); }
    P(h, 'M13 141 L17 141 L33 118 L29 116.4 Z', 'w');
    for (let i = 0; i < 4; i++) {                                       // shoulder ruffle wing
      const t = i / 3, x = 31 - t * 15, y = 117 + t * 22;
      P(h, `M${x} ${y} Q${x + 13 - t * 4} ${y - 3} ${x + 12 - t * 4} ${y + 7} Z`, 'w');
    }
  });
  // puff sleeves: glossy black, stamped ribs, ceramic trim
  sym(p, h => {
    P(h, 'M36 116 Q56 106 62 126 Q63 140 54 144 L42 143 Q34 130 36 116 Z', 'k');
    P(h, 'M44 113 Q50 128 48 143 M53 114 Q58 128 56 143', 'plk');
    P(h, 'M41 141 L56 142.5 L55 147 L42 146 Z', 'w');
    P(h, 'M42 119 Q51 112 58 120', '', { fill: 'none', stroke: '#6b625c', 'stroke-width': 2, opacity: .5, 'stroke-linecap': 'round' });
  });
  // chrome neck + ceramic round collar + hard ribbon bow with lit gem
  P(p, 'M-7 90 H7 V114 H-7 Z', 'g');
  for (let i = 0; i < 4; i++) P(p, `M-7 ${96 + i * 4.5} H7`, '', { stroke: '#1d1d1f', 'stroke-width': .8 });
  sym(p, h => P(h, 'M1 108 Q12 106 22 112 Q22 122 10 124 Q3 122 1 116 Z', 'w'));
  sym(p, h => P(h, 'M2 118 L13 113 L14 124 L3 121 Z M3 121 L8 134 L11 133 L5 120 Z', 'k'));
  el('circle', { cx: 0, cy: 119, r: 3, fill: C.o, filter: 'url(#glow)' }, p);
  headFront(g(p), o.head || {});
}

function figureBack(p) {
  sym(p, h => legs(h, true));
  symShape(p, 'M0 208 L30 208 L64 292 Q34 302 0 302 Z', 'k');
  sym(p, h => {
    P(h, 'M14 212 L26 298 M26 212 L46 296', 'plk');
    for (let i = 0; i < 5; i++) {
      const x0 = i * 13.4, y0 = 297 + i * .9;
      P(h, `M${x0} ${y0 + 1} Q${x0 + 6.7} ${y0 + 12} ${x0 + 13.4} ${y0} L${x0 + 13.4} ${y0 - 4} L${x0} ${y0 - 3} Z`, 'w');
    }
  });
  symShape(p, 'M0 198 L29 196 L30 210 L0 212 Z', 'w');
  sym(p, h => arm(h, true));
  symShape(p, 'M0 112 L22 112 L40 120 L41 146 Q36 170 29 198 L0 198 Z', 'k');
  sym(p, h => {
    P(h, 'M13 117 L31 119 L4 196 L0 196 L0 186 Z', 'w');                   // crossed apron straps
    P(h, 'M36 116 Q56 106 62 126 Q63 140 54 144 L42 143 Q34 130 36 116 Z', 'k');
    P(h, 'M44 113 Q50 128 48 143 M53 114 Q58 128 56 143', 'plk');
    P(h, 'M41 141 L56 142.5 L55 147 L42 146 Z', 'w');
    // big ceramic apron bow
    P(h, 'M3 200 Q20 180 36 190 Q38 206 24 212 Q12 212 3 208 Z', 'w');
    P(h, 'M10 196 Q20 190 30 194 M11 204 Q20 206 30 202', 'pl');
    P(h, 'M3 210 L14 252 L22 248 L8 210 Z', 'w');
  });
  el('circle', { cx: 0, cy: 204, r: 5, fill: 'url(#chrome)', stroke: '#1d1d1f' }, p);
  el('circle', { cx: 0, cy: 204, r: 2, fill: C.o, filter: 'url(#glow)' }, p);
  P(p, 'M-7 90 H7 V114 H-7 Z', 'g');
  // back of head: long straight hair over the shoulders and back
  symShape(p, 'M0 -4 C30 -4 47 16 47 46 L49 168 Q36 176 22 170 L0 172 Z', 'k');
  symShape(p, frillPath(38, 36, 50, 4), 'w');
  symShape(p, 'M0 1 Q24 1 39 14 L37 19 Q22 7 0 7 Z', 'k');
  sym(p, h => {
    P(h, 'M10 6 L10 170 M22 10 L23 170 M34 20 L37 168', 'plk');
    P(h, 'M4 14 Q22 12 38 26', '', { fill: 'none', stroke: '#8a8079', 'stroke-width': 2.2, opacity: .55, 'stroke-linecap': 'round' });
    frillLines(h, 38, 36, 50, 4);
    // headdress ribbon tails
    P(h, 'M2 8 Q14 20 12 44 L6 46 Q8 24 0 14 Z', 'w');
    el('circle', { cx: 42, cy: 58, r: 5.6, fill: 'url(#chrome)', stroke: '#1d1d1f', 'stroke-width': .7 }, h);
  });
}

// ======================================================================
// HAND detail (back of right hand, fingers up). Local units ~ 1 = 1mm-ish.
// ======================================================================
function handDetail(p) {
  // forearm + wrist
  P(p, 'M-40 250 L40 250 L36 180 L-36 180 Z', 'w');
  P(p, 'M-36 196 L36 196', 'neon');
  P(p, 'M-30 186 L-30 246 M30 186 L30 246', 'pl');
  P(p, 'M-30 180 L30 180 L28 160 L-28 160 Z', 'g');
  el('ellipse', { cx: 0, cy: 162, rx: 26, ry: 7, ...S('g') }, p);              // wrist bearing
  // palm/back plate
  P(p, 'M-34 150 L34 150 L40 76 L-40 76 Z', 'g');
  P(p, 'M-24 142 L24 142 L28 86 L-28 86 Z', 'w');                               // dorsal ceramic plate
  P(p, 'M-18 100 L18 100', 'pl');
  // fingers: index..pinky, 3 phalanges each with servo knuckles
  const fingers = [
    { x: -27, len: [26, 18, 14], ang: -6 },
    { x: -9, len: [30, 20, 15], ang: -2 },
    { x: 9, len: [28, 19, 14], ang: 2 },
    { x: 26, len: [22, 15, 12], ang: 7 },
  ];
  for (const f of fingers) {
    const fg = g(p, { transform: `translate(${f.x},76) rotate(${f.ang})` });
    let y = 0;
    // tendon cable runs from the wrist up the back of the hand
    P(p, `M${f.x * .55} 160 Q${f.x * .8} 120 ${f.x} 80`, '', { fill: 'none', stroke: '#1d1d1f', 'stroke-width': 2.2 });
    P(p, `M${f.x * .55} 160 Q${f.x * .8} 120 ${f.x} 80`, '', { fill: 'none', stroke: '#b5b8bd', 'stroke-width': .8 });
    f.len.forEach((L, i) => {
      const w = 7.5 - i * .8;
      el('circle', { cx: 0, cy: y, r: w + 1, ...S('g') }, fg);                  // servo knuckle
      el('circle', { cx: 0, cy: y, r: 2, fill: i === 0 ? C.o : '#222', ...(i === 0 ? { filter: 'url(#glow)' } : {}) }, fg);
      P(fg, `M${-w} ${y - 3} L${-w + 1} ${y - L + 3} L${w - 1} ${y - L + 3} L${w} ${y - 3} Z`, i === 2 ? 'k' : 'g');
      if (i < 2) P(fg, `M${-w + 2} ${y - 5} L${-w + 2.6} ${y - L + 6} L${w - 2.6} ${y - L + 6} L${w - 2} ${y - 5} Z`, 'w');  // phalanx cap
      y -= L;
    });
    P(fg, `M${-5} ${y + 3} Q0 ${y - 4} 5 ${y + 3}`, 'k');                     // fingertip pad
  }
  // thumb on its own 2-axis base
  const th = g(p, { transform: 'translate(-40,128) rotate(-48)' });
  el('circle', { cx: 0, cy: 0, r: 10, ...S('g') }, th);
  el('circle', { cx: 0, cy: 0, r: 3, fill: C.o, filter: 'url(#glow)' }, th);
  let ty = 0;
  [24, 18, 14].forEach((L, i) => {
    const w = 8 - i;
    if (i) el('circle', { cx: 0, cy: ty, r: w + 1, ...S('g') }, th);
    P(th, `M${-w} ${ty - 3} L${-w + 1} ${ty - L + 3} L${w - 1} ${ty - L + 3} L${w} ${ty - 3} Z`, i === 2 ? 'k' : 'g');
    if (i < 2) P(th, `M${-w + 2} ${ty - 5} L${-w + 2.6} ${ty - L + 6} L${w - 2.6} ${ty - L + 6} L${w - 2} ${ty - 5} Z`, 'w');
    ty -= L;
  });
}

