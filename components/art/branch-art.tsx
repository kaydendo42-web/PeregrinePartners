"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * One drawn object per department.
 *
 * The template shipped a single rendered PNG and reused it behind all three
 * capability panels; with five panels that reads as five copies of nothing.
 * These are drawn instead, in the same isometric line language as `/platform`
 * so the marketing page and the product look like one system.
 *
 * Each is a picture of the branch's actual mechanic rather than an icon of its
 * category — the supplier panel shows a price moving and an order redrawn
 * around it, the books panel shows two lines out of a hundred and forty-eight
 * failing to match. Nothing here is a chart of invented data; they are
 * diagrams of behaviour.
 */

export type BranchArtKey =
  | "supply"
  | "books"
  | "marketing"
  | "reception"
  | "web"
  | "bookings"
  | "crm"
  | "roster"
  | "till";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Isometric projection: grid units in, screen coordinates out. */
const iso = (gx: number, gy: number, gz = 0): [number, number] => [
  60 + (gx - gy) * 15,
  62 + (gx + gy) * 7.5 - gz * 13,
];

const ink = "rgba(255,255,255,0.82)";
const faint = "rgba(255,255,255,0.26)";
const dim = "rgba(255,255,255,0.14)";

/** A flat isometric tile, used as the ground every object stands on. */
function Ground() {
  return (
    <path
      d="M60 14 L114 41 L60 68 L6 41 Z"
      fill="rgba(255,255,255,0.03)"
      stroke={dim}
      strokeWidth="0.8"
      transform="translate(0 34)"
    />
  );
}

export function BranchArt({ kind, className = "" }: { kind: BranchArtKey; className?: string }) {
  const still = useReducedMotion();
  const draw = still
    ? {}
    : {
        initial: { pathLength: 0, opacity: 0 },
        whileInView: { pathLength: 1, opacity: 1 },
        viewport: { once: true },
      };

  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden>
      <Ground />
      {kind === "supply" ? <Supply draw={draw} still={still} /> : null}
      {kind === "books" ? <Books draw={draw} still={still} /> : null}
      {kind === "marketing" ? <Marketing draw={draw} still={still} /> : null}
      {kind === "reception" ? <Reception draw={draw} still={still} /> : null}
      {kind === "web" ? <Web draw={draw} still={still} /> : null}
      {kind === "bookings" ? <Bookings draw={draw} still={still} /> : null}
      {kind === "crm" ? <Crm draw={draw} still={still} /> : null}
      {kind === "roster" ? <Roster draw={draw} still={still} /> : null}
      {kind === "till" ? <Till draw={draw} still={still} /> : null}
    </svg>
  );
}

type DrawProps = { draw: Record<string, unknown>; still: boolean | null };

/** A crate box in isometric, given its base grid cell and height in units. */
function Crate({ gx, gy, h = 1, lit = false }: { gx: number; gy: number; h?: number; lit?: boolean }) {
  const [tx, ty] = iso(gx, gy, h);
  const [bx, by] = iso(gx, gy, 0);
  const w = 15;
  const d = 7.5;
  const top = `M${tx} ${ty - d} L${tx + w} ${ty} L${tx} ${ty + d} L${tx - w} ${ty} Z`;
  const left = `M${tx - w} ${ty} L${tx} ${ty + d} L${bx} ${by + d} L${bx - w} ${by} Z`;
  const right = `M${tx + w} ${ty} L${tx} ${ty + d} L${bx} ${by + d} L${bx + w} ${by} Z`;
  return (
    <g>
      <path d={left} fill={lit ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)"} stroke={faint} strokeWidth="0.8" />
      <path d={right} fill={lit ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)"} stroke={faint} strokeWidth="0.8" />
      <path d={top} fill={lit ? "#ffffff" : "rgba(255,255,255,0.09)"} stroke={lit ? "none" : faint} strokeWidth="0.8" />
    </g>
  );
}

