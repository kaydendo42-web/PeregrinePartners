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
  // GPU rasterisation is not bit-deterministic run to run and left a few
  // stray pixels of antialiasing noise even with the SMIL waiter parked and
  // every CSS transition frozen. Software rasterisation closes it.
  args: ['--disable-gpu', '--force-color-profile=srgb'],
});
const p = await b.newPage();
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

/* Console error signatures that are pre-existing, out of this plan's scope,
 * and already tracked as their own piece of work. Matched on the exact
 * first line, not a prefix, so a second hydration bug that happens to open
 * with the same words still fails the run. The goal is an empty array. */
const KNOWN = [
  {
    firstLine:
      "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:",
    note:
      "components/departments.tsx's BranchArt (a Framer Motion motion.path with a pathLength prop) disagrees between server and client markup. Only fires under prefers-reduced-motion, which this harness emulates. Nothing to do with the Floor; reported separately.",
  },
];

const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)));

await p.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 });
// The cold open runs 2.5s before the scene is on screen.
await p.waitForSelector('.floor__isle', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 3500));

// Only now, with the cold open finished and the floor on screen, freeze
// every animation and transition and wait for fonts to settle. Injecting
// any earlier would skip the boot sequence's own reveal instead of just
// making the shots reproducible.
await p.addStyleTag({
  content:
    '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }',
});
await p.evaluate(() => document.fonts.ready);

const scene = await p.$('.floor__stage');
if (!scene) { console.log('FAIL: no .floor__stage'); process.exit(1); }

/* --- the edge guard --------------------------------------------------- */
/* Everything drawn inside an island must sit within that island's top face,
 * a diamond in screen space (an axis-aligned square in the scene's own u/v
 * grid, mapped through the isometric projection). A bounding-box-vs-bounding-
 * box test cannot see an escape on one axis alone, because the diamond's
 * lowest screen point is where u+v is greatest, not where either axis alone
 * is greatest — so this is a real point-in-quadrilateral test against the
 * island top face's actual four vertices, not its bounding box.
 *
 * The point tested is a prop's ground contact: the bounding box of everything
 * in it except its <text> descendants (every desk carries a label under it by
 * design, and that would offset every measurement identically and hide the
 * signal), reduced to that box's bottom-centre point. The label and the
 * waiting flag hang off the island on purpose and are exempt outright.
 */
/* These hang off the island on purpose. The name plate is the island's caption:
   it sits past the front edge so it reads as a label on the object rather than
   as a panel over it, and its underline rule is a <line>, which the ground
   contact test would otherwise measure. */
