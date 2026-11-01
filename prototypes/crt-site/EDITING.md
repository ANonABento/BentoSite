# Editing the prologue

From the repo root: `python3 prototypes/crt-site/serve.py`, then open http://127.0.0.1:4173/prototypes/crt-site/.

## The screen

- **Scene** (top), with the objects list on its left and the selected object's values on its right.
- **Bar** under the scene: ⏮ start, ▶ play / pause (or Space), *jump to beat…*, the playhead time and the beat
  it's in, SAVE.
- **Timeline** (bottom, full width): a row per value, ◆ = keyframe. Drag the playhead (the line in the ruler) to scrub,
  ← → step 0.1 s. Scroll to see more rows; drag the ends of the strip along its bottom to zoom in time.

## How it works

Her motion, the camera and the lights on her are all keyframes now, sampled from the script (`prologue.js`) so they
start out playing it exactly. What's still code: her fingers, which way her hands point, the cloth, and the boot screen.

- **Camera**: the shot up to the dive. 0:00 and 8.57 s are the locked glass shot (same values, so it holds still),
  then the pull-back to her shoulder ending at 11.17 s. The dive into the TV after that is still the script's.
- **Her / body** (lean, roll, twist, hips), **Her / head** (head pitch, yaw, roll; where the eyes look),
  **Her / eyes** (glow, open, warm, happy), **Her / hands** (where each hand is; the arm bends itself to reach it),
  **Lights / scene** (the fill on her hands, the rim light, the screen lighting her, the room light).
- Each of those has a `use` value: 1 plays the keys, 0 plays the script again (to compare, or to undo everything).

## Doing things

**Change anything at a moment** (the camera passing closer to her, a hand higher, a longer look):
1. Click the object in the list (e.g. **Her / hands**).
2. Put the playhead on the moment (drag it, or *jump to beat…*).
3. In the values panel drag the value sideways (double-click to type). On a key that key changes; between keys a new
   one appears.
4. Play it back. Drag ◆ left/right to retime; click the line between two ◆ to change the easing; right-click a ◆ to
   delete it. To shift a whole move, shift-drag a box around its ◆ and drag them together.

The fast moves have keys every few frames, so they keep their snap; change the key at the end of a move, not the ones
in its middle, and the move eases there on its own.

**Change the whole glass shot**: change the Camera at 0:00 and at 8.57 s (both keys), or it drifts between them.

**Start over from the script**: set the object's `use` to 0, or ask me to re-seed it (`seed.js`, below).

**Add a pause**: Retime → playhead where it should freeze → set a key with `hold` 0, then a key 0.5 s later with
`hold` 0.5. The scene stops for half a second there and everything after plays later.

**Base values** (`Settings / …`): click time, headdress tilt, eye colours, light. Not keyframed, just values. The keys
don't follow the click time or the headdress tilt: after changing those, re-seed (below).

**Re-seed** (rewrites those objects' keys from the script, losing hand edits to them; with the page open, in the
browser console): `await (await import('/prototypes/crt-site/seed.js')).seed()`, or `.seed(['Her / hands'])` for one.

Then **SAVE** (writes `src/components/Prologue/theatre-state.json`; the site plays exactly that file). Unsaved edits
are lost on reload (the browser asks first). After saving, re-record the phone video:
`node prototypes/crt-site/record.mjs` (with the server running).

## The objects

| Object | What it does |
|---|---|
| **Camera** | `position`, `target` (the point it looks at), `fov`: the shot up to the dive (it hands back to the scripted dive camera over 0.5 s from 11.15 s). `takeover` 0 brings back the scripted camera. |
| **Her / body** | `lean` forward, `roll` sideways, `twist` (shoulders), `hips` (x, y, z). |
| **Her / head** | `head` (pitch, yaw, roll), `lookDown`, `lookRight` (the eyes). |
| **Her / eyes** | `glow`, `open` (0 = shut: blinks are dips), `warm` (cold red-orange → warm), `happy` (the smile). |
| **Her / hands** | `right`, `left`: where each hand goes, in her frame (x toward her left, y up, z toward the glass). |
| **Lights / scene** | `handFill` (on her hands), `rim` (behind her), `screenLit` (the TV lighting her), `room`. |
| **Lights / gain** | Multipliers: `room`, `screen`, `bloom`, `reflection`, `herFill`, `herRim`. |
| **Retime** | `hold`: how many seconds the scene runs behind the timeline from that point on. |
| **Settings / …** | timing (the click), headdress, eyes, light. |

Theatre's markers don't survive a reload here; the bar's beat readout and *jump to beat* stand in for them. Anything
else you want on the timeline is one line in `prologue.js` (`TL.define`), plus reading it where it's used.
