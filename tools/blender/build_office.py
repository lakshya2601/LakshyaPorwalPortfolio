import bpy, bmesh, math, random, os
from mathutils import Vector
random.seed(7)
OUT = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene

# ---------- material helpers ----------
def mat(name, color, rough=.7, metal=0., emit=None, emit_strength=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_strength
    m['rough'] = rough; m['metal'] = metal
    return m

def proc(name, rough, metal, build):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    col = build(nt)
    nt.links.new(col, b.inputs['Base Color'])
    m['rough'] = rough; m['metal'] = metal
    return m

def ramp(nt, fac, stops):
    r = nt.nodes.new('ShaderNodeValToRGB')
    el = r.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], (*stops[0][1], 1)
    el[1].position, el[1].color = stops[-1][0], (*stops[-1][1], 1)
    for p, c in stops[1:-1]:
        e = el.new(p); e.color = (*c, 1)
    nt.links.new(fac, r.inputs[0]); return r.outputs[0]

def tc(nt):
    t = nt.nodes.new('ShaderNodeTexCoord'); return t.outputs['Object']

def wood(nt, c1, c2, scale=14, stretch=(1, 1, 1)):
    m = nt.nodes.new('ShaderNodeMapping'); m.inputs['Scale'].default_value = stretch
    nt.links.new(tc(nt), m.inputs[0])
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 9; n.inputs['Detail'].default_value = 8
    nt.links.new(m.outputs[0], n.inputs[0])
    w = nt.nodes.new('ShaderNodeTexWave'); w.inputs['Scale'].default_value = scale; w.inputs['Distortion'].default_value = 6
    w.inputs['Detail'].default_value = 3
    nt.links.new(m.outputs[0], w.inputs[0])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'FLOAT'; mix.inputs[0].default_value = .2
    nt.links.new(w.outputs['Fac'], mix.inputs[2]); nt.links.new(n.outputs['Fac'], mix.inputs[3])
    return ramp(nt, mix.outputs[0], [(0, c1), (1, c2)])

def noisecol(nt, c1, c2, scale=20, detail=4):
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = detail
    nt.links.new(tc(nt), n.inputs[0])
    return ramp(nt, n.outputs['Fac'], [(.3, c1), (.7, c2)])

def bricks(nt):
    b = nt.nodes.new('ShaderNodeTexBrick')
    b.inputs['Color1'].default_value = (.22, .1, .08, 1); b.inputs['Color2'].default_value = (.15, .07, .06, 1)
    b.inputs['Mortar'].default_value = (.12, .11, .11, 1); b.inputs['Scale'].default_value = 3.2
    b.inputs['Mortar Size'].default_value = .012; b.inputs['Brick Width'].default_value = .5; b.inputs['Row Height'].default_value = .22
    m = nt.nodes.new('ShaderNodeMapping'); m.inputs['Scale'].default_value = (1, 1, 1)
    t = nt.nodes.new('ShaderNodeTexCoord'); nt.links.new(t.outputs['Object'], m.inputs[0])
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(m.outputs[0], sep.inputs[0])
    comb = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(sep.outputs['X'], comb.inputs['X']); nt.links.new(sep.outputs['Z'], comb.inputs['Y'])
    nt.links.new(comb.outputs[0], b.inputs['Vector'])
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 40
    nt.links.new(t.outputs['Object'], n.inputs[0])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs[0].default_value = .35
    nt.links.new(b.outputs['Color'], mix.inputs[6]); nt.links.new(n.outputs['Color'], mix.inputs[7])
    return mix.outputs[2]

def planks(nt):
    t = nt.nodes.new('ShaderNodeTexCoord')
    b = nt.nodes.new('ShaderNodeTexBrick')
    b.inputs['Color1'].default_value = (.20, .11, .06, 1); b.inputs['Color2'].default_value = (.15, .08, .045, 1)
    b.inputs['Mortar'].default_value = (.05, .03, .02, 1); b.inputs['Scale'].default_value = 1.0
    b.inputs['Mortar Size'].default_value = .006; b.inputs['Brick Width'].default_value = 1.6; b.inputs['Row Height'].default_value = .16
    b.offset = .37
    nt.links.new(t.outputs['Object'], b.inputs['Vector'])
    w = wood(nt, (.0, .0, .0), (1, 1, 1), 9, (1, 10, 1))
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs[0].default_value = .55
    nt.links.new(b.outputs['Color'], mix.inputs[6]); nt.links.new(w, mix.inputs[7])
    return mix.outputs[2]

