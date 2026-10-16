# Fix a TRELLIS anime face: flatten the sculpted nose and lips onto a smooth face surface, and put anime-eye decals
# (separate meshes, so they can glow and blink) over the eye blobs. Usage: blender -b -P fix_face.py -- in.glb out.glb
import bpy, bmesh, sys, numpy as np, mathutils
a = sys.argv[sys.argv.index('--')+1:]; glb, out = a[0], a[1]
EYE = mathutils.Vector((0.022, -0.042, 0.3775)); EW, EH = 0.023, 0.026   # right eye centre (mirror for left), decal size
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]; me = o.data
o.data.transform(o.matrix_world); o.matrix_world = mathutils.Matrix()
co = np.array([v.co[:] for v in me.vertices]); nrm = np.array([v.normal[:] for v in me.vertices])
x, y, z = co.T
front = (y < EYE.y + 0.03) & (nrm[:, 1] < -0.2) & (z > 0.32) & (z < 0.40) & (np.abs(x) < 0.05)
# nose: Laplacian-smooth a soft-edged patch so the bump melts into the face (no hard push, no ridge)
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
patch = np.where(front & (np.abs(x) < 0.016) & (z > 0.352) & (z < 0.372))[0]
fall = np.clip((0.016 - np.abs(x[patch])) / 0.007, 0, 1) * np.clip((z[patch] - 0.354) / 0.004, 0, 1) * np.clip((0.372 - z[patch]) / 0.004, 0, 1)
for it in range(150):
    new = {}
    for i, k in zip(patch, fall):
        v = bm.verts[i]; nb = [e.other_vert(v).co for e in v.link_edges]
        if nb: new[i] = v.co.lerp(sum(nb, mathutils.Vector()) / len(nb), 0.6 * k)
    for i, c in new.items(): bm.verts[i].co = c
bm.to_mesh(me); bm.free()
print('smoothed', len(patch))

# skin texture: paint the old red eye blobs with the cheek colour, so nothing shows round the decals
mat0 = me.materials[0]; im0 = [n for n in mat0.node_tree.nodes if n.type == 'TEX_IMAGE' and 'base' in n.image.name.lower()][0].image
TW, TH = im0.size; tp = np.array(im0.pixels[:]).reshape(TH, TW, 4)
uvd = me.uv_layers.active.data; vuv = np.zeros((len(me.vertices), 2))
for l in me.loops: vuv[l.vertex_index] = uvd[l.index].uv
near = front & (np.abs(np.abs(x) - EYE.x) < 0.02) & (np.abs(z - EYE.z) < 0.02)
pix = (np.clip(vuv[near, 1], 0, 1) * (TH - 1)).astype(int), (np.clip(vuv[near, 0], 0, 1) * (TW - 1)).astype(int)
cheekm = front & (np.abs(x) > 0.015) & (np.abs(x) < 0.03) & (z > 0.355) & (z < 0.362)
skin = tp[(np.clip(vuv[cheekm, 1], 0, 1) * (TH - 1)).astype(int), (np.clip(vuv[cheekm, 0], 0, 1) * (TW - 1)).astype(int)].mean(0)
r0, c0 = pix; ys, xs = np.clip(r0.min() - 3, 0, TH), np.clip(c0.min() - 3, 0, TW); ye, xe = r0.max() + 4, c0.max() + 4
box = tp[ys:ye, xs:xe]; redm = (box[..., 0] > 0.45) & (box[..., 0] > box[..., 1] * 1.6)
box[redm] = skin; tp[ys:ye, xs:xe] = box; im0.pixels = tp.ravel().tolist(); im0.pack()
print('painted', int(redm.sum()), 'skin', skin.round(2))

# anime eye texture, drawn with numpy (right eye; the left is mirrored)
N = 256; yy, xx = np.mgrid[0:N, 0:N] / (N - 1); u, v = xx - 0.5, 0.5 - yy   # v up
img = np.zeros((N, N, 4))
eye = (u / 0.46) ** 2 + ((v + 0.02) / 0.42) ** 2 < 1                     # the eye opening
iris = (u / 0.30) ** 2 + ((v + 0.04) / 0.38) ** 2 < 1
g = np.clip((0.35 - v) / 0.75, 0, 1)[..., None]                          # dark at the top, bright below
iriscol = np.array([0.35, 0.07, 0.01]) * (1 - g) + np.array([1.0, 0.55, 0.15]) * g
ring = iris & ((u / 0.30) ** 2 + ((v + 0.04) / 0.38) ** 2 > 0.78)
pupil = (u / 0.10) ** 2 + ((v + 0.02) / 0.17) ** 2 < 1
lash = ((u / 0.50) ** 2 + ((v + 0.02) / 0.48) ** 2 < 1) & (v > 0.14 + 0.18 * (u / 0.5) ** 2) & ~((u / 0.42) ** 2 + ((v + 0.02) / 0.36) ** 2 < 1)
wing = (u > 0.30) & (u < 0.50) & (np.abs(v - (0.28 + 0.35 * (u - 0.3))) < 0.035)
lower = (np.abs((u / 0.36) ** 2 + ((v + 0.06) / 0.40) ** 2 - 1) < 0.08) & (v < -0.3)
hl1 = ((u + 0.10) / 0.09) ** 2 + ((v - 0.12) / 0.11) ** 2 < 1
hl2 = ((u - 0.12) / 0.04) ** 2 + ((v + 0.22) / 0.04) ** 2 < 1
img[iris, :3] = iriscol[iris]; img[iris, 3] = 1; img[ring, :3] *= 0.55
img[pupil, :3] = [0.12, 0.02, 0.0]
img[hl1 | hl2] = [1, 1, 1, 1]
img[lash | wing] = [0.03, 0.02, 0.03, 1]
img[lower] = [0.25, 0.12, 0.1, 0.8]
emis = np.zeros((N, N, 4)); emis[..., 3] = 1; emis[iris & ~pupil, :3] = iriscol[iris & ~pupil]; emis[hl1 | hl2, :3] = 1
def mkimg(name, arr):
    im = bpy.data.images.new(name, N, N, alpha=True); im.pixels = arr[::-1].ravel().tolist(); im.pack(); return im
col_im, emi_im = mkimg('eye_color', img), mkimg('eye_emit', emis)
m = bpy.data.materials.new('Eyes'); m.use_nodes = True; m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
nt = m.node_tree; bs = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = col_im
te = nt.nodes.new('ShaderNodeTexImage'); te.image = emi_im
nt.links.new(tc.outputs['Color'], bs.inputs['Base Color']); nt.links.new(tc.outputs['Alpha'], bs.inputs['Alpha'])
nt.links.new(te.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 1.0
bs.inputs['Roughness'].default_value = 0.3
for side in (1, -1):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=12, y_subdivisions=12, size=1)
    e = bpy.context.object; e.name = 'EyeR' if side == 1 else 'EyeL'
    e.scale = (EW, EH, 1) if side == 1 else (-EW, EH, 1); e.rotation_euler = (np.pi / 2, 0, 0)
    e.location = (EYE.x * side, EYE.y - 0.02, EYE.z)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    sw = e.modifiers.new('wrap', 'SHRINKWRAP'); sw.target = o; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
    sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.0008
    bpy.ops.object.modifier_apply(modifier='wrap')
    e.data.materials.append(m)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB')
print('saved', out)
