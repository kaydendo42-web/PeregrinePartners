import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] || 'http://localhost:3001';
const OUT = process.argv[3] || 'docs/research/local/shots';
const W = Number(process.argv[4] || 1440);
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: W, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 });
await page.evaluate(async () => {
  await new Promise((res) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 600); y += 600; if (y >= document.body.scrollHeight + 1200) { clearInterval(t); res(); } }, 60); });
});
await new Promise(r => setTimeout(r, 1500));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1200));
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0, i = 0; y < H; y += 900, i++) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: join(OUT, `y${String(y).padStart(5, '0')}.png`) });
}
console.log('docH', H);
console.log(errs.slice(0, 12).join('\n') || 'no console errors');
await browser.close();
