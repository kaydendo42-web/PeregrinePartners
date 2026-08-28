# PICKUP

Say **"read the pickup file"** and start at the top. Written for a cold session.

Positioning, copy budgets, design tokens and the Codex policy are in `CLAUDE.md`.
Read that first. This file is only the queue.

**State:** homepage and About copy rewritten to the bridge narrative. Team section
removed from home. Vision photo removed. Scattered CTAs removed. Nine spacing
fixes applied. **About page restructured** (was 1.4, now done, see below).
Typecheck, lint and `npm run build` all pass on the Mac. Nothing committed.

**Done this session, on the About page:**

- Deleted the wedge band, the `$1 : $6` band, `components/about/dollar-split.tsx`
  and the three-stat row. `about.six`, `about.wedge` and `about.stats` went with
  them, and `sources.sequoia` with those, because nothing cites it now and the
  thesis is not allowed on the page anyway.
- Added the origin band on dark, in the slot the `$1 : $6` band held. It keeps
  the page's one photograph, which moved across from the wedge: the caption
  ("a counter at open") was already describing this story.
- Rewrote `about.origin.body2`, which named Sequoia and argued the market. Same
  conclusion, owner's words, 52 of the 60 allowed.
- `about.people.body` said "the same nine departments". Now says "without being
  rebuilt for each one".
- Deleting the wedge left `why` and `refuse` as two light cards stacked with no
  gap, which pinched a white notch at each end of the seam. They are one card
  with two labelled blocks now, so the page alternates ground the whole way
  down again: dark, light, dark, light, dark, light.
- Both remaining dark bands sit inside the 12px gutter as real cards. They were
  full bleed with a radius set on them, which is what put white notches in the
  viewport corners and moved the content edge 12px on every ground change. The
  whole page now starts at 68px, and each band's padding is one constant at the
  top of the file rather than six copies of `md:px-[56px]`.

**Still open on that page:** it sits at 68px where the home page hero sits at
52px. Whichever survives, `--pad-x` should carry it. See 2.2.

**Done this session, on the home page:**

- **The Vision hole is filled** (was 1.2). `components/art/floor-vignette.tsx` is
  an isometric vignette built to `handoff/art-direction.md`: the floor before
  open, the work handled overnight drained back into the architecture, one block
  standing proud of it with the only accent in the frame. It is the state system
  argued spatially, and it is the first place on the site a reader meets the
  Floor's world. All seven of the spec's section 11 acceptance checks pass
  against the shot.
  - It is SVG, not react-three-fiber. A still frame in a marketing block costs a
    few hundred polygons and no runtime; the Floor itself rotates and is picked
    from, so that one is still the r3f job.
  - The plate is the seam. Site 20px radius outside it, the Floor's zero radii
    and palette inside, and none of the Floor's type anywhere. Do not let either
    language cross that edge.
  - `OX`, `OY` and `K` in that file are derived from the scene's extreme
    projected points, not eyeballed. Move anything tall, or anything at the
    plinth edge, and they want recomputing or the model drifts off centre.
  - **Open:** on a 390px screen the model lands about 186px wide. It reads, but
    it is small. A second tighter `viewBox` for mobile would fix it and would
    also be a rehearsal for the same question on `/platform`.
- **The worked example is a product card now** (was 1.3).
  `statement.worked` carries supplier lines rather than a sentence: item,
  movement, action, state. Same two price moves it always had. The bread went
  back on order overnight, the tomatoes did not, and the state marks carry the
  difference, so the card argues the saving and the mechanic at once.
- **The hero headline sets its own rag** and the sub is gone. It ran five lines
  and the sub sat over the photograph's grass where it could not be read.
  `hero.headlineDim` and `headlineLit` are arrays of lines now, held from `md`
  up and left to reflow on a phone. Two constraints drove the break points: at
  70px the gap between four lines and five is about five pixels of column, so a
  box left to decide decides differently on a different machine; and the
  photograph has a television at x 630, so any line past about 570px loses its
  last word into it. Every line now stops short of it. **`hero.sub` is deleted**,
  so the hero's only prose is the trust line at the foot of the plate.
- **The metric mosaic is 20% larger and centred.** Its columns were fixed
  pixels, right at the 1440 the design was measured at and wrong above it: the
  cards stopped at 1338 and every extra pixel piled up on the right, so at
  2000px the block sat 40px off the left edge and 550 off the right. Columns
  are ratios now, cards are 20% taller, and the section stops at 1606 and
  centres. **This is the only section on the home page with a measure.** Above
  about 1650px everything else still runs the full width, so it will read as
  inset until the rest follows. That is the same question as 2.1.
