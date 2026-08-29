@AGENTS.md

# Peregrine Partners

Next.js 16 App Router, React 19, Tailwind v4, `motion`. This file is the
handoff; the `handoff/` notes it used to point at are gone, and only
`handoff/art-reference/` survives. Every word on the site lives in
`lib/content.ts`.

## The positioning, in one line

**Big companies buy the outcome. Small businesses got handed the tools and told
to drive them. Peregrine is the bridge.**

Enterprise-grade operations delivered at SMB scale. The promise is more time,
more revenue, less cost. Derived from Sequoia's *Services: The New Software*,
but that language never appears on the page. On the site it is always the
owner's own bill, never market thesis.

### What each page is for

| Page | Its one job | It must never |
|---|---|---|
| `/` | Sell the promise | Tour the product |
| `/platform` | Prove it by showing it run | Explain before it demonstrates |
| `/about` | Why *we* close the gap | Re-argue the market |
| `/waitlist` | Make step one small and free | Ask the client to self-prescribe |
| `/sign-in` | Quietly prove clients exist | Get decorated |

### Positioning rules that are settled. Do not reopen without asking.

- **Never claim a department count.** Nine is today's number, not a promise. Say
  "every department" or "the back office", never "nine departments" in a headline.
- **Never lead on price.** We are not the cheap option, we are the standard.
  Cost comparisons live in the FAQ only, where someone asked. They do not belong
  on cards, in headlines, or in the department list.
- **Never publish the wedge.** No "start with three departments." It caps the deal
  before the first meeting. Sequencing is a sales conversation.
- **Never promise not to replace things.** We integrate today and may build more
  later. "Nothing gets ripped out" is off the site.
- **Never claim to be the standard.** Define it, do not award yourself the title.
  We have four clients, and one catchable claim discredits every sourced number.
- **No revenue figure.** Evidence exists for time and cost only. State the
  revenue mechanism (missed calls, a stale listing), never a percentage.

## Copy rules

The four rules at the top of `lib/content.ts` still govern: no figure without a
source, no invented scale, write to the owner rather than the investor, no em
dashes. Added to those:

**Word budgets.** Calibrated against the Spartan reference. Over budget is a bug.

| Slot | Max words |
|---|---|
| Hero headline (both lines) | 11 |
| Hero sub | 25 |
| Display statement (56px, scroll-inked) | 16 |
| Section heading | 9 |
| Section body | 28 |
| Card body | 20 |
| Feature line | 12 |
| FAQ answer | 45 |
| About body | 60 |

The homepage sells the promise. Length belongs on `/about`, which is the only
page with a 60-word budget. If an asset has no reason to be on the page and no
substitute suggests itself, delete it rather than forcing one in.

**One CTA per screen, at most.** The nav button follows the reader down the page,
so repeating "Book the first session" in every section is noise. Home now carries
it only at the FAQ: the hero's button came out on Kayden's call, along with the
trust line under it, leaving the headline and the one card a reader can go and
use. Nowhere else.

## Design system

`app/globals.css` holds the measured tokens. They came from `getComputedStyle` on
the reference at 1440px, so do not eyeball changes.

- Surfaces `#ffffff` page, `#f0f0f0` light card, `#1a1a1a` dark, `#242424` raised
- Shell: 12px page gutter, 20px card radius, 40px inner padding (24 phone), 120/190 block rhythm
- Type: 70 hero / 56 statement / 54 display / 20 card title / 16 body / 15 small / 12 mono
- Buttons: 16px radius, 3px shell padding, 65x59 icon slot at 14px radius
- Fonts: Inter, Geist Mono, Jaini for the language ticker

**Known drift.** `--inset` and `--pad-x` are wired up and every section of `/`
and `/about` is on them, through the `band`, `band-bleed` and `measure`
utilities. `--block-gap` is wired now too, at 120 phone / 190 desktop, and
`/about` and `/platform` are fully on it. **Home is not**: its sections still
type their own `py`, including two deliberate 250 openings where the dark run
starts. When you touch a section, move it onto the token rather than adding
another literal. `docs/research/scratch/measure-edges.mjs` checks the left edge
and `measure-rhythm.mjs` checks the vertical.

