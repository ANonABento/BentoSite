# Project a front-view concept image straight onto the face of its TRELLIS model, so the eyes, lashes and glow come
# from the concept at full resolution (TRELLIS builds the model aligned to the input view, face looking down -Y).
# Faces that are front-facing, visible from the front and inside the face region get a second material with the
# concept image, UV-mapped by orthographic projection; the orange glow is also made emissive.
# Usage: blender -b -P project_face.py -- head.glb concept.png out.glb [x0 y0 x1 y1 region in concept, 0..1, y down]
import bpy, bmesh, sys, numpy as np, mathutils
from mathutils.bvhtree import BVHTree
args = sys.argv[sys.argv.index('--')+1:]; glb, png, out = args[:3]
REG = [float(a) for a in args[3:7]] if len(args) >= 7 else [0.2, 0.28, 0.8, 0.8]

bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
o = max([x for x in bpy.context.scene.objects if x.type == 'MESH'], key=lambda x: len(x.data.vertices)); me = o.data
me.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
co = np.array([v.co[:] for v in me.vertices])

# concept image, its silhouette against the plain backdrop
img = bpy.data.images.load(png); W, H = img.size
px = np.array(img.pixels[:]).reshape(H, W, 4)[::-1]          # row 0 = top
bg = np.median(np.concatenate([px[:8, :8, :3].reshape(-1, 3), px[:8, -8:, :3].reshape(-1, 3)]), 0)
fg = np.abs(px[..., :3] - bg).max(-1) > 0.06
ys, xs = np.where(fg); iy0, iy1, ix0, ix1 = ys.min(), ys.max(), xs.min(), xs.max()
x0, x1, z0, z1 = co[:, 0].min(), co[:, 0].max(), co[:, 2].min(), co[:, 2].max()
s = (iy1 - iy0) / (z1 - z0)                                    # px per metre, from the heights
cxi, cxm = (ix0 + ix1) / 2, (x0 + x1) / 2
def to_img(x, z): return cxi + (x - cxm) * s, iy0 + (z1 - z) * s
print('image bbox', ix0, ix1, iy0, iy1, 'mesh x', round(x0, 3), round(x1, 3), 'z', round(z0, 3), round(z1, 3), 'scale', round(s, 1))

# clean the concept: the lower face must be blank (no mouth line), so replace it with a heavy blur of itself
def blur(m, k):
    for ax in (0, 1):
        c = np.cumsum(np.pad(m, [(k + 1, k) if i == ax else (0, 0) for i in range(3)], mode='edge'), axis=ax)
        m = (np.take(c, range(2 * k + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * k - 1), axis=ax)) / (2 * k + 1)
    return m
BOXES = [[int(float(a) * W) for a in args[i:i + 4]] for i in range(7, len(args) - 3, 4)]
for bx0, by0, bx1, by1 in BOXES:   # blur out baked features we don't want (mouth line, nose shading)
    patch = px[by0:by1, bx0:bx1, :3]; sm = patch
    for _ in range(3): sm = blur(sm, 18)
    yy, xx = np.mgrid[0:by1 - by0, 0:bx1 - bx0]
    w_ = np.clip(np.minimum.reduce([xx, yy, (bx1 - bx0) - xx, (by1 - by0) - yy]) / 25.0, 0, 1)[..., None]   # feathered
    px[by0:by1, bx0:bx1, :3] = patch * (1 - w_) + sm * w_
if BOXES: img.pixels = px[::-1].ravel().tolist()

# geometry: weld TRELLIS's seam-split vertices, then gently smooth just the nose and mouth (so the nose is a faint
# swell and the sculpted mouth groove goes), and drop the imported custom normals that show the seams as creases
bm0 = bmesh.new(); bm0.from_mesh(me); bmesh.ops.remove_doubles(bm0, verts=bm0.verts, dist=1e-5); bm0.to_mesh(me); bm0.free()
co = np.array([v_.co[:] for v_ in me.vertices])
vu, vv = to_img(co[:, 0], co[:, 2]); vu, vv = vu / W, vv / H
vn = np.array([v_.normal[:] for v_ in me.vertices])
front = co[:, 1] < np.percentile(co[:, 1], 30)
zone = front & (vn[:, 1] < -0.3) & (np.abs(vu - 0.49) < 0.075) & (vv > 0.585) & (vv < 0.86)
EYES = [(0.335, 0.55), (0.655, 0.555)]                          # eye centres in the concept, 0..1
for ex_, ey_ in EYES:                                           # the torn lash shards around each eye
    rr_ = np.hypot((vu - ex_) / 0.13, (vv - ey_) / 0.1)
    zone |= front & (rr_ > 0.55) & (rr_ < 1.35)
