# Build the site's robot.glb from local TRELLIS parts: the armoured c1 body with its head swapped for the projected
# s1597 head, a Mixamo-named skeleton fitted to her joints (the bones robot-glb.js needs, fingers and eyes included),
# proximity skinning (she's armour: rigid parts), and the eye glow split out as an "Iris" material so the prologue
# can light and dim it. Usage: blender -b -P build_robot.py -- body.glb head.glb out.glb
import bpy, bmesh, sys, numpy as np, mathutils
args = sys.argv[sys.argv.index('--')+1:]; body_glb, head_glb, out = args[:3]
V = mathutils.Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
def import_parts(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.type == 'MESH':
            o.data.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
    return [o for o in new if o.type == 'MESH']
def drop(o, mask):  # delete vertices where mask is True
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.verts[i] for i in np.where(mask)[0]], context='VERTS'); bm.to_mesh(o.data); bm.free()
def coords(o): return np.array([v.co[:] for v in o.data.vertices])

# ---------- body: the c1 TRELLIS model, head cut off at the neck ----------
body = max(import_parts(body_glb), key=lambda o: len(o.data.vertices)); body.name = 'Body'
drop(body, coords(body)[:, 2] > 0.303)
body.data.materials[0].name = 'Body'

# ---------- head: s1597, cut below the hair, scaled and placed on the neck ----------
hparts = import_parts(head_glb)
head = max(hparts, key=lambda o: len(o.data.vertices)); head.name = 'Head'
for o in hparts:
    if o is not head: bpy.data.objects.remove(o)
CHIN, CUT, EYEZ = -0.317, -0.40, -0.036              # in the head model's own units (from the concept mapping)
drop(head, coords(head)[:, 2] < CUT)
hc = coords(head)
front = hc[(np.abs(hc[:, 0]) < 0.05) & (np.abs(hc[:, 2] - EYEZ) < 0.03), 1].min()
SC = 0.245                                            # head scale: between c1's face width and chin-to-eye ratios
T = mathutils.Matrix.Translation(V((0, -0.068, 0.317))) @ mathutils.Matrix.Scale(SC, 4) @ mathutils.Matrix.Translation(V((0, -front, -CHIN)))
head.data.transform(T)
for m in head.data.materials:
    if m.name.startswith('FaceProjected'): m.name = 'Face'
    elif not m.name.startswith('Face'): m.name = 'Hair'

# stray hair-material polygons on the nose (they'd shade differently from the face in the toon shader): make them
# face, with UVs from an affine fit of the face's own UVs around them
hm0 = head.data; fi0 = [i for i, m in enumerate(hm0.materials) if m.name == 'Face'][0]
uv0 = hm0.uv_layers.active.data
win = lambda c: abs(c.x) < 0.035 and 0.32 < c.z < 0.38 and c.y < -0.05
stray = [p for p in hm0.polygons if p.material_index != fi0 and win(p.center)]
ref = [(hm0.vertices[hm0.loops[li].vertex_index].co, uv0[li].uv) for p in hm0.polygons
       if p.material_index == fi0 and win(p.center) for li in p.loop_indices]
Xa = np.array([[c.x, c.z, 1] for c, _ in ref]); Ya = np.array([u[:] for _, u in ref])
Ma, *_ = np.linalg.lstsq(Xa, Ya, rcond=None)
for p in stray:
    p.material_index = fi0
    for li in p.loop_indices:
        c = hm0.vertices[hm0.loops[li].vertex_index].co; uv0[li].uv = tuple(np.array([c.x, c.z, 1]) @ Ma)
print('nose strays fixed', len(stray))
# relax the nose patch (left uneven by flattening the nose; the toon shader shows it as a blotch), rim pinned
bmn = bmesh.new(); bmn.from_mesh(hm0); bmesh.ops.remove_doubles(bmn, verts=bmn.verts, dist=1e-6); bmn.to_mesh(hm0); bmn.free()
hcn = coords(head); evn = np.array([e.vertices[:] for e in hm0.edges])
degn = np.maximum(np.bincount(evn.ravel(), minlength=len(hcn)), 1)[:, None]
rn = np.hypot(hcn[:, 0] / 0.03, (hcn[:, 2] - 0.352) / 0.028)
zone = (rn < 1) & (hcn[:, 1] < -0.04)
wz = np.clip((1 - rn) / 0.3, 0, 1)[:, None]
for it in range(120):
    nb = np.zeros_like(hcn); np.add.at(nb, evn[:, 0], hcn[evn[:, 1]]); np.add.at(nb, evn[:, 1], hcn[evn[:, 0]])
    lam = 0.5 if it % 2 == 0 else -0.53
    hcn[zone] += (lam * wz[zone]) * (nb[zone] / degn[zone] - hcn[zone])
for i in np.where(zone)[0]: hm0.vertices[i].co = hcn[i]
print('nose relaxed', int(zone.sum()))

