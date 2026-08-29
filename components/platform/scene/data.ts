/* ------------------------------------------------------------------ */
/* The morning's data                                                  */
/* ------------------------------------------------------------------ */

export type TaskState = "needs" | "watching" | "done";

export type Task = {
  id: string;
  state: TaskState;
  time: string;
  system: string;
  text: string;
  /** The reasoning trail behind a waiting item, oldest first. */
  trail?: string[];
  approveLabel?: string;
  /** What the row becomes once approved. */
  doneText?: string;
  doneTime?: string;
};

/** What can stand on an island. Each has a component in scene/props.tsx. */
export type PropKind =
  | "desk" | "plant"
  | "crate" | "pallet"
  | "ledger" | "safe"
  | "counter" | "pigeonhole" | "printer"
  | "easel" | "lightstand" | "panel"
  | "pegwall" | "clockpost"
  | "hoststand" | "top";

/** One object on an island, positioned relative to the island's centre. */
export type Placement = {
  kind: PropKind;
  du: number;
  dv: number;
  label?: string;
  own?: boolean;
  /** Takes the department's hue on its top face. One or two per island. */
  lit?: boolean;
};

/** The one tall thing each island is allowed. Named `VerticalSpec` because
    `Vertical` is the component that draws it, in scene/props.tsx. */
export type VerticalSpec = {
  kind: "tower" | "arch";
  du: number;
  dv: number;
  /** Height in px above the island top. */
  h: number;
};

/** Which of the six 28px marks in scene/glyphs.tsx this department wears. */
export type GlyphKey =
  | "supply" | "books" | "marketing" | "reception" | "bookings" | "roster";

export type Dept = {
  id: string;
  name: string;
  /** The rack number this department carries on the home page. */
  n: string;
  glyph: GlyphKey;
  /** Hue in degrees. Saturation is a CSS variable, never a per-dept value. */
  hue: number;
  /** Which side the island's caption hangs off. Defaults to the front-left. */
  labelSide?: "e";
  /** Where the island sits, in grid units. */
  u: number;
  v: number;
  /** Half-extents of the island top. Islands are no longer square. */
  w: number;
  d: number;
  /** Plinth height in px. There is no shared default. */
  lift: number;
  /** Which face the stair climbs. */
  stair: "n" | "e" | "s" | "w";
  vertical: VerticalSpec;
  own?: boolean;
  /** The roster: what the panel and the phone cards count. */
  desks: { label: string; own?: boolean }[];
  /** What is drawn on the island. Not the same list as `desks`. */
  layout: Placement[];
  stack: { label: string; own?: boolean }[];
  metrics: [string, string][];
  tasks: Task[];
};

/* ------------------------------------------------------------------ */
/* Inside the venue: one service, running                              */
/* ------------------------------------------------------------------ */

/**
 * The room runs a live Friday dinner service rather than paging through dates.
 * A clock drives everything: tables count down to their booking, fill when it
 * lands, and clear when the turn is up, while the phone keeps answering in the
 * margin. Paging through days showed the same information as a filmstrip; a
 * running clock shows it as a shift, which is what an owner actually recognises.
 */

export const OPEN = 17 * 60 + 30; // 17:30, doors
export const CLOSE = 21 * 60 + 40;
export const TURN = 95; // minutes a table is held

export type Seating = { table: string; at: number; name: string; covers: number; note?: string };

export const SEATINGS: Seating[] = [
  // First turn
  { table: "T2", at: 17 * 60 + 45, name: "Walsh", covers: 2, note: "Anniversary" },
  { table: "B1", at: 18 * 60, name: "Ibrahim", covers: 6, note: "Gluten free" },
  { table: "T5", at: 18 * 60, name: "Kaur", covers: 4 },
  { table: "T3", at: 18 * 60 + 15, name: "Nguyen", covers: 4 },
  { table: "T8", at: 18 * 60 + 15, name: "Romano", covers: 4 },
  { table: "B2", at: 18 * 60 + 30, name: "Torres", covers: 5 },
  { table: "T4", at: 18 * 60 + 30, name: "Okafor", covers: 4 },
  { table: "T6", at: 18 * 60 + 45, name: "Chen", covers: 2 },
  { table: "T7", at: 18 * 60 + 45, name: "Petrov", covers: 3 },
  { table: "T9", at: 19 * 60, name: "Liu", covers: 4 },
  // Second turn, once the first has run its 95 minutes
  { table: "B1", at: 20 * 60, name: "Marchetti", covers: 6 },
  { table: "T5", at: 20 * 60, name: "Singh", covers: 4 },
  { table: "T2", at: 20 * 60 + 15, name: "Ellis", covers: 2 },
  { table: "T3", at: 20 * 60 + 15, name: "Okonkwo", covers: 4 },
  { table: "T4", at: 20 * 60 + 30, name: "Baptiste", covers: 4 },
  { table: "T9", at: 21 * 60, name: "Yildiz", covers: 4 },
];

