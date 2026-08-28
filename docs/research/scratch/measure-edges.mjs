import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
for (const path of ['/', '/about']) {
  for (const w of [1440, 2000, 2560]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await p.goto('http://localhost:3001' + path, { waitUntil: 'networkidle2' });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 900));
    await p.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));
    const o = await p.evaluate(() => [...document.querySelectorAll('.measure')].map(m => {
      const r = m.getBoundingClientRect();
      return Math.round(r.left) + '..' + Math.round(r.right);
    }));
    console.log(path, w, JSON.stringify(o));
    await p.close();
  }
}
await b.close();
