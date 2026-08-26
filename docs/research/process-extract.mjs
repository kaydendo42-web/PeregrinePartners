/**
 * The reference's process accordion only mounts a step's body once it is
 * expanded, so read the collapsed steps by clicking each one open.
 * Usage: node docs/research/process-extract.mjs
 */
import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
});
const p = await b.newPage();
await p.goto('https://spartanai.framer.website/', { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => {
  await new Promise((res) => {
    let y = 0;
    const t = setInterval(() => {
      window.scrollBy(0, 700); y += 700;
      if (y >= document.body.scrollHeight) { clearInterval(t); res(); }
    }, 60);
  });
});
await new Promise((r) => setTimeout(r, 2500));

const titles = [
  'Comprehensive Strategic Audit',
  'Custom Architecture Design',
  'Rapid Prototype Development',
  'Enterprise Scale Deployment',
];

// Climb from the title until the node is as wide as the accordion row (950px).
const ROW = `(title) => {
  const el = [...document.querySelectorAll('p')].find(x => x.textContent.trim() === title);
  if (!el) return null;
  let n = el;
  while (n && n.getBoundingClientRect().width < 900) n = n.parentElement;
  return n;
}`;

const out = {};
for (const t of titles) {
  const box = await p.evaluate((title, src) => {
    const row = eval(src)(title);
    if (!row) return null;
    row.scrollIntoView({ block: 'center' });
    const r = row.getBoundingClientRect();
    return { x: r.x + 200, y: r.y + 24, w: Math.round(r.width) };
  }, t, ROW);
  if (!box) { out[t] = null; continue; }
  await new Promise((r) => setTimeout(r, 500));
  await p.mouse.click(box.x, box.y);
  await new Promise((r) => setTimeout(r, 1300));
  out[t] = await p.evaluate((title, src) => {
    const row = eval(src)(title);
    if (!row) return null;
    const parts = [...row.querySelectorAll('p')].map((x) => {
      const cs = getComputedStyle(x);
      const r = x.getBoundingClientRect();
      return {
        text: x.textContent.trim(),
        fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, color: cs.color,
        w: Math.round(r.width), h: Math.round(r.height),
      };
    }).filter((x) => x.text);
    return { rowW: Math.round(row.getBoundingClientRect().width), h: Math.round(row.getBoundingClientRect().height), parts };
  }, t, ROW);
}
writeFileSync('docs/research/raw/process.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await b.close();
