"""Paper props for 'The Rain Doesn't Stop': map, story draft, notebook, cards, ticket, receipt, ID, jeeravan packet."""
import os, random, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
F = '/home/claude/det/fonts/'
OUT = '/home/claude/det/props/tex/'; os.makedirs(OUT, exist_ok=True)
random.seed(4); np.random.seed(4)
def font(n, s): return ImageFont.truetype(F + n, s)
TYPE = 'special-elite-latin-400-normal.ttf'; HAND = 'caveat-latin-400-normal.ttf'; HANDB = 'caveat-latin-700-normal.ttf'
MONO = 'courier-prime-latin-400-normal.ttf'; MONOB = 'courier-prime-latin-700-normal.ttf'
COND = 'oswald-latin-700-normal.ttf'; CONDR = 'oswald-latin-400-normal.ttf'
DEV = 'noto-sans-devanagari-devanagari-400-normal.ttf'; DEVB = 'noto-sans-devanagari-devanagari-700-normal.ttf'
SANS = 'noto-sans-devanagari-latin-400-normal.ttf'; SANSB = 'noto-sans-devanagari-latin-700-normal.ttf'

def paper(w, h, base=(238, 230, 210), grain=10, fibers=True, edge=.25):
    a = np.ones((h, w, 3), np.float32) * np.array(base, np.float32)
    n = np.random.normal(0, grain, (h // 2 + 1, w // 2 + 1)).astype(np.float32)
    n = np.array(Image.fromarray(n).resize((w, h), Image.BILINEAR))
    low = np.array(Image.fromarray(np.random.normal(0, 1, (8, 8)).astype(np.float32)).resize((w, h), Image.BICUBIC))
    a += n[..., None] * .6 + low[..., None] * 6
    yy, xx = np.mgrid[0:h, 0:w]; d = np.minimum.reduce([xx, yy, w - xx, h - yy]) / (min(w, h) * .5)
    a *= (1 - edge * np.clip(1 - d * 4, 0, 1) ** 2)[..., None]
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    if fibers:
        dr = ImageDraw.Draw(im, 'RGBA')
        for _ in range(int(w * h / 4000)):
            x, y = random.uniform(0, w), random.uniform(0, h); l = random.uniform(4, 14); t = random.uniform(0, 6.28)
            dr.line([(x, y), (x + math.cos(t) * l, y + math.sin(t) * l)], fill=(120, 100, 70, random.randint(10, 30)), width=1)
    return im

def ring(im, cx, cy, r, col=(110, 60, 25), a=60):
    o = Image.new('RGBA', im.size); d = ImageDraw.Draw(o)
    for i in range(6):
        d.ellipse([cx - r - i, cy - r - i, cx + r + i, cy + r + i], outline=(*col, max(0, a - i * 9)), width=2)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*col, 10))
    im.alpha_composite(o.filter(ImageFilter.GaussianBlur(1.2)))

