import bpy
bpy.ops.wm.open_mainfile(filepath='/home/claude/det/props/phone.blend')
for o in list(bpy.data.objects):
    if o.type in ('LIGHT', 'CAMERA') or (o.type == 'MESH' and o.data.materials and o.data.materials[0].name == 'desk'): bpy.data.objects.remove(o)
for o in list(bpy.data.objects):
    if o.hide_render: bpy.data.objects.remove(o)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
    if o.type in ('FONT', 'CURVE'): o.select_set(True); bpy.context.view_layer.objects.active = o
bpy.ops.object.convert(target='MESH')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath='/home/claude/det/props/glb/rotary_phone.glb', export_format='GLB', export_apply=True, use_selection=True)
print('ok')
