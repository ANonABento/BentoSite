# Prologue script (v4)

> She is a **robot maid**. She doesn't breathe; she powers up, runs servos, locks into poses.
> The model is a temporary placeholder, so this script only describes motion and staging that will
> carry over to the final model. Material, hair and proportion tuning waits for that model.

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
| **Servo holds** | She is never fully frozen, but she doesn't breathe. While holding a pose, she makes tiny stepped micro-corrections (0.3 to 0.6° on the head or wrist, every 1 to 2 s, each a 60 ms snap). Hair and skirt springs come with the final model. |
| **Mechanical, not stiff** | Robot movement means precise and decisive moves that lock into place: a fast move, a tiny overshoot, then a hard stop. Never limp and never floaty. Organic beats (breath, sigh, hand to heart) are out. |
| **Strong key poses** | Each shot lands on one clear silhouette that holds for at least 0.3 s, so the eye can read it. |
| **Cut on action** | The camera either holds still with a slow drift or makes one decisive move. Change angle with a hard cut in the middle of a motion, never with a wander. One continuous move is allowed: the reveal. |
| **Impact frame** | At the click: a 2-frame flash or inversion, a small camera kick, and a short speed ramp. |
| **Light motivates** | The red standby LED is what she notices, so it pulses to draw the eye before she does. |


## Kevin's vision (the brief)

From the 2026-10-15 braindump, plus a note from later that day:

> starts with robot head waking up -> cute humanoid maid robot with japanese vibes opening glowing eyes in the dark
> -> dexterous hand reaching out towards screen -> next screen zooms out from the tv showing that the first screen
> was actually the reflection from the tv screen -> robot hand turns a knob or pushes a button -> tv starts powering on
> -> leads to the intro animation

> the hand reaching out to show the dexterity is longer on screen and the transition to reveal of it being
> reflection is cooler, hand should be reaching toward bottom of the screen

v4 flow (agreed after v3): keep the wake-up and the look down at her hand. Then cut to her point of view: her
hand, its dexterity, and the reach that **presses** the TV's power button. The camera pulls back out of her view
and over her shoulder, revealing that the first shot was the TV's reflection.

## Story in one line

A robot maid powers up in the dark, looks down at her hand, tests it, reaches for the dead CRT and presses its
power button. Pulling back, we see the face we opened on was her reflection in its glass. Then the screen comes on.

## Shot list (3 shots, 1 cut, one continuous move into the boot)

### Shot 1: WAKE (0.0 to 2.95 s), reflection close-up

**Macro:** total dark, then two orange eyes strike behind her bangs. She powers up and lifts her head.

**Camera:** locked on the glass, framing her face in the reflection, slightly left of centre (her eyes on
the upper third). FOV 46. A 2% push-in across the whole shot on linear time, so it never stops.
**Light:** the moon rim only, plus a faint red LED spill on the bottom of the frame.

| t | Part | Action | Curve |
|---|---|---|---|
| 0.0 | body | Powered down: head bowed 12°, spine slumped 4° forward, arms slack. Completely still (no idle). | — |
| 0.0 to 0.6 | LED | Red standby glow, slow pulse (1.4 s period) | sine |
| 0.60 to 0.95 | eyes | Ignition flicker (existing `FLICKER` keys) | step |
| 0.95 to 1.20 | lids | Open, with a 5% over-widen that settles back by 1.35 | ease-out-back |
| 1.10 to 1.30 | spine | **Power-on lock**: slump to upright in one quick snap, with a small overshoot back | ease-out-back |
| 1.30 to 1.55 | head | Lift, step 1: 12° to 5° | ease-out, hard stop |
| 1.70 to 1.95 | head | Lift, step 2: 5° to 0°, overshoot to −1° (chin up), settle | ease-out-back |
| 2.10 | lids | One shutter blink (0.14 s), like a camera calibrating | — |
| 2.0 on | servo idle | Starts | stepped |