def water(im, n=3, strength=55):
    o = Image.new('RGBA', im.size); d = ImageDraw.Draw(o); w, h = im.size
    for _ in range(n):
        cx, cy, r = random.uniform(0, w), random.uniform(0, h), random.uniform(w * .08, w * .25)
        pts = [(cx + math.cos(t) * r * random.uniform(.7, 1.1), cy + math.sin(t) * r * random.uniform(.7, 1.1)) for t in np.linspace(0, 6.28, 24)]
        d.polygon(pts, fill=(95, 80, 55, strength // 3), outline=(80, 60, 35, strength))
    im.alpha_composite(o.filter(ImageFilter.GaussianBlur(3)))

def fold(im, horizontal=True, at=.5):
    o = Image.new('RGBA', im.size); d = ImageDraw.Draw(o); w, h = im.size
    if horizontal:
        y = int(h * at); d.rectangle([0, y - 3, w, y], fill=(0, 0, 0, 28)); d.rectangle([0, y, w, y + 3], fill=(255, 255, 255, 30))
    else:
        x = int(w * at); d.rectangle([x - 3, 0, x, h], fill=(0, 0, 0, 28)); d.rectangle([x, 0, x + 3, h], fill=(255, 255, 255, 30))
    im.alpha_composite(o.filter(ImageFilter.GaussianBlur(1.5)))

def typed(im, xy, text, size=34, col=(30, 26, 22), lh=1.5, fnt=TYPE, width=None):
    """Typewriter text: per-character jitter and ink density."""
    d = ImageDraw.Draw(im); f = font(fnt, size); x0, y = xy
    for line in text.split('\n'):
        x = x0
        for ch in line:
            a = random.randint(170, 255) if ch.strip() else 0
            d.text((x, y + random.uniform(-1.2, 1.2)), ch, font=f, fill=(*col, a))
            x += f.getlength(ch)
        y += size * lh
    return y

def hand(im, xy, text, size=46, col=(28, 45, 120), rot=0, fnt=HAND, lh=1.15):
    w, h = im.size; o = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(o); f = font(fnt, size); x, y = xy
    for line in text.split('\n'):
        d.text((x, y), line, font=f, fill=(*col, 235)); y += size * lh
    if rot: o = o.rotate(rot, center=xy, resample=Image.BICUBIC)
    im.alpha_composite(o.filter(ImageFilter.GaussianBlur(.4)))

def stamp(im, xy, text, size=54, col=(160, 30, 28), rot=-12, box=True):
    f = font(COND, size); tw = f.getlength(text); o = Image.new('RGBA', (int(tw + 60), size + 50)); d = ImageDraw.Draw(o)
    if box: d.rectangle([4, 4, o.width - 5, o.height - 5], outline=(*col, 220), width=5)
    d.text((30, 16), text, font=f, fill=(*col, 220))
    m = Image.fromarray((np.random.rand(o.height, o.width) > .22).astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(.6))
    o.putalpha(ImageChops.multiply(o.getchannel('A'), m)); o = o.rotate(rot, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(o, (int(xy[0]), int(xy[1])))

def save(im, name, q=90):
    im.convert('RGB').save(OUT + name + '.jpg', quality=q); print(name, im.size)

# ---------------------------------------------------------------- Indore map
def indore_map():
    W, H = 2400, 1700; im = paper(W, H, (236, 228, 205), 9).convert('RGBA'); d = ImageDraw.Draw(im, 'RGBA')
    # city blocks texture
    for _ in range(900):
        x, y = random.uniform(80, W - 80), random.uniform(120, H - 80); s = random.uniform(14, 40)
        d.rectangle([x, y, x + s, y + s * random.uniform(.6, 1.4)], fill=(214, 200, 175, 80))
    # Khan river
    river = [(430, 80), (470, 300), (430, 520), (520, 760), (610, 980), (560, 1200), (650, 1450), (700, 1650)]
    d.line(river, fill=(150, 185, 205, 255), width=22, joint='curve'); d.line(river, fill=(120, 160, 190, 255), width=4, joint='curve')
    # parks / lakes
    d.ellipse([1880, 1260, 2120, 1420], fill=(160, 195, 150, 200)); d.ellipse([200, 1250, 380, 1380], fill=(150, 185, 205, 220))
    def road(pts, w=14, col=(250, 224, 160)):
        d.line(pts, fill=(150, 130, 100, 255), width=w + 4, joint='curve'); d.line(pts, fill=(*col, 255), width=w, joint='curve')
    # major roads (approximate real layout)
    road([(700, 900), (1000, 820), (1350, 760), (1700, 600), (2050, 420), (2350, 260)], 18)          # A.B. Road toward Vijay Nagar
    road([(700, 900), (760, 1150), (820, 1450), (880, 1680)], 16)                                         # south toward Bhanwarkuan
    road([(80, 980), (420, 930), (700, 900)], 16)                                                         # west to airport
    road([(700, 900), (900, 600), (1050, 300), (1150, 80)], 14)                                           # north
    road([(1000, 820), (1080, 1100), (1250, 1350), (1400, 1650)], 12)
    road([(1350, 760), (1600, 980), (1900, 1150), (2300, 1300)], 12)
    road([(300, 600), (700, 640), (1100, 560), (1500, 420), (1900, 360)], 10)
    for _ in range(70):
        x, y = random.uniform(100, W - 100), random.uniform(150, H - 100); a = random.uniform(0, 6.28); l = random.uniform(80, 260)
        d.line([(x, y), (x + math.cos(a) * l, y + math.sin(a) * l)], fill=(250, 240, 215, 255), width=5)
    # railway line (hatched)
    rail = [(150, 1500), (600, 1180), (1000, 1000), (1220, 900), (1500, 760), (1900, 560), (2350, 330)]
    d.line(rail, fill=(60, 55, 50, 255), width=7, joint='curve')
    for i in range(len(rail) - 1):
        (x1, y1), (x2, y2) = rail[i], rail[i + 1]; L = math.hypot(x2 - x1, y2 - y1); nx, ny = -(y2 - y1) / L, (x2 - x1) / L
        for t in np.arange(0, 1, 18 / L):
            px, py = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t; d.line([(px - nx * 9, py - ny * 9), (px + nx * 9, py + ny * 9)], fill=(60, 55, 50, 255), width=3)
    # station building
    d.rectangle([1185, 860, 1265, 905], fill=(190, 70, 50, 255), outline=(90, 30, 20, 255), width=3)
    lab = lambda xy, en, hi=None, s=30, b=True, col=(40, 32, 24): (d.text(xy, en, font=font(SANSB if b else SANS, s), fill=(*col, 255)), hi and d.text((xy[0], xy[1] + s + 2), hi, font=font(DEVB if b else DEV, int(s * .9)), fill=(*col, 230)))
    lab((1200, 800), 'INDORE JN.', 'इंदौर जंक्शन', 30)
    lab((1060, 690), 'Sarwate Bus Stand', 'सरवटे बस स्टैंड', 24)
    lab((1290, 960), 'Chhoti Gwaltoli', 'छोटी ग्वालटोली', 24)
    lab((560, 860), 'RAJWADA', 'राजवाड़ा', 30)
    lab((560, 1010), 'Sarafa', 'सराफा', 22, False)
    lab((1450, 640), 'Palasia', 'पलासिया', 24, False)
    lab((2000, 300), 'Vijay Nagar', 'विजय नगर', 26)
    lab((760, 1500), 'Bhanwarkuan', 'भंवरकुआं', 24, False)
    lab((120, 1030), 'to Airport', None, 22, False)
    lab((470, 260), 'Khan River', None, 20, False, (60, 100, 140))
    lab((1550, 880), 'A.B. Road', None, 20, False)
    # title block + grid + scale + compass
    d.rectangle([40, 30, 760, 150], fill=(245, 238, 220, 235), outline=(60, 50, 40, 255), width=3)
    d.text((62, 40), 'INDORE', font=font(COND, 62), fill=(30, 26, 22)); d.text((330, 52), 'CITY GUIDE MAP', font=font(CONDR, 34), fill=(30, 26, 22))
    d.text((334, 98), 'इंदौर शहर मार्गदर्शिका', font=font(DEV, 28), fill=(60, 50, 40))
    for i, x in enumerate(range(0, W, 300)): d.line([(x, 0), (x, H)], fill=(120, 110, 90, 40), width=1); d.text((x + 8, H - 34), 'ABCDEFGH'[i], font=font(SANS, 22), fill=(90, 80, 60))
    for i, y in enumerate(range(0, H, 300)): d.line([(0, y), (W, y)], fill=(120, 110, 90, 40), width=1); d.text((W - 34, y + 8), str(i + 1), font=font(SANS, 22), fill=(90, 80, 60))
    d.line([(1950, 1560), (2250, 1560)], fill=(30, 26, 22), width=5); d.text((2010, 1575), '0      1      2 km', font=font(SANS, 22), fill=(30, 26, 22))
    d.polygon([(2280, 120), (2300, 200), (2280, 185), (2260, 200)], fill=(30, 26, 22)); d.text((2268, 70), 'N', font=font(SANSB, 36), fill=(30, 26, 22))
    # --- the detective's red-pen work ---
    red = (175, 30, 30)
    o = Image.new('RGBA', im.size); od = ImageDraw.Draw(o)
    for k in range(3): od.ellipse([1110 - k * 3, 740 - k * 2, 1440 + k * 2, 1020 + k * 3], outline=(*red, 200), width=4)
    od.line([(1420, 990), (1330, 930)], fill=(*red, 220), width=5); od.polygon([(1330, 930), (1352, 932), (1342, 950)], fill=(*red, 220))
    od.line([(1318, 905), (1342, 929)], fill=(*red, 230), width=5); od.line([(1342, 905), (1318, 929)], fill=(*red, 230), width=5)
    im.alpha_composite(o.filter(ImageFilter.GaussianBlur(.5)))
    for (bx, by, lab) in ((1268, 858, 'A'), (1352, 948, 'B')):
        d.rectangle([bx, by, bx + 46, by + 32], fill=(205, 190, 165, 255), outline=(90, 80, 70, 255), width=3)
        d.text((bx + 23, by + 16), lab, font=font(SANSB, 26), fill=(60, 50, 40), anchor='mm')
    hand(im, (1450, 1000), 'godown A or B?\nbehind Pl. 4', 44, red, 3, HANDB)
    hand(im, (1470, 1135), 'A: cold store (shut since June)\nB: has a genset room', 30, (28, 45, 120), 2)
    hand(im, (600, 760), 'he met someone here?', 34, (28, 45, 120), -3)
    # bus route 21 dashed (blue pen)
    blue = (30, 50, 140); pts = [(620, 870), (760, 850), (900, 800), (1050, 740), (1120, 720)]
    for i in range(len(pts) - 1):
        (x1, y1), (x2, y2) = pts[i], pts[i + 1]; L = math.hypot(x2 - x1, y2 - y1)
        for t in np.arange(0, 1, 26 / L): d.line([(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t), (x1 + (x2 - x1) * min(1, t + 13 / L), y1 + (y2 - y1) * min(1, t + 13 / L))], fill=(*blue, 230), width=5)
    hand(im, (800, 700), 'bus 21', 38, blue, 8)
    hand(im, (1180, 1080), 'chai thikana x', 30, blue, -4)
    ring(im, 1900, 900, 110); ring(im, 1960, 960, 95, a=35)
    fold(im, True, .5); fold(im, False, .333); fold(im, False, .667)
    save(im, 'map', 88)

# ---------------------------------------------------------------- story draft (A4, typed + red pen)
def story():
    W, H = 1240, 1754; im = paper(W, H, (241, 236, 222), 7).convert('RGBA')
    d = ImageDraw.Draw(im); d.text((90, 70), 'INDORE EVENING POST', font=font(COND, 40), fill=(40, 36, 30)); d.text((90, 120), 'DRAFT · CITY DESK · NOT FOR PRINT', font=font(MONO, 24), fill=(90, 80, 70))
    d.line([(90, 160), (W - 90, 160)], fill=(40, 36, 30), width=2)
    body = ('SAWDUST IN YOUR POHA: THE FAKE JEERAVAN\nRACKET NEAR INDORE JUNCTION\n\nBy Rakesh Mehra\n\n'
            'For three weeks this reporter followed packets of\n"Indori Jeeravan" masala that look exactly like a\nfamous local brand, but are not. The colour is too\nbright. The smell fades in a day.\n\n'
            'Lab tests arranged by the Post found sawdust,\nartificial colour and very little cumin.\n\n'
            'The packets are filled at night in a godown\nnear the railway line and sent to shops across\nthe city before sunrise. Packers are paid in cash.\n'
            'The godown is rented in the name of\nSWAD MASALA UDYOG.\n\n'
            'A source who worked there says trucks leave\nwhen the last train has passed.')
    typed(im, (90, 200), body, 32, lh=1.55)
    red = (170, 28, 28)
    hand(im, (820, 250), 'confirm with 2nd source!', 40, red, 4)
    hand(im, (860, 1120), 'which godown? exact?', 40, red, -3)
    stamp(im, (760, 1460), 'PRIVATE', 64, (40, 60, 140), -8)
    ring(im, 240, 1560, 120); water(im, 2, 40); fold(im, True, .33); fold(im, True, .66)
    save(im, 'story')

# ---------------------------------------------------------------- notebook page
def notebook():
    W, H = 900, 1300; im = paper(W, H, (246, 242, 228), 6, edge=.15).convert('RGBA'); d = ImageDraw.Draw(im, 'RGBA')
    for y in range(160, H, 62): d.line([(0, y), (W, y)], fill=(120, 160, 205, 150), width=2)
    d.line([(110, 0), (110, H)], fill=(205, 90, 90, 170), width=3)
    for y in range(80, H, 120): d.ellipse([20, y, 52, y + 32], fill=(40, 35, 30, 255))
    blue = (25, 40, 120)
    hand(im, (140, 100), '24/11', 44, blue)
    hand(im, (140, 210), 'Godown near the railway line.\nTrucks after last train.', 46, blue, 0, HAND, 1.33)
    hand(im, (140, 400), 'Informant: meets at\nChai Thikana, 9 pm', 46, blue, 0, HAND, 1.33)
    hand(im, (140, 590), 'Swad office says call\ngodown line, ext. 14 · 21', 46, blue, 0, HAND, 1.33)
    hand(im, (140, 780), 'three places to check:', 46, blue)
    hand(im, (170, 850), '1. Platform 1 waiting room\n2. Sarwate stand\n3. behind Pl. 4 ??', 44, blue, 0, HAND, 1.38)
    o = Image.new('RGBA', im.size); od = ImageDraw.Draw(o)
    od.ellipse([150, 960, 560, 1050], outline=(*blue, 220), width=4); od.ellipse([145, 955, 565, 1058], outline=(*blue, 160), width=3)
    im.alpha_composite(o); water(im, 1, 30)
    save(im, 'notebook')

# ---------------------------------------------------------------- business card (rain-soaked)
def bizcard():
    W, H = 1050, 600; im = paper(W, H, (247, 244, 236), 5, False, .1).convert('RGBA'); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 26], fill=(150, 40, 30)); d.text((60, 70), 'SWAD MASALA UDYOG', font=font(COND, 64), fill=(120, 30, 22))
    d.text((60, 150), 'स्वाद मसाला उद्योग', font=font(DEVB, 40), fill=(120, 30, 22))
    d.text((60, 230), 'Pure Indori Masale · Since 1998', font=font(SANS, 28), fill=(60, 50, 40))
    d.text((60, 320), 'Office: Siyaganj, Indore (M.P.)', font=font(SANS, 30), fill=(40, 36, 30)); d.text((60, 362), 'Godown line (24 hrs):', font=font(SANS, 30), fill=(40, 36, 30))
    d.text((60, 450), 'Ph:  1987', font=font(SANSB, 40), fill=(40, 36, 30)); d.text((470, 450), '60', font=font(SANSB, 40), fill=(40, 36, 30))
    # the washed-out middle digits
    o = Image.new('RGBA', im.size); od = ImageDraw.Draw(o); od.text((280, 450), '14 21', font=font(SANSB, 40), fill=(40, 36, 30, 70))
    im.alpha_composite(o.filter(ImageFilter.GaussianBlur(7)))
    blot = Image.new('RGBA', im.size); bd = ImageDraw.Draw(blot)
    bd.ellipse([230, 380, 560, 560], fill=(110, 95, 70, 70)); bd.ellipse([600, 40, 1000, 300], fill=(110, 95, 70, 45))
    im.alpha_composite(blot.filter(ImageFilter.GaussianBlur(18)))
    water(im, 3, 70); fold(im, False, .62)
    save(im, 'bizcard')

# ---------------------------------------------------------------- bus ticket
def ticket():
    W, H = 420, 900; im = paper(W, H, (225, 232, 238), 6, False, .15).convert('RGBA'); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 120], fill=(40, 90, 150)); d.text((30, 22), 'INDORE CITY BUS', font=font(COND, 40), fill=(255, 255, 255)); d.text((30, 74), 'इंदौर सिटी बस', font=font(DEV, 28), fill=(220, 235, 250))
    rows = [('ROUTE', '21'), ('FROM', 'RAJWADA'), ('TO', 'SARWATE STAND'), ('FARE', 'Rs. 15.00'), ('DATE', '25/11/2026'), ('TIME', '22:58'), ('TKT NO', '0047 3392')]
    y = 160
    for k, v in rows:
        d.text((30, y), k, font=font(MONO, 26), fill=(70, 70, 70)); d.text((150, y), v, font=font(MONOB, 30 if k != 'ROUTE' else 64), fill=(20, 20, 20)); y += 96 if k == 'ROUTE' else 70
    for x in range(0, W, 16): d.ellipse([x, H - 70, x + 8, H - 62], fill=(150, 150, 150))
    d.text((30, H - 50), 'KEEP TICKET TILL END OF JOURNEY', font=font(SANS, 18), fill=(90, 90, 90))
    fold(im, True, .45); water(im, 1, 35)
    save(im, 'ticket')

