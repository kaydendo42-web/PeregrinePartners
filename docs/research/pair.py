"""Print reference and local items side by side for a y-window.
    python3 docs/research/pair.py <ref_y0> <ref_y1> <delta>
`delta` is ref_y - local_y for the section you are inspecting; pass the value
`align.py` reports so both columns line up on the same row of the design."""
import json, sys

ref = json.load(open('docs/research/raw/measure-1440.json'))['items']
loc = json.load(open('docs/research/local/measure-1440.json'))['items']
y0, y1 = int(sys.argv[1]), int(sys.argv[2])
d = int(sys.argv[3]) if len(sys.argv) > 3 else 0

def line(o):
    s = f"y{o['y']:6d} x{o['x']:5d} {o['w']:4d}x{o['h']:4d} <{o['tag']}>"
    if o.get('name'): s += f"[{o['name']}]"
    if 'text' in o: s += f" '{o['text'][:30]}' {o['fs']}/{o['lh']} w{o['fw']}"
    for k in ('bg', 'br', 'pad', 'gap', 'jc', 'ai', 'fd', 'op', 'fit'):
        if k in o: s += f" {k}={o[k]}"
    if 'src' in o: s += ' src=' + str(o['src']).split('/')[-1][:26]
    return s

rows = [('R', o['y'], line(o)) for o in ref if y0 <= o['y'] <= y1]
rows += [('L', o['y'] + d, line(o)) for o in loc if y0 - d <= o['y'] <= y1 - d]
rows.sort(key=lambda r: (r[1], r[0]))
for side, _, s in rows:
    print(('    ' if side == 'L' else '') + side + ' ' + s)
