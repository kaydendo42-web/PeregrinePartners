# Peregrine Partners — site build

Next.js 16 (App Router) + Tailwind v4 + `motion`. Rebuilt from a measured design
system rather than eyeballed: every size, spacing and radius below came out of
`getComputedStyle` on the reference at a 1440px viewport.

## Run

```bash
npm run dev     # http://localhost:3000 (3001 if 3000 is taken)
npm run build   # production build
```

## Page order

| # | Section | File |
|---|---------|------|
| 1 | Fixed nav (hide-on-scroll-down, mobile sheet) | `components/nav.tsx` |
| 2 | Hero — split headline, product card, logo marquee | `components/hero.tsx` |
| 3 | Scroll-inked statement + metric mosaic (count-ups) | `components/statement.tsx` |
| 4 | Announcement ticker | `components/ticker.tsx` |
| 5 | Works — 200px display marquee + case grid | `components/works.tsx` |
| 6 | Capabilities — horizontal accordion (stacks under `lg`) | `components/capabilities.tsx` |
| 7 | Vision — portrait plate + scroll-inked statement | `components/vision.tsx` |
| 8 | Neural grid — mono lede, model cluster, 4 animated marks | `components/neural-grid.tsx` |
| 9 | FAQ — dark accordion list | `components/faq.tsx` |
| 10 | Footer — sticky reveal, subscribe, oversized wordmark | `components/footer.tsx` |

Scope as briefed: top of page through the neural grid, then the FAQ, then the
footer. The reference's testimonial carousel, video block, process, team,
pricing and blog sections sit between those and were left out.

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

Copy lives in `lib/content.ts`. Every illustration — hero meadow, neural core,
case covers, portrait plate, footer garden, all icons and logos — is drawn in
SVG/CSS in `components/art/` and `components/ui/`, so nothing external is
fetched at runtime and no third-party imagery ships in the repo.

## Recon record

`docs/research/` keeps the measurement trail: `tokens.*.json` (colour/type/radius
tallies per breakpoint), `raw/measure-1440.json` (per-element geometry and
computed styles), `raw/sec-*.txt` (per-section readouts), reference screenshots
in `design-references/` and `raw/shots/`, and local build screenshots in
`local/shots*`. `q.py` queries the measurement dump by y-range.
