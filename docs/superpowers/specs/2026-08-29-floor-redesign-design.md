# The Floor, redesigned

Date: 2026-08-29
Scope: `/platform` only. The Floor scene, its interaction model, and the panel
beside it.

## Why

Three problems, one cause.

1. **The floating cards fight the scene.** Six bordered boxes sit over the
   isometric plan repeating what the plan already shows. The reader looks at
   text about a floor instead of at the floor.
2. **The departments are interchangeable.** Every island is the same 2.4-unit
   square at the same height carrying the same two-column grid of identical
   desks. Only a caption tells them apart, so the scene proves that six
   departments exist without showing what any of them does.
3. **Furniture escapes the island.** On Bookings and Marketing the sitters on
   the last row are drawn past the plinth edge and float over the ground.

The cause is that the scene is generated rather than composed: one geometry
function, one size, one desk grid, applied six times.

## What changes

The islands stop being containers for a caption and become the thing the
reader clicks, reads and recognises. Monument Valley supplies the shape and
colour grammar at roughly a tenth of its strength: stepped heights, one
vertical and one stair per island, and a desaturated hue per department. It
stays a product demo. It does not become a game.

## Decisions taken before this spec

Confirmed with Kayden on 2026-08-29:

- Per-department hue, not one shared accent.
- Stepped skyline, not a full impossible-geometry diorama.
- Cards drop on desktop and stay on phone.

## 1. Cards off, islands become the interface

Above 810px `.floor__cards` is hidden. Below 810px it is unchanged: there is no
scene at phone width and the cards are the morning brief, which is the product
at that size.

The island absorbs what the card did:

- **The caption is promoted.** `floor__isle-label` already hangs off each
  island. At rest it stays 9px mono caps at `--faint`. On hover or focus it
  goes to `--ink`, grows a hairline rule beneath it, and the desk count appears
  after the name. There is no box and no background. It sits on the island's
  front edge so it reads as a label on the object rather than a panel over it.
- **The waiting flag is unchanged**, still the numbered bubble above the
  island's back corner.
- **The venue keeps `STEP INSIDE`.**

### Accessibility

The `<svg>` keeps `role="img"` and its `aria-label`. Making SVG groups
focusable would require stripping that role and exposing the whole tree, which
would read the scene's every desk and plant to a screen reader.

Instead a visually hidden list of real `<button>`s is rendered before the svg:

```
<ul class="floor__reach" >   /* sr-only, not aria-hidden */
  <li><button>Open Bookings. Six desks. One thing waiting.</button></li>
  ...
  <li><button>Step inside the venue.</button></li>
</ul>
```

They call the same `select()` / `enterVenue()`. Their `onFocus` sets the hover
state, so keyboard focus lights the same island name plate a pointer hover
does. Pointer users click the island; assistive and keyboard users get a real
button list. Neither path is a second-class one.

## 2. Asymmetry, height, and nothing hanging off

### The overflow bug

`deskSpots()` places row `r` at `(r - (rows-1)/2) * size * 0.82` from the
island centre. With six desks that is three rows, so the last row sits at
`0.82 × size`. `Desk` then draws its sitter a further `0.72` units toward the
camera. On a 2.4 island the sitter lands at `2.69` units, past the `2.4` edge.

The fix is not a nudge. `deskSpots()` is deleted. Each department declares an
explicit `layout` array of typed placements, and every placement is clamped
into the island footprint at build time:

```ts
type Placement = { kind: PropKind; du: number; dv: number; rot?: 0 | 1 };
// clamp: |du| <= w - 0.8, |dv| <= d - 0.8
```

The clamp is a shared helper applied on read, so a future placement cannot
reintroduce the bug.

### Footprints and heights

`Dept` gains `w`, `d` (separate half-extents, so islands stop being squares)
and `lift` (plinth height, replacing the shared `ISLE_LIFT = 18`).

| dept | w x d | lift |
|---|---|---|
| bookings (ours) | 3.2 x 2.6 | 26 |
| marketing | 2.8 x 2.0 | 20 |
| suppliers | 2.6 x 2.2 | 22 |
| books | 2.2 x 2.6 | 30 |
| admin | 2.4 x 2.4 | 16 |
| roster | 2.0 x 2.0 | 18 |
| hub | 2.6 x 2.6 | 12 |

The hub stays lowest so every island looks down at the venue.

### The Monument Valley cues

