# PICKUP

Say **"read the pickup file"** and start at the top. Written for a cold session.

Positioning, copy budgets, design tokens and the Codex policy are in `CLAUDE.md`.
Read that first. This file is only the queue.

**State:** `/platform` has been rebuilt to `handoff/art-direction.md`. The Floor
is react-three-fiber now and lives in `components/platform/floor/`. Home, About
and the site-wide edge work from the previous session are unchanged except that
the horizontal padding was halved. Typecheck, lint (0 errors, 5 pre-existing
`<img>` warnings) and `npm run build` all pass. Nothing committed.

---

## The Floor, as built

`components/platform/agent-floor.tsx` is gone. What replaced it:

| File | What it is |
|---|---|
| `floor/palette.ts` | §2 and §3. Every derived value is computed from the spec's hexes, never eyedropped. |
| `floor/kit.tsx` | §5's parts, and `applyFaceValues`, which is the one idea to understand first. |
| `floor/scene.tsx` | The world: case, venue, ring, camera, rotation, pan. |
| `floor/index.tsx` | State, and the docked column of §8. |
| `floor/chrome` → `floor.css` | §8's type, panels, buttons and layout, all scoped under `.mv`. |
| `floor/data.ts` | The morning, lifted unchanged from the old floor. Change the art, not the facts. |
| `floor/curtain.tsx` | The white-to-demo transition. |
| `app/platform/fonts.ts` | Jost and Karla, loaded from the route so they cannot leak site-wide. |

**`applyFaceValues` is the load-bearing idea.** There are no lights, so light is
assigned: the function buckets every triangle of a geometry by which way it
faces and rewrites the material groups, so any geometry at all takes
`[top, left, right]` in three draw calls. That is what makes §2 hold across
boxes, twelve-sided tables, extruded arches and domes rather than only across
boxes. Rotations must be baked into the geometry, never set on the mesh, or the
buckets describe the wrong faces. Every kit primitive takes `rotateY` for this.

**What the reader can do.** Drag the room to turn it, and it snaps to the
nearest quarter on release (§1 allows rotating the floor plan and forbids free
orbit; this is the first). Arrow keys do the same from the keyboard. Click an
island and the camera flies to its working edge, where the desks, the people at
them and the system each one works through become visible. Click into the venue
and the ring falls away while the camera comes in, and the service clock starts
at 19:40, which is the hour the room says most.

### Decisions taken, with the reasoning

- **The case is around the venue, not around the world.** §10 says *"the room
  sits inside a thin frame"*. The first pass read it as a tray under everything,
  built a 23-unit stone plate, and lost the look: every surface was the same
  pale value and the plate's two dead corners ate a third of the viewport.
  Reference 4 has no ground plane at all.
- **Three posts, not four.** A square case seen down this axis puts one corner
  dead centre-front, and a post there stands through the middle of the room.
- **The room turns inside a case that is held still.** Turning the world instead
  swings the far lintels across the room, and changes the ring's silhouette by
  three units so the camera has to be fitted for the worst quarter.
- **The ring is on one radius, turned 20° off the layout's own bearings.** The
  old layout put an island on each world diagonal, and the back diagonal
  projects to dead centre behind the venue's tower, so Admin was never visible.
- **The accent is on the crown, not the roof.** §4 says the selected object's
  top face takes the accent, which is right for a table and wrong for a
  building: a whole roof is 4–5% of the frame at focus zoom against check 4's
  3% ceiling. It is on the crenellation and the dome, and measures 0.73%.
- **The ground is the site's `--light`, not §3's mint.** Kayden's call. The
  reasoning and what still satisfies §3 and §6 is written at the top of
  `floor/palette.ts`. Do not put the gradient back without asking.
- **A phone gets a still and the brief, not the diorama.** `public/floor-plate.png`
  is a render of this same scene from
  `docs/research/scratch/shoot-plate.mjs`. **Re-run that script after any change
  to the scene**, or the two drift.

### The tools

```bash
node docs/research/scratch/shoot-floor.mjs 1440 900 out.png   # one shot
node docs/research/scratch/shoot-states.mjs                   # rest / selected / inside / turned
node docs/research/scratch/shoot-plate.mjs                    # regenerate the mobile still
node docs/research/scratch/acceptance.mjs                     # §11, the machine-checkable four
```

`acceptance.mjs` decides checks 4 and 7 and every §0 prohibition, and prints the
three that need a human looking at the pictures. All four machine checks pass as
of this session.

---

## 1. What is left on the Floor

1. **The venue's interior is thinner than the ring.** Tables, chairs, paving and
   the phone log are there, but the room has no pass, no bar and no service
   flow, and the banquettes read as planks. It is the screen a reader spends
   longest on.
2. **Only the venue's own state animates.** Approving a decision changes the
   panel and resolves the enquiry, but the island does not visibly drain from
   coral back into the architecture. That transition is the product's whole
   claim made spatially and it is currently only made in the panel.
3. **The other five departments have no state mapping of their own.** They
   inherit "anything waiting makes the island advance", which is right but
   generic. The old handoff's warning stands: decide the mapping per department
   before building more of them, or they drift apart.
4. **`STATE_LIFT` in `palette.ts` is defined and unused.** It was going to
   reinforce the depth reading in geometry as well as in value. Either wire it
   into the island rest height or delete it.
5. **The desks are only drawn on the selected island.** Reasonable, but it means
   the resting floor shows architecture with nobody in it.

## 2. The rest of the site

- **Horizontal padding was halved this session** at Kayden's request: `--pad-x`
  40 → 20, `--pad-x-sm` 24 → 12. Content now runs 32..1408 at 1440, identically
  for every section of `/` and `/about` (`docs/research/scratch/measure-edges.mjs`).
  Above about 1632px the inset is set by `--measure: 1600px` instead, so nothing
  moved there. Kayden was told; widening the cap is still open.
- `--block-gap` is still not wired: every section types its own `py` and they
  range 120 to 250. Good Codex job, and the last piece of the old 2.3.
- `agents.heading` on the home page still says "Nine agents on the floor", which
  is the count claim wearing a different noun. Left alone deliberately: it is a
  copy decision, not a rule fix.
- `app/page.tsx`'s header comment about handoffs to `/about` is still accurate
  as rewritten last session.

## 3. Open questions for Kayden

1. **Audience width.** Hero says "business"; the departments still say covers,
   service and the till. My call is hero wide, departments concrete. Undecided.
2. **The $749 bookkeeper figure** is still the largest number on the homepage,
   and it is price-forward. Keep, move to the FAQ, or cut.
3. **The content cap.** `--measure: 1600px` is what sets the side space above
   1632. Widen it, or leave the site inset on a large monitor.
4. **The FAQ.** Recommendation stands: keep it, trim answers to 45 words. It
   carries every citation on the homepage.
5. **Losing the partner story from home** removes the strongest credibility
   device a four-client firm has. Correct long-term, a cost right now.
