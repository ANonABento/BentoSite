# Prologue script (v5)

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

v5 flow (agreed after v4; her point of view was cut because it broke the illusion): **one shot on her
reflection** until the reveal.

1. **Wake (0 to 2.3 s):** eyes strike, power-on lock, the head lifts in two servo steps.
2. **Glance down (2.35 to 3.2 s):** her eyes snap down, her head follows, and her hand comes up into the bottom of the frame.
3. **Finger wiggle (3.3 to 4.2 s):** quick and human. Two passes, thumb to pinky and back, twice, in under a
   second. They curl partway.
4. **Pointing stance (4.3 to 4.65 s):** index out, the rest fold one by one, the thumb tucks a little.
5. **The long reach (4.7 to 8.0 s):** she stands 1.2 m back; her arm extends to about 85% as she leans in.
   Her reflected hand travels forward and sinks below the glass.
6. **Her finger waits on the button (8.0 to 11.15 s)** while the camera backs away.
7. **The click (11.15 s):** once the camera has settled (anticipation, press, flash, kick, speed ramp). The LED goes
   orange, and the tube warms up for a second (`WARM`).
8. **She steps aside (12.5 to 13.8 s)** as the screen powers on and the boot plays.

**Camera: three smooth moves**, each from rest to rest, with no holds or kinks in between:
1. **Robot to screen (0.2 to 8.2 s, `TO_SCREEN`):** close on her reflected face for the wake, then one long, slow-starting
   move down to the glass's bottom edge, where her reflected finger and her real one meet at the button.
2. **Screen away (8.2 to 11.0 s, `AWAY`):** back, up and out to her right, then round over her shoulder (the reveal). She
   clicks once it settles at `P0`.
3. **Back into the TV (`placeCamera`, `INTO`):** from power-on, one push that creeps while the boot text plays and
   runs on into the dive, ending square on the glass.

**Board zoom (like the site's boot):** the dive lands on the board zoomed out to `INTRO_ZOOM` (0.4) of its fit zoom.
The pixels merge and denoise into cards across that wide view, then it glides in (`T.zoomIn`) as they resolve.

## Shading (anime / MToon-style)

The VRoid export mixed unlit materials (hair, clothes, eye whites: full brightness in any light, and exported
**without normals**) with lit PBR skin (black in the dark). That's why her skin went black while her hair glowed.
Everything except the iris now uses one toon material (`robot-glb.js`), modelled on MToon:
- **A 3-tone ramp** (`MeshToonMaterial` gradient map): a lit / shade step instead of a soft PBR falloff.
- **A shade floor** (`uAmb`): a small share of each material's own colour, so the shade side is tinted, never black.
- **A fresnel rim light** (`uRim`, `uRimColor`): a cool moon rim in the dark, then a bright screen halo after power-on.
- **Sphere normals on the face:** face normals are bent toward a sphere around her head, so the face shades as one
  soft shape. This is the standard anime face trick (on the final model, bake it as custom normals).
- **Missing normals** are computed on load for the parts that were exported unlit.
- **The moon is now a side key** from her left, so the ramp's edge falls across her face.

