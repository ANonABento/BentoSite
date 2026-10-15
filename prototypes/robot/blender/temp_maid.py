"""Temp robot maid: restyle the CC0 "Maid Character" by 413 Games to the B-01 palette.

Source: https://413games.itch.io/maid-character (CC0 1.0). Download it into
prototypes/robot/vendor/maid413/ (gitignored) so that Maid.fbx and Textures/ sit there.

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
        -P prototypes/robot/blender/temp_maid.py

Writes prototypes/robot/build/temp-maid.glb (unoptimised) and check renders to
prototypes/robot/renders/temp-*.png. Optimise with gltf-transform (see README).

What it changes: pink dress -> lacquer black, hair -> gloss black, skin -> porcelain,
irises -> emissive orange, mouth and brows removed (mouthless doll face), shape keys
trimmed to the eye states the prologue drives (blink, happy, irisOff).
"""
import os
import math
import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROBOT = os.path.dirname(HERE)
SRC = os.path.join(ROBOT, 'vendor', 'maid413')
OUT_GLB = os.path.join(ROBOT, 'build', 'temp-maid.glb')
RENDERS = os.path.join(ROBOT, 'renders')
TEX_OUT = os.path.join(ROBOT, 'build', 'textures')

PORCELAIN = np.array([0.949, 0.925, 0.886])   # #f2ece2
LACQUER = np.array([0.055, 0.043, 0.039])     # #0e0b0a
NEON_HUE = 24 / 360                            # #e8823f

# material name fragment -> (texture file, role)
MATS = {
    'Body_00_SKIN': ('Body_Tex.png', 'skin'),
    'Face_00_SKIN': ('Face_Tex.png', 'face'),
    'HairBack_00_HAIR': ('Hair2_Tex.png', 'hair'),
    'Hair_00_HAIR': ('Hair1_Tex.png', 'hair'),
    'Tops_01_CLOTH': ('Clothes_Tex.png', 'cloth'),
    'Shoes_01_CLOTH': ('Shoes_Tex.png', 'shoes'),
    'EyeIris_00_EYE': ('Eyes_Tex.png', 'iris'),
    'EyeHighlight_00_EYE': ('EyeHighlights_tex.png', 'overlay'),
    'EyeWhite_00_EYE': ('EyeWhite_Tex.png', 'eyewhite'),
    'FaceEyeline_00_FACE': ('Eyelashes_Tex.png', 'overlay'),
    'FaceMouth_00_FACE': (None, 'delete'),
    'FaceBrow_00_FACE': (None, 'delete'),
}
BASE = {'cloth': LACQUER, 'hair': np.array([0.05, 0.048, 0.049]), 'skin': PORCELAIN, 'face': PORCELAIN, 'shoes': LACQUER}
KEEP_KEYS = {'target_13': 'blink', 'target_17': 'happy', 'target_23': 'irisOff'}


# ---------------------------------------------------------------- texture recolour
def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h / 6, s, mx


def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.stack([
        np.choose(i, [v, q, p, p, t, v]),
        np.choose(i, [t, v, v, q, p, p]),
        np.choose(i, [p, p, t, v, v, q]),
    ], -1)
    return out


def recolour(px, role):
    """px: HxWx4 float array (top row first). Returns new array."""
    rgb, a = px[..., :3], px[..., 3:]
    h, s, v = rgb_to_hsv(rgb)
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
    if role == 'cloth':
        pink = (s > 0.10) & ((h > 0.80) | (h < 0.06))
        t = np.clip((v - 0.55) / 0.45, 0, 1)[..., None]
        dark = LACQUER + t * 0.10                                   # keep the fold shading
        warm = np.clip(lum[..., None] / 0.97, 0, 1) * PORCELAIN     # whites -> warm ceramic
        rgb = np.where(pink[..., None], dark, warm)
    elif role == 'hair':
        g = 0.035 + 0.25 * np.power(v, 2.2)
        rgb = np.stack([g, g * 0.97, g * 0.98], -1)
    elif role in ('skin', 'face'):
        rgb = np.clip(lum[..., None] / 0.90, 0, 1.02) * PORCELAIN
    elif role == 'iris':
        nh = np.full_like(h, NEON_HUE)
        rgb = hsv_to_rgb(nh, np.clip(s * 1.2 + 0.35, 0, 1), np.clip(v * 1.35, 0, 1))
    elif role == 'overlay':
        # lashes and lid creases -> neutral near-black; keep white highlights
        dark = (lum < 0.85)[..., None]
        rgb = np.where(dark, np.stack([lum, lum, lum], -1) * 0.3, rgb)
    elif role == 'shoes':
        rgb = rgb * 0.8
    return np.concatenate([np.clip(rgb, 0, 1), a], -1)