# the face texture: its orange rings become dark glass (the Iris overlay carries the glow, so it can switch off)
face_mat = bpy.data.materials['Face']
cimg = [n for n in face_mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and 'emit' not in n.image.name][0].image
CW, CH = cimg.size; cp = np.array(cimg.pixels[:]).reshape(CH, CW, 4)        # bottom row first
r, g, b = cp[..., 0], cp[..., 1], cp[..., 2]
glowm = ((r > 0.5) & (r - b > 0.3) & (g > 0.15)).astype(float)
def blur(m, k):
    for ax in (0, 1):
        c = np.cumsum(np.pad(m, [(k + 1, k) if i == ax else (0, 0) for i in range(m.ndim)], mode='edge'), axis=ax)
        m = (np.take(c, range(2 * k + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * k - 1), axis=ax)) / (2 * k + 1)
    return m
soft = np.clip(blur(blur(glowm, 2), 2) * 1.5, 0, 1)
cp[..., :3] = cp[..., :3] * (1 - soft[..., None]) + np.array([0.02, 0.02, 0.025]) * soft[..., None]
cimg.pixels = cp.ravel().tolist(); cimg.pack()
for n in list(face_mat.node_tree.nodes):                                      # no emission on the face itself
    if n.type == 'TEX_IMAGE' and n.image and 'emit' in n.image.name: face_mat.node_tree.nodes.remove(n)
face_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0

# ---------- lighter meshes for the web ----------
# the face keeps its full detail (its projected UVs garble when collapsed); everything else on the head decimates
fidx = [i for i, m in enumerate(head.data.materials) if m.name == 'Face'][0]
keep = set(k for p in head.data.polygons if p.material_index == fidx for k in p.vertices)
vgd = head.vertex_groups.new(name='decimate')
vgd.add([i for i in range(len(head.data.vertices)) if i not in keep], 1.0, 'REPLACE')
for o, ratio in ((body, 0.3), (head, 0.3)):
    d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = ratio
    if o is head: d.vertex_group = 'decimate'; d.vertex_group_factor = 1.0
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.modifier_apply(modifier='dec'); o.select_set(False)
    print(o.name, 'tris', sum(len(p.vertices) - 2 for p in o.data.polygons))

# ---------- iris overlay: the face polygons under the glow, a hair in front, alpha = the glow ----------
hm = head.data; fi = [i for i, m in enumerate(hm.materials) if m.name == 'Face'][0]
uvl = hm.uv_layers.active.data
sel = []
for p in hm.polygons:
    if p.material_index != fi: continue
    uvs = np.array([uvl[li].uv[:] for li in p.loop_indices])
    x0_, y0_ = np.clip((uvs.min(0) * [CW - 1, CH - 1]).astype(int), 0, [CW - 1, CH - 1])
    x1_, y1_ = np.clip((uvs.max(0) * [CW - 1, CH - 1]).astype(int) + 1, 0, [CW - 1, CH - 1])
    if soft[y0_:y1_ + 1, x0_:x1_ + 1].max() > 0.02: sel.append(p)          # any glow under the polygon
bm = bmesh.new(); vmap = {}; uv_out = bm.loops.layers.uv.new('UV')
for p in sel:
    vs = []
    for k in p.vertices:
        if k not in vmap: vmap[k] = bm.verts.new(hm.vertices[k].co + hm.vertices[k].normal * 0.0006)
        vs.append(vmap[k])
    try: f = bm.faces.new(vs)
    except ValueError: continue
    for l, li in zip(f.loops, p.loop_indices): l[uv_out].uv = uvl[li].uv
