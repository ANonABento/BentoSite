/*
 * Prologue sound effects, synthesised with WebAudio (no audio files). Off until the visitor turns sound on
 * (browsers only allow audio after a gesture anyway); the choice is remembered in localStorage.
 *
 *   const sfx = createSfx();  sfx.setOn(true);  sfx.play('servo');
 *   sfx.cue(prevT, t, CUES)   plays every [time, name] cue crossed going forward (scrubbing back stays silent)
 */
const KEY = 'bentOS.sound';

export function createSfx() {
  let ctx = null, out = null;
  let on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked: stays off */ }

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    out.connect(comp).connect(ctx.destination);
    return ctx;
  }
  const noiseBuf = () => {
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  };
  let noise = null;
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
  function burst(t, dur, peak, type, freq, q = 1) {
    noise = noise || noiseBuf();
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    env(g, t, 0.005, peak, dur); s.connect(f).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    // power-on: a rising hum as she boots
    wake(t) { osc('sawtooth', 55, 220, t, 0.7, 0.05, 0.15); osc('sine', 110, 440, t, 0.7, 0.06, 0.15); },
    // a small servo move: a whirr that rises and settles
    servo(t) { osc('square', 180, 320, t, 0.16, 0.025); burst(t, 0.14, 0.03, 'bandpass', 2400, 3); },
    // the headdress locking into place
    lock(t) { burst(t, 0.03, 0.25, 'highpass', 3500); osc('sine', 1800, 1200, t, 0.05, 0.05); },
    // cloth on glass: a few squeaky chirps
    squeak(t) {
      for (let i = 0; i < 4; i++) {
        const o = osc('sine', 1300 + i * 90, 1700 + i * 60, t + i * 0.13, 0.09, 0.03, 0.02);
        const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 38; vg.gain.value = 60;
        v.connect(vg).connect(o.frequency); v.start(t + i * 0.13); v.stop(t + i * 0.13 + 0.15);
      }
      burst(t, 0.55, 0.012, 'bandpass', 5000, 0.7);
    },
    // the power button: a hard click with a little body
    click(t) { burst(t, 0.025, 0.5, 'highpass', 2000); osc('sine', 140, 60, t, 0.08, 0.2, 0.002); },
    // the tube: a degauss thunk and hum, and the faint high whine of a CRT warming up
    degauss(t) {
      osc('sine', 60, 50, t, 0.6, 0.18, 0.005); osc('square', 120, 100, t, 0.35, 0.04, 0.005);
      burst(t, 0.25, 0.08, 'lowpass', 400);
      osc('sine', 7800, 7800, t + 0.1, 1.6, 0.006, 0.4);
    },
  };

  return {
    get on() { return on; },
    setOn(v) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* not remembered */ }
      if (on && ensure() && ctx.state === 'suspended') ctx.resume();
    },
    play(name) {
      if (!on || !ensure() || !SOUNDS[name]) return;
      if (ctx.state === 'suspended') ctx.resume();
      SOUNDS[name](ctx.currentTime + 0.01);
    },
    cue(prev, t, cues) {
      if (!on || t <= prev || t - prev > 0.5) return;       // forward play only; a jump (scrub, tab switch) is silent
      for (const [at, name] of cues) if (prev < at && at <= t) this.play(name);
    },
  };
}
