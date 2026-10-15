"""Turn a CC0 VRoid sample (VRM 0.x) into a robot.glb candidate for the prologue.

    Blender -b --factory-startup -P prototypes/robot/blender/vroid_model.py -- <in.vrm> <out.glb>

Keeps the model's own hair and outfit; makes the skin porcelain, the irises emissive
orange, removes the mouth and brows, renames VRoid bones to the Mixamo names that
crt-site/robot-glb.js expects, and trims face morphs to blink / happy / irisOff.
VRoid samples: https://opengameart.org/content/vroid-studio-cc0-models (VRoid Hub
licence: modification, redistribution and commercial use allowed, no credit needed).
"""
import os
import sys
import shutil
import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import temp_maid as tm  # noqa: E402  (shared recolour / mouth tools)

SRC, OUT = sys.argv[-2], sys.argv[-1]

ROLE = [  # material-name fragment -> role (first match wins)
    # VRoid's mouth material also covers the chin, so it's kept and made plain porcelain
    ('FaceMouth', 'mouth'), ('FaceBrow', 'delete'),
    ('EyeIris', 'iris'), ('EyeWhite', 'eyewhite'),
    ('EyeHighlight', 'overlay'), ('FaceEyeline', 'overlay'), ('FaceEyelash', 'overlay'), ('EyeExtra', 'overlay'),
    ('Face_00_SKIN', 'face'), ('Body', 'skin'),
    ('HAIR', 'keep_hair'), ('CLOTH', 'keep_cloth'),
]

BONES = {'C_Hips': 'Hips', 'C_Spine': 'Spine', 'C_Chest': 'Spine1', 'C_UpperChest': 'Spine2',
         'C_Neck': 'Neck', 'C_Head': 'Head'}
for side, S in (('R', 'Right'), ('L', 'Left')):
    BONES.update({f'{side}_Shoulder': f'{S}Shoulder', f'{side}_UpperArm': f'{S}Arm',
                  f'{side}_LowerArm': f'{S}ForeArm', f'{side}_Hand': f'{S}Hand',
                  f'{side}_UpperLeg': f'{S}UpLeg', f'{side}_LowerLeg': f'{S}Leg', f'{side}_Foot': f'{S}Foot'})
    for f, F in (('Index', 'Index'), ('Middle', 'Middle'), ('Ring', 'Ring'), ('Little', 'Pinky'), ('Thumb', 'Thumb')):
        for i in (1, 2, 3):
            BONES[f'{side}_{f}{i}'] = f'{S}Hand{F}{i}'


def role_of(name):
    return next((r for frag, r in ROLE if frag in name), 'keep')


def eye_keys(face):
    """Find blink / happy / irisOff among VRoid's unnamed morphs by what they move."""
    me = face.data
    n = len(me.vertices)
    def co(kb):
        a = np.empty(n * 3); kb.data.foreach_get('co', a); return a.reshape(-1, 3)
    base = co(me.shape_keys.key_blocks[0])
    def verts(frag):
        return np.array(sorted({v for p in me.polygons if frag in me.materials[p.material_index].name for v in p.vertices}))
    line, iris, mouth = verts('FaceEyeline'), verts('EyeIris'), verts('FaceMouth')
    x = base[:, 0]
    scores = []
    for kb in me.shape_keys.key_blocks[1:]:
        d = np.linalg.norm(co(kb) - base, axis=1)
        L, R = d[line][x[line] > 0].mean(), d[line][x[line] < 0].mean()
        scores.append((kb.name, L, R, d[iris].mean() if len(iris) else 0, d[mouth].mean() if len(mouth) else 0))
    both = [s for s in scores if s[1] > 0.004 and abs(s[1] - s[2]) < 0.1 * s[1] and s[4] < 0.0005]
    both.sort(key=lambda s: -s[1])
    iris_only = sorted([s for s in scores if s[3] > 0.01 and s[1] < 0.0005], key=lambda s: -s[3])
    keep = {}
    if both: keep[both[0][0]] = 'blink'
    if len(both) > 1: keep[both[1][0]] = 'happy'
    if iris_only: keep[iris_only[0][0]] = 'irisOff'
    print('eye_keys:', keep)
    return keep


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    tmp = OUT + '.src.glb'
    shutil.copy(SRC, tmp)
    bpy.ops.import_scene.gltf(filepath=tmp)
    os.remove(tmp)
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and not o.data.materials:
            bpy.data.objects.remove(o)                     # stray helper meshes (e.g. 'Icosphere')
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for b in arm.data.bones:
        key = b.name.replace('J_Bip_', '')
        if key in BONES:
            b.name = BONES[key]
        elif b.name == 'J_Adj_R_FaceEye':
            b.name = 'RightEye'
        elif b.name == 'J_Adj_L_FaceEye':
            b.name = 'LeftEye'

    face = next(o for o in bpy.data.objects if o.type == 'MESH' and any('FaceMouth' in m.name for m in o.data.materials))
    keep = eye_keys(face)
    me = face.data
    box = tm.region_of(me, 'FaceMouth')
    kill = [i for i, m in enumerate(me.materials) if role_of(m.name) == 'delete']
    bpy.context.view_layer.objects.active = face
    for o in bpy.data.objects: o.select_set(o == face)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    for i in kill:
        face.active_material_index = i
        bpy.ops.object.material_slot_select()
    bpy.ops.mesh.delete(type='FACE')
    bpy.ops.object.mode_set(mode='OBJECT')
    for i in sorted(kill, reverse=True):
        face.active_material_index = i
        bpy.ops.object.material_slot_remove()
    # No smoothing here: VRoid lips join an inner mouth cavity, and pulling them flat drags the chin
    # into the head. The mouth is mostly painted, so a plain porcelain material is enough.
    for kb in list(me.shape_keys.key_blocks)[1:]:
        if kb.name in keep: kb.name = keep[kb.name]
        else: face.shape_key_remove(kb)

    # materials: porcelain skin, orange emissive iris, dark lashes; the rest keeps its look
    done = set()
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        for m in o.data.materials:
            if m is None or m.name in done: continue
            done.add(m.name)
            role = role_of(m.name)
            tex = next((n for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None) if m.use_nodes else None
            if role == 'mouth':
                flat = bpy.data.images.new(f'B01_{m.name}', 4, 4)
                flat.pixels.foreach_set(np.tile(np.r_[tm.PORCELAIN ** 2.2 * 0.92, 1.0], 16).astype(np.float32))
                flat.pack()
                tm.build_material(m, flat, 'face')
            elif role in ('skin', 'face', 'iris', 'overlay') and tex:
                tm.build_material(m, tm.recolour_image(tex.image, role, f'B01_{m.name}'), role)
            elif role.startswith('keep_'):
                m.name = f'B01_{role[5:]}_{m.name}'          # 'hair' / 'cloth' tags for the loader

    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_skins=True, export_morph=True,
                              export_morph_normal=False, export_animations=False, export_yup=True)
    print('WROTE', OUT, os.path.getsize(OUT))


main()
