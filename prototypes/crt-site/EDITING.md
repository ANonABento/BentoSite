# Editing the prologue

From the repo root: `python3 prototypes/crt-site/serve.py`, then open http://127.0.0.1:4173/prototypes/crt-site/.

## The screen

- **Scene** (top), with the objects list on its left and the selected object's values on its right.
- **Bar** under the scene: ⏮ start, ▶ play / pause (or Space), *jump to beat…*, the playhead time and the beat
  it's in, SAVE.
- **Timeline** (bottom, full width): a row per value, ◆ = keyframe. Drag the playhead (the line in the ruler) to scrub,
  ← → step 0.1 s. Scroll to see more rows; drag the ends of the strip along its bottom to zoom in time.

## How it works

Most of the animation is code: her arms, fingers, wipe strokes and cloth come from a script (`prologue.js`). The
timeline holds what you can change by hand:

- **Camera**: the whole shot is on the timeline. Its keys: 0:00 and 8.57 s are the locked glass shot (same values,
  so it holds still), then six keys make the pull-back to her shoulder, ending at 11.17 s. The camera after that (the
  dive into the TV) is still the script's.
- **Her**, **Lights**, **Retime**: one key at 0:00 at a neutral value. They're *offsets on top of* the script, so
  they do nothing until you change them.

## Doing things

**Change the camera at a moment** (e.g. the pull-back passing closer to her):
1. Click **Camera** in the objects list.
2. Put the playhead on the moment (drag it, or jump to beat → *pull-back*).
3. In the values panel drag `position` (x, y, z) or `target` (where it looks) sideways. If the playhead sits on a
   key, that key changes; if not, a new key appears there.
4. Play it back. Drag ◆ left/right to retime; click the line between two ◆ to change the easing; right-click a ◆ to
   delete it.

**Change the whole glass shot**: change it at 0:00 and at 8.57 s (both keys), or it drifts between them.

**Move her**: Her → playhead to the moment → change e.g. `rightHand` y. The value eases from the key before. To make
it a quick gesture that goes back, add a key a little later with it back at 0.

**Add a pause**: Retime → playhead where it should freeze → set a key with `hold` 0, then a key 0.5 s later with
`hold` 0.5. The scene stops for half a second there and everything after plays later.

**Base values** (`Settings / …`): click time, hand poses, headdress tilt, eye colours, light. Not keyframed, just
values. Changing the click time rebuilds the scene where the playhead is.

Then **SAVE** (writes `src/components/Prologue/theatre-state.json`; the site plays exactly that file). Unsaved edits
are lost on reload (the browser asks first). After saving, re-record the phone video:
`node prototypes/crt-site/record.mjs` (with the server running).

## The objects

| Object | What it does |
|---|---|
| **Camera** | `position`, `target` (the point it looks at), `fov`: the shot, keyframed up to the dive (it hands back to the scripted dive camera over 0.5 s from 11.15 s). `takeover` 0 brings back the scripted camera. |
| **Her** | Offsets on her scripted motion: `rightHand` / `leftHand` (x toward her left, y up, z toward the glass), `head` (pitch, yaw, roll), `lean`, `twist`; `eyeGlow` (×), `warmth` (pushes cold → warm eyes), `happy`, `blink`. |
| **Lights** | Multipliers: `room`, `screen`, `bloom`, `reflection`, `herFill`, `herRim`. |
| **Retime** | `hold`: how many seconds the scene runs behind the timeline from that point on. |
| **Settings / …** | timing (the click), poses, headdress, eyes, light. |

Theatre's markers don't survive a reload here; the bar's beat readout and *jump to beat* stand in for them. Anything
else you want on the timeline is one line in `prologue.js` (`TL.define`), plus reading it where it's used.
