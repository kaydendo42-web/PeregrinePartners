import json,sys
d=json.load(open('raw/measure-1440.json'))
it=d['items']
def show(y0,y1,minw=0,txt_only=False):
    for o in it:
        if not (y0<=o['y']<=y1): continue
        if o['w']<minw: continue
        if txt_only and 'text' not in o: continue
        s=f"y{o['y']:5d} x{o['x']:4d} {o['w']:4d}x{o['h']:4d} <{o['tag']}>"
        if o.get('name'): s+=f" [{o['name']}]"
        if 'text' in o: s+=f" '{o['text'][:60]}' {o['font']} {o['fs']}/{o['lh']} w{o['fw']} ls{o['ls']} {o['color']}"
        for k in ('bg','br','bd','pad','disp','gap','gtc','jc','ai','fd','op','tf','shadow','bdf','trans','src','fit','ta','tt'):
            if k in o: s+=f" {k}={o[k]}"
        print(s)
if __name__=='__main__':
    a=sys.argv
    show(int(a[1]),int(a[2]), int(a[3]) if len(a)>3 else 0, len(a)>4)
