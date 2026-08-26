/**
 * Shrink the transferred assets to what the page actually renders.
 *
 * The source project served every asset at full resolution — a 3776px-wide
 * footer photograph for a 1440px slot, a 4MB clip for a 308px card — which
 * put the home page at 25MB. Framer's own CDN was resizing these on the way
 * out; a plain /public directory does not, so do it here instead.
 *
 * Targets come from the measured render sizes in the local capture, doubled
 * for retina. Nothing is upscaled. Originals stay recoverable from git.
 *
 * One asset was also re-encoded by hand: the footer photograph shipped as a
 * fully opaque PNG, which is a 1.2MB way of storing a JPEG. It is now
 * v2cZIMtgjEII7EpDnUDGGgCyuiQ.jpg. Any other PNG that turns out to be
 * opaque and heavy deserves the same treatment.
 *
 *   node docs/research/optimise-assets.mjs [--dry]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const DIR = 'public/assets';
const DRY = process.argv.includes('--dry');
const FALLBACK = 1600; // for assets the capture never saw

// Largest rendered box per asset, from the measurement.
const rendered = new Map();
for (const f of ['docs/research/local/measure-1440.json']) {
  for (const o of JSON.parse(readFileSync(f, 'utf8')).items) {
    const src = String(o.src || '');
    if (!src.includes('/assets/')) continue;
    const name = src.split('/assets/').pop();
    const prev = rendered.get(name) || 0;
    rendered.set(name, Math.max(prev, o.w, o.h));
  }
}

const kb = (n) => `${Math.round(n / 1024)}KB`;
let before = 0;
let after = 0;

const HANDLED = /\.(jpe?g|png|mp4)$/i;

for (const name of readdirSync(DIR).sort()) {
  if (!HANDLED.test(name)) continue; // svgs and anything else pass through
  const path = join(DIR, name);
  const size = statSync(path).size;
  before += size;
  const target = Math.round((rendered.get(name) || FALLBACK / 2) * 2);

  if (name.endsWith('.mp4')) {
    // 308x220 in the hero card; 640 wide is generous for it.
    if (!DRY) {
      execFileSync('ffmpeg', [
        '-y', '-loglevel', 'error', '-i', path,
        '-vf', 'scale=640:-2', '-c:v', 'libx264', '-crf', '30',
        '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        '-an', path + '.tmp.mp4',
      ]);
      execFileSync('mv', [path + '.tmp.mp4', path]);
    }
  } else {
    if (!DRY) {
      execFileSync('python3', ['docs/research/_resize.py', path, String(target)]);
    }
  }

  const now = statSync(path).size;
  after += now;
  if (now !== size) {
    console.log(`${name.padEnd(34)} ${kb(size).padStart(8)} -> ${kb(now).padStart(8)}  (max ${target}px)`);
  }
}
console.log(`\ntotal ${kb(before)} -> ${kb(after)}`);