/** 001 — a price moves, and the order is redrawn around it. */
function Supply({ still }: DrawProps) {
  return (
    <>
      <Crate gx={-0.6} gy={0.6} />
      <Crate gx={0.6} gy={0.6} />
      <Crate gx={0} gy={-0.4} lit />
      {/* the line that moved, climbing off the stack */}
      <motion.path
        d="M78 52 L88 44 L96 47 L106 30"
        stroke={ink}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={still ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
      />
      <path d="M100 30h6v6" stroke={ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <text
        x="106"
        y="24"
        textAnchor="end"
        fill={ink}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        +34%
      </text>
      {/* and the one held flat */}
      <path d="M14 60 L30 60" stroke={faint} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
    </>
  );
}

/** 002 — a hundred and forty-eight lines clear, two do not. */
function Books({ still }: DrawProps) {
  const rows = Array.from({ length: 9 });
  return (
    <>
      {/* the sheet, standing on the tile */}
      <path
        d="M30 26 L90 26 L90 84 L30 84 Z"
        fill="rgba(255,255,255,0.04)"
        stroke={faint}
        strokeWidth="0.8"
      />
      {rows.map((_, i) => {
        const flagged = i === 3 || i === 7;
        const y = 34 + i * 5.6;
        return (
          <motion.g
            key={i}
            initial={still ? false : { opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.055, ease: EASE }}
          >
            <line
              x1="36"
              y1={y}
              x2={flagged ? 66 : 78}
              y2={y}
              stroke={flagged ? ink : dim}
              strokeWidth={flagged ? "1.6" : "1.2"}
              strokeLinecap="round"
            />
            {flagged ? <circle cx="84" cy={y} r="2.4" fill="#ffffff" /> : null}
          </motion.g>
        );
      })}
      <text
        x="30"
        y="97"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        148 · 2 FLAGGED
      </text>
    </>
  );
}

/** 003 — three drafted, none of them sent. */
function Marketing({ still }: DrawProps) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          initial={still ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.12 + i * 0.11, ease: EASE }}
        >
          <rect
            x={26 + i * 9}
            y={24 + i * 13}
            width="52"
            height="36"
            rx="5"
            fill="rgba(255,255,255,0.05)"
            stroke={i === 2 ? ink : faint}
            strokeWidth="0.9"
          />
          <line x1={33 + i * 9} y1={34 + i * 13} x2={61 + i * 9} y2={34 + i * 13} stroke={dim} strokeWidth="1.4" strokeLinecap="round" />
          <line x1={33 + i * 9} y1={40 + i * 13} x2={53 + i * 9} y2={40 + i * 13} stroke={dim} strokeWidth="1.4" strokeLinecap="round" />
        </motion.g>
      ))}
      {/* the queue, stopped */}
      <circle cx="88" cy="86" r="5.5" fill="#ffffff" />
      <text
        x="26"
        y="104"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        3 QUEUED · 0 SENT
      </text>
    </>
  );
}

/** 004 — the phone, answered through service. */
function Reception({ still }: DrawProps) {
  const bars = [6, 12, 20, 14, 24, 10, 17, 8, 13];
  return (
    <>
      <path
        d="M40 30c0 24 12 38 34 44l6-9-11-8-6 5c-7-5-12-11-14-19l7-4-4-13-8 1c-2 1-4 2-4 3Z"
        fill="rgba(255,255,255,0.08)"
        stroke={ink}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <g>
        {bars.map((h, i) => (
          <motion.line
            key={i}
            x1={22 + i * 8.5}
            y1={92 - h / 2}
            x2={22 + i * 8.5}
            y2={92 + h / 2}
            stroke={i === 4 ? "#ffffff" : faint}
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={still ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            style={{ originY: "92px" }}
            transition={{ duration: 0.45, delay: 0.15 + i * 0.05, ease: EASE }}
          />
        ))}
      </g>
      <text
        x="22"
        y="108"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        23 ANSWERED · 0 MISSED
      </text>
    </>
  );
}

/** 005 — the site and the listing, kept from the same place. */
function Web({ still }: DrawProps) {
  return (
    <>
      <rect x="20" y="24" width="62" height="44" rx="4" fill="rgba(255,255,255,0.05)" stroke={faint} strokeWidth="0.9" />
      <line x1="20" y1="33" x2="82" y2="33" stroke={faint} strokeWidth="0.9" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={26 + i * 5} cy="28.5" r="1.3" fill={dim} />
      ))}
      <line x1="27" y1="43" x2="60" y2="43" stroke={dim} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="27" y1="50" x2="72" y2="50" stroke={dim} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="27" y1="57" x2="52" y2="57" stroke={dim} strokeWidth="1.6" strokeLinecap="round" />

      {/* the listing pin, tied back to the same source */}
      <motion.g
        initial={still ? false : { opacity: 0, y: -8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      >
        <path
          d="M90 52c0-7 5.4-12 12-12s12 5 12 12c0 9-12 22-12 22S90 61 90 52Z"
          fill="rgba(255,255,255,0.08)"
          stroke={ink}
          strokeWidth="1.2"
        />
        <circle cx="102" cy="52" r="4" fill="#ffffff" />
      </motion.g>
      <path d="M82 52 L90 52" stroke={faint} strokeWidth="1" strokeDasharray="2 3" />

      <text
        x="20"
        y="90"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        HOURS · HOLIDAYS · PHOTOS
      </text>
    </>
  );
}

