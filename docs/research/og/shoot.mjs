/**
 * Render the social card to public/og.png. Run with the dev server up:
 *   node docs/research/og/shoot.mjs
 *
 * The card is the landing page itself, shot at exactly the 1200x630 the
 * metadata declares, so the preview can never drift from the hero the way a
 * hand-built card does. `docs/research/og/card.html` was that hand-built card
 * and is no longer what ships.
 *
 * Two things have to come off the shot. The Next dev-tools badge sits bottom
 * left in a `nextjs-portal`, and the hero's reveal animations have to be given
 * time to land, or the headline shoots half faded.
 */
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
});
const p = await b.newPage();

const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
p.on('requestfailed', (r) => errs.push(`request failed: ${r.url().slice(0, 140)}`));

await p.goto('http://localhost:3001/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.addStyleTag({ content: 'nextjs-portal, #__next-build-watcher { display: none !important; }' });
await p.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 2000));
await p.screenshot({ path: 'public/og.png' });
await b.close();

if (errs.length) {
  console.log('page reported:');
  for (const e of errs) console.log(`  ${e}`);
}
console.log('wrote public/og.png');
