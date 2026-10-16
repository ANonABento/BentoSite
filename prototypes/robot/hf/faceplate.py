# Armoured c1: replace TRELLIS's lumpy face with a new, clean faceplate mesh (after the refs: one smooth porcelain mask
# with a visible edge, slightly pointed chin, Z3-style eyes: black glass cat-eye sockets with one glowing orange shape).
# The old face is pushed back behind the plate and painted dark as the head's under-frame; the hair and the frill
# headband are cleaned to flat black and white (TRELLIS leaves blotches of each in the other).
# Usage: blender -b -P faceplate.py -- k4c1-s610.glb out.glb [ring|dot|star|happy|blink]  (the frill headband is rebuilt too)
import bpy, bmesh, sys, numpy as np, mathutils
args = sys.argv[sys.argv.index('--')+1:]; glb, out = args[:2]; EXPR = args[2] if len(args) > 2 else 'ring'

# plate shape, in the model's metres (glTF import: Z up, face looks down -Y)
ZB, ZM, ZT = 0.316, 0.368, 0.412     # chin tip, widest (cheeks) from here up, top (tucked under the bangs)
WMAX, RX, DX = 0.056, 0.060, 0.040   # half width; cross-section ellipse radius and depth (sides wrap well behind the hair)
THICK = 0.0022
EX, EZ, SX = 0.027, 0.3808, 0.021   # eye centres (right under the bangs) and half width; eye units are multiples of SX
SD = 0.0015                          # socket depth
def half_w(z):
    u = np.clip((ZM - z) / (ZM - ZB), 0, 1)                   # cheeks into a V-line jaw, small rounded chin
    return WMAX * (0.3 * (1 - u) ** 1.05 + 0.7 * np.sqrt(np.clip(1 - u * u, 0, 1)) ** 1.25)
def bump(t): t = np.clip(t, -1, 1); return (1 - t * t) ** 2       # smooth 0..1..0 over t in [-1, 1]
def surf(x, z):   # front surface y at (x, z), without sockets
    u = np.clip((ZM - z) / (ZM - ZB), 0, 1); a = np.clip((z - 0.392) / 0.02, 0, 1)
    y0 = -0.0655 + 0.015 * u ** 2 + 0.010 * a ** 2
    y = y0 + DX * (1 - np.sqrt(np.clip(1 - (x / RX) ** 2, 0, 1)))
    # the nose is just a broad, low swell the whole mask rises into and fades back out of (no tip, no tuck, so no
    # shadow line that could read as a mouth)
    up = np.clip((0.376 - z) / (0.376 - 0.356), 0, 1); dn = np.clip((z - 0.334) / (0.356 - 0.334), 0, 1)
    prof = np.where(z > 0.356, up * up * (3 - 2 * up), dn * dn * (3 - 2 * dn))
    nose = 0.0019 * prof * np.exp(-(x / (0.0065 + 0.004 * prof)) ** 2)
    return y - nose
# eye socket outline (a outward from the nose, b up), traced from the general anime-girl eye: a gently arched,
# fairly flat top lid and a deep round U below (no almond), rounded off with Chaikin corner cutting
def chaikin(P, n):
    for _ in range(n):
        Q = np.roll(P, -1, 0); P = np.stack([0.75 * P + 0.25 * Q, 0.25 * P + 0.75 * Q], 1).reshape(-1, 2)
    return P
EYE_POLY = chaikin(np.array([(-1.0, 0.1), (-0.8, 0.5), (-0.3, 0.72), (0.3, 0.75), (0.8, 0.56), (1.0, 0.2),
                             (0.95, -0.2), (0.65, -0.58), (0.0, -0.74), (-0.6, -0.6), (-0.92, -0.25)]), 3)
# lashes, after the picked 2D concepts (f5 s377 / s1597): a thick upper lash line, three spiky lashes at the outer
# corner and two small ones on top, and a thin lower lash at the outer corner
LASH = chaikin(np.array([(-1.04, 0.06), (-1.0, 0.34), (-0.82, 0.68), (-0.3, 0.92), (0.3, 0.96), (0.86, 0.8), (1.08, 0.42),
                         (0.98, 0.16), (0.8, 0.44), (0.3, 0.6), (-0.3, 0.56), (-0.78, 0.38), (-0.95, 0.06)]), 2)
SPIKES = [np.array(t) for t in (
    [(0.84, 0.8), (1.28, 0.98), (1.0, 0.6)], [(0.98, 0.58), (1.32, 0.6), (1.04, 0.4)], [(1.02, 0.36), (1.28, 0.24), (1.0, 0.18)],
    [(0.3, 0.92), (0.5, 1.06), (0.5, 0.88)], [(-0.2, 0.9), (-0.06, 1.04), (0.0, 0.9)],
    [(0.3, -0.66), (0.95, -0.18), (0.92, -0.28), (0.3, -0.72)], [(0.7, -0.44), (0.98, -0.5), (0.76, -0.38)])]
