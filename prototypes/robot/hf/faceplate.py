# Armoured c1: replace TRELLIS's lumpy face with a new, clean faceplate mesh (after the refs: one smooth porcelain mask
# with a visible edge, slightly pointed chin, big anime eyes as black glass lenses set in almond sockets).
# The old face is pushed back behind the plate and painted dark as the head's under-frame; the hair and the frill
# headband are cleaned to flat black and white (TRELLIS leaves blotches of each in the other).
# Usage: blender -b -P faceplate.py -- k4c1-s610.glb out.glb [anime|star|happy|blink]  (the frill headband is rebuilt too)
import bpy, bmesh, sys, numpy as np, mathutils
args = sys.argv[sys.argv.index('--')+1:]; glb, out = args[:2]; EXPR = args[2] if len(args) > 2 else 'anime'

# plate shape, in the model's metres (glTF import: Z up, face looks down -Y)
ZB, ZM, ZT = 0.317, 0.362, 0.412     # chin tip, widest from here up, top (tucked under the bangs)
WMAX, RX, DX = 0.056, 0.060, 0.040   # half width; cross-section ellipse radius and depth (sides wrap well behind the hair)
THICK = 0.0022
EX, EZ, SX = 0.0265, 0.374, 0.0185   # eye centres and half width (eye units: everything below is in multiples of SX)
HT, HB, SD = 0.84, 0.64, 0.0015      # almond: rounder, taller top lid, flatter bottom; socket depth
def half_w(z):
    u = np.clip((ZM - z) / (ZM - ZB), 0, 1); return WMAX * (1 - u ** 1.7) ** 0.7
def surf(x, z):   # front surface y at (x, z), without sockets
    u = np.clip((ZM - z) / (ZM - ZB), 0, 1); a = np.clip((z - 0.392) / 0.02, 0, 1)
    y0 = -0.0655 + 0.015 * u ** 2 + 0.010 * a ** 2
    return y0 + DX * (1 - np.sqrt(np.clip(1 - (x / RX) ** 2, 0, 1)))
def eye_f(a, b):  # < 1 inside the eye outline; a outward from the nose, b up
    top = b > 0; p = np.where(top, 2.6, 2.0)
    return (np.abs(a) ** p + np.abs(b / np.where(top, HT, HB)) ** p) ** (1 / p)
def socket(x, z):
    f = eye_f((np.abs(x) - EX) / SX, (z - EZ) / SX); t = np.clip((1.0 - f) / 0.15, 0, 1)
    return SD * t * t * (3 - 2 * t)

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

def raster(polys):  # UV-space mask of the given polygons' triangles
    mask = np.zeros((H, W), bool)
    for poly in polys:
        uv = np.array([uvd[li].uv[:] for li in poly.loop_indices]) * [W - 1, H - 1]
        for t in range(1, len(uv) - 1):
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
    return mask
def grow(mask, n):
    for _ in range(n): mask = mask | np.roll(mask, 1, 0) | np.roll(mask, -1, 0) | np.roll(mask, 1, 1) | np.roll(mask, -1, 1)
    return mask

# 1. push the old face behind the plate wherever it would poke through
inside = face & (np.abs(x) < half_w(z) + 0.004) & (z > ZB - 0.003)
lim = surf(np.minimum(np.abs(x), RX * 0.99), z) + THICK + 0.0015
mv = inside & (y < lim)
for i in np.where(mv)[0]: me.vertices[i].co.y = lim[i]
print('pushed back', int(mv.sum()))

