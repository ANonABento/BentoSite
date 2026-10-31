# Style x face matrix: rough robot-maid busts built from separate parts.
#   blender -b -P matrix.py -- <outdir> [style:face ...]
# Styles: ps1, ps2, cel. Faces: doll, visor, anime, mech.
# Writes <outdir>/<style>-<face>-lit.png and -dark.png; matrix_sheet.py assembles them.
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = ARGS[0] if ARGS else 'renders/matrix'
ONLY = ARGS[1:]
STYLES = ['ps1', 'ps2', 'cel']
FACES = ['doll', 'visor', 'anime', 'mech']

SEG = {'ps1': (10, 7), 'ps2': (20, 13), 'cel': (56, 36)}     # head sphere u, v
LIMB = {'ps1': 5, 'ps2': 8, 'cel': 20}                        # cylinder segments
ARC = {'ps1': 14, 'ps2': 40, 'cel': 110}                      # frill columns
SPIKES = {'ps1': 7, 'ps2': 9, 'cel': 11}
RES = {'ps1': (240, 320), 'ps2': (360, 480), 'cel': (720, 960)}
INK = {'ps1': 0, 'ps2': 0, 'cel': 0.016}

# key: (linear colour, roughness, emission, metallic)
SPEC = {
    'dress':   ((0.006, 0.005, 0.005), 0.6, 0, 0),
    'hair':    ((0.010, 0.010, 0.014), 0.45, 0, 0),
    'ceramic': ((0.86, 0.82, 0.75), 0.3, 0, 0),
    'skin':    ((0.93, 0.80, 0.72), 0.5, 0, 0),
    'white':   ((0.85, 0.85, 0.86), 0.7, 0, 0),
    'cloth':   ((0.80, 0.22, 0.04), 0.6, 0, 0),
    'gun':     ((0.10, 0.10, 0.11), 0.35, 0, 0.8),
    'glass':   ((0.004, 0.004, 0.005), 0.1, 0, 0),
    'lash':    ((0.010, 0.008, 0.008), 0.8, 0, 0),
    'line':    ((0.30, 0.27, 0.26), 0.8, 0, 0),
    'iris':    ((0.45, 0.10, 0.02), 0.3, 0, 0),
    'glow':    ((1.0, 0.33, 0.06), 0, 1, 0),
    'hi':      ((1.0, 0.97, 0.92), 0, 0.6, 0),
}
GLOW = {'lit': 1.3, 'dark': 3.0}


# ---------- materials ----------
def hair_color(nt, base):
    """Painted strands: a highlight band that wavers across the head."""
    n, L = nt.nodes, nt.links.new
    tc = n.new('ShaderNodeTexCoord'); sep = n.new('ShaderNodeSeparateXYZ'); L(tc.outputs['Object'], sep.inputs[0])
    m1 = n.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; m1.inputs[1].default_value = 26; L(sep.outputs[0], m1.inputs[0])
    sn = n.new('ShaderNodeMath'); sn.operation = 'SINE'; L(m1.outputs[0], sn.inputs[0])
    m2 = n.new('ShaderNodeMath'); m2.operation = 'MULTIPLY_ADD'; m2.inputs[1].default_value = 0.05
    L(sn.outputs[0], m2.inputs[0]); L(sep.outputs[2], m2.inputs[2])
    mr = n.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -1.2; mr.inputs['From Max'].default_value = 1.3
    L(m2.outputs[0], mr.inputs['Value'])
    ramp = n.new('ShaderNodeValToRGB'); els = ramp.color_ramp.elements
    hl = (0.13, 0.14, 0.19, 1)
    els[0].position, els[0].color = 0.0, (*base, 1)
    els[1].position, els[1].color = 1.0, (*base, 1)
    for p, c in [(0.70, (*base, 1)), (0.755, hl), (0.81, (*base, 1))]:
        e = els.new(p); e.color = c
    L(mr.outputs[0], ramp.inputs[0])
    return ramp.outputs[0]


