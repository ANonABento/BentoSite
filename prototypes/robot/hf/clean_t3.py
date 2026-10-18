# Clean up the TRELLIS model of concept t3e-s377 (the robot maid unit): crisp face from the concept, flat nose,
# black/white texture, no skin band on the thighs, no invented gold patch on the back.
# Face: a 4x upscale of the concept's face, cleaned (flat porcelain skin, no nose dot or blush) and with the eyes
# redrawn crisply (the concept's own dark eye shape, smoothed, plus a fitted orange ring), projected onto the front of
# the head from the front, the same way as project_face.py. The ring also goes in an emission image.
# Usage: blender -b -P clean_t3.py -- model.glb concept.png out.glb
import bpy, bmesh, sys, numpy as np, mathutils
from mathutils.bvhtree import BVHTree
glb, png, out = sys.argv[sys.argv.index('--') + 1:][:3]
CROP = (300, 140, 500, 340)      # face box in the concept, px (x0, y0, x1, y1)
UP = 4                           # upscale of the face texture
FACE = (335, 200, 468, 314)      # projection region in the concept, px: the face between the ear modules, above the chin
NOSE = (386, 267)                # nose dot in the concept, px

bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]; me = o.data
me.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
bm0 = bmesh.new(); bm0.from_mesh(me); bmesh.ops.remove_doubles(bm0, verts=bm0.verts, dist=1e-5); bm0.to_mesh(me); bm0.free()
co = np.array([v.co[:] for v in me.vertices])

def blur(m, k):
    for ax in (0, 1):
        c = np.cumsum(np.pad(m, [(k + 1, k) if i == ax else (0, 0) for i in range(m.ndim)], mode='edge'), axis=ax)
        m = (np.take(c, range(2 * k + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * k - 1), axis=ax)) / (2 * k + 1)
    return m

# concept → mesh mapping (front orthographic: the concept's silhouette height is the mesh height, centred in x)
img = bpy.data.images.load(png); W, H = img.size
px = np.array(img.pixels[:]).reshape(H, W, 4)[::-1].copy()
bg = np.median(np.concatenate([px[:8, :8, :3].reshape(-1, 3), px[:8, -8:, :3].reshape(-1, 3)]), 0)
fg = np.abs(px[..., :3] - bg).max(-1) > 0.06
ys, xs = np.where(fg); iy0, iy1 = ys.min(), ys.max()
x0, x1, z0, z1 = co[:, 0].min(), co[:, 0].max(), co[:, 2].min(), co[:, 2].max()
s = (iy1 - iy0) / (z1 - z0)
cxi = (xs.min() + xs.max()) / 2; cxm = (x0 + x1) / 2
def to_img(x, z): return cxi + (x - cxm) * s, iy0 + (z1 - z) * s
def to_mesh(u, v): return cxm + (u - cxi) / s, z1 - (v - iy0) / s
print('scale px/m', round(s, 1), 'z', round(z0, 3), round(z1, 3))

# ---- the face texture
cx0, cy0, cx1, cy1 = CROP; CW, CH = (cx1 - cx0) * UP, (cy1 - cy0) * UP
src = px[cy0:cy1, cx0:cx1, :3]
yy, xx = (np.mgrid[0:CH, 0:CW] + 0.5) / UP - 0.5                       # bilinear upscale
y0i, x0i = np.clip(np.floor(yy).astype(int), 0, src.shape[0] - 2), np.clip(np.floor(xx).astype(int), 0, src.shape[1] - 2)
fy, fx = np.clip(yy - y0i, 0, 1)[..., None], np.clip(xx - x0i, 0, 1)[..., None]
F = (src[y0i, x0i] * (1 - fx) * (1 - fy) + src[y0i, x0i + 1] * fx * (1 - fy) + src[y0i + 1, x0i] * (1 - fx) * fy + src[y0i + 1, x0i + 1] * fx * fy)
lum = F.mean(-1); r, g, b = F[..., 0], F[..., 1], F[..., 2]
orange = (r > 0.45) & (r - b > 0.3)
# eyes: the orange rings locate them; the dark eye shape around each ring is the concept's own, smoothed
lab = np.zeros(orange.shape, int); oy, ox = np.where(orange)
lab[oy, ox] = np.where(ox < CW / 2, 1, 2)
EYES = []
for k in (1, 2):
    ey, ex = np.where(lab == k); ccx, ccy = ex.mean(), ey.mean()
    rr = np.hypot(ex - ccx, ey - ccy); EYES.append((ccx, ccy, np.median(rr), max(np.percentile(rr, 85) - np.percentile(rr, 15), 6)))