/** Every seat in the room, which is what makes it a 40-cover bistro. */
export const SEATS_IN_ROOM = 40;

/** Covers booked across the whole service, both turns. */
export const COVERS_TONIGHT = SEATINGS.reduce((n, s) => n + s.covers, 0);

export type Enquiry = {
  at: number;
  channel: "call" | "email";
  text: string;
  reply: string;
  tag: "Booked" | "Answered" | "Held for you" | "Filed";
  /** When this task has been approved in the brief, the entry resolves. */
  linkTask?: string;
  approvedReply?: string;
  approvedTag?: "Booked";
};

/** What the phone and the inbox handled while the room was busy. */
export const ENQUIRIES: Enquiry[] = [
  {
    at: 17 * 60 + 44,
    channel: "call",
    text: "Table for two tonight, anything at 8?",
    reply: "Nothing at 8. Offered 20:20, booked it on T2 and sent the confirmation",
    tag: "Booked",
  },
  {
    at: 18 * 60 + 21,
    channel: "email",
    text: "Gluten-free options for a party of six?",
    reply: "Answered from your menu notes and flagged the allergy on tonight's banquette",
    tag: "Answered",
  },
  {
    at: 19 * 60 + 6,
    channel: "call",
    text: "Function enquiry, 18 guests, Saturday lunch",
    reply: "Held for you. The quote is drafted and waiting in the brief",
    tag: "Held for you",
    linkTask: "b1",
    approvedReply: "Quote approved and sent in your name. Saturday lunch is on the book",
    approvedTag: "Booked",
  },
  {
    at: 19 * 60 + 38,
    channel: "call",
    text: "Running twenty minutes late for the 19:30",
    reply: "Held the banquette and told the floor",
    tag: "Answered",
  },
  {
    at: 20 * 60 + 12,
    channel: "email",
    text: "A supplier catalogue",
    reply: "Filed to suppliers, no reply needed",
    tag: "Filed",
  },
  {
    at: 20 * 60 + 51,
    channel: "call",
    text: "Are you open Monday?",
    reply: "Explained the Monday close and booked four for Tuesday instead",
    tag: "Booked",
  },
];

/**
 * The dining room, laid out to seat forty, because the copy beside it says a
 * 40-cover bistro and the room used to hold twenty-four. Three ranks of tables
 * off the back wall, two banquettes down the left, and the two-tops in the
 * front corner away from the pass.
 */
export const TABLES: { id: string; kind: "two" | "four" | "banq"; u: number; v: number }[] = [
  { id: "B1", kind: "banq", u: -3.7, v: -3.1 },
  { id: "T4", kind: "four", u: -0.7, v: -3.1 },
  { id: "T7", kind: "four", u: 1.9, v: -3.1 },
  { id: "T3", kind: "four", u: -3.9, v: -0.5 },
  { id: "T8", kind: "four", u: -1.3, v: -0.5 },
  { id: "T5", kind: "four", u: 1.3, v: -0.5 },
  { id: "B2", kind: "banq", u: -3.7, v: 2.1 },
  { id: "T9", kind: "four", u: -0.7, v: 2.1 },
  { id: "T2", kind: "two", u: 1.9, v: 1.6 },
  { id: "T6", kind: "two", u: 2.9, v: 3.4 },
];

