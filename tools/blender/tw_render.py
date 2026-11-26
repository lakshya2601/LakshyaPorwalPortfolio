import bpy, os, math, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
import lights
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'office.blend'))
lights.setup(lamp_on=True)
S = bpy.context.scene; S.render.engine = 'CYCLES'; S.cycles.samples = 48; S.cycles.device = 'CPU'
S.render.resolution_x = 960; S.render.resolution_y = 640
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); S.collection.objects.link(cam); S.camera = cam
from mathutils import Vector
for name, pos, tgt in [('tw1', (-.05, 4.05, 1.12), (.1, 4.66, .9)), ('tw2', (.2, 3.5, 1.6), (.1, 4.58, .84))]:
    cam.location = pos; d = Vector(tgt) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 35
    S.render.filepath = os.path.join(D, name + '.png'); bpy.ops.render.render(write_still=True)
print('ok')
