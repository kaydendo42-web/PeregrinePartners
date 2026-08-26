import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const URL = 'http://localhost:3001/';
const OUT = process.argv[2] || 'docs/research/local';
mkdirSync(OUT, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 } });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 });
// autoscroll to trigger entrance animations
// Walk to the true bottom. Two traps here: `document.body.scrollHeight`
// under-reports this layout, and `scroll-behavior: smooth` makes scrollBy
// animate, so a loop that reads scrollY back sees no movement. Force instant
// scrolling and drive absolute offsets. Stopping short would leave every
// scroll-triggered reveal below that point captured in its hidden state.
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
await new Promise(r => setTimeout(r, 3000));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1200));

const data = await page.evaluate(() => {
  const out = [];
  const all = document.querySelectorAll('body *');
  for (const e of all) {
    const r = e.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) continue;
    const cs = getComputedStyle(e);
    const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join(' ');
    const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const hasBorder = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0;
    const isImg = e.tagName === 'IMG' || e.tagName === 'VIDEO' || e.tagName === 'svg';
    if (!own && !hasBg && !hasBorder && !isImg) continue;
    const o = {
      tag: e.tagName.toLowerCase(),
      name: e.getAttribute('data-framer-name') || undefined,
      y: Math.round(r.top + scrollY), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
    };
    if (own) {
      o.text = own.slice(0, 200);
      o.font = cs.fontFamily.split(',')[0].replace(/"/g, '');
      o.fs = cs.fontSize; o.fw = cs.fontWeight; o.lh = cs.lineHeight; o.ls = cs.letterSpacing;
      o.color = cs.color;
      if (cs.textTransform !== 'none') o.tt = cs.textTransform;
      if (cs.textAlign !== 'start') o.ta = cs.textAlign;
    }
    if (hasBg) o.bg = cs.backgroundColor;
    if (cs.borderRadius !== '0px') o.br = cs.borderRadius;
    if (hasBorder) o.bd = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
    if (cs.padding !== '0px') o.pad = cs.padding;
    if (cs.display !== 'block' && cs.display !== 'inline') o.disp = cs.display;
    if (o.disp === 'flex' || o.disp === 'grid') { o.fd = cs.flexDirection; o.jc = cs.justifyContent; o.ai = cs.alignItems; o.gap = cs.gap; if (cs.gridTemplateColumns !== 'none') o.gtc = cs.gridTemplateColumns; }
    if (cs.transform !== 'none') o.tf = cs.transform;
    if (cs.opacity !== '1') o.op = cs.opacity;
    if (cs.boxShadow !== 'none') o.shadow = cs.boxShadow;
    if (cs.backdropFilter !== 'none') o.bdf = cs.backdropFilter;
    if (cs.position !== 'static') o.pos = cs.position;
    if (cs.overflow !== 'visible') o.ov = cs.overflow;
    if (cs.transitionDuration !== '0s') o.trans = `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`;
    if (e.tagName === 'IMG') { o.src = e.currentSrc || e.src; o.alt = e.alt; o.fit = cs.objectFit; }
    if (e.tagName === 'VIDEO') { o.src = e.currentSrc || e.src; }
    if (e.tagName === 'svg') { o.svgw = e.getAttribute('viewBox'); o.svg = e.outerHTML.slice(0, 3000); }
    out.push(o);
  }
  return { docHeight: document.body.scrollHeight, vw: innerWidth, items: out };
});
writeFileSync(join(OUT, 'measure-1440.json'), JSON.stringify(data, null, 1));
console.log('items', data.items.length, 'docH', data.docHeight);

// section screenshots every 900px
const H = data.docHeight;
mkdirSync(join(OUT, 'shots'), { recursive: true });
for (let y = 0, i = 0; y < H; y += 900, i++) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: join(OUT, 'shots', `y${String(y).padStart(5, '0')}.png`) });
}
await browser.close();
console.log('done');
