"""Turn a tall full-page screenshot into a side-by-side contact sheet for review.

Usage: python sheet.py <in.png> <out.png> [--col 1400] [--scale 0.5]
Cuts the page into columns of <col> source px, scales them, and lays them left to right.
"""
import argparse
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--col", type=int, default=1400)
ap.add_argument("--scale", type=float, default=0.5)
a = ap.parse_args()

im = Image.open(a.src).convert("RGB")
w, h = im.size
cols = [im.crop((0, y, w, min(y + a.col, h))) for y in range(0, h, a.col)]
cw, ch = int(w * a.scale), int(a.col * a.scale)
gap = 12
sheet = Image.new("RGB", (len(cols) * (cw + gap) - gap, ch), (128, 128, 128))
for i, c in enumerate(cols):
    c = c.resize((cw, int(c.size[1] * a.scale)), Image.LANCZOS)
    sheet.paste(c, (i * (cw + gap), 0))
sheet.save(a.out)
print(a.out, sheet.size, f"{len(cols)} cols from {w}x{h}")
