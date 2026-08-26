# PICKUP — Peregrine Partners site

Read top to bottom before touching anything. Written for a session that
starts cold.

---

## 0. What this is

A 1:1 rebuild of the **Spartan AI** Framer template as a real Next.js app,
rebranded to **Peregrine Partners**, plus a `/platform` page carrying the
agent-floor demo ported from the user's own `consilium` repo.

- **Reference site:** https://spartanai.framer.website/
- **Local:** `npm run dev` → http://localhost:3001
- **Repo:** https://github.com/kaydendo42-web/PeregrinePartners (private)
- **Vercel:** `kaydendo42-webs-projects/peregrine-partners`, deploys on push to `main`
- **Stack:** Next.js 16 App Router, React 19, Tailwind v4, `motion` (Framer Motion v12 API)

---

## 1. The measurement harness

**Do not eyeball this rebuild.** Everything that ever got fixed came from
numbers. Scripts live in `docs/research/`.

```bash
node docs/research/extract.mjs docs/research/raw      # measure the live reference
node docs/research/extract-local.mjs docs/research/local   # measure our build
python3 docs/research/diff.py                          # per-string x/w/type drift
python3 docs/research/align.py [y0] [y1]               # vertical rhythm, the useful one
python3 docs/research/pair.py <y0> <y1> <delta>        # ref and local side by side
node docs/research/compare.mjs                         # matched screenshot pairs
node docs/research/shoot-widths.mjs [path]             # 390 / 810 / 1100 strips
node docs/research/shoot-platform.mjs                  # /platform full-page strip
python3 docs/research/q.py  <y0> <y1>                  # reference y-range, full styles
python3 docs/research/ql.py <y0> <y1>                  # same for local
```

### align.py is the tool that matters

Our page drops sections the reference has, so absolute y no longer lines up.
`align.py` joins on text and prints `ref_y − local_y` per string. **Inside a
correctly built section the delta is constant**, and every place the delta
steps is a rhythm error worth exactly the pixels it moved. Chase steps, not
absolute values.

### Two capture bugs already paid for — do not reintroduce

1. The extract scripts walked the page with `document.body.scrollHeight` while
   `scroll-behavior: smooth` was on. `scrollBy` animated, the loop read
   `scrollY` back and saw no movement, and **capture stopped at y=779** — so
   everything below was measured in its pre-reveal state. Both scripts now
   force `scrollBehavior = 'auto'` and drive absolute offsets.
2. `Reveal` used `whileInView`. IntersectionObserver reports at rendering
   steps, so a block that enters and leaves between two of them is never seen
   and **stays at opacity 0 forever**. `Reveal` now latches on the element's
   rect through one shared clock-throttled sweep in
   `components/ui/motion-primitives.tsx`. It is throttled on `Date.now()`, not
   rAF, because a headless or backgrounded tab stops serving frames and a
   dropped sweep would strand every remaining block.

### Reading the diff — known false positives

| Looks like | Actually |
|---|---|
| `font Inter Display->interDisplay` | next/font hashed name. Fine. |
| `w 48->177` on short strings | our block `<p>` reports container width. Fine. |
| `x` drift on marquee text | animation phase at capture. Fine. |
| chars showing `rgba(26,26,26,0.1)` | scroll-highlight progress at capture. Fine. |
| `y42 "Company"` Δ−20 | matches the mobile menu's copy, not the nav. Fine. |
| `y198 "Build with AI."` Δ−81 | the reference wraps both hero lines in one animated span. Fine. |
| `y10941 "Pricing"`, `y13085 "Insights"` | matching a nav link, not the cut section. Fine. |
| marquee `right=` overflow in shoot-widths | marquees are wider than the viewport by design. Fine. |

Anything else is real. **Verify a fix by re-running extract-local + align, not
by looking at a screenshot.**

---

## 2. Where the build stands

The whole home page sits within **±3px** of the reference, and the footer
within 1px. `python3 docs/research/align.py` is the proof.

| Section | File | Notes |
|---|---|---|
| Nav | `components/nav.tsx` | persistent (the reference never hides it); links are root-relative |
| Hero | `components/hero.tsx` | trust line 10px above the logo line |
| Statement | `components/statement.tsx` | 208px lead-in, 40px to the mosaic, 172px floor |
| Ticker | `components/ticker.tsx` | 29px of air each side of the line |
| Works | `components/works.tsx` | marquee gap 46, starburst 151 at 60px |
| Capabilities | `components/capabilities.tsx` | 880 tall, no floor — the panels reach it |
| Vision | `components/vision.tsx` | headline capped at 545px for the reference's six lines |
| Neural grid | `components/neural-grid.tsx` | 55px icon block |
| **Film frame** | `components/video-block.tsx` | 1440×855 still, no parallax |
| **Process** | `components/process.tsx` | four-step accordion, collapsed bodies read off the live site |
| Team | `components/team.tsx` | nests inside the dark run, 90px lead-in |
| FAQ | `components/faq.tsx` | 234px rail gap |
| Footer | `components/footer.tsx` | 1140 tall, stacked lockup, hanging dash markers |
| **Platform** | `components/platform/agent-floor.tsx` + `app/platform.css` | ported and restyled |