def poly_sd(P, a, b):   # signed distance to a closed polygon (negative inside)
    a = np.asarray(a, float); b = np.asarray(b, float); d = np.full(a.shape, np.inf); ins = np.zeros(a.shape, bool)
    for (x0, y0), (x1, y1) in zip(P, np.roll(P, -1, 0)):
        ex, ey = x1 - x0, y1 - y0; t = np.clip(((a - x0) * ex + (b - y0) * ey) / (ex * ex + ey * ey), 0, 1)
        d = np.minimum(d, np.hypot(a - x0 - t * ex, b - y0 - t * ey))
        ins ^= ((y0 > b) != (y1 > b)) & (a < (x1 - x0) * (b - y0) / (y1 - y0 + 1e-12) + x0)
    return np.where(ins, -d, d)
def eye_sd(a, b): return poly_sd(EYE_POLY, a, b)
def socket(x, z):
    t = np.clip(-eye_sd((np.abs(x) - EX) / SX, (z - EZ) / SX) / 0.1, 0, 1)
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

# 4. Z3-style eyes on a decal that hugs the plate and socket: black glass cat-eye with a short wing, and one bright
#    glowing orange shape (the expression) blooming over the glass. No iris or sclera: a neon sign in black glass.
K, N = 1.4, 512
gb_, ga_ = np.mgrid[0:N, 0:N]; A = (ga_ / (N - 1) * 2 - 1) * K; B = (1 - gb_ / (N - 1) * 2) * K   # row 0 = top
SDF = eye_sd(A, B); ins = SDF < 0
img = np.zeros((N, N, 4)); emis = np.zeros((N, N, 4)); emis[..., 3] = 1
img[ins] = [0.95, 0.95, 0.96, 1]                                             # white glass, mostly hidden by the iris
img[ins & (B > 0.35), :3] = [0.72, 0.72, 0.76]                                 # lid shadow on it
iris = ins & (np.hypot(A, B + 0.02) < 0.7)                                      # huge round black glass iris
gl = np.clip((0.6 - B) / 1.3, 0, 1)
img[iris, :3] = (0.02 + 0.07 * gl[iris])[:, None]
wing = (poly_sd(LASH, A, B) < 0.005) | np.any([poly_sd(P_, A, B) < 0.005 for P_ in SPIKES], 0)
img[wing] = [0.01, 0.01, 0.012, 1]
hl = ins & ~wing & (np.hypot((A + 0.24) / 0.14, (B - 0.3) / 0.11) < 1)       # white highlight
u, v = A, B + 0.02; r = np.hypot(u, v)
hexd = np.maximum(np.abs(v), np.abs(u) * 0.866 + np.abs(v) * 0.5)
shape = {
  'ring':  (r < 0.44) & (r > 0.35),
  'dot':   hexd < 0.3,
  'star':  (np.abs(u) ** 0.5 + np.abs(v) ** 0.5) < 0.72,
  'happy': (r < 0.4) & (r > 0.3) & (v > 0.0),                                  # an arch: a smile
  'blink': (np.abs(v + 0.05 * (u / 0.5) ** 2) < 0.055) & (np.abs(u) < 0.5),
}[EXPR]
def blur(m, s_):   # separable box blur x3 ~ gaussian
    m = m.astype(float); k = max(int(s_), 1)
    for _ in range(3):
        for ax in (0, 1):
            c = np.cumsum(np.pad(m, [(k + 1, k) if i == ax else (0, 0) for i in range(2)]), axis=ax)
            m = (np.take(c, range(2 * k + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * k - 1), axis=ax)) / (2 * k + 1)
    return m
halo = np.clip(blur(shape, 10) * 1.6, 0, 1) * iris
core = (blur(shape, 2) > 0.5) & iris & ~hl
ORANGE = np.array([1.0, 0.45, 0.08]); HOT = np.array([1.0, 0.68, 0.36])
img[iris, :3] += (halo[iris, None] * 0.6) * ORANGE
img[core, :3] = HOT; img[core, 3] = 1; img[hl, :3] = 1
emis[..., :3] = halo[..., None] * 0.7 * ORANGE; emis[core, :3] = HOT; emis[hl, :3] = 0.5
img[..., :3] = np.clip(img[..., :3], 0, 1)
def mk(name, a):
    im = bpy.data.images.new(name, N, N, alpha=True); im.pixels = a[::-1].ravel().tolist(); im.pack(); return im
m = bpy.data.materials.new('Eyes'); m.use_nodes = True
try: m.surface_render_method = 'BLENDED'
except Exception: pass
n2 = m.node_tree; bs = n2.nodes['Principled BSDF']
tc = n2.nodes.new('ShaderNodeTexImage'); tc.image = mk('eye_color', img)
te = n2.nodes.new('ShaderNodeTexImage'); te.image = mk('eye_emit', emis)
n2.links.new(tc.outputs['Color'], bs.inputs['Base Color']); n2.links.new(tc.outputs['Alpha'], bs.inputs['Alpha'])
n2.links.new(te.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 4.0
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
