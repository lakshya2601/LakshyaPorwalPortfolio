import sys; sys.argv=['x']
exec(open('/home/claude/det/props/textures.py').read().split('# ----------------------------------------------------------------')[0])
W, H = 800, 1000
im = paper(W, H, (244, 240, 228), 6, True, .12).convert('RGBA')
typed(im, (70, 90), 'CASE: R. MEHRA (MISSING)', 30, (25, 22, 20))
typed(im, (70, 150), 'Reported by: Mrs. Asha Mehra\nTime taken: 11:47 PM (watch)\nLast ping: Chhoti Gwaltoli\n\nRansom call 2:15 AM.\nBackground: train, rain on\ntin, chai seller.\n\nGodown line - 1987 .. .. 60', 26, (30, 26, 22), 1.55)
im.convert('RGB').save('/home/claude/det/blend/tw_paper.png')
print('ok')