Three, and only three:

- **A stair** where each walkway meets its island: three or four treads
  climbing the plinth face. This is the single strongest cue in the reference
  and the cheapest to draw.
- **One vertical per island**: a slab tower, an arch, or a stacked plinth,
  never more than one, chosen to suit the department's props.
- **The plan pushed off the diamond.** Ring positions jittered up to 1.2 units
  in radius and angle so the six stop being radially symmetrical and
  silhouettes overlap slightly front to back. Depth sort by `u + v` already
  handles the overlap.

### The view box

`VIEW = { x: -690, y: -480, w: 1380, h: 985 }` was fitted to the old uniform
plan. After the geometry lands, bounds are measured rather than guessed: a
scratch script in `docs/research/scratch/` walks every island's projected
corners plus its vertical's top, takes the extremes, and adds 40px padding.
`VIEW` is set from that output.

### Zoom

`ZOOM = 1.45` was tuned against uniform 2.4 islands; a 3.2-wide Bookings
overflows at that scale. Zoom becomes per-department:

```ts
const zoomFor = (d: Dept) =>
  Math.min(1.55, (VIEW.w * 0.52) / ((d.w + d.d) * 2 * KX));
```

`zoomTransform` takes that value instead of the constant. Its existing
centre-mapping (translate the island's centre onto the middle of the viewBox)
is correct and stays.

## 3. What each department is, shown rather than captioned

`components/art/branch-art.tsx` already draws each department's actual
mechanic, in this same isometric line language, for the home page. The Floor
reuses that vocabulary at floor scale rather than inventing a second set of
marks, so `/` and `/platform` read as one system.

Desks drop from up to six per island to one or two. The props carry the
identity.

| dept | what stands on it |
|---|---|
| Bookings, ours | the table plan itself: round tops in a room, a host stand, one top ringed as held |
| Suppliers & stock | a crate stack on a loading edge, a pallet ramp, one crate lit |
| The books | a wall of ledger rows with two offset, a safe cube |
| Admin | a counter with a pigeonhole wall behind it, a printer |
| Marketing | an easel slab, a light stand, three panels leaning queued |
| Rostering | a peg wall of shift blocks, a clock on a post |

Each prop is a component in `scene/props.tsx` taking `(u, v)` in grid units and
drawing through the shared `topFace` / `sideFaces` helpers, so they sit in the
same projection as everything else.

## 4. Colour, at a tenth

Six hues from the reference, at roughly 10% saturation with luminance held at
the values the plinth faces already measure. The scene reads monochrome until
looked at.

```
suppliers  H 150   sage
books      H 232   dusk
marketing  H  28   ochre
admin      H  42   sand
bookings   H  12   rose      (ours)
roster     H 196   teal
```

One saturation knob:

`--hue` is set once per island, on the island group, from the department's
`hue` field in `scene/data.ts`:

```tsx
<g className="floor__isle" style={{ "--hue": String(dept.hue) } as CSSProperties}>
```

One saturation knob drives idle, lifted and greyed:

```css
.floor                       { --isle-sat: 10%; }
.floor__isle-side            { fill: hsl(var(--hue) var(--isle-sat) 88%); }
.floor__isle-side--l         { fill: hsl(var(--hue) var(--isle-sat) 81%); }
.floor__stair-tread          { fill: hsl(var(--hue) var(--isle-sat) 92%); }

/* while any department is open */
.floor__office[data-open] .floor__isle              { --isle-sat: 0%; }
.floor__office[data-open] .floor__isle[data-selected] { --isle-sat: 34%; }
```

`data-open` goes on the office group when `selected` is non-null. Nothing else
reads the selection for colour, so the whole lift is two rules.

`88%` and `81%` are the lightness of the current `--surface-2` and the current
composited `--rule` left face. They are measured, not chosen, per the design
system rule: confirm both with `getComputedStyle` before committing and use
what comes back.

Hue applies to **plinth side faces, stair treads, and the lit face of the
signature prop**. Island tops stay `--surface` white. The hub stays black. The
page ground is untouched.

On select, the chosen island goes to `--isle-sat: 34%` and every other island
to `0%`, over 350ms. That lift is what the panel inherits.

### The rule this reopens, and the one it does not

`CLAUDE.md` currently says islands stay neutral and are told apart by their
labels. This spec reopens that line deliberately, on Kayden's call, and the
amendment ships in the same commit so the record does not go stale.

The other rule holds without exception: **hue is department identity and never
state**. Needs you / Watching / Done stay told apart by weight and fill on both
devices, exactly as they are now. No task state acquires a colour.

## 5. The panel delves in

When a department opens, `.floor__panel` takes `data-dept="marketing"` and:

- a 3px band across the panel top in that hue at the lifted saturation;
- the header becomes `003 · MARKETING` in mono caps, with that department's
  branch glyph at 28px beside it;
- the panel ground shifts to `hsl(var(--hue) 34% 96%)`;
- the `StackRow` chip tiles take the hue.

Everything clears in one transition on "All departments".

### Numbering

The Floor's six map onto the existing 001-009 rack in `lib/content.ts`, so the
numbers agree with the home page:

| floor id | n | branch glyph |
|---|---|---|
| suppliers | 001 | `supply` |
| books | 002 | `books` |
| marketing | 003 | `marketing` |
| admin | 004 | `reception` |
| bookings | 006 | `bookings` |
| roster | 007 | `roster` |

**Open question, copy, for Kayden.** The Floor's "Admin" is Website, Email,
Phone and Google Business, with "Calls answered" as its lead metric. That is
the rack's 004 Reception & Enquiries and 005 Web, not 008 Admin & Compliance.
This spec numbers it 004 and gives it the `reception` glyph. Renaming the
island is a copy change and is not made here.

### Knock-on edits the geometry forces

`d.size` stops existing, so every reader of it moves to `w` / `d`:

- `walkway(d)` computes its outer endpoint from `d.size`. It takes the extent
  along the department's own bearing instead: `d.w` and `d.d` projected onto
  the hub-to-island vector.
- `Island` positions its label and its waiting flag from `size`. Both move to
  the matching axis, and the label's vertical offset moves from the shared
  `ISLE_LIFT` to `d.lift`.
- `ISLE_LIFT` is deleted. Nothing may keep a fallback to it; a missing `lift`
  should be a type error, not a silent 18.
- Depth sort is `a.u + a.v`. With uneven footprints that can put a tall
  neighbour behind a near island's vertical. Sort on the near corner,
  `u + w + v + d`, and check the result in the commit-3 screenshots rather
  than assuming it.

## 6. Code structure

`agent-floor.tsx` is 1700 lines and this work adds roughly 500. It splits into
`components/platform/scene/`.

Deliberately **not** `components/platform/floor/`: that path held the deleted
react-three-fiber build, and reusing it would make the git record read as if
that build returned.

```
scene/geometry.ts   px, topFace, sideFaces, stair, arch, clamp
scene/data.ts       DEPTS (+ w/d/lift/hue/n/layout), SEATINGS, ENQUIRIES, TABLES
scene/props.tsx     Desk, Plant, Crate, Ledger, PegWall, Easel, Counter, Tower, Stair
scene/island.tsx    Island, name plate, waiting flag
scene/venue.tsx     VenueScene, VenueTable
agent-floor.tsx     orchestrator: state, panel, the reach list, the rAF loop
```

`app/platform.css` stays one file. `components/platform/floor-boot.tsx` is not
touched.

## Delivery

Four commits. Each is independently reviewable and independently revertable.

1. **Split the file.** Pure move. No visual change: the screenshots before and
   after must match.
2. **Cards off desktop, the reach list, name plates.** Interaction only,
   geometry untouched.
3. **Geometry.** Footprints, heights, stairs, verticals, per-department
   layouts, the clamp, the measured view box, per-department zoom.
4. **Colour and the panel.** Hue tokens, the select lift, panel inheritance,
   numbering, and the `CLAUDE.md` amendment.

## Verification

There is no test runner in this project. The gates are:

- `npm run build` clean, and `npx eslint` clean, on every commit.
- `node docs/research/shoot-platform.mjs` on every commit, compared against the
  previous commit's shots. Commit 1's must be identical.
- `node docs/research/shoot-tiles.mjs /platform 1440` for the per-screen pass.
- A scratch assertion in `docs/research/scratch/` that walks every department's
  clamped layout and fails if any placement, plus its drawn extent, falls
  outside its island footprint. This is the regression guard for the escaped
  sitters.
- Phone width checked at 390px: the cards must be untouched by all four
  commits.
- `prefers-reduced-motion` checked: the existing reduce block covers
  `.floor__isle`; the new stair, prop and panel transitions are added to it.
