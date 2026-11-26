import bpy, bmesh, math, os, sys
from mathutils import Vector
OUT = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene

def mat(name, col, rough=.3, metal=0, coat=0, sub=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = .05
    return m

def noisy(m, scale=60, amt=.08):
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = 8
    r = nt.nodes.new('ShaderNodeMapRange'); r.inputs['To Min'].default_value = b.inputs['Roughness'].default_value - amt; r.inputs['To Max'].default_value = b.inputs['Roughness'].default_value + amt
    nt.links.new(n.outputs['Fac'], r.inputs['Value']); nt.links.new(r.outputs['Result'], b.inputs['Roughness'])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .04
    nt.links.new(n.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m

BAKE = noisy(mat('bakelite', (.006, .006, .006), .2, 0, 1), 90, .05)
CHROME = noisy(mat('chrome', (.85, .85, .86), .12, 1), 200, .05)
IVORY = noisy(mat('ivory', (.82, .76, .62), .4), 80, .05)
PAPER = mat('card', (.92, .88, .78), .7)
RUBBER = mat('rubber', (.02, .02, .02), .7)
WOOD = bpy.data.materials.new('desk'); WOOD.use_nodes = True
_nt = WOOD.node_tree; _b = _nt.nodes['Principled BSDF']; _b.inputs['Roughness'].default_value = .38
_w = _nt.nodes.new('ShaderNodeTexWave'); _w.inputs['Scale'].default_value = 3; _w.inputs['Distortion'].default_value = 3; _w.inputs['Detail'].default_value = 6; _w.inputs['Detail Scale'].default_value = 2
_m = _nt.nodes.new('ShaderNodeMapping'); _m.inputs['Scale'].default_value = (14, 1, 1); _tc = _nt.nodes.new('ShaderNodeTexCoord')
_nt.links.new(_tc.outputs['Object'], _m.inputs[0]); _nt.links.new(_m.outputs[0], _w.inputs[0])
_r = _nt.nodes.new('ShaderNodeValToRGB'); _r.color_ramp.elements[0].color = (.06, .025, .012, 1); _r.color_ramp.elements[1].color = (.2, .09, .04, 1)
_nt.links.new(_w.outputs['Fac'], _r.inputs[0]); _nt.links.new(_r.outputs[0], _b.inputs['Base Color'])
FELT = mat('felt', (.03, .1, .06), .9)

def sm(o, lvl=2):
    m = o.modifiers.new('sub', 'SUBSURF'); m.levels = lvl; m.render_levels = lvl
    for p in o.data.polygons: p.use_smooth = True

# ---------- body: tapered rounded box ----------
bpy.ops.mesh.primitive_cube_add(size=1); body = bpy.context.object; body.name = 'body'
body.scale = (.22, .24, .11); bpy.ops.object.transform_apply(scale=True)
for v in body.data.vertices:
    if v.co.z > 0: v.co.x *= .8; v.co.y *= .74; v.co.y += .02
    if v.co.z > 0 and v.co.y < 0: v.co.z -= .035
body.location.z = .05
bv = body.modifiers.new('bv', 'BEVEL'); bv.width = .028; bv.segments = 4
sm(body, 2); body.data.materials.append(BAKE)
# sloped front face where the dial sits: rotate whole dial assembly
DIAL_C = Vector((0, -.02, .092)); TILT = math.radians(-12)
# cradle: two prongs
for s in (-1, 1):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(s * .072, .075, .12)); p = bpy.context.object
    p.scale = (.03, .04, .045); bpy.ops.object.transform_apply(scale=True)
    b2 = p.modifiers.new('bv', 'BEVEL'); b2.width = .012; b2.segments = 4; sm(p, 1); p.data.materials.append(BAKE)
    bpy.ops.mesh.primitive_cylinder_add(radius=.008, depth=.03, location=(s * .072, .075, .145)); bpy.context.object.data.materials.append(CHROME)

# ---------- handset (curve with bevel) ----------
cu = bpy.data.curves.new('hs', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = .016; cu.bevel_resolution = 6
sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
pts = [(-.1, .075, .168), (0, .08, .19), (.1, .075, .168)]
for bp, co in zip(sp.bezier_points, pts):
    bp.co = co; bp.handle_left_type = bp.handle_right_type = 'AUTO'
hs = bpy.data.objects.new('handset', cu); S.collection.objects.link(hs); hs.data.materials.append(BAKE)
for s in (-1, 1):
    bpy.ops.mesh.primitive_cylinder_add(radius=.032, depth=.04, location=(s * .105, .075, .158)); cup = bpy.context.object
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
    for v in cup.data.vertices:
        if v.co.z > 0: v.co.x *= .7; v.co.y *= .7
    b3 = cup.modifiers.new('bv', 'BEVEL'); b3.width = .012; b3.segments = 4; sm(cup, 2); cup.data.materials.append(BAKE)
    for i in range(7):
        a = i / 7 * 6.283
        bpy.ops.mesh.primitive_cylinder_add(radius=.003, depth=.01, location=(s * .105 + math.cos(a) * .013, .075 + math.sin(a) * .013, .137))
        bpy.context.object.data.materials.append(RUBBER)

# ---------- dial parts (grouped so we can tilt them) ----------
dial_objs = []
def add(o): dial_objs.append(o); return o
# number ring (ivory) with digits
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=.082, depth=.006, location=(0, 0, 0)); ring = add(bpy.context.object); ring.data.materials.append(IVORY)
R_H, STOP = .061, 62
def hole_angle(k): return STOP - 30 * (k + 1.15)
for k in range(1, 11):
    a = math.radians(-hole_angle(k))
    bpy.ops.object.text_add(location=(math.cos(a) * R_H, math.sin(a) * R_H, .0032))
    t = bpy.context.object; t.data.body = str(k % 10); t.data.size = .016; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'; t.data.extrude = .0002
    t.data.materials.append(RUBBER); add(t)
holes = []
# finger wheel: chrome disc with holes
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=.079, depth=.004, location=(0, 0, .0075)); wheel = bpy.context.object; wheel.name = 'wheel'
for k in range(1, 11):
    a = math.radians(-hole_angle(k))
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.0105, depth=.03, location=(math.cos(a) * R_H, math.sin(a) * R_H, .0075)); h = bpy.context.object
    bo = wheel.modifiers.new('h%d' % k, 'BOOLEAN'); bo.object = h; bo.operation = 'DIFFERENCE'; h.hide_render = True; h.display_type = 'WIRE'; holes.append(h)
