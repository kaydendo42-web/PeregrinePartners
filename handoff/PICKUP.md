# PICKUP — Peregrine Partners site

Read this top to bottom before touching anything. It is written for a session
that starts cold.

---

## 0. What this project is

A 1:1 rebuild of the **Spartan AI** Framer template as a real Next.js app, being
rebranded to **Peregrine Partners**. The user has a partnership with Spartan and
is transferring the site; the template and its assets are theirs to use.

- **Reference site:** https://spartanai.framer.website/
- **Local:** `npm run dev` → http://localhost:3001 (3000 is usually occupied)
- **Stack:** Next.js 16 App Router, React 19, Tailwind v4, `motion` (Framer Motion v12 API)
- **Repo:** git initialised, 3 commits, all work committed

---

## 1. The single most important thing: the measurement harness

**Do not eyeball this rebuild.** Two earlier rounds of "looks close" were both
rejected by the user. Everything that actually got fixed came from numbers.

Three scripts in `docs/research/`:

```bash
# 1. measure the LIVE reference (already done — output is committed)
node docs/research/extract.mjs docs/research/raw
#    → raw/measure-1440.json   every element: x/y/w/h + computed styles
#    → raw/shots/*.png         reference screenshots every 900px

# 2. measure OUR build the same way (re-run after every change)
node docs/research/extract-local.mjs docs/research/local
#    → local/measure-1440.json

# 3. diff them
python3 docs/research/diff.py
#    joins on text content, reports x/w/font/size/line-height/tracking/colour drift

# screenshots of our build only
node docs/research/shoot-local.mjs http://localhost:3001 docs/research/local/shots 1440
```

Query helpers (print a y-range with full styles):
```bash
python3 docs/research/q.py  <y0> <y1>   # reference
python3 docs/research/ql.py <y0> <y1>   # local
```

### Reading the diff output — known false positives

| Looks like | Actually |
|---|---|
| `font Inter Display->interDisplay` | next/font hashed name. Fine. |
| `w 48->177` on short strings | our block `<p>` reports container width, reference reports text width. Fine. |
| `x` drift on marquee text | animation phase at capture. Fine. |
| chars showing `rgba(26,26,26,0.1)` | scroll-highlight progress at capture. Fine. |
| rules measuring `0px` wide | `scaleX` draw-in hadn't fired. Fine. |
| `y10941 "Pricing"`, `y13085 "Insights"` | matching a nav/footer link, not the section. Fine. |

Anything else is real. **Verify a fix by re-running extract-local + diff, not by
looking at a screenshot.**

---

## 2. Where the build currently stands

### Sections built and verified against the reference

| Section | File | Status |
|---|---|---|
| Nav | `components/nav.tsx` | ✅ links land at x135/207/293/374/450 |
| Hero | `components/hero.tsx` | ✅ real photo + MP4 card |
| Statement + metrics | `components/statement.tsx` | ✅ scroll ink-in, count-ups |
| Ticker | `components/ticker.tsx` | ✅ |
| Works | `components/works.tsx` | ✅ cover 440×330 cropped, gap 266, row gap 33 |
| Capabilities | `components/capabilities.tsx` | ✅ panels 480/90/90 |
| Vision | `components/vision.tsx` | ✅ |
| Neural grid | `components/neural-grid.tsx` | ✅ cols at x60/403/745/1088 |
| **Team** | `components/team.tsx` | ✅ built last session, offsets match |
| FAQ | `components/faq.tsx` | ✅ |
| Footer | `components/footer.tsx` | ✅ rhythm 65/84 exact |

### Sections NOT built — this is Task A

Reference y-offsets (from `raw/measure-1440.json`) and the assets, **all already
downloaded to `public/assets/`**:

