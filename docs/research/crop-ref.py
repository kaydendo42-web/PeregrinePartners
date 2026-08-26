"""Crop a band out of the user's full-page reference captures.

    python3 docs/research/crop-ref.py mobile 0 1800 out.png

The captures are at 2x, so y values are in CSS pixels for the width the
capture was taken at: desktop 1440, tablet 834, mobile 390.
"""
import sys
from PIL import Image

NAMES = {"desktop": 1440, "tablet": 834, "mobile": 390}
which, y0, y1, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
im = Image.open(f"docs/research/design-references/{which}.png")
scale = im.size[0] / NAMES[which]
box = (0, int(y0 * scale), im.size[0], min(im.size[1], int(y1 * scale)))
crop = im.crop(box)
crop = crop.resize((NAMES[which], round(crop.size[1] / scale)), Image.LANCZOS)
crop.save(out)
print(out, crop.size)