# 1b. the old frill headband is fused into the hair: pull it down onto the hair dome (it becomes hair); a new clean
#     frill is built in step 3b
HC, HR = np.array([0.0005, 0.0056, 0.4097]), 0.077          # sphere fitted to the top of the hair
rv = co - HC; rr = np.linalg.norm(rv, axis=1)
frill_v = (z > 0.385) & (np.abs(x) < 0.13) & (np.abs(y) < 0.13) & (col[:, :3].max(1) > 0.3) & ~face
cap = np.where(frill_v, 0.074, 0.0815)
fl = (z > 0.385) & (np.abs(x) < 0.13) & (np.abs(y) < 0.13) & ~face & (rr > cap)
newc = HC + rv[fl] / rr[fl, None] * cap[fl, None]
for i, c in zip(np.where(fl)[0], newc): me.vertices[i].co = c
co[fl] = newc
x, y, z = co.T
print('frill flattened', int(fl.sum()))

# 2. hair and frill headband: majority-vote each vertex's black/white over its neighbours (removes the blotches),
#    then repaint those triangles flat; the old face becomes dark gunmetal (the under-frame at the plate's edge)
head = (z > 0.30) & (np.abs(x) < 0.13) & ~face
lab = (col[:, :3].max(1) > 0.3) & ~frill_v
ev = np.array([e.vertices[:] for e in me.edges]); nv = len(co)
deg = np.bincount(ev.ravel(), minlength=nv).astype(float)
for _ in range(5):
    s = np.bincount(ev[:, 0], weights=lab[ev[:, 1]], minlength=nv) + np.bincount(ev[:, 1], weights=lab[ev[:, 0]], minlength=nv)
    frac = s / np.maximum(deg, 1); lab = np.where(head, np.where(np.abs(frac - 0.5) < 0.01, lab, frac > 0.5), lab)
polys_w, polys_b, polys_f = [], [], []
for poly in me.polygons:
    vs = poly.vertices
    if any(face[v] for v in vs): polys_f.append(poly); continue
    if not all(head[v] for v in vs): continue
    (polys_w if sum(lab[v] for v in vs) * 2 > len(vs) else polys_b).append(poly)
print('head polys white', len(polys_w), 'black', len(polys_b))
mw, mb, mf = raster(polys_w), raster(polys_b), raster(polys_f)
light = bp[..., :3].max(-1) > 0.25
gw, gb = grow(mw, 3), grow(mb, 3)
bp[gw & ~mb, :3] = [0.93, 0.925, 0.92]; bp[gb & ~mw, :3] = [0.03, 0.03, 0.033]
bp[mw & ~mb, :3] = [0.93, 0.925, 0.92]; bp[mb & ~mw, :3] = [0.03, 0.03, 0.033]
pf = grow(mf, 4) & light
bp[pf, :3] = [0.07, 0.07, 0.075]; rp[pf, 1] = 0.45; rp[pf, 2] = 0.6
base.pixels = bp.ravel().tolist(); base.pack(); rough.pixels = rp.ravel().tolist(); rough.pack()
bpy.context.view_layer.objects.active = o
for ob in bpy.context.selected_objects: ob.select_set(False)
o.select_set(True)
try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
except Exception as ex: print('normals', ex)

# 3. the new faceplate: a grid over (s, z), x = s * half_w(z), y = surface + socket, solidified for a clean edge
NS, NZ = 160, 130
bm = bmesh.new(); grid = {}
for j in range(NZ + 1):
    zz = ZB + (ZT - ZB) * (j / NZ) ** 0.85          # a little denser at the chin
    for i in range(NS + 1):
        s = -1 + 2 * i / NS; s = np.sign(s) * abs(s) ** 0.9
        xx = s * half_w(zz)
        grid[i, j] = bm.verts.new((xx, surf(xx, zz) + socket(xx, zz), zz))
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

