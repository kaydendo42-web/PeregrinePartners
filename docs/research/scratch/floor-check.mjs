/** The Floor's gate: shoot every state, and assert nothing hangs off an island.
 *
 *   node docs/research/scratch/floor-check.mjs [url] [outdir]
 *   node docs/research/scratch/floor-check.mjs --compare <dirA> <dirB>
 *
 * Reduced motion is emulated so the ambient rAF loop parks and the shots are
 * reproducible. The boot sequence is waited out rather than disabled.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (process.argv[2] === '--compare') {
  const [a, b] = [process.argv[3], process.argv[4]];
  const sum = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
  const names = readdirSync(a).filter((n) => n.endsWith('.png')).sort();
  let bad = 0;
  for (const n of names) {
    const [x, y] = [sum(join(a, n)), sum(join(b, n))];
    if (x !== y) { console.log(`DIFF  ${n}`); bad++; }
    else console.log(`same  ${n}`);
  }
  console.log(bad ? `\nFAIL: ${bad} of ${names.length} differ` : `\nPASS: ${names.length} identical`);
  process.exit(bad ? 1 : 0);
}

const URL = process.argv[2] || 'http://localhost:3000/platform';
const OUT = process.argv[3] || 'docs/research/scratch/floor-shots/current';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const p = await b.newPage();
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 200)));

await p.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 });
// The cold open runs 2.5s before the scene is on screen.
await p.waitForSelector('.floor__isle', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 3500));

const scene = await p.$('.floor__stage');
if (!scene) { console.log('FAIL: no .floor__stage'); process.exit(1); }

/* --- the edge guard --------------------------------------------------- */
/* Everything drawn inside an island must sit within that island's top face.
   The label and the waiting flag hang off it on purpose and are exempt.
   .floor__isle carries no data-dept of its own (only the accessible
   .floor__card controls do), so the island's name is read off its own
   label text instead. */
const EXEMPT = ['floor__isle-label', 'floor__isle-flag'];
const escapes = await p.evaluate((exempt) => {
  const out = [];
  document.querySelectorAll('.floor__isle').forEach((isle) => {
    const top = isle.querySelector('.floor__isle-top');
    if (!top) return;
    const t = top.getBoundingClientRect();
    const label = isle.querySelector('.floor__isle-label');
    const name = (label?.textContent || isle.getAttribute('data-dept') || '(unnamed)')
      .trim()
      .replace(/\s*·\s*OURS$/i, '')
      .toLowerCase();
    isle.querySelectorAll(':scope > g, :scope > rect, :scope > circle').forEach((child) => {
      if (exempt.some((c) => child.classList.contains(c))) return;
      const r = child.getBoundingClientRect();
      if (!r.width && !r.height) return;
      // The top face is a diamond and getBoundingClientRect is axis aligned, so
      // a prop legitimately near the west or east vertex sits outside the box on
      // that axis. Only the front edge is checked, which is the real bug: a
      // sitter drawn past the bottom of the plinth, hanging over the ground.
      if (r.bottom > t.bottom + 4) {
        out.push({ dept: name, cls: child.getAttribute('class') || child.tagName,
                   childBottom: Math.round(r.bottom), islandBottom: Math.round(t.bottom),
                   over: Math.round(r.bottom - t.bottom) });
      }
    });
  });
  return out;
}, EXEMPT);

/* --- the shots --------------------------------------------------------- */
async function shot(name) {
  await new Promise((r) => setTimeout(r, 700));
  await scene.screenshot({ path: join(OUT, `${name}.png`) });
}

await shot('idle');

const depts = await p.$$eval('.floor__reach button[data-dept]', (bs) =>
  bs.map((x) => x.getAttribute('data-dept')));
// Before Task 3 the reach list does not exist; fall back to the cards.
const ids = depts.length
  ? depts
  : await p.$$eval('.floor__card[data-dept]', (bs) => bs.map((x) => x.getAttribute('data-dept')));

// The reach list is 1px and clip-path'd, so puppeteer will not click it as a
// pointer would. Dispatch the click from inside the page instead. That is the
// right call for this list specifically: it exists for keyboard and assistive
// readers, and the human focus route is checked by hand in Task 3.
const press = (sel) => p.$eval(sel, (el) => el.click());

for (const id of ids) {
  const sel = depts.length
    ? `.floor__reach button[data-dept="${id}"]`
    : `.floor__card[data-dept="${id}"]`;
  await press(sel);
  await shot(id);
  // Back out, so each shot starts from the same place.
  const back = await p.$('.floor__panel-back');
  if (back) await back.evaluate((el) => el.click());
  else await press(sel);
}

await b.close();

/* --- the verdict ------------------------------------------------------- */
let fail = false;
if (errs.length) { console.log('CONSOLE ERRORS:'); errs.forEach((e) => console.log('  ' + e)); fail = true; }
if (escapes.length) {
  console.log('\nOFF-ISLAND:');
  escapes.forEach((e) => console.log(`  ${e.dept}  ${e.cls}  childBottom=${e.childBottom}  islandBottom=${e.islandBottom}  over=${e.over}`));
  fail = true;
} else console.log('\nedge guard: PASS');
console.log(`shots written to ${OUT}`);
process.exit(fail ? 1 : 0);
