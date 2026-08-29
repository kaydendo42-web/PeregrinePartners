# PICKUP

Say **"read the pickup file"** and start at the top. Written for a cold session.

Positioning, copy budgets, design tokens and the Codex policy are in `CLAUDE.md`.
Read that first. This file is only the queue.

**State:** `/platform` is back on the original agent floor, the isometric SVG in
`components/platform/agent-floor.tsx`. The react-three-fiber rebuild has been
deleted entirely (2026-08-29, Kayden's call). Home, About and the site-wide edge
work from the previous session are unchanged except that the horizontal padding
was halved. Typecheck and `npm run build` pass.

---

## The Floor

`components/platform/agent-floor.tsx` is the whole thing, one file, with
`app/platform.css` for its styles. Six departments drawn as isometric islands
you click into, the venue as the hub at the centre that you step inside, and the
morning brief docked down the right. Below 810px it becomes the department cards
as a list, which is the same product at phone scale, not a fallback.

Its heading and sub ("Everything that ran while you were closed.") came out on
Kayden's call; the live-demo badge and the three-state legend hold the top edge
alone now.

**The react-three-fiber build is deleted.** `components/platform/floor/`,
`app/platform/fonts.ts`, `public/floor-plate.png`, the `shoot-states` /
`shoot-plate` / `acceptance` scripts, and the `three` + `@react-three/*`
dependencies all came out with it. `handoff/art-direction.md` stays only as the
record of that build: **it describes no code any more, so do not build against
it.** The source is in git at `938b4fc..378f6b5` if it is ever wanted back.

## 1. What is left on the Floor

1. **The other five departments have no state mapping of their own.** They
   inherit "anything waiting makes the card advance", which is right but
   generic. Decide the mapping per department before building more of them, or
   they drift apart.
2. **Only the two waiting decisions animate on approval.** The brief resolves,
   but nothing on the island itself visibly settles. That transition is the
   product's whole claim made spatially and it is currently only made in the panel.

## 2. The rest of the site

- **Horizontal padding was halved this session** at Kayden's request: `--pad-x`
  40 → 20, `--pad-x-sm` 24 → 12. Content now runs 32..1408 at 1440, identically
  for every section of `/` and `/about` (`docs/research/scratch/measure-edges.mjs`).
  Above about 1632px the inset is set by `--measure: 1600px` instead, so nothing
  moved there. Kayden was told; widening the cap is still open.
- **`--block-gap` is wired now, and it has a breakpoint: 120 phone / 190
  desktop.** Measured off home rather than chosen: home's body sections land on
  120 at 390 and cluster at 180/190/192/196 at 1440. `/about` and `/platform`
  are fully on it, so every band on both pages is one rhythm. **Home is not.**
  Its sections still type their own `py`, including two deliberate 250 openings
  where the dark run starts, and moving them is the last piece of the old 2.3.
  `docs/research/scratch/measure-rhythm.mjs` prints per-band padding and the
  measure edges for both pages; `measure-edges.mjs` is still the horizontal one.
- **Watch `section-card` with a `bg-*` utility.** `.section-card` sets
  `background: var(--surface)` in `globals.css` and, authored after the Tailwind
  import at equal specificity, it beats the utility. `/platform`'s closing band
  had shipped white type on `#f0f0f0` that way. Dark cards carry their fill as
  an inline style everywhere else on the site; keep it that way.
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
