"use client";

import { motion, useReducedMotion } from "motion/react";
import { external, internal } from "@/lib/content";

/**
 * The hero card's artwork: the platform floor, drawn small.
 *
 * A screenshot of `/platform` was the obvious answer and the wrong one — the
 * real floor is a 1440-wide isometric scene and shrinking it to 308px turns it
 * into grey mush. This is drawn for the size it renders at instead: nine tiles
 * on an isometric diamond, one per branch, in the same order the two branch
 * sections use. The count is the point, so the grid is 3x3 rather than a
 * decorative scatter.
 *
 * The two lit tiles are the two decisions the modelled night leaves behind —
 * the same two the overnight run block ends on, and the same two the chip
 * counts. Told apart by weight, never colour.
 */

const W = 23; // tile half-width
const H = 11.5; // tile half-height (2:1 isometric)
const D = 6; // extrusion depth

const CX = 160;
const CY = 120;

/** The nine branches, in index order, laid on a 3x3 isometric diamond. */
const CELLS = [...external.panels, ...internal.steps].map((b, i) => {
  const gx = (i % 3) - 1;
  const gy = Math.floor(i / 3) - 1;
  return {
    n: b.n,
    title: b.title,
    x: CX + (gx - gy) * W * 2,
    y: CY + (gx + gy) * H * 2,
    /** 002 and 006 are the two the modelled night hands back. */
    needs: b.n === "002" || b.n === "006",
    delay: (gx + gy + 2) * 0.09,
  };
});

const face = (x: number, y: number) =>
  `M${x - W} ${y} L${x} ${y - H} L${x + W} ${y} L${x} ${y + H} Z`;

const side = (x: number, y: number) =>
  `M${x - W} ${y} L${x} ${y + H} L${x + W} ${y} L${x + W} ${y + D} L${x} ${y + H + D} L${x - W} ${y + D} Z`;

export function FloorCard() {
  const still = useReducedMotion();

  return (
    <svg
      viewBox="0 0 320 220"
      className="h-full w-full"
      role="img"
      aria-label="The platform floor: nine branches of a business, two of them waiting on a decision"
    >
      <rect width="320" height="220" fill="var(--dark)" />

      {CELLS.map((c) => (
        <motion.g
          key={c.n}
          initial={still ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 + c.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <title>{`${c.n} ${c.title}`}</title>
          <path d={side(c.x, c.y)} fill="rgba(255,255,255,0.06)" />
          <path
            d={face(c.x, c.y)}
            fill={c.needs ? "#ffffff" : "rgba(255,255,255,0.04)"}
            stroke={c.needs ? "none" : "var(--paper-20)"}
            strokeWidth="1"
          />
          {/* the desk mark: solid where a decision waits, a ring where it does not */}
          {c.needs ? (
            <ellipse cx={c.x} cy={c.y} rx="4.5" ry="2.4" fill="var(--dark)" />
          ) : (
            <ellipse
              cx={c.x}
              cy={c.y}
              rx="4.5"
              ry="2.4"
              fill="none"
              stroke="var(--paper-40)"
              strokeWidth="1"
            />
          )}
        </motion.g>
      ))}

      {/* the standing count, in the language the whole product uses */}
      <motion.g
        initial={still ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect x="20" y="16" width="130" height="26" rx="13" fill="rgba(255,255,255,0.1)" />
        <motion.circle
          cx="35"
          cy="29"
          r="3.5"
          fill="#fff"
          animate={still ? undefined : { opacity: [1, 0.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <text
          x="46"
          y="33"
          fill="#fff"
          fontSize="11"
          letterSpacing="0.04em"
          style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
        >
          2 NEED YOU
        </text>
      </motion.g>

      <text
        x="300"
        y="33"
        textAnchor="end"
        fill="var(--paper-40)"
        fontSize="11"
        letterSpacing="0.04em"
        style={{ fontFamily: "var(--font-mono-ui), ui-monospace, monospace" }}
      >
        06:04
      </text>
    </svg>
  );
}
