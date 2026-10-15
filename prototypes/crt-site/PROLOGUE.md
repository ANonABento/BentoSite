# Prologue script (v3)

The script for the intro, written before any keys are set. Each shot has a **macro** line (what the
audience should read) and **micro** keys (who moves, when, by how much, on which curve).
Times are prologue seconds (`t`). The boot timeline (`tb`) starts at the knob click.

## What's wrong with the 9 s cut

Frames reviewed at 0.5 to 8.9 s:

1. **No motivation.** She raises her hand, plays her fingers at the camera, then points at the glass
   (5.8 to 6.6 s) and only then goes for the knob. The point reads as "touch the TV", so dropping to
   the knob looks like a change of mind. Nothing tells her, or us, that the knob is there.
2. **Robotic motion.** Every move is a symmetric `lerpPose` / `sstep` between two poses. Wrists travel
   in straight lines, every joint starts and stops on the same frame, and between moves she holds dead still.
   The only things that move are the right arm and a little head.
3. **Arm-only acting.** The knob is about 0.76 m to her right and 0.17 m below her chest. She reaches it by
   stretching the arm out straight, with no lean, weight shift or left hand.
4. **Camera wanders.** One continuous spline snakes through five places. The over-shoulder (7.2 to 8.5 s)
   is mostly blown-out hair with the knob hidden behind the forearm, so the payoff (the turn) is never cleanly shown.

## Style rules (Zenless Zone Zero cutscene grammar)

ZZZ fits this naturally: its world is CRT TVs, and its cutscenes are snappy, pose-to-pose anime acting
in 3D. The rules we take from it:

| Rule | What it means here |
|---|---|
| **Snap and settle** | Big moves use asymmetric ease-out: about 70% of the travel in the first 30% of the time, then a long settle with a small overshoot (3 to 8%). No symmetric ease-in-out on the body. |
| **Anticipation** | Every big move starts with a small counter-move, 80 to 150 ms long (shoulder dips before the reach, wrist counter-turns before the twist). |
| **Lead and follow** | The eyes lead, then head, chest, shoulder, elbow, wrist and fingers, each 60 to 120 ms after the one before. Nothing starts on the same frame. |
| **Arcs** | The hand travels on a curve (a bezier through a raised midpoint), never in a straight lerp. |
| **Moving holds** | She is never frozen: breathing (chest about 3 mm at 0.25 Hz), slow weight sway, and a blink every 2 to 3 s. Hair and skirt springs keep settling after each move. |
| **Strong key poses** | Each shot lands on one clear silhouette that holds for at least 0.3 s, so the eye can read it. |
| **Cut on action** | The camera either holds still with a slow drift or makes one decisive move. Change angle with a hard cut in the middle of a motion, never with a wander. One continuous move is allowed: the reveal. |
| **Impact frame** | At the click: a 2-frame flash or inversion, a small camera kick, and a short speed ramp. |
| **Light motivates** | The red standby LED is what she notices, so it pulses to draw the eye before she does. |

## Story in one line

A dormant robot maid wakes in the dark, sees her own reflection in a dead CRT, notices its red standby
light, leans in and turns it on. The screen's glow hits her face and the camera goes into the screen.

The misdirect stays: we open on the reflection and don't know it's glass until the camera pulls out.
The fix is that **the reach we see in the reflection is the reach for the knob**. It's one continuous,
motivated action: no finger-play showcase and no glass touch.

## Shot list

### Shot 1: WAKE (0.0 to 2.3 s), reflection close-up

**Macro:** total dark, then two orange eyes strike behind her bangs. She lifts her head and comes online.

**Camera:** locked on the glass, framing her face in the reflection, slightly left of centre (her eyes on
the upper third). FOV 46. A 2% push-in across the whole shot on linear time, so it never stops.
**Light:** the moon rim only, plus a faint red LED spill on the bottom of the frame.

| t | Part | Action | Curve |
|---|---|---|---|
| 0.0 | body | Dormant pose: head bowed 10°, shoulders down 1 cm, breathing slowly (0.18 Hz) | — |
| 0.0 to 0.6 | LED | Red standby glow, slow pulse (1.4 s period) | sine |
| 0.60 to 0.95 | eyes | Ignition flicker (existing `FLICKER` keys) | step |
| 0.95 to 1.25 | lids | Open, with a 5% over-widen that settles back by 1.4 | ease-out-back |
| 1.15 to 1.75 | head | Lift from 10° bowed to 0°, overshoot to −1.5° (chin up), settle | ease-out-back |
| 1.25 to 1.85 | chest | Rises 1.2 cm and straightens 3° (the "breath in" of booting) | ease-out, 100 ms after head |
| 1.30 to 1.90 | shoulders | Lift back to rest | ease-out, 150 ms after head |
| 1.4 to 2.3 | hair, skirt | Springs settle from the head lift | spring |
| 2.05 | lids | Blink (0.16 s), first sign of life | — |