const EXEMPT = ['floor__isle-label', 'floor__isle-plate', 'floor__isle-flag', 'floor__stair'];
const TOLERANCE = 2; // px, in the polygon's favour
const escapes = await p.evaluate((exempt, tol) => {
  const out = [];

  function quadFor(topPath) {
    // .floor__isle-top's `d` is always "M x y L x y L x y L x y Z" (n e s w),
    // written by topFace() in agent-floor.tsx. Parse the four local-space
    // vertices and map them through the element's own screen CTM, so the
    // department-open zoom transform on an ancestor <g> is accounted for
    // exactly like it is for any other element's getBoundingClientRect().
    const nums = (topPath.getAttribute('d').match(/-?[\d.]+/g) || []).map(Number);
    const ctm = topPath.getScreenCTM();
    const local = [0, 1, 2, 3].map((i) => ({ x: nums[i * 2], y: nums[i * 2 + 1] }));
    return local.map((pt) => new DOMPoint(pt.x, pt.y).matrixTransform(ctm));
  }

  // Signed distance (px) from a point to a convex quad's boundary, negative
  // outside. Winding of [n, e, s, w] is consistent for every island (same
  // topFace() call shape), so one sign convention holds for all of them.
  function outsideBy(pt, quad) {
    let min = Infinity;
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const c = quad[(i + 1) % 4];
      const ex = c.x - a.x, ey = c.y - a.y;
      const vx = pt.x - a.x, vy = pt.y - a.y;
      const cross = ex * vy - ey * vx;
      const len = Math.hypot(ex, ey) || 1;
      min = Math.min(min, cross / len);
    }
    return min < 0 ? -min : 0;
  }

  // A prop's footprint on the ground: every geometry primitive it contains,
  // its own <text> label excluded, unioned and collapsed to the bottom-centre
  // point of that union. <g> wrappers are skipped deliberately — a <g> that
  // wraps a label would smuggle the label's extent back in through its own
  // bounding box even though the label itself is excluded from the list.
  function groundContact(group) {
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity, any = false;
    group.querySelectorAll('rect, circle, ellipse, line, path, polygon, polyline').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      any = true;
      if (r.left < minX) minX = r.left;
      if (r.right > maxX) maxX = r.right;
      if (r.bottom > maxY) maxY = r.bottom;
    });
    return any ? { x: (minX + maxX) / 2, y: maxY } : null;
  }

  document.querySelectorAll('.floor__isle').forEach((isle) => {
    const top = isle.querySelector('.floor__isle-top');
    if (!top) return;
    const quad = quadFor(top);
    const label = isle.querySelector('.floor__isle-label');
    const name = (label?.textContent || '(unnamed)')
      .trim()
      .replace(/\s*·\s*OURS$/i, '')
      .toLowerCase();
    isle.querySelectorAll(':scope > g, :scope > rect, :scope > circle').forEach((child) => {
      if (exempt.some((c) => child.classList.contains(c))) return;
      const contact = groundContact(child);
      if (!contact) return;
      const by = outsideBy(contact, quad);
      if (by > tol) {
        out.push({ dept: name, cls: child.getAttribute('class') || child.tagName, by: Math.round(by) });
      }
    });
  });
  return out;
}, EXEMPT, TOLERANCE);

/* --- the shots --------------------------------------------------------- */
// The venue's serving waiter (.floor__vstaff--walk) moves on a native SVG
// <animateMotion>, a SMIL timeline the "animation: none" stylesheet above
// cannot touch (SMIL is not CSS) and that the component's own reduced-motion
// checks never gate. Left alone it keeps circling the floor on real elapsed
// time, so two runs land it at different points on its path and the venue
// shot is the one screenshot that never reproduces. Pausing that timeline and
// resetting it to t=0 before every shot parks the waiter at the same point
// every time. Scoped to .floor__stage svg specifically: the page carries nine
// <svg> elements once Departments' icons and the footer's are counted, each
// apparently running its own independent SMIL clock, and pausing the wrong
// one (document.querySelector('svg') grabs whichever sorts first, not
// necessarily the Floor's) silently does nothing.
async function freezeSmil() {
  await p.evaluate(() => {
    const svg = document.querySelector('.floor__stage svg');
    if (svg && typeof svg.pauseAnimations === 'function') {
      svg.pauseAnimations();
      svg.setCurrentTime(0);
    }
  });
}

async function shot(name) {
  await freezeSmil();
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

const unknown = [];
for (const e of errs) {
  const firstLine = e.split('\n')[0];
  const known = KNOWN.find((k) => k.firstLine === firstLine);
  if (known) console.log(`WARNING (known, pre-existing): ${firstLine}`);
  else unknown.push(e);
}
if (unknown.length) {
  console.log('CONSOLE ERRORS:');
  unknown.forEach((e) => console.log('  ' + e.split('\n')[0].slice(0, 200)));
  fail = true;
}

if (escapes.length) {
  console.log('\nOFF-ISLAND:');
  escapes.forEach((e) => console.log(`  ${e.dept}  ${e.cls}  ${e.by}px outside`));
  fail = true;
} else console.log('\nedge guard: PASS');
console.log(`shots written to ${OUT}`);
process.exit(fail ? 1 : 0);
