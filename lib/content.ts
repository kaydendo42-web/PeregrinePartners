/**
 * Every word on the site, in one file.
 *
 * Four rules govern what is allowed in here.
 *
 * 1. **No figure without a basis.** Every number is either a published market
 *    rate carrying its source, or arithmetic modelled on a real venue's real
 *    invoices and labelled as modelled. Nothing here is a claim about a
 *    customer's result. `sources` below is the citation registry; cite by key.
 * 2. **No borrowed credibility, and no invented scale.** A logo appears only
 *    where the relationship is real. Equally, the site never states a customer
 *    count, a headcount, a founding year or an office list, because we would
 *    have to make them up. Confidence is in the voice, never in a fabricated
 *    fact. The line to hold: implying an established firm is positioning;
 *    printing "trusted by 200 venues" is a lie. Do not cross it.
 * 3. **Write to the owner, not to an investor.** Covers, rosters, invoices,
 *    Saturday, the phone. The strategy behind this business is not the pitch,
 *    and market-thesis language belongs in the handoff docs, not on the page.
 * 4. **No em dashes, no adverbs, no throat-clearing.** Short sentences next to
 *    long ones. A venue owner reads this on a phone at six in the morning.
 *
 * See `handoff/PICKUP.md` and consilium's `04-claims-and-evidence.md`.
 */

const A = "/assets";

/* ------------------------------------------------------------------ *
 * Citation registry
 * ------------------------------------------------------------------ */

export type SourceKey = keyof typeof sources;

export const sources = {
  anthropic: {
    label: "Anthropic, Building Effective AI Agents",
    href: "https://www.anthropic.com/engineering/building-effective-agents",
  },
  fwo: {
    label: "Fair Work Ombudsman, Hobart hospitality inspections, Aug 2026",
    href: "https://www.fairwork.gov.au/newsroom/media-releases/2026-media-releases/august-2026/20260804-hobart-fast-food-restaurants-and-cafes-inspections-results-media-release",
  },
  oaic: {
    label: "OAIC, Notifiable Data Breaches scheme",
    href: "https://www.oaic.gov.au/privacy/notifiable-data-breaches/about-the-notifiable-data-breaches-scheme",
  },
  xeroShare: {
    label: "Scale Suite, Xero's Australian market share",
    href: "https://www.scalesuite.com.au/resources/xero-market-share-australian-businesses",
  },
  adminHours: {
    label: "Scale Suite, Where SME owners spend their time",
    href: "https://www.scalesuite.com.au/resources/where-sme-owners-spend-their-time",
  },
  margins: {
    label: "Calso, Australian restaurant profit margins, 2026",
    href: "https://calso.com.au/blog/average-restaurant-profit-margins-in-australia-2026-benchmark-guide",
  },
  bookkeeping: {
    label: "Morelli, Bookkeeping rates in Australia, 2026",
    href: "https://morellibookkeeping.com.au/blog/bookkeeping-rates-australia-2026/",
  },
  agency: {
    label: "Codeqy, Social media management cost in Australia, 2026",
    href: "https://codeqy.com.au/blog/how-much-does-social-media-management-cost-australia",
  },
  bookingPricing: {
    label: "Restaurant Booking System, AU pricing compared, 2026",
    href: "https://restaurantbookingsystem.com/compare/restaurant-booking-system-pricing/",
  },
  sequoia: {
    label: "Sequoia Capital, Services: The New Software",
    href: "https://www.sequoiacap.com/article/services-the-new-software/",
  },
} as const;

/* ------------------------------------------------------------------ *
 * Brand and navigation
 * ------------------------------------------------------------------ */

export const brand = {
  name: "peregrine",
  full: "Peregrine Partners",
  /** Navy serif lockup on transparent. Knocked out to white over dark ground. */
  wordmarkSrc: "/brand/wordmark.png",
  tickerTag: "//PEREGRINE",
  email: "hello@peregrinepartners.com.au",
  phone: "0490 066 744",
  city: "Melbourne",
};

