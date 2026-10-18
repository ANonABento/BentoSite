# Build the site's robot GLB from the cleaned t3 model (clean_t3.py): one TRELLIS mesh plus two eye decals.
# Same recipe as build_robot.py: decimate (face kept whole), the eye rings split out as an emissive "Iris" overlay so
# the prologue can light and dim them, a Mixamo-named skeleton fitted to her slices, proximity skinning.
# Usage: blender -b -P build_t3.py -- t3e-clean.glb out.glb
import bpy, bmesh, sys, numpy as np, mathutils
glb, out = sys.argv[sys.argv.index('--') + 1:][:2]
V = mathutils.Vector

bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in meshes: o.data.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
body = max(meshes, key=lambda o: len(o.data.vertices)); body.name = 'Body'
eyes = [o for o in meshes if o is not body]
for m in body.data.materials:
    if not m.name.startswith('Face'): m.name = 'Body'
def coords(o): return np.array([v.co[:] for v in o.data.vertices])
def blur(m, k):
    for ax in (0, 1):
        c = np.cumsum(np.pad(m, [(k + 1, k) if i == ax else (0, 0) for i in range(m.ndim)], mode='edge'), axis=ax)
        m = (np.take(c, range(2 * k + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * k - 1), axis=ax)) / (2 * k + 1)
    return m

# ---------- eyes: rings → dark glass on the decals; the glow goes on an Iris overlay a hair in front ----------
em = eyes[0].data.materials[0]; em.name = 'EyeGlass'
eimg = [n for n in em.node_tree.nodes if n.type == 'TEX_IMAGE' and 'emit' not in n.image.name][0].image
EW, EH = eimg.size; ep = np.array(eimg.pixels[:]).reshape(EH, EW, 4)
r, g, b = ep[..., 0], ep[..., 1], ep[..., 2]
glow = np.clip(blur(((r > 0.5) & (r - b > 0.3)).astype(float), 2) * 1.6, 0, 1) * ep[..., 3]
ep[..., :3] = ep[..., :3] * (1 - glow[..., None]) + np.array([0.03, 0.025, 0.025]) * glow[..., None]
eimg.pixels = ep.ravel().tolist(); eimg.pack()
for n in list(em.node_tree.nodes):
    if n.type == 'TEX_IMAGE' and 'emit' in n.image.name: em.node_tree.nodes.remove(n)
