/** Screenshot the platform page at a set of scroll offsets.
 *   node docs/research/shoot-platform.mjs [url] [outdir] */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] || 'http://localhost:3001/platform';
const OUT = process.argv[3] || 'docs/research/platform-shots';
mkdirSync(OUT, { recursive: true });

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
});
const p = await b.newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 160)));
await p.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const max = () => document.documentElement.scrollHeight - innerHeight;
  await new Promise((res) => { let y = 0; const t = setInterval(() => { y += 260; scrollTo(0, y); if (y >= max()) { clearInterval(t); res(); } }, 60); });
});
await new Promise((r) => setTimeout(r, 2000));
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0, i = 0; y < H; y += 900, i++) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 700));
  await p.screenshot({ path: join(OUT, `y${String(y).padStart(5, '0')}.png`) });
}
console.log('docH', H, 'errors', errs.length);
errs.slice(0, 8).forEach((e) => console.log('  ', e));
await b.close();