**Two devices carry the site.** The three states (Needs you / Watching / Done)
are told apart by weight and never by colour. The departments run 001 upward
across one rack. On the Floor the same three states carry a
legend of their own, in weight and never in colour, on the same rule.

**On the Floor, hue is department identity.** Each of the six carries one hue from
the Monument Valley reference at about a tenth of its saturation, on the plinth
sides, the stair treads and one lit face. Opening a department lifts its island to
a third and greys the other five, and the side panel takes the same hue, number and
mark. Lightness is held at the measured 88.6 and 80.7 the plinth faces already had,
so the hue arrives without moving the scene's value structure.

Hue never carries task state, on either device. That rule is not reopened and is
checked by a grep in the Floor's own commits. The other line, that islands stay
neutral and are told apart by their labels, was reopened on Kayden's call on
2026-08-29; see `docs/superpowers/specs/2026-08-29-floor-redesign-design.md`.

Write the `hsl()` in the rule that uses it, never in a shared `--face-*` token. A
custom property declared on `.floor` resolves its own `var()` references there and
inherits the answer, so a token bakes in the default saturation and the per-island
override never lands.

## The Floor

`/platform` opens on the Floor, an isometric SVG model of a morning. The scene
lives in `components/platform/scene/` (`geometry`, `data`, `props`, `island`,
`glyphs`, `venue`) and `components/platform/agent-floor.tsx` orchestrates it:
state, the panel, and the animation loop. `app/platform.css` holds every style.
Departments as islands you click into, the venue as the hub in the middle that you
step inside, and the morning brief down the right.

Each department declares its own footprint (`w`, `d`), plinth height (`lift`),
stair face, one vertical, a hue, a rack number and a `layout` of the objects that
stand on it. There is no shared island size and no shared height. **Everything
drawn on an island goes through `place()`**, which clamps it inside the footprint:
before that, two sitters on Bookings were drawn past the plinth edge and hung over
the ground. `VIEW` comes from `sceneBounds()`, not from the eye.

Above 810px there are no floating cards. The islands are the interface, each
carrying its own name plate, and a visually hidden `.floor__reach` button list
carries keyboard and assistive access because the svg is one image to a screen
reader. Below 810px there is no scene: the cards are the morning brief and are the
controls, and `.floor__reach` is `display:none` there so nobody gets every
department twice.

`docs/research/scratch/floor-check.mjs` is the gate. It shoots every state and
asserts nothing drawn on an island falls outside it, testing each prop's ground
contact against the top face as a real quadrilateral rather than a bounding box.
Run it before and after any change to the scene.

**The react-three-fiber build is gone.** It was ported to r3f against
`handoff/art-direction.md` as a Monument Valley diorama, then flattened, and on
Kayden's call the whole thing came out on 2026-08-29 in favour of this original.
Deleted with it: `components/platform/floor/`, `app/platform/fonts.ts`,
`public/floor-plate.png`, the `shoot-states` / `shoot-plate` / `acceptance`
scripts, and the `three` + `@react-three/*` dependencies. `handoff/art-direction.md`
described that build and has since been deleted too; read it from git at
`378f6b5` if the reasoning is ever wanted. **Nothing in it describes any code
now. Do not build against it.** Recover the r3f source from git at
`938b4fc..378f6b5` if it is ever wanted back.

The frame around the Floor is still a seam: it keeps its own type and its zero
radii, and the site keeps its 20px radii and shadows. Do not propagate either way.

## Using Codex

Kayden has a Codex subscription. Hand work to it when the task is long and
mechanical rather than judgement-heavy, and when a second opinion is cheap:

- Bulk mechanical refactors, for example moving every hardcoded `px-[40px]` onto
  `var(--pad-x)` across 20 files. Give it the exact list from the audit.
- A second read on a bug that has survived two attempts here.

Keep here: anything touching copy, positioning, or what goes on which page.
Those depend on the rules above and are easy to get plausibly wrong.

Always review its diff before committing. Do not let it edit `lib/content.ts`
without a copy review against the budgets.

## Run

```bash
npm run dev     # localhost:3000
npm run build   # production
node docs/research/shoot-tiles.mjs [path] [width]   # screenshot a page per screen
```

`docs/research/align.py` is the tool that matters for rhythm: it joins reference
and local on text and prints the per-string delta. Inside a correctly built
section the delta is constant. Chase the steps, not the absolute values.