# ---------------------------------------------------------------- Chai Thikana receipt (thermal)
def receipt():
    W, H = 520, 1100; im = paper(W, H, (246, 246, 242), 4, False, .08).convert('RGBA')
    lines = ['      CHAI THIKANA', '      Indore (M.P.)', '   Ph: 0731 258 440', '--------------------------', 'Date: 25/11/26  21:12', 'Table: 3     Bill: 2231', '--------------------------',
             'Cutting chai x2     40.00', 'Bun maska    x1     20.00', '--------------------------', 'TOTAL           Rs 60.00', 'CASH            Rs 60.00', '--------------------------', '   Thank you! Visit again', '', '', '']
    y = 60
    for l in lines:
        typed(im, (34, y), l, 30, (40, 40, 44), 1.0, MONO); y += 52
    o = Image.new('RGBA', im.size); od = ImageDraw.Draw(o); od.rectangle([0, 0, W, H], fill=(255, 255, 255, 0))
    for yy in range(0, H, 3): od.line([(0, yy), (W, yy)], fill=(255, 255, 255, random.randint(0, 25)))
    im.alpha_composite(o); fold(im, True, .3); fold(im, True, .62)
    save(im, 'receipt')

# ---------------------------------------------------------------- press ID (front, photo water-damaged)
def press_id():
    W, H = 1000, 640; im = paper(W, H, (240, 242, 245), 3, False, .05).convert('RGBA'); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 130], fill=(25, 35, 60)); d.text((40, 24), 'INDORE EVENING POST', font=font(COND, 54), fill=(255, 255, 255)); d.text((40, 90), 'PRESS', font=font(SANSB, 28), fill=(242, 165, 65))
    photo = Image.new('RGBA', (240, 300), (150, 145, 140, 255)); pd = ImageDraw.Draw(photo)
    pd.ellipse([70, 50, 170, 170], fill=(95, 75, 60)); pd.rectangle([40, 170, 200, 300], fill=(60, 70, 90)); photo = photo.filter(ImageFilter.GaussianBlur(14))
    im.alpha_composite(photo, (40, 170))
    d.text((320, 180), 'RAKESH MEHRA', font=font(COND, 54), fill=(25, 35, 60)); d.text((320, 250), 'Senior Correspondent · City Desk', font=font(SANS, 30), fill=(50, 50, 60))
    d.text((320, 330), 'ID No.  IEP / 0619', font=font(MONOB, 32), fill=(30, 30, 30)); d.text((320, 380), 'Valid till 03/2027', font=font(MONO, 28), fill=(60, 60, 60))
    d.text((320, 470), 'If found, please return to:', font=font(SANS, 24), fill=(80, 80, 80)); d.text((320, 505), 'Indore Evening Post, M.G. Road', font=font(SANS, 24), fill=(80, 80, 80)); d.text((320, 545), 'Night desk: 0731 254 611', font=font(SANSB, 26), fill=(40, 40, 50))
    water(im, 2, 60)
    save(im, 'pressid')
    b = paper(W, H, (236, 238, 240), 3, False, .05).convert('RGBA'); bd = ImageDraw.Draw(b)
    bd.text((40, 40), 'TERMS: This card is property of the Indore Evening Post.', font=font(SANS, 24), fill=(90, 90, 90))
    hand(b, (60, 220), 'If I go missing, tell Asha:\n"follow the masala."  — R.', 64, (25, 40, 120), -3)
    save(b, 'pressid_back')

