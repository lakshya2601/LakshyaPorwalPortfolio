import bpy, sys, os, time
import numpy as np
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
import lights
args = sys.argv[sys.argv.index('--') + 1:]
group, kind, res, samples = args[0], args[1], int(args[2]), int(args[3])  # kind: albedo | on | off
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'office.blend'))
lights.setup(lamp_on=(kind == 'on'))
S = bpy.context.scene
S.render.engine = 'CYCLES'; S.cycles.device = 'CPU'; S.cycles.samples = samples
S.cycles.sample_clamp_indirect = 1.5; S.cycles.sample_clamp_direct = 0
ob = bpy.data.objects[group]
img = bpy.data.images.new(f'{group}_{kind}', res, res, float_buffer=(kind != 'albedo'))
for m in ob.data.materials:
    nt = m.node_tree
    b = nt.nodes.get('Principled BSDF')
    if b and kind != 'albedo':
        b.inputs['Metallic'].default_value = 0.0
    if b and kind == 'albedo' and m.get('metal', 0) > .5:
        pass
    n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; nt.nodes.active = n
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
bk = S.render.bake; bk.margin = 8 if kind == 'albedo' else 6
t = time.time()
if kind == 'albedo':
    bk.use_pass_direct = False; bk.use_pass_indirect = False; bk.use_pass_color = True
else:
    bk.use_pass_direct = True; bk.use_pass_indirect = True; bk.use_pass_color = False
bpy.ops.object.bake(type='DIFFUSE', use_clear=True)
print('baked', group, kind, round(time.time() - t), 's')
px = np.array(img.pixels[:], dtype=np.float32).reshape(res, res, 4)
if kind == 'albedo':
    out = px
else:
    rgb = px[..., :3]; msk = (px[..., 3:4] > .5).astype(np.float32)
    k = int(args[4]) if len(args) > 4 else 2
    def blur(a):
        pad = np.pad(a, ((k, k), (k, k), (0, 0)), mode='edge'); acc = np.zeros_like(a)
        for dy in range(-k, k + 1):
            for dx in range(-k, k + 1):
                acc += pad[k + dy:k + dy + res, k + dx:k + dx + res]
        return acc
    for _ in range(2):
        rgb = blur(rgb * msk) / np.maximum(blur(msk), 1e-4)
    MAXV = 8.0
    enc = np.clip(rgb / MAXV, 0, 1) ** (1 / 2.2)
    out = np.concatenate([enc, np.ones((res, res, 1), np.float32)], -1)
    print('max', float(rgb.max()), 'p99', float(np.percentile(rgb, 99)))
o = bpy.data.images.new('o', res, res, alpha=False)
if kind != 'albedo':
    o.colorspace_settings.name = 'Non-Color'
    np.save(os.path.join(D, 'out', f'{group}_{kind}.npy'), px[..., :3].astype(np.float16))
o.pixels.foreach_set(out.ravel())
o.update()
o.filepath_raw = os.path.join(D, 'out', f'{group}_{kind}.png'); o.file_format = 'PNG'; o.save()
print('saved', o.filepath_raw)
