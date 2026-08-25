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
  await new Promise((res) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 700); y += 700; if (y >= document.body.scrollHeight) { clearInterval(t); res(); } }, 60); });
});
await new Promise(r => setTimeout(r, 2500));

const questions = [
  'What is the typical deployment timeline?',
  'Can we integrate with our existing CRM?',
  'Do you provide model fine-tuning?',
  'How do you calculate ROI for automation?',
  'Do we own the custom code you build?',
  'What models do you specialize in?',
];

const out = {};
for (const q of questions) {
  // click the real hit target: the focusable row wrapper carrying this heading
  const box = await p.evaluate((question) => {
    const h = [...document.querySelectorAll('h4')].find(x => x.textContent.trim() === question);
    if (!h) return null;
    let n = h;
    while (n && !(n.getAttribute && n.getAttribute('tabindex') === '0')) n = n.parentElement;
    const target = n || h;
    target.scrollIntoView({ block: 'center' });
    const r = target.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, q);
  if (!box) { out[q] = null; continue; }
  await new Promise(r => setTimeout(r, 400));
  await p.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 1100));
  out[q] = await p.evaluate((question) => {
    const h = [...document.querySelectorAll('h4')].find(x => x.textContent.trim() === question);
    if (!h) return null;
    // the answer is the nearest following paragraph inside the same row
    let n = h;
    while (n && !(n.getAttribute && n.getAttribute('tabindex') === '0')) n = n.parentElement;
    const row = n || h.parentElement;
    const ps = [...row.querySelectorAll('p')].map(x => x.textContent.trim()).filter(Boolean);
    return ps.length ? ps.join(' ') : null;
  }, q);
}
writeFileSync('docs/research/raw/faq.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await b.close();