M = {}
M['wood'] = proc('wood', .45, 0, lambda nt: wood(nt, (.12, .05, .025), (.3, .14, .07)))
M['woodDark'] = proc('woodDark', .5, 0, lambda nt: wood(nt, (.06, .03, .018), (.16, .08, .04)))
M['floor'] = proc('floor', .4, 0, planks)
M['wall'] = proc('wall', .9, 0, lambda nt: noisecol(nt, (.13, .17, .17), (.17, .21, .2), 6, 6))
M['wallLow'] = proc('wallLow', .7, 0, lambda nt: wood(nt, (.07, .045, .03), (.13, .08, .05), 4, (1, 1, 6)))
M['ceil'] = mat('ceil', (.1, .1, .1), .95)
M['brick'] = proc('brick', .85, 0, bricks)
M['street'] = proc('street', .35, 0, lambda nt: noisecol(nt, (.025, .025, .03), (.06, .06, .065), 3, 8))
M['curb'] = proc('curb', .8, 0, lambda nt: noisecol(nt, (.12, .12, .12), (.2, .2, .2), 8))
M['leather'] = proc('leather', .45, 0, lambda nt: noisecol(nt, (.09, .03, .02), (.16, .06, .035), 30))
M['green'] = proc('greenLeather', .5, 0, lambda nt: noisecol(nt, (.02, .07, .04), (.04, .12, .07), 25))
M['brass'] = mat('brass', (.75, .52, .25), .28, 1)
M['chrome'] = mat('chrome', (.8, .8, .8), .15, 1)
M['iron'] = mat('iron', (.03, .03, .035), .4, .8)
M['black'] = mat('blackPaint', (.02, .02, .022), .3)
M['shade'] = mat('lampShade', (.02, .25, .1), .12, 0)
M['paper'] = proc('paper', .9, 0, lambda nt: noisecol(nt, (.62, .57, .47), (.72, .67, .56), 40))
M['manila'] = proc('manila', .85, 0, lambda nt: noisecol(nt, (.42, .29, .13), (.5, .36, .17), 30))
M['cork'] = proc('cork', .95, 0, lambda nt: noisecol(nt, (.3, .18, .08), (.42, .27, .13), 120, 2))
M['red'] = mat('pinRed', (.5, .03, .03), .35)
M['clay'] = proc('kulhad', .95, 0, lambda nt: noisecol(nt, (.3, .09, .04), (.42, .15, .07), 50))
M['chai'] = mat('chai', (.45, .25, .12), .2)
M['hat'] = proc('felt', .9, 0, lambda nt: noisecol(nt, (.07, .05, .04), (.1, .075, .06), 200, 2))
M['cabinet'] = mat('cabinetPaint', (.07, .11, .09), .45, .3)
M['glass'] = mat('glass', (.1, .12, .14), .05)
M['slat'] = mat('slat', (.45, .42, .36), .55)
M['radiator'] = mat('radiator', (.18, .17, .15), .5, .5)
M['hydrant'] = mat('hydrant', (.35, .03, .02), .45, .2)
M['rubber'] = mat('rubber', (.02, .02, .02), .8)
books = [mat('book%d' % i, c, .7) for i, c in enumerate([(.25, .04, .03), (.05, .1, .2), (.08, .14, .06), (.35, .25, .1), (.1, .05, .1), (.4, .36, .3)])]

# ---------- geometry helpers ----------
objs = []
GROUP = {'cur':'ext'}
groups = {}
def reg(o):
    groups[o.name]=GROUP['cur']
def box(name, size, loc, m, bevel=.008, rot=(0, 0, 0), seg=2, parent_list=objs):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'ANGLE'
    o.data.materials.append(m); parent_list.append(o); reg(o); return o

def cyl(name, r, h, loc, m, verts=24, rot=(0, 0, 0), r2=None, bevel=.004):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = bevel; bv.segments = 2; bv.limit_method = 'ANGLE'
    o.data.materials.append(m); objs.append(o); reg(o); return o

