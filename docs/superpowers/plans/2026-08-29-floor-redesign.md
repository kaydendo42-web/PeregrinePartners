# The Floor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/platform`'s Floor from six identical islands under six floating
cards into six distinguishable departments the reader clicks directly, with the
side panel taking on the opened department's identity.

**Architecture:** `components/platform/agent-floor.tsx` (1700 lines) splits into
`components/platform/scene/`. The generated geometry (one size, one height, one
desk grid, applied six times) is replaced by composed per-department data:
explicit footprint, plinth height, stair, vertical, prop layout and hue. The
floating cards are hidden above 810px and their job moves onto the islands
themselves, with a visually hidden button list carrying keyboard and assistive
access. Colour arrives as one saturation variable driven by two CSS rules.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, plain CSS in
`app/platform.css`, hand-written isometric SVG. `motion` is used elsewhere in
the file but no new motion is added. Verification is puppeteer-core through
`docs/research/`, not a unit test runner.

**Spec:** `docs/superpowers/specs/2026-08-29-floor-redesign-design.md`

## Global Constraints

Copied verbatim from `CLAUDE.md` and the spec. Every task's requirements
implicitly include this section.

- **This project has no unit test runner.** There is no `jest`, `vitest` or
  `test` script. Do not add one. Verification is `npm run build`, `npx eslint`,
  and the puppeteer harness built in Task 1.
- **Hue is department identity and never task state.** The three states (Needs
  you / Watching / Done) stay told apart by weight and fill, never by colour, on
  both the scene and the phone cards.
- **Never claim a department count.** Do not write "six departments" into any
  user-visible string.
- **No em dashes** in any user-visible copy.
- **Do not edit `lib/content.ts`** in this plan. No task needs it.
- **The phone cards must not change.** Below 810px `.floor__cards` renders
  exactly as it does today, through all eight tasks.
- **`ISLE_LIFT` is deleted, not defaulted.** A department missing `lift` must be
  a TypeScript error, never a silent 18.
- **`components/platform/floor/` is forbidden as a path.** It held the deleted
  react-three-fiber build; reusing it corrupts the git record. Use
  `components/platform/scene/`.
- The dev server runs on **port 3000** (`npm run dev`). Several scripts in
  `docs/research/` default to 3001, so always pass the URL explicitly.
- Design tokens are measured, not eyeballed. Where this plan states a colour
  lightness, confirm it with `getComputedStyle` before committing and use what
  comes back.

---

### Task 1: The check harness

Nothing can be verified until there is something to verify with. This task
builds the only gate the rest of the plan has, and captures the baseline that
Task 2 must reproduce exactly.

**Files:**
- Create: `docs/research/scratch/floor-check.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `node docs/research/scratch/floor-check.mjs <url> <outdir>` which
  writes nine PNGs (`idle`, one per department, `venue`) into `<outdir>` and
  runs the edge guard, exiting non-zero on failure. And
  `node docs/research/scratch/floor-check.mjs --compare <dirA> <dirB>` which
  sha256s matching filenames and exits non-zero on any difference.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Leave it running. Every later step assumes `http://localhost:3000` is up.

- [ ] **Step 2: Write the harness**

Create `docs/research/scratch/floor-check.mjs`:

```js
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
   The label and the waiting flag hang off it on purpose and are exempt. */
const EXEMPT = ['floor__isle-label', 'floor__isle-flag'];
const escapes = await p.evaluate((exempt) => {
  const out = [];
  document.querySelectorAll('.floor__isle').forEach((isle) => {
    const top = isle.querySelector('.floor__isle-top');
    if (!top) return;
    const t = top.getBoundingClientRect();
    const name = isle.getAttribute('data-dept') || '(unnamed)';
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
  escapes.forEach((e) => console.log(`  ${e.dept}  ${e.cls}  child=${e.child}  island=${e.island}`));
  fail = true;
} else console.log('\nedge guard: PASS');
console.log(`shots written to ${OUT}`);
process.exit(fail ? 1 : 0);
```

- [ ] **Step 3: Run it and read the failure**

```bash
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/baseline
```

Expected: the edge guard **FAILS**, naming `bookings` twice: it is the only
department that escapes, and it does so on both desks of its last row. That is
the bug from the spec, and this is the proof it is real. If the guard passes,
stop and investigate before going further, because the guard is wrong.

Bookings is `size` 2.9 with six desks, so `deskSpots()` puts its last row at
`2.9 x 0.82 = 2.378` and `Desk` draws the sitter `0.72` further toward the
camera, landing at `3.098` against a 2.9 bound. Marketing has four desks, so its
last row lands at `1.704` and clears by `0.696`.

- [ ] **Step 4: Record the known failures**

Note the exact `OFF-ISLAND` lines in the commit message. Task 4 must clear them.

- [ ] **Step 5: Commit**

```bash
git add docs/research/scratch/floor-check.mjs
git commit -m "Add the Floor's check harness

Shoots every state of the scene at 1440 with reduced motion emulated,
and asserts that everything drawn inside an island sits within that
island's top face. The label and the waiting flag are exempt, because
they hang off it on purpose.

It fails today on bookings and marketing, which is the point: the last
row of desks puts its sitter past the plinth edge."
```

---

### Task 2: Split the file, change nothing

**Files:**
- Create: `components/platform/scene/geometry.ts`
- Create: `components/platform/scene/data.ts`
- Create: `components/platform/scene/props.tsx`
- Create: `components/platform/scene/island.tsx`
- Create: `components/platform/scene/venue.tsx`
- Modify: `components/platform/agent-floor.tsx` (down to roughly 600 lines)

**Interfaces:**
- Consumes: nothing from Task 1 except the harness command.
- Produces, all named exports:
  - `scene/geometry.ts`: `S`, `KX`, `KY`, `px(u,v)`, `topFace(u,v,a,b,h)`,
    `sideFaces(u,v,a,b,h)`, `HUB`, `ISLE_LIFT`, `VIEW`, `ZOOM`, `walkway(d)`,
    `deskSpots(d)`, `zoomTransform(d)`
  - `scene/data.ts`: types `TaskState`, `Task`, `Dept`, `Seating`, `Enquiry`,
    `TableState`; values `DEPTS`, `ALL_TASKS`, `SEATINGS`, `SEATS_IN_ROOM`,
    `COVERS_TONIGHT`, `ENQUIRIES`, `TABLES`, `OPEN`, `CLOSE`, `TURN`,
    `clock(m)`, `tableState(id, now)`
  - `scene/props.tsx`: `JACKETS`, `Desk`, `Plant`, `Hub`
  - `scene/island.tsx`: `Island`
  - `scene/venue.tsx`: `VenueTable`, `VenueScene`
  - `agent-floor.tsx` keeps `TaskRow`, `StackRow`, `AgentFloor`

This is a pure move. **No behaviour, no markup and no styling changes.** Every
line lands in a new file byte for byte apart from the `import` and `export`
keywords the move requires.

- [ ] **Step 1: Cut geometry**

Move lines 24 to 56 of `agent-floor.tsx` (the `Geometry` banner comment through
the end of `sideFaces`) plus lines 587 to 641 (the `Scene constants` banner
through the end of `zoomTransform`) into `components/platform/scene/geometry.ts`.

Add `export` to: `S`, `KX`, `KY`, `px`, `topFace`, `sideFaces`, `HUB`,
`ISLE_LIFT`, `VIEW`, `ZOOM`, `walkway`, `deskSpots`, `zoomTransform`.

`walkway`, `deskSpots` and `zoomTransform` take a `Dept`, so add at the top:

```ts
import type { Dept } from "./data";
```

This file has no `"use client"` and no JSX. It is plain TypeScript.

- [ ] **Step 2: Cut the data**

Move into `components/platform/scene/data.ts`:
- lines 57 to 93 (`TaskState`, `Task`, `Dept`)
- lines 94 to 236 (the `Inside the venue` banner through `tableState`)
- lines 238 to 584 (`DEPTS`)
- line 585 (`ALL_TASKS`)

Export every one of them. No `"use client"`. No JSX. Nothing imported.

- [ ] **Step 3: Cut the furniture**

