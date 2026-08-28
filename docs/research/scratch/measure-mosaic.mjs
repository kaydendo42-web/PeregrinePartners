import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
for (const w of [1440, 1728, 2000, 2560]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await p.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  const o = await p.evaluate(() => {
    const h = document.querySelector('.t-statement');
    const card = h.closest('.section-card');
    const grid = card.querySelector('div.grid');
    const cr = card.getBoundingClientRect(), gr = grid.getBoundingClientRect(), hr = h.getBoundingClientRect();
    return {
      card: [Math.round(cr.left), Math.round(cr.right)],
      grid: [Math.round(gr.left), Math.round(gr.right), Math.round(gr.width)],
      headingLeft: Math.round(hr.left),
      padL: Math.round(gr.left - cr.left), padR: Math.round(cr.right - gr.right),
    };
  });
  console.log(w, JSON.stringify(o));
  await p.close();
}
await b.close();