| 2.35 to 2.50 | eyes | Snap down to her hand | ease-out-quint |
| 2.45 to 2.90 | head | Follows the eyes down, with a small curious tilt | ease-out, 100 ms after the eyes |
| 2.40 to 3.00 | R arm | Her hand rises into the bottom of the frame, palm up | ease-out, on an arc |

**Cut on the look (2.95 s):** she looks down at her hand, and we see what she sees.

### Shot 2: HAND (2.95 to about 5.6 s), her point of view

**Macro:** her own hand, seen through her eyes. She flexes it like she's checking its servos, then reaches for the
bottom of the TV and extends one finger toward the power button. The dexterity is the star of the shot.

**Camera:** at her eyes, just in front of the face (her bangs may frame the top edge), following her head, so her
servo micro-corrections become the camera's "handheld". Wide lens (FOV about 55). The glass ahead is dark and holds a
dim reflection: keep it dim so shot 1's surprise isn't spoiled.

| t | Part | Action | Curve |
|---|---|---|---|
| 2.95 to 3.30 | R hand | Finishes rising into the centre of the frame, palm toward her | ease-out |
| 3.35 to 4.00 | fingers | Ripple, index to pinky, each overshooting slightly | ease-out-back, 120 ms apart |
| 4.00 to 4.50 | fingers | Ripple back, pinky to index | same |
| 4.55 to 4.95 | thumb, index | Precision pinch, then they open | ease-out |
| 3.30 to 5.00 | wrist | Slow roll to show the palm, then the back | ease-in-out |
| 5.00 to 5.20 | eyes, head | Snap to the button (the camera pans first: her eyes lead) | ease-out-quint |
| 5.10 to 6.10 | R arm | Reaches down and right toward the button, on an arc, leaning in a little | ease-out |
| 5.40 to 5.80 | fingers | Index extends; middle, ring and pinky fold one by one (50 ms apart); thumb tucks | ease-out-back |

### Shot 3: PRESS + REVEAL (5.6 to 7.2 s), one continuous move

**Macro:** the camera pulls up and back out of her view, over her head and behind her right shoulder. Her head
and shoulder rise into the bottom of the frame, and the dark glass beyond holds her glowing-eyed reflection: the face we
opened on. Her finger presses the power button and the screen wakes.

| t | Part | Action | Curve |
|---|---|---|---|
| 5.60 to 7.20 | camera | Up over her head, then back over her right shoulder. Slow start, long settle. | skewed ease-in-out |
| 6.10 to 6.25 | R hand | **Anticipation**: the fingertip pulls back 1 cm | ease-in |
| 6.25 to 6.45 | R hand | **Press**: the button travels 8 mm | ease-in, at 0.6× (speed ramp) |
| 6.45 | everything | **Click**: the LED snaps from red to orange, a 2-frame inverted flash, a camera kick. The boot starts (`tb = T.led`). | step |
| 6.55 to 6.70 | button | Springs back | ease-out-back |
| 6.80 to 7.60 | R arm | Hand withdraws to her side | ease-out, on an arc |
| 6.9 to 7.6 | head | Lifts to watch the screen | ease-out |
| 6.45 to 7.4 | screen | Power-on glow. Her reflection dissolves into the boot screen as the glow takes over. | follows `T.power` |

## What's next (boot)

No cut. The boot camera (`P0`) starts from where the pull-back settles, then pulls back and dives as before. She steps
aside to her left before the dive, so she doesn't block it. The boot beats keep their original timing.

## Implementation notes

- The power knob becomes a push-button power switch (old CRTs had both). The volume knob stays.
- Her point of view: the camera sits just in front of her eyes (between the `LeftEye` and `RightEye` bones), so nothing
  needs hiding. The pull-back rises over her head rather than through it.
- Rig controls (already in `robot-glb.js`): `body`, `look`, `left.reach`, and a neck-relative head.
- Later, with the final model: hair and skirt springs, hair material.
