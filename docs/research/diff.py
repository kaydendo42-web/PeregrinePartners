import json

ref = json.load(open('docs/research/raw/measure-1440.json'))['items']
loc = json.load(open('docs/research/local/measure-1440.json'))['items']

def norm_font(v):
    if not v: return v
    v = v.lower()
    if 'inter' in v: return 'inter'
    if 'geist' in v or 'mono' in v: return 'mono'
    if 'jaini' in v: return 'jaini'
    return v

def px(v):
    try: return round(float(str(v).replace('px', '')), 1)
    except Exception: return v

def key(o):
    t = (o.get('text') or '').strip()
    return t[:60] if t else None

def index(items):
    d = {}
    for o in items:
        k = key(o)
        if not k: continue
        d.setdefault(k, []).append(o)
    return d

R, L = index(ref), index(loc)
rows, matched = [], 0
for k, rlist in R.items():
    if k not in L: continue
    for i, r in enumerate(rlist):
        if i >= len(L[k]): break
        l = L[k][i]
        matched += 1
        d = []
        for f in ('x', 'w'):
            rv, lv = r.get(f), l.get(f)
            if rv is None or lv is None: continue
            if abs(rv - lv) > 3: d.append(f'{f} {rv}->{lv}')
        if norm_font(r.get('font')) != norm_font(l.get('font')):
            d.append(f"font {r.get('font')}->{l.get('font')}")
        for f in ('fs', 'lh', 'ls'):
            rv, lv = px(r.get(f)), px(l.get(f))
            if rv is None or lv is None: continue
            if isinstance(rv, float) and isinstance(lv, float):
                if abs(rv - lv) > 0.6: d.append(f'{f} {rv}->{lv}')
            elif rv != lv: d.append(f'{f} {rv}->{lv}')
        for f in ('fw', 'color', 'tt'):
            if r.get(f) != l.get(f) and (r.get(f) or l.get(f)):
                d.append(f"{f} {r.get(f)}->{l.get(f)}")
        if d: rows.append((r['y'], k, d))

rows.sort()
print(f'{matched} strings matched, {len(rows)} with real drift\n')
for y, k, d in rows:
    print(f'y{y:<6} "{k[:44]}"  |  ' + '; '.join(d))
