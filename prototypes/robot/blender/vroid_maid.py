"""Robot maid from a CC0 VRoid sample: vroid_model.py's conversion, then the outfit and hair
recoloured to the concept palette and rigid robot hardware parented to her bones.

    Blender -b --factory-startup -P prototypes/robot/blender/vroid_maid.py -- <in.vrm> <out.glb>

Hardware (all separate meshes, each parented to one bone, so nothing is skinned): ear units,
a frill headdress, and gunmetal joint rings at the neck, elbows, wrists and knees, sized from
the mesh around each joint. Built for AvatarSample E (bob, apron dress); other samples work
but their cloth textures won't map as cleanly.
"""
import os
import sys
import math
import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import temp_maid as tm      # noqa: E402
import vroid_model as vm    # noqa: E402

ORANGE_HUE = 24 / 360


# ---------------------------------------------------------------- textures
def cloth(px):
    """Green dress -> lacquer black, cream -> white, peach trim and stitching -> orange, brown -> gunmetal."""
    rgb, a = px[..., :3], px[..., 3:]
    h, s, v = tm.rgb_to_hsv(rgb)
    lum = (rgb @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    green = (h > 0.15) & (h < 0.48) & (s > 0.18)
    warm = ((h < 0.12) | (h > 0.92)) & (s > 0.22)
    brown = warm & (v < 0.5)
    trim = warm & ~brown
    out = np.clip(lum * 1.08, 0, 1) * np.array([0.97, 0.96, 0.95])           # whites, neutral
    out = np.where(green[..., None], (0.035 + 0.13 * v[..., None] ** 1.5) * np.array([1, 0.92, 0.9]), out)
    out = np.where(trim[..., None], tm.hsv_to_rgb(np.full_like(h, ORANGE_HUE), np.full_like(h, 0.78), 0.55 + 0.45 * v), out)
    out = np.where(brown[..., None], lum * 0.7 * np.array([0.9, 0.92, 1.0]), out)
    return np.concatenate([np.clip(out, 0, 1), a], -1)


def shoes(px):
    """Brown boots -> white ceramic with black straps."""
    rgb, a = px[..., :3], px[..., 3:]
    h, s, v = tm.rgb_to_hsv(rgb)
    lum = (rgb @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    light = np.clip(0.55 + lum * 0.9, 0, 1) * np.array([0.95, 0.93, 0.89])
    out = np.where((v < 0.28)[..., None], lum * 0.4, light)
    return np.concatenate([np.clip(out, 0, 1), a], -1)


def repaint(img, fn, name):
    W, H = img.size
    px = np.empty(W * H * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = fn(px.reshape(H, W, 4)[::-1])
    out = bpy.data.images.new(name, W, H, alpha=True)
    out.pixels.foreach_set(np.ascontiguousarray(px[::-1], dtype=np.float32).ravel())
    out.pack()
    return out


def restyle_textures():
    done = set()
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        for m in o.data.materials:
            if m is None or m.name in done or not m.use_nodes: continue
            done.add(m.name)
            tex = next((n for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None)
            if not tex: continue
            if m.name.startswith('B01_hair'):
                tex.image = repaint(tex.image, lambda p: tm.recolour(p, 'hair'), 'M_' + m.name)
            elif m.name.startswith('B01_cloth') and 'Shoes' in m.name:
                tex.image = repaint(tex.image, shoes, 'M_' + m.name)
            elif m.name.startswith('B01_cloth'):
                tex.image = repaint(tex.image, cloth, 'M_' + m.name)


# ---------------------------------------------------------------- hardware
def mat(name, col, rough=0.35, metal=0.0, emit=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*col, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if emit:
        p.inputs['Emission Color'].default_value = (*col, 1)
        p.inputs['Emission Strength'].default_value = emit
    return m


def world_verts(o):
    me = o.data
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    M = np.array(o.matrix_world)
    return co @ M[:3, :3].T + M[:3, 3]


def attach(name, bm, material, arm, bone):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    mw = ob.matrix_world.copy()
    ob.parent = arm; ob.parent_type = 'BONE'; ob.parent_bone = bone
    bpy.context.view_layer.update()
    ob.matrix_world = mw                                  # keep it where it was built
    return ob


def ring(p0, axis, r, length, seg=24, r2=None):
    bm = bmesh.new()
    rot = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r2 or r,
                          depth=length, matrix=Matrix.Translation(p0) @ rot)
    return bm


def sphere(c, r, seg=16):
    bm = bmesh.new()
    rr = r if isinstance(r, (tuple, list)) else (r, r, r)
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2 + 1, radius=1,
                              matrix=Matrix.Translation(c) @ Matrix.Diagonal((*rr, 1)))
    return bm


def merge(*bms):
    out = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new('tmp'); b.to_mesh(me); b.free(); out.from_mesh(me); bpy.data.meshes.remove(me)
    return out


def radius_at(verts, p, axis, span=0.02):
    """Largest distance from the bone axis among vertices near p (the limb's outer surface)."""
    a = np.array(axis.normalized()); d = verts - np.array(p)
    along = d @ a
    near = (np.abs(along) < span) & (np.sign(verts[:, 0]) == np.sign(p[0]) if abs(p[0]) > 0.02 else True)
    if not near.any(): return 0.03
    radial = np.linalg.norm(d[near] - np.outer(along[near], a), axis=1)
    radial = radial[radial < 0.07]
    return float(np.percentile(radial, 92)) if len(radial) else 0.03


def frill_bm(c, rx, rz, y, width, n=90, pleats=30, amp=0.005):
    bm, grid = bmesh.new(), []
    for j in range(n + 1):
        a = math.radians(24 + 132 * j / n); ca, sa = math.cos(a), math.sin(a)
        base = Vector((c.x + rx * ca, y, c.z + rz * sa))
        out = Vector((ca * 0.85, 0.45, sa * 0.85)).normalized()          # tilts forward (+Y)
        w = math.sin(pleats * a)
        row = []
        for t in (0, 0.33, 0.66, 1):
            row.append(bm.verts.new(base + out * width * t + Vector((ca * 0.4, 1, sa * 0.4)) * amp * w * t))
        grid.append(row)
    for j in range(n):
        for i in range(3):
            bm.faces.new((grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.003)
    return bm


def band_bm(c, rx, rz, y, n=60):
    bm, prev = bmesh.new(), None
    for j in range(n + 1):
        a = math.radians(20 + 140 * j / n); ca, sa = math.cos(a), math.sin(a)
        base = Vector((c.x + rx * ca, y, c.z + rz * sa)); out = Vector((ca, 0, sa))
        cur = (bm.verts.new(base - out * 0.002), bm.verts.new(base + out * 0.012))
        if prev: bm.faces.new((prev[0], cur[0], cur[1], prev[1]))
        prev = cur
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.006)
    return bm


def add_hardware():
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    body, face = bpy.data.objects['Body'], bpy.data.objects['Face']
    hair = [o for o in bpy.data.objects if o.type == 'MESH' and o.data.materials and all(m and m.name.startswith('B01_hair') for m in o.data.materials)]
    bpy.context.view_layer.update()
    bv = world_verts(body)
    hv = np.concatenate([world_verts(o) for o in hair]) if hair else bv
    fv = world_verts(face)
    W = lambda b: arm.matrix_world @ arm.data.bones[b].head_local
    gun = mat('B01_hw_gun', (0.06, 0.06, 0.065), 0.3, 0.85)
    ceramic = mat('B01_hw_ceramic', (0.86, 0.83, 0.78), 0.28)
    white = mat('B01_hw_white', (0.9, 0.9, 0.9), 0.6)
    glow = mat('B01_hw_glow', (1.0, 0.36, 0.08), 0.4, 0, 3.0)
    black = mat('B01_hw_black', (0.012, 0.011, 0.011), 0.5)

    # head frame: face width, eye height, head centre
    fx = np.percentile(np.abs(fv[:, 0]), 99)
    eye_z = float(np.median(fv[:, 2]))
    hmin, hmax = hv.min(0), hv.max(0)
    head_c = Vector((0, float((hmin[1] + hmax[1]) / 2), eye_z))
    hx = float(min(-hmin[0], hmax[0]))
    print('head: face half-width', fx, 'hair half-width', hx, 'eye z', eye_z, 'top', hmax[2])

    # ear units: a ceramic can, an orange ring and a dark cap on each side, under the hair line
    for s in (-1, 1):
        x0 = s * (fx + 0.004); c = Vector((x0, head_c.y - 0.012, eye_z - 0.02))
        ax = Vector((s, 0, 0)); r = 0.034
        attach(f'ear_shell_{s}', ring(c + ax * 0.012, ax, r, 0.03, 32), ceramic, arm, 'Head')
        attach(f'ear_glow_{s}', ring(c + ax * 0.029, ax, r * 0.72, 0.004, 32), glow, arm, 'Head')
        attach(f'ear_cap_{s}', ring(c + ax * 0.032, ax, r * 0.5, 0.004, 32), black, arm, 'Head')
        tip = c + Vector((s * 0.03, -0.03, 0.1))
        attach(f'antenna_{s}', merge(ring((c + tip) / 2 + ax * 0.02, tip - c, 0.0025, (tip - c).length, 8),
                                     sphere(tip + ax * 0.02, 0.006, 8)), gun, arm, 'Head')

    # headdress: frill on a black band across the crown, a little forward of centre
    y = head_c.y + 0.04                                   # VRoid faces +Y
    rx, rz = hx * 0.9, float(hmax[2] - eye_z) * 0.86
    attach('headdress_frill', frill_bm(Vector((0, 0, eye_z)), rx, rz, y, 0.034), white, arm, 'Head')
    attach('headdress_band', band_bm(Vector((0, 0, eye_z)), rx * 1.01, rz * 1.01, y + 0.004), black, arm, 'Head')

    # neck: two gunmetal rings
    n0, n1 = W('Neck'), W('Head'); ax = n1 - n0
    r = radius_at(bv, (n0 + n1) / 2, ax, 0.012) + 0.002
    for t in (0.3, 0.7):
        attach(f'neck_ring_{t}', ring(n0 + ax * t, ax, r, 0.008, 24), gun, arm, 'Neck')

    # elbows, wrists, knees: a ring with an orange line, sized to the limb
    joints = [('RightForeArm', 'RightHand'), ('LeftForeArm', 'LeftHand'), ('RightHand', 'RightHandMiddle1'),
              ('LeftHand', 'LeftHandMiddle1'), ('RightLeg', 'RightFoot'), ('LeftLeg', 'LeftFoot')]
    for child, nxt in joints:
        p = W(child); ax = W(nxt) - p
        r = min(radius_at(bv, p, ax) + 0.003, {'Fore': 0.042, 'Hand': 0.03}.get(next((k for k in ('Fore', 'Hand') if k in child), ''), 0.06))
        attach(f'joint_{child}', ring(p, ax, r, 0.018, 28), gun, arm, child)
        attach(f'joint_line_{child}', ring(p, ax, r + 0.0015, 0.003, 28), glow, arm, child)
        if 'Leg' in child:                                # ball-joint caps either side of the knee
            side = Vector((1, 0, 0))
            for s in (-1, 1):
                attach(f'knee_cap_{child}_{s}', sphere(p + side * s * (r + 0.004), (0.006, 0.02, 0.02), 16), gun, arm, child)


def robot_hands():
    """Swap both skin hands for segmented robot hands: the skin faces weighted to the hand and finger bones
    go, and ceramic finger segments, gunmetal knuckles and a palm plate ride the same bones."""
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    body = bpy.data.objects['Body']
    W = lambda b: arm.matrix_world @ arm.data.bones[b].head_local
    ceramic, gun = bpy.data.materials['B01_hw_ceramic'], bpy.data.materials['B01_hw_gun']
    me = body.data
    for S in ('Right', 'Left'):
        names = {f'{S}Hand'} | {f'{S}Hand{f}{i}' for f in ('Thumb', 'Index', 'Middle', 'Ring', 'Pinky') for i in (1, 2, 3)}
        gi = {g.index for g in body.vertex_groups if g.name in names}
        hand_v = {v.index for v in me.vertices if sum(g.weight for g in v.groups if g.group in gi) > 0.5}
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(v.index in hand_v for v in f.verts)], context='FACES')
        bm.to_mesh(me); bm.free()
        # fingers: a ceramic segment per bone, a gunmetal ball at each joint
        for f, r in (('Thumb', 0.0085), ('Index', 0.0075), ('Middle', 0.0078), ('Ring', 0.0072), ('Pinky', 0.0062)):
            pts = [W(f'{S}Hand{f}{i}') for i in (1, 2, 3)]
            pts.append(pts[2] + (pts[2] - pts[1]) * 0.85)
            for i in range(3):
                bone = f'{S}Hand{f}{i + 1}'
                a, b_ = pts[i], pts[i + 1]; d = b_ - a
                rr = r * (1 - 0.1 * i)
                attach(f'{bone}_seg', ring(a + d * 0.5, d, rr, d.length * 0.82, 12, rr * 0.92), ceramic, arm, bone)
                attach(f'{bone}_ball', sphere(a, rr * 1.12, 10), gun, arm, bone)
        # palm plate from the wrist to the knuckles, and a dark panel on the back of the hand
        w0, m1, i1, p1 = W(f'{S}Hand'), W(f'{S}HandMiddle1'), W(f'{S}HandIndex1'), W(f'{S}HandPinky1')
        fwd = (m1 - w0); acr = (i1 - p1); up = fwd.cross(acr).normalized()
        if S == 'Left': up = -up
        basis = Matrix((acr.normalized(), up, fwd.normalized())).transposed().to_4x4()
        c = (w0 + m1) / 2
        def plate(off, sx, sy, sz):
            b = bmesh.new()
            bmesh.ops.create_cube(b, size=1, matrix=Matrix.Translation(c + up * off) @ basis @ Matrix.Diagonal((sx, sy, sz, 1)))
            bmesh.ops.bevel(b, geom=b.edges[:], offset=0.003, segments=2, affect='EDGES')
            return b
        attach(f'{S}_palm', plate(0, acr.length + 0.02, 0.024, fwd.length * 0.95), ceramic, arm, f'{S}Hand')
        attach(f'{S}_palm_panel', plate(0.012, acr.length * 0.75, 0.004, fwd.length * 0.6), gun, arm, f'{S}Hand')


def before_export():
    restyle_textures()
    add_hardware()
    robot_hands()


if __name__ == '__main__':
    vm.main(before_export)
