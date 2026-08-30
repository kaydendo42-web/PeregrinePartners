import { px, topFace, sideFaces } from "./geometry";
import { TABLES, OPEN, CLOSE, clock, tableState } from "./data";
import type { TableState } from "./data";
import { JACKETS, Plant } from "./props";

/** One table, its chairs, and whoever is seated at it tonight. */
export function VenueTable({
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
export function VenueScene({ now }: { now: number }) {
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
