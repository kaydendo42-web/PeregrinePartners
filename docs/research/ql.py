import json,sys
d=json.load(open('local/measure-1440.json'))
it=d['items']
def show(y0,y1,minw=0):
    for o in it:
        if not (y0<=o['y']<=y1): continue
        if o['w']<minw: continue
        s=f"y{o['y']:5d} x{o['x']:5d} {o['w']:4d}x{o['h']:4d} <{o['tag']}>"
        if 'text' in o: s+=f" '{o['text'][:52]}' {o['font']} {o['fs']}/{o['lh']} w{o['fw']} ls{o['ls']} {o['color']}"
        for k in ('bg','br','bd','pad','disp','gap','gtc','op','src','tt'):
            if k in o: s+=f" {k}={o[k]}"
        print(s)
a=sys.argv; show(int(a[1]),int(a[2]), int(a[3]) if len(a)>3 else 0)
