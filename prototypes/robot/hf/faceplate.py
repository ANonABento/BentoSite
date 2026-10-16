# Armoured c1: replace TRELLIS's lumpy face with a new, clean faceplate mesh (after the refs: one smooth porcelain mask
# with a visible edge, slightly pointed chin, small recessed eye sockets holding dark glass lenses with one glowing icon).
# The old face is pushed back behind the plate and painted dark as the head's under-frame.
# Usage: blender -b -P faceplate.py -- k4c1-s610.glb out.glb [dot|ring|blink|happy|x]
import bpy, bmesh, sys, numpy as np, mathutils
args = sys.argv[sys.argv.index('--')+1:]; glb, out = args[:2]; EXPR = args[2] if len(args) > 2 else 'dot'

# plate shape, in the model's metres (glTF import: Z up, face looks down -Y)
ZB, ZM, ZT = 0.317, 0.362, 0.412     # chin tip, widest from here up, top (tucked under the bangs)
WMAX, RX, DX = 0.061, 0.069, 0.034   # half width; cross-section ellipse radius and depth (edges wrap back under the hair)
EX, EZ = 0.0295, 0.3745              # eye centres: wide apart, just under the bangs
SX, SZ, SD = 0.0195, 0.019, 0.0018   # big round sockets, about a third of the face width each (cute first, like BBSeven)
THICK = 0.0022
def half_w(z):
    u = np.clip((ZM - z) / (ZM - ZB), 0, 1); return WMAX * (1 - u ** 1.7) ** 0.7
def surf(x, z):   # front surface y at (x, z), without sockets
    u = np.clip((ZM - z) / (ZM - ZB), 0, 1); a = np.clip((z - 0.392) / 0.02, 0, 1)
    y0 = -0.0655 + 0.015 * u ** 2 + 0.010 * a ** 2
    return y0 + DX * (1 - np.sqrt(np.clip(1 - (x / RX) ** 2, 0, 1)))
def socket(x, z):
    r = np.sqrt(((np.abs(x) - EX) / SX) ** 2 + ((z - EZ) / SZ) ** 2)
    t = np.clip((1.18 - r) / 0.3, 0, 1); return SD * t * t * (3 - 2 * t), r

bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
o = max([x for x in bpy.context.scene.objects if x.type == 'MESH'], key=lambda x: len(x.data.vertices)); me = o.data
me.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
nt = me.materials[0].node_tree
base = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and 'base' in n.image.name.lower()][0].image
rough = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and 'metal' in n.image.name.lower()][0].image
W, H = base.size; bp = np.array(base.pixels[:]).reshape(H, W, 4); rp = np.array(rough.pixels[:]).reshape(H, W, 4)
co = np.array([v.co[:] for v in me.vertices]); uvd = me.uv_layers.active.data; vuv = np.zeros((len(co), 2))
for l in me.loops: vuv[l.vertex_index] = uvd[l.index].uv
col = bp[(np.clip(vuv[:, 1], 0, 1) * (H - 1)).astype(int), (np.clip(vuv[:, 0], 0, 1) * (W - 1)).astype(int)]
x, y, z = co.T
bright = col[:, :3].max(1) > 0.45
face = (np.abs(x) < 0.09) & (z > 0.305) & (z < 0.402) & (y < -0.015) & bright
print('old face verts', int(face.sum()))

# 1. push the old face behind the plate wherever it would poke through
inside = face & (np.abs(x) < half_w(z) + 0.004) & (z > ZB - 0.003)
lim = surf(np.minimum(np.abs(x), RX * 0.99), z) + THICK + 0.0015
mv = inside & (y < lim)
for i in np.where(mv)[0]: me.vertices[i].co.y = lim[i]
print('pushed back', int(mv.sum()))

# 2. paint the old face dark gunmetal (the under-frame that shows at the plate's edge)
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
        mask[y0:y1, x0:x1] |= (l1 >= -0.08) & (l2 >= -0.08) & (1 - l1 - l2 >= -0.08)
for _ in range(4): mask = mask | np.roll(mask, 1, 0) | np.roll(mask, -1, 0) | np.roll(mask, 1, 1) | np.roll(mask, -1, 1)
paint = mask & (bp[..., :3].max(-1) > 0.25)
bp[paint, :3] = [0.07, 0.07, 0.075]; rp[paint, 1] = 0.45; rp[paint, 2] = 0.6
base.pixels = bp.ravel().tolist(); base.pack(); rough.pixels = rp.ravel().tolist(); rough.pack()
bpy.context.view_layer.objects.active = o
for ob in bpy.context.selected_objects: ob.select_set(False)
o.select_set(True)
try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
except Exception as ex: print('normals', ex)

# 3. the new faceplate: a grid over (s, z), x = s * half_w(z), y = surface - socket, solidified for a clean edge
NS, NZ = 140, 120
bm = bmesh.new(); grid = {}
for j in range(NZ + 1):
    zz = ZB + (ZT - ZB) * (j / NZ) ** 0.85          # a little denser at the chin
    for i in range(NS + 1):
        s = -1 + 2 * i / NS; s = np.sign(s) * abs(s) ** 0.9
        xx = s * half_w(zz); dep, _ = socket(xx, zz)
        grid[i, j] = bm.verts.new((xx, surf(xx, zz) + dep, zz))
