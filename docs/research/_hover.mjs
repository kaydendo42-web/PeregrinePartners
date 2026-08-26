import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage();
await p.goto('https://spartanai.framer.website/', { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, 2380); });
await new Promise(r => setTimeout(r, 2000));
await p.screenshot({ path: 'docs/research/compare/zoom/works.rest.png', clip: { x: 40, y: 20, width: 470, height: 480 } });
// report what the media stack looks like at rest
console.log(JSON.stringify(await p.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find(i => i.currentSrc.includes('sZxYLpvH'));
  if (!img) return 'no img';
  const out = [];
  let n = img;
  for (let i = 0; i < 5 && n; i++, n = n.parentElement) {
    const cs = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    out.push({ tag: n.tagName, op: cs.opacity, tf: cs.transform, filter: cs.filter, ov: cs.overflow, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) });
  }
  return out;
}), null, 1));
await p.mouse.move(260, 240);
await new Promise(r => setTimeout(r, 1400));
await p.screenshot({ path: 'docs/research/compare/zoom/works.hover.png', clip: { x: 40, y: 20, width: 470, height: 480 } });
await b.close();
console.log('done');