# ---------------------------------------------------------------- fake jeeravan packet (front)
def packet():
    W, H = 900, 1300; im = Image.new('RGBA', (W, H), (205, 40, 30, 255)); d = ImageDraw.Draw(im)
    for i in range(0, H, 6): d.line([(0, i), (W, i)], fill=(255, 255, 255, random.randint(0, 10)))
    d.ellipse([110, 150, 790, 830], fill=(250, 205, 60)); d.ellipse([150, 190, 750, 790], fill=(214, 120, 40))
    d.text((W // 2, 300), 'INDORI', font=font(COND, 90), fill=(255, 245, 220), anchor='mm')
    d.text((W // 2, 450), 'JEERAVN', font=font(COND, 150), fill=(255, 255, 240), anchor='mm')  # misspelt on purpose
    d.text((W // 2, 590), 'जीरावन मसाला', font=font(DEVB, 70), fill=(255, 240, 210), anchor='mm')
    d.text((W // 2, 700), 'for POHA · NAMKEEN', font=font(SANSB, 34), fill=(255, 235, 200), anchor='mm')
    d.rectangle([0, 900, W, 1300], fill=(160, 25, 20)); d.text((W // 2, 990), 'NET WT. 100 g', font=font(SANSB, 46), fill=(255, 230, 200), anchor='mm')
    d.text((W // 2, 1080), 'Packed by: — — —', font=font(SANS, 36), fill=(255, 210, 190), anchor='mm'); d.text((W // 2, 1140), 'MRP Rs 55 · Batch: ??', font=font(SANS, 36), fill=(255, 210, 190), anchor='mm')
    for x in range(0, W, 30): d.polygon([(x, 0), (x + 15, 24), (x + 30, 0)], fill=(140, 20, 15))
    w = Image.new('RGBA', im.size); wd = ImageDraw.Draw(w)
    for _ in range(40):
        y = random.uniform(0, H); wd.line([(0, y), (W, y + random.uniform(-80, 80))], fill=(255, 255, 255, random.randint(8, 30)), width=random.randint(2, 10))
    im.alpha_composite(w.filter(ImageFilter.GaussianBlur(6)))
    save(im, 'packet')


# ---------------------------------------------------------------- Act II props
def envelope():
    W, H = 1100, 760; im = paper(W, H, (196, 160, 112), 8, True, .3).convert('RGBA'); d = ImageDraw.Draw(im, 'RGBA')
    d.polygon([(0, 0), (W, 0), (W // 2, 330)], fill=(180, 145, 100, 120)); d.line([(0, 0), (W // 2, 330), (W, 0)], fill=(120, 90, 55, 160), width=3)
    hand(im, (140, 420), 'Detective sahab -\nRakesh bhai ne bola tha aapko dena.', 48, (30, 30, 35), -2)
    hand(im, (700, 640), '- P.', 52, (30, 30, 35), 0)
    water(im, 2, 40); ring(im, 920, 150, 70, a=45)
    save(im, 'envelope')

def pappu_note():
    W, H = 900, 640; im = paper(W, H, (240, 236, 222), 5, True, .1).convert('RGBA')
    hand(im, (60, 60), 'Godown B ka maal hai. Raat ko bharte hain,\nsubah 5 baje truck nikalta hai.\nRakesh bhai ko kal raat se nahi dekha.\nKisi ko mat batana maine diya.  - P.', 44, (30, 30, 35), -1, HAND, 1.3)
    fold(im, True, .5)
    save(im, 'pappu_note')

def sachet():
    W, H = 600, 800; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im, 'RGBA')
    d.rounded_rectangle([40, 40, W - 40, H - 40], 26, fill=(235, 240, 244, 90), outline=(250, 252, 255, 200), width=5)
    # powder pile: irregular mound, grainy
    pile = Image.new('L', (W, H), 0); pd = ImageDraw.Draw(pile)
    pts = [(70, H - 60)] + [(x, H - 60 - 260 * math.sin((x - 70) / (W - 140) * math.pi) ** .7 - random.uniform(-14, 14)) for x in range(70, W - 69, 20)] + [(W - 70, H - 60)]
    pd.polygon(pts, fill=255); pile = pile.filter(ImageFilter.GaussianBlur(3))
    grain = np.random.default_rng(3).integers(0, 60, (H, W, 1))
    col = np.concatenate([150 + grain, 58 + grain * .5, 30 + grain * .3, np.full((H, W, 1), 255)], 2).clip(0, 255).astype('uint8')
    pw = Image.fromarray(col, 'RGBA'); pw.putalpha(pile); im.alpha_composite(pw)
    hl = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(hl)
    d.rectangle([44, 44, W - 44, 108], fill=(255, 255, 255, 70)); d.line([(40, 110), (W - 40, 110)], fill=(255, 255, 255, 200), width=4)
    for _ in range(10):
        x = random.uniform(70, W - 90); d.line([(x, 120), (x + random.uniform(-30, 30), H - 70)], fill=(255, 255, 255, random.randint(30, 70)), width=random.randint(3, 12))
    im.alpha_composite(hl.filter(ImageFilter.GaussianBlur(3)))
    lab = paper(280, 110, (246, 240, 220), 3, False, 0).convert('RGBA'); typed(lab, (18, 18), 'GODOWN B\nlot 14 · 25/11', 28, (40, 30, 25), 1.25)
    im.alpha_composite(lab.rotate(-6, expand=True), (160, 160))
    im.save(OUT + 'sachet.png')

def tin():
    W, H = 600, 760; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im, 'RGBA')
    for x in range(60, W - 60):
        t = (x - 60) / (W - 120); v = int(110 + 120 * math.sin(t * math.pi) ** .6 + 40 * math.exp(-((t - .3) * 9) ** 2))
        d.line([(x, 120), (x, H - 40)], fill=(v, v, min(255, v + 8), 255))
    d.ellipse([60, 80, W - 60, 160], fill=(205, 205, 210, 255), outline=(120, 120, 125, 255), width=3)
    d.ellipse([60, H - 80, W - 60, H - 10], fill=(120, 120, 125, 255))
    tape = paper(330, 120, (232, 220, 180), 4, False, 0).convert('RGBA'); hand(tape, (20, 14), 'jeeravan\n(ghar ka)', 40, (25, 25, 30), 0, HAND, 1.05)
    im.alpha_composite(tape.rotate(3, expand=True), (130, 330))
    im.save(OUT + 'tin.png')

import sys
only = sys.argv[1:]
for fn in (indore_map, story, notebook, bizcard, ticket, receipt, press_id, packet, envelope, pappu_note, sachet, tin):
    if not only or fn.__name__ in only: fn()
