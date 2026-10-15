# Handoff: create the robot maid for the bentOS prologue

You're picking up one job on Kevin Jiang's portfolio site (`~/BentoSite`, Next.js 16, public repo `ANonABento/BentoSite`, branch `crt-site`): **make an original 3D robot maid who boots the site in the intro.** Kevin doesn't want to buy or license a model, so you build her. Don't touch the site code or the rest of the intro; deliver her as a web-ready, rigged model that Kevin has approved and that's plugged into the prototype.

## The scene she's for
Prototype: `prototypes/crt-site/index.html` (three.js r181, served with `python3 -m http.server 4173` from the repo root → http://127.0.0.1:4173/prototypes/crt-site/, `?t=<seconds>` opens paused at a moment). It plays as follows:
1. A dark room. All we see is her reflection in a CRT's dark glass. Her **eyes ignite** (glowing, flicker on), she tilts her head, blinks, and **reaches toward the glass**.
2. The camera pulls back past her head to over her shoulder: the first shot was the CRT's reflection.
3. Her **hand turns the TV's power knob**. A standby LED goes from red to orange.
4. The screen powers on and lights her from the front. She steps back and watches the boot play.

The current robot (`prototypes/crt-site/robot.js`) is built in code from simple shapes after a cute doll concept. **Kevin rejected it: too cute and anime-like, not cinematic enough.** Keep its interface as the contract the new model fills, so the prologue only needs a swap:
- `root`, `headPivot`, `head`, `hand`
- `setEyes(glow, open)`
- `reach(target)`: two-bone IK for the right arm, in robot-local space
- `aim(dir, up, twist)`
- `grip(curl, spread)`

## What Kevin wants
- **The look of Battle Bunny Mods' robots** (BOOTH/Gumroad VRChat avatars), for mood only:
  - BBSeven Robot Maid https://booth.pm/en/items/2535410 and its sister versions
  - Z3 https://booth.pm/en/items/6199701
  - BBEight https://booth.pm/en/items/2581404, BBX https://booth.pm/en/items/2662143, Regalia https://booth.pm/en/items/2690342
  - That style is an armoured hard-surface chassis, bevelled plates, panel lines, a visor or neon eyes, exposed mechanical joints, neon strips, maid details (headdress, apron and collar shapes made as armour), and a toon or game-asset finish.
- **Original design.** Same genre and feel, but don't copy their specific silhouettes, markings or visor shapes. Never feed their images into an AI generator (Z3's terms ban it). Use them only as reference you look at.
- **Cinematic:** strong in a dark close-up lit only by her own eyes or neon, a readable silhouette over the shoulder, and a hand that reads as dexterous robotics (servo knuckles, tendon or cable details). Kevin is a robotics engineer, so engineering detail matters.
- Palette: lacquer black (#0e0b0a), warm off-white ceramic or armour (#f2ece2), orange neon (#e8823f) for eyes and strips. A little gunmetal for joints.
- Web budget: a GLB of about 5 MB or less after optimisation, roughly 30–60k tris, few materials.

## Approach (agreed with Kevin)
Design around what can be built well from code. Hard-surface armour, a **visor face** (no sculpted human face), neon, and joints all come out crisp from bevels and cutouts. Avoid organic hair, cloth and faces.

1. **Blender, driven by Python scripts.** Blender is **not installed** (Apple M5 Mac, no Homebrew). **Ask Kevin before downloading it** from blender.org (free, about 350 MB, Apple Silicon build). After that, run it headless:
   ```
   /Applications/Blender.app/Contents/MacOS/Blender -b -P script.py
   ```
   - Keep the scripts in `prototypes/robot/blender/` so the model is fully reproducible from code. Commit the scripts.
   - Build with bevel and weighted-normal modifiers, booleans for panel cuts and vents, subdivision where it helps, mirror for symmetry, and a separate emissive material for eyes, visor and neon strips.
   - Rig: an armature with head and neck, right and left arm (shoulder, elbow, wrist), and **finger bones** (3 per finger plus a thumb). Rigid parts are parented to bones, which suits a robot better than skinning.
   - Render check images with Cycles or EEVEE at each stage (`prototypes/robot/renders/`): front, ¾, back, hand close-up, plus a **dark eyes-only render**. Read the PNGs to review your own work before showing Kevin.
   - Export a GLB.
2. **Optional hybrid** if the scripted head or torso isn't striking enough: write an original concept in this style and generate it with **FLUX.1-dev** on HF. Kevin's HF account is ANonABento, and its free ZeroGPU quota runs out after a few generations. Use Python 3.12 via `uv` (`uv venv -p 3.12`), since the system Python 3.9 gradio_client is too old. Then go image-to-3D with **TRELLIS.2 / Hunyuan3D-2.1** (HF Spaces), or Meshy/Tripo free tiers if Kevin makes an account. Clean the result up in Blender and attach your scripted rig and hand.
3. **Iterate visually with Kevin.** Show concept sheet → blockout → detailed model → in-scene shots. Get his OK at the blockout before detailing.

## Plugging her in
- Optimise the GLB with `npx @gltf-transform/cli optimize` (meshopt, WebP or KTX2), and put it at `prototypes/crt-site/assets/robot.glb`. It's our own work, so committing it is fine.
- Write `prototypes/crt-site/robot-glb.js` that loads it (GLTFLoader + MeshoptDecoder) and exposes the same interface as `robot.js`:
  - `reach` drives the arm bones with two-bone IK.
  - `grip` curls the finger bones.
  - `setEyes` drives the emissive intensity and a lid or shutter (or visor brightness).
- Make `index.html` and `robot-viewer.html` use it (`robot-viewer.html?view=front|side|back|hand|face&dark`).
- The prologue places her with world coordinates tuned to the old robot's size. Head centre is about (-0.15, 0.09, 0.85), she's about 0.45 units per head height, the right shoulder must reach the power knob at about (0.59, -0.67, 0.015), and the arm is about 0.97 units long. Scale her to match, or retune the constants `ROBOT_HOME`, `C0`, `C1`, `L1` and the pose targets in `prologue()`.
- Verify with screenshots at `?t=1.8` (reflection close-up), `3.7` (hand toward glass), `5.0` (pull back), `6.3` (hand on knob), `7.6` (lit by the screen). Gotcha already fixed: call `camera.updateMatrixWorld()` before rendering the reflection (see `renderReflection`). Chrome only renders background tabs on screenshot, so take a screenshot before reading values over JS.

## Rules
- Ask Kevin before any download, install, account or purchase. He has said he doesn't want to buy a model.
- Commit small, frequent checkpoints on `crt-site`, with no Claude attribution in commits or PRs.
- Don't run subagents (Kevin's global instruction).
- Keep any third-party or licensed files out of git (`prototypes/robot/vendor/` is gitignored).

## Done when
1. Kevin has approved her look (concept → blockout → final).
2. The scripts in `prototypes/robot/blender/` rebuild her, the GLB is optimised, the rig has working arm and finger bones, and the eyes and neon glow separately.
3. She's in the prologue behind the `robot.js` interface, with screenshots of the four key shots, and the turntable plus dark render in `robot-viewer.html`.
4. A short `prototypes/robot/README.md` explains how to rebuild and export her.

## Context files
- `prototypes/robot/concept-*.webp`: earlier FLUX concepts (cute doll direction, now superseded)
- `prototypes/robot/sketchfab-candidates.jpg`: rejected CC-BY Sketchfab shortlist
- `prototypes/crt-site/robot.js`, `index.html`, `robot-viewer.html`: current robot, prologue, viewer
- `prototypes/crt-boot/`: the CRT boot the prologue hands off to
- Memory: `~/.claude/projects/-Users-bentomac/memory/bentosite-v2-rebuild.md`
