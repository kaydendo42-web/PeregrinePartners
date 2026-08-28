/** The Floor in the states the acceptance checks care about.
 *
 *   node docs/research/scratch/shoot-states.mjs
 *
 * Writes one PNG per state to docs/research/tiles/floor-<state>.png:
 * resting, a department selected (the only time accent appears), hovered, and
 * turned one quarter.
 */
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 300)}`); });

const nav = p.goto('http://localhost:3001/platform', { waitUntil: 'networkidle2', timeout: 120000 });
const wait = (ms) => p.evaluate((t) => new Promise((r) => setTimeout(r, t)), ms);
await nav;
// The curtain holds for 1150ms and fades for 620, so catch it mid-hold.
await wait(500);
await p.screenshot({ path: 'docs/research/tiles/floor-curtain.png' });
await wait(2500);
await p.screenshot({ path: 'docs/research/tiles/floor-rest.png' });

// Pick a department from the column, which selects it in the scene too.
const pick = async (name) => {
  const handle = await p.evaluateHandle((n) => {
    const el = [...document.querySelectorAll('.mv-floor-column button')]
      .find((b) => b.textContent.trim().startsWith(n));
    return el || null;
  }, name);
  const el = handle.asElement();
  if (el) await el.click();
};

await pick('Bookings');
await wait(1200);
await p.screenshot({ path: 'docs/research/tiles/floor-selected.png' });

// Step into the room, which is a camera move rather than a page.
await p.evaluate(() => {
  const back = [...document.querySelectorAll('.mv-floor-column button')]
    .find((b) => b.textContent.trim().startsWith('Back'));
  if (back) back.click();
});
await wait(600);
await p.evaluate(() => {
  const step = [...document.querySelectorAll('.mv-floor-column button')]
    .find((b) => b.textContent.trim().startsWith('Step inside'));
  step.click();
});
await wait(1400);
await p.screenshot({ path: 'docs/research/tiles/floor-inside.png' });

// Turning is a drag now, so drive it as one: press, move most of a quarter,
// release, and let it snap.
const stage = await p.evaluate(() => {
  const r = document.querySelector('.mv-floor-stage').getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await p.mouse.move(stage.cx, stage.cy);
await p.mouse.down();
for (let i = 1; i <= 8; i++) await p.mouse.move(stage.cx - i * 34, stage.cy);
await p.mouse.up();
await wait(1200);
await p.screenshot({ path: 'docs/research/tiles/floor-inside-turned.png' });

await p.evaluate(() => {
  const back = [...document.querySelectorAll('.mv-floor-column button')]
    .find((b) => b.textContent.trim().startsWith('Step back'));
  back.click();
});
await wait(1400);
await p.screenshot({ path: 'docs/research/tiles/floor-turned.png' });

console.log(errs.length ? errs.join('\n') : 'no errors');
await b.close();