| Section | Ref y | Key facts | Assets (in `public/assets/`) |
|---|---|---|---|
| **Experiences** (testimonials) | 6209 | 200px marquee title; 4 quote cards; avatars 32×32; arrow buttons 40×40 | `w2hyXovp….jpg`, `rLkyXpp1….jpg`, `IIK9uqdp….jpg`, `QHChEEbp….jpg`, `6tTbkXgg….svg`, `11KSGbIZ….svg` |
| **Video block** | 7241 | full-bleed image 1440×855; "Intelligence by Design." 54px at y7878; "2mins watch" | `Y43VBCJU98vH9ESfLTOmhYvVKjY.jpg` |
| **Process** | 8347 | "OUR PROCESS" label; 54px heading y8417; 4 numbered steps `// 01`–`// 04`, first expanded; mono block y9152; "Build Now" | `QRyW2z7j….png` (400×445), `liXydHdt….png` (300×300) |
| **Pricing** | 10941 | 200px marquee; 4 tiers $495 / $1,250 / $2,900 / $7,500, 30px names, 54px prices; Monthly/Annually toggle (Save 20%); 3rd card dark | `lu9xdgbj7zB5GkewV6UCW9Y68.jpg` (339×551) |
| **Insights** (blog) | 13085 | 200px marquee; 3 cards, covers 432×260, category label, 2-line title, "Written by" + author, 60px circular arrow | `862JbA3x….jpeg`, `egDVD5dc….jpeg`, `YKAEpvQF….jpeg` |

**Reference page order** (so they slot back in correctly):
`hero → statement → ticker → works → capabilities → vision → neural → EXPERIENCES → ticker → VIDEO → PROCESS → team → PRICING → ticker → faq → INSIGHTS → footer`

Our `app/page.tsx` currently has everything except the five in caps.

---

## 3. TASK A — side-by-side audit + build the missing five

The user's instruction: open **localhost:3001** and **the live site** side by
side, walk component by component, and fix every visible difference. They said
the remaining differences are "super noticeable" to them.

**Use `claude-in-chrome`** (invoke the skill first, then the
`mcp__claude-in-chrome__*` tools). Two tabs, same scroll position, compare.
Then confirm each fix numerically with the harness in §1.

Suggested loop per section:
1. Screenshot both at the same scroll offset.
2. Note differences by eye (catches things numbers miss: crops, weights, colour).
3. Run `q.py` / `ql.py` on that y-range for the exact values.
4. Fix, re-run `extract-local.mjs` + `diff.py`, confirm.

Then build the five missing sections from the reference measurements. Do them
one at a time and verify each before moving on.

---

## 4. TASK B — Platform subpage

### What exists

Repo: **https://github.com/kaydendo42-web/consilium** (public, user's own, `gh`
is authenticated as `kaydendo42-web`). Already cloned during recon to the
scratchpad; re-clone with:

```bash
gh repo clone kaydendo42-web/consilium
```

The demo the user showed is:

**`components/sections/platform/agent-floor.tsx`** — 1709 lines, exports
`AgentFloor()`.

An isometric office floor: six departments as iso islands (Rostering, Admin,
The Books, Marketing, Suppliers & Stock, Bookings), the venue at centre with a
"PEREGRINE" roof sign, floating stat panels, and a right-hand "Two things need
you." queue with **APPROVE AND SEND** / **APPROVE THE ORDER** actions.

Internals worth knowing before porting:
- Pure SVG/CSS iso projection: `S = 44` px per grid unit, `KX = cos(30°)·S`,
  `KY = sin(30°)·S`, helpers `px()`, `topFace()`, `sideFaces()`
- Driven by a clock (`now`, minutes) — `tableState()`, `clock()` animate the morning
- `zoomTransform(dept)` — clicking an island zooms into it
- Below **810px** it swaps the floor for a stacked department list (not a
  fallback — it is the same product at phone scale)
- Sub-components: `Desk`, `Plant`, `Island`, `Hub`, `VenueTable`, `VenueScene`,
  `TaskRow`, `StackRow`

Dependencies (only three, all small — port or replace):
- `@/components/motion/reveal` (182 lines, uses `motion/react`) → **replace with our `Reveal` in `components/ui/motion-primitives.tsx`**
- `@/components/motion/use-instant-reveal` (149 lines)
- `@/components/ui/running-head` (40 lines)

CSS vars it consumes: `--fill`, `--ink`, `--muted` (plus hardcoded palette
colours inline — grep for `#` in the file).

### What to do

1. Add `app/platform/page.tsx` in **this** repo.
2. Add **Platform** to the nav (`components/nav.tsx`, `LINKS` array — currently
   Works / Services / Insights / Pricing / Company).
