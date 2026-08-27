# Peregrine Partners

Next.js 16 (App Router) + Tailwind v4 + `motion`. Built on a measured design
system rather than eyeballed: every size, spacing and radius below came out of
`getComputedStyle` on the reference at a 1440px viewport.

Copy and content rules live in `handoff/02-peregrine-remould.md`. Read that
before changing a word on the site.

## Run

```bash
npm run dev     # http://localhost:3000 (3001 if 3000 is taken)
npm run build   # production build
```

## Pages

| Route | What it does |
|---|---|
| `/` | Sells the result: what a week looks like with the nine branches on |
| `/about` | The argument. Where the hours go, why nine good products still leave you working at eleven at night |
| `/platform` | The floor demo, ported from `consilium` |
| `/waitlist` | Intake form, nine-branch picker, API route behind it |
| `/sign-in` | Door to the client dashboard. Answers identically for every address |

## Home, in order

| # | Section | File |
|---|---------|------|
| 1 | Fixed nav, falcon lockup, four links, Join Waitlist | `components/nav.tsx` |
| 2 | Hero, split headline, platform card, connection rail | `components/hero.tsx` |
| 3 | Scroll-inked promise + the metric mosaic | `components/statement.tsx` |
| 4 | Announcement ticker | `components/ticker.tsx` |
| 5 | The floors it runs on | `components/roster.tsx` |
| 6 | External departments 001-005 | `components/external.tsx` |
| 7 | Why we built it | `components/vision.tsx` |
| 8 | The connected stack | `components/stack.tsx` |
| 9 | Internal departments 006-009 + the plate of nine | `components/internal.tsx` |
| 10 | The partners | `components/team.tsx` |
| 11 | FAQ, sourced | `components/faq.tsx` |
| 12 | Footer, sticky reveal, oversized wordmark | `components/footer.tsx` |

Two devices carry the whole site. The **three states** (Needs you / Watching /
Done) are told apart by weight and never by colour. The **nine departments**
run 001 to 009 across the two sections without restarting, because they are one
set split by where the work points.

## Design tokens

`app/globals.css` holds the measured system:

- Surfaces `#ffffff` page, `#f0f0f0` light card, `#1a1a1a` dark, `#242424` raised dark
- Section shell: 12px page gutter, 20px card radius, 40px inner padding, 180px block rhythm
- Type: 70px hero / 56px statement / 54px display / 20px card title / 16px body / 15px small / 12px mono, tracking −0.04em on display sizes with `opsz 32`
- Buttons: 16px radius, 3px shell padding, 65×59 icon slot at 14px radius
- Fonts: Inter (display substitute), Geist Mono, Jaini for the language ticker

## Motion

- Entrance: fade + rise + blur-out, `cubic-bezier(0.22,1,0.36,1)`, once per block
- Scroll-linked: per-character ink-in on the two statement blocks, hero parallax
- Loops: four marquees, orbiting icon, fader icon, language strip, card scan line
- Interaction: nav link roll, button icon swap, accordion open/close, count-ups
- All loops respect `prefers-reduced-motion`

## Content and assets

Every word lives in `lib/content.ts`, under four rules set out at the top of
that file: no figure without a source, no invented scale, write to the owner
rather than the investor, and no em dashes. `<Cite>` renders the source
registry; a citation that cannot be clicked is decoration.

The falcon, the nine agent discs, the hero card's floor and the five branch
objects are all drawn in SVG in `components/art/` and `components/ui/`. Brand
and client artwork sits in `public/brand`, portraits in `public/people`.

## Capture

```bash
node docs/research/shoot-tiles.mjs [path] [width]
```

Walks a page at an exact viewport and writes one PNG per screen to
`docs/research/tiles/`, reporting console errors, failed requests and
horizontal overflow. Marquees always report overflow; they are wider than the
viewport by design.

## Recon record

`docs/research/` keeps the measurement trail: `tokens.*.json` (colour/type/radius
tallies per breakpoint), `raw/measure-1440.json` (per-element geometry and
computed styles), `raw/sec-*.txt` (per-section readouts), reference screenshots
in `design-references/` and `raw/shots/`, and local build screenshots in
`local/shots*`. `q.py` queries the measurement dump by y-range.
