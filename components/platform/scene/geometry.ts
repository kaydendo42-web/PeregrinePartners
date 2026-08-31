import type { Dept } from "./data";

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

export const S = 44; // px per grid unit
export const KX = Math.cos(Math.PI / 6) * S;
export const KY = Math.sin(Math.PI / 6) * S;

export const px = (u: number, v: number) => ({
  x: (u - v) * KX,
  y: (u + v) * KY,
});

/** Path string for the top face of an iso box at height h above the ground. */
export function topFace(u: number, v: number, a: number, b: number, h: number) {
  const n = px(u - a, v - b);
  const e = px(u + a, v - b);
  const s = px(u + a, v + b);
  const w = px(u - a, v + b);
  return `M ${n.x} ${n.y - h} L ${e.x} ${e.y - h} L ${s.x} ${s.y - h} L ${w.x} ${w.y - h} Z`;
}

/** The two faces the camera can see, east-south and south-west. */
export function sideFaces(u: number, v: number, a: number, b: number, h: number) {
  const e = px(u + a, v - b);
  const s = px(u + a, v + b);
  const w = px(u - a, v + b);
  return {
    right: `M ${e.x} ${e.y - h} L ${s.x} ${s.y - h} L ${s.x} ${s.y} L ${e.x} ${e.y} Z`,
    left: `M ${w.x} ${w.y - h} L ${s.x} ${s.y - h} L ${s.x} ${s.y} L ${w.x} ${w.y} Z`,
  };
}

/* ------------------------------------------------------------------ */
/* Scene constants                                                     */
/* ------------------------------------------------------------------ */

export const HUB = { size: 2.6, lift: 12 };
export const ISLE_LIFT = 18;
export const VIEW = { x: -690, y: -480, w: 1380, h: 985 };

/** Walkway endpoints: from the hub's edge to each island's near corner. */
export function walkway(d: Dept) {
  const len = Math.hypot(d.u, d.v);
  const inner = (HUB.size + 0.4) / len;
  const outer = (len - d.size - 0.4) / len;
  const a = px(d.u * inner, d.v * inner);
  const b = px(d.u * outer, d.v * outer);
  return `M ${a.x} ${a.y - 4} L ${b.x} ${b.y - 4}`;
}

/**
 * Desk positions on an island top, a loose two-column grid, clamped inside it.
 *
 * The gap alone is not enough. Desk draws its sitter 0.72 units further toward
 * the camera than the desk's own centre, so on Bookings, which is six desks and
 * therefore three rows, the last row landed at 2.378 + 0.72 = 3.098 against a
 * 2.9 half-extent and both sitters hung over the ground. Every spot goes
 * through the clamp, which reserves that reach on the near side.
 */
const SITTER_REACH = 0.72;

export function deskSpots(d: Dept) {
  const cols = 2;
  const gap = d.size * 0.82;
  const mu = Math.max(0, d.size - 0.8);
  const mv = Math.max(0, d.size - 0.8 - SITTER_REACH);
  return d.desks.map((_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const rows = Math.ceil(d.desks.length / cols);
    const du = (c - (cols - 1) / 2) * gap;
    const dv = (r - (rows - 1) / 2) * gap;
    return {
      u: d.u + Math.max(-mu, Math.min(mu, du)),
      v: d.v + Math.max(-mv, Math.min(mv, dv)),
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
export const ZOOM = 1.45;

export function zoomTransform(d: Dept) {
  const c = px(d.u, d.v);
  const tx = VIEW.x + VIEW.w / 2 - ZOOM * c.x;
  const ty = VIEW.y + VIEW.h / 2 - ZOOM * (c.y - 24);
  return `translate(${tx} ${ty}) scale(${ZOOM})`;
}

