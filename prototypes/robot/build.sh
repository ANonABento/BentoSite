#!/bin/sh
# Rebuild the temp robot maid: restyle in Blender, then optimise into the prototype.
set -e
cd "$(dirname "$0")"
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
"$BLENDER" -b --factory-startup -P blender/temp_maid.py
npx -y @gltf-transform/cli@4 optimize build/temp-maid.glb ../crt-site/assets/robot.glb \
  --compress meshopt --texture-compress webp --texture-size 1024
ls -la ../crt-site/assets/robot.glb