def paint_out_mouth(px):
    """Face_Tex is 1024²: the painted mouth line and nose dot sit near the bottom centre."""
    H, W = px.shape[:2]
    sx, sy = W / 1024, H / 1024
    skin = px[int(720 * sy), int(512 * sx)].copy()
    for (x0, y0, x1, y1) in [(430, 750, 600, 800), (490, 660, 540, 700)]:
        px[int(y0 * sy):int(y1 * sy), int(x0 * sx):int(x1 * sx)] = skin
    return px


def load_recoloured(fname, role):
    img = bpy.data.images.load(os.path.join(SRC, 'Textures', fname))
    W, H = img.size
    px = np.empty(W * H * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(H, W, 4)[::-1]                    # Blender stores bottom row first
    if role == 'face':
        px = paint_out_mouth(px)
    if role != 'eyewhite':
        px = recolour(px, role)
    # transparent texels carry junk colour; flood them with the role's base so edges don't fringe
    clear = px[..., 3] < 0.5
    if clear.any() and role in BASE:
        px[clear, :3] = BASE[role]
    out = bpy.data.images.new(f'B01_{fname}', W, H, alpha=True)
    out.pixels.foreach_set(np.ascontiguousarray(px[::-1], dtype=np.float32).ravel())
    os.makedirs(TEX_OUT, exist_ok=True)
    out.filepath_raw = os.path.join(TEX_OUT, f'B01_{fname}')
    out.file_format = 'PNG'
    out.save()
    return out


# ---------------------------------------------------------------- materials
def has_alpha(img):
    a = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    return bool((a[3::4] < 0.5).any())


def build_material(mat, img, role):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    rough = {'hair': 0.28, 'cloth': 0.32, 'skin': 0.38, 'face': 0.38, 'shoes': 0.2, 'iris': 0.2}.get(role, 0.5)
    bsdf.inputs['Roughness'].default_value = rough
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.6 if role in ('hair', 'cloth', 'shoes') else 0.5
    if role in ('overlay', 'iris') or (role in BASE and has_alpha(img)):
        # cutout alpha (glTF MASK): the exporter reads a 'greater than' node as alphaCutoff,
        # and cutouts don't depth-sort wrongly the way blended layers do
        cut = nt.nodes.new('ShaderNodeMath')
        cut.operation = 'GREATER_THAN'
        cut.inputs[1].default_value = 0.5
        nt.links.new(tex.outputs['Alpha'], cut.inputs[0])
        nt.links.new(cut.outputs[0], bsdf.inputs['Alpha'])
        try:
            mat.surface_render_method = 'DITHERED'
        except AttributeError:
            pass
    if role == 'iris':
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 1.0
    mat.name = f'B01_{role}_{mat.name.split("_")[-2]}'


def fill_mouth_hole(obj, box):
    """Cap the opening the mouth faces leave in the face skin (edit mode)."""
    import bmesh
    lo, hi = box
    pad = (hi - lo) * 0.3 + 1e-4
    bm = bmesh.from_edit_mesh(obj.data)
    def inside(v):
        return all(lo[i] - pad[i] < v.co[i] < hi[i] + pad[i] for i in range(3))
    edges = [e for e in bm.edges if e.is_boundary and all(inside(v) for v in e.verts)]
    face_mat = next(i for i, m in enumerate(obj.data.materials) if 'Face_00_SKIN' in m.name)
    res = bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    for f in res['faces']:
        f.material_index = face_mat
        f.smooth = True
    bmesh.update_edit_mesh(obj.data)
    print('fill_mouth_hole: boundary edges', len(edges), 'new faces', len(res['faces']))


def region_of(me, frag):
    idx = {v for p in me.polygons if frag in me.materials[p.material_index].name for v in p.vertices}
    co = np.array([me.vertices[i].co[:] for i in idx])
    return co.min(0), co.max(0)


def flatten_mouth(me, box, iters=300):
    """Laplacian-smooth the face skin where the mouth was, so no lip crease is left.
    The kept shape keys don't move this area, so every key gets the same smoothed points."""
    lo, hi = box
    pad = (hi - lo) * np.array([0.8, 1.4, 1.0]) + 1e-4
    n = len(me.vertices)
    co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    face_v = {v for p in me.polygons if 'Face_00_SKIN' in me.materials[p.material_index].name for v in p.vertices}
    inside = np.all((co > lo - pad) & (co < hi + pad), axis=1)
    sel = np.array(sorted(i for i in face_v if inside[i]))
    if not len(sel):
        print('flatten_mouth: nothing selected'); return
    nbrs = {i: [] for i in sel}
    for e in me.edges:
        a, b = e.vertices
        if a in nbrs: nbrs[a].append(b)
        if b in nbrs: nbrs[b].append(a)
    # keep the rim fixed so the patch blends into the untouched face
    core = [i for i in sel if all(inside[j] for j in nbrs[i])]
    new = co.copy()
    for _ in range(iters):
        nxt = new.copy()
        for i in core:
            if nbrs[i]:
                nxt[i] = 0.5 * new[i] + 0.5 * new[nbrs[i]].mean(0)
        new = nxt
    for kb in me.shape_keys.key_blocks:
        kco = np.empty(n * 3); kb.data.foreach_get('co', kco); kco = kco.reshape(-1, 3)
        kco[core] = new[core]
        kb.data.foreach_set('co', kco.ravel())
    me.vertices.foreach_set('co', me.shape_keys.key_blocks[0].data and new.ravel())
    print('flatten_mouth: smoothed', len(core), 'verts')


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(SRC, 'Maid.fbx'))
    body = bpy.data.objects['Body']
    arm = bpy.data.objects['Armature']
    arm.name = 'B01_Rig'
    body.name = 'B01_Body'

    me = body.data
    mouth_box = region_of(me, 'FaceMouth')
    # delete mouth + brow faces (keeps shape keys consistent)
    kill = [i for i, m in enumerate(me.materials) if MATS[next(k for k in MATS if k in m.name)][1] == 'delete']
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    for i in kill:
        body.active_material_index = i
        bpy.ops.object.material_slot_select()
    bpy.ops.mesh.delete(type='FACE')
    fill_mouth_hole(body, mouth_box)
    bpy.ops.object.mode_set(mode='OBJECT')
    for i in sorted(kill, reverse=True):
        body.active_material_index = i
        bpy.ops.object.material_slot_remove()

    flatten_mouth(me, mouth_box)

    # textures + materials
    for m in me.materials:
        key = next(k for k in MATS if k in m.name)
        fname, role = MATS[key]
        build_material(m, load_recoloured(fname, role), role)

    # trim shape keys to the eye states we drive
    for kb in list(me.shape_keys.key_blocks)[1:]:
        if kb.name in KEEP_KEYS:
            kb.name = KEEP_KEYS[kb.name]
        else:
            body.shape_key_remove(kb)

    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB, export_format='GLB', use_selection=False,
        export_skins=True, export_morph=True, export_morph_normal=False,
        export_animations=False, export_apply=False, export_yup=True,
    )
    print('WROTE', OUT_GLB, os.path.getsize(OUT_GLB))
    render_checks(body)