/** A table on the floor plan, drawn flat on the ground tile. */
const plan = (gx: number, gy: number): [number, number] => [
  60 + (gx - gy) * 18,
  75 + (gx + gy) * 9,
];

/** 006 — the floor plan, with one table held rather than sold twice. */
function Bookings({ still }: DrawProps) {
  const tables: Array<[number, number, boolean]> = [
    [-0.75, -0.75, false],
    [0.75, -0.75, true],
    [-0.75, 0.75, false],
    [0.75, 0.75, false],
  ];
  const [hx, hy] = plan(0.75, -0.75);

  return (
    <>
      {tables.map(([gx, gy, held], i) => {
        const [x, y] = plan(gx, gy);
        return (
          <motion.g
            key={i}
            initial={still ? false : { opacity: 0, y: -6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 + i * 0.08, ease: EASE }}
          >
            {/* four covers, set around the top */}
            {[-1, 1].map((s) => (
              <g key={s}>
                <ellipse cx={x + s * 15} cy={y} rx="3" ry="1.6" fill="none" stroke={faint} strokeWidth="0.8" />
                <ellipse cx={x} cy={y + s * 7.5} rx="3" ry="1.6" fill="none" stroke={faint} strokeWidth="0.8" />
              </g>
            ))}
            <ellipse
              cx={x}
              cy={y}
              rx="10"
              ry="5"
              fill={held ? "#ffffff" : "rgba(255,255,255,0.05)"}
              stroke={held ? "none" : faint}
              strokeWidth="0.9"
            />
            {held ? <ellipse cx={x} cy={y} rx="2.6" ry="1.3" fill="var(--dark)" /> : null}
          </motion.g>
        );
      })}

      {/* the enquiry arriving, and the table it lands on */}
      <motion.path
        d={`M12 34 C 34 26, ${hx - 16} 26, ${hx} ${hy - 16}`}
        stroke={faint}
        strokeWidth="1"
        strokeDasharray="2 3"
        fill="none"
        initial={still ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASE, delay: 0.3 }}
      />
      <line x1={hx} y1={hy - 16} x2={hx} y2={hy - 6} stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
      <motion.g
        initial={still ? false : { opacity: 0, y: -6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.9, ease: EASE }}
      >
        <rect x={hx - 17} y={hy - 30} width="34" height="14" rx="7" fill="#ffffff" />
        <text
          x={hx}
          y={hy - 20}
          textAnchor="middle"
          fill="var(--dark)"
          fontSize="8"
          style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
        >
          19:30
        </text>
      </motion.g>

      <text
        x="8"
        y="112"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        4 COVERS · HELD
      </text>
    </>
  );
}

