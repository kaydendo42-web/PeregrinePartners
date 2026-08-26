/**
 * Screenshot the reference and our build at matching scroll positions.
 *   node docs/research/compare.mjs
 * Pairs are declared below as [name, referenceY, delta] where delta is the
 * `ref_y - local_y` that align.py reports for that section.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const OUT = process.argv[2] || 'docs/research/compare';
mkdirSync(OUT, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const PAIRS = [
  ['01-hero', 0, 0],
  ['02-hero-foot', 500, 0],
  ['03-statement', 1050, 0],
  ['04-mosaic', 1380, 0],
  ['05-works', 2100, 0],
  ['06-works-cards', 2380, 0],
  ['07-capabilities', 3540, 0],
  ['08-capabilities-b', 4000, 0],
  ['09-vision', 4560, 0],
  ['10-neural', 5400, 0],
  ['11-film', 7241, 1123],
  ['12-film-foot', 7600, 1123],
  ['13-process', 8340, 1123],
  ['14-process-b', 8700, 1123],
  ['15-team', 9420, 1123],
  ['16-team-cards', 10050, 1123],
  ['17-faq', 12280, 2352],
  ['18-faq-b', 12700, 2352],
];

async function shoot(page, url, y, file) {
  await page.evaluate((yy) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, yy);
  }, y);
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: file });
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

for (const [label, url, prefix] of [
  ['reference', 'https://spartanai.framer.website/', 'ref'],
  ['local', 'http://localhost:3001/', 'loc'],
]) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
  // settle every scroll-triggered reveal before capturing
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const max = () => document.documentElement.scrollHeight - window.innerHeight;
    await new Promise((res) => {
      let y = 0;
      const t = setInterval(() => {
        y += 260;
        window.scrollTo(0, y);
        if (y >= max()) { clearInterval(t); res(); }
      }, 70);
    });
  });
  await new Promise((r) => setTimeout(r, 2500));
  for (const [name, refY, delta] of PAIRS) {
    const y = prefix === 'ref' ? refY : refY - delta;
    await shoot(page, url, y, join(OUT, `${name}.${prefix}.png`));
  }
  await page.close();
  console.log(label, 'done');
}
await browser.close();