print('eyes (crop px)', [tuple(round(float(a), 1) for a in e) for e in EYES])
dark = blur(((lum < 0.3) | orange).astype(float), 3) > 0.5
eyemask = np.zeros_like(dark)
for ccx, ccy, rad, wid in EYES:
    eyemask |= np.hypot((xx * UP - ccx) / (rad * 2.6), (yy * UP - ccy) / (rad * 2.2)) < 1   # generous ellipse
eye_shape = blur((dark & eyemask).astype(float), 4)                    # soft 0..1, crisp after the smoothstep
eye_a = np.clip((eye_shape - 0.35) / 0.3, 0, 1); eye_a = eye_a * eye_a * (3 - 2 * eye_a)
# skin: everything light and unsaturated inside the face (and the blush, which is light pink) → one porcelain white
skin = (lum > 0.5) & (((F.max(-1) - F.min(-1)) < 0.25) | (r > 0.7)) & ~eyemask
sclera = (lum > 0.5) & eyemask & ~dark
F[sclera] = [0.95, 0.95, 0.95]
F[skin] = [0.93, 0.925, 0.92]
nx, ny = (NOSE[0] - cx0) * UP, (NOSE[1] - cy0) * UP                     # the nose dot
F[np.hypot(xx * UP - nx, yy * UP - ny) < 14] = [0.93, 0.925, 0.92]
# redraw the eyes: black glass with a faint warm lift toward the bottom, a crisp orange ring, one small highlight
EM = np.zeros_like(F)
for ccx, ccy, rad, wid in EYES:
    d = np.hypot(xx * UP - ccx, yy * UP - ccy)
    inside = eye_a * (d < rad * 3)
    glass = np.stack([0.025 + 0.05 * np.clip((yy * UP - ccy) / rad, 0, 1)] * 3, -1) * [1.0, 0.75, 0.6]
    F = F * (1 - inside[..., None]) + glass * inside[..., None]
    ring = np.clip(1 - np.abs(d - rad) / (wid * 0.55), 0, 1); ring = ring * ring * (3 - 2 * ring)
    halo = np.exp(-((d - rad) / (wid * 0.9)) ** 2) * 0.3 * inside * (d < rad * 1.1)
    col = np.array([1.0, 0.52, 0.1])
    F = F * (1 - ring[..., None]) + col * ring[..., None] + col * halo[..., None]
    EM = np.maximum(EM, col * np.maximum(ring, halo)[..., None])
    hl = np.clip(1 - np.hypot(xx * UP - (ccx - rad * 0.55), yy * UP - (ccy - rad * 0.6)) / (rad * 0.22), 0, 1)
    F = F * (1 - hl[..., None]) + hl[..., None] * 0.95
F = np.clip(F, 0, 1)
def mkimg(name, A):
    im = bpy.data.images.new(name, CW, CH); im.pixels = np.dstack([A, np.ones((CH, CW))])[::-1].ravel().tolist(); im.pack(); return im
face_img, emit_img = mkimg('face_t3', F), mkimg('face_t3_emit', EM)

