// Seeds the timeline's script-channel objects (Her / …, Lights / scene) with keys sampled from the script, so the timeline
// shows the animation itself. Run on the tuning page (studio or ?nostudio), from the console:
//   await (await import('/prototypes/crt-site/seed.js')).seed()            all of them
//   await (await import('/prototypes/crt-site/seed.js')).seed(['Her / hands'])
// It rewrites those objects' keys in src/components/Prologue/theatre-state.json (other objects are kept) and sets their
// `use` to 1; reload afterwards. Re-seed after changing the script or a Settings value the motion depends on (the click
// time, the headdress): it replaces hand edits to those objects.
const OBJECTS = ['Her / body', 'Her / head', 'Her / eyes', 'Her / hands', 'Lights / scene'];
const FPS = 30, TOL = 0.01;   // keys snap to Theatre's 30 fps grid; each channel stays within 1% of its range

export async function seed(objects = OBJECTS) {
  const T = window.prologueTimes;
  const end = T.positionAt(T.HANDOFF) + 0.5;
  const pos = Array.from({ length: Math.ceil(end * FPS) + 1 }, (_, i) => i / FPS);
  const samples = T.sampleScript(pos.map(T.story));
  const state = await fetch('/src/components/Prologue/theatre-state.json').then((r) => r.json());
  const sheet = state.sheetsById.Prologue;
  for (const key of objects) {
    const rows = samples[key];
    const trackData = {}, trackIdByPropPath = {};
    for (const prop of Object.keys(rows[0])) {
      const axes = Array.isArray(rows[0][prop]) ? ['x', 'y', 'z'] : [null];
      axes.forEach((ax, j) => {
        const v = rows.map((r) => (ax ? r[prop][j] : r[prop]));
        const id = uid();
        trackData[id] = { type: 'BasicKeyframedTrack', keyframes: keys(v) };
        trackIdByPropPath[JSON.stringify(ax ? [prop, ax] : [prop])] = id;
      });
    }
    sheet.sequence.tracksByObject[key] = { trackData, trackIdByPropPath };
    sheet.staticOverrides.byObject[key] = { use: 1 };
  }
  delete sheet.sequence.tracksByObject.Her;   // the old offsets object, replaced by these
  delete sheet.staticOverrides.byObject.Her;
  const r = await fetch('/__save-theatre', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
  return r.ok ? Object.fromEntries(objects.map((k) => [k, Object.values(sheet.sequence.tracksByObject[k].trackData).map((t) => t.keyframes.length)])) : r.status;
}

/** A channel sampled at FPS → few keys within TOL of it: Douglas–Peucker, then handles from its own slopes, then a key
 *  added wherever the curve Theatre plays between two keys still strays (its handles sit at x 1/3 and 2/3, so a
 *  segment is a plain cubic in time). */
function keys(v) {
  const n = v.length, range = Math.max(...v) - Math.min(...v);
  if (range < 1e-5) return [key(0, v[0], [0.667, 1, 0.333, 0])];
  const keep = new Set([0, n - 1]);
  (function split(a, b) {
    let worst = -1, err = TOL * range;
    for (let i = a + 1; i < b; i++) {
      const e = Math.abs(v[i] - (v[a] + (v[b] - v[a]) * (i - a) / (b - a)));
      if (e > err) { err = e; worst = i; }
    }
    if (worst < 0) return;
    keep.add(worst); split(a, worst); split(worst, b);
  })(0, n - 1);
  const slope = (i) => (i <= 0 || i >= n - 1 ? 0 : (v[i + 1] - v[i - 1]) / 2);   // per frame
  const handles = (idx) => idx.map((i, k) => {
    let ly = 1, ry = 0;
    if (k > 0) { const a = idx[k - 1], dv = v[i] - v[a]; if (Math.abs(dv) > 1e-6) ly = 1 - (slope(i) * (i - a) / 3) / dv; }
    if (k < idx.length - 1) { const b = idx[k + 1], dv = v[b] - v[i]; if (Math.abs(dv) > 1e-6) ry = (slope(i) * (b - i) / 3) / dv; }
    return [0.667, clampH(ly), 0.333, clampH(ry)];
  });
  for (let pass = 0; pass < 20; pass++) {
    const idx = [...keep].sort((a, b) => a - b), h = handles(idx);
    let added = false;
    for (let k = 0; k < idx.length - 1; k++) {
      const a = idx[k], b = idx[k + 1], y1 = h[k][3], y2 = h[k + 1][1];
      let worst = -1, err = TOL * range;
      for (let i = a + 1; i < b; i++) {
        const u = (i - a) / (b - a), m = 1 - u;
        const y = 3 * m * m * u * y1 + 3 * m * u * u * y2 + u * u * u;
        const e = Math.abs(v[i] - (v[a] + (v[b] - v[a]) * y));
        if (e > err) { err = e; worst = i; }
      }
      if (worst >= 0) { keep.add(worst); added = true; }
    }
    if (!added) break;
  }
  const idx = [...keep].sort((a, b) => a - b), h = handles(idx);
  return idx.map((i, k) => key(i / FPS, v[i], h[k]));
}
const clampH = (y) => Math.round(Math.max(-3, Math.min(4, y)) * 1000) / 1000;
const key = (position, value, handles) => ({ id: uid(), position, connectedRight: true, handles, type: 'bezier', value: Math.round(value * 1e4) / 1e4 });
const uid = () => Math.random().toString(36).slice(2, 12);