export const clock = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m) % 60).padStart(2, "0")}`;

export type TableState =
  | { kind: "seated"; seating: Seating; since: number }
  | { kind: "due"; seating: Seating; inMins: number }
  | { kind: "free" };

/** Where a table stands at a given minute of the service. */
export function tableState(id: string, now: number): TableState {
  const mine = SEATINGS.filter((s) => s.table === id).sort((a, b) => a.at - b.at);
  const seated = mine.find((s) => now >= s.at && now < s.at + TURN);
  if (seated) return { kind: "seated", seating: seated, since: seated.at };
  const next = mine.find((s) => s.at > now);
  if (next) return { kind: "due", seating: next, inMins: Math.round(next.at - now) };
  return { kind: "free" };
}

export const DEPTS: Dept[] = [
  {
    id: "bookings",
    name: "Bookings",
    n: "006", glyph: "bookings", hue: 12,
    u: 6.1, v: 6.9, w: 3.2, d: 2.6, lift: 26,
    stair: "n", vertical: { kind: "arch", du: -2.1, dv: -1.5, h: 34 },
    layout: [
      { kind: "hoststand", du: -2.2, dv: -1.4 },
      { kind: "top", du: -1.1, dv: -1.1 },
      { kind: "top", du: 0.5, dv: -1.1 },
      { kind: "top", du: 2.0, dv: -0.9 },
      { kind: "top", du: -1.1, dv: 0.6, lit: true },
      { kind: "top", du: 0.6, dv: 0.7 },
      { kind: "top", du: 2.0, dv: 0.9 },
      { kind: "desk", du: -2.1, dv: 1.2, label: "Enquiries", own: true },
    ],
    own: true,
    desks: [
      { label: "Enquiries", own: true },
      { label: "Waitlist", own: true },
      { label: "Functions", own: true },
      { label: "Table plan", own: true },
      { label: "Deposits", own: true },
      { label: "Guest book", own: true },
    ],
    stack: [{ label: "Peregrine native", own: true }],
    metrics: [
      ["Covers tonight", `${COVERS_TONIGHT} / 80`],
      ["Enquiries handled", `${ENQUIRIES.length}`],
    ],
    tasks: [
      {
        id: "b1",
        state: "needs",
        time: "06:04",
        system: "Functions",
        text: "Function quote, 18 guests, Saturday lunch",
        trail: [
          "22:14 · Enquiry arrived through the website form",
          "05:58 · Quote drafted from your function menu at $61 a head",
          "06:04 · Waiting for you. It goes out in your name.",
        ],
        approveLabel: "Approve and send",
        doneText: "Function quote sent, 18 guests, Saturday lunch",
        doneTime: "06:41",
      },
      {
        id: "b2",
        state: "watching",
        time: "06:00",
        system: "Waitlist",
        text: "Saturday sits at 84 of 96 covers, waitlist is on",
      },
      {
        id: "b3",
        state: "done",
        time: "05:46",
        system: "Enquiries",
        text: "Eleven enquiries answered overnight",
      },
      {
        id: "b4",
        state: "done",
        time: "05:33",
        system: "Table plan",
        text: "Table plan redrawn for the 6pm turn",
      },
      {
        id: "b5",
        state: "done",
        time: "05:20",
        system: "Deposits",
        text: "Two Friday no-shows charged their $20 deposit, per the policy you set",
      },
      {
        id: "b6",
        state: "done",
        time: "05:24",
        system: "Deposits",
        text: "Deposits held for Saturday, $540 across 27 bookings",
      },
      {
        id: "b7",
        state: "watching",
        time: "05:40",
        system: "Guest book",
        text: "Forty-one first-timers this month, six already back a second time",
      },
    ],
  },
  {
    id: "suppliers",
    name: "Suppliers & stock",
    n: "001", glyph: "supply", hue: 150,
    labelSide: "e",
    u: 8.4, v: -0.9, w: 2.6, d: 2.2, lift: 22,
    stair: "w", vertical: { kind: "tower", du: 1.6, dv: -1.2, h: 40 },
    layout: [
      { kind: "pallet", du: -1.4, dv: 1.0 },
      { kind: "crate", du: -1.4, dv: 1.0 },
      { kind: "crate", du: -0.5, dv: 1.0 },
      { kind: "crate", du: -0.5, dv: 0.2, lit: true },
      { kind: "crate", du: 0.4, dv: 1.0 },
      { kind: "desk", du: 1.2, dv: -0.8, label: "Ordermentum" },
      { kind: "plant", du: -1.6, dv: -1.2 },
    ],
    desks: [{ label: "Ordermentum" }, { label: "Fresho" }, { label: "Par levels" }],
    stack: [{ label: "Ordermentum" }, { label: "Fresho" }, { label: "Bidfood" }],
    metrics: [
      ["Lines checked", "14"],
      ["Orders drafted", "3"],
    ],
    tasks: [
      {
        id: "s1",
        state: "needs",
        time: "06:04",
        system: "Ordermentum",
        text: "Tomato order redrafted, tomatoes are up 34%",
        trail: [
          "05:31 · Price check caught roma tomatoes at $4.20 a kilo, up from $3.13",
          "05:52 · Tomorrow's order redrafted around the move, $118 in total",
          "06:04 · Waiting for you. Nothing is sent until you approve it.",
        ],
        approveLabel: "Approve the order",
        doneText: "Order sent to Ordermentum, $118",
        doneTime: "06:43",
      },
      {
        id: "s2",
        state: "watching",
        time: "05:31",
        system: "Fresho",
        text: "Cream has moved twice this month, watching before flagging",
      },
      {
        id: "s3",
        state: "done",
        time: "05:44",
        system: "Fresho",
        text: "Friday's delivery checked against the invoice, one credit requested",
      },
      {
        id: "s4",
        state: "done",
        time: "05:31",
        system: "Ordermentum",
        text: "Fourteen lines price-checked across both platforms",
      },
      {
        id: "s5",
        state: "done",
        time: "05:50",
        system: "Par levels",
        text: "Dry store held at par, nothing ordered",
      },
    ],
  },
  {
    id: "books",
    name: "The books",
    n: "002", glyph: "books", hue: 232,
    u: 0.9, v: -7.1, w: 2.2, d: 2.6, lift: 30,
    stair: "s", vertical: { kind: "tower", du: -1.2, dv: -1.6, h: 46 },
    layout: [
      { kind: "ledger", du: -0.9, dv: -0.6 },
      { kind: "ledger", du: 0.2, dv: -0.6 },
      { kind: "safe", du: 1.1, dv: 1.2, lit: true },
      { kind: "desk", du: -0.5, dv: 1.3, label: "Xero" },
    ],
    desks: [{ label: "Xero" }, { label: "Square" }, { label: "Bank feed" }],
    stack: [{ label: "Xero" }, { label: "MYOB" }, { label: "Square" }],
    metrics: [
      ["Reconciled", "148 / 150"],
      ["Payrun", "Lodged"],
    ],
    tasks: [
      {
        id: "k1",
        state: "watching",
        time: "05:38",
        system: "Xero",
        text: "Two lines held for the accountant, $136 in total",
      },
      {
        id: "k2",
        state: "done",
        time: "05:38",
        system: "Square",
        text: "148 of 150 card takings cleared against Xero",
      },
      {
        id: "k3",
        state: "done",
        time: "05:41",
        system: "Xero",
        text: "Three invoices chased, one paid overnight",
      },
      {
        id: "k4",
        state: "done",
        time: "05:29",
        system: "Xero",
        text: "The payrun lodged to STP",
      },
    ],
  },
  {
    id: "admin",
    name: "Admin",
    n: "004", glyph: "reception", hue: 42,
    u: -7.2, v: -7.2, w: 2.4, d: 2.4, lift: 16,
    stair: "s", vertical: { kind: "arch", du: 1.4, dv: -1.4, h: 30 },
    layout: [
      { kind: "pigeonhole", du: 0, dv: -1.4 },
      { kind: "counter", du: 0, dv: 0.1 },
      { kind: "printer", du: 1.4, dv: 1.0 },
      { kind: "desk", du: -1.2, dv: 1.2, label: "Phone", own: true },
      { kind: "plant", du: 1.5, dv: -0.6 },
    ],
    desks: [
      { label: "Website", own: true },
      { label: "Email" },
      { label: "Phone", own: true },
    ],
    stack: [
      { label: "Website", own: true },
      { label: "Phone line", own: true },
      { label: "Gmail" },
      { label: "Google Business" },
    ],
    metrics: [
      ["Calls answered", "4"],
      ["Listing", "Current"],
    ],
    tasks: [
      {
        id: "a1",
        state: "watching",
        time: "05:58",
        system: "Phone",
        text: "A supplier voicemail from 21:40, transcribed and filed",
      },
      {
        id: "a2",
        state: "done",
        time: "05:10",
        system: "Phone",
        text: "Four calls answered after close, three became bookings, straight into the book",
      },
      {
        id: "a3",
        state: "done",
        time: "05:15",
        system: "Website",
        text: "Menu prices updated from Tuesday's supplier change",
      },
      {
        id: "a4",
        state: "done",
        time: "05:18",
        system: "Google Business",
        text: "Listing hours confirmed for the public holiday",
      },
      {
        id: "a5",
        state: "done",
        time: "04:52",
        system: "Phone",
        text: "A dietary question answered from your own menu notes",
      },
      {
        id: "a6",
        state: "watching",
        time: "05:59",
        system: "Phone",
        text: "One caller asked for you by name, held for the morning",
      },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    n: "003", glyph: "marketing", hue: 28,
    u: -1.1, v: 8.3, w: 2.8, d: 2.0, lift: 20,
    stair: "n", vertical: { kind: "tower", du: -1.9, dv: 1.1, h: 36 },
    layout: [
      { kind: "easel", du: 0.2, dv: -0.6, lit: true },
      { kind: "panel", du: -1.6, dv: 0.6 },
      { kind: "panel", du: -1.0, dv: 0.7 },
      { kind: "panel", du: -0.4, dv: 0.8 },
      { kind: "lightstand", du: 1.7, dv: -0.4 },
      { kind: "desk", du: 1.5, dv: 0.9, label: "Guest CRM", own: true },
    ],
    desks: [
      { label: "Instagram" },
      { label: "Meta Ads" },
      { label: "Google" },
      { label: "Guest CRM", own: true },
    ],
    stack: [
      { label: "Guest CRM", own: true },
      { label: "Instagram" },
      { label: "Meta Ads" },
      { label: "Google Business" },
    ],
    metrics: [
      ["Creatives queued", "3"],
      ["Spend", "$180 / $250"],
    ],
    tasks: [
      {
        id: "m1",
        state: "watching",
        time: "05:55",
        system: "Meta Ads",
        text: "Ad spend pacing at $180 of your $250 week",
      },
      {
        id: "m2",
        state: "done",
        time: "05:55",
        system: "Instagram",
        text: "Three winter menu creatives drafted for your Thursday queue",
      },
      {
        id: "m3",
        state: "done",
        time: "05:12",
        system: "Google",
        text: "Six reviews answered in your voice, approved by you Friday",
      },
      {
        id: "m4",
        state: "done",
        time: "05:08",
        system: "Guest CRM",
        text: "Thank-you notes sent to Friday's eleven first-timers",
      },
      {
        id: "m5",
        state: "watching",
        time: "05:50",
        system: "Guest CRM",
        text: "Fourteen regulars not seen in 60 days, a win-back drafted for your queue",
      },
    ],
  },
  {
    id: "roster",
    name: "Rostering",
    n: "007", glyph: "roster", hue: 196,
    u: -7.8, v: 0.6, w: 2.0, d: 2.0, lift: 18,
    stair: "e", vertical: { kind: "tower", du: 1.1, dv: -1.1, h: 32 },
    layout: [
      { kind: "pegwall", du: 0, dv: -1.1, lit: true },
      { kind: "clockpost", du: 1.0, dv: 0.9 },
      { kind: "desk", du: -0.7, dv: 0.8, label: "Deputy" },
    ],
    desks: [{ label: "Deputy" }, { label: "Award rates" }],
    stack: [{ label: "Deputy" }, { label: "Tanda" }],
    metrics: [
      ["Saturday draft", "28.1%"],
      ["Timesheets", "Approved"],
    ],
    tasks: [
      {
        id: "r1",
        state: "watching",
        time: "05:47",
        system: "Deputy",
        text: "Saturday's draft holds labour at 28.1% of forecast",
      },
      {
        id: "r2",
        state: "done",
        time: "05:47",
        system: "Deputy",
        text: "Three shifts amended for availability",
      },
      {
        id: "r3",
        state: "done",
        time: "05:23",
        system: "Award rates",
        text: "Award rates checked against the winter roster",
      },
    ],
  },
];

export const ALL_TASKS = DEPTS.flatMap((d) => d.tasks);