# ---- geometry: flatten the nose to a faint swell (quadratic fit of the surrounding face), relax, clear normals
ev = np.array([e.vertices[:] for e in me.edges]); deg = np.maximum(np.bincount(ev.ravel(), minlength=len(co)), 1)[:, None]
NXm, NZm = to_mesh(*NOSE)
headfront = (co[:, 2] > to_mesh(0, FACE[3])[1]) & (co[:, 2] < to_mesh(0, FACE[1])[1]) & (np.abs(co[:, 0] - NXm) < 0.06)
yfront = np.percentile(co[headfront, 1], 10)
fr = headfront & (co[:, 1] < yfront + 0.03)
rr2 = np.hypot(co[:, 0] - NXm, co[:, 2] - NZm)
R0, R1 = 13 / s, 22 / s
ann = fr & (rr2 > R0) & (rr2 < R1)
Xq = lambda x_, z_: np.stack([np.ones_like(x_), x_, z_, x_ * x_, x_ * z_, z_ * z_], 1)
cq, *_ = np.linalg.lstsq(Xq(co[ann, 0], co[ann, 2]), co[ann, 1], rcond=None)
inn = fr & (rr2 < (R0 + R1) / 2)
t_ = np.clip(((R0 + R1) / 2 - rr2[inn]) / (R0 * 0.4), 0, 1); w2 = t_ * t_ * (3 - 2 * t_)
fit_y = Xq(co[inn, 0], co[inn, 2]) @ cq - 0.0006 * np.exp(-(rr2[inn] / (R0 * 0.5)) ** 2)
co[inn, 1] += (fit_y - co[inn, 1]) * w2
relax = fr & (rr2 < R1)
for it in range(60):
    nb = np.zeros_like(co); np.add.at(nb, ev[:, 0], co[ev[:, 1]]); np.add.at(nb, ev[:, 1], co[ev[:, 0]])
    co[relax] += (0.5 if it % 2 == 0 else -0.53) * (nb[relax] / deg[relax] - co[relax])
print('nose verts flattened', int(inn.sum()), 'ann', int(ann.sum()))
me.vertices.foreach_set('co', co.ravel())
bpy.context.view_layer.objects.active = o; o.select_set(True)
try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
except Exception as ex_: print('normals', ex_)
for p_ in me.polygons: p_.use_smooth = True
me.update()

# ---- which faces get the face texture
n = len(me.polygons)
cen = np.zeros(n * 3); me.polygons.foreach_get('center', cen); cen = cen.reshape(-1, 3)
nrm = np.zeros(n * 3); me.polygons.foreach_get('normal', nrm); nrm = nrm.reshape(-1, 3)
pu, pv = to_img(cen[:, 0], cen[:, 2])
base = [n_ for n_ in me.materials[0].node_tree.nodes if n_.type == 'TEX_IMAGE' and 'base' in n_.image.name.lower()][0].image
BW, BH = base.size; bp = np.array(base.pixels[:]).reshape(BH, BW, 4)
uvd = me.uv_layers.active.data
uv = np.zeros(len(me.loops) * 2); uvd.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
lcol = bp[(np.clip(uv[:, 1], 0, 1) * (BH - 1)).astype(int), (np.clip(uv[:, 0], 0, 1) * (BW - 1)).astype(int), :3]
ls = np.zeros(n, int); me.polygons.foreach_get('loop_start', ls); lt = np.zeros(n, int); me.polygons.foreach_get('loop_total', lt)
pcol = np.add.reduceat(lcol, ls) / lt[:, None]; plum = pcol.mean(1)
in_face = (pu > FACE[0]) & (pu < FACE[2]) & (pv > FACE[1]) & (pv < FACE[3]) & (cen[:, 1] < yfront + 0.03)
cu, cv = (pu - cx0) * UP, (pv - cy0) * UP
in_eye = np.zeros(n, bool)
for ccx, ccy, rad, wid in EYES: in_eye |= np.hypot((cu - ccx) / (rad * 2.6), (cv - ccy) / (rad * 2.2)) < 1
cand = in_face & (nrm[:, 1] < -0.05) & ((plum > 0.4) | in_eye)
tree = BVHTree.FromPolygons([tuple(c) for c in co], [p.vertices[:] for p in me.polygons])
sel = [i for i in np.where(cand)[0]
       if (lambda h: h[2] == i or (h[0] is not None and abs(h[0][1] - cen[i, 1]) < 2e-3))(
           tree.ray_cast(mathutils.Vector((cen[i, 0], co[:, 1].min() - 1, cen[i, 2])), mathutils.Vector((0, 1, 0))))]
