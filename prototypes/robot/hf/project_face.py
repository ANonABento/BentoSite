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
if len(args) >= 11:
    bx0, by0, bx1, by1 = [int(float(a) * W) for a in args[7:11]]
    patch = px[by0:by1, bx0:bx1, :3]; sm = patch
    for _ in range(3): sm = blur(sm, 18)
    yy, xx = np.mgrid[0:by1 - by0, 0:bx1 - bx0]
    w_ = np.clip(np.minimum.reduce([xx, yy, (bx1 - bx0) - xx, (by1 - by0) - yy]) / 25.0, 0, 1)[..., None]   # feathered
    px[by0:by1, bx0:bx1, :3] = patch * (1 - w_) + sm * w_
    img.pixels = px[::-1].ravel().tolist()

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
tree = BVHTree.FromPolygons([tuple(c) for c in co], [p.vertices[:] for p in me.polygons])
ymin = co[:, 1].min() - 1
sel = []
for i in np.where(cand)[0]:
    hit = tree.ray_cast(mathutils.Vector((cen[i, 0], ymin, cen[i, 2])), mathutils.Vector((0, 1, 0)))
    if hit[2] == i or (hit[0] is not None and abs(hit[0][1] - cen[i, 1]) < 1e-3): sel.append(i)
print('projected faces', len(sel), 'of', int(cand.sum()))

# second material: the concept image, plus its orange glow as emission
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
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB'); print('saved', out)