bv2 = wheel.modifiers.new('bv', 'BEVEL'); bv2.width = .0012; bv2.segments = 3
wheel.data.materials.append(CHROME); add(wheel)
# centre card
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=.033, depth=.003, location=(0, 0, .0105)); card = add(bpy.context.object); card.data.materials.append(PAPER)
for txt, y, sz in [('INDORE', .012, .007), ('0731 254607', 0, .0068), ('DETECTIVE', -.012, .0055)]:
    bpy.ops.object.text_add(location=(0, y, .0125)); t = bpy.context.object; t.data.body = txt; t.data.size = sz; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    t.data.materials.append(RUBBER); add(t)
bpy.ops.mesh.primitive_torus_add(major_radius=.033, minor_radius=.0016, location=(0, 0, .0115)); add(bpy.context.object).data.materials.append(CHROME)
# finger stop
bpy.ops.mesh.primitive_cube_add(size=1, location=(math.cos(math.radians(-STOP)) * .083, math.sin(math.radians(-STOP)) * .083, .011)); fs = add(bpy.context.object)
fs.scale = (.022, .004, .004); fs.rotation_euler.z = math.radians(-STOP); fs.data.materials.append(CHROME)
# place dial on sloped front
emp = bpy.data.objects.new('dialGroup', None); S.collection.objects.link(emp); emp.location = DIAL_C; emp.rotation_euler.x = TILT; emp.scale = (.66, .66, .66)
for o in dial_objs + holes: o.parent = emp

