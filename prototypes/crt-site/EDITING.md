# Editing the prologue

1. From the repo root: `python3 prototypes/crt-site/serve.py`, then open http://127.0.0.1:4173/prototypes/crt-site/.
2. The scene fills the top of the window and the Theatre.js studio sits around it:
   - top left: the objects (click one);
   - top right: its values (drag a number sideways, double-click to type, pick colours);
   - bottom: the timeline, once something is sequenced. Its playhead is the scene's clock: drag it to scrub;
     Space plays and pauses, ← → step 0.1 s.
3. The page opens with **Her** selected and the timeline showing. The main values (Retime, Camera, Her, Lights) are
   already on it, each with one keyframe at 0:00. To animate one: drag the playhead to a moment, change the value,
   and a keyframe appears there. Drag keyframes to retime them; click the line between two to edit the ease curve;
   right-click a keyframe to delete it. To put a value that isn't on the timeline yet (the Settings ones) on it,
   right-click its **name** in the right-hand panel → **Sequence**. The readout at the top shows the playhead's
   time and which story beat it's in (and the scene's own time, when Retime holds put it behind). Theatre's markers
   don't survive a reload here, so use the readout for beats.
4. **SAVE** (bottom right) writes `src/components/Prologue/theatre-state.json`. The site plays exactly that file. The
   page keeps no other copy: unsaved edits are lost on reload, so the browser asks before you leave with any.
5. After saving, re-record the phone video: `node prototypes/crt-site/record.mjs` (needs the server running).

## The objects

| Object | What it does |
|---|---|
| **Retime** | `hold`: how many seconds the scene runs behind the timeline from that point on. Keyframe it from 0 up to 0.5 between two times and the scene pauses half a second there; everything after shifts later. |
| **Camera** | `nudge` and `turn` move and rotate the scripted camera. `takeover` (0–1) blends to the camera's own `position`, `target` and `fov`; keyframe takeover to 1 and keyframe those to fly your own shot. |
| **Her** | Offsets on her scripted motion: `rightHand` / `leftHand` (x toward her left, y up, z toward the glass), `head` (pitch, yaw, roll), `lean`, `twist`; `eyeGlow` (×), `warmth` (pushes cold → warm eyes), `happy`, `blink`. |
| **Lights** | Multipliers: `room`, `screen`, `bloom`, `reflection`, `herFill`, `herRim`. |
| **Settings / …** | The base values: the click time and pull-back length (timing), the glass shot and the pull-back's path (camera path), the hand poses, the headdress tilt, the eye colours and glow, the light. Changing the click time or the glass shot rebuilds the scene where the playhead is. |

The scripted motion (arm IK, finger wiggle, the wipe strokes, the cloth) stays in code; the timeline layers on top of
it. Anything else you want on the timeline is one line in `prologue.js` (`TL.define`), plus reading it where it's used.
