import bpy, os
D = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'office.blend'))
for g in ('ext', 'room', 'props'):
    ob = bpy.data.objects[g]
    ob.data.materials.clear()
    m = bpy.data.materials.new(g); ob.data.materials.append(m)
neon = bpy.data.objects['neon']
bpy.ops.object.select_all(action='DESELECT')
for n in ('ext', 'room', 'props', 'neon'):
    bpy.data.objects[n].select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(D, 'out', 'office.glb'), use_selection=True, export_format='GLB',
                          export_normals=True, export_materials='EXPORT', export_apply=True)
print('exported')