def sph(name, r, loc, m, scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    o.data.materials.append(m); objs.append(o); reg(o); return o

def smooth(o):
    for p in o.data.polygons: p.use_smooth = True

# coordinate convention: Blender X right, Y into room (three -Z), Z up
# ================= STREET =================
box('street', (40, 30, .2), (0, -15, -.1), M['street'], 0)
box('sidewalk', (40, 3.2, .16), (0, -1.6, .08), M['curb'], .02)
box('curbEdge', (40, .25, .2), (0, -3.2, .06), M['curb'], .03)
for x in range(-19, 20, 2):
    box('swj', (.015, 3.18, .005), (x, -1.6, .162), M['street'], 0)
# facade with door opening (x -0.6..0.6, z 0..2.35)
box('facadeL', (7.4, .35, 6.5), (-4.3, -.175, 3.25), M['brick'], .01)
box('facadeR', (7.4, .35, 6.5), (4.3, -.175, 3.25), M['brick'], .01)
box('facadeT', (1.2, .35, 4.15), (0, -.175, 4.425), M['brick'], .01)
for x in (-.66, .66):
    box('doorFrame', (.12, .42, 2.45), (x, -.175, 1.225), M['woodDark'], .01)
box('doorHead', (1.44, .42, .14), (0, -.175, 2.42), M['woodDark'], .01)
box('stepStone', (1.6, .5, .08), (0, -.55, .2), M['curb'], .015)
box('lintel', (2.0, .45, .18), (0, -.2, 2.62), M['curb'], .02)
# windows on facade
for x in (-3.6, -5.6, 3.4, 5.6):
    box('winSill', (1.25, .22, .08), (x, -.4, 2.7), M['curb'], .015)
    box('winFrame', (1.15, .06, 1.45), (x, -.33, 3.45), M['woodDark'], .01)
    box('winGlass', (1.0, .02, 1.3), (x, -.3, 3.45), M['glass'], 0)
# street lamp
cyl('lampPole', .07, 4.2, (2.6, -2.4, 2.1), M['iron'], 16, r2=.05)
cyl('lampBase', .16, .5, (2.6, -2.4, .25), M['iron'], 16, r2=.09)
box('lampArm', (.75, .06, .06), (2.28, -2.4, 4.1), M['iron'], .01)
cyl('lampHood', .26, .25, (1.92, -2.4, 3.98), M['iron'], 20, r2=.06)
hyd = cyl('hydrant', .14, .55, (-2.3, -2.6, .44), M['hydrant'], 16)
sph('hydTop', .145, (-2.3, -2.6, .72), M['hydrant'], (1, 1, .7))
cyl('hydNoz', .06, .36, (-2.3, -2.6, .55), M['hydrant'], 12, rot=(0, math.pi / 2, 0))
cyl('bin', .26, .8, (3.6, -1.0, .56), M['iron'], 20, r2=.3)
# neon sign backing + bracket
box('neonBack', (2.9, .06, .8), (0, -.4, 3.15), M['black'], .02)

# ================= OFFICE =================
GROUP['cur']='room'
# floor & ceiling
box('floor', (8, 7.5, .1), (0, 3.75, -.05), M['floor'], 0)
box('ceiling', (8, 7.5, .1), (0, 3.75, 3.45), M['ceil'], 0)
# walls: back y=7.5, right x=4, left x=-4 with window (y 3.8..5.8, z 1.05..2.55), front y=0 with door gap
box('wallBack', (8, .12, 3.4), (0, 7.56, 1.7), M['wall'], 0)
box('wallRight', (.12, 7.5, 3.4), (4.06, 3.75, 1.7), M['wall'], 0)
box('wallLeftA', (.12, 3.8, 3.4), (-4.06, 1.9, 1.7), M['wall'], 0)
box('wallLeftB', (.12, 1.7, 3.4), (-4.06, 6.65, 1.7), M['wall'], 0)
box('wallLeftLow', (.12, 2.0, 1.05), (-4.06, 4.8, .525), M['wall'], 0)
box('wallLeftHigh', (.12, 2.0, .85), (-4.06, 4.8, 2.975), M['wall'], 0)
box('wallFrontL', (3.4, .12, 3.4), (-2.3, -.06, 1.7), M['wall'], 0)
box('wallFrontR', (3.4, .12, 3.4), (2.3, -.06, 1.7), M['wall'], 0)
box('wallFrontT', (1.2, .12, .98), (0, -.06, 2.89), M['wall'], 0)
# wainscot panels + rails
for (nm, sz, loc) in [('wsB', (8, .03, 1.0), (0, 7.485, .5)), ('wsR', (.03, 7.5, 1.0), (3.985, 3.75, .5)), ('wsL1', (.03, 3.8, 1.0), (-3.985, 1.9, .5)), ('wsL2', (.03, 1.7, 1.0), (-3.985, 6.65, .5))]:
    box(nm, sz, loc, M['wallLow'], .005)
for (nm, sz, loc) in [('railB', (8, .06, .05), (0, 7.46, 1.02)), ('railR', (.06, 7.5, .05), (3.96, 3.75, 1.02)), ('baseB', (8, .05, .14), (0, 7.47, .07)), ('baseR', (.05, 7.5, .14), (3.97, 3.75, .07)), ('crownB', (8, .08, .08), (0, 7.46, 3.36)), ('crownR', (.08, 7.5, .08), (3.96, 3.75, 3.36)), ('crownL', (.08, 7.5, .08), (-3.96, 3.75, 3.36))]:
    box(nm, sz, loc, M['woodDark'], .01)
# window frame, sill, blinds
box('winSillIn', (.3, 2.2, .06), (-3.88, 4.8, 1.03), M['woodDark'], .01)
for y in (3.78, 5.82):
    box('winJamb', (.16, .06, 1.56), (-3.98, y, 1.8), M['woodDark'], .008)
box('winHead', (.16, 2.1, .06), (-3.98, 4.8, 2.57), M['woodDark'], .008)
box('winMullion', (.06, .05, 1.5), (-4.06, 4.8, 1.8), M['woodDark'], .005)
box('winMullionH', (.06, 2.0, .05), (-4.06, 4.8, 1.8), M['woodDark'], .005)
box('blindRail', (.1, 2.06, .06), (-3.9, 4.8, 2.5), M['slat'], .01)
for i in range(13):
    box('slat', (.07, 1.98, .006), (-3.88, 4.8, 1.12 + i * .105), M['slat'], 0, rot=(0, .5, 0))
for y in (4.2, 5.4):
    box('ladder', (.004, .004, 1.4), (-3.86, y, 1.8), M['slat'], 0)
# radiator under window
for i in range(10):
    box('radFin', (.12, .05, .6), (-3.85, 4.08 + i * .15, .5), M['radiator'], .02)
box('radPipe', (.05, 1.5, .05), (-3.85, 4.75, .2), M['radiator'], .01)

GROUP['cur']='props'
# ---- desk (center y=4.6, top z=.8, width x 2.6, depth y 1.15)
DY = 4.6
box('deskTop', (2.6, 1.15, .07), (0, DY, .785), M['wood'], .012)
box('deskInlay', (2.2, .85, .006), (0, DY, .823), M['green'], 0)
for x in (-.92, .92):
    box('pedestal', (.72, 1.05, .74), (x, DY, .38), M['wood'], .01)
    box('plinth', (.74, 1.07, .06), (x, DY, .03), M['woodDark'], .01)
    for k, z in enumerate((.18, .43, .64)):
        h = .2 if k < 2 else .14
        box('drawer', (.64, .02, h), (x, DY - .53, z), M['wood'], .008)
        box('handle', (.14, .03, .02), (x, DY - .555, z + .02), M['brass'], .006)
box('modesty', (1.1, .03, .5), (0, DY + .5, .52), M['wood'], .008)
box('centerDrawer', (1.06, .02, .1), (0, DY - .53, .7), M['wood'], .006)
box('cdHandle', (.12, .03, .02), (0, DY - .55, .7), M['brass'], .005)
# banker's lamp at (0.85, DY+0.15)
LX, LY = .85, DY + .15
cyl('lampBaseB', .11, .03, (LX, LY, .84), M['brass'], 32, r2=.09)
cyl('lampStem', .012, .32, (LX, LY, 1.0), M['brass'], 12)
box('lampYoke', (.36, .012, .012), (LX, LY - .02, 1.16), M['brass'], .003)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=.18, depth=.38, location=(LX, LY - .05, 1.21), rotation=(0, math.pi / 2, 0))
sh = bpy.context.object; sh.name = 'lampShadeGlass'
bm = bmesh.new(); bm.from_mesh(sh.data)
for v in bm.verts:
    if v.co.z < -0.0:  # keep upper half (local z after rotation is world x... handled via world below)
        pass
