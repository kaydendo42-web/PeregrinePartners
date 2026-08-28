"use client";

import { motion, useReducedMotion } from "motion/react";
import { departments } from "@/lib/content";

/**
 * The hero card's artwork: the night itself, drawn as a run sheet.
 *
 * It used to be an isometric 3x3 of desks — nine tiles, two lit. The count was
 * right and the picture was inert: nothing in it said the work happens while
 * the venue is shut, which is the only claim the card is making.
 *
 * So the nine become nine lanes across one night. Close is the left edge, open
 * is the right, and each department's bar is the window it actually works in:
 * the phone runs the whole night, the web listing takes ten minutes, the books
 * run long. A sweep crosses once, and the two bars that end in a solid mark are
 * the two decisions sitting on the desk at 06:04 — the same two the card counts
 * in its chip and the same two the morning brief opens with.
 *
 * Drawn at its rendered size rather than scaled down to it, so the hairlines
 * land on whole pixels.
 */

const W = 224;
const H = 154;

const X0 = 12; // close
const X1 = 212; // open
const span = X1 - X0;

const LANE0 = 44;
const STEP = 10.5;

const at = (t: number) => X0 + t * span;

/**
 * When each department works, as a share of the night. These are the windows
 * the product's own overnight run implies — the phone answered through the
 * whole of it, the till read continuously, the listing touched once.
 */
const WINDOWS: Array<[number, number]> = [
  [0.05, 0.3], // 001 suppliers
  [0.1, 0.62], // 002 books
  [0.34, 0.55], // 003 marketing
  [0.0, 0.95], // 004 reception
  [0.42, 0.52], // 005 web
  [0.2, 0.78], // 006 bookings
  [0.55, 0.72], // 007 roster
  [0.66, 0.88], // 008 admin
  [0.02, 0.99], // 009 till
];

/** 002 and 006 are the two the modelled night hands back. */
const LANES = departments.panels.map((p, i) => ({
  n: p.n,
  title: p.title,
  y: LANE0 + i * STEP,
  from: at(WINDOWS[i][0]),
  to: at(WINDOWS[i][1]),
  needs: p.n === "002" || p.n === "006",
  /** The till is read-only: its lane is outlined, never filled in. */
  watching: p.n === "009",
}));

const EASE = [0.22, 1, 0.36, 1] as const;

export function FloorCard() {
  const still = useReducedMotion();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      role="img"
      aria-label="One night, nine departments: each works its own window between close and open, and two of them end on a decision waiting at 06:04"
    >
      <rect width={W} height={H} fill="var(--dark)" />

      {/* the hours, as three faint uprights */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={at(t)}
          y1={LANE0 - 8}
          x2={at(t)}
          y2={LANE0 + 8 * STEP + 8}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}

      {LANES.map((l, i) => (
        <g key={l.n}>
          <title>{`${l.n} ${l.title}`}</title>

          {/* the lane it runs in */}
          <line x1={X0} y1={l.y} x2={X1} y2={l.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <line x1={X0} y1={l.y - 2.5} x2={X0} y2={l.y + 2.5} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

          {/* the window it works in */}
          <motion.rect
            x={l.from}
            y={l.y - 2}
            width={Math.max(l.to - l.from, 5)}
            height="4"
            rx="2"
            fill={
              l.needs
                ? "rgba(255,255,255,0.92)"
                : l.watching
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.22)"
            }
            stroke={l.watching ? "rgba(255,255,255,0.26)" : "none"}
            strokeWidth={l.watching ? "0.8" : "0"}
            initial={still ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            style={{ originX: `${l.from}px`, transformBox: "view-box" }}
            transition={{ duration: 0.8, delay: 0.25 + i * 0.07, ease: EASE }}
          />

          {/* and where it stops: a decision, or nothing at all */}
          {l.needs ? (
            <motion.g
              initial={still ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ originX: `${l.to}px`, originY: `${l.y}px`, transformBox: "view-box" }}
              transition={{ duration: 0.5, delay: 1.15 + i * 0.08, ease: EASE }}
            >
              <circle cx={l.to} cy={l.y} r="5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              <circle cx={l.to} cy={l.y} r="2.6" fill="#ffffff" />
            </motion.g>
          ) : null}
        </g>
      ))}

      {/* the night crossing once, close to open */}
      {still ? null : (
        <motion.g
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: span, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.6, delay: 0.2, ease: "linear", times: [0, 0.06, 0.9, 1] }}
        >
          <line
            x1={X0}
            y1={LANE0 - 10}
            x2={X0}
            y2={LANE0 + 8 * STEP + 10}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1"
          />
        </motion.g>
      )}

      {/* the standing count, in the language the whole product uses */}
      <motion.g
        initial={still ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
      >
        <rect x="12" y="12" width="90" height="21" rx="10.5" fill="rgba(255,255,255,0.1)" />
        <motion.circle
          cx="25"
          cy="22.5"
          r="3"
          fill="#fff"
          animate={still ? undefined : { opacity: [1, 0.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <text
          x="34"
          y="26"
          fill="#fff"
          fontSize="9.5"
          letterSpacing="0.04em"
          style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
        >
          2 NEED YOU
        </text>
      </motion.g>

      {/* the two ends of the night */}
      <text
        x={X1}
        y="26"
        textAnchor="end"
        fill="#fff"
        fontSize="9.5"
        letterSpacing="0.04em"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        06:04
      </text>
      <text
        x={X0}
        y={LANE0 + 8 * STEP + 18}
        fill="var(--paper-40)"
        fontSize="8.5"
        letterSpacing="0.04em"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        CLOSE
      </text>
      <text
        x={X1}
        y={LANE0 + 8 * STEP + 18}
        textAnchor="end"
        fill="var(--paper-40)"
        fontSize="8.5"
        letterSpacing="0.04em"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        OPEN
      </text>
    </svg>
  );
}
