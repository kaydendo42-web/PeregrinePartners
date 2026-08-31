import { px, topFace, sideFaces, HUB } from "./geometry";

/* ------------------------------------------------------------------ */
/* Furniture                                                           */
/* ------------------------------------------------------------------ */

/** The three jacket colours the little people wear, all from the neutral family. */
export const JACKETS = ["var(--ink)", "var(--fill)", "var(--muted)"];

export function Desk({
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

export function Plant({ u, v }: { u: number; v: number }) {
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

/**
 * The restaurant. Awning over the door, lit windows, a rooftop sign and two
 * pavement tables, because the thing at the centre of the floor is a venue,
 * not a server.
 */
export function Hub() {
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
