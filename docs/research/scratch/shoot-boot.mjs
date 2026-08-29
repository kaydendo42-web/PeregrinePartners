import puppeteer from 'puppeteer-core';
const OUT = process.argv[2];
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));

// warm the route so the boot sequence isn't racing a cold compile
await p.goto('http://localhost:3001/platform', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));

const t0 = Date.now();
await p.goto('http://localhost:3001/platform', { waitUntil: 'domcontentloaded' });
const shots = [150, 500, 700, 1000, 1250, 1450, 1750, 2000, 2300, 2700];
for (const at of shots) {
  const wait = at - (Date.now() - t0);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  await p.screenshot({ path: `${OUT}/boot-${String(at).padStart(4,'0')}.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
}
console.log('errors:', JSON.stringify(errs, null, 1));
await b.close();
