# Armoured c1 face cleanup: a smooth porcelain-white faceplate (nose flattened, texture repainted, glossy) and clean,
# cute screen-eye decals (separate emissive meshes EyeL / EyeR). Usage: blender -b -P fix_c1.py -- in.glb out.glb
import bpy, bmesh, sys, numpy as np, mathutils
glb, out = sys.argv[sys.argv.index('--')+1:][:2]
EYE = mathutils.Vector((0.024, -0.06, 0.388)); EW, EH = 0.025, 0.028
WHITE = np.array([0.95, 0.945, 0.94])
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]; me = o.data
me.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
nt = me.materials[0].node_tree
base = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and 'base' in n.image.name.lower()][0].image
rough = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and 'metal' in n.image.name.lower()][0].image
W, H = base.size; bp = np.array(base.pixels[:]).reshape(H, W, 4); rp = np.array(rough.pixels[:]).reshape(H, W, 4)
co = np.array([v.co[:] for v in me.vertices]); nrm = np.array([v.normal[:] for v in me.vertices])
uvd = me.uv_layers.active.data; vuv = np.zeros((len(co), 2))
for l in me.loops: vuv[l.vertex_index] = uvd[l.index].uv
col = bp[(np.clip(vuv[:, 1], 0, 1) * (H - 1)).astype(int), (np.clip(vuv[:, 0], 0, 1) * (W - 1)).astype(int)]
x, y, z = co.T
bright = col[:, :3].max(1) > 0.45                       # skin, eyes, specks; not the black hair
face = (np.abs(x) < 0.046) & (z > 0.338) & (z < 0.401) & (y < -0.045) & bright   # in front of the head, whatever way it faces (old eye sockets face sideways)
print('face verts', int(face.sum()))

# 1. geometry: fit a sphere to the faceplate (cheeks and forehead, not the nose or eyes) and project the nose and
#    lower face onto it, fading out towards the hairline and jaw, so the face becomes one smooth egg shape
nose = (np.abs(x) < 0.016) & (z > 0.352) & (z < 0.382)
fit = face & ~nose & ~((np.abs(np.abs(x) - EYE.x) < 0.015) & (np.abs(z - EYE.z) < 0.015))
P = co[fit]; A = np.c_[2 * P, np.ones(len(P))]; sol, *_ = np.linalg.lstsq(A, (P ** 2).sum(1), rcond=None)
C = sol[:3]; R = np.sqrt(sol[3] + (C ** 2).sum()); print('sphere', C.round(4), round(float(R), 4))
reg = face & (np.abs(x) < 0.046) & (z > 0.346) & (z < 0.402)   # the whole faceplate, eyes included
d = co[reg] - C; target = C + d / np.linalg.norm(d, axis=1)[:, None] * R
k = (np.clip((0.046 - np.abs(x[reg])) / 0.008, 0, 1) * np.clip((0.402 - z[reg]) / 0.004, 0, 1) * np.clip((z[reg] - 0.346) / 0.004, 0, 1))[:, None]
newco = co[reg] + (target - co[reg]) * k
for i, c in zip(np.where(reg)[0], newco): me.vertices[i].co = c
print('moved', int(reg.sum()), 'max', float(np.linalg.norm(newco - co[reg], axis=1).max()))

# 2. texture: rasterise the face triangles in UV space and repaint them porcelain white, glossy
uvd = me.uv_layers.active.data   # re-fetch: bm.to_mesh rebuilt the loops
mask = np.zeros((H, W), bool)
for poly in me.polygons:
    vs = list(poly.vertices)
    if not any(face[v] for v in vs): continue
    uv = np.array([uvd[li].uv[:] for li in poly.loop_indices]) * [W - 1, H - 1]
    for t in range(1, len(vs) - 1):
        a, b, c = uv[0], uv[t], uv[t + 1]
        x0, x1 = int(max(min(a[0], b[0], c[0]) - 1, 0)), int(min(max(a[0], b[0], c[0]) + 2, W))
        y0, y1 = int(max(min(a[1], b[1], c[1]) - 1, 0)), int(min(max(a[1], b[1], c[1]) + 2, H))
        if x1 <= x0 or y1 <= y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1), np.arange(y0, y1))
        d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(d) < 1e-9: continue
        l1 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / d
        l2 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / d
        ins = (l1 >= -0.08) & (l2 >= -0.08) & (1 - l1 - l2 >= -0.08)
        mask[y0:y1, x0:x1] |= ins
