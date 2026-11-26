"""Wristwatch (stopped 11:47, cracked) and Asha's phone (call recording) -> GLB."""
import bpy, math, os, random, sys
sys.path.insert(0, '/home/claude/det/props')
from PIL import Image, ImageDraw, ImageFont, ImageFilter
F = '/home/claude/det/fonts/'; T = '/home/claude/det/props/tex/'; G = '/home/claude/det/props/glb/'
f = lambda n, s: ImageFont.truetype(F + n, s)
random.seed(3)
# ---------- textures ----------
D = 1024; im = Image.new('RGB', (D, D), (232, 224, 204)); d = ImageDraw.Draw(im); c = D / 2
for i in range(60):
    a = math.radians(i * 6); r1 = c * .9; r2 = c * (.8 if i % 5 == 0 else .86); w = 10 if i % 5 == 0 else 3
    d.line([(c + math.sin(a) * r1, c - math.cos(a) * r1), (c + math.sin(a) * r2, c - math.cos(a) * r2)], fill=(40, 34, 28), width=w)
for h in range(1, 13):
    a = math.radians(h * 30); r = c * .66
    d.text((c + math.sin(a) * r, c - math.cos(a) * r), str(h), font=f('oswald-latin-400-normal.ttf', 78), fill=(35, 30, 25), anchor='mm')
d.text((c, c * .55), 'SAMAY', font=f('oswald-latin-700-normal.ttf', 64), fill=(35, 30, 25), anchor='mm')
d.text((c, c * .68), 'AUTOMATIC · 17 JEWELS', font=f('courier-prime-latin-400-normal.ttf', 28), fill=(80, 70, 60), anchor='mm')
d.text((c, c * 1.5), 'MADE IN INDIA', font=f('courier-prime-latin-400-normal.ttf', 26), fill=(80, 70, 60), anchor='mm')
im = im.filter(ImageFilter.GaussianBlur(.6)); im.save(T + 'watch_dial.png')
# crack overlay (alpha)
cr = Image.new('RGBA', (D, D), (0, 0, 0, 0)); cd = ImageDraw.Draw(cr); ox, oy = D * .62, D * .3
for k in range(9):
    x, y = ox, oy; a = random.uniform(0, 6.28)
    for s in range(14):
        a += random.uniform(-.5, .5); nx, ny = x + math.cos(a) * random.uniform(20, 60), y + math.sin(a) * random.uniform(20, 60)
        cd.line([(x, y), (nx, ny)], fill=(255, 255, 255, 230), width=3); x, y = nx, ny
for r in (40, 75, 120): cd.ellipse([ox - r, oy - r, ox + r, oy + r], outline=(255, 255, 255, 120), width=2)
cr.save(T + 'watch_crack.png')
# Asha's phone screen: call recording
W, H = 1080, 2340; sc = Image.new('RGB', (W, H), (16, 18, 22)); d = ImageDraw.Draw(sc)
S = lambda s, b=False: f('noto-sans-devanagari-latin-700-normal.ttf' if b else 'noto-sans-devanagari-latin-400-normal.ttf', s)
d.text((60, 40), '2:41', font=S(44, True), fill=(235, 235, 235)); d.text((W - 230, 40), '◢ 34%', font=S(40), fill=(235, 235, 235))
d.text((80, 220), 'Call recordings', font=S(66, True), fill=(240, 240, 240))
d.rounded_rectangle([60, 360, W - 60, 1300], 40, fill=(32, 35, 42))
d.ellipse([110, 420, 250, 560], fill=(90, 60, 60)); d.text((180, 490), '?', font=S(80, True), fill=(240, 230, 230), anchor='mm')
d.text((290, 430), 'Unknown number', font=S(56, True), fill=(245, 245, 245)); d.text((290, 505), 'Incoming · Today, 2:15 AM', font=S(38), fill=(170, 175, 185))
random.seed(9)
for i in range(70):
    x = 110 + i * 12.5; hgt = (abs(math.sin(i * .37)) * .6 + random.random() * .4) * 200 * (1 if 10 < i < 64 else .3)
    d.rounded_rectangle([x, 800 - hgt / 2, x + 7, 800 + hgt / 2], 3, fill=(242, 165, 65) if i < 26 else (110, 115, 125))