im = bpy.data.meshes.new('Iris'); bm.to_mesh(im); bm.free()
iris = bpy.data.objects.new('Iris', im); bpy.context.scene.collection.objects.link(iris)
glow_rgba = np.zeros((CH, CW, 4)); glow_rgba[..., 0:3] = [1.0, 0.55, 0.18]; glow_rgba[..., 3] = soft
gimg = bpy.data.images.new('iris_glow', CW, CH, alpha=True); gimg.pixels = glow_rgba.ravel().tolist(); gimg.pack()
im_m = bpy.data.materials.new('Iris'); im_m.use_nodes = True; nt = im_m.node_tree; bs = nt.nodes['Principled BSDF']
try: im_m.surface_render_method = 'BLENDED'
except Exception: pass
tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = gimg
nt.links.new(tx.outputs['Color'], bs.inputs['Base Color']); nt.links.new(tx.outputs['Alpha'], bs.inputs['Alpha'])
nt.links.new(tx.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 1.0
im.materials.append(im_m)
print('iris polys', len(im.polygons))

# ---------- skeleton, fitted to her (Blender: Z up, she faces -Y, her right is -X) ----------
bc = coords(body)
def ymid(x, z, r=0.02):
    s = (np.abs(bc[:, 0] - x) < r) & (np.abs(bc[:, 2] - z) < r)
    return float(bc[s, 1].mean()) if s.any() else 0.0
J = {}
yc = ymid(0, 0.05, 0.05)
J['Hips'] = V((0, yc, -0.09)); J['Spine'] = V((0, yc, 0.0)); J['Spine1'] = V((0, yc, 0.08)); J['Spine2'] = V((0, yc, 0.16))
J['Neck'] = V((0, ymid(0, 0.285, 0.015), 0.27)); J['Head'] = V((0, -0.005, 0.31)); J['HeadTop_End'] = V((0, 0.0, 0.52))
for side, sx in (('Left', 1), ('Right', -1)):
    J[f'{side}Shoulder'] = V((0.03 * sx, ymid(0.03 * sx, 0.24), 0.24))
    J[f'{side}Arm'] = V((0.105 * sx, ymid(0.105 * sx, 0.2), 0.205))
    J[f'{side}ForeArm'] = V((0.158 * sx, ymid(0.158 * sx, 0.06), 0.06))
    J[f'{side}Hand'] = V((0.205 * sx, ymid(0.205 * sx, -0.035), -0.035))
    tip = V((0.222 * sx, ymid(0.215 * sx, -0.085), -0.098))
    J[f'{side}HandTip'] = tip
    J[f'{side}UpLeg'] = V((0.055 * sx, yc, -0.105)); J[f'{side}Leg'] = V((0.056 * sx, ymid(0.056 * sx, -0.29), -0.29))
    J[f'{side}Foot'] = V((0.052 * sx, ymid(0.052 * sx, -0.45), -0.455)); J[f'{side}ToeBase'] = V((0.052 * sx, ymid(0.052 * sx, -0.49) - 0.035, -0.49))
    J[f'{side}Eye'] = V((0.03 * sx, -0.06, 0.375))

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
    W, Tp = J[f'{side}Hand'], J[f'{side}HandTip']
    d = (Tp - W).normalized(); L = (Tp - W).length
    bone(f'{side}Hand', W, W + d * L * 0.45, f'{side}ForeArm')
    # palms face her thighs; the index finger is toward her front (-Y), the pinky toward her back
    for f, off in (('Index', -0.009), ('Middle', -0.003), ('Ring', 0.003), ('Pinky', 0.009)):
        base = W + d * L * 0.45 + V((0, off, 0))
        seg = L * (0.55 if f != 'Pinky' else 0.45) / 3
        p = f'{side}Hand'
        for i in (1, 2, 3):
            n = f'{side}Hand{f}{i}'; bone(n, base + d * seg * (i - 1), base + d * seg * i, p); p = n
    tb = W + d * L * 0.2 + V((0, -0.012, 0)) + V((-0.006 * sx, 0, 0))
    td = (d + V((0, -0.8, 0))).normalized()
    p = f'{side}Hand'
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
            vg = o.vertex_groups[n]
            for i, w in zip(idx, Wt[:, j]):
                if w > 0.01: vg.add([int(i)], float(w), 'REPLACE')
    mod = o.modifiers.new('Armature', 'ARMATURE'); mod.object = arm; o.parent = arm
P = coords(body); x, y, z = P.T
xb = 0.177 + (z + 0.08) * (0.073 - 0.177) / 0.21                       # torso / arm gap, from the slices
fingers = lambda s: [f'{s}Hand{f}{i}' for f in ('Index', 'Middle', 'Ring', 'Pinky', 'Thumb') for i in (1, 2, 3)]
armR = (x < 0) & (((z < 0.16) & (-x > xb)) | ((z >= 0.16) & (z < 0.26) & (-x > 0.085)))
armL = (x > 0) & (((z < 0.16) & (x > xb)) | ((z >= 0.16) & (z < 0.26) & (x > 0.085)))
legs = (z < -0.12) & ~armR & ~armL
torso = ~armR & ~armL & ~legs
skin(body, [
    (armR, ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'Spine2'] + fingers('Right')),
    (armL, ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'Spine2'] + fingers('Left')),
    (legs & (x < 0), ['RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'Hips']),
    (legs & (x >= 0), ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'Hips']),
    (torso, ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'LeftShoulder', 'RightShoulder', 'LeftUpLeg', 'RightUpLeg']),
])
for o in (head, iris):
    skin(o, [(np.ones(len(o.data.vertices), bool), ['Head'])])

for im_ in bpy.data.images:                                       # web size: textures at most 1024
    if im_.size[0] > 1024 or im_.size[1] > 1024:
        f_ = 1024 / max(im_.size); im_.scale(int(im_.size[0] * f_), int(im_.size[1] * f_)); im_.pack()
for o in bpy.context.scene.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_skins=True, export_morph=False,
                          export_animations=False, export_image_format='WEBP', export_image_quality=85)
print('saved', out)