export const nav = {
  links: [
    { label: "Home", href: "/" },
    { label: "Platform", href: "/platform" },
    { label: "About Us", href: "/about" },
    { label: "Sign in", href: "/sign-in" },
  ],
  cta: { label: "Join Waitlist", href: "/waitlist" },
};

/* ------------------------------------------------------------------ *
 * The three states.
 *
 * The product's core mechanic, and the site's structural grammar. Told apart
 * by weight, never by colour, which is the rule `/platform` already follows.
 * ------------------------------------------------------------------ */

export const states = [
  { key: "needs", label: "Needs you", note: "Drafted, waiting, will not send" },
  { key: "watching", label: "Watching", note: "Checked overnight, nothing moved" },
  { key: "done", label: "Done", note: "Handled, logged, with what it cost" },
] as const;

/* ------------------------------------------------------------------ *
 * The nine agents.
 *
 * One per department, and the one place on the site that carries colour. The
 * template ran illustrated avatars here to make its agent count feel like
 * staff rather than software, which is the same job ours has to do: an owner
 * should look at this and see a team.
 *
 * The twist is that ours are not people. Each disc is a department of the
 * venue wearing its own colour, in the order the two department sections
 * number them, and the glyph on it is the work that department does.
 * ------------------------------------------------------------------ */

export const agents = {
  heading: "Nine agents on the floor.",
  caption: "One per department. They work the night and hand you the short list.",
  roster: [
    { n: "001", name: "Suppliers", glyph: "crate", colour: "#C1663A" },
    { n: "002", name: "The books", glyph: "ledger", colour: "#2E6B57" },
    { n: "003", name: "Marketing", glyph: "post", colour: "#B4405A" },
    { n: "004", name: "Reception", glyph: "phone", colour: "#3C5EA6" },
    { n: "005", name: "Web", glyph: "pin", colour: "#6E56A8" },
    { n: "006", name: "Bookings", glyph: "table", colour: "#C79A2C" },
    { n: "007", name: "Roster", glyph: "roster", colour: "#3E8098" },
    { n: "008", name: "Admin", glyph: "file", colour: "#6B7A45" },
    { n: "009", name: "The till", glyph: "till", colour: "#8E4636" },
  ],
} as const;

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

export const hero = {
  /** Line one sets the argument, line two lands it. Line one renders dim. */
  headlineDim: "Software sold you tools.",
  headlineLit: "We do the work.",
  sub: "Nine departments of your venue run between close and open. Suppliers, books, roster, marketing, bookings, the phone. Nothing sends until you approve it.",
  cta: { label: "Join the waitlist", href: "/waitlist" },
  card: {
    title: "Test out our platform",
    meta: "// The overnight office",
    href: "/platform",
  },
  trust:
    "Melbourne hospitality, retail and wellness. We run the after-close admin on the systems you already pay for.",
  bgFront: `${A}/PXNhr4LbXoJRWLAHfzNTYjvdR5Y.webp`,
  bgBack: `${A}/v2cZIMtgjEII7EpDnUDGGgCyuiQ.jpg`,
  /**
   * The connection rail. Neutral marks, never the real logos: these are
   * systems we read and write through, not partners or endorsers. A name
   * earns its place here by publishing an API as a matter of record. See
   * consilium's `docs/research/api-and-mcp-audit.md`.
   */
  railLabel: "Runs on what you already pay for",
  rail: [
    "Xero",
    "Square",
    "Deputy",
    "Ordermentum",
    "MYOB",
    "Google Business",
    "Instagram",
    "Meta Ads",
  ],
};

/* ------------------------------------------------------------------ *
 * Statement: the promise, and the evidence under it
 *
 * Owner economics, not market thesis. Every figure is a published Australian
 * market rate for the thing a department takes over, so the comparison is one the
 * reader can check against their own bills.
 * ------------------------------------------------------------------ */

