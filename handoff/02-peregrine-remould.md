# Peregrine remould

Read `PICKUP.md` first for the measurement harness and the blueprint's own
rules. This file covers what changed when the template's copy came out and
Peregrine's went in, and it is the file to read before touching any wording.

---

## 0. What this pass did

Phase 2 from `PICKUP.md` §6.3: the site stopped being the Spartan template with
a Peregrine name on it. Layout, motion and the measured design system are
unchanged. Everything else is new.

| Slot | Was | Is |
|---|---|---|
| Nav | capsule + 5 template links + "Hire Team" | falcon lockup, Home / Platform / About Us / Sign in, **Join Waitlist** |
| Hero card | "Digital Brain v4.0.2" over a rendered engine | **Test out our platform**, over a drawn nine-tile floor, linking to `/platform` |
| Hero rail | five real health-insurer logos | neutral marks for the systems we work through |
| Statement mosaic | invented $45M / 15,400 agents / 5x | a sourced market rate, the **nine agents**, the three states, the approval dial, a labelled worked example |
| Works | five invented case studies | **The floors**: four real Melbourne businesses, marquee straight into the cards |
| Capabilities | 3 panels of AI-agency copy | **External branches 001–005**, each with its own drawn object |
| Vision | founder portrait + template line | Chapel Street, and a door to `/about` |
| Neural grid | frontier model logos | **the stack**, four things true of all nine branches |
| Film frame | still + inert play button | **cut**, see §6 |
| Process | 4-step deployment cycle | **Internal branches 006–009** + the nine-row index plate |
| Team | 4 stock people with invented quotes | Kayden, Jason, Thomas, with what each does |
| FAQ | 7 generic answers | 8 owner questions, sourced |
| — | — | **`/about`**, **`/waitlist`** (+ API route), **`/sign-in`** |

---

## 1. The rules the copy is written under

These live at the top of `lib/content.ts` as well. They are not style
preferences; each of them is load-bearing.

1. **No figure without a basis.** Every number is a published Australian market
   rate carrying its source, or arithmetic modelled on a real venue's invoices
   and labelled as modelled. `sources` in `content.ts` is the registry; the
   `<Cite>` component renders it, and a citation that cannot be clicked is
   decoration.
2. **No borrowed credibility and no invented scale.** A logo appears only where
   the relationship is real. The site also never prints a customer count, a
   headcount, a founding year or an office list, because all four would have to
   be made up. **The line: writing with the confidence of an established firm is
   positioning. Printing "trusted by 200 venues" is a lie. Do not cross it.**
3. **Write to the owner, not the investor.** Covers, rosters, invoices,
   Saturday, the phone. The market thesis behind this business belongs in
   consilium's handoff docs, not on the page.
4. **No em dashes.** Also no adverbs, no throat-clearing, no "not X but Y".
   `grep -c "—" lib/content.ts` should return 0.

### What changed on rule 2, and why

An earlier draft of this pass led with being three founders and four customers,
on the reasoning that early-stage candour sells. The call came back the other
way: present as an established consultancy, and use the four businesses as
illustrations of the kinds of floor the branches suit rather than as a customer
ledger. The roster section, the hero trust line, the About stats and one FAQ
were rewritten for that. Nothing was replaced with a fabricated fact, and the
comment block in `content.ts` exists so the next pass does not drift across
that line by accident.

---

## 2. The two structural devices

**The three states.** `Needs you` / `Watching` / `Done`, told apart by weight
and never by colour, the same rule `app/platform.css` already followed. They
run through the statement mosaic, the hero card, `/platform` and the
waitlist confirmation. `components/ui/state-mark.tsx` is the single source.

**One index of nine.** External branches are 001–005 and internal are 006–009,
numbered on rather than restarting, because the point is that they are one set
split by where the work points. The plate in `components/internal.tsx` prints
the whole index so the claim is visible rather than asserted, and the hero
card's nine tiles are the same nine in the same order.

---

## 3. New pieces worth knowing about

- **`components/ui/mark.tsx`** now exports `Falcon` and `Logo`. The falcon is a
  peregrine in a stoop, drawn hard-edged on a 0.2 grid because the smallest it
  renders is 16px. It is deliberately the same shape as the existing `Mark()`
  chevron.
- **`components/art/agent-avatars.tsx`** is the only colour on the site. Nine
  discs, one per branch, replacing the template's stock illustrated faces. Nine
  distinct hues make the row read as nine hands rather than one process.
- **`components/art/floor-card.tsx`** and **`branch-art.tsx`** are drawn rather
  than screenshotted. A capture of the real `/platform` floor at 308px is grey
  mush; these are drawn for the size they render at.
- **`app/api/waitlist/route.ts`** posts to Telegram and/or Resend if the env
  keys are set, and answers 501 with `fallback: true` otherwise, at which point
  the form opens a pre-filled email. A lead is never silently dropped.

### Environment variables the waitlist wants

```
TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID    instant message on a phone
RESEND_API_KEY + WAITLIST_TO             email, optionally WAITLIST_FROM
```

Neither is set yet. Until one is, the form falls back to mailto and says so.

---

## 4. Capture harness

`node docs/research/shoot-tiles.mjs [path] [width]` walks a page at an exact
viewport and writes one PNG per screen to `docs/research/tiles/`, reporting
console errors, failed requests and horizontal overflow. It exists because the
browser on this machine could not be pinned to 1440, and reviewing a design
measured at 1440 on a 2560 viewport is reviewing a different design. Marquees
always report overflow; they are wider than the viewport by design.

---

## 5. Still open

1. **Two client fields.** `roster.clients[].logo` is null for Urban Provedore;
   drop a file in `public/brand/clients/`. The other three marks were pulled
   from each business's own site.
2. **Consent to be named.** The four businesses appear with their marks. Confirm
   each is happy to be on the page before this goes to a real domain.
3. **The waitlist channel.** See the env vars above.
4. **The dashboard.** `/sign-in` answers identically for every address, on
   purpose: telling a stranger that an address is not on an account tells them
   which venues are. Wire it when the dashboard exists.
5. **Pricing.** The FAQ answers "what does it cost" with the market rates each
   branch is priced against and defers the number to the first session. If real
   pricing lands, that answer is where it goes.
6. **`/platform` copy.** The floor demo runs six departments where the site
   sells nine branches. The page says six and says why. Keep it that way, or
   build the other three into the demo.
7. **The film slot is empty again.** It briefly held a scroll-linked overnight
   timeline, 23:40 to 06:04, and that was cut along with the roster's heading
   block: the home page was carrying two product demonstrations and `/platform`
   is the one that earns the room. If a real film ever lands, the slot sits
   between the first ticker after the dark run and the second dark run in
   `app/page.tsx`, and the old block is in this commit's history.