bm.free()
# cut lower half: delete verts with world z < 1.2
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
for v in sh.data.vertices:
    v.select = (sh.matrix_world @ v.co).z < 1.205
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='VERT'); bpy.ops.object.mode_set(mode='OBJECT')
sh.scale = (1, 1, .75); bpy.ops.object.transform_apply(scale=True)
sol = sh.modifiers.new('s', 'SOLIDIFY'); sol.thickness = .006
smooth(sh); sh.data.materials.append(M['shade']); objs.append(sh); reg(sh)
lampShade = sh
# typewriter: detailed live model (separate object; casts shadows into the bake, exported on its own)
import sys; sys.path.insert(0, OUT); import typewriter_model
TW = typewriter_model.build(.1, DY + .05, .826)
# (desk papers and the phone are now live props in the game)
k = cyl('kulhad', .045, .09, (.62, DY - .3, .875), M['clay'], 24, r2=.035)
cyl('chaiSurface', .038, .004, (.62, DY - .3, .915), M['chai'], 24, bevel=0)

# ---- chair
CY = 5.45
box('chairSeat', (.62, .6, .12), (0, CY, .55), M['leather'], .05, seg=4)
box('chairBack', (.62, .12, .85), (0, CY + .32, 1.05), M['leather'], .05, seg=4, rot=(-.12, 0, 0))
for s in (-1, 1):
    box('chairArm', (.08, .5, .06), (s * .36, CY, .78), M['woodDark'], .02)
    box('chairArmPost', (.05, .05, .22), (s * .36, CY - .18, .67), M['woodDark'], .01)