uvl = bm.loops.layers.uv.new('UV')
for j in range(NZ):
    for i in range(NS):
        f = bm.faces.new((grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]))
        for l in f.loops: l[uvl].uv = ((l.vert.co.x + 0.07) / 0.14, (l.vert.co.z - ZB) / (ZT - ZB))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)   # the chin row collapses to a point
pm = bpy.data.meshes.new('Faceplate'); bm.to_mesh(pm); bm.free()
plate = bpy.data.objects.new('Faceplate', pm); bpy.context.scene.collection.objects.link(plate)
for p in pm.polygons: p.use_smooth = True
sol = plate.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = THICK; sol.offset = -1; sol.use_even_offset = True  # grows back (+Y)
sol.use_rim = True
bev = plate.modifiers.new('bev', 'BEVEL'); bev.width = 0.0006; bev.segments = 2; bev.limit_method = 'ANGLE'
pmat = bpy.data.materials.new('Porcelain'); pmat.use_nodes = True; pb = pmat.node_tree.nodes['Principled BSDF']
pb.inputs['Base Color'].default_value = (0.93, 0.925, 0.92, 1); pb.inputs['Roughness'].default_value = 0.16
try: pb.inputs['Coat Weight'].default_value = 0.6; pb.inputs['Coat Roughness'].default_value = 0.05
except Exception: pass
pm.materials.append(pmat)
bpy.context.view_layer.objects.active = plate
for ob in bpy.context.selected_objects: ob.select_set(False)
plate.select_set(True)
for m_ in list(plate.modifiers): bpy.ops.object.modifier_apply(modifier=m_.name)
print('plate verts', len(plate.data.vertices))

# 4. eyes: dark glass lens in each socket, one glowing icon (the expression) and a glint
N = 256; yy, xx = np.mgrid[0:N, 0:N] / (N - 1); u, v = xx - 0.5, 0.5 - yy; r = np.hypot(u, v)
img = np.zeros((N, N, 4)); emis = np.zeros((N, N, 4)); emis[..., 3] = 1
lens = r < 0.5; rim = (r > 0.405) & (r < 0.435)
img[lens] = [0.02, 0.02, 0.022, 1]; img[rim, :3] = [0.9, 0.9, 0.9]          # black glass, thin light ring inside
WHITE_ICON = np.array([0.97, 0.97, 1.0])
icon = {
  'dot':   r < 0.25,
  'ring':  (r < 0.27) & (r > 0.16),
  'blink': (np.abs(v) < 0.05) & (np.abs(u) < 0.26),
  'happy': (np.abs(np.hypot(u, v + 0.16) - 0.25) < 0.055) & (v > -0.03),
  'x':     ((np.abs(u - v) < 0.07) | (np.abs(u + v) < 0.07)) & (np.abs(u) < 0.2) & (np.abs(v) < 0.2),
  'star':  (np.abs(u) ** 0.5 + np.abs(v) ** 0.5) < 0.52,
}[EXPR]
img[icon, :3] = WHITE_ICON; emis[icon, :3] = WHITE_ICON; emis[rim, :3] = WHITE_ICON * 0.4
def mk(name, a):
    im = bpy.data.images.new(name, N, N, alpha=True); im.pixels = a[::-1].ravel().tolist(); im.pack(); return im
m = bpy.data.materials.new('Eyes'); m.use_nodes = True
try: m.surface_render_method = 'BLENDED'
except Exception: pass
n2 = m.node_tree; bs = n2.nodes['Principled BSDF']
tc = n2.nodes.new('ShaderNodeTexImage'); tc.image = mk('eye_color', img)
te = n2.nodes.new('ShaderNodeTexImage'); te.image = mk('eye_emit', emis)
n2.links.new(tc.outputs['Color'], bs.inputs['Base Color']); n2.links.new(tc.outputs['Alpha'], bs.inputs['Alpha'])
n2.links.new(te.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 2.0
bs.inputs['Roughness'].default_value = 0.08
LX, LZ = SX * 0.86, SZ * 0.86
for side in (1, -1):
    bm = bmesh.new(); g = {}
    for j in range(17):
        for i in range(17):
            a_, b_ = -1 + i / 8, -1 + j / 8
            xx = side * EX + a_ * LX; zz = EZ + b_ * LZ
            g[i, j] = bm.verts.new((xx, surf(xx, zz) + SD - 0.0003, zz))   # floor of the socket, a hair in front
    uvl = bm.loops.layers.uv.new('UV')
    for j in range(16):
        for i in range(16):
            f = bm.faces.new((g[i, j], g[i + 1, j], g[i + 1, j + 1], g[i, j + 1]))
            for l in f.loops:
                l[uvl].uv = ((l.vert.co.x - side * EX) / LX * 0.5 + 0.5, (l.vert.co.z - EZ) / LZ * 0.5 + 0.5)
    em = bpy.data.meshes.new('Eye'); bm.to_mesh(em); bm.free()
    e = bpy.data.objects.new('EyeR' if side == 1 else 'EyeL', em); bpy.context.scene.collection.objects.link(e)
    for p in em.polygons: p.use_smooth = True
    em.materials.append(m)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB'); print('saved', out)
