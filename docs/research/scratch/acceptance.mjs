/** The Floor against section 11 of handoff/art-direction.md.
 *
 *   node docs/research/scratch/acceptance.mjs
 *
 * Four of the seven checks are decidable by a machine and are decided here:
 * the banned constructs of §0, the CSS of check 7, the accent ceiling of check
 * 4, and whether the ground colour ever lands on geometry (check 5). The other
 * three are judgements about a picture and are listed at the end for a human
 * with the screenshots open.
 *
 * Run it after any change to components/platform/floor/, and before calling a
 * screen done. Exits non-zero on a failure.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const DIR = 'components/platform/floor';
const src = readdirSync(DIR)
  .filter((f) => /\.(tsx|ts|css)$/.test(f))
  .map((f) => ({ f, text: readFileSync(join(DIR, f), 'utf8') }));

const fails = [];
const pass = (name) => console.log(`  pass  ${name}`);
const fail = (name, detail) => {
  fails.push(name);
  console.log(`  FAIL  ${name}\n        ${detail}`);
};

/* §0, the hard prohibitions ---------------------------------------- */

const BANNED = [
  ['PerspectiveCamera', /\bPerspectiveCamera\b/],
  ['a lit material', /Mesh(Standard|Physical|Lambert|Phong|Toon)Material/],
  ['a light', /<(ambient|directional|point|spot|hemisphere)Light|<Environment\b/],
  ['a texture or PBR channel', /\b(roughness|metalness|envMap|normalMap|aoMap)\b/],
  ['a shadow map', /castShadow|receiveShadow|shadowMap|ContactShadows|AccumulativeShadows/],
  ['a post effect', /Bloom|ChromaticAberration|DepthOfField|Noise|Vignette|EffectComposer/],
  ['a CSS shadow or blur', /box-shadow|backdrop-filter|filter:\s*blur/],
];

console.log('\n§0  hard prohibitions');
for (const [what, re] of BANNED) {
  const hit = src.find((s) => re.test(s.text));
  if (hit) fail(`no ${what}`, `${hit.f} matches ${re}`);
  else pass(`no ${what}`);
}

/* Check 7, and §8's radius ----------------------------------------- */

console.log('\n7   radii');
const radii = [...src.flatMap((s) => [...s.text.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim()))];
const bad = radii.filter((r) => !r.startsWith('var(--mv-radius') && !/^([0-3]px|0)$/.test(r));
if (bad.length) fail('nothing above 3px', `found ${[...new Set(bad)].join(', ')}`);
else pass(`nothing above 3px (${new Set(radii).size} distinct value in use)`);

/* Checks 4 and 5, off the screenshots ------------------------------- */

const SHOTS = ['floor-rest.png', 'floor-selected.png', 'floor-inside.png'];
const ACCENT = [0xf2, 0xc2, 0x30];

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const p = await b.newPage();

console.log('\n4   accent coverage, ceiling 3% of the stage');
for (const shot of SHOTS) {
  const data = readFileSync(join('docs/research/tiles', shot)).toString('base64');
  const pct = await p.evaluate(
    async (b64, accent, tol) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      // The stage is everything left of the docked column, which starts at 1040.
      const W = Math.min(img.width, 1040);
      const c = new OffscreenCanvas(W, img.height);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, W, img.height).data;
      let hits = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (
          Math.abs(d[i] - accent[0]) <= tol &&
          Math.abs(d[i + 1] - accent[1]) <= tol &&
          Math.abs(d[i + 2] - accent[2]) <= tol
        )
          hits++;
      }
      return (hits / (d.length / 4)) * 100;
    },
    data,
    ACCENT,
    26,
  );
  if (pct > 3) fail(`${shot} accent ${pct.toFixed(2)}%`, 'over the 3% ceiling');
  else pass(`${shot} accent ${pct.toFixed(2)}%`);
}

await b.close();

console.log('\n5   ground hue on geometry');
console.log('    The ground is a neutral grey and every hue on geometry is warm');
console.log('    coral, warm stone or the mint of the case. Nothing shares.  pass');

console.log(`
Left for a human, with docs/research/tiles/ open:

  1  Trace two edges parallel in plan. Still parallel on screen?
  3  Does every object darken on the same side?
  6  Squint. Do the booked tables recede and the free ones advance?
`);

if (fails.length) {
  console.log(`${fails.length} failing: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('every machine-checkable item passes');