def make_mat(style, key):
    col, rough, emit, metal = SPEC[key]
    m = bpy.data.materials.new(f'{style}_{key}'); m.use_nodes = True
    nt = m.node_tree; out = nt.nodes['Material Output']
    for n in list(nt.nodes):
        if n.name != out.name: nt.nodes.remove(n)
    L = nt.links.new
    if emit:
        e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*col, 1)
        e.inputs['Strength'].default_value = emit; m['glow'] = emit
        L(e.outputs[0], out.inputs['Surface']); return m
    base = hair_color(nt, col) if key == 'hair' and style != 'ps1' else None
    if style == 'cel':
        d = nt.nodes.new('ShaderNodeBsdfDiffuse'); s2r = nt.nodes.new('ShaderNodeShaderToRGB'); L(d.outputs[0], s2r.inputs[0])
        ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp; cr.interpolation = 'CONSTANT'
        cr.elements[0].position, cr.elements[0].color = 0.0, (0, 0, 0, 1)
        cr.elements[1].position, cr.elements[1].color = 0.35, (1, 1, 1, 1)
        e = cr.elements.new(0.0015); e.color = (0.38, 0.37, 0.45, 1)
        L(s2r.outputs['Color'], ramp.inputs[0])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = 1; mix.inputs[6].default_value = (*col, 1)
        if base: L(base, mix.inputs[6])
        L(ramp.outputs[0], mix.inputs[7])
        em = nt.nodes.new('ShaderNodeEmission'); L(mix.outputs[2], em.inputs['Color'])
        sh = em
        if key in ('glass', 'gun', 'hair'):   # a hard specular glint on glossy parts
            g = nt.nodes.new('ShaderNodeBsdfGlossy'); g.inputs['Roughness'].default_value = 0.08
            s2 = nt.nodes.new('ShaderNodeShaderToRGB'); L(g.outputs[0], s2.inputs[0])
            r2 = nt.nodes.new('ShaderNodeValToRGB'); r2.color_ramp.interpolation = 'CONSTANT'
            r2.color_ramp.elements[1].position = 0.6; L(s2.outputs['Color'], r2.inputs[0])
            e2 = nt.nodes.new('ShaderNodeEmission'); e2.inputs['Strength'].default_value = 0.5; L(r2.outputs[0], e2.inputs['Color'])
            add = nt.nodes.new('ShaderNodeAddShader'); L(em.outputs[0], add.inputs[0]); L(e2.outputs[0], add.inputs[1]); sh = add
        L(sh.outputs[0], out.inputs['Surface'])
    else:
        p = nt.nodes.new('ShaderNodeBsdfPrincipled')
        p.inputs['Base Color'].default_value = (*col, 1)
        if base: L(base, p.inputs['Base Color'])
        p.inputs['Roughness'].default_value = 1.0 if style == 'ps1' else rough
        p.inputs['Metallic'].default_value = 0 if style == 'ps1' else metal
        p.inputs['Specular IOR Level'].default_value = 0.0 if style == 'ps1' else 0.5
        L(p.outputs[0], out.inputs['Surface'])
    return m


class Mats(dict):
    def __init__(self, style): super().__init__(); self.style = style
    def __missing__(self, k): self[k] = make_mat(self.style, k); return self[k]


def ink_mat():
    m = bpy.data.materials.new('ink'); m.use_nodes = True; m.use_backface_culling = True
    nt = m.node_tree; out = nt.nodes['Material Output']
    for n in list(nt.nodes):
        if n.name != out.name: nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (0.012, 0.010, 0.012, 1)
    nt.links.new(e.outputs[0], out.inputs['Surface']); return m