**End pose:** upright, eyes level at the lens. Moving hold.

### Shot 2: NOTICE (2.3 to 3.7 s), same shot, no cut

**Macro:** something below catches her eye. She looks down, tilts her head with curiosity, and starts to reach.

| t | Part | Action | Curve |
|---|---|---|---|
| 2.3 | LED | One brighter pulse (×1.8), the hook | sine bump, 0.4 s |
| 2.40 to 2.60 | eyes | Snap down and to her right towards the LED (eye bones, about 18° down, 12° right) | ease-out-quint, fast |
| 2.52 to 3.00 | head | Follows the eyes: 12° down, 8° turn, 7° curious tilt | ease-out, 120 ms after the eyes |
| 2.65 to 3.10 | chest | Turns 5° towards the knob, weight starts shifting to her right foot | ease-in-out, slow |
| 3.00 to 3.15 | R shoulder | **Anticipation**: dips 1 cm and rolls back slightly | ease-in |
| 3.15 to 3.70 | R arm | Reach begins: the elbow lifts and leads, the wrist trails, the hand rises into the bottom of the frame | elbow ease-out; wrist on an arc, 80 ms behind |
| 3.15 to 3.70 | R hand | Relaxed open C (curl 0.25, spread 0.3), palm down and angled at the knob. **No pointing finger.** | — |
| 3.4 | camera | The reveal move begins (see shot 3) | — |

**Read:** in the reflection it looks as if she's reaching out of the glass towards us.

### Shot 3: REVEAL (3.4 to 5.3 s), one continuous move

**Macro:** the camera pulls out and around. It was a reflection: she's standing at a dead CRT, reaching for its knob.

**Camera:** one move. Truck right and dolly back along the glass to a 3/4 two-shot from her front-right.
Her real self is on the left, the monitor fills the right, and her reflection is still visible on the glass.
It starts slow (it begins under her reach), then the bulk of the move, then a long settle by 5.3: ease-in-out
weighted 35/65. FOV 46 to 38. The path is a single bezier with no pass-through keys.

| t | Part | Action | Curve |
|---|---|---|---|
| 3.4 to 4.6 | hips | Weight shifts right: hips move 6 cm right, her right knee softens 3 cm | ease-in-out |
| 3.5 to 4.8 | spine | Leans in and down to the right: pitch 9° forward, roll 5° | ease-out, 100 ms after hips |
| 3.6 to 4.6 | L arm | The left hand comes up and braces on the desk edge, fingers spread (her weight, so the lean is believable) | arc, lands at 4.6 with a 2-frame compress |
| 3.7 to 5.0 | R arm | The reach continues on an arc down to a pre-grip point 6 cm in front of the knob. The elbow stays bent about 25° and never locks straight. | ease-out; the wrist arrives 100 ms after the elbow settles |
| 4.2 to 5.0 | R hand | Opens wider on approach (spread 0.3 to 0.45, curl down to 0.15), then the fingertips start to close | ease-out |
| 3.8 to 5.3 | head and eyes | Locked on the knob, which makes the target obvious. The head follows the body down. | follow |
| 4.6 to 5.3 | hair, skirt | Swing from the lean and settle | spring |

**End pose (5.2):** leaning in with her left hand on the desk, the right hand hovering at the knob, eyes on it.
A clear silhouette.

### Shot 4: GRIP (5.3 to 6.4 s), cut to an insert close-up of the knob

**Macro:** a careful, precise grip. The robot is dexterous. (This replaces the finger-play showcase.)

**Camera:** hard **cut on action** as the fingers start to close. Low 3/4 macro on the chin of the monitor:
the knob on the right third, the red LED pulsing to its right, and her hand entering from top-left. FOV 30.
Locked, with a slow 1.5% push.

| t | Part | Action | Curve |
|---|---|---|---|
| 5.30 to 5.55 | R hand | Last 6 cm of travel. The hand decelerates into the knob, with the wrist leading. | ease-out-quint |
| 5.45 to 5.80 | fingers | Close one after another: index, middle, ring, then pinky, 50 ms apart, each overshooting by 0.05 curl | ease-out-back |
| 5.70 to 5.85 | thumb | Opposes last and pinches | ease-out |
| 5.85 to 5.95 | hand | **Contact settle**: pushes 3 mm in, the fingers compress slightly, then rebound 1 mm | spring |
| 5.95 to 6.40 | everything | **Hold**, the breath before the turn. The LED keeps pulsing. Her chest still breathes. | moving hold |

### Shot 5: CLICK (6.4 to 7.2 s), same insert

**Macro:** she turns it. The click.

