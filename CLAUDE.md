@AGENTS.md

# Peregrine Partners

Next.js 16 App Router, React 19, Tailwind v4, `motion`. Read `handoff/PICKUP.md`
before touching anything. Every word on the site lives in `lib/content.ts`.

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
so repeating "Book the first session" in every section is noise. Home carries it
in the hero and again at the FAQ. Nowhere else.

## Design system

`app/globals.css` holds the measured tokens. They came from `getComputedStyle` on
the reference at 1440px, so do not eyeball changes.

- Surfaces `#ffffff` page, `#f0f0f0` light card, `#1a1a1a` dark, `#242424` raised
- Shell: 12px page gutter, 20px card radius, 40px inner padding, 180px block rhythm
- Type: 70 hero / 56 statement / 54 display / 20 card title / 16 body / 15 small / 12 mono
- Buttons: 16px radius, 3px shell padding, 65x59 icon slot at 14px radius
- Fonts: Inter, Geist Mono, Jaini for the language ticker

**Known drift.** `--inset`, `--pad-x` and `--block-gap` are defined and never
referenced, so every section retypes the number and they have diverged (40, 48,
56, 60px inner padding across the site; vertical rhythm ranges 172 to 250).
There is a full audit and a fix list in `handoff/PICKUP.md`. When you touch a
section, move it onto the token rather than adding another literal.

**Two devices carry the site.** The three states (Needs you / Watching / Done)
are told apart by weight and never by colour. The departments run 001 upward
across one rack.

## The Floor art direction

`/platform` is being rebuilt to a separate, deliberate visual language: a
Monument Valley style isometric diorama. The spec is authoritative and lives in
`handoff/art-direction.md` with its six reference images. It is not a mood board.
Read it before writing any Floor code, and run its section 11 acceptance checks
against a screenshot before calling a screen done.

The clash with the site's design system is intentional. The Floor is a case you
look into, not a page you read, and the frame is the seam. Do not propagate its
palette, its type (Jost/Karla) or its zero radii into the rest of the site, and
do not propagate the site's 20px radii and shadows into it.

## Using Codex

Kayden has a Codex subscription. Hand work to it when the task is long and
mechanical rather than judgement-heavy, and when a second opinion is cheap:

- Bulk mechanical refactors, for example moving every hardcoded `px-[40px]` onto
  `var(--pad-x)` across 20 files. Give it the exact list from the audit.
- Porting the Floor to react-three-fiber against `handoff/art-direction.md`,
  which is a long spec-following job with pass/fail acceptance checks.
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
