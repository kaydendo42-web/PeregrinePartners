/** Full-page strips at phone / tablet / laptop widths.
 *   node docs/research/shoot-widths.mjs [path] [outdir] */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const PATHNAME = process.argv[2] || '/';
const OUT = process.argv[3] || 'docs/research/widths';
mkdirSync(OUT, { recursive: true });
const WIDTHS = [390, 810, 1100];

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
for (const w of WIDTHS) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 900 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  await p.goto(`http://localhost:3001${PATHNAME}`, { waitUntil: 'networkidle2', timeout: 120000 });
  await p.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const max = () => document.documentElement.scrollHeight - innerHeight;
    await new Promise((res) => { let y = 0; const t = setInterval(() => { y += 260; scrollTo(0, y); if (y >= max()) { clearInterval(t); res(); } }, 55); });
  });
  await new Promise((r) => setTimeout(r, 1800));
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  // horizontal overflow is the thing that actually breaks a page
  const over = await p.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(el).position !== 'fixed') {
        bad.push(`${el.tagName}.${String(el.className).slice(0, 34)} right=${Math.round(r.right)}`);
      }
    }
    return bad.slice(0, 6);
  });
  const tag = PATHNAME === '/' ? 'home' : PATHNAME.replace(/\W/g, '');
  for (let y = 0, i = 0; y < H; y += 900, i++) {
    await p.evaluate((yy) => scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 450));
    await p.screenshot({ path: join(OUT, `${tag}-${w}-${String(i).padStart(2, '0')}.png`) });
  }
  console.log(`${w}px  docH ${H}  errors ${errs.length}  overflow ${over.length}`);
  over.forEach((o) => console.log('    ', o));
  await p.close();
}
await b.close();