nose = front & (np.abs(vu - 0.485) < 0.045) & (vv > 0.59) & (vv < 0.69)
ev = np.array([e.vertices[:] for e in me.edges]); deg = np.maximum(np.bincount(ev.ravel(), minlength=len(co)), 1)[:, None]
ring = np.zeros(len(co)); ring[zone] = 1.0
for _ in range(4):   # soft falloff a few rings outward
    nb = np.zeros(len(co)); np.add.at(nb, ev[:, 0], ring[ev[:, 1]]); np.add.at(nb, ev[:, 1], ring[ev[:, 0]])
    ring = np.maximum(ring, np.where(front & (vn[:, 1] < -0.3), nb / deg[:, 0] * 0.8, 0))
for it in range(80):
    nb = np.zeros_like(co); np.add.at(nb, ev[:, 0], co[ev[:, 1]]); np.add.at(nb, ev[:, 1], co[ev[:, 0]])
    lam = 0.5 if it % 2 == 0 else -0.53
    co += (lam * ring)[:, None] * (nb / deg - co)
for it in range(300):                                           # the nose nub: much more, until it is a faint swell
    nb = np.zeros_like(co); np.add.at(nb, ev[:, 0], co[ev[:, 1]]); np.add.at(nb, ev[:, 1], co[ev[:, 0]])
    lam = 0.5 if it % 2 == 0 else -0.53
    co[nose] += lam * (nb[nose] / deg[nose] - co[nose])
ring = np.maximum(ring, nose.astype(float))
# the nose itself is a broad bump, which smoothing keeps by design: fit the surrounding face (an annulus around the
# nose tip) with a quadratic and pull the nose onto it, leaving only a faint swell
NX, NZ = 0.0, z1 - ((0.64 * H) - iy0) / s                         # nose tip, from the concept
rr2 = np.hypot(co[:, 0] - NX, co[:, 2] - NZ); fr = co[:, 1] < np.percentile(co[:, 1], 30)
ann = fr & (rr2 > 0.055) & (rr2 < 0.085)
Xq = lambda x_, z_: np.stack([np.ones_like(x_), x_, z_, x_ * x_, x_ * z_, z_ * z_], 1)
cq, *_ = np.linalg.lstsq(Xq(co[ann, 0], co[ann, 2]), co[ann, 1], rcond=None)
inn = fr & (rr2 < 0.07)
t_ = np.clip((0.07 - rr2[inn]) / 0.02, 0, 1); w2 = t_ * t_ * (3 - 2 * t_)
fit_y = Xq(co[inn, 0], co[inn, 2]) @ cq - 0.006 * np.exp(-(rr2[inn] / 0.03) ** 2)   # the faint swell that stays
co[inn, 1] = co[inn, 1] + (fit_y - co[inn, 1]) * w2
ring[inn] = 1.0
relax = fr & (rr2 < 0.08)                                       # relax the flattened patch's crumpled triangles
for it in range(60):
    nb = np.zeros_like(co); np.add.at(nb, ev[:, 0], co[ev[:, 1]]); np.add.at(nb, ev[:, 1], co[ev[:, 0]])
    lam = 0.5 if it % 2 == 0 else -0.53
    co[relax] += lam * (nb[relax] / deg[relax] - co[relax])
ring[relax] = 1.0
print('nose flattened', int(inn.sum()), 'at z', round(NZ, 3))
for i in np.where(ring > 0)[0]: me.vertices[i].co = co[i]
bpy.context.view_layer.objects.active = o; o.select_set(True)
try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
except Exception as ex_: print('normals', ex_)
for p_ in me.polygons: p_.use_smooth = True
me.update(); print('smoothed verts', int((ring > 0).sum()))

# which faces: front-facing, the first thing a ray from the front hits, and inside the face region
n = len(me.polygons)
cen = np.zeros(n * 3); me.polygons.foreach_get('center', cen); cen = cen.reshape(-1, 3)
nrm = np.zeros(n * 3); me.polygons.foreach_get('normal', nrm); nrm = nrm.reshape(-1, 3)
u, v = to_img(cen[:, 0], cen[:, 2])
cand = (nrm[:, 1] < -0.08) & (u > REG[0] * W) & (u < REG[2] * W) & (v > REG[1] * H) & (v < REG[3] * H)
sil = np.zeros_like(fg)                                          # solid silhouette: everything between the outermost
for y_ in range(H):                                             # foreground pixels of each row (glossy greys can
    xs_ = np.where(fg[y_])[0]                                   # match the backdrop, so fg itself has holes)
    if len(xs_): sil[y_, xs_[0]:xs_[-1] + 1] = True
