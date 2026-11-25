import bpy, math
from mathutils import Vector

def add_light(name, kind, loc, energy, color, size=.1, rot=None, spot=None, target=None):
    d = bpy.data.lights.new(name, kind); d.energy = energy; d.color = color
    if kind == 'AREA': d.size = size
    elif kind in ('POINT', 'SPOT'): d.shadow_soft_size = size
    if spot: d.spot_size, d.spot_blend = spot
    o = bpy.data.objects.new(name, d); bpy.context.scene.collection.objects.link(o); o.location = loc
    if target:
        dvec = Vector(target) - Vector(loc); o.rotation_euler = dvec.to_track_quat('-Z', 'Y').to_euler()
    elif rot: o.rotation_euler = rot
    return o

def setup(lamp_on=True, street=True):
    S = bpy.context.scene
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.01, .013, .03, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = .6
    L = []
    # moonlight through window
    L.append(add_light('moon', 'SPOT', (-7.5, 4.6, 3.4), 2600, (.55, .65, 1), .15, spot=(math.radians(42), .15), target=(1, 5.0, .7)))
    L.append(add_light('skyWin', 'AREA', (-4.5, 4.8, 1.8), 60, (.4, .5, 1), 1.8, target=(0, 4.8, 1.2)))
    if lamp_on:
        L.append(add_light('deskLamp', 'AREA', (.85, 4.7, 1.17), 55, (1, .62, .3), .3, target=(.85, 4.7, 0)))
        L.append(add_light('deskBulb', 'POINT', (.85, 4.68, 1.17), 6, (1, .6, .3), .05))
    if street:
        L.append(add_light('streetLamp', 'SPOT', (1.92, -2.4, 3.82), 900, (1, .62, .32), .12, spot=(math.radians(110), .6), target=(1.6, -2.2, 0)))
        L.append(add_light('neon', 'AREA', (0, -.6, 3.15), 300, (1, .22, .45), 2.6, target=(0, -3, 1)))
        L.append(add_light('doorSpill', 'AREA', (0, .6, 1.4), 25, (1, .7, .45), 1.0, target=(0, -2, .5)))
    return L
