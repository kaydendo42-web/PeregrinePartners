import type { Dept, Placement } from "./data";

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

/**
 * Treads climbing one plinth face, ground to island top.
 *
 * The stair is the strongest cue in the reference and the cheapest to draw:
 * boxes of falling height stepping outward from the face the walkway lands on.
 */
export function stairTreads(dept: Dept, n = 5) {
  const dirU = dept.stair === "w" ? -1 : dept.stair === "e" ? 1 : 0;
  const dirV = dept.stair === "n" ? -1 : dept.stair === "s" ? 1 : 0;
  const edgeU = dept.u + dirU * dept.w;
  const edgeV = dept.v + dirV * dept.d;
  const step = 0.5; // tread depth, grid units
  const run = 0.62; // half-width across the run

  /* k = 1 is the tread against the plinth, and it is the island's full height,
     so the stair arrives flush at the top instead of stopping a step short and
     reading as a slab parked beside the island. The centre offset is
     (k - 0.5) rather than k so tread 1 spans the edge itself: at k the first
     tread started half a step out and left a gap under it. */
  return Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    return {
      u: edgeU + dirU * step * (k - 0.5),
      v: edgeV + dirV * step * (k - 0.5),
      a: dirU ? step / 2 : run,
      b: dirV ? step / 2 : run,
      h: (dept.lift * (n - k + 1)) / n,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Scene constants                                                     */
/* ------------------------------------------------------------------ */

export const HUB = { size: 2.6, lift: 12 };
export const VIEW = { x: -581, y: -508, w: 1158, h: 962 };

/** Projected bounds of every island including its vertical, plus padding. */
export function sceneBounds(depts: Dept[], pad = 40) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const d of depts) {
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      const c = px(d.u + su * d.w, d.v + sv * d.d);
      xs.push(c.x);
      ys.push(c.y, c.y - d.lift - d.vertical.h);
    }
  }
  const [x0, x1] = [Math.min(...xs) - pad, Math.max(...xs) + pad];
  const [y0, y1] = [Math.min(...ys) - pad, Math.max(...ys) + pad];
  return { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
}

/** Walkway endpoints: from the hub's edge to each island's near corner. */
export function walkway(dept: Dept) {
  const len = Math.hypot(dept.u, dept.v);
  const inner = (HUB.size + 0.4) / len;
  // How far the island reaches along the line back to the hub.
  const ext =
    Math.abs(dept.u / len) * dept.w + Math.abs(dept.v / len) * dept.d;
  const outer = (len - ext - 0.4) / len;
  const a = px(dept.u * inner, dept.v * inner);
  const b = px(dept.u * outer, dept.v * outer);
  return `M ${a.x} ${a.y - 4} L ${b.x} ${b.y - 4}`;
}

/**
 * A placement resolved onto the island, clamped inside its footprint.
 *
 * The old deskSpots() put the last row at 0.82 of the half-extent and Desk then
 * drew its sitter 0.72 units further toward the camera, which on Bookings put
 * both desks of the last row at 3.098 against a 2.9 bound, hanging over the
 * ground. Everything drawn on an island goes
 * through here, so that cannot happen again.
 */
export function place(dept: Dept, p: Placement) {
  const mu = Math.max(0, dept.w - 0.8);
  const mv = Math.max(0, dept.d - 0.8);
  return {
    u: dept.u + Math.max(-mu, Math.min(mu, p.du)),
    v: dept.v + Math.max(-mv, Math.min(mv, p.dv)),
  };
}

/**
 * How far the camera pushes in on a department.
 *
 * The old constant 1.45 was tuned against uniform 2.4 islands; a 3.2-wide
 * Bookings overflows at that scale, so the zoom comes from the footprint.
 */
export function zoomFor(dept: Dept) {
  return Math.min(1.55, (VIEW.w * 0.52) / ((dept.w + dept.d) * 2 * KX));
}

export function zoomTransform(dept: Dept) {
  const z = zoomFor(dept);
  const c = px(dept.u, dept.v);
  const tx = VIEW.x + VIEW.w / 2 - z * c.x;
  const ty = VIEW.y + VIEW.h / 2 - z * (c.y - 24);
  return `translate(${tx} ${ty}) scale(${z})`;
}