export const statement = {
  text:
    "The admin does not stop when the doors do. Peregrine works the gap between close and open, so your morning starts with a short list instead of a pile.",
  sub: "Nine departments run on the systems you already pay for. By the time you unlock the door, the orders are drafted, the takings are reconciled, the roster is costed, and the only thing waiting is what needs your call.",

  cost: {
    value: 749,
    prefix: "$",
    caption:
      "a month at the top of the range for a bookkeeper on a fixed package, before you have paid anyone to touch the roster, the socials or the phone.",
    source: "bookkeeping" as SourceKey,
  },

  /** The signature device, stated once, near the top of the page. */
  statesCard: {
    heading: "Three states.",
  },

  approval: {
    title: "Every department waits",
    caption:
      "Anthropic tells agent builders to grant autonomy in proportion to demonstrated reliability. Ours starts at none and earns it one department at a time.",
    source: "anthropic" as SourceKey,
  },

  worked: {
    text:
      "Sourdough up 6%. Tomatoes up 34%. We held the tomatoes, reordered the bread, and put the reason next to the number.",
    figure: "$614 and 9.5 hours in one month",
    attribution: "Modelled against a 40-cover Melbourne venue's July invoices.",
  },
};

/* ------------------------------------------------------------------ *
 * Ticker
 * ------------------------------------------------------------------ */

export const ticker =
  "Peregrine runs the after-close admin for Melbourne venues. Supplier prices watched and orders redrafted, takings reconciled to Xero, the roster costed against forecast covers, the phone answered through service, and a brief on the desk before you open.";

/* ------------------------------------------------------------------ *
 * The floors it runs on
 *
 * Four real businesses, shown as the kinds of floor the departments are shaped
 * around rather than as a customer list. The trades are the point: a head spa
 * that seats one guest per room and an arts school that counts terms break
 * every per-cover product on the market, which is the argument for a booking
 * system that is ours.
 *
 * ------------------------------------------------------------------ */