# ---------- coiled cord ----------
cu2 = bpy.data.curves.new('cord', 'CURVE'); cu2.dimensions = '3D'; cu2.bevel_depth = .0035; cu2.bevel_resolution = 3
sp2 = cu2.splines.new('POLY'); N = 420; sp2.points.add(N - 1)
for i in range(N):
    t = i / (N - 1); base = Vector((-.11 - .14 * t, .06 - .2 * math.sin(t * 2.2), .02 + .13 * (1 - t) ** 3))
    a = i * .75; sp2.points[i].co = (base.x + math.cos(a) * .006, base.y, base.z + math.sin(a) * .006, 1)
cord = bpy.data.objects.new('cord', cu2); S.collection.objects.link(cord); cord.data.materials.append(BAKE)

# ---------- desk ----------
bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, 0)); bpy.context.object.data.materials.append(WOOD)


# ---------- lighting: lamp + moon rim ----------
w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.004, .005, .01, 1)
def light(kind, loc, tgt, e, col, size):
    d = bpy.data.lights.new(kind, 'AREA'); d.energy = e; d.color = col; d.size = size
    o = bpy.data.objects.new(kind, d); S.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o
light('lamp', (.35, -.05, .55), (0, 0, .05), 40, (1, .64, .34), .25)
light('rim', (-.6, .5, .35), (0, 0, .1), 25, (.5, .6, 1), .6)
light('fill', (0, -1.2, .4), (0, 0, .05), 3, (1, .8, .6), 1)

S.render.engine = 'CYCLES'; S.cycles.device = 'CPU'; S.cycles.samples = int(sys.argv[-1]) if sys.argv[-1].isdigit() else 64; S.cycles.use_denoising = True
S.view_settings.view_transform = 'AgX'; S.view_settings.look = 'AgX - Medium High Contrast'
def cam(loc, tgt, lens):
    c = bpy.data.cameras.new('c'); c.lens = lens; c.dof.use_dof = True; c.dof.aperture_fstop = 2.8
    o = bpy.data.objects.new('cam', c); S.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); c.dof.focus_distance = (Vector(tgt) - Vector(loc)).length; return o
S.camera = cam((.18, -.62, .52), (0, -.01, .07), 55)
S.render.resolution_x, S.render.resolution_y = 1280, 860
S.render.filepath = os.path.join(OUT, 'phone_hero.png'); bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'phone.blend'))
# ---- top-down dial layers for the interactive dial ----
emp.rotation_euler.x = 0; emp.location = (0, 0, 0); emp.scale = (1, 1, 1)
for o in S.objects:
    if o.type in ('MESH', 'CURVE', 'FONT') and o not in dial_objs and o not in holes: o.hide_render = True
oc = bpy.data.cameras.new('ortho'); oc.type = 'ORTHO'; oc.ortho_scale = .2
co = bpy.data.objects.new('ortho', oc); S.collection.objects.link(co); co.location = (0, 0, .5); S.camera = co
S.render.film_transparent = True; S.render.resolution_x = S.render.resolution_y = 900
for l in [o for o in S.objects if o.type == 'LIGHT']: S.collection.objects.unlink(l)
light('key', (.12, -.15, .3), (0, 0, 0), 1.4, (1, .85, .7), .5); light('strip', (-.05, .25, .35), (0, 0, 0), 1.6, (1, 1, 1), .15); light('soft', (-.3, .3, .5), (0, 0, 0), 2.5, (.8, .85, 1), .8)
w.node_tree.nodes['Background'].inputs[0].default_value = (.06, .055, .05, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .35
wheel.hide_render = True
cap = [card, fs] + [o for o in dial_objs if o.type == 'FONT' and o.location.z > .012] + [o for o in dial_objs if o.name.startswith('Torus')]
for o in cap: o.hide_render = True
S.render.filepath = os.path.join(OUT, 'dial_base.png'); bpy.ops.render.render(write_still=True)
for o in dial_objs: o.hide_render = True
for o in cap: o.hide_render = False
S.render.filepath = os.path.join(OUT, 'dial_cap.png'); bpy.ops.render.render(write_still=True)
for o in cap: o.hide_render = True
wheel.hide_render = False
for o in S.objects:
    if o.name.startswith('Torus') or o.name.startswith('Cylinder.0') and False: o.hide_render = False
S.render.filepath = os.path.join(OUT, 'dial_wheel.png'); bpy.ops.render.render(write_still=True)
