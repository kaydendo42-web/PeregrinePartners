import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage();
await p.goto('https://spartanai.framer.website/', { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { await new Promise((res) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 700); y += 700; if (y >= document.body.scrollHeight) { clearInterval(t); res(); } }, 60); }); });
await new Promise(r => setTimeout(r, 2000));
const res = await p.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('*')) {
    const cs = getComputedStyle(e);
    if (cs.backgroundImage && cs.backgroundImage !== 'none' && cs.backgroundImage.includes('url(')) {
      const r = e.getBoundingClientRect();
      out.push({ url: cs.backgroundImage.slice(0, 160), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) });
    }
  }
  return out;
});
console.log(JSON.stringify(res.slice(0, 40), null, 1));
await b.close();