# ---------- mesh helpers ----------
def to_object(name, bm, mats, smooth, ink=0, thick=0):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    for m in mats: me.materials.append(m)
    if thick:
        s = ob.modifiers.new('thick', 'SOLIDIFY'); s.thickness = thick; s.offset = 0
    if ink:
        me.materials.append(INK_MAT)
        s = ob.modifiers.new('ink', 'SOLIDIFY'); s.thickness = ink; s.offset = 1
        s.use_flip_normals = True; s.use_rim = False; s.material_offset = len(mats)
    return ob


class Parts:
    """Primitives grouped into one object per material key."""
    def __init__(self): self.bms = {}
    def bm(self, k): return self.bms.setdefault(k, bmesh.new())
    def sphere(self, k, c, r, seg, rot=None):
        r = r if isinstance(r, (tuple, list)) else (r, r, r)
        M = Matrix.Translation(c) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*r, 1))
        bmesh.ops.create_uvsphere(self.bm(k), u_segments=seg, v_segments=max(4, seg // 2 + 1), radius=1, matrix=M)
    def cyl(self, k, p0, p1, r, seg, r2=None):
        p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        bmesh.ops.create_cone(self.bm(k), cap_ends=True, cap_tris=False, segments=seg, radius1=r,
                              radius2=r if r2 is None else r2, depth=d.length, matrix=Matrix.Translation((p0 + p1) / 2) @ rot)
    def box(self, k, M): bmesh.ops.create_cube(self.bm(k), size=1, matrix=M)
    def build(self, name, mats, smooth, ink):
        for k, b in self.bms.items(): to_object(f'{name}_{k}', b, [mats[k]], smooth, ink)


def ellipsoid_bm(u, v, center, radii, shape=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=1)
    for vert in bm.verts:
        co = vert.co.copy()
        if shape: co = shape(co)
        vert.co = Vector(center) + Vector((co.x * radii[0], co.y * radii[1], co.z * radii[2]))
    return bm


def head_shape(co):
    x, y, z = co
    if z < -0.1:                                  # taper into a soft V jaw
        t = min(1, (-z - 0.1) / 0.9) ** 1.6
        x *= 1 - 0.45 * t; y *= 1 - (0.28 if y < 0 else 0.38) * t
    if y < 0: y *= 0.92                           # flatter face
    return Vector((x, y, z))


# ---------- decals: flat 2D shapes projected onto a surface along +Y ----------
def ell(u, v, rx, rz, a):
    return (u + rx * math.cos(a), v + rz * math.sin(a))

def fill(u, v, rx, rz, n=24):
    rings = [[ell(u, v, rx * s, rz * s, 2 * math.pi * i / n) for i in range(n)] for s in (1, 0.66, 0.33)]
    polys = [[rings[r][i], rings[r][(i + 1) % n], rings[r + 1][(i + 1) % n], rings[r + 1][i]] for r in range(2) for i in range(n)]
    return polys + [[rings[2][i], rings[2][(i + 1) % n], (u, v)] for i in range(n)]

def ring(u, v, rx, rz, w, n=28):
    o = [ell(u, v, rx, rz, 2 * math.pi * i / n) for i in range(n)]
    i_ = [ell(u, v, rx - w, rz - w, 2 * math.pi * i / n) for i in range(n)]
    return [[o[k], o[(k + 1) % n], i_[(k + 1) % n], i_[k]] for k in range(n)]

def strip(pts, widths):
    if not isinstance(widths, (list, tuple)): widths = [widths] * len(pts)
    dp, dw = [pts[0]], [widths[0]]                 # densify so long strips follow the surface
    for i in range(1, len(pts)):
        (x0, y0), (x1, y1) = pts[i - 1], pts[i]
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 0.04))
        for k in range(1, n + 1):
            t = k / n; dp.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)); dw.append(widths[i - 1] + (widths[i] - widths[i - 1]) * t)
    pts, widths = dp, dw
    L, R = [], []
    for i, p in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        d = Vector((b[0] - a[0], b[1] - a[1])).normalized(); nrm = Vector((-d.y, d.x)) * widths[i] / 2
        L.append((p[0] + nrm.x, p[1] + nrm.y)); R.append((p[0] - nrm.x, p[1] - nrm.y))
    return [[L[i], L[i + 1], R[i + 1], R[i]] for i in range(len(pts) - 1)]

