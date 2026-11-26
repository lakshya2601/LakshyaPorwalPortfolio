import bpy, os
D = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'office.blend'))
tw = [o for o in bpy.data.objects if o.name.startswith('tw_part')]
bpy.ops.object.select_all(action='DESELECT')
for o in tw:
    o.select_set(True)
bpy.context.view_layer.objects.active = tw[0]
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join(); bpy.context.object.name = 'typewriter'
bpy.ops.export_scene.gltf(filepath=os.path.join(D, 'out', 'typewriter.glb'), use_selection=True, export_format='GLB', export_apply=True, export_image_format='JPEG')
print('ok', len(tw))