fgE = sil.copy()
for _ in range(8): fgE &= np.roll(fgE, 1, 0) & np.roll(fgE, -1, 0) & np.roll(fgE, 1, 1) & np.roll(fgE, -1, 1)
cand &= fgE[np.clip(v, 0, H - 1).astype(int), np.clip(u, 0, W - 1).astype(int)]   # never project the backdrop
zone_p = np.zeros(len(cen), bool)                                # nose and eye surrounds: any face not facing away
pu_, pv_ = u / W, v / H
zone_p |= (np.abs(pu_ - 0.485) < 0.05) & (pv_ > 0.58) & (pv_ < 0.72)
for ex_, ey_ in EYES: zone_p |= np.hypot((pu_ - ex_) / 0.15, (pv_ - ey_) / 0.12) < 1
cand |= zone_p & (nrm[:, 1] < 0.35) & (cen[:, 1] < np.percentile(co[:, 1], 30))
# never project onto hair: TRELLIS's own colour of each polygon (dark = hair) unless it's in an eye
ntA = me.materials[0].node_tree
baseA = [n_ for n_ in ntA.nodes if n_.type == 'TEX_IMAGE' and 'base' in n_.image.name.lower()][0].image
AW, AH = baseA.size; bpA = np.array(baseA.pixels[:]).reshape(AH, AW, 4)
uvA = np.zeros(len(me.loops) * 2); me.uv_layers.active.data.foreach_get('uv', uvA); uvA = uvA.reshape(-1, 2)
lcol = bpA[(np.clip(uvA[:, 1], 0, 1) * (AH - 1)).astype(int), (np.clip(uvA[:, 0], 0, 1) * (AW - 1)).astype(int), :3].mean(1)
lstart = np.zeros(len(me.polygons), int); me.polygons.foreach_get('loop_start', lstart)
ltot = np.zeros(len(me.polygons), int); me.polygons.foreach_get('loop_total', ltot)
plum = np.add.reduceat(lcol, lstart) / ltot
in_eye_p = np.zeros(len(cen), bool)
for ex_, ey_ in EYES: in_eye_p |= np.hypot((pu_ - ex_) / 0.15, (pv_ - ey_) / 0.12) < 1
cand &= (plum > 0.4) | in_eye_p
tree = BVHTree.FromPolygons([tuple(c) for c in co], [p.vertices[:] for p in me.polygons])
ymin = co[:, 1].min() - 1
sel = []
nose_p = (np.abs(pu_ - 0.485) < 0.07) & (pv_ > 0.57) & (pv_ < 0.75) & (cen[:, 1] < np.percentile(co[:, 1], 30))
for i in np.where(nose_p)[0]: sel.append(i)                       # nothing sits in front of the nose: take them all
cand &= ~nose_p
for i in np.where(cand)[0]:
    hit = tree.ray_cast(mathutils.Vector((cen[i, 0], ymin, cen[i, 2])), mathutils.Vector((0, 1, 0)))
    if hit[2] == i or (hit[0] is not None and abs(hit[0][1] - cen[i, 1]) < (6e-3 if zone_p[i] else 1e-3)): sel.append(i)
print('projected faces', len(sel), 'of', int(cand.sum()))