Move into `components/platform/scene/props.tsx`:
- lines 643 to 723 (`JACKETS`, `Desk`, `Plant`)
- lines 769 to 857 (`Hub`)

Header:

```tsx
import { px, topFace, sideFaces, HUB } from "./geometry";
```

Export `JACKETS`, `Desk`, `Plant`, `Hub`. `Hub` reads `HUB.size` and `HUB.lift`
from geometry. No `"use client"` is needed: this file has no hooks and is only
ever rendered by a client component.

- [ ] **Step 4: Cut the island**

Move lines 724 to 768 (`Island`) into `components/platform/scene/island.tsx`.

```tsx
import type { Dept } from "./data";
import { px, topFace, sideFaces, ISLE_LIFT } from "./geometry";
import { Desk, Plant } from "./props";
import { deskSpots } from "./geometry";
```

Export `Island`.

- [ ] **Step 5: Cut the venue**

Move lines 858 to 1141 (`VenueTable` and `VenueScene`) into
`components/platform/scene/venue.tsx`.

```tsx
import { px, topFace, sideFaces } from "./geometry";
import { SEATINGS, TABLES, TURN, OPEN, CLOSE, clock, tableState } from "./data";
import type { Seating, TableState } from "./data";
```

Export `VenueTable` and `VenueScene`. Read the two functions and import exactly
what they reference, nothing more.

- [ ] **Step 6: Rewire `agent-floor.tsx`**

What remains is the file header comment, `TaskRow`, `StackRow` and `AgentFloor`.
Its imports become:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/motion-primitives";
import {
  ALL_TASKS, COVERS_TONIGHT, CLOSE, DEPTS, ENQUIRIES, OPEN, SEATS_IN_ROOM, clock,
} from "./scene/data";
import type { Dept, Task, TaskState } from "./scene/data";
import { HUB, KY, VIEW, px, walkway, zoomTransform } from "./scene/geometry";
import { Hub } from "./scene/props";
import { Island } from "./scene/island";
import { VenueScene } from "./scene/venue";
```

Delete nothing else. The JSX is untouched.

- [ ] **Step 7: Typecheck and lint**

```bash
npm run build && npx eslint components/platform app
```

Expected: both clean. A "declared but never used" from eslint means an import
was carried over that the remaining file no longer needs. Remove it.

- [ ] **Step 8: Prove nothing moved on screen**

```bash
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/split
node docs/research/scratch/floor-check.mjs --compare docs/research/scratch/floor-shots/baseline docs/research/scratch/floor-shots/split
```

Expected: `PASS: 8 identical`, and the edge guard still failing on Bookings with
the same numbers. **If any shot differs, the move was not
pure.** Find the changed line and restore it. Do not proceed on a DIFF.

- [ ] **Step 9: Commit**

```bash
git add components/platform/
git commit -m "Split the Floor into scene modules

agent-floor.tsx was 1700 lines and the redesign adds five hundred more.
Geometry, data, furniture, the island, and the venue each move to their
own file under components/platform/scene/ and agent-floor keeps the
orchestration: state, the panel, and the animation loop.

Not components/platform/floor/, which held the deleted r3f build.

