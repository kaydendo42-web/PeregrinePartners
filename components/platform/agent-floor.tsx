"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/motion-primitives";

/**
 * The floor: a modelled morning at a 40-cover Melbourne bistro, drawn as the
 * office Peregrine kept overnight. Six departments as isometric islands, the
 * restaurant itself at the centre with the brain working above its roof, and
 * two things waiting for the owner, both genuinely tappable.
 *
 * The scene is the desktop surface. Below 810px the floor gives way to the
 * department cards as a straight list, which is not a fallback: it is the
 * morning brief, the same product at phone scale, and the two share their
 * three states and their wording exactly.
 *
 * Colour discipline is the palette's own law. Islands stay neutral and are
 * told apart by their labels, not their hue. The warm cere pair appears on
 * the two waiting items and nowhere else. Watching wears the accent, done
 * wears sage, and Bookings sits on the blush tint because it is the one
 * island we built rather than connected to.
 */

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const S = 44; // px per grid unit
const KX = Math.cos(Math.PI / 6) * S;
const KY = Math.sin(Math.PI / 6) * S;

const px = (u: number, v: number) => ({
  x: (u - v) * KX,
  y: (u + v) * KY,
});

/** Path string for the top face of an iso box at height h above the ground. */
function topFace(u: number, v: number, a: number, b: number, h: number) {
  const n = px(u - a, v - b);
  const e = px(u + a, v - b);
  const s = px(u + a, v + b);
  const w = px(u - a, v + b);
  return `M ${n.x} ${n.y - h} L ${e.x} ${e.y - h} L ${s.x} ${s.y - h} L ${w.x} ${w.y - h} Z`;
}

/** The two faces the camera can see, east-south and south-west. */
function sideFaces(u: number, v: number, a: number, b: number, h: number) {
  const e = px(u + a, v - b);
  const s = px(u + a, v + b);
  const w = px(u - a, v + b);
  return {
    right: `M ${e.x} ${e.y - h} L ${s.x} ${s.y - h} L ${s.x} ${s.y} L ${e.x} ${e.y} Z`,
    left: `M ${w.x} ${w.y - h} L ${s.x} ${s.y - h} L ${s.x} ${s.y} L ${w.x} ${w.y} Z`,
  };
}

/* ------------------------------------------------------------------ */
/* The morning's data                                                  */
/* ------------------------------------------------------------------ */

type TaskState = "needs" | "watching" | "done";