# ---------------------------------------------------------------- check renders
def render_checks(body):
    scn = bpy.context.scene
    try:
        scn.render.engine = 'BLENDER_EEVEE'
    except TypeError:
        scn.render.engine = 'BLENDER_EEVEE_NEXT'
    scn.render.resolution_x, scn.render.resolution_y = 900, 1200
    scn.render.film_transparent = False
    world = bpy.data.worlds.new('W')
    scn.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
    scn.collection.objects.link(cam)
    scn.camera = cam
    key = bpy.data.objects.new('Key', bpy.data.lights.new('Key', 'AREA'))
    key.data.energy, key.data.size = 400, 2
    scn.collection.objects.link(key)
    rim = bpy.data.objects.new('Rim', bpy.data.lights.new('Rim', 'AREA'))
    rim.data.energy, rim.data.size, rim.data.color = 300, 1, (1, .75, .55)
    scn.collection.objects.link(rim)

    def look(obj, frm, at):
        import mathutils
        obj.location = frm
        d = mathutils.Vector(at) - mathutils.Vector(frm)
        obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

    os.makedirs(RENDERS, exist_ok=True)
    shots = [
        ('front', (0, -4.2, 1.0), (0, 0, 0.92), 32, True),
        ('three-quarter', (2.6, -3.2, 1.3), (0, 0, 0.95), 34, True),
        ('back', (0.3, 4.2, 1.1), (0, 0, 0.95), 32, True),
        ('face', (0.25, -0.95, 1.62), (0, 0, 1.6), 30, True),
        ('dark', (0.12, -0.8, 1.6), (0, 0, 1.6), 30, False),
    ]
    for name, frm, at, fov, lit in shots:
        look(cam, frm, at)
        cam.data.angle = math.radians(fov)
        look(key, (-1.5, -2.5, 2.5), at)
        look(rim, (1.8, 2.0, 2.2), at)
        key.hide_render = rim.hide_render = not lit
        bg.inputs['Color'].default_value = (0.09, 0.08, 0.075, 1) if lit else (0, 0, 0, 1)
        for m in body.data.materials:
            if m.name.startswith('B01_iris'):
                m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 1.0 if lit else 6.0
        scn.render.filepath = os.path.join(RENDERS, f'temp-{name}.png')
        bpy.ops.render.render(write_still=True)


main()
