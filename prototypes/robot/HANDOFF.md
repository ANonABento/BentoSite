# Handoff: source the robot maid for the bentOS prologue

You're picking up one job on Kevin Jiang's portfolio site (`~/BentoSite`, Next.js 16, public repo `ANonABento/BentoSite`, branch `crt-site`): **find and prepare the 3D robot maid who boots the site in the intro.** Don't touch the site code or the rest of the intro yet; deliver a model that's ready to use, cleared to use, and approved by Kevin.

## The scene she's for
Prototype: `prototypes/crt-site/index.html` (three.js r181, served with `python3 -m http.server 4173` from the repo root → http://127.0.0.1:4173/prototypes/crt-site/). It plays as follows:
1. A dark room. All we see is her reflection in a CRT's dark glass. Her **eyes ignite** (glowing, flicker on), she tilts her head, blinks, and **reaches toward the glass**.
2. The camera pulls back past her head to over her shoulder: the first shot was the CRT's reflection.
3. Her **hand turns the TV's power knob**. A standby LED goes from red to orange.
4. The screen powers on and lights her from the front. She steps back and watches the boot play (the CRT boot from `prototypes/crt-boot/`).

The current robot (`prototypes/crt-site/robot.js`) is built in code from simple shapes. **Kevin rejected it: too cute and anime-like, not cinematic enough.** Keep its interface (`setEyes(glow, open)`, `reach(target)` IK, `aim(dir, up, twist)`, `grip(curl, spread)`, `headPivot`) as the contract the new model has to fill, so the prologue only needs a swap.

## What Kevin wants
- He **likes Battle Bunny Mods' robots**: **BBSeven Robot Maid** and its sister versions, plus **Z3** (https://booth.pm/en/items/6199701), and other Battle Bunny Mods (BB Interactive) robots. Their look: armoured robot chassis, maid details, neon or holographic eyes and visors, a game-quality toon finish.
- It must look **cinematic**: good in a dark close-up lit only by her own eyes, with a strong silhouette over the shoulder, and a hand that reads as dexterous robotics. He's a robotics engineer, so engineering detail matters.
- The site palette is a warm lacquer black (#0e0b0a), warm off-white (#f2ece2) and orange (#e8823f). Eyes ideally glow orange, or can be recoloured to orange.
- Works on the web: a GLB under about 5–8 MB after optimisation, ideally with a humanoid rig including fingers, and eye/visor meshes or materials that can be made to glow separately.

## Known Battle Bunny Mods options (check the live pages; terms change)
- BBSeven Robot Maid, ¥2,000, 14,998 tris, 12 expression shapes: https://booth.pm/en/items/2535410 · https://battlebunnymods.gumroad.com/l/BBSeven
- Z3 Robot, ¥3,500, 47k tris, FBX + Unity, 6 neon eye shapes, toggles including a headdress: https://booth.pm/en/items/6199701 — **flag to Kevin:** it's billed as a robot "Ellen Joe", a character from HoYoverse's *Zenless Zone Zero*. That makes it fan-art of a game company's IP, which is risky on a public portfolio even with the modeller's permission.
- Others: BBEight Tactical https://booth.pm/en/items/2581404 · BBX Royal https://booth.pm/en/items/2662143 · Regalia RG-1 https://booth.pm/en/items/2690342 · M4X1 https://battlebunnymods.gumroad.com/l/BBM4X1 · V15AGE https://battlebunnymods.gumroad.com/l/V15AGEMRD1 · shop https://battlebunnymods.gumroad.com
- Find the BBSeven "sister versions" Kevin means (other BB maid or robot variants) and list them with prices.

## The licence problem (blocking; solve it first)
Battle Bunny Mods' terms (BB Series and Z3) say:
- **No derivative works**, or only "model edits for personal use".
- **No commercial use or redistribution.**
- **Film, game, worlds and events need direct permission.**
- "Other platforms not supported."
- Z3 also: **no use with generative AI**.

A public website that serves the model file (even optimised) and shows it in a cinematic is **not covered**. Before Kevin buys anything:
1. Draft a short, friendly permission request to the creator **for Kevin to send himself.** Never send it yourself. Contacts:
   - BB Interactive Discord, "The Workshop": https://discord.gg/C3GqscJzPM
   - Twitter: @KamikazE_Chan, @E_ChanVR
   The request should cover:
   - The use: a non-commercial personal portfolio site, the model shown in a ~15s intro.
   - Recolouring, adding a maid headdress, posing and animating.
   - Serving an optimised GLB from the site, behind a Vercel Blob URL, not in the public repo, with credit.
   - Optionally a paid or custom licence.
2. Meanwhile, offer cleared alternatives in the same style, in case permission doesn't come:
   - A **commission** from Battle Bunny Mods or a similar BOOTH/Skeb/Fiverr/ArtStation artist, with a contract that allows web use.
   - Models with explicit permission for use outside VRChat. Read VN3 licences item by item.
   - **AI text-to-3D using Battle Bunny Mods only as mood reference**, never as input: Meshy, Tripo, Rodin, or HF TRELLIS.2 / Hunyuan3D-2.1. The scripts are in the old session's scratchpad; recreate them with Python 3.12 via `uv`, as Python 3.9's gradio_client is too old. Kevin's HF account is ANonABento, and its free ZeroGPU quota runs out quickly. Don't feed Battle Bunny Mods images into generators (Z3's terms ban it, and it's ethically shaky).
3. Never put a purchased or licensed model file in git, because the repo is public. Gitignore `prototypes/robot/vendor/` and keep vendor files there.

## Rules
- Kevin buys and makes accounts himself. Don't make purchases, create accounts, or send messages for him. Ask him to drop downloads into `prototypes/robot/vendor/`.
- Avoid fan-art of existing franchises (Murder Drones, NieR, Miku, ZZZ…) unless Kevin explicitly accepts the risk after you've flagged it.
- Commit small, frequent checkpoints on `crt-site`, with no Claude attribution in commits or PRs.
- Kevin is happy to see options before deciding. Show a contact sheet (thumbnails, price, licence summary, tris, rig/fingers yes/no, eye-glow-ready yes/no) and recommend one.

## Done when
1. Kevin has picked a model, and its use on the site is cleared in writing (creator permission or a licence that covers it) or it's something we made ourselves.
2. It's converted to an optimised GLB (`gltf-transform` with meshopt/draco + KTX2/WebP textures). The rig is checked (shoulder, elbow, wrist, finger bones; head/neck), eye meshes are split out or masked for emissive glow, and it's recoloured to the palette.
3. A turntable plus a dark eyes-only test render in `prototypes/crt-site/robot-viewer.html` (extend it to load the GLB), and the model plugged into the prologue behind the same interface as `robot.js`, with screenshots of the reflection close-up, the over-the-shoulder shot, and the hand on the knob.
4. A short note in `prototypes/robot/` covering the source, licence or permission, credit line, and where the file is hosted.

## Context files
- `prototypes/robot/concept-*.webp`: FLUX concepts (C, orange eyes, was the earlier target; Kevin now prefers the Battle Bunny Mods style)
- `prototypes/robot/sketchfab-candidates.jpg`: rejected CC-BY Sketchfab shortlist
- `prototypes/crt-site/robot.js`, `index.html`: current robot and prologue
- Memory: `~/.claude/projects/-Users-bentomac/memory/bentosite-v2-rebuild.md`
