# Robot maid (B-01)

## Current: CC0 VRoid sample E, restyled
`crt-site/assets/robot-maid.glb` (about 620 KB) is VRoid's CC0 AvatarSample E run through `blender/vroid_maid.py`:
- `vroid_model.py`'s conversion: bones renamed to Mixamo names, porcelain skin, emissive orange iris, no mouth;
- the hair recoloured black and the outfit black, white and orange;
- rigid robot hardware, each part parented to one bone: ear units with antennae, a frill headdress, neck rings,
  elbow, wrist and knee joints, and segmented robot hands (the skin hands are removed).

Rebuild:
```
unzip vendor/vroid/avatarsample_e.zip -d vendor/explore/e_src
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P blender/vroid_maid.py -- \
  vendor/explore/e_src/AvatarSample_E.vrm ../crt-site/assets/x-vroid-e.glb
cd ../crt-site && npx @gltf-transform/cli optimize assets/x-vroid-e.glb assets/robot-maid.glb \
  --compress meshopt --texture-compress webp --texture-size 1024 --join false
```

### Other bases
`MAID_CLOTH=generic` makes `vroid_maid.py` recolour any outfit: its main colour goes black, other colours orange,
light neutrals white. `renders/bases.png` compares the CC0 samples D, Sendagaya Shino, F, G, D Darkness and Sakurada
Fumiriya restyled this way against E (2026-10-31; E stays for now).

## Earlier: placeholder model
**VRoid AvatarSample D Darkness**, a CC0 VRoid sample (https://opengameart.org/content/vroid-studio-cc0-models). Its VRoid Hub licence allows modification, redistribution and commercial use, with no credit needed.

`blender/vroid_model.py` turns the VRM into `crt-site/assets/robot.glb`. It:
- keeps her own hair and outfit;
- makes the skin porcelain;
- gives the eyes an emissive orange iris;
- removes the brows and paints the mouth out (the lips can't be smoothed flat; see the script);
- renames VRoid bones to Mixamo names;
- finds the blink/happy/irisOff morphs automatically.

The result is about 625 KB.

`blender/temp_maid.py` is the earlier placeholder (413 Games' CC0 maid). It also holds the shared recolour and mouth tools that `vroid_model.py` imports.

### Rebuild
1. Download `avatarsample_d_darkness.zip` from the link above and unzip it into `vendor/vroid/avatarsample_d_darkness/` (gitignored).
2. Run `./build.sh`. It needs Blender 5.2 at `/Applications/Blender.app` (override with `BLENDER=`) and npx.

Reference renders are `renders/front.png`, `face.png`, `dark.png` and `prologue-contact.png` (the prologue at key times).

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

## Concept work
`concept/`: scripted SVG sheets.
- `sheet-v1` is the rejected visor mech.
- `sheet-v2` is the porcelain-doll direction.
- `options-v1` covers eyes, hair, face marks and body.

Render any of them with headless Chrome:
`--headless --screenshot --window-size=2400,1500 <file>.html`.