cyl('chairPost', .035, .4, (0, CY, .28), M['chrome'], 12)
for a in range(5):
    ang = a * 2 * math.pi / 5
    box('chairLeg', (.34, .05, .03), (math.cos(ang) * .17, CY + math.sin(ang) * .17, .07), M['chrome'], .01, rot=(0, 0, ang))

# ---- evidence board on back wall
box('corkFrame', (2.5, .05, 1.5), (1.6, 7.47, 2.05), M['woodDark'], .01)
box('cork', (2.36, .03, 1.36), (1.6, 7.44, 2.05), M['cork'], 0)
pins = []
for (x, z, w, h, m) in [(.75, 2.4, .32, .24, M['paper']), (1.45, 2.5, .28, .34, M['paper']), (2.3, 2.38, .34, .26, M['manila']), (1.05, 1.75, .3, .22, M['paper']), (2.0, 1.72, .26, .32, M['paper']), (1.6, 2.08, .22, .16, M['manila']), (2.6, 1.95, .2, .26, M['paper'])]:
    box('evidence', (w, .004, h), (x, 7.42, z), m, 0, rot=(0, random.uniform(-.12, .12), 0))
    sph('pin', .016, (x, 7.4, z + h / 2 - .03), M['red'], seg=12); pins.append((x, z + h / 2 - .03))
# ---- filing cabinet back-left
for k in range(3):
    pass
box('cabinet', (.62, .6, 1.32), (-2.9, 7.1, .66), M['cabinet'], .015)
for k in range(3):
    box('cabDrawer', (.56, .02, .38), (-2.9, 6.79, .26 + k * .42), M['cabinet'], .01)
    box('cabHandle', (.18, .03, .03), (-2.9, 6.77, .36 + k * .42), M['chrome'], .008)
    box('cabLabel', (.1, .01, .05), (-2.9, 6.775, .3 + k * .42), M['paper'], 0)
box('cabTopFiles', (.4, .3, .1), (-2.95, 7.1, 1.37), M['manila'], .005, rot=(0, 0, .2))
# ---- bookshelf right wall
SX = 3.82
box('shelfSideA', (.32, .04, 2.0), (SX, 2.4, 1.0), M['woodDark'], .006)
box('shelfSideB', (.32, .04, 2.0), (SX, 3.6, 1.0), M['woodDark'], .006)
for z in (.05, .55, 1.05, 1.55, 1.98):
    box('shelf', (.32, 1.2, .03), (SX, 3.0, z), M['woodDark'], .005)