export const roster = {
  marquee: "On The Floor",
  label: "The Floors",
  clients: [
    {
      name: "The Peacock",
      logo: "/brand/clients/peacock.png",
      href: "https://www.thepeacock.com.au/",
      trade: "Brunch room",
      where: "South Yarra",
      note: "A 1930s weatherboard house on River Street, open seven days. Covers, walk-ins and a courtyard that fills the moment the sun does.",
    },
    {
      name: "Urban Provedore",
      logo: null as string | null, // TODO(kayden): drop a file in public/brand/clients/
      href: "https://www.instagram.com/urbanprovedore/",
      trade: "Cafe",
      where: "South Yarra",
      note: "Coffee volume, a tight kitchen, and a supplier run where six per cent on a bread line is a real number by the end of the month.",
    },
    {
      name: "Mirror Arts Education",
      logo: "/brand/clients/mirror.png",
      href: "https://mirrorartsedu.com.au/",
      trade: "Performing arts school",
      where: "Surrey Hills",
      note: "Drama, speech and music across two campuses, on a calendar that runs in terms rather than covers.",
    },
    {
      name: "Havenly Wellness & Head Spa",
      logo: "/brand/clients/havenly.png",
      href: "https://www.havenlywellnessheadspa.com.au/",
      trade: "Head spa & remedial",
      where: "Balwyn",
      note: "One guest per room, one therapist at a time. A booking system that gets that wrong costs them the day.",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * The nine departments, 001 to 009
 *
 * One index, one section. The old split — five "external" departments in
 * one block and four "internal" ones in another — was a distinction the
 * reader had to be taught before it paid anything back: an owner does not
 * think of the roster and the supplier order as two product lines. They are
 * nine jobs in one building, so they are nine tabs in one rack.
 *
 * The order still runs outward-facing first and inward-facing after, which
 * is the only part of the old split worth keeping: it reads as a walk from
 * the loading dock to the office.
 * ------------------------------------------------------------------ */

export const departments = {
  label: "Nine Departments",
  intro:
    "Everything a venue runs on, inside the building and out. The people you buy from, the people who find you, the roster, the books, and the till.",
  heading: "The whole venue, handled before you open.",
  note:
    "Nine departments. Most venues start with three and add the rest once they trust those three.",
  cta: { label: "See the platform", href: "/platform" },
  panelBgOpen: `${A}/qWpzthqQ4FGQWP39IeKgah1OP8.png`,
  panelBgClosed: `${A}/pEct5trUmjDYAblzuKYq2MpHaA.png`,
  panels: [
    {
      n: "001",
      art: "supply" as const,
      title: "Suppliers & Ordering",
      body: "We watch prices across your suppliers every day. When a line moves, the order gets redrafted around it and the reason sits next to the number: tomatoes up 34%, hold or pay. Deliveries get checked against the invoice, and a short case gets chased before you notice it was short.",
      runsOn: "Ordermentum · Fresho · your reps",
      waits: "Every order",
    },
    {
      n: "002",
      art: "books" as const,
      title: "Accounting & The Books",
      body: "Card takings clear against Xero overnight. Invoices get chased, the payrun goes to STP, and what is left in the morning is the handful of lines that did not match. A bookkeeper on a fixed monthly package runs $249 to $749. Hourly in Melbourne is $65 to $90.",
      runsOn: "Xero · MYOB · the bank feed",
      waits: "Anything that pays",
    },
    {
      n: "003",
      art: "marketing" as const,
      title: "Marketing & Reputation",
      body: "Posts, campaigns and review replies get written in your voice and queued. None of them send. You approve in one list instead of six apps, and what went out is logged with what it cost. A small social retainer in Australia runs $1,000 to $2,000 a month, with ad spend on top of that.",
      runsOn: "Instagram · Meta Ads · Google Business",
      waits: "Every post",
    },
    {
      n: "004",
      art: "reception" as const,
      title: "Reception & Enquiries",
      body: "The phone gets answered through service, the inbox gets cleared overnight, and function quotes get drafted and held. Most calls are booking calls, which is the argument for reception sitting beside bookings rather than in a different product with a different login.",
      runsOn: "Your number · Gmail · the guest book",
      waits: "Anything unusual",
    },
    {
      n: "005",
      art: "web" as const,
      title: "Web & Business Profile",
      body: "We build and host your site rather than renting it to you by the month, and your Google Business listing stays current from the same place: hours, holidays, photos, the public holiday you forgot to change. Those go stale without anyone noticing and cost you a Saturday.",
      runsOn: "Built by us · Google Business",
      waits: "Anything public",
    },
    {
      n: "006",
      art: "bookings" as const,
      tag: "Ours",
      title: "Bookings",
      body: "Owners resent bolting a third-party booking system onto the business, and the objection is the integration rather than the feature. Another login, another subscription, another system that half fits and talks to nothing. Ours is part of Peregrine instead, shaped around how your venue takes bookings. Flat-fee systems run $0 to $249 a month, and per-cover pricing is where volume hurts.",
      runsOn: "Ours, inside Peregrine",
      waits: "Anything that moves a table",
    },
    {
      n: "007",
      art: "roster" as const,
      title: "The Roster",
      body: "Drafted against forecast covers, availability and award rates, with labour shown as a share of what the day should take. It waits for you every week, because a roster is a promise to people. Hospitality sits among the Fair Work Ombudsman's highest-risk industries, and a roster you approved against rules you set is a record you can produce.",
      runsOn: "The forecast · availability · award rates",
      waits: "Every week",
    },
    {
      n: "008",
      art: "admin" as const,
      title: "Admin & Compliance",
      body: "Timesheets reconcile against the roster and the till. Certificates, permits and renewals get tracked before they lapse. Every action a department took sits on the log with what triggered it, what it cost, and who approved it, so a question a year from now has an answer.",
      runsOn: "Timesheets · permits · the log",
      waits: "Anything that renews",
    },
    {
      n: "009",
      art: "till" as const,
      tag: "Read only",
      title: "The Till",
      body: "Peregrine watches takings, terminal fees and what the card surcharge is costing you, and never writes back to the point of sale. It is the one department with no approval queue, because it never asks you for anything.",
      runsOn: "Your POS · the terminal feed",
      waits: "Nothing. It never asks",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * Vision: why, in one breath, pointing at /about
 * ------------------------------------------------------------------ */

export const vision = {
  label: "Why we built it",
  text:
    "Venues never needed another app. They needed the work done, and they needed to stay in charge of what went out the door.",
  body:
    "That is the whole design. Nine departments run overnight on the systems you already pay for, and each one stops and asks before it commits you to anything. Our About page covers the gap we are filling and why it is still open.",
  cta: { label: "Read our story", href: "/about" },
  scene: {
    photo: "/scene/chapel-st.jpg",
    caption: "Chapel Street, South Yarra",
    sub: "Where the work starts",
  },
};

/* ------------------------------------------------------------------ *
 * The connected stack
 * ------------------------------------------------------------------ */

export const stack = {
  mono:
    "Peregrine runs on the systems your venue already pays for. Nothing gets ripped out and nothing gets migrated. The only thing we build from scratch is the one part nobody sells you properly.",
  chip: { label: "See the platform", href: "/platform" },
  marks: ["Xero", "Square", "Deputy", "Ordermentum"],
  features: [
    {
      icon: "search",
      body: "Reads your till, your bank and your roster. Writes nothing you have not approved.",
    },
    {
      icon: "orbit",
      body: "Every figure opens. Click one and see the invoice line it came from.",
    },
    {
      icon: "faders",
      body: "Runs between close and open, so nothing it does competes with service.",
    },
    {
      icon: "lang",
      body: "Nine departments. Take three, add the rest when you trust them.",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * /platform: the floor
 *
 * The demo venue runs six of the nine departments, so the page says six and says
 * why. Rounding it up to nine to match the marketing would be the smallest
 * possible lie and exactly the kind this business cannot afford.
 * ------------------------------------------------------------------ */

export const platform = {
  label: "The Platform",
  marquee: "The Floor",
  heading: "The office it keeps overnight.",
  intro:
    "A modelled morning at a 40-cover bistro. Six departments run through the night on the systems this venue already pays for, and by open only the decisions that need a person are still on the desk. Reception, the website and the till sit off this floor because this venue does not run them.",
  cta: { label: "Walk the floor", href: "#floor" },
  facts: [
    { value: "6", label: "Departments running unattended" },
    { value: "2", label: "Decisions left for a person" },
    { value: "94%", label: "Actions closed without a hand-off" },
    { value: "06:04", label: "Brief on the desk before open" },
  ],
  close: {
    heading: "Every step is on the log, with what it cost and why it ran.",
    body:
      "Nothing here is a black box. Each department shows the systems it works through, the trail behind a decision, and the point where it stopped and asked.",
    cta: { label: "Join the waitlist", href: "/waitlist" },
  },
};

/* ------------------------------------------------------------------ *
 * The partners
 *
 * No invented quotes. What each line says is what Kayden wrote about them in
 * consilium's `handoff/01-venture.md`, which is the only source that has any
 * business putting words near a real person's face.
 * ------------------------------------------------------------------ */

export const team = {
  heading: "A partner sits on your floor before a single department is switched on.",
  body:
    "No account managers and no delivery team between you and the people who build it. Whoever writes the rules for your Saturday roster has stood in your kitchen while it was full.",
  cta: { label: "Our story", href: "/about" },
  panelTexture: `${A}/ssKw1Uch7OIVz4Suw9U15iwfys.jpg`,
  members: [
    {
      name: "Kayden Do",
      role: "Partner",
      photo: "/people/kayden.jpg",
      school: "Commerce, University of Melbourne",
      does: "Sits with the owners, learns the floor, turns it into product.",
    },
    {
      name: "Jason Ye",
      role: "Partner",
      photo: "/people/jason.jpg",
      school: "Mechanical Engineering (Hons) / Commerce, Monash",
      does: "Builds the systems and keeps them honest.",
    },
    {
      name: "Thomas Dai",
      role: "Partner",
      photo: "/people/thomas.jpg",
      school: "Chemical Engineering, RMIT",
      does: "Has taken a product to market before. Co-founded Iris, a B2B marketplace.",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * FAQ: what an owner asks before they let anyone near the books
 * ------------------------------------------------------------------ */

export const faq = {
  label: "Straight answers",
  intro:
    "The questions we get asked before anyone lets us near their books. Where an answer rests on a number, the number carries its source.",
  heading: "Everything an owner asks before they hand over the keys.",
  cta: { label: "Join the waitlist", href: "/waitlist" },
  items: [
    {
      q: "What does it actually do in a normal week?",
      a: "It watches supplier prices daily and redrafts the order when a line moves. It clears your card takings against Xero overnight and flags what did not match. It drafts the roster against forecast covers and award rates and shows labour as a share of the day. It answers the phone through service, holds the function quotes, and queues the posts. Every one of those lands in your morning brief, and the ones that need a decision sit at the top.",
      cite: [] as SourceKey[],
    },
    {
      q: "Can it act without me?",
      a: "No. Every department drafts and stops. Anthropic's guidance for building agents is to grant autonomy in proportion to demonstrated reliability, so ours starts at none and earns it one department at a time. Nothing sends, pays, posts or rosters until you approve it, and what did go out sits on the log with what it cost. The exception is the till, which only reads.",
      cite: ["anthropic"] as SourceKey[],
    },
    {
      q: "Do I have to rip out Xero, Square or Deputy?",
      a: "No, and we would talk you out of it. Xero holds roughly 60% of the Australian small-business market at about four million subscribers, and for most venues the till-to-accounting link already exists. We add the judgement layer over that plumbing. The only thing we build from scratch is bookings.",
      cite: ["xeroShare"] as SourceKey[],
    },
    {
      q: "Why is your booking system yours and not a plug-in?",
      a: "Owners object to the integration, not the feature. Another login, another subscription, another system that half fits and talks to nothing. Ours is part of Peregrine and takes the shape of your venue. A room that seats one guest at a time is not a room that seats forty, and no per-cover product has cared about the difference.",
      cite: [] as SourceKey[],
    },
    {
      q: "What happens with the roster and the award?",
      a: "It gets drafted against forecast covers, availability and award rates, with labour shown as a share of what the day should take, and it waits for you every week. Hospitality sits among the Fair Work Ombudsman's highest-risk industries. One round of Hobart cafe and restaurant inspections in August 2026 recovered $129,674 across 22 businesses, with base-rate underpayment the most common breach. A roster you approved, against rules you set, is a record you can produce.",
      cite: ["fwo"] as SourceKey[],
    },
    {
      q: "Where does my data go, and who is liable?",
      a: "Your systems stay yours. We hold credentials scoped to what each department needs and nothing beyond it, and every action gets logged with what triggered it and who approved it. Under the Privacy Act, businesses over $3m turnover sit inside the Notifiable Data Breaches scheme, and the current penalty tiers reach $3.3m for corporations. We keep the audit trail because a question a year from now needs an answer.",
      cite: ["oaic"] as SourceKey[],
    },
    {
      q: "How long before it is running?",
      a: "The first session is a morning on your floor with one month of invoices, your roster and your till open in front of us. From there the first departments go live in weeks, not quarters, because they run on accounts you already hold. We turn on three at a time and leave the rest off until those three have earned their place.",
      cite: [] as SourceKey[],
    },
    {
      q: "What does it cost?",
      a: "Per department, priced against the thing that department takes over, so the comparison is one you can already check on your own bills. A bookkeeper runs $249 to $749 a month on a package. A small social retainer runs $1,000 to $2,000, with ad spend on top. A booking system runs $0 to $249. We quote after the first session, when we have seen the actual shape of your month rather than an average of somebody else's.",
      cite: ["bookkeeping", "agency", "bookingPricing"] as SourceKey[],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * About page
 * ------------------------------------------------------------------ */

export const about = {
  eyebrow: "About Us",
  headlineDim: "Hospitality bought the software.",
  headlineLit: "Nobody delivered the work.",
  sub: "Peregrine Partners runs the after-close admin for Melbourne venues. This page carries the argument behind it: where the hours actually go, why nine good products still leave you working at eleven at night, and what we do about it.",
  stats: [
    { value: "9", label: "Departments, running overnight" },
    { value: "06:04", label: "The brief lands before you open" },
    { value: "0", label: "New logins for your staff to learn" },
  ],

  gap: {
    label: "The gap",
    text:
      "A venue runs nine systems, nine logins and nine bills, and not one of them knows what the other eight did last night.",
    body: "Ask an owner what they use and you will hear a list. A till, an accounting package, a rostering app, a booking system somebody sold them, a supplier portal per supplier, a Google listing, two social accounts and a bank feed. Every one of them is a good product. Together they are a full-time job nobody is paid to do, and it gets done at eleven at night by the person who can least afford the hour.",
    facts: [
      {
        figure: "8–12 hrs",
        body: "a week on finance admin alone, before an owner gets any help.",
        cite: "adminHours" as SourceKey,
      },
      {
        figure: "3–9%",
        body: "net margin at the average Australian full-service venue. Cafes sit at 4 to 6%.",
        cite: "margins" as SourceKey,
      },
      {
        figure: "35–42%",
        body: "of revenue now goes to labour, up from 30 to 33% five years ago.",
        cite: "margins" as SourceKey,
      },
    ],
  },

  six: {
    label: "Where the money goes",
    heading: "The software is the small half of the bill.",
    body: "Add up what a venue spends on the subscriptions and it is rarely the number that hurts. The number that hurts is what sits behind them: the bookkeeper, the agency and the ad spend on top of the agency, the hours an owner works after close because no product does the job end to end. Across the economy the ratio runs about six to one against software, and hospitality is worse than average because the margins are thinner and the compliance is heavier.",
    quote:
      "Every one of those nine products expects somebody in your building to drive it. That somebody is you, at eleven at night.",
    bodyCite: "sequoia" as SourceKey,
    split: [
      { k: "$1", v: "The subscriptions", note: "Seats and licences. The tool you still have to drive." },
      { k: "$6", v: "The work behind them", note: "The bookkeeper, the agency, the agency's ad spend, and the hours you do yourself after close." },
    ],
    after:
      "Peregrine is priced against the second row, because that is the row it takes over. The subscriptions stay where they are.",
  },

  why: {
    label: "Why now",
    heading: "The rule-following half got solved. The deciding half did not.",
    points: [
      {
        n: "01",
        title: "Machines got good at the rules",
        body: "Reconciling 148 transactions, checking a delivery against an invoice, drafting a roster against award rates and a forecast. That work follows rules, it can be checked line by line, and software can now do it end to end without a person watching each step.",
      },
      {
        n: "02",
        title: "The calls stayed yours",
        body: "Whether to wear a 34% jump on tomatoes or take the dish off the menu. Whether to give the Saturday shift to the person who needs the money or the person who is better on a full room. No system holds your reasons, and we have not built one that pretends to.",
      },
      {
        n: "03",
        title: "So we built the seam",
        body: "Peregrine does the first half and hands you the second, in a form that takes seconds rather than an evening. Anthropic's guidance for agent builders is to expand autonomy only in proportion to demonstrated reliability. Ours starts at none. Every department drafts, stops and waits, and the queue is short on purpose.",
        cite: "anthropic" as SourceKey,
      },
    ],
  },

  wedge: {
    label: "The wedge",
    photo: "/scene/counter.jpg",
    photoCaption: "A counter at open. The one deadline that has never moved.",
    heading: "The one part we refuse to integrate.",
    body: "The same objection comes up in every first meeting, and it is never about features. Owners resent bolting a third-party booking system onto the business. Another login, another subscription, another system that half fits and talks to nothing. So ours is part of Peregrine instead, built around your venue, with nothing extra for your staff to learn. Every other department works through something you already pay for. That single difference is why a head spa seating one guest per room and an arts school counting terms can both run on the same platform, when neither of them fits a per-cover product at all.",
  },

  refuse: {
    label: "How we work",
    heading: "Four rules we hold to, whether or not anyone is checking.",
    items: [
      {
        title: "Nothing sends without you",
        body: "Every department drafts and stops. No order, payrun, roster or post leaves the building until you have approved it, and the approval is one tap from the morning brief.",
      },
      {
        title: "Every figure opens",
        body: "Click a number and see the invoice line behind it. If a department made a call, the log says what triggered it, what it cost and who signed off. There is no figure on your brief you cannot chase to its source.",
      },
      {
        title: "Your accounts stay yours",
        body: "We hold credentials scoped to what a department needs and nothing beyond it. No data leaves your systems to train anything, and you can revoke a department on your own without ringing us.",
      },
      {
        title: "Numbers carry their source",
        body: "Every figure on this site is either a published market rate with the source next to it, or arithmetic modelled on a real venue's invoices and labelled as modelled. We would rather a thinner page than one you can catch us on.",
      },
    ],
  },

  people: {
    label: "The partners",
    heading: "The people who write your rules have worked a full room.",
    body: "A partner runs the first session, sits through a service, and stays on the account. That is why the platform fits a brunch room, a head spa and a school on the same nine departments.",
  },

  now: {
    label: "Where we work",
    heading: "Melbourne, and on your floor.",
    body: "The first session is a morning with your invoices, your roster and your till open in front of us. We take on new venues in small groups, because a partner sits on every floor we bring on and that is the part that makes it work.",
    cta: { label: "Join the waitlist", href: "/waitlist" },
  },
};

/* ------------------------------------------------------------------ *
 * Waitlist and sign-in
 * ------------------------------------------------------------------ */

export const waitlist = {
  eyebrow: "Join Waitlist",
  heading: "Bring one month of invoices.",
  sub: "We will run the same numbers on your venue that are modelled on this site, and show you where you are paying twice, where the hours go, and which three departments are worth starting with. Twenty minutes, no obligation, and no sales team to get past.",
  departmentsLabel: "Which departments interest you?",
  departments: [
    "Suppliers & Ordering",
    "Accounting & The Books",
    "Marketing & Reputation",
    "Reception & Enquiries",
    "Web & Business Profile",
    "Bookings",
    "Rostering",
    "Admin & Compliance",
    "Point of sale",
  ],
  submit: "Join the waitlist",
  sending: "Sending",
  done: {
    heading: "You're on the list.",
    body: "A partner will be in touch, usually within a day or two. If it is urgent, the phone number in the footer is a real phone.",
  },
  error: "That did not send. Email us directly and we will pick it up from there.",
  aside: [
    { k: "Where", v: "Melbourne, and on your floor" },
    { k: "First session", v: "One morning, your invoices" },
    { k: "Cost of the session", v: "Nothing" },
  ],
};

export const signIn = {
  eyebrow: "Sign in",
  heading: "The client dashboard.",
  sub: "Use the email address your venue was onboarded with and we will send a link. If you are not on the system yet, the platform tour is open and needs no account at all.",
  submit: "Send me a link",
  sending: "Sending",
  /** Deliberately identical for every address. Never confirm who is a client. */
  done: "If that address is on an account, a sign-in link is on its way. Check your inbox.",
  alt: { label: "See the platform instead", href: "/platform" },
};

/* ------------------------------------------------------------------ *
 * Footer
 * ------------------------------------------------------------------ */

export const footer = {
  blurb:
    "The after-close admin, done. Nine departments run overnight on the systems you already pay for, and nothing sends until you approve it.",
  bg: `${A}/v2cZIMtgjEII7EpDnUDGGgCyuiQ.jpg`,
  subscribeNote: "One note a month on what the departments learned. No pitch.",
  columns: [
    {
      title: "Site",
      links: [
        { label: "Home", href: "/" },
        { label: "Platform", href: "/platform" },
        { label: "About Us", href: "/about" },
        { label: "Sign in", href: "/sign-in" },
      ],
    },
    {
      title: "The departments",
      links: [
        { label: "The nine", href: "/#departments" },
        { label: "Straight answers", href: "/#faq" },
      ],
    },
    {
      title: "Talk to us",
      links: [
        { label: "Join the waitlist", href: "/waitlist" },
        { label: brand.email, href: `mailto:${brand.email}` },
        { label: brand.phone, href: `tel:${brand.phone.replace(/\s/g, "")}` },
      ],
    },
  ],
  legal:
    "Melbourne, Australia. Every figure on this site carries its source or is labelled as modelled.",
};
