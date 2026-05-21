# Launch Asset Requests

Generated: current content snapshot

This report is generated from `npm run launch:audit:json`. It lists the real Kevin-owned assets still needed before strict launch readiness can pass.

## Summary

- Blocking launch gaps: 0
- Projects: 21
- Photos: 12
- Talking points: 8

## Requests

No launch asset requests are open.

## Deferred Model Opportunities

### Kenesis — AR Gesture Controlled Robot

- Project ID: `ar-gesture-robot`
- Destination: `public/models/ar-gesture-robot/main.<ext>`
- Reason: Hardware/robotics/VR projects can ship with rich image coverage, but should get real CAD or 3D models in a later asset pass.
- Note: Checked linked GitHub repo `KushalPraja/kenesis`; no viewer-compatible `.glb`, `.gltf`, or `.stl` files were present.
- Note: Need a real robot assembly/export from Kevin or a source-controlled CAD export.
- Command: `npm run add:model -- --project ar-gesture-robot --src <path-to-real-model.glb-or-stl> --sync`

### Expressive AI Robot Head

- Project ID: `expressive-ai-robot-head`
- Destination: `public/models/expressive-ai-robot-head/main.<ext>`
- Reason: Hardware/robotics/VR projects can ship with rich image coverage, but should get real CAD or 3D models in a later asset pass.
- Note: Checked linked GitHub repo `MaidReal/Head`; no viewer-compatible `.glb`, `.gltf`, or `.stl` files were present.
- Note: Need a real head/mechanism CAD export from Kevin or the original design files.
- Command: `npm run add:model -- --project expressive-ai-robot-head --src <path-to-real-model.glb-or-stl> --sync`

### PCB Design & Assembly

- Project ID: `pcb-design`
- Destination: `public/models/pcb-design/main.<ext>`
- Reason: Hardware/robotics/VR projects can ship with rich image coverage, but should get real CAD or 3D models in a later asset pass.
- Note: No source repository or downloadable CAD link is currently listed in project content.
- Note: Need a real board/mechanical export from Kevin, preferably `.glb` or `.stl`.
- Command: `npm run add:model -- --project pcb-design --src <path-to-real-model.glb-or-stl> --sync`

### VR Haptic Gloves

- Project ID: `vr-haptic-gloves`
- Destination: `public/models/vr-haptic-gloves/main.<ext>`
- Reason: Hardware/robotics/VR projects can ship with rich image coverage, but should get real CAD or 3D models in a later asset pass.
- Note: No source repository or downloadable CAD link is currently listed in project content.
- Note: Need a real glove/mechanism model export from Kevin, preferably `.glb` or `.stl`.
- Command: `npm run add:model -- --project vr-haptic-gloves --src <path-to-real-model.glb-or-stl> --sync`

### FIRST Tech Challenge — Team Devolotics

- Project ID: `ftc-robotics`
- Destination: `public/models/ftc-robotics/main.<ext>`
- Reason: Hardware/robotics/VR projects can ship with rich image coverage, but should get real CAD or 3D models in a later asset pass.
- Note: Checked linked GitHub repo `ANonABento/19498-Devolotics-Centerstage-2023-2024`; no viewer-compatible `.glb`, `.gltf`, or `.stl` files were present.
- Note: Need a real robot CAD/export from Kevin or the team CAD source.
- Command: `npm run add:model -- --project ftc-robotics --src <path-to-real-model.glb-or-stl> --sync`

## Current Findings

### Projects missing hero/thumbnail

- none

### Projects with no rich media at all

- none

### Featured projects with thin media

- none

### Deferred hardware/robotics/VR projects without 3D modelPath

- ar-gesture-robot (Kenesis — AR Gesture Controlled Robot)
- expressive-ai-robot-head (Expressive AI Robot Head)
- pcb-design (PCB Design & Assembly)
- vr-haptic-gloves (VR Haptic Gloves)
- ftc-robotics (FIRST Tech Challenge — Team Devolotics)

### Projects with short/missing long descriptions

- none

### Global launch gaps needing Kevin/assets

- none

