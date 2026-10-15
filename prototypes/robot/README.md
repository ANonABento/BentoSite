# Robot maid (B-01)

## Current: temp model
A stand-in until the original B-01 is made. It's **"Maid Character" by 413 Games**
(https://413games.itch.io/maid-character, CC0 1.0, so modifying and committing it is fine; credit is optional).

`blender/temp_maid.py` restyles it to the B-01 palette:
- the pink dress becomes lacquer black, the hair gloss black and the skin porcelain;
- the irises become emissive orange;
- the mouth and brows are removed (mouth hole capped, lips smoothed flat);
- the shape keys are cut down to `blink`, `happy` and `irisOff`.

### Rebuild
1. Download the itch.io zip and unzip it into `vendor/maid413/` (gitignored), so that `vendor/maid413/Maid.fbx` and `vendor/maid413/Textures/` exist.
2. Run `./build.sh`. It needs Blender 5.2 at `/Applications/Blender.app` (override with `BLENDER=`) and npx.
   - It writes `build/temp-maid.glb` (gitignored) and the check renders `renders/temp-*.png`.
   - It then optimises the GLB (meshopt, WebP, 1024px textures) into `../crt-site/assets/robot.glb`, about 420 KB and 26k tris.

### In the prototype
`../crt-site/robot-glb.js` exposes `loadRobot()`, which returns the same interface as `robot.js`:

| Member | What it does |
|---|---|
| `reach(target)` | Two-bone IK on `RightArm`/`RightForeArm` (rest hinge +y, pole as before). |
| `aim(dir, up, twist)` | Orients `RightHand` so the fingers point along `dir` and the back of the hand faces `up`. |
| `grip(curl, spread, thumb)` | Curls the 3 finger bones of each finger and the 3 thumb bones about axes measured from the rest pose. |
| `setEyes(glow, open)` | Iris emissive intensity, plus the `blink` morph. |
| `headPivot` | A stand-in Object3D. Rotating it rotates the `Head` bone in the robot-local frame. |

It also scales the model so shoulder-to-wrist is 0.97 and places the head centre at y=0.59 in the old robot's frame. That means the prologue (`ROBOT_HOME`, the `SHOT` camera keys and the pose targets in `prologue()`) works with any model fitted this way.

`index.html?robot=shapes` and `robot-viewer.html?model=shapes` bring back the procedural robot.

## Candidates: VRoid samples
- `assets/robot-v1.glb` is AvatarSample D.
- `assets/robot-v2.glb` is AvatarSample D Darkness.

Both are CC0 VRoid samples (https://opengameart.org/content/vroid-studio-cc0-models). Their licence allows modification, redistribution and commercial use, with no credit needed.

Try them with `crt-site/?model=v1` or `?model=v2`; `robot-viewer.html` takes the same `?model=`.

Build either one with:
`Blender -b --factory-startup -P blender/vroid_model.py -- vendor/vroid/<dir>/<file>.vrm build/v1.glb`
Then optimise it the same way as `build.sh` does.

The script keeps their hair and outfit and makes the skin porcelain. It gives the eyes an emissive orange iris, removes the brows and paints out the mouth. It also renames VRoid bones to Mixamo names and finds the blink/happy/irisOff morphs automatically.

## Concept work
`concept/`: scripted SVG sheets.
- `sheet-v1` is the rejected visor mech.
- `sheet-v2` is the porcelain-doll direction.
- `options-v1` covers eyes, hair, face marks and body.

Render any of them with headless Chrome:
`--headless --screenshot --window-size=2400,1500 <file>.html`.
