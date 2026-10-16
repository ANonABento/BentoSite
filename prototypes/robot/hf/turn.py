import bpy, sys, math, mathutils
glb, out = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
pts = [o.matrix_world @ mathutils.Vector(c) for o in objs for c in o.bound_box]
lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
c = (lo + hi) / 2; h = max(hi - lo)
print('size', tuple(round(x, 3) for x in (hi - lo)), 'tris', sum(len(o.data.polygons) for o in objs))
sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 600, 900
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.35, 0.37, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = h * 1.1
L = bpy.data.objects.new('L', bpy.data.lights.new('L', 'SUN')); L.data.energy = 3; L.rotation_euler = (0.8, 0.2, 0.6); sc.collection.objects.link(L)
# up axis: glTF import makes Z up
for name, ang in [('front', 0), ('q', 45), ('side', 90), ('back', 180)]:
    a = math.radians(ang); d = h * 3
    cam.location = c + mathutils.Vector((math.sin(a) * d, -math.cos(a) * d, 0))
    cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = f'{out}-{name}.png'; bpy.ops.render.render(write_still=True)

# face close-ups: top 14% of the figure
cam.data.ortho_scale = h * 0.16
hc = mathutils.Vector((c.x, c.y, hi.z - h * 0.085))
for name, ang in [('face', 0), ('faceq', 35)]:
    a = math.radians(ang); d = h * 3
    cam.location = hc + mathutils.Vector((math.sin(a) * d, -math.cos(a) * d, 0))
    cam.rotation_euler = (hc - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x = sc.render.resolution_y = 700
    sc.render.filepath = f'{out}-{name}.png'; bpy.ops.render.render(write_still=True)