nose_p = in_face & (((np.hypot(cen[:, 0] - NXm, cen[:, 2] - NZm) < R1) | in_eye)) & (nrm[:, 1] < 0.3)   # nothing sits in front of the nose or inside the eye sockets
sel = sorted(set(sel) | set(np.where(nose_p)[0].tolist()))
print('face polys', len(sel), 'of', int(cand.sum()))
m = bpy.data.materials.new('Face'); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = face_img; tc.extension = 'EXTEND'
te = nt.nodes.new('ShaderNodeTexImage'); te.image = emit_img; te.extension = 'EXTEND'
nt.links.new(tc.outputs['Color'], bs.inputs['Base Color']); nt.links.new(te.outputs['Color'], bs.inputs['Emission Color'])
bs.inputs['Emission Strength'].default_value = 2.0; bs.inputs['Roughness'].default_value = 0.3
me.materials.append(m); mi = len(me.materials) - 1
for i in sel:
    p = me.polygons[i]; p.material_index = mi
    for li in p.loop_indices:
        c = co[me.loops[li].vertex_index]; uu, vv = to_img(c[0], c[2])
        uvd[li].uv = ((uu - cx0) * UP / (CW - 1), 1 - (vv - cy0) * UP / (CH - 1))

# ---- body texture: snap to black / white (saturated texels, the orange trim, are kept), then two targeted fixes
def raster(polys):
    mk = np.zeros((BH, BW), bool)
    for p_ in polys:
        q = np.array([uvd[li].uv[:] for li in p_.loop_indices]) * [BW - 1, BH - 1]
        for t in range(1, len(q) - 1):
            A, B, C = q[0], q[t], q[t + 1]
            xa, xb = int(max(min(A[0], B[0], C[0]) - 1, 0)), int(min(max(A[0], B[0], C[0]) + 2, BW))
            ya, yb = int(max(min(A[1], B[1], C[1]) - 1, 0)), int(min(max(A[1], B[1], C[1]) + 2, BH))
            if xb <= xa or yb <= ya: continue
            gx, gy = np.meshgrid(np.arange(xa, xb), np.arange(ya, yb))
            d_ = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1])
            if abs(d_) < 1e-12: continue
            l1 = ((B[1] - C[1]) * (gx - C[0]) + (C[0] - B[0]) * (gy - C[1])) / d_
            l2 = ((C[1] - A[1]) * (gx - C[0]) + (A[0] - C[0]) * (gy - C[1])) / d_
            mk[ya:yb, xa:xb] |= (l1 >= -0.15) & (l2 >= -0.15) & (1 - l1 - l2 >= -0.15)
    return mk
l0 = bp[..., :3].mean(-1); s0 = bp[..., :3].max(-1) - bp[..., :3].min(-1)
hue_orange = (bp[..., 0] > 0.4) & (bp[..., 0] - bp[..., 2] > 0.3) & (bp[..., 1] < bp[..., 0] * 0.75)
white = blur((l0 > 0.42).astype(float), 2) > 0.5
WHITE, BLACK = [0.92, 0.915, 0.91], [0.025, 0.025, 0.03]
bp[white & ~hue_orange, :3] = WHITE; bp[~white & ~hue_orange, :3] = BLACK
# the back: TRELLIS invented a gold patch between the shoulder blades; on the back of the torso nothing is orange
zw = co[:, 2]; waist = to_mesh(0, 520)[1]; shoulder = to_mesh(0, 330)[1]
back = [me.polygons[i] for i in np.where((nrm[:, 1] > 0.15) & (cen[:, 2] > waist) & (cen[:, 2] < shoulder) & (np.abs(cen[:, 0]) < 0.07))[0]]
bmask = raster(back)                                              # the dress back is plain black
bp[bmask, :3] = BLACK
chin = to_mesh(0, 290)[1]                                        # above the cheeks (the orange bow sits just under the chin); nothing up there is orange (eye-socket chips)
warm = (bp[..., 0] > 0.12) & (bp[..., 0] - bp[..., 2] > 0.08)       # incl. the muddy brown-orange of TRELLIS's eyes
hmask = raster([me.polygons[i] for i in np.where(cen[:, 2] > chin)[0]]) & warm
bp[hmask, :3] = BLACK
print('head orange texels', int(hmask.sum()))
print('back polys', len(back), 'texels recoloured', int(bmask.sum()))
base.pixels = bp.ravel().tolist(); base.pack()