em.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0
grgba = np.zeros((EH, EW, 4)); grgba[..., :3] = [1.0, 0.55, 0.18]; grgba[..., 3] = glow
gimg = bpy.data.images.new('iris_glow', EW, EH, alpha=True); gimg.pixels = grgba.ravel().tolist(); gimg.pack()
im_m = bpy.data.materials.new('Iris'); im_m.use_nodes = True; nt = im_m.node_tree; bs = nt.nodes['Principled BSDF']
try: im_m.surface_render_method = 'BLENDED'
except Exception: pass
tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = gimg; tx.extension = 'CLIP'
nt.links.new(tx.outputs['Color'], bs.inputs['Base Color']); nt.links.new(tx.outputs['Alpha'], bs.inputs['Alpha'])
nt.links.new(tx.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 1.0
iris_objs = []
for e in eyes:
    d = e.data.copy(); d.materials.clear(); d.materials.append(im_m)
    for v in d.vertices: v.co.y -= 0.0004
    io = bpy.data.objects.new('Iris' + e.name[-1], d); bpy.context.scene.collection.objects.link(io); iris_objs.append(io)

# ---------- lighter mesh for the web: the face keeps its full detail (its projected UVs garble when collapsed) ----------
fidx = [i for i, m in enumerate(body.data.materials) if m.name.startswith('Face')][0]
keep = set(k for p in body.data.polygons if p.material_index == fidx for k in p.vertices)
vg = body.vertex_groups.new(name='decimate'); vg.add([i for i in range(len(body.data.vertices)) if i not in keep], 1.0, 'REPLACE')
d = body.modifiers.new('dec', 'DECIMATE'); d.ratio = 0.35; d.vertex_group = 'decimate'
bpy.context.view_layer.objects.active = body; body.select_set(True); bpy.ops.object.modifier_apply(modifier='dec'); body.select_set(False)
body.vertex_groups.clear()
print('body tris', sum(len(p.vertices) - 2 for p in body.data.polygons))

# ---------- skeleton (Blender: Z up, she faces -Y, her right is -X), joints from slices of the mesh ----------
bc = coords(body)
def ymid(x, z, r=0.02):
    s = (np.abs(bc[:, 0] - x) < r) & (np.abs(bc[:, 2] - z) < r)
    return float(bc[s, 1].mean()) if s.any() else 0.0
yc = ymid(0, 0.05, 0.05)
J = {'Hips': V((0, yc, -0.07)), 'Spine': V((0, yc, 0.0)), 'Spine1': V((0, yc, 0.07)), 'Spine2': V((0, yc, 0.15)),
     'Neck': V((0, ymid(0, 0.3, 0.015), 0.29)), 'Head': V((0, ymid(0, 0.335, 0.015), 0.33)), 'HeadTop_End': V((0, 0.0, 0.52))}
ecs = sorted([coords(e).mean(0) for e in eyes], key=lambda c: c[0])           # [her right (-x), her left]
for side, sx in (('Left', 1), ('Right', -1)):
    J[f'{side}Shoulder'] = V((0.03 * sx, ymid(0.03 * sx, 0.26), 0.26))
    J[f'{side}Arm'] = V((0.108 * sx, ymid(0.108 * sx, 0.235), 0.235))
    J[f'{side}ForeArm'] = V((0.127 * sx, ymid(0.127 * sx, 0.115, 0.015), 0.115))
    J[f'{side}Hand'] = V((0.172 * sx, ymid(0.172 * sx, 0.0, 0.012), 0.0))
    J[f'{side}HandTip'] = V((0.188 * sx, ymid(0.186 * sx, -0.06, 0.012), -0.075))
    J[f'{side}UpLeg'] = V((0.055 * sx, yc, -0.09)); J[f'{side}Leg'] = V((0.062 * sx, ymid(0.062 * sx, -0.27), -0.27))
    J[f'{side}Foot'] = V((0.075 * sx, ymid(0.075 * sx, -0.43), -0.43)); J[f'{side}ToeBase'] = V((0.08 * sx, ymid(0.08 * sx, -0.49) - 0.04, -0.49))
    c = ecs[1 if sx > 0 else 0]; J[f'{side}Eye'] = V((c[0], c[1] + 0.02, c[2]))

ad = bpy.data.armatures.new('Armature'); arm = bpy.data.objects.new('Armature', ad); bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; arm.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
eb = ad.edit_bones
def bone(name, head_, tail_, parent=None):
    b = eb.new(name); b.head = head_; b.tail = tail_ if (tail_ - head_).length > 1e-4 else head_ + V((0, 0, 0.01))
    if parent: b.parent = eb[parent]
    return b
bone('Hips', J['Hips'], J['Spine'])
bone('Spine', J['Spine'], J['Spine1'], 'Hips'); bone('Spine1', J['Spine1'], J['Spine2'], 'Spine')
bone('Spine2', J['Spine2'], J['Neck'], 'Spine1'); bone('Neck', J['Neck'], J['Head'], 'Spine2')
bone('Head', J['Head'], J['HeadTop_End'], 'Neck'); bone('HeadTop_End', J['HeadTop_End'], J['HeadTop_End'] + V((0, 0, 0.02)), 'Head')
for side, sx in (('Left', 1), ('Right', -1)):
    bone(f'{side}Eye', J[f'{side}Eye'], J[f'{side}Eye'] + V((0, -0.02, 0)), 'Head')
    bone(f'{side}Shoulder', J[f'{side}Shoulder'], J[f'{side}Arm'], 'Spine2')
    bone(f'{side}Arm', J[f'{side}Arm'], J[f'{side}ForeArm'], f'{side}Shoulder')
    bone(f'{side}ForeArm', J[f'{side}ForeArm'], J[f'{side}Hand'], f'{side}Arm')
    W_, Tp = J[f'{side}Hand'], J[f'{side}HandTip']
    dd = (Tp - W_).normalized(); L = (Tp - W_).length
    bone(f'{side}Hand', W_, W_ + dd * L * 0.45, f'{side}ForeArm')
    for f, off in (('Index', -0.009), ('Middle', -0.003), ('Ring', 0.003), ('Pinky', 0.009)):
        base = W_ + dd * L * 0.45 + V((0, off, 0)); seg = L * (0.55 if f != 'Pinky' else 0.45) / 3; p = f'{side}Hand'
        for i in (1, 2, 3):
            n = f'{side}Hand{f}{i}'; bone(n, base + dd * seg * (i - 1), base + dd * seg * i, p); p = n
    tb = W_ + dd * L * 0.2 + V((0, -0.012, 0)) + V((-0.006 * sx, 0, 0)); td = (dd + V((0, -0.8, 0))).normalized(); p = f'{side}Hand'
    for i in (1, 2, 3):
        n = f'{side}HandThumb{i}'; bone(n, tb + td * 0.012 * (i - 1), tb + td * 0.012 * i, p); p = n
    bone(f'{side}UpLeg', J[f'{side}UpLeg'], J[f'{side}Leg'], 'Hips'); bone(f'{side}Leg', J[f'{side}Leg'], J[f'{side}Foot'], f'{side}UpLeg')
    bone(f'{side}Foot', J[f'{side}Foot'], J[f'{side}ToeBase'], f'{side}Leg')
    bone(f'{side}ToeBase', J[f'{side}ToeBase'], J[f'{side}ToeBase'] + V((0, -0.02, 0)), f'{side}Foot')
segs = {b.name: (np.array(b.head[:]), np.array(b.tail[:])) for b in eb}
bpy.ops.object.mode_set(mode='OBJECT'); arm.select_set(False)

# ---------- skinning: proximity to allowed bones per region ----------
def seg_dist(P, a, b):
    ab = b - a; t = np.clip(((P - a) @ ab) / max(ab @ ab, 1e-12), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
def skin(o, groups):
    """groups: list of (vertex mask, [bone names]); weights ~ 1/d^4 among the allowed bones, top 3 kept."""
    P = coords(o)
    for b in segs: o.vertex_groups.new(name=b)
    for mask, names in groups:
        idx = np.where(mask)[0]
        if not len(idx): continue
        D = np.stack([seg_dist(P[idx], *segs[n]) for n in names], 1)
        Wt = 1.0 / (D ** 4 + 1e-12)
        top = np.argsort(-Wt, 1)[:, 3:]; np.put_along_axis(Wt, top, 0, 1)
        Wt /= Wt.sum(1, keepdims=True)
        for j, n in enumerate(names):
            vg_ = o.vertex_groups[n]
            for i, w in zip(idx, Wt[:, j]):
                if w > 0.01: vg_.add([int(i)], float(w), 'REPLACE')
    mod = o.modifiers.new('Armature', 'ARMATURE'); mod.object = arm; o.parent = arm
P = coords(body); x, y, z = P.T
fingers = lambda s: [f'{s}Hand{f}{i}' for f in ('Index', 'Middle', 'Ring', 'Pinky', 'Thumb') for i in (1, 2, 3)]
NV = np.array([v.normal[:] for v in body.data.vertices])
def closest(P_, a, b):
    ab = b - a; t_ = np.clip(((P_ - a) @ ab) / max(ab @ ab, 1e-12), 0, 1); return a + t_[:, None] * ab
def arm_mask(sx):
    # upper arm: clear of the torso from z 0.08 to the shoulder. Lower down the forearm and hand touch the skirt, so a
    # point near the forearm / hand bones is arm only if its normal points away from that bone more than away from
    # her body axis (skirt surface faces out from the body, arm surface out from the arm)
    S_ = 'Left' if sx > 0 else 'Right'
    a = (sx * x > 0.08) & (z > 0.08) & (z < 0.27) & (sx * x > 0.075 + (0.27 - z) * 0.05)
    fa, hd = segs[f'{S_}ForeArm'], (segs[f'{S_}Hand'][0], np.array(J[f'{S_}HandTip'][:]))
    cf, ch = closest(P, *fa), closest(P, *hd)
    df, dh = np.linalg.norm(P - cf, axis=1), np.linalg.norm(P - ch, axis=1)
    c_ = np.where((df < dh)[:, None], cf, ch); dn = np.minimum(df, dh)
    da = (P - c_) / np.maximum(dn, 1e-9)[:, None]
    rad = P.copy(); rad[:, 2] = 0; rad /= np.maximum(np.linalg.norm(rad, axis=1), 1e-9)[:, None]
    armish = (NV * da).sum(1) > (NV * rad).sum(1)
    lateral = (P[:, 0] - c_[:, 0]) * sx > 0                          # the outer half of the arm never touches the skirt
    return (sx * x > 0) & (a | ((z <= 0.08) & ((dn < 0.019) | ((dn < 0.032) & (armish | lateral)))))
armL, armR = arm_mask(1), arm_mask(-1)
legs = (z < -0.1) & ~armR & ~armL
head = (z > 0.315) & ~armR & ~armL
torso = ~armR & ~armL & ~legs & ~head
skin(body, [
    (armR, ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'] + fingers('Right')),
    (armL, ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand'] + fingers('Left')),
    (legs & (x < 0), ['RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'Hips']),
    (legs & (x >= 0), ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'Hips']),
    (head, ['Head']),
    (torso, ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'LeftShoulder', 'RightShoulder', 'LeftUpLeg', 'RightUpLeg']),
])
print('arm verts', int(armL.sum()), int(armR.sum()), 'head', int(head.sum()))
# where the hands rest on the skirt, triangles join arm and skirt vertices; moving the arm would stretch them into
# sheets, so cut them (the hand and skirt simply touch there)
isarm = armL | armR
bmc = bmesh.new(); bmc.from_mesh(body.data); bmc.faces.ensure_lookup_table()
mixed = [f for f in bmc.faces if len({bool(isarm[v.index]) for v in f.verts}) > 1 and f.calc_center_median().z < 0.19]
bmesh.ops.delete(bmc, geom=mixed, context='FACES_ONLY'); bmc.to_mesh(body.data); bmc.free()
print('arm/skirt contact faces cut', len(mixed))
for o in eyes + iris_objs: skin(o, [(np.ones(len(o.data.vertices), bool), ['Head'])])

for im_ in bpy.data.images:                                       # web size: textures at most 1024
    if im_.size[0] > 1024 or im_.size[1] > 1024:
        f_ = 1024 / max(im_.size); im_.scale(int(im_.size[0] * f_), int(im_.size[1] * f_)); im_.pack()
for o in bpy.context.scene.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_skins=True, export_morph=False,
                          export_animations=False, export_image_format='WEBP', export_image_quality=85)
print('saved', out)
