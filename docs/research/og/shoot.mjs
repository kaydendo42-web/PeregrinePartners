/**
 * Render the social card to public/og.png. Run with the dev server up:
 *   node docs/research/og/shoot.mjs
 * The card markup is staged into /public for the shot and removed again, so
 * nothing but the finished image ships.
 */
import { copyFileSync, unlinkSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

copyFileSync('docs/research/og/card.html', 'public/_og-card.html');
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
});
const p = await b.newPage();
await p.goto('http://localhost:3001/_og-card.html', { waitUntil: 'networkidle2', timeout: 60000 });
await p.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 1200));
await p.screenshot({ path: 'public/og.png' });
await b.close();
unlinkSync('public/_og-card.html');
console.log('wrote public/og.png');
