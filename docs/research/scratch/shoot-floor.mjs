/** One shot of the Floor at a given viewport, with WebGL forced on.
 *
 *   node docs/research/scratch/shoot-floor.mjs [width] [height] [out.png]
 *
 * Headless Chrome falls back to SwiftShader for WebGL, which renders the scene
 * correctly and slowly. That is fine: this is a still, and the acceptance
 * checks in handoff/art-direction.md §11 are run against a still.
 */
import puppeteer from 'puppeteer-core';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const OUT = process.argv[4] || 'docs/research/tiles/floor.png';

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage();
await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 300)}`); });

await p.goto('http://localhost:3001/platform', { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
await p.screenshot({ path: OUT });

const canvas = await p.evaluate(() => {
  const c = document.querySelector('canvas');
  return c ? { w: c.width, h: c.height, ctx: !!c.getContext('webgl2') } : null;
});
console.log(OUT, W + 'x' + H, 'canvas:', JSON.stringify(canvas));
console.log(errs.length ? errs.join('\n') : 'no errors');
await b.close();