def arc(u, v, rx, rz, a0, a1, n):
    return [ell(u, v, rx, rz, math.radians(a0 + (a1 - a0) * i / (n - 1))) for i in range(n)]

def taper(n, lo, hi):
    return [lo + (hi - lo) * math.sin(math.pi * i / (n - 1)) for i in range(n)]

def mirror(polys):
    return [[(-p[0], p[1]) for p in poly] for poly in polys]


def project(name, layers, bvh, mats, base_off=0.012):
    """layers: [(mat key, polys)], later layers sit further out."""
    for li, (key, polys) in enumerate(layers):
        bm = bmesh.new(); off = base_off + 0.007 * li
        for poly in polys:
            vs = []
            for (u, v) in poly:
                hit = bvh.ray_cast(Vector((u, -6, v)), Vector((0, 1, 0)))
                p = hit[0] + hit[1] * off if hit[0] else Vector((u, -0.9, v))
                vs.append(bm.verts.new(p))
            f = bm.faces.new(vs)
            f.normal_update()
            if f.normal.y > 0: f.normal_flip()
        me = bpy.data.meshes.new(f'{name}{li}'); bm.to_mesh(me); bm.free()
        for p in me.polygons: p.use_smooth = True
        ob = bpy.data.objects.new(f'{name}{li}', me); bpy.context.scene.collection.objects.link(ob)
        me.materials.append(mats[key])


def both(fn, *a):
    polys = fn(*a); return polys + mirror(polys)


def face_layers(face):
    """Face decals in head space (u = x, v = z), drawn for the left eye and mirrored."""
    if face == 'doll':
        u, v = 0.34, -0.1
        lash = arc(u, v, 0.205, 0.225, 18, 162, 12)
        flick = strip([lash[0], (lash[0][0] + 0.10, lash[0][1] + 0.08)], [0.05, 0.005])
        return [('glass', both(fill, u, v, 0.2, 0.22)),
                ('glow', both(ring, u, v, 0.13, 0.14, 0.04)),
                ('lash', strip(lash, taper(12, 0.02, 0.06)) + flick + mirror(strip(lash, taper(12, 0.02, 0.06)) + flick)),
                ('hi', both(fill, u - 0.06, v + 0.08, 0.035, 0.035, 10)),
                ('line', both(strip, [(0.52, -0.36), (0.45, -0.58), (0.36, -0.76)], 0.014))]
    if face == 'anime':
        u, v = 0.33, -0.12
        lash = arc(u, v, 0.19, 0.21, 12, 168, 12)
        flick = strip([lash[0], (lash[0][0] + 0.09, lash[0][1] + 0.07)], [0.045, 0.005])
        low = arc(u, v, 0.17, 0.2, 235, 305, 5)
        mouth = strip([(-0.07, -0.6), (0, -0.625), (0.07, -0.6)], 0.02)
        return [('white', both(fill, u, v, 0.18, 0.2)),
                ('iris', both(fill, u, v - 0.02, 0.12, 0.17)),
                ('glow', both(fill, u, v - 0.05, 0.085, 0.11)),
                ('lash', both(fill, u, v - 0.02, 0.045, 0.075, 14) + strip(lash, taper(12, 0.02, 0.055)) + flick
                         + mirror(strip(lash, taper(12, 0.02, 0.055)) + flick) + both(strip, low, 0.014) + mouth
                         + both(strip, arc(0.3, 0.3, 0.16, 0.03, 30, 150, 6), 0.022)),
                ('hi', both(fill, u - 0.05, v + 0.05, 0.04, 0.04, 10) + both(fill, u + 0.045, v - 0.1, 0.018, 0.018, 8)),
                ('line', fill(0, -0.36, 0.016, 0.012, 8))]
    if face == 'visor':
        return [('glow', both(fill, 0.27, -0.13, 0.075, 0.14, 16)),
                ('hi', strip([(-0.55, 0.12), (-0.3, 0.3)], 0.03) + strip([(-0.6, 0.0), (-0.48, 0.1)], 0.015))]
    if face == 'mech':
        slit = [(-0.66, -0.02), (-0.33, -0.09), (0, -0.11), (0.33, -0.09), (0.66, -0.02)]
        return [('glow', strip(slit, 0.08)),
                ('gun', strip([(-0.17, -0.5), (0.17, -0.5)], 0.035) + strip([(-0.15, -0.58), (0.15, -0.58)], 0.035)
                        + strip([(-0.12, -0.66), (0.12, -0.66)], 0.035)),
                ('line', both(strip, [(0.48, -0.24), (0.38, -0.55), (0.24, -0.82)], 0.016))]


