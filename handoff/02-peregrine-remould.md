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
| Nav | capsule + 5 template links + "Hire Team" | the real wordmark, Home / Platform / About Us / Sign in, **Join Waitlist** |
| Hero card | "Digital Brain v4.0.2" over a rendered engine | **Test out our platform**, over the nine departments drawn as one night's run sheet, linking to `/platform` |
| Hero rail | five real health-insurer logos | neutral marks for the systems we work through |
| Statement mosaic | invented $45M / 15,400 agents / 5x | a sourced market rate, the **nine agents**, the three states, the approval dial, a labelled worked example |
| Works | five invented case studies | **The floors**: four real Melbourne businesses, marquee straight into the cards |
| Capabilities | 3 panels of AI-agency copy | **The nine departments 001–009**, each with its own drawn object |
| Vision | founder portrait + template line | Chapel Street, and a door to `/about` |
| Neural grid | frontier model logos | **the stack**, four things true of all nine branches |
| Film frame | still + inert play button | **cut**, see §6 |
| Process | 4-step deployment cycle | cut — 006–009 moved into the one department rack |
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

**One set of nine.** Departments run 001–009 in a single index. This started as
two blocks — "external" 001–005 and "internal" 006–009, numbered on rather than
restarting — but the split was vocabulary rather than substance and has since
been merged: `components/departments.tsx` carries all nine in one rack, and
`components/internal.tsx` is gone. The hero card's nine lanes are the same nine
in the same order.

They are **departments**, not branches. To a venue owner a branch is a second
site, and "the index" is architecture language. `/platform` already said
departments; the rest of the site now agrees with it. Component and type names
(`BranchArt`, `BranchIndex`) still say branch and that is fine, but no rendered
string should. "Operating layer" went the same way for the same reason.

---

## 3. New pieces worth knowing about

- **`components/ui/mark.tsx`** exports `Falcon` and `Logo`. `Logo` renders the
  real artwork at `public/brand/wordmark.png`, stacked navy serif with a mint
  pentagon over the "i", knocked out to white over a dark ground. It leads the
  nav and it is the footer's oversized statement, replacing the live Inter text
  that stood in before the artwork existed. The falcon is a drawn icon mark for
  the places a wordmark cannot go: favicon, apple-icon, the watermarks on
  `/about`, `/waitlist` and `/sign-in`, and both social cards. It is
  deliberately the same chevron shape as the existing `Mark()`.
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
7. **The falcon is ours, not yours.** The wordmark is the real logo; the falcon
   icon was drawn for this build to fill the favicon and watermark slots. If a
   proper icon mark exists or gets designed, `Falcon` in
   `components/ui/mark.tsx` is the only place it needs replacing.
8. **The film slot is empty again.** It briefly held a scroll-linked overnight
   timeline, 23:40 to 06:04, and that was cut along with the roster's heading
   block: the home page was carrying two product demonstrations and `/platform`
   is the one that earns the room. If a real film ever lands, the slot sits
   between the first ticker after the dark run and the second dark run in
   `app/page.tsx`, and the old block is in this commit's history.
