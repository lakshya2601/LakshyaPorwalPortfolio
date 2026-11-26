# Detailed 1950s-style manual typewriter, built in office coordinates.
# Blender: X right, Y into the room (front of the machine faces -Y, toward the viewer), Z up.
import bpy, bmesh, math, os
from mathutils import Vector

D = os.path.dirname(os.path.abspath(__file__))


def _mat(name, col, rough, metal=0., coat=0., tex=None, emit=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat:
        b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = .06
    if tex:
        n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(tex)
        m.node_tree.links.new(n.outputs['Color'], b.inputs['Base Color'])
    return m


def build(TX, TY, Z0):
    MT = {
        'enamel': _mat('tw_enamel', (.012, .012, .014), .3, 0, 1),
        'chrome': _mat('tw_chrome', (.92, .92, .9), .14, 1),
        'steel': _mat('tw_steel', (.55, .54, .5), .32, 1),
        'rubber': _mat('tw_rubber', (.018, .018, .018), .75),
        'keytop': _mat('tw_keytop', (.01, .01, .012), .12, 0, 1),
        'letter': _mat('tw_letter', (.85, .83, .78), .4),
        'ribbon': _mat('tw_ribbon', (.32, .03, .025), .85),
        'gold': _mat('tw_gold', (1., .72, .32), .3, 1),
        'felt': _mat('tw_felt', (.04, .035, .03), .95),
        'paper': _mat('tw_paper', (1, 1, 1), .85, tex=os.path.join(D, 'tw_paper.png')),
    }
    made = []

    def done(o, m, smooth=False):
        o.name = 'tw_part'; o.data.materials.clear(); o.data.materials.append(MT[m])
        if smooth:
            for p in o.data.polygons: p.use_smooth = True
        made.append(o); return o

    def L(x, y, z): return (TX + x, TY + y, Z0 + z)

    def box(size, loc, m, rot=(0, 0, 0), bevel=0, seg=2):
        bpy.ops.mesh.primitive_cube_add(size=1, location=L(*loc), rotation=rot)
        o = bpy.context.object; o.scale = size; bpy.ops.object.transform_apply(scale=True)
        if bevel:
            b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = seg; b.limit_method = 'ANGLE'
        return done(o, m)

    def cyl(r, h, loc, m, rot=(0, 0, 0), v=24, r2=None, bevel=0):
        if r2 is None:
            bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=L(*loc), rotation=rot)
        else:
            bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=L(*loc), rotation=rot)
        o = bpy.context.object
        if bevel:
            b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = 2; b.limit_method = 'ANGLE'
        return done(o, m, True)

    def extrude_profile(pts, x0, x1, m, bevel=.01, seg=4):
        me = bpy.data.meshes.new('tw_shell'); bm = bmesh.new()
        a = [bm.verts.new((TX + x0, TY + y, Z0 + z)) for y, z in pts]
        b = [bm.verts.new((TX + x1, TY + y, Z0 + z)) for y, z in pts]
        bm.faces.new(a[::-1]); bm.faces.new(b)
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n; bm.faces.new((a[i], a[j], b[j], b[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new('tw_shell', me); bpy.context.collection.objects.link(o)
        bv = o.modifiers.new('b', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'ANGLE'
        return done(o, m)

    F = .012  # feet height
    # ---- feet
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(.016, F, (sx * .18, sy * .14 + .005, F / 2), 'rubber')
    # ---- main body: side profile (y, z), sloping keyboard deck at the front
    P = [(-.175, F), (.165, F), (.165, F + .1), (.125, F + .128), (-.025, F + .118), (-.165, F + .046), (-.182, F + .02)]
    extrude_profile(P, -.205, .205, 'enamel', .012)
    # side cheeks, slightly proud, with a rounded top
    for sx in (-1, 1):
        extrude_profile([(-.17, F), (.17, F), (.17, F + .112), (.12, F + .142), (-.02, F + .132), (-.16, F + .055), (-.176, F + .022)],
                        sx * .205 - .009, sx * .205 + .009, 'enamel', .008)
    # front nameplate + gold brand
    box((.30, .004, .026), (0, -.181, F + .02), 'enamel', rot=(-.35, 0, 0))
    bpy.ops.object.text_add(location=L(0, -.184, F + .02), rotation=(math.pi / 2 - .35, 0, 0))
    t = bpy.context.object; t.data.body = 'K A V E R I'; t.data.size = .016; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    t.data.extrude = .0006; bpy.ops.object.convert(target='MESH'); done(t, 'gold')

    # ---- keyboard: 4 stepped rows of round glass keys on chrome levers
    rows = ['ZXCVBNM,.?', 'ASDFGHJKL;', 'QWERTYUIOP', '234567890-']
    slope = lambda y: F + .046 + (y + .165) * (.072 / .14)
    for r, keys in enumerate(rows):
        y = -.158 + r * .03
        zt = slope(y) + .03 + r * .004
        for c, ch in enumerate(keys):
            x = -.162 + c * .036 + r * .009
            # lever from the key down into the body
            lev = box((.004, .05, .003), (x, y + .025, zt - .016), 'steel', rot=(-.62, 0, 0))
            cyl(.0125, .006, (x, y, zt - .002), 'chrome', v=20)
            cyl(.0108, .005, (x, y, zt + .002), 'keytop', v=20)
            bpy.ops.object.text_add(location=L(x, y, zt + .0047))
            t = bpy.context.object; t.data.body = ch; t.data.size = .011; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
            bpy.ops.object.convert(target='MESH'); done(t, 'letter')
    # shift keys + tab
    for sx, yk in ((-1, -.158), (1, -.158)):
        cyl(.0135, .006, (sx * .2, yk, slope(yk) + .028), 'chrome', v=20)
        cyl(.0118, .005, (sx * .2, yk, slope(yk) + .032), 'keytop', v=20)
    # space bar on two arms
    box((.24, .012, .007), (0, -.19, F + .036), 'chrome', bevel=.003)
    for sx in (-1, 1):
        box((.005, .05, .004), (sx * .1, -.168, F + .04), 'steel', rot=(-.35, 0, 0))

    # ---- type basket: the fan of typebars seen through the top
    cy, cz = .055, F + .121
    box((.33, .14, .004), (0, .055, F + .117), 'felt')
    for i in range(38):
        a = math.radians(196 + i * (148 / 37))
        r0, r1 = .035, .118
        p0 = Vector((math.cos(a) * r0, cy + math.sin(a) * r0)); p1 = Vector((math.cos(a) * r1, cy + math.sin(a) * r1))
        mid = (p0 + p1) / 2; ln = (p1 - p0).length
        box((.0028, ln, .0025), (mid.x, mid.y, cz + .002), 'steel', rot=(0, 0, a - math.pi / 2))
    # segment (the curved guide the bars strike through)
    bpy.ops.mesh.primitive_torus_add(major_radius=.034, minor_radius=.004, location=L(0, cy, cz + .006))
    done(bpy.context.object, 'chrome', True)
    # top cover bridge in front of the basket
    box((.36, .03, .01), (0, -.03, F + .121), 'enamel', rot=(-.4, 0, 0), bevel=.004)
    # ribbon spools
    for sx in (-1, 1):
        cyl(.036, .014, (sx * .148, .075, F + .13), 'chrome', v=32, bevel=.002)
        cyl(.03, .012, (sx * .148, .075, F + .135), 'ribbon', v=32)
        cyl(.008, .016, (sx * .148, .075, F + .14), 'chrome', v=12)
    # ribbon strip across the printing point
    box((.27, .001, .009), (0, .108, F + .158), 'ribbon')

    # ---- carriage
    PY, PZ = .128, F + .175
    cyl(.036, .44, (0, PY, PZ), 'rubber', rot=(0, math.pi / 2, 0), v=40)
    for sx in (-1, 1):
        cyl(.03, .028, (sx * .24, PY, PZ), 'enamel', rot=(0, math.pi / 2, 0), v=32, bevel=.004)
        cyl(.012, .02, (sx * .222, PY, PZ), 'chrome', rot=(0, math.pi / 2, 0), v=16)
        box((.012, .09, .07), (sx * .214, PY + .005, PZ - .03), 'enamel', bevel=.004)
    box((.52, .014, .012), (0, .168, F + .132), 'chrome', bevel=.003)  # carriage rail
    box((.52, .012, .01), (0, .088, F + .136), 'chrome', bevel=.003)
    cyl(.0032, .4, (0, PY - .036, PZ + .03), 'chrome', rot=(0, math.pi / 2, 0), v=10)  # paper bail
    for sx in (-1, 1):
        cyl(.008, .014, (sx * .06, PY - .036, PZ + .03), 'rubber', rot=(0, math.pi / 2, 0), v=16)
    # paper table behind the platen
    box((.34, .004, .13), (0, PY + .07, PZ + .07), 'enamel', rot=(-.55, 0, 0), bevel=.002)
    # carriage return lever (left)
    box((.006, .07, .006), (-.26, PY - .045, PZ + .035), 'chrome', rot=(.35, 0, .45))
    cyl(.009, .02, (-.283, PY - .08, PZ + .048), 'chrome', rot=(0, math.pi / 2, .45), v=16)

    # ---- the sheet of paper rising from the platen, leaning back
    bpy.ops.mesh.primitive_plane_add(size=1, location=L(0, PY + .01, PZ + .15), rotation=(math.pi / 2 - .32, 0, 0))
    pp = bpy.context.object; pp.scale = (.2, .25, 1); bpy.ops.object.transform_apply(scale=True)
    done(pp, 'paper')
    return made