3. Port `AgentFloor` across with **functionality identical** — the zoom, the
   clock, the approve actions, the <810px stacked view all keep working.
4. **Restyle to the new site's design.** This is the real work. The consilium
   version is sage/green on light. Ours is the Spartan palette:
   - `--ink #1a1a1a`, `--dark-2 #242424`, `--surface #f0f0f0`, white
   - 20px card radius, 16px buttons with the 65×59 icon slot
   - Inter Display for headings, Geist Mono for labels/eyebrows, IBM Plex Mono
     for name plates
   - Section shell: 12px page gutter, 40px inner padding, 180px block rhythm
   - Reuse `components/ui/button.tsx` and `components/ui/section-label.tsx`
   so the page reads as part of this site, not a transplant.

Load the **`impeccable`** or **`frontend-design`** skill before the restyle.

---

## 5. Design system (measured, in `app/globals.css`)

```
Surfaces   #ffffff page · #f0f0f0 light card · #1a1a1a dark · #242424 raised
Shell      12px gutter · 20px card radius · 40px inner padding · 180px rhythm
Type       70/77 hero (ls −2.8) · 56/60 statement (−2) · 54/59.4 display (−2.16)
           200/220 marquee (−8, w700) · 100/100 team (−4)
           20/28 card title (−0.4) · 16/24 body w300 · 15/22.5 small · 14/19.6 label
           12/19.2 mono uppercase · 13/20.8 Plex name plates
Buttons    16px radius · 3px shell pad · 65×59 slot at 14px radius
           slot→label gap differs per instance: 26 hero / 30 FAQ / 32 dark / 14 nav
Fonts      Inter Display (local, public/fonts, official OFL release)
           Geist Mono · IBM Plex Mono · Jaini (next/font/google)
```

---

## 6. Gotchas already paid for

- **Framer serves collapsed accordion content only on expand.** The FAQ answers
  had to be clicked open in a headless browser (`docs/research/faq-extract.mjs`).
  Same will apply to the Process steps.
- **Hydration:** any `Math.*` in render must be rounded (`toFixed(2)`) or server
  and client disagree on floats. Bit us once in the dial ticks.
- **Never nest `<a>` inside `<button>`** — `Button` takes a `type` prop to render
  a real button instead.
- **Team row is 1362px inside a 1360px box** — the reference lets it bleed; don't
  "fix" it by wrapping.
- Reference cover images are **oversized and cropped** (440×330 in a 406×302
  window). Fitting them exactly makes the design look flat and wrong.
- The **footer is `position: sticky`** and revealed by the page scrolling over it.
- The reference **wordmark is a raster PNG** of the word "spartan" — it cannot be
  re-lettered. Ours renders as live text from `brand.name`; set
  `brand.wordmarkSrc` when real artwork exists.

---

## 7. Open decisions for the user

1. **Client logos.** `public/assets` holds the marks of Cigna, Aetna, CVS,
   UnitedHealthcare and Anthem — real companies the template uses as filler
   "clients", alongside testimonials credited to named executives at those firms.
   They render as neutral placeholders behind `useDemoClientLogos` in
   `lib/content.ts`. Flip to `true` only if the user confirms they are real
   clients. Same question applies to the Experiences section in Task A.
2. **Wordmark artwork** for the footer + nav lockup.

---

## 8. Tooling notes

Checked the skill library (1,211 skills) for this work. Nothing worth
installing — the only visual-regression hit is a LambdaTest cloud config
generator, and the Playwright skill adds nothing over the puppeteer harness
already here. The library's own README says it is thin on visual design.

**Use what is already installed:** `claude-in-chrome` (side-by-side),
`website-cloning` (recon → spec → build → QA), `impeccable` /
`frontend-design` (the Platform restyle), plus the harness in §1.

---

## 9. Definition of done

- Every reference section present, in reference order
- `python3 docs/research/diff.py` shows no drift outside the §1 false-positive list
- `/platform` exists, linked from the nav, functionally identical to consilium's
  `AgentFloor`, visually part of this site
- `npm run build` clean, no console errors
- Work committed