- **The connection rail carries the products' real symbols.**
  `components/ui/brand-marks.ts` holds eight monochrome paths drawn with
  `currentColor`, each with the tight bounding box measured off `getBBox` so
  they lay out from one optical height. Six came from simple-icons; Deputy's
  pinwheel and Ordermentum's monogram were pulled out of their own site
  artwork, symbol path only. MYOB publishes a wordmark rather than a symbol, so
  that row carries no second copy of the name.
  - **This reverses a rule that was written down twice.** `lib/content.ts` and
    `components/hero.tsx` both said neutral marks, never the real logos. Kayden
    asked for the change; both comments now say what the marks are and are not,
    and the rail's own label keeps the claim to what the reader already pays
    for. Nobody on that list has endorsed anything. Do not let these marks
    migrate to a section that reads as a client list or a partner wall.
  - `ClientMark` still falls through to the neutral glyph for any name with no
    entry, which is what the roster's client venues use. A made up mark for a
    real client is a different thing from a real mark for a real product.
  - `components/stack.tsx` still draws Xero, Square, Deputy and Ordermentum as
    initials in circles. Same four products, two treatments on one page now.
- **The client cards lost their two product claims** and are 20% larger. This
  settles question 3 below: it was the `0 / Logins added` and `Every action /
  Waits for you` cells, not the card note. What is left is where the floor is
  and that its bookings are ours, which are facts about the business rather
  than claims about us, and the statement section already makes both claims
  properly. Same sizing method as the mosaic: the cap moves with the cards
  (1440 to 1674) while the gutters and page padding stay, because scaling those
  too would have made the cards *smaller* at 1440, where the cap does not bind.
- **The marquee loop had a hole in it, at every width.** It rendered the
  children twice and slid the track half its own width, which is only seamless
  while one copy is at least as wide as the viewport. The rail's copy measured
  1331px, so from 1440 up the track ran out of content once per cycle. The copy
  count is measured now: enough to cover the container plus one sliding in
  behind it, with the shift written as a share of the whole track, so the speed
  does not change with the count. It remeasures on resize and again after
  `document.fonts.ready`, because web fonts change the copy's width after first
  paint. This fixes all four marquees, `/platform`'s included.
- `vision.body` claimed nine departments and ran 42 words against a 28 word
  budget. Now 26 words and no count. **It lost the sentence pointing at
  `/about`**, so the home page hands over to that page through the nav only.
  `app/page.tsx`'s header comment still claims two handoffs and is now wrong on
  both. Worth a decision rather than a quiet fix.

---

## 1. Ship-blockers, in order

### 1.1 Look at the pages
`npm run dev` and walk `/platform` and `/waitlist`. Two sections there still have
holes from an earlier pass (departments lost its note line, roster lost the card
note). The markup typechecks; nobody has looked at those two pages.

`/` and `/about` have both been walked at 1440 and 390 and shot to
`docs/research/tiles/`. No console errors, no failed requests, and the only
overflow is the ticker's own marquee track.

`docs/research/scratch/shot-el.mjs <selector> <out.png> <scale>` shoots one
element rather than a page. It is how the vignette below was iterated.

### 1.2 The Floor rebuild
This is the big one. `handoff/art-direction.md` plus its six references is the
spec. Current `components/platform/agent-floor.tsx` is 1707 lines of hand-built
isometric and will be replaced.

Decisions already made:
- **No preamble.** The demo is on screen at load. No heading, intro, stat tiles
  or marquee above it. The page's own context moves below the floor or goes.
- **Transition, not a loading screen.** White screen, the existing "The Floor"
  marquee moving across, then a smooth game-style hand-off into the demo. The
  earlier overnight-clock idea is dropped: the demo does the selling and the
  intro did not earn its place.
- **The spec is for one department.** It is written around bookings (tables,
  available/booked, time slots). The camera, materials, palette, fog, ornament
  and UI chrome rules generalise to all departments. The state semantics do not.
  Each department needs its own mapping onto the same depth trick: whatever is
  handled recedes, whatever needs a person advances. Decide that mapping per
  department before building it, or they will drift apart.
- **Codex is a good fit here.** Long, spec-following, with pass/fail acceptance
  checks in section 11 of the art direction.

**Open: mobile.** An isometric diorama on a 390px screen is a real problem.
Three options, in my order of preference:

1. **Phones get the brief, not the floor.** On a phone, serve the morning brief
   view: the short list of what happened overnight and what needs a decision.
   That is what the owner actually opens at 6am, so it is the honest mobile
   product rather than a degraded desktop one. Cheapest to build, best story.
2. **Static isometric plate.** One rendered image of the floor plus the task list
   under it. Keeps the visual, loses the interaction.
3. **Portrait-locked simplified floor.** Fewer objects, tap to zoom. Most work,
   most risk of feeling cramped.

---

## 2. Spacing and formatting audit

Full audit was run this session. Nine fixes applied:

- `components/stack.tsx` `md:px-[60px]` → `40px`. It was indenting 20px deeper
  than the two sections above it *inside one continuous dark panel*.
