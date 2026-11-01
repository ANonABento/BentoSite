/*
 * Prologue sound effects: short CC0 recordings of real servos, relays and a CRT (public/prologue/sfx/, about 130 KB;
 * sources in prototypes/crt-site/SOUNDS.md), plus a synthesised squeak for the cloth on the glass. Off until the visitor turns sound on
 * (browsers only allow audio after a gesture anyway); the clips are fetched then, and the choice is remembered in
 * localStorage.
 *
 *   const sfx = createSfx({ base: '/prologue/sfx/' });  sfx.setOn(true);  sfx.play('servo');
 *   sfx.cue(prevT, t, CUES)   plays every [time, name] cue crossed going forward (scrubbing back stays silent)
 */
const KEY = 'bentOS.sound';
const CLIPS = ['wake', 'servo-1', 'servo-2', 'servo-3', 'servo-4', 'fine', 'lock', 'click', 'crt-on', 'degauss'];

export function createSfx({ base = '/prologue/sfx/' } = {}) {
  let ctx = null, out = null;
  let on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked: stays off */ }
  const buffers = {};
  let loading = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    out.connect(comp).connect(ctx.destination);
    return ctx;
  }
  function load() {
    loading ??= Promise.all(CLIPS.map((n) => fetch(`${base}${n}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((a) => ctx.decodeAudioData(a))
      .then((b) => { buffers[n] = b; })
      .catch(() => { /* that one stays silent */ })));
    return loading;
  }

  /** Play a clip: `rate` shifts pitch and speed together (a servo working harder or easier), `dur` cuts it short. */
  function clip(name, t, { gain = 1, rate = 1, dur } = {}) {
    const b = buffers[name];
    if (!b) return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.playbackRate.value = rate;
    g.gain.value = gain;
    s.connect(g).connect(out);
    s.start(t);
    if (dur) {
      g.gain.setValueAtTime(gain, t + dur - 0.05);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      s.stop(t + dur + 0.02);
    }
  }
  const jitter = (k) => 1 + (Math.random() * 2 - 1) * k;
  let lastServo = 0;

  // the squeak of cloth on glass: there's no good CC0 recording short enough, so it stays synthesised
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, f0, f1, t, dur, peak, a = 0.01) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a, peak, dur); o.connect(g).connect(out); o.start(t); o.stop(t + a + dur + 0.05);
    return o;
  }

  const SOUNDS = {
    // she powers up: a servo spinning up under load
    wake(t) { clip('wake', t, { gain: 0.7, dur: 1.6 }); },
    // a joint moving: one of four servo recordings, never the same one twice running, pitch varied a little
    servo(t) {
      let i = Math.floor(Math.random() * 4);
      if (i === lastServo) i = (i + 1) % 4;
      lastServo = i;
      clip(`servo-${i + 1}`, t, { gain: 0.55, rate: jitter(0.12), dur: 0.55 });
    },
    // fingers: a tiny high servo
    fine(t) { clip('fine', t, { gain: 0.35, rate: jitter(0.15), dur: 0.35 }); },
    // the headdress seating: a relay snapping shut
    lock(t) { clip('lock', t, { gain: 0.8 }); },
    squeak(t) {
      for (let i = 0; i < 3; i++) {
        const o = osc('sine', 1300 + i * 90, 1700 + i * 60, t + i * 0.1, 0.07, 0.02, 0.015);
        const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 38; vg.gain.value = 60;
        v.connect(vg).connect(o.frequency); v.start(t + i * 0.1); v.stop(t + i * 0.1 + 0.12);
      }
    },
    // the power button
    click(t) { clip('click', t, { gain: 2.2 }); clip('lock', t + 0.01, { gain: 0.35, rate: 1.4 }); },
    // the tube: the set switching on, then the degauss thump
    degauss(t) { clip('crt-on', t, { gain: 0.6 }); clip('degauss', t + 0.15, { gain: 0.5 }); },
  };

  // remembered on: decode now (an AudioContext can decode before the gesture that lets it play), so the first cue sounds
  if (on && ensure()) load();

  return {
    get on() { return on; },
    setOn(v) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* not remembered */ }
      if (on && ensure()) {
        if (ctx.state === 'suspended') ctx.resume();
        load();
      }
    },
    play(name) {
      if (!on || !ensure() || !SOUNDS[name]) return;
      if (ctx.state === 'suspended') ctx.resume();
      load();
      SOUNDS[name](ctx.currentTime + 0.01);
    },
    cue(prev, t, cues) {
      if (!on || t <= prev || t - prev > 0.5) return;       // forward play only; a jump (scrub, tab switch) is silent
      for (const [at, name] of cues) if (prev < at && at <= t) this.play(name);
    },
  };
}
