# Assemble the style x face matrix from matrix.py renders.
#   uv run --with pillow --with numpy python blender/matrix_sheet.py renders/matrix renders/matrix.png [style:face ...]
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC, OUT = sys.argv[1], sys.argv[2]
ONLY = sys.argv[3:]
STYLES = [('ps1', 'PS1 crude'), ('ps2', 'PS2 low-poly'), ('cel', 'Cel hard-surface')]
FACES = [('doll', 'Doll faceplate'), ('visor', 'Screen visor'), ('anime', 'Anime face'), ('mech', 'Mostly mech')]
W, H = 330, 440
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 - 0.5


def treat(path, style, dark):
    im = Image.open(path).convert('RGB')
    if style == 'ps1':   # 15-bit colour with ordered dither, then chunky pixels
        a = np.asarray(im).astype(np.float32)
        h, w = a.shape[:2]
        a = a + np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w, None] * 8
        a = (np.clip(a, 0, 255) // 8) * 8
        im = Image.fromarray(a.astype(np.uint8)).resize((W, H), Image.NEAREST)
    else:
        im = im.resize((W, H), Image.BILINEAR if style == 'ps2' else Image.LANCZOS)
    if dark:             # bloom from the brightest pixels
        a = np.asarray(im).astype(np.float32)
        lum = a.max(axis=2, keepdims=True)
        hot = Image.fromarray((a * (lum > 200)).astype(np.uint8))
        glow = np.asarray(hot.filter(ImageFilter.GaussianBlur(9))).astype(np.float32) * 1.6
        glow += np.asarray(hot.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) * 0.6
        im = Image.fromarray(np.clip(a + glow, 0, 255).astype(np.uint8))
    return im


def font(size):
    for f in ['/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/System/Library/Fonts/Helvetica.ttc']:
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()


rows = [s for s in STYLES if not ONLY or any(o.startswith(s[0] + ':') for o in ONLY)]
cols = [f for f in FACES if not ONLY or any(o.endswith(':' + f[0]) for o in ONLY)]
LW, TH, GAP = 170, 50, 14
sheet = Image.new('RGB', (LW + len(cols) * (2 * W + GAP), TH + len(rows) * (H + GAP)), (24, 22, 21))
d = ImageDraw.Draw(sheet); big, small = font(26), font(18)
for ci, (fk, fl) in enumerate(cols):
    d.text((LW + ci * (2 * W + GAP) + 8, 12), fl, fill=(232, 130, 63), font=big)
for ri, (sk, sl) in enumerate(rows):
    y = TH + ri * (H + GAP)
    d.text((10, y + H // 2 - 14), sl.replace(' ', '\n', 1), fill=(242, 236, 226), font=big)
    for ci, (fk, _) in enumerate(cols):
        x = LW + ci * (2 * W + GAP)
        for k, mode in enumerate(('lit', 'dark')):
            try: sheet.paste(treat(f'{SRC}/{sk}-{fk}-{mode}.png', sk, mode == 'dark'), (x + k * W, y))
            except FileNotFoundError: d.text((x + k * W + 20, y + 20), 'missing', fill=(120, 120, 120), font=small)
sheet.save(OUT)
print(OUT, sheet.size)