Pure move. Every screenshot is byte identical to the commit before."
```

---

### Task 3: Cards off desktop, the reach list, the name plate

**Files:**
- Modify: `components/platform/agent-floor.tsx`
- Modify: `components/platform/scene/island.tsx`
- Modify: `app/platform.css`

**Interfaces:**
- Consumes: `Island` from Task 2, `DEPTS` from `scene/data`.
- Produces: `Island` gains `hovered?: boolean` and `onEnter`/`onLeave` props.
  `AgentFloor` gains state `hover: string | null`. The island group gains
  `data-dept={dept.id}`, which the Task 1 harness already keys on.

- [ ] **Step 1: Give the island a name plate and a data attribute**

In `scene/island.tsx`, change the signature and the group:

```tsx
function Island({
  dept, waiting, selected, hovered, onEnter, onLeave,
}: {
  dept: Dept;
  waiting: number;
  selected: boolean;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
```

```tsx
    <g
      className="floor__isle"
      data-dept={dept.id}
      data-own={dept.own || undefined}
      data-selected={selected || undefined}
      data-hover={hovered || undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-hidden="true"
    >
```

Replace the label `<text>` with a two-part plate. The name stays where it is;
the desk count and the rule only exist while hovered or selected:

```tsx
      <g className="floor__isle-plate">
        <text className="floor__isle-label" x={label.x} y={label.y - ISLE_LIFT + 26}>
          {dept.name.toUpperCase()}
          {dept.own ? " · OURS" : ""}
        </text>
        <text className="floor__isle-desks" x={label.x} y={label.y - ISLE_LIFT + 40}>
          {dept.desks.length} desks
        </text>
        <line
          className="floor__isle-rule"
          x1={label.x} y1={label.y - ISLE_LIFT + 31}
          x2={label.x + 78} y2={label.y - ISLE_LIFT + 31}
        />
      </g>
```

- [ ] **Step 2: Add the hover state and the reach list**

In `agent-floor.tsx`, beside the existing `selected` state:

```tsx
const [hover, setHover] = useState<string | null>(null);
```

Pass it down where `Island` is rendered:

```tsx
<Island
  dept={d}
  waiting={waitingByDept[d.id]}
  selected={selected === d.id}
  hovered={hover === d.id}
  onEnter={() => setHover(d.id)}
  onLeave={() => setHover((h) => (h === d.id ? null : h))}
/>
```

Add the reach list immediately before the `<svg>` inside `.floor__scene`:

```tsx
{/* The scene is one image to a screen reader, so the departments get real
    buttons of their own. Focusing one lights the same name plate a pointer
    hover does, so the two paths show the same thing. */}
<ul className="floor__reach">
  {DEPTS.map((d) => {
    const waiting = waitingByDept[d.id];
    return (
      <li key={d.id}>
        <button
          type="button"
          data-dept={d.id}
          onClick={() => select(selected === d.id ? null : d.id)}
          onFocus={() => setHover(d.id)}
          onBlur={() => setHover((h) => (h === d.id ? null : h))}
          aria-expanded={selected === d.id}
        >
          {`Open ${d.name}. ${d.desks.length} desks. ${
            waiting ? `${waiting} waiting for you.` : "Nothing waiting."
          }`}
        </button>
      </li>
    );
  })}
  <li>
    <button
      type="button"
      data-dept="venue"
      onClick={() => (view === "venue" ? select(null) : enterVenue())}
      aria-expanded={view === "venue"}
    >
      Step inside the venue.
    </button>
  </li>
</ul>
```

- [ ] **Step 3: Style the plate and hide the cards on desktop**

In `app/platform.css`, near the other `floor__isle` rules:

```css
/* The scene's keyboard and assistive route. Visible to a screen reader,
   never to the eye. Not display:none, which would take it out of the
   accessibility tree along with the tab order. */
.floor__reach {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.floor__reach button:focus-visible {
  position: fixed;
  top: 12px;
  left: 12px;
  width: auto;
  height: auto;
  clip-path: none;
  padding: 8px 14px;
  background: var(--surface);
  border: 1px solid var(--ink);
  border-radius: 10px;
  font-size: 13px;
  z-index: 20;
}

.floor__isle-desks,
.floor__isle-rule {
  opacity: 0;
  transition: opacity 0.25s var(--ease-in-out);
}

.floor__isle-desks {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: 0.06em;
  fill: var(--faint);
}

.floor__isle-rule {
  stroke: var(--rule);
  stroke-width: 1;
}

.floor__isle[data-hover] .floor__isle-label,
.floor__isle[data-selected] .floor__isle-label { fill: var(--ink); }

.floor__isle[data-hover] .floor__isle-desks,
.floor__isle[data-hover] .floor__isle-rule,
.floor__isle[data-selected] .floor__isle-desks,
.floor__isle[data-selected] .floor__isle-rule { opacity: 1; }
```

Then inside the existing `@media (min-width: 810px)` block, replace the two
rules that fade the cards (`.floor__scene[data-zoomed] .floor__cards` and
`.floor__scene[data-view="venue"] .floor__card`) with one:

```css
  /* Above 810px the islands are the interface. The cards are the phone's
     morning brief and stay exactly as they are below this width. */
  .floor__cards { display: none; }
```

`.floor__scene` keeps its `data-zoomed` attribute; nothing reads it for the
cards any more, which is fine, and it is not worth a separate change.

Delete the now-dead `.floor__cards { transition: opacity ... }` line and the
whole `@media (min-width: 1200px)` block that positions the cards in the
diamond's corner pockets (the seven `.floor__card[data-dept=...]` rules, plus
`.floor__cards { display: block }` and `.floor__card { position: absolute; ... }`).

- [ ] **Step 4: Confirm the phone is untouched**

```bash
node docs/research/shoot-tiles.mjs /platform 390 docs/research/scratch/floor-phone
```

Open the PNGs. The six cards and the venue card must look exactly as they do on
`main`. Compare against `git stash` output if unsure.

- [ ] **Step 5: Build, lint, and shoot**

```bash
npm run build && npx eslint components/platform app
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/cards-off
```

Expected: build and lint clean. The harness now finds `.floor__reach button`
and drives the scene through it instead of the cards. Shots will differ from
baseline (the cards are gone) and the edge guard still fails on `bookings`.
That is correct at this stage.

- [ ] **Step 6: Check the focus route by hand**

Load `http://localhost:3000/platform` at 1440, wait out the cold open, and press
Tab until a reach button appears at the top left. Confirm:
- each button is announced with its name, desk count and waiting count;
- focusing one lights that island's name plate;
- Enter opens the department and the panel changes;
- the venue button steps inside.

- [ ] **Step 7: Commit**

```bash
git add components/platform/ app/platform.css
git commit -m "Take the cards off the desktop floor

Six bordered boxes sat over the plan repeating what the plan already
showed, so the reader read text about a floor instead of reading the
floor. Above 810px they go and the island carries its own name: faint
at rest, full ink with its desk count when hovered or focused.

The svg stays one image to a screen reader, so the departments get a
visually hidden button list of their own. Focusing a button lights the
same plate a pointer hover does.

Below 810px nothing changes. There is no scene there and the cards are
the morning brief."
```

---

### Task 4: The data model, the clamp, and the knock-ons

The geometry stage splits into three tasks. This one changes the shape of the
data and every reader of it, and fixes the escaped sitters. Props and stairs
follow.

**Files:**
- Modify: `components/platform/scene/data.ts`
- Modify: `components/platform/scene/geometry.ts`
- Modify: `components/platform/scene/island.tsx`
- Modify: `components/platform/agent-floor.tsx`

**Interfaces:**
- Consumes: `Dept`, `DEPTS` from Task 2.
- Produces:
  - `Dept` loses `size`, gains `w: number`, `d: number`, `lift: number`,
    `hue: number`, `n: string`, `glyph: GlyphKey`, `stair: "n"|"e"|"s"|"w"`,
    `vertical: Vertical`, `layout: Placement[]`.
  - `geometry.ts` exports `place(dept, p)` returning `{ u, v }`, and
    `zoomFor(dept)` returning a number. `ISLE_LIFT` and `ZOOM` are deleted.
  - `deskSpots` is deleted.

- [ ] **Step 1: Add the new types to `scene/data.ts`**

```ts
/** What can stand on an island. Each has a component in scene/props.tsx. */
export type PropKind =
  | "desk" | "plant"
  | "crate" | "pallet"
  | "ledger" | "safe"
  | "counter" | "pigeonhole" | "printer"
  | "easel" | "lightstand" | "panel"
  | "pegwall" | "clockpost"
  | "hoststand" | "top";

/** One object on an island, positioned relative to the island's centre. */
export type Placement = {
  kind: PropKind;
  du: number;
  dv: number;
  label?: string;
  own?: boolean;
  /** Takes the department's hue on its top face. One or two per island. */
  lit?: boolean;
};

/** The one tall thing each island is allowed. Named `VerticalSpec` because
    `Vertical` is the component that draws it, in scene/props.tsx. */
export type VerticalSpec = {
  kind: "tower" | "arch";
  du: number;
  dv: number;
  /** Height in px above the island top. */
  h: number;
};

/** Which of the six 28px marks in scene/glyphs.tsx this department wears. */
export type GlyphKey =
  | "supply" | "books" | "marketing" | "reception" | "bookings" | "roster";
```

- [ ] **Step 2: Rewrite the `Dept` type**

```ts
type Dept = {
  id: string;
  name: string;
  /** The rack number this department carries on the home page. */
  n: string;
  glyph: GlyphKey;
  /** Hue in degrees. Saturation is a CSS variable, never a per-dept value. */
  hue: number;
  /** Which side the island's caption hangs off. Defaults to the front-left. */
  labelSide?: "e";
  /** Where the island sits, in grid units. */
  u: number;
  v: number;
  /** Half-extents of the island top. Islands are no longer square. */
  w: number;
  d: number;
  /** Plinth height in px. There is no shared default. */
  lift: number;
  /** Which face the stair climbs. */
  stair: "n" | "e" | "s" | "w";
  vertical: VerticalSpec;
  own?: boolean;
  /** The roster: what the panel and the phone cards count. */
  desks: { label: string; own?: boolean }[];
  /** What is drawn on the island. Not the same list as `desks`. */
  layout: Placement[];
  stack: { label: string; own?: boolean }[];
  metrics: [string, string][];
  tasks: Task[];
};
```

- [ ] **Step 3: Fill in the six departments**

Replace each department's `size` line with its block below. `desks`, `stack`,
`metrics` and `tasks` are untouched. `layout` is populated in Task 5; give every
department `layout: []` for now so this task stays reviewable on its own.

```ts
// bookings
  n: "006", glyph: "bookings", hue: 12,
  u: 6.4, v: 6.4, w: 3.2, d: 2.6, lift: 26,
  stair: "n", vertical: { kind: "arch", du: -2.1, dv: -1.5, h: 34 },
  layout: [],

// suppliers
  n: "001", glyph: "supply", hue: 150,
  u: 7.8, v: -0.6, w: 2.6, d: 2.2, lift: 22,
  stair: "w", vertical: { kind: "tower", du: 1.6, dv: -1.2, h: 40 },
  layout: [],

// books
  n: "002", glyph: "books", hue: 232,
  u: 0.6, v: -7.8, w: 2.2, d: 2.6, lift: 30,
  stair: "s", vertical: { kind: "tower", du: -1.2, dv: -1.6, h: 46 },
  layout: [],

// admin
  n: "004", glyph: "reception", hue: 42,
  u: -7.2, v: -7.2, w: 2.4, d: 2.4, lift: 16,
  stair: "s", vertical: { kind: "arch", du: 1.4, dv: -1.4, h: 30 },
  layout: [],

// marketing
  n: "003", glyph: "marketing", hue: 28,
  u: -0.6, v: 7.8, w: 2.8, d: 2.0, lift: 20,
  stair: "n", vertical: { kind: "tower", du: -1.9, dv: 1.1, h: 36 },
  layout: [],

// roster
  n: "007", glyph: "roster", hue: 196,
  u: -7.8, v: 0.6, w: 2.0, d: 2.0, lift: 18,
  stair: "e", vertical: { kind: "tower", du: 1.1, dv: -1.1, h: 32 },
  layout: [],
```

Then push the ring off its symmetry. Change only these four centres:

```ts
  bookings:  u: 6.1,  v: 6.9
  suppliers: u: 8.4,  v: -0.9
  books:     u: 0.9,  v: -7.1
  marketing: u: -1.1, v: 8.3
```

`admin` and `roster` keep theirs, so two of the six still sit on the old ring
and the shift reads as intentional rather than as noise.

- [ ] **Step 4: Add `place` and `zoomFor`, delete `deskSpots`, `ISLE_LIFT`, `ZOOM`**

In `scene/geometry.ts`, delete `deskSpots`, `ISLE_LIFT` and `ZOOM` entirely, and
add:

```ts
/**
 * A placement resolved onto the island, clamped inside its footprint.
 *
 * The old deskSpots() put the last row at 0.82 of the half-extent and Desk then
 * drew its sitter 0.72 units further toward the camera, which on Bookings put
 * both desks of the last row at 3.098 against a 2.9 bound, hanging over the
 * ground. Everything drawn on an island goes
 * through here, so that cannot happen again.
 */
export function place(dept: Dept, p: Placement) {
  const mu = Math.max(0, dept.w - 0.8);
  const mv = Math.max(0, dept.d - 0.8);
  return {
    u: dept.u + Math.max(-mu, Math.min(mu, p.du)),
    v: dept.v + Math.max(-mv, Math.min(mv, p.dv)),
  };
}

/**
 * How far the camera pushes in on a department.
 *
 * The old constant 1.45 was tuned against uniform 2.4 islands; a 3.2-wide
 * Bookings overflows at that scale, so the zoom comes from the footprint.
 */
export function zoomFor(dept: Dept) {
  return Math.min(1.55, (VIEW.w * 0.52) / ((dept.w + dept.d) * 2 * KX));
}
```

Add `Placement` to the type import at the top of the file.

- [ ] **Step 5: Fix the three functions that read `size`**

`zoomTransform`, in `scene/geometry.ts`:

```ts
export function zoomTransform(dept: Dept) {
  const z = zoomFor(dept);
  const c = px(dept.u, dept.v);
  const tx = VIEW.x + VIEW.w / 2 - z * c.x;
  const ty = VIEW.y + VIEW.h / 2 - z * (c.y - 24);
  return `translate(${tx} ${ty}) scale(${z})`;
}
```

`walkway`, in `scene/geometry.ts`. The old outer endpoint used `d.size`; the
extent along the hub bearing replaces it:

```ts
export function walkway(dept: Dept) {
  const len = Math.hypot(dept.u, dept.v);
  const inner = (HUB.size + 0.4) / len;
  // How far the island reaches along the line back to the hub.
  const ext =
    Math.abs(dept.u / len) * dept.w + Math.abs(dept.v / len) * dept.d;
  const outer = (len - ext - 0.4) / len;
  const a = px(dept.u * inner, dept.v * inner);
  const b = px(dept.u * outer, dept.v * outer);
  return `M ${a.x} ${a.y - 4} L ${b.x} ${b.y - 4}`;
}
```

`Island`, in `scene/island.tsx`. Every `size` and every `ISLE_LIFT` becomes the
department's own:

```tsx
  const { u, v, w, d, lift } = dept;
  const sides = sideFaces(u, v, w, d, lift);
  const label =
    dept.labelSide === "e"
      ? px(u + w * 1.28, v + d * 0.1)
      : px(u + w * 0.1, v + d * 1.28);
  const flag = px(u, v - d);
```

and inside the JSX, `topFace(u, v, w, d, lift)`, `label.y - lift + 26` (and
`+ 40`, `+ 31` for the desks line and the rule), `flag.y - lift - 12` and
`flag.y - lift - 8.6`.

Delete the `deskSpots` import added in Task 2, and the `const spots =` line.
Replace the `spots.map(...)` block with the layout, which is empty until Task 5:

```tsx
      {dept.layout.map((p, i) => {
        const at = place(dept, p);
        return <Prop key={i} kind={p.kind} u={at.u} v={at.v} label={p.label}
                     own={p.own} lit={p.lit} i={i} />;
      })}
```

`Prop` does not exist until Task 5, so write the block above and immediately
comment it out behind a `TODO(Task 5)` marker. Every `layout` is `[]` at this
point, so nothing is lost. Task 5 writes `Prop` and uncomments it.

Until then the two existing `<Plant>` calls stay, moved onto `w`/`d`:

```tsx
      <Plant u={u - w + 0.55} v={v - d + 0.55} />
      <Plant u={u + w - 0.55} v={v + d - 0.55} />
```

- [ ] **Step 6: Fix the depth sort**

In `agent-floor.tsx`, the islands are sorted `a.u + a.v - (b.u + b.v)`. With
uneven footprints a tall neighbour can end up drawn over a nearer island's
vertical. Sort on the near corner instead:

```tsx
{[...DEPTS]
  .sort((a, b) => a.u + a.w + a.v + a.d - (b.u + b.w + b.v + b.d))
```

- [ ] **Step 7: Re-measure the view box**

`VIEW` was fitted to the old uniform plan. Add to `scene/geometry.ts` a function
that computes the bounds, call it once from a node scratch run, and paste the
result back as the literal:

```ts
/** Projected bounds of every island including its vertical, plus padding. */
export function sceneBounds(depts: Dept[], pad = 40) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const d of depts) {
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      const c = px(d.u + su * d.w, d.v + sv * d.d);
      xs.push(c.x);
      ys.push(c.y, c.y - d.lift - d.vertical.h);
    }
  }
  const [x0, x1] = [Math.min(...xs) - pad, Math.max(...xs) + pad];
  const [y0, y1] = [Math.min(...ys) - pad, Math.max(...ys) + pad];
  return { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
}
```

Run it and read the numbers:

```bash
npx tsx -e "import {sceneBounds} from './components/platform/scene/geometry';import {DEPTS} from './components/platform/scene/data';console.log(sceneBounds(DEPTS))"
```

If `tsx` is not installed, add a temporary `console.log(sceneBounds(DEPTS))` in
`AgentFloor`, read it from the browser console, then remove it. Paste the result
over the `VIEW` literal. Keep `sceneBounds` exported: it documents where the
numbers came from.

- [ ] **Step 8: Build, lint, shoot, and read the guard**

```bash
npm run build && npx eslint components/platform app
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/geometry
```

Expected: **`edge guard: PASS`.** The escaped sitters are gone, because the
desks are gone. The islands are now bare stepped plinths at six different sizes
and heights, which looks unfinished. That is correct: Task 5 furnishes them.

Open the shots. Confirm the plan reads as asymmetric, that no island runs off
the view box, and that opening the widest department (`bookings`) frames it
without clipping.

- [ ] **Step 9: Commit**

```bash
git add components/platform/
git commit -m "Give every department its own footprint and height

Islands were one 2.4 square at one height, six times over, so only the
caption told them apart. They now carry their own half-extents, their
own plinth height, a rack number, a hue and a stair face, and the ring
is pushed off its symmetry on four of the six.

deskSpots() is deleted with ISLE_LIFT and the constant zoom. Everything
drawn on an island goes through place(), which clamps it inside the
footprint, so the sitters that hung off Bookings and Marketing cannot
come back. The edge guard passes.

The view box is measured from sceneBounds() rather than fitted by eye,
and the zoom comes from the footprint so a 3.2-wide island still frames."
```

---

### Task 5: What each department is

**Files:**
- Modify: `components/platform/scene/props.tsx`
- Modify: `components/platform/scene/data.ts`
- Modify: `components/platform/scene/island.tsx`

**Interfaces:**
- Consumes: `PropKind`, `Placement`, `place` from Task 4.
- Produces: `Prop` in `scene/props.tsx`:

```tsx
export function Prop({ kind, u, v, label, own, lit, i }: {
  kind: PropKind; u: number; v: number;
  label?: string; own?: boolean; lit?: boolean; i: number;
}): React.ReactElement | null
```

  and every department's `layout` filled in.

Every prop draws through `topFace` and `sideFaces` so it sits in the same
projection as everything else. Each is a box or a stack of boxes with one or two
line details. None is more than about twenty lines.

- [ ] **Step 1: Write a box helper**

At the top of `scene/props.tsx`:

```tsx
/** One iso box: the two visible sides, then the top over them. `lit` puts the
    department's hue on the top face, which is the only place a prop takes it. */
function Box({ u, v, a, b, h, lift = 0, lit, cls = "" }: {
  u: number; v: number; a: number; b: number; h: number;
  lift?: number; lit?: boolean; cls?: string;
}) {
  const s = sideFaces(u, v, a, b, lift + h);
  return (
    <g className={`floor__box ${cls}`} data-lit={lit || undefined}>
      <path className="floor__box-side" d={s.right} />
      <path className="floor__box-side floor__box-side--l" d={s.left} />
      <path className="floor__box-top" d={topFace(u, v, a, b, lift + h)} />
    </g>
  );
}
```

- [ ] **Step 2: Write the prop set**

```tsx
/** 001 · a crate, stacked or single, with a lid seam. */
function Crate({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__crate">
      <Box u={u} v={v} a={0.42} b={0.42} h={11} lit={lit} />
      <line className="floor__crate-seam" x1={c.x - 8} y1={c.y - 11} x2={c.x + 8} y2={c.y - 11} />
    </g>
  );
}

/** 001 · the loading edge: a low ramp off the plinth. */
function Pallet({ u, v }: { u: number; v: number }) {
  return <Box u={u} v={v} a={0.7} b={0.5} h={3} cls="floor__pallet" />;
}

/** 002 · a run of ledger rows, two of them pushed out of line. */
function Ledger({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__ledger">
      <Box u={u} v={v} a={0.5} b={0.62} h={9} />
      {Array.from({ length: 7 }, (_, k) => (
        <line
          key={k}
          className="floor__ledger-row"
          data-off={k === 2 || k === 5 || undefined}
          x1={c.x - 7 + (k === 2 || k === 5 ? 3 : 0)}
          y1={c.y - 9 - k * 1.5}
          x2={c.x + 7}
          y2={c.y - 9 - k * 1.5}
        />
      ))}
    </g>
  );
}

/** 002 · the safe: one heavy cube with a dial. */
function Safe({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__safe">
      <Box u={u} v={v} a={0.46} b={0.46} h={14} lit={lit} />
      <circle className="floor__safe-dial" cx={c.x + 5} cy={c.y - 7} r={2.4} />
    </g>
  );
}

/** 004 · the counter someone stands behind. */
function Counter({ u, v }: { u: number; v: number }) {
  return <Box u={u} v={v} a={1.1} b={0.32} h={10} cls="floor__counter" />;
}

/** 004 · the pigeonhole wall behind it. */
function Pigeonhole({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__holes">
      <Box u={u} v={v} a={0.9} b={0.16} h={20} />
      {Array.from({ length: 8 }, (_, k) => (
        <rect
          key={k}
          className="floor__hole"
          x={c.x - 12 + (k % 4) * 6.4}
          y={c.y - 19 + Math.floor(k / 4) * 6}
          width={4.6}
          height={4.4}
          rx={0.6}
        />
      ))}
    </g>
  );
}

/** 004 · the printer, with one sheet in the tray. */
function Printer({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__printer">
      <Box u={u} v={v} a={0.4} b={0.34} h={7} />
      <rect className="floor__printer-sheet" x={c.x - 3} y={c.y - 10} width={6} height={4} rx={0.6} />
    </g>
  );
}

/** 003 · the easel the work goes up on. */
function Easel({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__easel">
      <line className="floor__easel-leg" x1={c.x - 5} y1={c.y} x2={c.x - 3} y2={c.y - 22} />
      <line className="floor__easel-leg" x1={c.x + 5} y1={c.y} x2={c.x + 3} y2={c.y - 22} />
      <rect className="floor__easel-face" data-lit={lit || undefined}
            x={c.x - 9} y={c.y - 34} width={18} height={14} rx={1} />
    </g>
  );
}

/** 003 · one of the three queued panels, leaning. */
function Panel({ u, v, i }: { u: number; v: number; i: number }) {
  const c = px(u, v);
  return (
    <rect className="floor__panelboard" x={c.x - 6} y={c.y - 15} width={12} height={15} rx={1}
          transform={`rotate(${-6 + i * 5} ${c.x} ${c.y})`} />
  );
}

/** 003 · the light on its stand. */
function LightStand({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__light">
      <line className="floor__light-post" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 26} />
      <circle className="floor__light-head" cx={c.x} cy={c.y - 29} r={4} />
    </g>
  );
}

/** 007 · the shift wall: a grid of pegged blocks, one column short. */
function PegWall({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__peg">
      <Box u={u} v={v} a={1.0} b={0.16} h={22} />
      {Array.from({ length: 14 }, (_, k) => {
        const col = k % 5;
        const row = Math.floor(k / 5);
        if (col === 4 && row === 2) return null;
        return (
          <rect key={k} className="floor__peg-block" data-lit={lit && k === 7 ? "" : undefined}
                x={c.x - 13 + col * 5.4} y={c.y - 20 + row * 5.2}
                width={4} height={3.8} rx={0.6} />
        );
      })}
    </g>
  );
}

/** 007 · the clock the roster is drafted against. */
function ClockPost({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__clockpost">
      <line className="floor__light-post" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 24} />
      <circle className="floor__clock-face" cx={c.x} cy={c.y - 28} r={5} />
      <line className="floor__clock-hand" x1={c.x} y1={c.y - 28} x2={c.x} y2={c.y - 31.5} />
      <line className="floor__clock-hand" x1={c.x} y1={c.y - 28} x2={c.x + 2.6} y2={c.y - 28} />
    </g>
  );
}

/** 006 · a round top in the room. `lit` is the one being held. */
function Top({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__top" data-lit={lit || undefined}>
      <line className="floor__top-stem" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 8} />
      <ellipse className="floor__top-face" cx={c.x} cy={c.y - 9} rx={9} ry={5} />
      {lit ? <ellipse className="floor__top-ring" cx={c.x} cy={c.y - 9} rx={13} ry={7.4} /> : null}
    </g>
  );
}

/** 006 · the host stand at the door. */
function HostStand({ u, v }: { u: number; v: number }) {
  return <Box u={u} v={v} a={0.34} b={0.28} h={13} cls="floor__host" />;
}
```

- [ ] **Step 3: Write the dispatcher**

```tsx
export function Prop({ kind, u, v, label, own, lit, i }: {
  kind: PropKind; u: number; v: number;
  label?: string; own?: boolean; lit?: boolean; i: number;
}) {
  switch (kind) {
    case "desk":       return <Desk u={u} v={v} own={own} label={label ?? ""} i={i} />;
    case "plant":      return <Plant u={u} v={v} />;
    case "crate":      return <Crate u={u} v={v} lit={lit} />;
    case "pallet":     return <Pallet u={u} v={v} />;
    case "ledger":     return <Ledger u={u} v={v} />;
    case "safe":       return <Safe u={u} v={v} lit={lit} />;
    case "counter":    return <Counter u={u} v={v} />;
    case "pigeonhole": return <Pigeonhole u={u} v={v} />;
    case "printer":    return <Printer u={u} v={v} />;
    case "easel":      return <Easel u={u} v={v} lit={lit} />;
    case "panel":      return <Panel u={u} v={v} i={i} />;
    case "lightstand": return <LightStand u={u} v={v} />;
    case "pegwall":    return <PegWall u={u} v={v} lit={lit} />;
    case "clockpost":  return <ClockPost u={u} v={v} />;
    case "hoststand":  return <HostStand u={u} v={v} />;
    case "top":        return <Top u={u} v={v} lit={lit} />;
  }
}
```

- [ ] **Step 4: Fill in the six layouts**

Replace each department's `layout: []` in `scene/data.ts`. Desks drop to one or
two per island; the props carry the identity. `du`/`dv` are offsets from the
island centre in grid units, and `place()` clamps them, so a value past the edge
is silently pulled in rather than drawn off.

```ts
// bookings 006, w 3.2 d 2.6 · the table plan itself
layout: [
  { kind: "hoststand", du: -2.2, dv: -1.4 },
  { kind: "top", du: -1.1, dv: -1.1 },
  { kind: "top", du: 0.5, dv: -1.1 },
  { kind: "top", du: 2.0, dv: -0.9 },
  { kind: "top", du: -1.1, dv: 0.6, lit: true },
  { kind: "top", du: 0.6, dv: 0.7 },
  { kind: "top", du: 2.0, dv: 0.9 },
  { kind: "desk", du: -2.1, dv: 1.2, label: "Enquiries", own: true },
],

// suppliers 001, w 2.6 d 2.2 · the loading edge
layout: [
  { kind: "pallet", du: -1.4, dv: 1.0 },
  { kind: "crate", du: -1.4, dv: 1.0 },
  { kind: "crate", du: -0.5, dv: 1.0 },
  { kind: "crate", du: -0.5, dv: 0.2, lit: true },
  { kind: "crate", du: 0.4, dv: 1.0 },
  { kind: "desk", du: 1.2, dv: -0.8, label: "Ordermentum" },
  { kind: "plant", du: -1.6, dv: -1.2 },
],

// books 002, w 2.2 d 2.6 · the ledger wall and the safe
layout: [
  { kind: "ledger", du: -0.9, dv: -0.6 },
  { kind: "ledger", du: 0.2, dv: -0.6 },
  { kind: "safe", du: 1.1, dv: 1.2, lit: true },
  { kind: "desk", du: -0.5, dv: 1.3, label: "Xero" },
],

// admin 004, w 2.4 d 2.4 · the counter and the pigeonholes
layout: [
  { kind: "pigeonhole", du: 0, dv: -1.4 },
  { kind: "counter", du: 0, dv: 0.1 },
  { kind: "printer", du: 1.4, dv: 1.0 },
  { kind: "desk", du: -1.2, dv: 1.2, label: "Phone", own: true },
  { kind: "plant", du: 1.5, dv: -0.6 },
],

// marketing 003, w 2.8 d 2.0 · the easel and what is queued behind it
layout: [
  { kind: "easel", du: 0.2, dv: -0.6, lit: true },
  { kind: "panel", du: -1.6, dv: 0.6 },
  { kind: "panel", du: -1.0, dv: 0.7 },
  { kind: "panel", du: -0.4, dv: 0.8 },
  { kind: "lightstand", du: 1.7, dv: -0.4 },
  { kind: "desk", du: 1.5, dv: 0.9, label: "Guest CRM", own: true },
],

// roster 007, w 2.0 d 2.0 · the shift wall and the clock
layout: [
  { kind: "pegwall", du: 0, dv: -1.1, lit: true },
  { kind: "clockpost", du: 1.0, dv: 0.9 },
  { kind: "desk", du: -0.7, dv: 0.8, label: "Deputy" },
],
```

- [ ] **Step 5: Turn the layout on in `Island`**

Uncomment the block from Task 4 Step 5, import `Prop` and `place`, and delete
the two hardcoded `<Plant>` calls (plants are placements now, on the two
departments whose layout lists them).

- [ ] **Step 6: Style the new props**

In `app/platform.css`, beside the existing `floor__desk` rules. Colour comes in
Task 7; everything here is the current neutral ramp:

```css
.floor__box-top   { fill: var(--surface); stroke: var(--rule); stroke-width: 0.6; }
.floor__box-side  { fill: var(--surface-2); }
.floor__box-side--l { fill: var(--rule); }

.floor__crate-seam,
.floor__ledger-row { stroke: var(--faint); stroke-width: 0.8; }
.floor__ledger-row[data-off] { stroke: var(--ink); stroke-width: 1.1; }

.floor__safe-dial { fill: none; stroke: var(--muted); stroke-width: 1.1; }
.floor__hole,
.floor__peg-block { fill: var(--surface-2); stroke: var(--rule); stroke-width: 0.5; }
.floor__printer-sheet { fill: var(--surface); stroke: var(--rule); stroke-width: 0.6; }

.floor__easel-leg,
.floor__light-post { stroke: var(--muted); stroke-width: 1.2; }
.floor__easel-face { fill: var(--surface); stroke: var(--rule); stroke-width: 0.8; }
.floor__panelboard { fill: var(--surface); stroke: var(--rule); stroke-width: 0.7; }
.floor__light-head { fill: var(--surface-2); stroke: var(--rule); stroke-width: 0.7; }

.floor__clock-face { fill: var(--surface); stroke: var(--muted); stroke-width: 1; }
.floor__clock-hand { stroke: var(--ink); stroke-width: 1.1; stroke-linecap: round; }

.floor__top-stem { stroke: var(--muted); stroke-width: 1.4; }
.floor__top-face { fill: var(--surface); stroke: var(--rule); stroke-width: 0.8; }
.floor__top-ring { fill: none; stroke: var(--ink); stroke-width: 1; stroke-dasharray: 3 3; }
```

- [ ] **Step 7: Build, lint, shoot, check every island**

```bash
npm run build && npx eslint components/platform app
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/props
```

Expected: `edge guard: PASS`, no console errors, and eight shots.

Open each shot and answer one question per island: **could someone name this
department from the objects alone, with the caption covered?** If not, move the
placements. This is the only test this task has, and it is the point of it.

- [ ] **Step 8: Commit**

```bash
git add components/platform/ app/platform.css
git commit -m "Show what each department is instead of captioning it

Six islands carried the same two-column grid of identical desks, so the
scene proved that departments exist without showing what any of them
does. Each now carries the objects of its own job, drawn in the same
isometric language the home page already uses for these branches:
crates on a loading edge, a wall of ledger rows with two out of line, a
counter and its pigeonholes, an easel with the work queued behind it, a
shift wall and a clock, and for Bookings the table plan itself with one
top held.

Desks drop to one or two an island. The props carry the identity."
```

---

### Task 6: The stair and the one vertical

**Files:**
- Modify: `components/platform/scene/geometry.ts`
- Modify: `components/platform/scene/props.tsx`
- Modify: `components/platform/scene/island.tsx`
- Modify: `app/platform.css`

**Interfaces:**
- Consumes: `dept.stair`, `dept.vertical`, `dept.lift` from Task 4.
- Produces: `stairTreads(dept, n?)` in `geometry.ts` returning
  `{ u, v, a, b, h }[]`; `Stair` and `Vertical` components in `props.tsx`.

Three cues, and only three: a stair, one tall thing per island, and the
asymmetry Task 4 already landed. Any more and it reads as a game.

- [ ] **Step 1: Write `stairTreads`**

```ts
/**
 * Treads climbing one plinth face, ground to island top.
 *
 * The stair is the strongest cue in the reference and the cheapest to draw:
 * boxes of falling height stepping outward from the face the walkway lands on.
 */
export function stairTreads(dept: Dept, n = 4) {
  const dirU = dept.stair === "w" ? -1 : dept.stair === "e" ? 1 : 0;
  const dirV = dept.stair === "n" ? -1 : dept.stair === "s" ? 1 : 0;
  const edgeU = dept.u + dirU * dept.w;
  const edgeV = dept.v + dirV * dept.d;
  const step = 0.42; // tread depth, grid units
  return Array.from({ length: n }, (_, i) => {
    const k = i + 1; // 1 is the tread nearest the ground
    return {
      u: edgeU + dirU * step * k,
      v: edgeV + dirV * step * k,
      a: dirU ? step / 2 : 0.8,
      b: dirV ? step / 2 : 0.8,
      h: (dept.lift * (n - k + 1)) / (n + 1),
    };
  });
}
```

- [ ] **Step 2: Draw the stair and the vertical**

In `scene/props.tsx`:

```tsx
export function Stair({ dept }: { dept: Dept }) {
  return (
    <g className="floor__stair" aria-hidden="true">
      {stairTreads(dept).map((t, i) => (
        <g key={i} className="floor__tread">
          <path className="floor__tread-side" d={sideFaces(t.u, t.v, t.a, t.b, t.h).right} />
          <path className="floor__tread-side floor__tread-side--l" d={sideFaces(t.u, t.v, t.a, t.b, t.h).left} />
          <path className="floor__tread-top" d={topFace(t.u, t.v, t.a, t.b, t.h)} />
        </g>
      ))}
    </g>
  );
}

/** The one tall thing an island is allowed. A slab, or a slab with a hole. */
export function Vertical({ dept }: { dept: Dept }) {
  const { du, dv, h, kind } = dept.vertical;
  const u = dept.u + du;
  const v = dept.v + dv;
  const c = px(u, v);
  const a = kind === "arch" ? 0.72 : 0.46;
  const s = sideFaces(u, v, a, 0.3, dept.lift + h);
  return (
    <g className="floor__vert" data-kind={kind} aria-hidden="true">
      <path className="floor__vert-side" d={s.right} />
      <path className="floor__vert-side floor__vert-side--l" d={s.left} />
      <path className="floor__vert-top" d={topFace(u, v, a, 0.3, dept.lift + h)} />
      {kind === "arch" ? (
        <path
          className="floor__vert-hole"
          d={`M ${c.x - 7} ${c.y - dept.lift - 6}
              L ${c.x - 7} ${c.y - dept.lift - h * 0.52}
              Q ${c.x} ${c.y - dept.lift - h * 0.78} ${c.x + 7} ${c.y - dept.lift - h * 0.52}
              L ${c.x + 7} ${c.y - dept.lift - 6} Z`}
        />
      ) : null}
    </g>
  );
}
```

Import `stairTreads`, `px`, `topFace`, `sideFaces` and `type Dept` at the top of
the file.

- [ ] **Step 3: Put them on the island**

In `scene/island.tsx`, the stair is drawn **before** the plinth (it climbs to
it from outside) and the vertical **after** the props (it stands on the top):

```tsx
      <Stair dept={dept} />
      <path className="floor__isle-top" d={topFace(u, v, w, d, lift)} />
      ...
      {dept.layout.map(...)}
      <Vertical dept={dept} />
      <text className="floor__isle-label" ... />
```

The stair sits outside the island footprint by design, so add
`floor__stair` to the harness's `EXEMPT` array in
`docs/research/scratch/floor-check.mjs`. The vertical stands inside and must
stay inside: leave it un-exempt.

- [ ] **Step 4: Style them**

```css
.floor__tread-top   { fill: var(--surface); stroke: var(--rule); stroke-width: 0.6; }
.floor__tread-side  { fill: var(--surface-2); }
.floor__tread-side--l { fill: var(--rule); }

.floor__vert-top    { fill: var(--surface); stroke: var(--rule); stroke-width: 0.7; }
.floor__vert-side   { fill: var(--surface-2); }
.floor__vert-side--l { fill: var(--rule); }
.floor__vert-hole   { fill: var(--paper); stroke: var(--rule); stroke-width: 0.7; }
```

- [ ] **Step 5: Re-measure the view box**

The verticals are taller than Task 4's estimate in places. Re-run `sceneBounds`
the same way and paste the new `VIEW` if it changed.

- [ ] **Step 6: Build, lint, shoot**

```bash
npm run build && npx eslint components/platform app
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/stairs
```

Expected: `edge guard: PASS` with `floor__stair` exempt. Open the shots and
check that every stair lands on the face its walkway arrives at, that no
vertical overlaps a prop, and that the skyline steps rather than sits flat.

- [ ] **Step 7: Commit**

```bash
git add components/platform/ app/platform.css docs/research/scratch/floor-check.mjs
git commit -m "Give each island a stair and one tall thing

Three cues from the reference and no more: treads climbing the plinth
face the walkway arrives at, one slab or arch per island, and the
asymmetry that landed with the footprints. Stairs are the cheapest and
strongest of the three.

The stair sits outside the footprint on purpose, so the edge guard
exempts it. The vertical stands inside and is still checked."
```

---

### Task 7: Colour, at a tenth

**Files:**
- Modify: `app/platform.css`
- Modify: `components/platform/scene/island.tsx`
- Modify: `components/platform/agent-floor.tsx`

**Interfaces:**
- Consumes: `dept.hue` from Task 4.
- Produces: `--hue` set per island group; `data-open` on the office group.

- [ ] **Step 1: Measure the two lightnesses**

The spec says 88% and 81%. Confirm rather than assume:

```bash
node -e "1" # then, in the browser console on /platform:
# getComputedStyle(document.querySelector('.floor__isle-side')).fill
# getComputedStyle(document.querySelector('.floor__isle-side--l')).fill
```

Convert both to HSL. Use the numbers that come back, not the numbers here.

- [ ] **Step 2: Set the hue on the island**

In `scene/island.tsx`:

```tsx
    <g
      className="floor__isle"
      data-dept={dept.id}
      style={{ "--hue": String(dept.hue) } as React.CSSProperties}
      ...
```

- [ ] **Step 3: Mark the office when a department is open**

In `agent-floor.tsx`, on the office group:

```tsx
<g key="office" className="floor__office" data-open={selected || undefined} transform={camera}>
```

- [ ] **Step 4: Write the two rules**

In `app/platform.css`, replacing the flat fills on the plinth, the treads, the
verticals and the boxes:

```css
/* Colour is a tenth of the reference's, and it is department identity: which
   island this is. It is never task state. Needs you, Watching and Done stay
   told apart by weight and fill, here and on the phone. */
.floor { --isle-sat: 10%; }

.floor__isle-side,
.floor__vert-side,
.floor__tread-side,
.floor__box-side       { fill: hsl(var(--hue, 0) var(--isle-sat) 88%); }

.floor__isle-side--l,
.floor__vert-side--l,
.floor__tread-side--l,
.floor__box-side--l    { fill: hsl(var(--hue, 0) var(--isle-sat) 81%); }

.floor__tread-top      { fill: hsl(var(--hue, 0) var(--isle-sat) 92%); }

/* The one or two lit faces an island is allowed. */
.floor__box[data-lit] .floor__box-top,
.floor__easel-face[data-lit],
.floor__peg-block[data-lit] { fill: hsl(var(--hue, 0) calc(var(--isle-sat) * 2.4) 90%); }

/* Open a department and it is the only one holding colour. */
.floor__office[data-open] .floor__isle                { --isle-sat: 0%; }
.floor__office[data-open] .floor__isle[data-selected] { --isle-sat: 34%; }

.floor__isle,
.floor__isle * { transition: fill 0.35s var(--ease-in-out); }
```

The `, 0` fallback on `var(--hue, 0)` keeps the hub, the walkways and anything
outside an island at zero saturation grey, which is what they are now.

- [ ] **Step 5: Confirm no state took a colour**

Grep for any hue reaching a task state. This must return nothing:

```bash
grep -n "isle-sat\|var(--hue" app/platform.css | grep -i "needs\|watching\|done\|task\|legend\|chip"
```

Then open the panel at 1440 and confirm by eye that the three legend marks and
the three task-row dots are still greyscale and still differ by weight.

- [ ] **Step 6: Build, lint, shoot**

```bash
npm run build && npx eslint components/platform app
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/colour
```

Open `idle.png` first. **It should still read as a monochrome scene.** If any
hue is obvious at a glance, `--isle-sat` is too high; drop it rather than
adjusting individual hues. Then open a department shot and confirm that one
island holds colour and the other five are grey.

- [ ] **Step 7: Commit**

```bash
git add components/platform/ app/platform.css
git commit -m "Give the departments a hue, at a tenth

Six hues from the reference at ten percent saturation, with lightness
held at the values the plinth faces already measured, so the floor still
reads monochrome until it is looked at. Hue lands on the plinth sides,
the treads, the verticals and one lit face per island. Tops stay white,
the hub stays black, the page is untouched.

Open a department and it goes to thirty-four percent while the other
five go to zero. That is two rules and one variable.

Hue is which department this is. It is never what a task needs. The
three states stay told apart by weight, here and on the phone."
```

---

### Task 8: The panel delves in

**Files:**
- Create: `components/platform/scene/glyphs.tsx`
- Modify: `components/platform/agent-floor.tsx`
- Modify: `app/platform.css`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `dept.n`, `dept.glyph`, `dept.hue` from Task 4.
- Produces: `Glyph` in `scene/glyphs.tsx`:

```tsx
export function Glyph({ kind, size = 28 }: { kind: GlyphKey; size?: number }): React.ReactElement
```

`components/art/branch-art.tsx` is **not** reused. Its ink is
`rgba(255,255,255,0.82)`, drawn for the dark home panels, and its 120px artwork
does not reduce to 28px. These are six new marks in the same grammar, which is
what the spec means by reusing the vocabulary.

- [ ] **Step 1: Write the six marks**

```tsx
/**
 * One 28px mark per department, in the same isometric line grammar as the
 * floor and the home page's branch art. Small enough that each is a single
 * object rather than a scene: the crate, the ledger, the easel, the handset,
 * the table, the shift wall.
 */
import type { GlyphKey } from "./data";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.2,
            strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const MARKS: Record<GlyphKey, React.ReactElement> = {
  // 001 · a crate, and the line that moved off it
  supply: (
    <>
      <path {...P} d="M4 13 L12 9 L20 13 L12 17 Z" />
      <path {...P} d="M4 13 v5 l8 4 v-5" />
      <path {...P} d="M20 13 v5 l-8 4" />
      <path {...P} d="M17 8 L21 4 M21 4 h-3 M21 4 v3" />
    </>
  ),
  // 002 · a run of rows, two out of line
  books: (
    <>
      <path {...P} d="M4 6 h16 M4 10 h16 M7 14 h13 M4 18 h16 M7 22 h13" />
    </>
  ),
  // 003 · the easel
  marketing: (
    <>
      <rect {...P} x="5" y="4" width="14" height="10" rx="1" />
      <path {...P} d="M8 14 L6 22 M16 14 L18 22 M12 14 v4" />
    </>
  ),
  // 004 · the handset
  reception: (
    <>
      <path {...P} d="M6 5 q6 -2 12 0 v4 q-2 1 -4 0 v-2 q-2 -0.6 -4 0 v2 q-2 1 -4 0 Z" />
      <path {...P} d="M12 11 v8 M8 21 h8" />
    </>
  ),
  // 006 · a table, held
  bookings: (
    <>
      <ellipse {...P} cx="12" cy="11" rx="8" ry="4.5" />
      <path {...P} d="M12 15.5 v5 M8 21 h8" />
      <ellipse {...P} cx="12" cy="11" rx="11" ry="6.6" strokeDasharray="2.5 2.5" />
    </>
  ),
  // 007 · the shift wall, one column short
  roster: (
    <>
      <rect {...P} x="4" y="5" width="4" height="4" />
      <rect {...P} x="10" y="5" width="4" height="4" />
      <rect {...P} x="16" y="5" width="4" height="4" />
      <rect {...P} x="4" y="11" width="4" height="4" />
      <rect {...P} x="10" y="11" width="4" height="4" />
      <rect {...P} x="4" y="17" width="4" height="4" />
      <rect {...P} x="10" y="17" width="4" height="4" />
    </>
  ),
};

export function Glyph({ kind, size = 28 }: { kind: GlyphKey; size?: number }) {
  return (
    <svg className="floor__glyph" width={size} height={size} viewBox="0 0 24 26" aria-hidden="true">
      {MARKS[kind]}
    </svg>
  );
}
```

- [ ] **Step 2: Dress the panel head**

In `agent-floor.tsx`, put the hue and the department on the panel:

```tsx
<aside
  ref={panelRef}
  className="floor__panel"
  data-dept={dept?.id}
  style={dept ? ({ "--hue": String(dept.hue) } as React.CSSProperties) : undefined}
>
```

and replace the department branch's `floor__panel-head`:

```tsx
<div className="floor__panel-head">
  <p className="floor__panel-dept">
    <Glyph kind={dept.glyph} />
    <span className="floor__panel-n">{dept.n}</span>
    <span className="floor__panel-sep" aria-hidden> · </span>
    {dept.name.toUpperCase()}
  </p>
  <button type="button" className="floor__panel-back" onClick={() => select(null)}>
    All departments
  </button>
</div>
```

Import `Glyph` from `./scene/glyphs`.

- [ ] **Step 3: Style it**

```css
/* Open a department and the panel takes its colour, its number and its mark,
   so stepping into a department is visible on both sides of the screen. */
.floor__panel { position: relative; transition: background 0.35s var(--ease-in-out); }

.floor__panel[data-dept] {
  background: hsl(var(--hue) 34% 96%);
  border-radius: 12px;
  padding-left: 20px;
}

.floor__panel[data-dept]::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  border-radius: 12px 12px 0 0;
  background: hsl(var(--hue) 34% 62%);
}

.floor__panel-dept {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.09em;
  color: var(--ink);
}

.floor__glyph { color: hsl(var(--hue) 34% 40%); flex: none; }
.floor__panel-n { color: hsl(var(--hue) 34% 40%); }
.floor__panel-sep { color: var(--faint); }

.floor__panel[data-dept] .floor__syschip-tile {
  background: hsl(var(--hue) 34% 88%);
  color: hsl(var(--hue) 40% 28%);
}
```

Add the panel and glyph transitions to the existing
`@media (prefers-reduced-motion: reduce)` block.

- [ ] **Step 4: Amend `CLAUDE.md`**

Under **Two devices carry the site**, the line "Islands stay neutral and are
told apart by their labels, not their hue" is now false. Replace that paragraph
with:

```markdown
**Two devices carry the site.** The three states (Needs you / Watching / Done)
are told apart by weight and never by colour. The departments run 001 upward
across one rack. On the Floor the same three states carry a legend of their own,
in weight and never in colour, on the same rule.

**On the Floor, hue is department identity.** Each of the six carries one hue
from the Monument Valley reference at about a tenth of its saturation, on the
plinth sides, the stair treads and one lit face. Opening a department lifts its
island to a third and greys the other five, and the side panel takes the same
hue, number and mark. Hue never carries task state, on either device. The rule
that islands stay neutral was reopened on Kayden's call on 2026-08-29; see
`docs/superpowers/specs/2026-08-29-floor-redesign-design.md`.
```

Also update the paragraph under **The Floor** to describe the current
composition: departments as islands with their own footprint, height, stair and
props, no floating cards above 810px, and the scene living in
`components/platform/scene/`.

- [ ] **Step 5: Full pass at both widths**

```bash
npm run build && npx eslint components/platform app
node docs/research/scratch/floor-check.mjs http://localhost:3000/platform docs/research/scratch/floor-shots/panel
node docs/research/shoot-tiles.mjs /platform 1440 docs/research/scratch/floor-1440
node docs/research/shoot-tiles.mjs /platform 390 docs/research/scratch/floor-390
```

Check, in order:
- `edge guard: PASS`, no console errors;
- at 1440, opening each department changes the panel's band, ground, number and
  mark, and closing it returns the panel to plain paper;
- at 390, the six cards and the venue card are **identical to `main`**. Compare
  against a stash of the branch if unsure. This is the last chance to catch a
  desktop rule that leaked below 810px;
- with reduced motion on, nothing animates and every state is still legible.

- [ ] **Step 6: Commit**

```bash
git add components/platform/ app/platform.css CLAUDE.md
git commit -m "Carry the department into the panel

Opening a department pushed the camera in but the dashboard beside it
looked the same, so stepping inside only happened on one side of the
screen. The panel now takes that department's hue, its rack number and
a mark of its own object, and drops them all in one transition when you
come back out.

Six new 28px marks rather than the home page's branch art, which is
drawn in white for dark panels and does not reduce to this size.

CLAUDE.md is amended: hue is department identity on the Floor, never
task state. The line saying islands stay neutral was reopened
deliberately and the spec is cited."
```

---

## Self-Review

**Spec coverage.** Section 1 (cards off, plate, reach list) is Task 3. Section 2
(footprints, heights, the clamp, view box, zoom, knock-ons) is Task 4, with the
Monument Valley cues split into Task 6. Section 3 (props) is Task 5. Section 4
(colour) is Task 7. Section 5 (panel, numbering) is Task 8. Section 6 (the split)
is Task 2, with Task 1 added ahead of it because the spec's verification section
assumes a harness that did not exist.

**Where the plan departs from the spec, and why.** The spec said the panel glyph
would reuse `components/art/branch-art.tsx`. It cannot: that component draws in
`rgba(255,255,255,0.82)` for dark panels and its 120px scenes do not reduce to
28px. Task 8 writes six new marks in the same grammar instead. The spec's four
commits become eight tasks, mapping 1:1 onto its four stages (Task 2 / Task 3 /
Tasks 4 to 6 / Tasks 7 to 8), because a single geometry commit spanning
footprints, props and stairs is too large for one review.

**Still open, and deliberately not answered here.** The Floor's "Admin" is
Website, Email, Phone and Google Business, which is the rack's 004 Reception and
005 Web rather than 008 Admin & Compliance. Task 4 numbers it 004 and gives it
the `reception` glyph. Renaming the island is copy and needs Kayden.