type Task = {
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

type Dept = {
  id: string;
  name: string;
  /** Which side the island's caption hangs off. Defaults to the front-left. */
  labelSide?: "e";
  /** Where the island sits, in grid units. */
  u: number;
  v: number;
  /** Half-extent of the island top. */
  size: number;
  own?: boolean;
  desks: { label: string; own?: boolean }[];
  /** The systems this department works through, shown in the panel. */
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

const OPEN = 17 * 60 + 30; // 17:30, doors
const CLOSE = 21 * 60 + 40;
const TURN = 95; // minutes a table is held

type Seating = { table: string; at: number; name: string; covers: number; note?: string };

const SEATINGS: Seating[] = [
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
const SEATS_IN_ROOM = 40;

/** Covers booked across the whole service, both turns. */
const COVERS_TONIGHT = SEATINGS.reduce((n, s) => n + s.covers, 0);

type Enquiry = {
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
const ENQUIRIES: Enquiry[] = [
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
const TABLES: { id: string; kind: "two" | "four" | "banq"; u: number; v: number }[] = [
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

const clock = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m) % 60).padStart(2, "0")}`;

type TableState =
  | { kind: "seated"; seating: Seating; since: number }
  | { kind: "due"; seating: Seating; inMins: number }
  | { kind: "free" };

/** Where a table stands at a given minute of the service. */
function tableState(id: string, now: number): TableState {
  const mine = SEATINGS.filter((s) => s.table === id).sort((a, b) => a.at - b.at);
  const seated = mine.find((s) => now >= s.at && now < s.at + TURN);
  if (seated) return { kind: "seated", seating: seated, since: seated.at };
  const next = mine.find((s) => s.at > now);
  if (next) return { kind: "due", seating: next, inMins: Math.round(next.at - now) };
  return { kind: "free" };
}

const DEPTS: Dept[] = [
  {
    id: "bookings",
    name: "Bookings",
    u: 6.4,
    v: 6.4,
    size: 2.9,
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
    labelSide: "e",
    u: 7.8,
    v: -0.6,
    size: 2.4,
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
    u: 0.6,
    v: -7.8,
    size: 2.4,
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
    u: -7.2,
    v: -7.2,
    size: 2.4,
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
    u: -0.6,
    v: 7.8,
    size: 2.4,
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
    u: -7.8,
    v: 0.6,
    size: 2.4,
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

const ALL_TASKS = DEPTS.flatMap((d) => d.tasks);

/* ------------------------------------------------------------------ */
/* Scene constants                                                     */
/* ------------------------------------------------------------------ */

const HUB = { size: 2.6, lift: 12 };
const ISLE_LIFT = 18;
const VIEW = { x: -690, y: -480, w: 1380, h: 985 };

/** Walkway endpoints: from the hub's edge to each island's near corner. */
function walkway(d: Dept) {
  const len = Math.hypot(d.u, d.v);
  const inner = (HUB.size + 0.4) / len;
  const outer = (len - d.size - 0.4) / len;
  const a = px(d.u * inner, d.v * inner);
  const b = px(d.u * outer, d.v * outer);
  return `M ${a.x} ${a.y - 4} L ${b.x} ${b.y - 4}`;
}

/** Desk positions on an island top, a loose two-column grid. */
function deskSpots(d: Dept) {
  const cols = 2;
  const gap = d.size * 0.82;
  return d.desks.map((_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const rows = Math.ceil(d.desks.length / cols);
    return {
      u: d.u + (c - (cols - 1) / 2) * gap,
      v: d.v + (r - (rows - 1) / 2) * gap,
    };
  });
}

/**
 * Where the camera pushes in when a department is opened.
 *
 * A `transform-origin` percentage keeps its own point fixed, which centres
 * nothing: an island near the edge of the plan scales straight off the canvas,
 * and Admin lost its top row that way. This maps the island's centre onto the
 * middle of the viewBox instead, so every department arrives framed the same.
 */
const ZOOM = 1.45;

function zoomTransform(d: Dept) {
  const c = px(d.u, d.v);
  const tx = VIEW.x + VIEW.w / 2 - ZOOM * c.x;
  const ty = VIEW.y + VIEW.h / 2 - ZOOM * (c.y - 24);
  return `translate(${tx} ${ty}) scale(${ZOOM})`;
}

/* ------------------------------------------------------------------ */
/* Furniture                                                           */
/* ------------------------------------------------------------------ */

/** The three jacket colours the little people wear, all from the neutral family. */
const JACKETS = ["var(--ink)", "var(--fill)", "var(--muted)"];

function Desk({
  u,
  v,
  own,
  label,
  i,
}: {
  u: number;
  v: number;
  own?: boolean;
  label: string;
  i: number;
}) {
  const h = 13; // tabletop height
  const c = px(u, v);
  // Three visible legs, then the top over them.
  const legE = px(u + 0.58, v - 0.28);
  const legS = px(u + 0.58, v + 0.28);
  const legW = px(u - 0.58, v + 0.28);
  const edgeW = px(u - 0.66, v + 0.36);
  const edgeE = px(u + 0.66, v + 0.36);
  // The monitor stands on the far edge, facing the sitter.
  const mon = px(u + 0.1, v - 0.32);
  // The sitter works the near side, back to the camera.
  const seat = px(u - 0.12, v + 0.72);
  const jacket = JACKETS[i % JACKETS.length];
  return (
    <g className="floor__desk" data-own={own || undefined}>
      {[legE, legS, legW].map((l, k) => (
        <line key={k} className="floor__desk-leg" x1={l.x} y1={l.y - h} x2={l.x} y2={l.y} />
      ))}
      <path className="floor__desk-top" d={topFace(u, v, 0.66, 0.36, h)} />
      <path
        className="floor__desk-edge"
        d={`M ${edgeW.x} ${edgeW.y - h} L ${edgeE.x} ${edgeE.y - h} L ${edgeE.x} ${edgeE.y - h + 3} L ${edgeW.x} ${edgeW.y - h + 3} Z`}
      />
      {/* monitor: stand, frame, lit screen */}
      <line className="floor__desk-stand" x1={mon.x} y1={mon.y - h} x2={mon.x} y2={mon.y - h - 4} />
      <rect className="floor__desk-frame" x={mon.x - 7} y={mon.y - h - 15} width={14} height={11} rx={1.5} />
      <rect className="floor__desk-screen" style={{ "--pd": `${((i * 53) % 160) / 100}s` } as React.CSSProperties} x={mon.x - 5.6} y={mon.y - h - 13.6} width={11.2} height={8.2} rx={1} />
      {/* keyboard */}
      <line className="floor__desk-keys" x1={c.x - 4} y1={c.y - h + 3} x2={c.x + 5} y2={c.y - h + 3} />
      {/* papers or a coffee, so the desks stop being clones */}
      {i % 3 === 0 ? (
        <rect className="floor__desk-paper" x={c.x + 9} y={c.y - h - 1} width={7} height={4.6} rx={0.8} />
      ) : null}
      {i % 3 === 1 ? <circle className="floor__desk-mug" cx={c.x + 11} cy={c.y - h + 1} r={2} /> : null}
      {/* chair back, then the sitter over it */}
      <rect className="floor__chair" x={seat.x - 5.6} y={seat.y - 5} width={11.2} height={6.5} rx={2.5} />
      <g className="floor__person" style={{ "--pd": `${((i * 37) % 120) / 100}s` } as React.CSSProperties}>
        <rect
          className="floor__person-body"
          style={{ fill: jacket }}
          x={seat.x - 5}
          y={seat.y - 14.5}
          width={10}
          height={11}
          rx={4.4}
        />
        <circle className="floor__person-head" cx={seat.x} cy={seat.y - 17.5} r={3.6} />
      </g>
      <text className="floor__desk-label" data-audit-ignore x={c.x} y={c.y + 16}>
        {label}
      </text>
    </g>
  );
}

function Plant({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__plant" aria-hidden="true">
      <rect x={c.x - 2.6} y={c.y - 6} width={5.2} height={6} rx={1} className="floor__plant-pot" />
      <circle cx={c.x - 2.2} cy={c.y - 9} r={3.4} className="floor__plant-leaf" />
      <circle cx={c.x + 2.4} cy={c.y - 9.6} r={3} className="floor__plant-leaf" />
      <circle cx={c.x} cy={c.y - 12.6} r={3.6} className="floor__plant-leaf" />
    </g>
  );
}

function Island({ dept, waiting, selected }: { dept: Dept; waiting: number; selected: boolean }) {
  const { u, v, size } = dept;
  const sides = sideFaces(u, v, size, size, ISLE_LIFT);
  const spots = deskSpots(dept);
  const label =
    dept.labelSide === "e"
      ? px(u + size * 1.28, v + size * 0.1)
      : px(u + size * 0.1, v + size * 1.28);
  const flag = px(u, v - size);
  return (
    <g
      className="floor__isle"
      data-own={dept.own || undefined}
      data-selected={selected || undefined}
      aria-hidden="true"
    >
      <path className="floor__isle-top" d={topFace(u, v, size, size, ISLE_LIFT)} />
      <path className="floor__isle-side" d={sides.right} />
      <path className="floor__isle-side floor__isle-side--l" d={sides.left} />
      <Plant u={u - size + 0.55} v={v - size + 0.55} />
      <Plant u={u + size - 0.55} v={v + size - 0.55} />
      {spots.map((s, i) => (
        <Desk key={i} u={s.u} v={s.v} own={dept.desks[i].own} label={dept.desks[i].label} i={i} />
      ))}
      <text className="floor__isle-label" x={label.x} y={label.y - ISLE_LIFT + 26}>
        {dept.name.toUpperCase()}
        {dept.own ? " · OURS" : ""}
      </text>
      {waiting > 0 ? (
        <g className="floor__isle-flag">
          <circle cx={flag.x} cy={flag.y - ISLE_LIFT - 12} r={8} />
          <text x={flag.x} y={flag.y - ISLE_LIFT - 8.6}>
            {waiting}
          </text>
        </g>
      ) : null}
    </g>
  );
}

/**
 * The restaurant. Awning over the door, lit windows, a rooftop sign and two
 * pavement tables, because the thing at the centre of the floor is a venue,
 * not a server.
 */
function Hub() {
  const slab = sideFaces(0, 0, HUB.size, HUB.size, HUB.lift);
  const B = 1.3; // building half-extent
  const BH = 46; // wall height
  const bSides = sideFaces(0, 0, B, B, BH);
  const cE = px(B, -B);
  const cS = px(B, B);
  const cW = px(-B, B);
  const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  // The awning hangs along the right wall, over the door.
  const stripes = Array.from({ length: 5 }, (_, i) => ({
    a: lerp(cE, cS, 0.48 + i * 0.1),
    b: lerp(cE, cS, 0.58 + i * 0.1),
    deep: i % 2 === 0,
  }));
  const door = lerp(cE, cS, 0.74);
  // Windows on the left wall.
  const w1 = lerp(cS, cW, 0.32);
  const w2 = lerp(cS, cW, 0.64);
  return (
    <g className="floor__hub" aria-hidden="true">
      <path className="floor__hub-top" d={topFace(0, 0, HUB.size, HUB.size, HUB.lift)} />
      <path className="floor__hub-side" d={slab.right} />
      <path className="floor__hub-side floor__hub-side--l" d={slab.left} />

      <g transform={`translate(0 ${-HUB.lift})`}>
        <path className="floor__hub-btop" d={topFace(0, 0, B, B, BH)} />
        <path className="floor__hub-bside" d={bSides.right} />
        <path className="floor__hub-bside floor__hub-bside--l" d={bSides.left} />

        {/* windows, lit from inside */}
        {[w1, w2].map((w, i) => (
          <rect key={i} className="floor__hub-window" x={w.x - 5} y={w.y - 36} width={10} height={13} rx={1} />
        ))}

        {/* the door under the awning */}
        <rect className="floor__hub-door" x={door.x - 4.5} y={door.y - 17} width={9} height={17} rx={1} />

        {/* awning: striped, pitched off the wall */}
        {stripes.map((s2, i) => (
          <path
            key={i}
            className={s2.deep ? "floor__hub-awn floor__hub-awn--deep" : "floor__hub-awn"}
            d={`M ${s2.a.x} ${s2.a.y - 26} L ${s2.b.x} ${s2.b.y - 26} L ${s2.b.x + 6} ${s2.b.y - 19} L ${s2.a.x + 6} ${s2.a.y - 19} Z`}
          />
        ))}

        {/* rooftop sign */}
        <line className="floor__hub-signleg" x1={-18} y1={-BH} x2={-18} y2={-BH - 9} />
        <line className="floor__hub-signleg" x1={18} y1={-BH} x2={18} y2={-BH - 9} />
        <rect className="floor__hub-sign" x={-42} y={-BH - 24} width={84} height={15} rx={2} />
        <text className="floor__hub-label" x={0} y={-BH - 13}>
          PEREGRINE
        </text>
      </g>

      {/* pavement tables */}
      {[px(1.95, -0.55), px(-0.55, 1.95)].map((t, i) => (
        <g key={i} className="floor__hub-table">
          <line x1={t.x} y1={t.y - HUB.lift} x2={t.x} y2={t.y - HUB.lift - 8} className="floor__table-leg" />
          <ellipse cx={t.x} cy={t.y - HUB.lift - 8} rx={7} ry={3.4} className="floor__table-top" />
          <circle cx={t.x - 9.5} cy={t.y - HUB.lift - 1} r={2.4} className="floor__table-chair" />
          <circle cx={t.x + 9.5} cy={t.y - HUB.lift} r={2.4} className="floor__table-chair" />
          {i === 0 ? (
            <>
              <line
                x1={t.x}
                y1={t.y - HUB.lift - 8}
                x2={t.x}
                y2={t.y - HUB.lift - 23}
                className="floor__table-leg"
              />
              <path
                className="floor__parasol"
                d={`M ${t.x - 11} ${t.y - HUB.lift - 20} Q ${t.x} ${t.y - HUB.lift - 31} ${t.x + 11} ${t.y - HUB.lift - 20} Z`}
              />
            </>
          ) : null}
        </g>
      ))}
      <Plant u={-1.95} v={-1.95} />
    </g>
  );
}

/** One table, its chairs, and whoever is seated at it tonight. */
function VenueTable({
  spec,
  state,
}: {
  spec: { id: string; kind: "two" | "four" | "banq"; u: number; v: number };
  state: TableState;
}) {
  const { u, v, kind } = spec;
  const c = px(u, v);
  const h = 17; // tabletop height
  const seats =
    kind === "banq"
      ? [
          px(u - 0.92, v - 0.82),
          px(u, v - 0.82),
          px(u + 0.92, v - 0.82),
          px(u - 0.92, v + 0.88),
          px(u, v + 0.88),
          px(u + 0.92, v + 0.88),
        ]
      : kind === "four"
        ? [px(u - 1.15, v), px(u + 1.15, v), px(u, v - 1.15), px(u, v + 1.15)]
        : [px(u, v - 0.78), px(u, v + 0.78)];

  const seated = state.kind === "seated";
  const filled = seated ? Math.min(state.seating.covers, seats.length) : 0;
  const laid = state.kind !== "free";

  /** A chair: seat pad, and a back for the ones facing the camera. */
  const chair = (p2: { x: number; y: number }, k: number, front: boolean) => (
    <g key={k}>
      {front ? (
        <rect className="floor__vchairback" x={p2.x - 5} y={p2.y - 15} width={10} height={9} rx={3} />
      ) : null}
      <ellipse className="floor__vseat" cx={p2.x} cy={p2.y - 4} rx={6} ry={3.4} />
      <line className="floor__vchairleg" x1={p2.x} y1={p2.y - 4} x2={p2.x} y2={p2.y} />
    </g>
  );

  // The overhead marker: who is on it, or how long until someone is.
  const label =
    state.kind === "seated"
      ? `${state.seating.name} ×${state.seating.covers}`
      : state.kind === "due"
        ? `${state.inMins <= 60 ? `${state.inMins}m` : clock(state.seating.at)} · ${state.seating.name} ×${state.seating.covers}`
        : "Free";
  const soon = state.kind === "due" && state.inMins <= 15;
  const chipW = label.length * 5.6 + (state.kind === "due" ? 26 : 18);

  return (
    <g
      className="floor__vtable"
      data-booked={seated ? "" : undefined}
      data-state={state.kind}
      data-soon={soon || undefined}
    >
      {seats.map((p2, i) => chair(p2, i, p2.y > c.y))}

      {kind === "four" ? (
        <>
          <line className="floor__vleg" x1={c.x} y1={c.y - h} x2={c.x} y2={c.y} />
          <ellipse className="floor__vfoot" cx={c.x} cy={c.y} rx={7} ry={3.4} />
          <ellipse className="floor__vtop" cx={c.x} cy={c.y - h} rx={24} ry={12} />
          <ellipse className="floor__vtop-hi" cx={c.x} cy={c.y - h - 1.6} rx={24} ry={12} />
        </>
      ) : kind === "banq" ? (
        <>
          <path className="floor__vbench" d={topFace(u, v - 1.28, 1.55, 0.34, 9)} />
          <path className="floor__vbenchback" d={sideFaces(u, v - 1.56, 1.55, 0.08, 20).right} />
          <path className="floor__vlegs" d={sideFaces(u, v, 1.4, 0.56, h).right} />
          <path className="floor__vlegs floor__vlegs--l" d={sideFaces(u, v, 1.4, 0.56, h).left} />
          <path className="floor__vtop-sq" d={topFace(u, v, 1.4, 0.56, h)} />
        </>
      ) : (
        <>
          <line className="floor__vleg" x1={c.x} y1={c.y - h} x2={c.x} y2={c.y} />
          <ellipse className="floor__vfoot" cx={c.x} cy={c.y} rx={5.5} ry={2.6} />
          <ellipse className="floor__vtop" cx={c.x} cy={c.y - h} rx={15} ry={7.5} />
          <ellipse className="floor__vtop-hi" cx={c.x} cy={c.y - h - 1.6} rx={15} ry={7.5} />
        </>
      )}

      {/* a setting on every laid table */}
      {kind !== "banq" && laid ? (
        <>
          <circle className="floor__vplate" cx={c.x - (kind === "four" ? 9 : 5.5)} cy={c.y - h - 1} r={kind === "four" ? 3.2 : 2.4} />
          <circle className="floor__vplate" cx={c.x + (kind === "four" ? 9 : 5.5)} cy={c.y - h - 1} r={kind === "four" ? 3.2 : 2.4} />
          <rect className="floor__vglass" x={c.x - 1.5} y={c.y - h - 7.5} width={3} height={5.5} rx={1} />
        </>
      ) : null}

      {/* guests */}
      {seats.slice(0, filled).map((p2, i) => (
        <g key={i} className="floor__vperson">
          <rect
            className="floor__vguest-body"
            style={{ fill: JACKETS[(i + spec.id.length) % JACKETS.length] }}
            x={p2.x - 5.2}
            y={p2.y - 15}
            width={10.4}
            height={11}
            rx={4.6}
          />
          <circle className="floor__vguest" cx={p2.x} cy={p2.y - 18} r={4} />
        </g>
      ))}

      {/* the overhead marker, on a stalk so it reads as hanging over the table */}
      <g className="floor__vmark">
        <line x1={c.x} y1={c.y - h - 6} x2={c.x} y2={c.y - h - 30} />
        <rect x={c.x - chipW / 2} y={c.y - h - 46} width={chipW} height={16} rx={8} />
        {state.kind === "due" ? (
          <circle className="floor__vmark-dot" cx={c.x - chipW / 2 + 10} cy={c.y - h - 38} r={3} />
        ) : null}
        {state.kind === "seated" ? (
          <circle className="floor__vmark-dot" cx={c.x - chipW / 2 + 10} cy={c.y - h - 38} r={3} />
        ) : null}
        <text x={c.x + (state.kind === "free" ? 0 : 7)} y={c.y - h - 34.8}>
          {label}
        </text>
      </g>

      {state.kind === "seated" && state.seating.note ? (
        <text className="floor__vnote" x={c.x} y={c.y + 20}>
          {state.seating.note}
        </text>
      ) : null}
    </g>
  );
}

/**
 * Inside the restaurant: the dining room with the book laid over it. The same
 * room the booking widget writes into, one day at a time.
 */
function VenueScene({ now }: { now: number }) {
  // Sized so a four-top reads about a twelfth of the room's width, which is
  // roughly what a 1.1m table does in a 12m dining room. The earlier room was
  // three times that and the furniture read as confetti.
  const F = { a: 5.6, b: 4.3, h: 18 };
  const sides = sideFaces(0, 0, F.a, F.b, F.h);
  const N = px(-F.a, -F.b);
  const E = px(F.a, -F.b);
  const W = px(-F.a, F.b);
  const WALL = 74;
  const bar = { u: 4.35, v: -0.6, a: 0.52, b: 2.1, h: 26 };

  /* A wall opening drawn in the wall's own plane. An upright rect reads as a
     sticker on an isometric wall; the parallelogram is what makes it a window. */
  const along = (from: { x: number; y: number }, to: { x: number; y: number }) =>
    (t0: number, t1: number, top: number, bottom: number) => {
      const p0 = { x: from.x + (to.x - from.x) * t0, y: from.y + (to.y - from.y) * t0 };
      const p1 = { x: from.x + (to.x - from.x) * t1, y: from.y + (to.y - from.y) * t1 };
      return `M ${p0.x} ${p0.y - top} L ${p1.x} ${p1.y - top} L ${p1.x} ${p1.y - bottom} L ${p0.x} ${p0.y - bottom} Z`;
    };
  const rightWall = along(N, E);
  const leftWall = along(N, W);

  const lamps = [
    { u: -3.7, v: -3.1 },
    { u: 0.6, v: -3.1 },
    { u: -2.6, v: -0.5 },
    { u: 1.3, v: -0.5 },
    { u: -3.7, v: 2.1 },
    { u: -0.7, v: 2.1 },
  ];

  // Service runs the light: bright at doors, warm and low by the last turn.
  const dusk = Math.max(0, Math.min(1, (now - OPEN) / (CLOSE - OPEN)));

  // The waiter's round, pass to floor and back.
  const passPt = px(bar.u - 1.1, bar.v);
  const roundPath = `M ${passPt.x} ${passPt.y} L ${px(0.4, 0.7).x + 26} ${px(0.4, 0.7).y + 6} L ${px(-3.4, 0.3).x + 28} ${px(-3.4, 0.3).y + 8} L ${px(-3.2, -2.9).x + 20} ${px(-3.2, -2.9).y + 14} L ${passPt.x} ${passPt.y}`;

  return (
    <g className="floor__venue" transform="translate(0 118) scale(1.38)" aria-hidden="true">
      {/* the two walls the camera can see */}
      <path
        className="floor__vwall"
        d={`M ${N.x} ${N.y - F.h} L ${E.x} ${E.y - F.h} L ${E.x} ${E.y - F.h - WALL} L ${N.x} ${N.y - F.h - WALL} Z`}
      />
      <path
        className="floor__vwall floor__vwall--l"
        d={`M ${N.x} ${N.y - F.h} L ${W.x} ${W.y - F.h} L ${W.x} ${W.y - F.h - WALL} L ${N.x} ${N.y - F.h - WALL} Z`}
      />

      {/* windows down the right wall, cut in the wall's own plane */}
      {[
        [0.16, 0.34],
        [0.44, 0.62],
        [0.72, 0.9],
      ].map(([t0, t1]) => (
        <g key={t0}>
          <path className="floor__vwindow" style={{ opacity: 0.5 - dusk * 0.34 }} d={rightWall(t0, t1, WALL - 14, 22)} />
          <path className="floor__vmullion" d={rightWall((t0 + t1) / 2 - 0.006, (t0 + t1) / 2 + 0.006, WALL - 14, 22)} />
        </g>
      ))}

      {/* the pass-through to the kitchen on the left wall */}
      <path className="floor__vhatch" d={leftWall(0.14, 0.36, WALL - 22, 30)} />
      <path className="floor__vdoor" d={leftWall(0.62, 0.78, WALL - 30, 0)} />

      {/* skirting, so the walls meet the floor rather than float */}
      <path className="floor__vskirt" d={rightWall(0, 1, 5, 0)} />
      <path className="floor__vskirt" d={leftWall(0, 1, 5, 0)} />

      {/* the floor */}
      <path className="floor__vfloor" d={topFace(0, 0, F.a, F.b, F.h)} />
      <path className="floor__isle-side" d={sides.right} />
      <path className="floor__isle-side floor__isle-side--l" d={sides.left} />

      {/* floorboards run the length of the room */}
      {[-3.5, -2.6, -1.7, -0.8, 0.1, 1.0, 1.9, 2.8, 3.7].map((t) => {
        const a = px(-F.a + 0.25, t);
        const b = px(F.a - 0.25, t);
        return <line key={t} className="floor__vboard" x1={a.x} y1={a.y - F.h} x2={b.x} y2={b.y - F.h} />;
      })}

      {/* the pass, down the right-hand wall */}
      <path className="floor__vbar-side" d={sideFaces(bar.u, bar.v, bar.a, bar.b, bar.h).right} />
      <path className="floor__vbar-side floor__vbar-side--l" d={sideFaces(bar.u, bar.v, bar.a, bar.b, bar.h).left} />
      <path className="floor__vbar" d={topFace(bar.u, bar.v, bar.a, bar.b, bar.h)} />
      <circle className="floor__vmachine" cx={px(bar.u, bar.v - 1.5).x} cy={px(bar.u, bar.v - 1.5).y - bar.h - 6} r={4.2} />
      <rect
        className="floor__vtill"
        x={px(bar.u, bar.v + 1.4).x - 5}
        y={px(bar.u, bar.v + 1.4).y - bar.h - 11}
        width={10}
        height={8}
        rx={1.5}
      />

      {/* the room */}
      {TABLES.map((t, i) => (
        <g key={t.id} className="floor__varrive" style={{ animationDelay: `${i * 70}ms` }}>
          <VenueTable spec={t} state={tableState(t.id, now)} />
        </g>
      ))}

      <Plant u={-F.a + 0.6} v={F.b - 0.6} />
      <Plant u={F.a - 0.6} v={F.b - 0.6} />

      {/* one on the floor, one on the pass */}
      <g className="floor__vstaff">
        <rect x={px(bar.u - 0.9, bar.v - 0.2).x - 5} y={px(bar.u - 0.9, bar.v - 0.2).y - 26} width={10} height={11} rx={4.6} />
        <circle cx={px(bar.u - 0.9, bar.v - 0.2).x} cy={px(bar.u - 0.9, bar.v - 0.2).y - 29} r={4} />
      </g>
      <g className="floor__vstaff floor__vstaff--walk">
        <rect x={-5} y={-26} width={10} height={11} rx={4.6} />
        <circle cx={0} cy={-29} r={4} />
        <rect className="floor__vtray" x={-9} y={-31} width={7} height={3} rx={1} />
        <animateMotion dur="17s" repeatCount="indefinite" path={roundPath} rotate="0" />
      </g>

      {/* pendants last: they hang in front of everything they light */}
      {lamps.map((l, i) => {
        const lp = px(l.u, l.v);
        return (
          <g key={i} className="floor__vlamp">
            <line x1={lp.x} y1={lp.y - F.h - WALL} x2={lp.x} y2={lp.y - 74} />
            <path
              className="floor__vshade"
              d={`M ${lp.x - 10} ${lp.y - 74} L ${lp.x + 10} ${lp.y - 74} L ${lp.x + 5} ${lp.y - 84} L ${lp.x - 5} ${lp.y - 84} Z`}
            />
            <circle className="floor__vbulb" style={{ opacity: 0.35 + dusk * 0.6 }} cx={lp.x} cy={lp.y - 73} r={3} />
            <ellipse
              className="floor__vpool"
              style={{ opacity: dusk * 0.3 }}
              cx={lp.x}
              cy={lp.y - F.h}
              rx={40}
              ry={20}
            />
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

function TaskRow({
  task,
  state,
  onApprove,
}: {
  task: Task;
  state: TaskState;
  onApprove: (id: string) => void;
}) {
  const done = state === "done" && task.state === "needs";
  const text = done ? task.doneText ?? task.text : task.text;
  const time = done ? task.doneTime ?? task.time : task.time;
  return (
    <li className="floor__task" data-state={state} data-cleared={done || undefined}>
      <span className="floor__task-dot" aria-hidden />
      <div className="floor__task-main">
        <p className="floor__task-text">{text}</p>
        <p className="floor__task-meta">
          <span>{time}</span>
          <span aria-hidden> · </span>
          <span>{task.system}</span>
          {done ? (
            <>
              <span aria-hidden> · </span>
              <span>Approved by you</span>
            </>
          ) : null}
        </p>
        {state === "needs" && task.trail ? (
          <>
            <ol className="floor__trail">
              {task.trail.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <button type="button" className="floor__approve" onClick={() => onApprove(task.id)}>
              {task.approveLabel ?? "Approve"}
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}

/** The flagship systems a department works through, as letter-tile chips. */
function StackRow({ dept }: { dept: Dept }) {
  return (
    <div className="floor__stackrow">
      <span className="floor__stackrow-label">{dept.own ? "Runs on" : "Works with"}</span>
      <span className="floor__stackrow-chips">
        {dept.stack.map((s) => (
          <span key={s.label} className="floor__syschip" data-own={s.own || undefined}>
            <span className="floor__syschip-tile" aria-hidden>
              {s.label[0]}
            </span>
            {s.label}
          </span>
        ))}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The section                                                         */
/* ------------------------------------------------------------------ */

export function AgentFloor() {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"floor" | "venue">("floor");
  // Reduced motion parks the service mid-shift rather than running it, so the
  // room still shows a seated table, a countdown and a free one at once. That
  // is a starting value, not a synchronisation, so it belongs in the
  // initialiser rather than in an effect.
  const [now, setNow] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? 19 * 60 + 25
      : OPEN,
  );
  const [states, setStates] = useState<Record<string, TaskState>>(() =>
    Object.fromEntries(ALL_TASKS.map((t) => [t.id, t.state])),
  );
  const [announce, setAnnounce] = useState("");

  const panelRef = useRef<HTMLElement>(null);
  const hotRef = useRef(-1);
  const ambientRefs = useRef<(SVGCircleElement | null)[]>([]);
  const cloudRefs = useRef<(SVGCircleElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const burstsRef = useRef<{ path: number; t: number }[]>([]);
  const burstRefs = useRef<(SVGCircleElement | null)[]>([]);

  const needsCount = ALL_TASKS.filter((t) => states[t.id] === "needs").length;
  const watchCount = ALL_TASKS.filter((t) => states[t.id] === "watching").length;
  const doneCount = ALL_TASKS.filter((t) => states[t.id] === "done").length;

  const headline =
    needsCount === 2
      ? "Two things need you."
      : needsCount === 1
        ? "One thing needs you."
        : "Nothing needs you. Go open.";

  const waitingByDept = useMemo(
    () =>
      Object.fromEntries(
        DEPTS.map((d) => [d.id, d.tasks.filter((t) => states[t.id] === "needs").length]),
      ) as Record<string, number>,
    [states],
  );

  function select(id: string | null) {
    setView("floor");
    setSelected(id);
    hotRef.current = id ? DEPTS.findIndex((d) => d.id === id) : -1;
    if (id && typeof window !== "undefined" && window.innerWidth < 1200) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function enterVenue() {
    setSelected(null);
    hotRef.current = -1;
    setView("venue");
    setNow(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? 19 * 60 + 25
        : OPEN,
    );
    if (typeof window !== "undefined" && window.innerWidth < 1200) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /* Inside the venue the clock runs the service: a minute every 190ms, so a
     four-hour shift plays in about fifty seconds and a countdown visibly
     falls. Reduced motion parks it mid-service instead, where the room is
     half full and every state is on screen at once. */
  useEffect(() => {
    if (view !== "venue") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(
      () => setNow((m) => (m + 1 > CLOSE ? OPEN : m + 1)),
      190,
    );
    return () => window.clearInterval(t);
  }, [view]);

  function approve(id: string) {
    const task = ALL_TASKS.find((t) => t.id === id);
    if (!task) return;
    setStates((s) => ({ ...s, [id]: "done" }));
    setAnnounce(task.doneText ?? "Approved");
    const dept = DEPTS.findIndex((d) => d.tasks.some((t) => t.id === id));
    if (dept >= 0) {
      for (let i = 0; i < 5; i++) {
        burstsRef.current.push({ path: dept, t: 1 + i * 0.09 });
      }
    }
  }

  /* Ambient motion: walkway particles, the brain cloud, approval bursts.
     One rAF loop writing attributes directly, the orbit-tree pattern, so the
     scene never re-renders per frame. */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lens = pathRefs.current.map((p) => (p ? p.getTotalLength() : 0));

    // Deterministic pseudo-random spread, seeded so hydration never differs.
    const rand = (i: number) => (Math.sin(i * 127.1) * 43758.5453) % 1;
    const ambient = ambientRefs.current.map((_, i) => ({
      path: i % DEPTS.length,
      t: Math.abs(rand(i + 1)),
      speed: 0.05 + Math.abs(rand(i + 7)) * 0.05,
      dir: i % 2 === 0 ? 1 : -1,
    }));

    // Place everything once, so a reduced-motion reader still sees the scene.
    ambient.forEach((p, i) => {
      const el = ambientRefs.current[i];
      const path = pathRefs.current[p.path];
      if (!el || !path || !lens[p.path]) return;
      const pt = path.getPointAtLength(p.t * lens[p.path]);
      el.setAttribute("cx", String(pt.x));
      el.setAttribute("cy", String(pt.y));
      el.setAttribute("opacity", "0.5");
    });
    const cloud = cloudRefs.current.map((_, i) => ({
      angle: Math.abs(rand(i + 3)) * Math.PI * 2,
      rx: 20 + Math.abs(rand(i + 11)) * 38,
      ry: 7 + Math.abs(rand(i + 17)) * 11,
      speed: 0.25 + Math.abs(rand(i + 23)) * 0.4,
      r: 1.9 + Math.abs(rand(i + 29)) * 2.1,
    }));
    const cc = px(0, 0);
    const cloudY = cc.y - HUB.lift - 46 - 62;
    cloud.forEach((d, i) => {
      const el = cloudRefs.current[i];
      if (!el) return;
      el.setAttribute("cx", String(cc.x + Math.cos(d.angle) * d.rx));
      el.setAttribute("cy", String(cloudY + Math.sin(d.angle) * d.ry));
      el.setAttribute("r", String(d.r));
      el.setAttribute("opacity", "0.8");
    });

    if (reduced) return;

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;

      ambient.forEach((p, i) => {
        const el = ambientRefs.current[i];
        const path = pathRefs.current[p.path];
        if (!el || !path || !lens[p.path]) return;
        p.t += p.speed * (p.path === hotRef.current ? 3 : 1) * p.dir * dt;
        if (p.t > 1) p.t -= 1;
        if (p.t < 0) p.t += 1;
        const pt = path.getPointAtLength(p.t * lens[p.path]);
        el.setAttribute("cx", String(pt.x));
        el.setAttribute("cy", String(pt.y));
      });

      const bob = Math.sin(now / 1400) * 3;
      cloud.forEach((d, i) => {
        const el = cloudRefs.current[i];
        if (!el) return;
        d.angle += d.speed * dt;
        el.setAttribute("cx", String(cc.x + Math.cos(d.angle) * d.rx));
        el.setAttribute("cy", String(cloudY + Math.sin(d.angle) * d.ry + bob));
        el.setAttribute(
          "opacity",
          String(0.45 + 0.45 * (0.5 + 0.5 * Math.sin(d.angle * 2 + i))),
        );
      });

      // Bursts run island to hub, then retire.
      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.t -= dt * 0.9;
        const el = burstRefs.current[i % burstRefs.current.length];
        const path = pathRefs.current[b.path];
        if (b.t <= 0 || !el || !path || !lens[b.path]) {
          if (el) el.setAttribute("opacity", "0");
          if (b.t <= 0) bursts.splice(i, 1);
          continue;
        }
        const t = Math.min(1, b.t);
        const pt = path.getPointAtLength(t * lens[b.path]);
        el.setAttribute("cx", String(pt.x));
        el.setAttribute("cy", String(pt.y));
        el.setAttribute("opacity", "0.9");
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seatedCovers = SEATINGS.filter((x) => now >= x.at && now < x.at + TURN).reduce(
    (n, x) => n + x.covers,
    0,
  );
  const answered = ENQUIRIES.filter((e) => e.at <= now).length;

  const dept = DEPTS.find((d) => d.id === selected) ?? null;
  const camera = dept ? zoomTransform(dept) : undefined;

  return (
    <section className="floor">

      <div className="floor__caption">
        <Reveal className="floor__copy">
          <p className="floor__title">Everything that ran while you were closed.</p>
          <p className="floor__body">
            Six departments, the venue at the centre, and the two decisions
            still on the desk. The rest explains itself, so click around.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="floor__legendwrap">
          <p className="floor__live" aria-hidden>
            <span className="floor__live-dot" />
            Live demo, click anything
          </p>
          <div className="floor__legend" aria-hidden>
            <span data-k="needs">Needs you</span>
            <span data-k="watching">Watching</span>
            <span data-k="done">Done</span>
          </div>
        </Reveal>
      </div>

      <div className="floor__stage">
        <div className="floor__scene" data-zoomed={selected ? "" : undefined} data-view={view}>
          <svg
            viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
            role="img"
            aria-label={
              view === "venue"
                ? "Inside the restaurant: the dining room with the coming days' bookings laid over it"
                : "An isometric floor plan of the venue's six departments, connected to the restaurant and Peregrine at the centre"
            }
          >
            {view === "venue" ? (
              <VenueScene now={now} />
            ) : (
            <g key="office" className="floor__office" transform={camera}>
            {/* walkways first, so everything sits on top of them */}
            {DEPTS.map((d, i) => (
              <path
                key={d.id}
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                className="floor__walk"
                d={walkway(d)}
              />
            ))}

            {/* ambient particles: three per walkway */}
            {Array.from({ length: DEPTS.length * 3 }, (_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  ambientRefs.current[i] = el;
                }}
                className="floor__mote"
                r={2.1}
                opacity={0}
              />
            ))}

            {/* islands, back to front so overlap stacks correctly */}
            {[...DEPTS]
              .sort((a, b) => a.u + a.v - (b.u + b.v))
              .map((d) => (
                <g key={d.id} onClick={() => select(d.id)}>
                  <Island dept={d} waiting={waitingByDept[d.id]} selected={selected === d.id} />
                </g>
              ))}

            <g onClick={enterVenue} className="floor__hubhit">
              <Hub />
              <text className="floor__hub-hint" data-audit-ignore x={0} y={2 * HUB.size * KY + 30}>
                STEP INSIDE
              </text>
            </g>

            {/* the brain at work */}
            {Array.from({ length: 22 }, (_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  cloudRefs.current[i] = el;
                }}
                className="floor__brain"
                r={2}
                opacity={0}
              />
            ))}

            {/* burst pool for approvals */}
            {Array.from({ length: 6 }, (_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  burstRefs.current[i] = el;
                }}
                className="floor__burst"
                r={2.7}
                opacity={0}
              />
            ))}
            </g>
            )}
          </svg>

          {view === "venue" ? (
            <>
              <div className="floor__clock">
                <span className="floor__clock-time">{clock(now)}</span>
                <span className="floor__clock-meta">
                  Friday · Dinner service
                  <em>{now < 18 * 60 ? "Doors" : now > 21 * 60 ? "Last turn" : "On"}</em>
                </span>
              </div>
              <div className="floor__status">
                <span>
                  <b>{seatedCovers}</b> of {SEATS_IN_ROOM} seats filled
                </span>
                <span className="floor__status-sep" aria-hidden />
                <span>
                  <b>{answered}</b> answered while you worked
                </span>
                {states.b1 === "done" ? (
                  <span className="floor__status-fn">Saturday lunch · function of 18 on the book</span>
                ) : null}
                <button type="button" className="floor__exit" onClick={() => select(null)}>
                  Exit to dashboard
                </button>
              </div>
            </>
          ) : null}

          {/* The cards double as the accessible controls for the scene. */}
          <div className="floor__cards">
            <button
              type="button"
              className="floor__card floor__card--venue"
              data-dept="venue"
              data-selected={view === "venue" || undefined}
              onClick={() => (view === "venue" ? select(null) : enterVenue())}
              aria-expanded={view === "venue"}
            >
              <span className="floor__card-name">
                The venue<em> step inside</em>
              </span>
              <span className="floor__card-count">One service, running</span>
              <span className="floor__card-metric">
                <span>Booked tonight</span>
                <span>{COVERS_TONIGHT} covers</span>
              </span>
              <span className="floor__card-metric">
                <span>Answered on the phone</span>
                <span>{ENQUIRIES.length}</span>
              </span>
            </button>
            {DEPTS.map((d) => {
              const waiting = waitingByDept[d.id];
              return (
                <button
                  key={d.id}
                  type="button"
                  className="floor__card"
                  data-dept={d.id}
                  data-selected={selected === d.id || undefined}
                  onClick={() => select(selected === d.id ? null : d.id)}
                  aria-expanded={selected === d.id}
                >
                  <span className="floor__card-name">
                    {d.name}
                    {d.own ? <em> ours</em> : null}
                  </span>
                  <span className="floor__card-count">
                    {d.desks.length} desks
                    {waiting > 0 ? (
                      <span className="floor__chip">{waiting} waiting approval</span>
                    ) : null}
                  </span>
                  {d.metrics.map(([k, v]) => (
                    <span key={k} className="floor__card-metric">
                      <span>{k}</span>
                      <span>{v}</span>
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        </div>

        <aside ref={panelRef} className="floor__panel">
          <p className="floor__panel-time">06:04 · The morning brief</p>
          <p className="floor__panel-headline" data-clear={needsCount === 0 || undefined}>
            {headline}
          </p>
          <p className="floor__panel-tally">
            Watched {watchCount} · Handled {doneCount}
            {needsCount > 0 ? " · Everything else is watched or handled" : ""}
          </p>

          {view === "venue" ? (
            <>
              <div className="floor__panel-head">
                <p className="floor__panel-dept">The phone, tonight</p>
                <button type="button" className="floor__panel-back" onClick={() => select(null)}>
                  Back to the office
                </button>
              </div>
              <p className="floor__venue-sub">
                Answered while the room was full. Nothing rang out.
              </p>
              <ul className="floor__enquiries">
                {ENQUIRIES.filter((e) => e.at <= now)
                  .slice()
                  .reverse()
                  .map((e) => {
                    const resolved = e.linkTask ? states[e.linkTask] === "done" : false;
                    const tag = resolved ? e.approvedTag ?? e.tag : e.tag;
                    const reply = resolved ? e.approvedReply ?? e.reply : e.reply;
                    return (
                      <li key={e.at} className="floor__enq">
                        <p className="floor__enq-meta">
                          <span className="floor__enq-ch">{e.channel === "call" ? "Call" : "Email"}</span>
                          <span>{clock(e.at)}</span>
                          <span className="floor__enq-tag" data-tag={tag}>
                            {tag}
                          </span>
                        </p>
                        <p className="floor__enq-text">{e.text}</p>
                        <p className="floor__enq-reply">
                          <span>Peregrine replied</span>
                          {reply}
                        </p>
                      </li>
                    );
                  })}
                {answered === 0 ? (
                  <li className="floor__enq-empty">Quiet so far. The line is open.</li>
                ) : null}
              </ul>
            </>
          ) : dept ? (
            <>
              <div className="floor__panel-head">
                <p className="floor__panel-dept">{dept.name}</p>
                <button type="button" className="floor__panel-back" onClick={() => select(null)}>
                  All departments
                </button>
              </div>
              <StackRow dept={dept} />
              <ul className="floor__tasks">
                {[...dept.tasks]
                  .sort(
                    (a, b) =>
                      ["needs", "watching", "done"].indexOf(states[a.id]) -
                      ["needs", "watching", "done"].indexOf(states[b.id]),
                  )
                  .map((t) => (
                    <TaskRow key={t.id} task={t} state={states[t.id]} onApprove={approve} />
                  ))}
              </ul>
            </>
          ) : (
            <ul className="floor__tasks">
              {ALL_TASKS.filter((t) => states[t.id] === "needs").map((t) => (
                <TaskRow key={t.id} task={t} state="needs" onApprove={approve} />
              ))}
              {needsCount === 0 ? (
                <li className="floor__task-empty">
                  Both cleared. The order is with Ordermentum and the quote is
                  in their inbox, and both are on the log with what they cost.
                </li>
              ) : null}
            </ul>
          )}

          <p className="floor__panel-note">
            {view === "venue"
              ? "The service runs itself. Approve the Saturday function in the brief and watch it land on the book."
              : "Open a department above for the full night, desk by desk."}
          </p>
          <span className="sr-only" role="status" aria-live="polite">
            {announce}
          </span>
        </aside>
      </div>
    </section>
  );
}
