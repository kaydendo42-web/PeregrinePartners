/** Viewport tiles down a page, at the width the design was measured at.
 *
 * The browser-automation route could not be pinned to 1440 on this machine
 * (the window is fullscreen and refuses to resize), and reviewing a design
 * measured at 1440 on a 2560 viewport is reviewing a different design. This
 * drives a real Chrome at an exact viewport and writes one PNG per screen.
 *
 *   node docs/research/shoot-tiles.mjs [path] [width] [outdir]
 */
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const PATHNAME = process.argv[2] || '/';
const WIDTH = Number(process.argv[3] || 1440);
const TAG = PATHNAME === '/' ? 'home' : PATHNAME.replace(/\W/g, '') || 'home';
const OUT = process.argv[4] || join('docs/research/tiles', `${TAG}-${WIDTH}`);
const H = 900;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const p = await b.newPage();
await p.setViewport({ width: WIDTH, height: H, deviceScaleFactor: 1 });

const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
p.on('console', (m) => {
  if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 200)}`);
});
p.on('requestfailed', (r) => errs.push(`request failed: ${r.url().slice(0, 140)}`));

await p.goto(`http://localhost:3001${PATHNAME}`, { waitUntil: 'networkidle2', timeout: 120000 });

/* Walk the page once so every reveal has fired and every scroll-linked block
   has been driven through its range, then come back and shoot. Absolute
   offsets with smooth scrolling forced off — see PICKUP §1. */
await p.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const max = () => document.documentElement.scrollHeight - innerHeight;
  await new Promise((res) => {
    let y = 0;
    const t = setInterval(() => {
      y += 220;
      scrollTo(0, y);
      if (y >= max()) {
        clearInterval(t);
        res();
      }
    }, 45);
  });
});
await new Promise((r) => setTimeout(r, 1200));

const total = await p.evaluate(() => document.documentElement.scrollHeight);
const tiles = Math.ceil(total / H);

for (let i = 0; i < tiles; i++) {
  const y = i * H;
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 420));
  await p.screenshot({ path: join(OUT, `${String(i).padStart(2, '0')}.png`) });
}

/* Horizontal overflow is the thing that actually breaks a page. Marquees are
   wider than the viewport by design and are expected here. */
const over = await p.evaluate(() => {
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(el).position !== 'fixed') {
      bad.push(`${el.tagName}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)}`);
    }
  }
  return [...new Set(bad)].slice(0, 8);
});

console.log(`${PATHNAME} @${WIDTH}  height=${total}  tiles=${tiles}  → ${OUT}`);
if (over.length) console.log('overflow:\n  ' + over.join('\n  '));
if (errs.length) console.log('errors:\n  ' + [...new Set(errs)].join('\n  '));
else console.log('no console errors, no failed requests');

await b.close();