# ---- eye decals: the sockets are deep bowls (a projected eye shows its ring twice from the side), so each eye is a
# separate thin curved card flush with the face around it, carrying the redrawn eye with an alpha cut-out
alpha = blur(((dark | sclera) & eyemask).astype(float), 2); alpha = np.clip((alpha - 0.3) / 0.4, 0, 1)
eimg_ = bpy.data.images.new('eye_t3', CW, CH, alpha=True); eimg_.pixels = np.dstack([F, alpha])[::-1].ravel().tolist(); eimg_.pack()
me_ = bpy.data.materials.new('EyeGlass'); me_.use_nodes = True; nt_ = me_.node_tree; bs_ = nt_.nodes['Principled BSDF']
t1 = nt_.nodes.new('ShaderNodeTexImage'); t1.image = eimg_; t1.extension = 'CLIP'
t2 = nt_.nodes.new('ShaderNodeTexImage'); t2.image = emit_img; t2.extension = 'CLIP'
nt_.links.new(t1.outputs['Color'], bs_.inputs['Base Color']); nt_.links.new(t1.outputs['Alpha'], bs_.inputs['Alpha'])
nt_.links.new(t2.outputs['Color'], bs_.inputs['Emission Color']); bs_.inputs['Emission Strength'].default_value = 2.0
bs_.inputs['Roughness'].default_value = 0.15
try: me_.blend_method = 'BLEND'
except Exception: pass
try: me_.surface_render_method = 'BLENDED'
except Exception: pass
for k_, (ccx, ccy, rad, wid) in enumerate(EYES):
    exm, ezm = to_mesh(cx0 + ccx / UP, cy0 + ccy / UP); ER = rad * 2.6 / UP / s; EZ = rad * 2.2 / UP / s
    re_ = np.hypot((co[:, 0] - exm) / ER, (co[:, 2] - ezm) / EZ)
    efr = headfront & (co[:, 1] < yfront + 0.04)
    ea = efr & (re_ > 1.0) & (re_ < 1.5)
    ce, *_ = np.linalg.lstsq(Xq(co[ea, 0], co[ea, 2]), co[ea, 1], rcond=None)
    N_ = 28; gx_, gz_ = np.meshgrid(np.linspace(exm - ER * 1.05, exm + ER * 1.05, N_), np.linspace(ezm - EZ * 1.05, ezm + EZ * 1.05, N_))
    gy_ = (Xq(gx_.ravel(), gz_.ravel()) @ ce).reshape(N_, N_) - 0.0006
    vs = np.stack([gx_, gy_, gz_], -1).reshape(-1, 3)
    fs = [(j * N_ + i, j * N_ + i + 1, (j + 1) * N_ + i + 1, (j + 1) * N_ + i) for j in range(N_ - 1) for i in range(N_ - 1)]
    dm = bpy.data.meshes.new(f'Eye{"LR"[k_]}'); dm.from_pydata(vs.tolist(), [], fs); dm.update()
    dm.uv_layers.new(name='UVMap'); ud = dm.uv_layers.active.data
    for p_ in dm.polygons:
        p_.use_smooth = True
        for li in p_.loop_indices:
            c = vs[dm.loops[li].vertex_index]; uu, vv = to_img(c[0], c[2])
            ud[li].uv = ((uu - cx0) * UP / (CW - 1), 1 - (vv - cy0) * UP / (CH - 1))
    dm.materials.append(me_)
    ob_ = bpy.data.objects.new(dm.name, dm); bpy.context.scene.collection.objects.link(ob_)
    print('eye decal', dm.name, 'at', round(exm, 3), round(ezm, 3), 'size', round(ER, 4), round(EZ, 4))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB'); print('saved', out)
import os
if os.environ.get('DUMP'): face_img.filepath_raw = os.environ['DUMP']; face_img.file_format = 'PNG'; face_img.save()