# grow the mask a few pixels so seams don't keep old colour
for _ in range(4):
    mask = mask | np.roll(mask, 1, 0) | np.roll(mask, -1, 0) | np.roll(mask, 1, 1) | np.roll(mask, -1, 1)
# only repaint light pixels (keep any hair or lash pixels that share the islands)
paint = mask & (bp[..., :3].max(-1) > 0.25)
bp[paint, :3] = WHITE; rp[paint, 1] = 0.22; rp[paint, 2] = 0.0   # glTF: G = roughness, B = metallic
base.pixels = bp.ravel().tolist(); base.pack(); rough.pixels = rp.ravel().tolist(); rough.pack()
print('painted px', int(paint.sum()))

# 3. screen eyes: a glowing oval with a darker rim, a soft gradient, a pupil glint and two big highlights
N = 256; yy, xx = np.mgrid[0:N, 0:N] / (N - 1); u, v = xx - 0.5, 0.5 - yy
img = np.zeros((N, N, 4)); emis = np.zeros((N, N, 4)); emis[..., 3] = 1
r = np.sqrt((u / 0.46) ** 2 + (v / 0.47) ** 2)
eye = r < 1
g = np.clip((0.45 - v) / 0.9, 0, 1)[..., None]
c = np.array([0.95, 0.38, 0.05]) * (1 - g) + np.array([1.0, 0.78, 0.35]) * g
rim = eye & (r > 0.86)
pupil = (u / 0.13) ** 2 + ((v + 0.02) / 0.19) ** 2 < 1
hl1 = ((u + 0.13) / 0.12) ** 2 + ((v - 0.17) / 0.14) ** 2 < 1
hl2 = ((u - 0.15) / 0.05) ** 2 + ((v + 0.2) / 0.05) ** 2 < 1
lid = (r < 1.08) & (r > 0.93) & (v > 0.12)            # a thin dark upper lid line: reads as an eye, not a lamp
img[eye, :3] = c[eye]; img[eye, 3] = 1
img[rim, :3] *= 0.6; img[pupil, :3] = img[pupil, :3] * 0.45
img[hl1 | hl2] = [1, 1, 1, 1]
img[lid] = [0.06, 0.05, 0.06, 1]
emis[eye, :3] = img[eye, :3]; emis[lid, :3] = 0
def mk(name, a):
    im = bpy.data.images.new(name, N, N, alpha=True); im.pixels = a[::-1].ravel().tolist(); im.pack(); return im
m = bpy.data.materials.new('Eyes'); m.use_nodes = True
try: m.surface_render_method = 'BLENDED'
except Exception: pass
n2 = m.node_tree; bs = n2.nodes['Principled BSDF']
tc = n2.nodes.new('ShaderNodeTexImage'); tc.image = mk('eye_color', img)
te = n2.nodes.new('ShaderNodeTexImage'); te.image = mk('eye_emit', emis)
n2.links.new(tc.outputs['Color'], bs.inputs['Base Color']); n2.links.new(tc.outputs['Alpha'], bs.inputs['Alpha'])
n2.links.new(te.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 1.5
bs.inputs['Roughness'].default_value = 0.2
for side in (1, -1):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=14, y_subdivisions=14, size=1)
    e = bpy.context.object; e.name = 'EyeR' if side == 1 else 'EyeL'
    e.scale = (EW * side, EH, 1); e.rotation_euler = (np.pi / 2, 0, 0);     bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for vtx in e.data.vertices:   # wrap onto the faceplate sphere, a hair in front of it
        w = np.array(vtx.co[:]) + [EYE.x * side, 0, EYE.z]; w[1] = C[1] - 1.0
        dd = w - C; dd[1] = 0; yv = -np.sqrt(max((R + 0.0009) ** 2 - (dd ** 2).sum(), 1e-8))
        vtx.co = (w[0], C[1] + yv, w[2])
    e.location = (0, 0, 0); e.data.materials.append(m)
# the imported custom normals describe the old shape: drop them and shade smooth
bpy.context.view_layer.objects.active = o
for ob in bpy.context.selected_objects: ob.select_set(False)
o.select_set(True)
try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
except Exception as ex: print('normals', ex)
bpy.ops.object.shade_smooth()
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB'); print('saved', out)