- `components/stack.tsx`, `components/roster.tsx`, `app/platform/page.tsx` closing
  band: all carried full desktop vertical padding at 390px. Roster was 370px of
  padding on a phone. All three now step down.
- `components/statement.tsx` `R = 30` → `20`. The four metric cards were 30px
  radius sitting inside a 20px card, directly under the hero.
- `app/page.tsx` ticker wrappers unified (they rendered at 56, 58 and 80px on one
  page with identical content).
- `app/page.tsx` a `borderRadius` set white-on-white with no visible effect, removed.
- `app/platform/page.tsx` two content max-widths on one page (1336 / 1360) unified.

### Still outstanding, ranked by visibility

1. **The home page has no single left edge.** Content starts at 52, 56, 40, 40,
   40, 52px as you scroll. Hero and Statement sit at 52 (12px gutter + 40px pad);
   Departments, Vision, Stack are full-bleed at 40; Roster is 56; Faq is 52. Pick
   one and enforce it.
2. **`--inset`, `--pad-x`, `--block-gap` are defined and never used.** Zero
   references anywhere. That is *why* the numbers diverged. Wiring these up is the
   single highest-leverage cleanup and it is a good Codex job: 40 / 48 / 56 / 60
   all collapse to `var(--pad-x)`.
3. **Vertical rhythm ranges 172 to 250px** where the system says 180. The two
   joins inside the home page's dark run are 250px and 340px, 90px apart, inside
   one panel. `components/departments.tsx` `md:pb-0` + `components/vision.tsx`
   `md:pt-[250px]`.
4. ~~`/about` alternates 68px and 56px content-left, and its dark bands notch
   white at the viewport corners.~~ Fixed. Every band on that page is now a card
   in the gutter at a single 68px content edge. The same pattern is worth
   checking on `/platform`.
5. **`.t-team` at `app/globals.css:202` is dead CSS.** Defined only inside
   `@media (min-width: 1440px)` with no base rule, and `components/team.tsx`
   overrides it with an inline clamp that always wins. The heading renders at up
   to 100px, larger than the 70px hero and off the scale entirely.
6. **Three stat-card families, three sizes, three trackings** (43/-2 sans,
   40/-1.6 mono, 34/-1 mono, 34/-1.4 sans). Two of them are on `/about` two
   sections apart. Card gaps disagree too (22 / 20 / 24).
7. **11px mono is a de facto second size** hardcoded 14 times against a 12px
   `t-mono` token, with tracking varying between 0.06em and 0.08em.
8. **Roster grid gutter is `gap-x-[52px] gap-y-[33px]`** where every other card
   row on the site uses `gap-[10px]`.
9. **Off-scale radii:** hero card 18/5 (button lockup is 16/3), footer subscribe
   17/6, vision photo 12 vs the same treatment at 20 on `/about`, departments
   index pills 10 where `--r-chip` is 12, roster card `19px 19px 10px 10px`,
   statement icon square 16 where the icon slot is 14.
10. ~~`app/about/page.tsx` engages `md:grid-cols-[80px_320px_1fr]` at 768px,
    leaving the third column 172px wide.~~ Fixed, it waits for `lg:` now.

### Dead code found, safe to delete

`hero.bgBack`, `roster.label`, all three `states[].note`, `brand.name`,
`brand.city`, `signIn.sending`, `platform.cta.href` (hardcoded at the call site).
Unreachable props: `Ticker`'s `tone`, `SectionLabel`'s `align`, `Button`'s `icon`.
Never imported: `LogoPill` (`components/ui/mark.tsx`), `Parallax`
(`components/ui/motion-primitives.tsx`). Unreferenced tokens: `--dark-3`,
`--paper-06`, `--paper-04`.

---

## 3. Open questions for Kayden

1. **Audience width.** The hero now says "business"; the departments still say
   covers, service and the till. Clients already include an arts school and a head
   spa. My call is hero wide, departments concrete, because concreteness is what
   convinces an owner you have stood in a room like theirs. Not yet decided.
2. **The $749 bookkeeper figure** is still the largest number on the homepage. It
   is a sourced credibility asset, but it is also price-forward, which is the
   thing we just took off the department cards. Keep, move to the FAQ, or cut.
3. ~~**Section 05.** "Remove the 0 logins and every action section".~~ Settled.
   It was the two stat cells on the client cards, and they are gone. The card
   note dropped in the earlier reading has not come back; say if it should.
4. **The FAQ.** Kayden offered to cut it. Recommendation: keep it. It is the only
   place that handles objections and it carries every citation on the homepage
   (Fair Work, OAIC, Xero share). Cutting it removes every source from the page,
   which contradicts content rule 1. Trim to 45 words an answer instead.
5. **Losing the partner story from home** removes the strongest credibility device
   a four-client firm has. Correct for the long-term goal, a cost right now.
