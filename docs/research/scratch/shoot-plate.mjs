/** Render the resting Floor to the still a phone is served instead of it.
 *
 *   node docs/research/scratch/shoot-plate.mjs
 *
 * Writes public/floor-plate.png. Re-run whenever the scene changes: the plate
 * is a render of this scene and nothing else, and the two drifting apart is
 * the only way this can be wrong.
 */
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage();
// 900 square once the docked column is taken off, which at 1.5x is 1350px:
// enough for a 390px phone at 3x and no more.
await p.setViewport({ width: 1300, height: 900, deviceScaleFactor: 1.5 });
await p.goto('http://localhost:3001/platform', { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(() => new Promise((r) => setTimeout(r, 3000)));

// Everything that is chrome rather than model has to come off first: the
// element screenshot composites whatever is behind and in front of the canvas,
// so the nav pill, the floor's own controls and the sky all end up baked in.
await p.evaluate(() => {
  // Anything pinned to the viewport is site chrome, not model.
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.mv-floor-stage')) continue;
    if (getComputedStyle(el).position === 'fixed') el.style.display = 'none';
  }
  document.querySelector('.mv-floor-controls').style.display = 'none';
  // The dev overlay is a custom element outside the React tree and does not
  // exist in a production build, so it only has to come off here.
  document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
});
await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));

const el = await p.$('.mv-floor-stage canvas');
// The plate carries its own sky rather than being cut out. An element
// screenshot composites the whole page region, not an isolated layer, so
// there is no transparent version of this to have: what there is instead is a
// picture whose gradient is the same one the stage paints at any other width.
await el.screenshot({ path: 'public/floor-plate.png' });
console.log('public/floor-plate.png written');
await b.close();
