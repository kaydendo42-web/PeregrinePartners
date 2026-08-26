/** Render the /platform social card to public/og-platform.png.
 *  Grabs the live isometric scene first so the card shows the real thing. */
import { copyFileSync, unlinkSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

copyFileSync('docs/research/og/card-platform.html', 'public/_og-platform.html');

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});

// 1. the scene
const scene = await b.newPage();
await scene.goto('http://localhost:3001/platform', { waitUntil: 'networkidle2', timeout: 120000 });
await scene.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const max = () => document.documentElement.scrollHeight - innerHeight;
  await new Promise((res) => { let y = 0; const t = setInterval(() => { y += 300; scrollTo(0, y); if (y >= max()) { clearInterval(t); res(); } }, 40); });
});
await new Promise((r) => setTimeout(r, 2000));
// the department cards are DOM siblings of the scene; hide them so the
// crop is the model on its own
await scene.evaluate(() => {
  const cards = document.querySelector('.floor__cards');
  if (cards) cards.style.visibility = 'hidden';
  document.querySelector('.floor__scene svg').scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 900));
// puppeteer clips in page coordinates, not viewport ones
const clip = await scene.evaluate(() => {
  const r = document.querySelector('.floor__scene svg').getBoundingClientRect();
  return {
    x: Math.round(r.x + scrollX + r.width * 0.12),
    y: Math.round(r.y + scrollY + r.height * 0.1),
    width: Math.round(r.width * 0.76),
    height: Math.round(r.height * 0.74),
  };
});
await scene.screenshot({ path: 'public/_og-floor.png', clip });
await scene.close();

// 2. the card
const card = await b.newPage();
await card.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await card.goto('http://localhost:3001/_og-platform.html', { waitUntil: 'networkidle2', timeout: 60000 });
await card.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 1200));
await card.screenshot({ path: 'public/og-platform.png' });
await card.close();
await b.close();
unlinkSync('public/_og-floor.png');
unlinkSync('public/_og-platform.html');
console.log('wrote public/og-platform.png');