d.text((110, 960), '0:15', font=S(36), fill=(200, 200, 205)); d.text((W - 200, 960), '0:42', font=S(36), fill=(200, 200, 205))
d.ellipse([W / 2 - 90, 1060, W / 2 + 90, 1240], fill=(242, 165, 65)); d.polygon([(W / 2 - 25, 1110), (W / 2 - 25, 1190), (W / 2 + 40, 1150)], fill=(20, 20, 24))
for j, (t, s2) in enumerate([('Asha - Mummy', 'Outgoing · Yesterday, 9:28 PM · 1:12'), ('Rakesh', 'Incoming · Yesterday, 11:41 PM · 0:09'), ('Indore Evening Post', 'Outgoing · Yesterday, 10:05 PM · 3:40')]):
    y = 1400 + j * 230; d.ellipse([80, y, 200, y + 120], fill=(55, 60, 70)); d.text((240, y + 8), t, font=S(48, True), fill=(230, 230, 230)); d.text((240, y + 72), s2, font=S(34), fill=(160, 165, 175))
d.rounded_rectangle([W / 2 - 140, H - 50, W / 2 + 140, H - 38], 6, fill=(120, 120, 125))
sc.save(T + 'phone_screen.png')

# ---------- blender ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(n, col, r=.4, m=0, tex=None, alpha=False, emit=None):
    M = bpy.data.materials.new(n); M.use_nodes = True; b = M.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = r; b.inputs['Metallic'].default_value = m
    if tex:
        t = M.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex); M.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if alpha: M.node_tree.links.new(t.outputs['Alpha'], b.inputs['Alpha']); M.blend_method = 'BLEND'
        if emit: M.node_tree.links.new(t.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = emit
    return M
def obj_done(o, M, smooth=True):
    o.data.materials.append(M)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    return o
STEEL = mat('steel', (.8, .8, .82), .22, 1); LEATHER = mat('leather', (.18, .09, .04), .6)
DIAL = mat('dial', (1, 1, 1), .5, 0, T + 'watch_dial.png'); CRACK = mat('crack', (1, 1, 1), .05, 0, T + 'watch_crack.png', True)
HAND = mat('hands', (.06, .05, .04), .3, .6)
# watch (built at origin, lying flat, ~4 cm)
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=.02, depth=.009, location=(0, 0, .0045)); obj_done(bpy.context.object, STEEL)
bpy.ops.mesh.primitive_torus_add(major_radius=.02, minor_radius=.0022, location=(0, 0, .009)); obj_done(bpy.context.object, STEEL)
bpy.ops.mesh.primitive_circle_add(vertices=64, radius=.018, fill_type='NGON', location=(0, 0, .0092)); dial = bpy.context.object
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.uv.cube_project(cube_size=.036); bpy.ops.object.mode_set(mode='OBJECT'); obj_done(dial, DIAL, False)
for name, ang, L, w in (('hour', (11 + 47 / 60) * 30, .010, .0016), ('minute', 47 * 6, .015, .0011), ('second', 31 * 6, .016, .0004)):
    bpy.ops.mesh.primitive_cube_add(size=1); hnd = bpy.context.object; hnd.scale = (w, L, .0004); bpy.ops.object.transform_apply(scale=True)
    for v in hnd.data.vertices: v.co.y += L / 2 - .002
    hnd.location = (0, 0, .0096 + (.0003 if name == 'second' else 0)); hnd.rotation_euler.z = -math.radians(ang); obj_done(hnd, HAND, False)
bpy.ops.mesh.primitive_circle_add(vertices=64, radius=.0185, fill_type='NGON', location=(0, 0, .0102)); gl = bpy.context.object
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.uv.cube_project(cube_size=.037); bpy.ops.object.mode_set(mode='OBJECT'); obj_done(gl, CRACK, False)
bpy.ops.mesh.primitive_cylinder_add(radius=.0018, depth=.004, location=(.0215, 0, .0045), rotation=(0, math.pi / 2, 0)); obj_done(bpy.context.object, STEEL)
for s in (-1, 1):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, s * .045, .002)); st = bpy.context.object; st.scale = (.018, .05, .003); bpy.ops.object.transform_apply(scale=True)
    st.rotation_euler.x = s * .12; bv = st.modifiers.new('b', 'BEVEL'); bv.width = .0012; bv.segments = 2; obj_done(st, LEATHER)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=G + 'watch.glb', export_format='GLB', export_apply=True, use_selection=True)
bpy.ops.object.delete()
# Asha's phone (lying flat, screen up)
BODY = mat('phonebody', (.03, .03, .035), .35, .4); SCREEN = mat('screen', (1, 1, 1), .08, 0, T + 'phone_screen.png', False, 1.6)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, .004)); p = bpy.context.object; p.scale = (.075, .162, .008); bpy.ops.object.transform_apply(scale=True)
bv = p.modifiers.new('b', 'BEVEL'); bv.width = .008; bv.segments = 6; obj_done(p, BODY)
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, .00805)); sc = bpy.context.object; sc.scale = (.0705, .1545, 1); bpy.ops.object.transform_apply(scale=True); obj_done(sc, SCREEN, False)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=G + 'asha_phone.glb', export_format='GLB', export_apply=True, use_selection=True)
print('ok')