| t | Part | Action | Curve |
|---|---|---|---|
| 6.40 to 6.55 | wrist | **Anticipation**: counter-turns −6° | ease-in |
| 6.55 to 6.75 | wrist and knob | Twists 70° | ease-in, fast; time slows to 0.6× across these 0.2 s (speed ramp) |
| 6.75 | knob | **Detent click.** The knob overshoots 5° then settles back over 0.12 s. | ease-out-back |
| 6.75 | LED | Red snaps to orange on the click frame | step |
| 6.75 to 6.78 | post | **Impact frame**: a 2-frame flash (inverted or blown out). The camera kicks 3 mm and decays over 0.2 s. | step, then damped |
| 6.75 | boot | `tb = T.led`: the screen begins its power-on | — |
| 6.78 to 7.2 | screen | The power-on glow spills into the insert from the top of frame | follows `T.power` |

### Shot 6: LIGHT (7.2 to 8.6 s), cut to her face, lit by the screen

**Macro:** the screen comes on and its light washes over her face. She straightens up and looks at it. Then we go in.

**Camera:** hard **cut**, frontal and slightly low, from just beside the screen's left edge looking back at
her (a dark background behind her). Medium close-up, FOV 38. Hold, then hand off to the boot.
**Light:** the screen's `RectAreaLight` is now her key: cold-white phosphor ramping up, her eyes still orange.
Keep the exposure under the hair blow-out (the known issue at 8.0 to 8.4 s).

| t | Part | Action | Curve |
|---|---|---|---|
| 7.20 to 7.50 | R hand | Fingers release in reverse order (pinky first, 40 ms apart) | ease-out |
| 7.35 to 8.00 | R arm | Hand returns on an arc to her chest, about 10 cm below the collar, and holds there (a "hand to heart" beat) | ease-out |
| 7.30 to 7.90 | L arm | Pushes off the desk, the weight comes back | ease-out |
| 7.35 to 8.10 | spine, hips | Straighten back to upright with a small overshoot back | ease-out-back, 80 ms after the push-off |
| 7.30 to 7.45 | eyes | Snap up to the screen | ease-out-quint |
| 7.40 to 7.90 | head | Lifts to the screen, slight wonder tilt | ease-out, 100 ms after the eyes |
| 7.6 | face | Lids widen 10% (`happy` morph at 0.2, if it reads) | ease-out |
| 8.0 to 8.6 | everything | Moving hold, the screen light flickering on her face as the boot text types | — |
| 8.6 | camera | Hand off to the boot: a whip-pan (or a match push) from her face onto the screen, then the existing dive | — |

## What's next (boot, unchanged)

From the click, the boot runs as it does now: wordmark, boot lines, snow, dive, merge, resolve.
The only change is the camera hand-off. `P0` / `L_END` (the start of the boot camera) become the end of
shot 6, not the knob close-up.

## Implementation notes (for the refilm)

- **New rig controls needed** in `robot-glb.js` (all of the bones exist in `robot.glb`):
  - `body({ hips, lean, roll, twist, breathe })`: hips offset, plus spine and chest pitch, roll and yaw, split across the spine chain.
  - `look(dir)`: the `LeftEye` / `RightEye` bones, so the eyes can lead the head.
  - `reachLeft(target)` and `gripLeft(...)`: an IK solve for the left arm, for the desk brace.
  - `shoulder(dip, roll)`: for the anticipation.
  - Springs on the `HairJoint-*` and `J_Sec_*Skirt*` chains: a simple damped spring per joint, driven by the parent's angular velocity. They must be scrub-safe, so they're simulated forward from t=0 at a fixed step when scrubbing.
- **Curves**: add `easeOutBack`, `easeOutQuint` and a damped `spring(t, freq, damping)`.
  Replace `lerpPose` with `arcPose(a, b, lift, k)`, which runs the wrist along a quadratic bezier whose midpoint is lifted.
- **Per-part offsets**: make the key tables data (`[t0, t1, from, to, curve]` per channel) so timing can be tuned
  in lil-gui and each joint gets its own offset.
- **Camera**: `SHOT` becomes a list of cuts. Each shot has its own start and end keys plus a curve; cuts are instant.
  The reveal is the only multi-key move.
- **Staging**: move `ROBOT_HOME` about 0.25 m right (closer to the knob), so the reach works with a lean and doesn't need a locked straight arm.
  Re-frame shot 1 to suit.
- **Speed ramp**: `master(t)` remaps time through a time-warp curve (0.6× from 6.55 to 6.75), so scrubbing still works.

## Total

The prologue goes from 9.0 s to about **8.6 s**, then the boot. There are 6 shots and 3 cuts
(after shot 3, shot 5 and at the end of shot 6), with one signature continuous move (the reveal).
