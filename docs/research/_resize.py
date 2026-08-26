"""Resize one image so its longest side is at most `max_px`, never upscaling.
JPEGs are re-encoded at 82; PNGs keep their format so alpha survives."""
import sys
from PIL import Image

path, max_px = sys.argv[1], int(sys.argv[2])
im = Image.open(path)
w, h = im.size
scale = min(1.0, max_px / max(w, h))
if scale < 1.0:
    im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)

if path.lower().endswith((".jpg", ".jpeg")):
    im.convert("RGB").save(path, "JPEG", quality=82, optimize=True, progressive=True)
elif path.lower().endswith(".png"):
    im.save(path, "PNG", optimize=True)
