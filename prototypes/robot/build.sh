#!/bin/sh
# Rebuild the placeholder robot (VRoid AvatarSample D Darkness): restyle in Blender, optimise into the prototype.
# Needs vendor/vroid/avatarsample_d_darkness/ (see README).
set -e
cd "$(dirname "$0")"
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
"$BLENDER" -b --factory-startup -P blender/vroid_model.py -- \
  "$PWD/vendor/vroid/avatarsample_d_darkness/AvatarSample_D_Darkness.vrm" "$PWD/build/robot.glb"
npx -y @gltf-transform/cli@4 optimize build/robot.glb ../crt-site/assets/robot.glb \
  --compress meshopt --texture-compress webp --texture-size 1024
ls -la ../crt-site/assets/robot.glb
