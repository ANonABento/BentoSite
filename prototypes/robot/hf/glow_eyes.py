# Make the orange screen eyes / rings emissive (mask from the base colour) and render a dark close-up + full shot.
import bpy, sys, numpy as np, mathutils, math
glb, out, png = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
o = max([x for x in bpy.context.scene.objects if x.type == 'MESH'], key=lambda x: len(x.data.vertices)); m = o.data.materials[0]; nt = m.node_tree
tex = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and 'base' in n.image.name.lower()][0]
W, H = tex.image.size; p = np.array(tex.image.pixels[:]).reshape(H, W, 4)
r, g, b = p[..., 0], p[..., 1], p[..., 2]
mask = (r > 0.75) & (g > 0.25) & (g < 0.7) & (b < 0.35)
em = np.zeros_like(p); em[..., 3] = 1; em[mask, :3] = p[mask, :3]
im = bpy.data.images.new('emit', W, H); im.pixels = em.ravel().tolist(); im.pack()
te = nt.nodes.new('ShaderNodeTexImage'); te.image = im
bs = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
nt.links.new(te.outputs['Color'], bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 6.0
print('emissive px', int(mask.sum()))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB')
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
try: sc.eevee.use_bloom = True
except Exception: pass
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.004, 0.005, 0.008, 1)
L = bpy.data.objects.new('L', bpy.data.lights.new('L', 'AREA')); L.data.energy = 4; L.data.color = (0.6, 0.7, 1.0); L.location = (-0.6, -0.4, 0.6); sc.collection.objects.link(L)
L.rotation_euler = (mathutils.Vector((0, 0, 0.3)) - L.location).to_track_quat('-Z', 'Y').to_euler()
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
for name, tgt, dist, lens, res in [('dark-face', (0, -0.03, 0.375), 0.25, 85, (800, 800)), ('dark-full', (0, 0, 0.05), 2.6, 50, (600, 900))]:
    t = mathutils.Vector(tgt); cam.location = t + mathutils.Vector((0.05, -dist, 0.02)); cam.data.lens = lens
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = f'{png}-{name}.png'; bpy.ops.render.render(write_still=True)
