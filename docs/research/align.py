"""
Vertical-rhythm check.

Our page drops sections the reference has, so absolute y no longer lines up.
Join on text instead and print `ref_y - local_y` per string: inside a section
that is built correctly the delta is constant, and every place the delta
steps is a rhythm error worth the exact number of pixels it moved.

    python3 docs/research/align.py [y0] [y1]
"""
import json, sys

ref = json.load(open('docs/research/raw/measure-1440.json'))['items']
loc = json.load(open('docs/research/local/measure-1440.json'))['items']

def key(o):
    t = (o.get('text') or '').strip()
    return t[:60] if len(t) > 2 else None

def index(items):
    d = {}
    for o in items:
        k = key(o)
        if k:
            d.setdefault(k, []).append(o)
    return d

R, L = index(ref), index(loc)
y0 = int(sys.argv[1]) if len(sys.argv) > 1 else 0
y1 = int(sys.argv[2]) if len(sys.argv) > 2 else 10**9

rows = []
for k, rl in R.items():
    if k not in L:
        continue
    for i, r in enumerate(rl):
        if i >= len(L[k]):
            break
        l = L[k][i]
        if not (y0 <= r['y'] <= y1):
            continue
        rows.append((r['y'], l['y'], r['y'] - l['y'], r['x'], l['x'], r['w'], l['w'], k))

rows.sort()
prev = None
print(f"{'ref_y':>7} {'loc_y':>7} {'Δy':>6}  {'ref_x':>5} {'loc_x':>5} {'Δx':>5}  {'ref_w':>5} {'loc_w':>5}   text")
for ry, ly, d, rx, lx, rw, lw, k in rows:
    step = '' if prev is None or d == prev else f'   <<< step {d - prev:+d}'
    print(f"{ry:7d} {ly:7d} {d:6d}  {rx:5d} {lx:5d} {lx-rx:+5d}  {rw:5d} {lw:5d}   {k[:44]}{step}")
    prev = d
