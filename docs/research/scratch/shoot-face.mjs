import puppeteer from 'puppeteer-core';
const OUT = process.argv[2];
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const p = await b.newPage();
await p.setViewport({ width: Number(process.argv[3]||1440), height: Number(process.argv[4]||900), deviceScaleFactor: 3 });
await p.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1200));

// find the rotated glass div ScreenFace renders
const box = await p.evaluate(() => {
  const el = document.querySelector('div[aria-hidden] > div[style*="skew"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (!box) { console.log('GLASS NOT FOUND'); await b.close(); process.exit(1); }
console.log('glass', JSON.stringify(box));

const pad = 34;
const clip = { x: box.x - pad, y: box.y - pad, width: box.w + pad*2, height: box.h + pad*2 };

for (const [name, mx, my] of [['left', 60, 500], ['center', 720, 430], ['right', 1380, 830]]) {
  await p.mouse.move(mx, my);
  await new Promise(r => setTimeout(r, 900));
  await p.screenshot({ path: `${OUT}/face-${name}.png`, clip });
}
await b.close();
console.log('done');