**Page order** (reference order minus the cut sections):
`hero → statement → ticker → works → capabilities → vision → neural → ticker
→ film → dark run (process + team) → ticker → faq → footer`

### Deliberately cut

The user removed **Pricing**, **Experiences** (testimonials) and **Insights**
(blog) from the blueprint: all three are fake-content sections. Their
reference measurements are still in `raw/measure-1440.json` at y10941, y6209
and y13085 if they are ever wanted, and the assets are in `public/assets`.

---

## 3. Things the numbers cannot see

Framer draws borders on pseudo-elements, so **every outline in the reference
is invisible to `extract.mjs`**. That cost a whole round. When a panel looks
flat next to the reference, suspect a border before anything else. Already
found and fixed: capability panels, their index pills, the process plate, the
vision portrait frame, the team portrait capsules, the step rows.

Other reference behaviour worth knowing:

- **Works covers are hidden until hover.** The reference rests on the client's
  logo on white and fades the photo in. We have no client marks, so the cover
  is the content — flip `initial` to `opacity: 0` in `works.tsx` the moment
  real artwork lands.
- The **reference wordmark is a raster PNG** of the word "spartan". Ours is
  live text; set `brand.wordmarkSrc` when real artwork exists.
- **Framer accordions only mount collapsed content on expand.** Both the FAQ
  and the process steps had to be clicked open in a headless browser
  (`faq-extract.mjs`, `process-extract.mjs`). The same will be true of
  anything else that collapses.
- The **footer is `position: sticky`** and revealed by the page scrolling over
  it, so the extract measures it at its scroll-0 position.
- **Team row is 1362px inside a 1360px box** — the reference lets it bleed.
- Reference cover images are **oversized and cropped** (440×330 in a 406×302
  window). Fitting them exactly makes the design look flat.
- **Never nest `<a>` inside `<button>`** — `Button` takes a `type` prop.
- Any `Math.*` in render must be rounded (`toFixed(2)`) or server and client
  disagree on floats.
- Our cut of Inter Display sets **~6% wider** than the reference's at display
  sizes, so matching a measured column width can cost a line of wrap. Set the
  max-width to reproduce the reference's *break points*, not its pixel width.

---

## 4. Design system (measured, in `app/globals.css`)

```
Surfaces   #ffffff page · #f0f0f0 light card · #1a1a1a dark · #242424 raised
Shell      12px gutter · 20px card radius · 40px inner padding · 180px rhythm
Type       70/77 hero (ls −2.8) · 56/60 statement (−2) · 54/59.4 display (−2.16)
           200/220 marquee (−8, w700) · 100/100 team (−4)
           20/28 card title (−0.4) · 16/24 body w300 · 15/22.5 small · 14/19.6 label
           12/19.2 mono uppercase · 13/20.8 Plex name plates
Buttons    16px radius · 3px shell pad · 65×59 slot at 14px radius · justify-start
           slot→label gap per instance: 26 hero · 30 team/FAQ · 43 process · 14 nav
           `minWidth` for the few the reference sets to a fixed width
Marks      Mark() is a chevron on a 10×5 pixel grid, 3px pitch, 2 corner accents
           LogoPill is a 6px ring: 60×34 outside, 48×22 inside
Eyebrow    SectionLabel: capsule · rule · label, 20px gaps, either alignment
Fonts      Inter Display (local, public/fonts, official OFL release)
           Geist Mono · IBM Plex Mono · Jaini (next/font/google)
```

---

## 5. `/platform`

`app/platform/page.tsx` wraps `components/platform/agent-floor.tsx` (1709
lines, ported whole from `consilium`). Behaviour is unchanged from the
original: department zoom, step-inside-the-venue with its running clock, the
two approvals with their burst particles, and the stacked list below 810px.

The restyle is almost entirely the token block at the top of
`app/platform.css` — the scene was already token-driven, so the sage/teal/cere
system collapses onto our monochrome ramp. **The three task states are told
apart by weight, not hue**: solid mark = needs you, ring = watching, soft mark
= done (overrides at the foot of the file). The venue block keeps a spread
fill ramp so its three facets stay separable without colour.

If the floor ever needs work, `node docs/research/shoot-platform.mjs` gives a
full-page strip and reports console errors.

---

## 6. Open decisions for the user

1. **Client logos.** `public/assets` holds the marks of Cigna, Aetna, CVS,
   UnitedHealthcare and Anthem — real companies the template uses as filler.
   They render as neutral placeholders behind `useDemoClientLogos` in
   `lib/content.ts`. Flip to `true` only if they are real clients. This also
   decides the Works card treatment (see §3).
2. **Wordmark artwork** for the footer and nav lockup.
3. **Copy.** Everything is still the template's AI-agency text, on the user's
   instruction, so the harness can diff on it. The `/platform` copy is the
   only Peregrine-specific writing on the site.

---

## 7. Definition of done

- Every kept reference section present, in reference order ✅
- `align.py` shows no step outside the §1 false-positive list ✅
- `/platform` exists, linked from nav and footer, functionally identical to
  consilium's `AgentFloor`, visually part of this site ✅
- `npm run build` clean, no console errors, no lint errors ✅
- 390 / 810 / 1100 all check out ✅
- Work committed and pushed; Vercel deploys on push ✅