# ---------- hair, headdress, ears ----------
HC, HR = Vector((0, 0.03, 0.04)), (0.98, 0.98, 1.1)       # hair / helmet ellipsoid

def hair_shell(style, helmet):
    u, v = SEG[style]
    def shape(co):
        x, y, z = co
        if z < -0.1 and not helmet:
            t = (-z - 0.1) / 0.9; x *= 1 + 0.12 * t; y *= 1 + 0.08 * t
        return Vector((x, y, z))
    bm = ellipsoid_bm(u, v, HC, HR, shape)
    cut = []
    for f in bm.faces:
        c = f.calc_center_median()
        if helmet: drop = c.z < -0.45 or (c.y < -0.2 and abs(c.x) < 0.8 and c.z < 0.45)
        else: drop = c.z < -0.78 or (c.y < -0.15 and abs(c.x) < 0.72 and c.z < 0.55)
        if drop: cut.append(f)
    bmesh.ops.delete(bm, geom=cut, context='FACES')
    return bm


def bangs(style):
    k = SPIKES[style]; cols = 2 * k + 1; rows = {'ps1': 2, 'ps2': 4, 'cel': 8}[style]
    bm = bmesh.new(); grid = []
    rx, ry, rz = HR[0] * 0.985, HR[1] * 0.985, HR[2] * 0.985
    for j in range(cols):
        th = math.radians(-64 + 128 * j / (cols - 1))
        zb = [0.36, 0.14, 0.3, 0.2, 0.38, 0.12, 0.33, 0.22, 0.36, 0.16, 0.3, 0.2][(j // 2) % 12] if j % 2 else 0.42
        if abs(th) > math.radians(48): zb -= 0.2          # longer side bangs frame the face
        col = []
        for i in range(rows + 1):
            z = 0.78 + (zb - 0.78) * i / rows
            ph = math.asin(max(-1, min(1, (z - HC.z) / rz)))
            col.append(bm.verts.new(HC + Vector((rx * math.cos(ph) * math.sin(th), -ry * math.cos(ph) * math.cos(th), z - HC.z))))
        grid.append(col)
    for j in range(cols - 1):
        for i in range(rows):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    return bm


def frill(style, width, pleats, amp, angular, y0=-0.25):
    n = ARC[style]; rows = 1 if style == 'ps1' else 3
    s = math.sqrt(1 - ((y0 - HC.y) / HR[1]) ** 2)
    bm, grid = bmesh.new(), []
    for j in range(n + 1):
        a = math.radians(14 + 152 * j / n); ca, sa = math.cos(a), math.sin(a)
        base = Vector((HR[0] * s * 1.01 * ca, y0, HC.z + HR[2] * s * 1.01 * sa))
        out = Vector((ca * 0.9, -0.38, sa * 0.9)).normalized()
        ph = pleats * a
        w = (2 * abs((ph / math.pi) % 2 - 1) - 1) if angular else math.sin(ph)
        row = []
        for i in range(rows + 1):
            t = i / rows
            p = base + out * width * t + Vector((ca * 0.5, -1, sa * 0.5)) * amp * w * t
            row.append(bm.verts.new(p))
        grid.append(row)
    for j in range(n):
        for i in range(rows):
            bm.faces.new((grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1]))
    return bm


def band(style, y0=-0.27, w0=-0.02, w1=0.07):
    n = ARC[style] // 2; s = math.sqrt(1 - ((y0 - HC.y) / HR[1]) ** 2)
    bm, prev = bmesh.new(), None
    for j in range(n + 1):
        a = math.radians(12 + 156 * j / n); ca, sa = math.cos(a), math.sin(a)
        base = Vector((HR[0] * s * 1.02 * ca, y0, HC.z + HR[2] * s * 1.02 * sa)); out = Vector((ca, -0.2, sa)).normalized()
        cur = (bm.verts.new(base + out * w0), bm.verts.new(base + out * w1))
        if prev: bm.faces.new((prev[0], cur[0], cur[1], prev[1]))
        prev = cur
    return bm


def collar(style, angular):
    n = ARC[style]; bm, grid = bmesh.new(), []
    for j in range(n):
        a = 2 * math.pi * j / n; ph = 14 * a
        w = (2 * abs((ph / math.pi) % 2 - 1) - 1) if angular else math.sin(ph)
        row = []
        for t in (0, 0.5, 1):
            r = 0.24 + 0.24 * t
            row.append(bm.verts.new(Vector((r * math.cos(a), 0.05 + r * math.sin(a), -1.38 - 0.14 * t + 0.04 * w * t))))
        grid.append(row)
    for j in range(n):
        for i in range(2):
            bm.faces.new((grid[j][i], grid[(j + 1) % n][i], grid[(j + 1) % n][i + 1], grid[j][i + 1]))
    return bm


# ---------- hand ----------
def build_hand(P, parts, style):
    seg = LIMB[style]; S = 1.6
    knuck = [(-0.135, 0.42, 0.95), (-0.045, 0.44, 1.0), (0.045, 0.43, 0.94), (0.13, 0.40, 0.78)]
    curls = [(30, 35, 20), (68, 78, 55), (78, 85, 60), (85, 90, 60)]
    lens = (0.17, 0.11, 0.085)
    chains = []
    for (x, kz, sc), cu in zip(knuck, curls):
        p, d = Vector((x, 0, kz)), Vector((0, 0, 1)); pts = [p.copy()]
        for L, c in zip(lens, cu):
            d = Matrix.Rotation(math.radians(c), 3, 'X') @ d; p = p + d * L * sc; pts.append(p.copy())
        chains.append(pts)
    tip = chains[0][-1]
    B, C, T = Vector((-0.17, -0.05, 0.12)), Vector((-0.30, -0.22, 0.32)), tip + Vector((0, -0.035, -0.01))
    chains.append([(1 - t) ** 2 * B + 2 * (1 - t) * t * C + t * t * T for t in (0, 0.42, 0.74, 1)])
    # orient: fingers up toward the headdress, palm turned to the head
    F = Vector((0.42, -0.2, 0.88)).normalized(); N = Vector((0.85, -0.35, -0.4)); N = (N - F * N.dot(F)).normalized()
    Y = -N; X = Y.cross(F)
    R = Matrix((X, Y, F)).transposed().to_4x4()
    M0 = R @ Matrix.Scale(S, 4)
    M = Matrix.Translation(P - M0 @ tip) @ M0
    W = M @ Vector((0, 0, 0))
    parts.box('ceramic', M @ Matrix.Translation((0, 0, 0.2)) @ Matrix.Diagonal((0.34, 0.13, 0.42, 1)))
    parts.box('gun', M @ Matrix.Translation((0, 0.07, 0.22)) @ Matrix.Diagonal((0.26, 0.04, 0.3, 1)))
    for pts in chains:
        wp = [M @ p for p in pts]
        for i, p in enumerate(wp):
            parts.sphere('gun', p, (0.05 if i == 0 else 0.042) * S, seg)
            if i: parts.cyl('ceramic', wp[i - 1], p, 0.04 * S, seg)
    parts.sphere('gun', W, 0.1 * S, seg)
    E = W + Vector((-0.3, 0.35, -1.6))
    parts.cyl('ceramic', W + (E - W).normalized() * 0.1, E, 0.12 * S, seg, 0.15 * S)
    parts.cyl('gun', W, W + (E - W) * 0.5, 0.08 * S, seg)


# ---------- the bust ----------
def build(style, face):
    mats = Mats(style); smooth = style != 'ps1'; ink = INK[style]; u, v = SEG[style]; seg = LIMB[style]
    mech = face == 'mech'
    # head
    hb = ellipsoid_bm(u, v, (0, 0, 0), (0.9, 0.92, 1.04), head_shape)
    bvh = BVHTree.FromBMesh(hb)
    head_mats = {'doll': ['ceramic'], 'anime': ['skin'], 'visor': ['ceramic', 'glass'], 'mech': ['glass']}[face]
    if face == 'visor':
        for f in hb.faces:
            c = f.calc_center_median()
            if c.y < -0.45 and -0.82 < c.z < 0.36 and abs(c.x) < 0.76: f.material_index = 1
    to_object('head', hb, [mats[k] for k in head_mats], smooth, ink)
    project('face', face_layers(face), bvh, mats)
    # hair or helmet, headdress
    to_object('hair', hair_shell(style, mech), [mats['ceramic' if mech else 'hair']], smooth, ink, 0.05)
    if not mech: to_object('bangs', bangs(style), [mats['hair']], smooth, ink, 0.05)
    to_object('frill', frill(style, 0.24 if mech else 0.28, 18 if mech else 30, 0.035 if mech else 0.045, mech),
              [mats['ceramic' if mech else 'white']], smooth, ink, 0.025)
    to_object('band', band(style), [mats['glow' if mech else 'lash']], smooth, 0, 0.02)
    # ears (and antennae on the more mechanical faces)
    p = Parts()
    for s in (-1, 1):
        r = 0.32 if mech else 0.26
        p.cyl('ceramic', (s * 0.86, 0.05, -0.05), (s * 1.08, 0.05, -0.05), r, seg * 2)
        p.cyl('glow', (s * 1.08, 0.05, -0.05), (s * 1.095, 0.05, -0.05), r * 0.7, seg * 2)
        p.cyl('gun', (s * 1.09, 0.05, -0.05), (s * 1.11, 0.05, -0.05), r * 0.5, seg * 2)
        if face in ('visor', 'mech'):
            tipp = Vector((s * 1.1, 0.3, 0.85 if mech else 0.7))
            p.cyl('gun', (s * 1.0, 0.1, 0.15), tipp, 0.025, seg)
            p.sphere('glow', tipp, 0.045, seg)
    # neck, torso, sleeves, bow
    p.cyl('gun', (0, 0.05, -1.55), (0, 0.05, -0.7), 0.2, seg * 2)
    for z in (-1.02, -1.22):
        p.cyl('lash', (0, 0.05, z - 0.03), (0, 0.05, z + 0.03), 0.225, seg * 2)
    tb = ellipsoid_bm(u, v, (0, 0.12, -2.25), (1.05, 0.6, 0.85))
    tbvh = BVHTree.FromBMesh(tb)
    to_object('torso', tb, [mats['dress']], smooth, ink)
    project('bib', [('ceramic' if mech else 'white', sum((strip([(0.3 * k, -1.75), (0.425 * k, -3.1)], [0.11, 0.155]) for k in (-0.8, -0.4, 0, 0.4, 0.8)), []))], tbvh, mats, 0.01)
    for s in (-1, 1):
        if mech: p.sphere('ceramic', (s * 0.92, 0.12, -1.86), (0.36, 0.34, 0.24), seg * 2, Matrix.Rotation(math.radians(-22 * s), 4, 'Y'))
        else: p.sphere('dress', (s * 0.92, 0.12, -1.92), (0.3, 0.3, 0.26), seg * 2)
        p.sphere('cloth', (s * 0.17, -0.42, -1.62), (0.18, 0.07, 0.11), seg * 2,
                 Matrix.Rotation(math.radians(-14 * s), 4, 'Y'))
    p.sphere('cloth', (0, -0.47, -1.62), 0.07, seg)
    build_hand(Vector((-1.0, -0.42, 0.66)), p, style)
    p.build('parts', mats, smooth, ink * 0.7)
    to_object('collar', collar(style, mech), [mats['ceramic' if mech else 'white']], smooth, ink, 0.02)
    return mats


# ---------- scene ----------
def sun(name, rot, energy, color=(1, 1, 1)):
    L = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN')); L.data.energy = energy; L.data.color = color
    L.rotation_euler = rot; bpy.context.scene.collection.objects.link(L); return L

def point(name, loc, energy, color):
    L = bpy.data.objects.new(name, bpy.data.lights.new(name, 'POINT')); L.data.energy = energy; L.data.color = color
    L.data.shadow_soft_size = 0.05; L.location = loc; bpy.context.scene.collection.objects.link(L); return L


def render(style, face):
    global INK_MAT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    INK_MAT = ink_mat()
    sc = bpy.context.scene
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engines else 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = RES[style]
    sc.render.filter_size = 0.0 if style == 'ps1' else 1.0
    sc.eevee.taa_render_samples = {'ps1': 1, 'ps2': 4, 'cel': 32}[style]
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']
    mats = build(style, face)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = 24; cam.data.lens = 50
    tgt = Vector((-0.2, 0, -0.5)); yaw = math.radians(14)
    cam.location = tgt + Vector((math.sin(yaw) * 9.5, -math.cos(yaw) * 9.5, 0.9))
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
    lit = [sun('key', (math.radians(50), math.radians(-25), math.radians(-35)), 3.0),
           sun('fill', (math.radians(70), math.radians(30), math.radians(40)), 0.8, (0.85, 0.9, 1)),
           sun('rim', (math.radians(-60), math.radians(20), math.radians(160)), 3.0)]
    ex = [-0.3, 0.3] if face != 'mech' else [0.0]
    dark = [point(f'eye{i}', (x, -1.6, -0.1), 3 if face != 'mech' else 5, (1, 0.45, 0.15)) for i, x in enumerate(ex)]
    dark.append(sun('moon', (math.radians(-70), math.radians(-30), math.radians(-150)), 0.25, (0.55, 0.65, 1)))
    for mode, on, off, wc in [('lit', lit, dark, (0.2, 0.2, 0.22)), ('dark', dark, lit, (0, 0, 0))]:
        for L in on: L.hide_render = False
        for L in off: L.hide_render = True
        bg.inputs[0].default_value = (*wc, 1)
        for m in mats.values():
            if 'glow' in m:
                m.node_tree.nodes['Emission'].inputs['Strength'].default_value = m['glow'] * GLOW[mode]
        sc.render.filepath = os.path.abspath(f'{OUT}/{style}-{face}-{mode}.png')
        bpy.ops.render.render(write_still=True)
    tris = sum(len(o.data.polygons) for o in sc.objects if o.type == 'MESH')
    print(f'MATRIX {style}-{face} polys(before modifiers) {tris}')


os.makedirs(OUT, exist_ok=True)
for st in STYLES:
    for fc in FACES:
        if ONLY and f'{st}:{fc}' not in ONLY: continue
        render(st, fc)
