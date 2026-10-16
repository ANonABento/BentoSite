# Robot maid: local generation pipeline (2026-10-16)

Everything runs on the Mac with no Hugging Face quota. Large files live in `prototypes/robot/vendor/hf/local/`, which is gitignored.

1. **Concepts:** run `hf/local/batch.sh`. It uses mflux with FLUX.2 Klein 4B (Apache 2.0, ungated) and the prompts `prompt-b.txt` and `prompt-b2.txt`. Each image takes about 1 minute. FLUX.1-dev and Klein 9B are gated, and Kevin hasn't accepted their licences.
2. **3D:** run `mlx-spatial-trellis2 generate-textured`, the TRELLIS.2 8-bit MLX port (appautomaton/trellis2-mlx-8bit), with the `1024_cascade` pipeline. Each model takes about 15–18 minutes and comes out at about 196k triangles and 13 MB, unrigged. The bundled RMBG-2.0 background remover is licensed for non-commercial use only.
3. **Face fix:** `blender -b -P hf/fix_face.py -- in.glb out.glb` smooths the nose, paints out the old eye blobs, and adds separate anime-eye decal meshes (`EyeL` and `EyeR`, which have an emissive iris for glow and blink). The eye centre and size are hand-tuned for s377.
4. **Renders:** `blender -b -P hf/turn.py -- model.glb out-prefix` renders front, ¾, side, back and two face close-ups.

Results: `renders/concepts-level-b.png` (14 concepts), `renders/trellis-local-4.png` (4 models), `renders/s377-turnaround.png` and `renders/s377-face-fix.png`.
The StdGEN and CharacterGen Spaces were down (runtime error), and running them locally needs CUDA.
