import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage();
await p.goto('https://spartanai.framer.website/', { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 3000));
const res = await p.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('img, video')) {
    const r = e.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight + 200) continue;
    out.push({ tag: e.tagName, src: (e.currentSrc || e.src || '').slice(0, 120), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) });
  }
  return out;
});
console.log(JSON.stringify(res, null, 1));
await b.close();