# 3b. new frill headband: a pleated, scalloped ruffle standing on a black ribbon, along a great circle of the hair
#     dome (over the top just behind the bangs, down to the ears), tilted back a little like a tiara
from mathutils.bvhtree import BVHTree
tree = BVHTree.FromPolygons([v.co[:] for v in me.vertices], [p.vertices[:] for p in me.polygons])
E1 = np.array([1.0, 0, 0]); TOPF = np.radians(68); E2 = np.array([0, -np.cos(TOPF), np.sin(TOPF)])  # the band's plane
NB = np.cross(E1, E2); NB = NB / np.linalg.norm(NB)
if NB[1] < 0: NB = -NB                                                                              # points back and up
def surf_pt(d):   # first hit on the hair coming in from outside along direction d
    hit = tree.ray_cast(mathutils.Vector(HC + d * 0.2), mathutils.Vector(-d))
    return np.array(hit[0][:]) if hit[0] is not None else HC + d * HR
NT, NH, NPL = 360, 14, 17
TH = np.radians(np.linspace(-14, 194, NT + 1))
fm = bmesh.new(); rib = bmesh.new()
rg, fg = {}, {}
for i, th in enumerate(TH):
    d = np.cos(th) * E1 + np.sin(th) * E2; bpt = surf_pt(d) + d * 0.0012
    end = np.clip(min(th - TH[0], TH[-1] - th) / np.radians(22), 0, 1); end = end * end * (3 - 2 * end)
    ph = th * NPL * 2
    hgt = 0.021 * (0.86 + 0.14 * np.cos(ph / 2) ** 2) * (0.35 + 0.65 * end)       # scalloped edge, lower at the ends
    up = np.cos(np.radians(28)) * d + np.sin(np.radians(28)) * NB
    for j in range(NH + 1):
        h = j / NH
        p = bpt + d * 0.0015 + up * hgt * h + NB * 0.0028 * np.sin(ph) * h ** 0.8 - NB * 0.002   # pleats fan out
        fg[i, j] = fm.verts.new(p)
    for j, w in enumerate((-0.0042, 0.0042)):
        rg[i, j] = rib.verts.new(bpt + d * 0.0006 + NB * w)
for i in range(NT):
    for j in range(NH): fm.faces.new((fg[i, j], fg[i + 1, j], fg[i + 1, j + 1], fg[i, j + 1]))
    rib.faces.new((rg[i, 0], rg[i + 1, 0], rg[i + 1, 1], rg[i, 1]))
def add(bm_, name, thick, color, rough_):
    mm = bpy.data.meshes.new(name); bm_.to_mesh(mm); bm_.free()
    ob = bpy.data.objects.new(name, mm); bpy.context.scene.collection.objects.link(ob)
    for p in mm.polygons: p.use_smooth = True
    so = ob.modifiers.new('t', 'SOLIDIFY'); so.thickness = thick; so.offset = 0
    mt = bpy.data.materials.new(name); mt.use_nodes = True; b_ = mt.node_tree.nodes['Principled BSDF']
    b_.inputs['Base Color'].default_value = (*color, 1); b_.inputs['Roughness'].default_value = rough_
    mm.materials.append(mt)
    bpy.context.view_layer.objects.active = ob
    for o_ in bpy.context.selected_objects: o_.select_set(False)
    ob.select_set(True); bpy.ops.object.modifier_apply(modifier='t')
add(fm, 'Frill', 0.0008, (0.93, 0.925, 0.92), 0.45)
add(rib, 'Ribbon', 0.0012, (0.02, 0.02, 0.022), 0.25)