# second material: the concept image, plus its orange glow as emission
# clean colour, face: flatten the concept's baked skin shading to one porcelain white (3D lighting does the shading);
# the eyes (inside their ellipses) and anything coloured stay as they are
pyy, pxx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
eyez = np.zeros((H, W), bool)
for ex_, ey_ in EYES: eyez |= ((pxx - ex_) / 0.15) ** 2 + ((pyy - ey_) / 0.12) ** 2 < 1
lum_ = px[..., :3].mean(-1); sat_ = px[..., :3].max(-1) - px[..., :3].min(-1)
skin_ = (lum_ > 0.55) & (sat_ < 0.15) & ~eyez
px[skin_, :3] = [0.93, 0.925, 0.92]
img.pixels = px[::-1].ravel().tolist()
emis = np.zeros_like(px); emis[..., 3] = 1
r, g, b = px[..., 0], px[..., 1], px[..., 2]
glow = (r > 0.55) & (r - b > 0.35) & (g > 0.18)                # the orange rings and their halo
emis[glow, :3] = px[glow, :3]
eimg = bpy.data.images.new('concept_emit', W, H); eimg.pixels = emis[::-1].ravel().tolist(); eimg.pack()
img.pack()
m = bpy.data.materials.new('FaceProjected'); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = img; tc.extension = 'EXTEND'
te = nt.nodes.new('ShaderNodeTexImage'); te.image = eimg; te.extension = 'EXTEND'
nt.links.new(tc.outputs['Color'], bs.inputs['Base Color']); nt.links.new(te.outputs['Color'], bs.inputs['Emission Color'])
bs.inputs['Emission Strength'].default_value = 3.0; bs.inputs['Roughness'].default_value = 0.2
me.materials.append(m); mi = len(me.materials) - 1
uvl = me.uv_layers.active.data
for i in sel:
    p = me.polygons[i]; p.material_index = mi
    for li in p.loop_indices:
        c = me.vertices[me.loops[li].vertex_index].co; uu, vv = to_img(c.x, c.z)
        uvl[li].uv = (uu / (W - 1), 1 - vv / (H - 1))
# clean colour, everything else: snap TRELLIS's texture to glossy black (hair) or clean white (frill, collar), with a
# small majority filter so speckles and grey seams go; strongly coloured texels (the apron straps) are left alone
nt0 = me.materials[0].node_tree
base0 = [n_ for n_ in nt0.nodes if n_.type == 'TEX_IMAGE' and 'base' in n_.image.name.lower()][0].image
BW, BH = base0.size; bp0 = np.array(base0.pixels[:]).reshape(BH, BW, 4)
l0 = bp0[..., :3].mean(-1); s0 = bp0[..., :3].max(-1) - bp0[..., :3].min(-1)
white = blur((l0 > 0.42).astype(float)[..., None], 3)[..., 0] > 0.5
keep = s0 > 0.2
bp0[white & ~keep, :3] = [0.92, 0.915, 0.91]; bp0[~white & ~keep, :3] = [0.025, 0.025, 0.03]
# the bang tips: in the band just above the eyes, anything that is still TRELLIS texture (not the projected face) is
# hair, so paint those triangles black (they carried slivers of skin colour)
uvd0 = me.uv_layers.active.data
band = [p_ for p_ in me.polygons if p_.material_index == 0 and 0.2 < pu_[p_.index] < 0.8 and 0.36 < pv_[p_.index] < 0.52
        and cen[p_.index, 1] < np.percentile(co[:, 1], 30)]
bm_ = np.zeros((BH, BW), bool)
for p_ in band:
    uv_ = np.array([uvd0[li].uv[:] for li in p_.loop_indices]) * [BW - 1, BH - 1]
    for t in range(1, len(uv_) - 1):
        A_, B_, C_ = uv_[0], uv_[t], uv_[t + 1]
        x0_, x1_ = int(max(min(A_[0], B_[0], C_[0]) - 1, 0)), int(min(max(A_[0], B_[0], C_[0]) + 2, BW))
        y0_, y1_ = int(max(min(A_[1], B_[1], C_[1]) - 1, 0)), int(min(max(A_[1], B_[1], C_[1]) + 2, BH))
        if x1_ <= x0_ or y1_ <= y0_: continue
        gx, gy = np.meshgrid(np.arange(x0_, x1_), np.arange(y0_, y1_))
        d_ = (B_[1] - C_[1]) * (A_[0] - C_[0]) + (C_[0] - B_[0]) * (A_[1] - C_[1])
        if abs(d_) < 1e-9: continue
        l1 = ((B_[1] - C_[1]) * (gx - C_[0]) + (C_[0] - B_[0]) * (gy - C_[1])) / d_
        l2 = ((C_[1] - A_[1]) * (gx - C_[0]) + (A_[0] - C_[0]) * (gy - C_[1])) / d_
        bm_[y0_:y1_, x0_:x1_] |= (l1 >= -0.1) & (l2 >= -0.1) & (1 - l1 - l2 >= -0.1)
bp0[bm_, :3] = [0.025, 0.025, 0.03]
print('bang tip polys', len(band))
base0.pixels = bp0.ravel().tolist(); base0.pack()
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB'); print('saved', out)