for z in (.07, .57, 1.07, 1.57):
    y = 2.45
    while y < 3.52:
        w = random.uniform(.03, .07); h = random.uniform(.24, .4)
        if random.random() < .1:
            y += .1; continue
        tilt = random.uniform(-.06, .06) if random.random() < .2 else 0
        box('book', (random.uniform(.18, .24), w, h), (SX + .02, y + w / 2, z + h / 2), random.choice(books), .004, rot=(tilt, 0, 0))
        y += w + .004
# ---- coat rack with hat near door (right front)
RX, RY = 3.3, .7
cyl('rackPole', .025, 1.9, (RX, RY, .95), M['woodDark'], 12)
cyl('rackFoot', .22, .04, (RX, RY, .02), M['woodDark'], 24, r2=.18)
for a in range(4):
    ang = a * math.pi / 2 + .4
    box('rackHook', (.16, .02, .02), (RX + math.cos(ang) * .08, RY + math.sin(ang) * .08, 1.82), M['woodDark'], .006, rot=(0, -.5, ang))
# fedora hanging on the rack
cyl('hatBrim', .24, .015, (RX + .13, RY - .02, 1.7), M['hat'], 40, rot=(.15, -1.2, 0), bevel=.006)
cyl('hatCrown', .145, .16, (RX + .2, RY - .02, 1.72), M['hat'], 32, rot=(.15, -1.2, 0), r2=.12, bevel=.02)
cyl('hatBand', .148, .035, (RX + .155, RY - .02, 1.705), M['black'], 32, rot=(.15, -1.2, 0), bevel=0)
cyl('umbrella', .025, .9, (RX + .15, RY + .1, .45), M['black'], 10, rot=(0, .1, 0))
# ---- wall clock & diploma
cyl('clockRim', .2, .05, (-1.6, 7.47, 2.55), M['woodDark'], 40, rot=(math.pi / 2, 0, 0))
cyl('clockFace', .17, .01, (-1.6, 7.44, 2.55), M['paper'], 40, rot=(math.pi / 2, 0, 0), bevel=0)
box('diplomaFrame', (.5, .03, .38), (-1.6, 7.47, 1.85), M['woodDark'], .006)
box('diploma', (.42, .01, .3), (-1.6, 7.45, 1.85), M['paper'], 0)
# ---- pendant light (off)
cyl('pendantCord', .006, .5, (0, 3.2, 3.15), M['black'], 8, bevel=0)
cyl('pendant', .3, .22, (0, 3.2, 2.8), M['iron'], 32, r2=.06)
# ---- rug
box('rug', (2.6, 1.8, .012), (0, 3.4, .006), M['leather'], .004)


# ---- neon (emissive, not baked)
emis = []
def neon_text(txt, size, loc, col, strength):
    bpy.ops.object.text_add(location=loc, rotation=(math.pi/2, 0, 0))
    t = bpy.context.object; t.data.body = txt; t.data.size = size; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    t.data.extrude = .01; t.data.bevel_depth = .008; t.data.bevel_resolution = 2
    bpy.ops.object.convert(target='MESH')
    m = mat('neon_'+txt[:4], col, .3, 0, col, strength); t.data.materials.append(m); emis.append(t); return t
neon_text('DETECTIVE', .42, (0, -.45, 3.25), (1, .25, .5), 25)
neon_text('OPEN ALL NIGHT', .14, (0, -.45, 2.92), (1, .7, .3), 18)

# ============ apply modifiers, uv, join ============

for o in objs:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH')
for o in objs + emis:
    for p in o.data.polygons: p.use_smooth = True
members = {g: [o for o in objs if groups[o.name] == g] for g in ('ext','room','props')}
for g in ('ext', 'room', 'props'):
    bpy.ops.object.select_all(action='DESELECT')
    mem = members[g]
    for o in mem: o.select_set(True)
    bpy.context.view_layer.objects.active = mem[0]
    bpy.ops.object.join(); ob = bpy.context.object; ob.name = g
    try: bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    except Exception as e: print('autosmooth', e)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.003)
    bpy.ops.uv.pack_islands(margin=.003)
    bpy.ops.object.mode_set(mode='OBJECT')
    print(g, 'faces', len(ob.data.polygons))
bpy.ops.object.select_all(action='DESELECT')
for o in emis: o.select_set(True)
bpy.context.view_layer.objects.active = emis[0]; bpy.ops.object.join(); bpy.context.object.name = 'neon'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'office.blend'))