# 4. anime eyes, drawn on a decal that hugs the plate and socket: black glass almond, thick upper lid with a flick at
#    the outer corner, tall iris (dark at the top, bright at the bottom), pupil, two highlights. Glows in the dark.
K, N = 1.4, 512
gb_, ga_ = np.mgrid[0:N, 0:N]; A = (ga_ / (N - 1) * 2 - 1) * K; B = (1 - gb_ / (N - 1) * 2) * K   # row 0 = top
F = eye_f(A, B); ins = F < 1
img = np.zeros((N, N, 4)); emis = np.zeros((N, N, 4)); emis[..., 3] = 1
img[ins] = [0.93, 0.93, 0.95, 1]                                     # white sclera (glass)
upper = ins & (B > 0) & (F > 0.62); img[upper, :3] = [0.6, 0.6, 0.64]  # the upper lid's shadow on it
lw = 0.07 + 0.11 * np.clip(A, 0, 1)                                   # lid line thickens towards the outer corner
lid = (B > 0) & (F >= 0.84) & (F < 1 + lw) & (A > -0.92)
t = (A - 0.8) / 0.5; flick = (t >= 0) & (t <= 1) & (B > 0.02 + 0.5 * t) & (B < 0.34 + 0.22 * t)
lash = (B < 0) & (F >= 0.93) & (F < 1.035) & (A > 0.25)
img[lid | flick | lash] = [0.015, 0.015, 0.018, 1]
IC = -0.06; ri = np.hypot(A / 0.6, (B - IC) / 0.9); iris = ins & (ri < 1) & ~lid
tb = np.clip(((B - IC) / 0.9 + 1) / 2, 0, 1)                          # 0 bottom .. 1 top of the iris
shade = 0.06 + 0.5 * (1 - tb) ** 1.4                                  # dark at the top, lighter at the bottom
shade = np.where(ri > 0.9, 0.04, shade)                               # dark rim
pupil = np.hypot(A / 0.24, (B - IC - 0.04) / 0.4) < 1
hi1 = ins & ~lid & (np.hypot((A + 0.22) / 0.17, (B - 0.2) / 0.22) < 1)
hi2 = ins & ~lid & (np.hypot(A - 0.2, B + 0.46) < 0.08)
star = (np.abs(A) ** 0.5 + np.abs(B - IC) ** 0.5) < 0.6
glow = np.zeros((N, N))
if EXPR in ('anime', 'star'):
    img[iris, :3] = shade[iris, None]; glow[iris] = shade[iris] * 0.6
    if EXPR == 'anime': img[iris & pupil, :3] = 0.02; glow[iris & pupil] = 0
    else: img[iris & star, :3] = 1; glow[iris & star] = 1
    img[hi1 | hi2, :3] = 1; glow[hi1 | hi2] = 1
else:   # closed: the lid line and lashes over the sclera
    arc = {'happy': 0.02 + 0.5 * (1 - (A / 0.86) ** 2), 'blink': -0.1 + 0.1 * (A / 0.86) ** 2}[EXPR]
    cl = (np.abs(B - arc) < 0.09) & (np.abs(A) < 0.95)
    img[ins | lid | flick | lash, 3] = 0; img[cl] = [0.015, 0.015, 0.018, 1]
TINT = np.array([0.94, 0.95, 1.0])
g = glow > 0; emis[g, :3] = glow[g, None] * TINT
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
bs.inputs['Roughness'].default_value = 0.08
M = 40
for side in (1, -1):
    bm = bmesh.new(); gv = {}
    for j in range(M + 1):
        for i in range(M + 1):
            a_, b_ = (-1 + 2 * i / M) * K, (-1 + 2 * j / M) * K
            xx = side * (EX + a_ * SX); zz = EZ + b_ * SX
            gv[i, j] = bm.verts.new((xx, surf(xx, zz) + socket(xx, zz) - 0.0004, zz))
    uvl = bm.loops.layers.uv.new('UV')
    for j in range(M):
        for i in range(M):
            q = (gv[i, j], gv[i + 1, j], gv[i + 1, j + 1], gv[i, j + 1])
            f = bm.faces.new(q if side == 1 else q[::-1])
            for l, (ii, jj) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)) if side == 1 else ((i, j + 1), (i + 1, j + 1), (i + 1, j), (i, j))):
                l[uvl].uv = (ii / M, jj / M)
    em = bpy.data.meshes.new('Eye'); bm.to_mesh(em); bm.free()
    e = bpy.data.objects.new('EyeR' if side == 1 else 'EyeL', em); bpy.context.scene.collection.objects.link(e)
    for p in em.polygons: p.use_smooth = True
    em.materials.append(m)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB'); print('saved', out)