/** 007 — the guest on file, the card on its tenth punch, the follow-up out. */
function Crm({ still }: DrawProps) {
  /** Ten visits, nine of them behind this guest. */
  const punches = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <>
      {/* the record, two older ones behind it */}
      {[2, 1].map((i) => (
        <rect
          key={i}
          x={16 + i * 4}
          y={22 - i * 4}
          width="58"
          height="40"
          rx="4"
          fill="rgba(255,255,255,0.04)"
          stroke={dim}
          strokeWidth="0.8"
        />
      ))}
      <motion.g
        initial={still ? false : { opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      >
        <rect x="16" y="26" width="58" height="40" rx="4" fill="rgba(255,255,255,0.06)" stroke={ink} strokeWidth="1.1" />
        <circle cx="27" cy="38" r="5.5" fill="none" stroke={faint} strokeWidth="1" />
        <line x1="37" y1="35" x2="66" y2="35" stroke={dim} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="37" y1="41" x2="57" y2="41" stroke={dim} strokeWidth="1.4" strokeLinecap="round" />

        {/* the loyalty strip: one row, nine punched and the tenth still open */}
        <line x1="22" y1="48" x2="68" y2="48" stroke={dim} strokeWidth="0.8" />
        {punches.map((i) => {
          const last = i === 9;
          return (
            <circle
              key={i}
              cx={22.5 + i * 5.1}
              cy={57}
              r={last ? "3" : "2"}
              fill={last ? "none" : "rgba(255,255,255,0.5)"}
              stroke={last ? "#ffffff" : "none"}
              strokeWidth="1.2"
            />
          );
        })}
      </motion.g>

      {/* the follow-up leaving, and landing */}
      <motion.path
        d="M74 40 C 86 40, 90 30, 100 30"
        stroke={faint}
        strokeWidth="1.1"
        fill="none"
        strokeDasharray="3 3"
        initial={still ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
      />
      <motion.g
        initial={still ? false : { opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        style={{ originX: "100px", originY: "30px" }}
        transition={{ duration: 0.4, delay: 0.9, ease: EASE }}
      >
        <rect x="88" y="20" width="22" height="15" rx="2" fill="var(--dark)" stroke={ink} strokeWidth="1.1" />
        <path d="M88 22.5 L99 29 L110 22.5" fill="none" stroke={ink} strokeWidth="1" strokeLinejoin="round" />
      </motion.g>

      <text
        x="14"
        y="98"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        9 OF 10 · REWARD DUE
      </text>
    </>
  );
}

/** 008 — a week of shifts, drafted against the line the day should carry. */
function Roster({ still }: DrawProps) {
  /** Each day is its shifts, not one bar: the stack is the roster's shape. */
  const week: number[][] = [
    [10, 8],
    [12, 7],
    [14, 9],
    [12, 11],
    [16, 13],
    [18, 15, 14],
    [12, 10],
  ];
  const base = 86;
  const line = 42;

  return (
    <>
      {/* what the day should carry */}
      <line x1="12" y1={line} x2="108" y2={line} stroke={faint} strokeWidth="1" strokeDasharray="3 3" />
      <text
        x="12"
        y={line - 5}
        fill={faint}
        fontSize="7"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        FORECAST
      </text>

      {week.map((shifts, i) => {
        const x = 16 + i * 13.5;
        const over = shifts.reduce((a, b) => a + b, 0) > base - line;
        let cursor = base;
        return (
          <motion.g
            key={i}
            initial={still ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.12 + i * 0.07, ease: EASE }}
          >
            {shifts.map((h, j) => {
              const y = cursor - h;
              cursor = y - 2.5;
              return (
                <rect
                  key={j}
                  x={x}
                  y={y}
                  width="8"
                  height={h}
                  rx="2"
                  fill={over ? "#ffffff" : "rgba(255,255,255,0.10)"}
                  stroke={over ? "none" : faint}
                  strokeWidth="0.8"
                />
              );
            })}
          </motion.g>
        );
      })}

      <line x1="12" y1={base + 3} x2="108" y2={base + 3} stroke={dim} strokeWidth="1" />
      <text
        x="12"
        y="104"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        7 DAYS · 1 OVER
      </text>
    </>
  );
}

/** 009 — read out of the till, and nothing written back into it. */
function Till({ still }: DrawProps) {
  return (
    <>
      {/* the terminal */}
      <rect x="14" y="34" width="34" height="46" rx="6" fill="rgba(255,255,255,0.05)" stroke={ink} strokeWidth="1.1" />
      <rect x="19" y="40" width="24" height="13" rx="2" fill="rgba(255,255,255,0.10)" stroke={faint} strokeWidth="0.8" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <circle key={`${r}${c}`} cx={22 + c * 9} cy={61 + r * 6.5} r="1.5" fill={dim} />
        )),
      )}

      {/* the tape, read on its way out */}
      <motion.path
        d="M48 44 C 62 44, 66 34, 80 34"
        stroke={faint}
        strokeWidth="1.1"
        fill="none"
        initial={still ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
      />
      <rect x="80" y="22" width="26" height="34" rx="3" fill="rgba(255,255,255,0.06)" stroke={faint} strokeWidth="0.8" />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="85"
          y1={30 + i * 7}
          x2={i === 2 ? 96 : 101}
          y2={30 + i * 7}
          stroke={i === 2 ? "#ffffff" : dim}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ))}

      {/* and the way back, which is closed */}
      <path d="M78 70 L54 70" stroke={faint} strokeWidth="1.1" strokeDasharray="3 3" />
      <path d="M60 65 L54 70 L60 75" fill="none" stroke={faint} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <motion.g
        initial={still ? false : { opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        style={{ originX: "66px", originY: "70px" }}
        transition={{ duration: 0.4, delay: 0.75, ease: EASE }}
      >
        <circle cx="66" cy="70" r="7" fill="var(--dark)" stroke={ink} strokeWidth="1.1" />
        <path d="M62.5 66.5 L69.5 73.5 M69.5 66.5 L62.5 73.5" stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
      </motion.g>

      <text
        x="14"
        y="98"
        fill={faint}
        fontSize="8"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        READ, NEVER WRITTEN
      </text>
    </>
  );
}
