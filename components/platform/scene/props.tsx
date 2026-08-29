import type { PropKind } from "./data";
import { px, topFace, sideFaces, HUB } from "./geometry";

/** One iso box: the two visible sides, then the top over them. `lit` puts the
    department's hue on the top face, which is the only place a prop takes it. */
function Box({ u, v, a, b, h, lift = 0, lit, cls = "" }: {
  u: number; v: number; a: number; b: number; h: number;
  lift?: number; lit?: boolean; cls?: string;
}) {
  const s = sideFaces(u, v, a, b, lift + h);
  return (
    <g className={`floor__box ${cls}`} data-lit={lit || undefined}>
      <path className="floor__box-side" d={s.right} />
      <path className="floor__box-side floor__box-side--l" d={s.left} />
      <path className="floor__box-top" d={topFace(u, v, a, b, lift + h)} />
    </g>
  );
}

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

/** 001 · a crate, stacked or single, with a lid seam. */
function Crate({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__crate">
      <Box u={u} v={v} a={0.42} b={0.42} h={11} lit={lit} />
      <line className="floor__crate-seam" x1={c.x - 8} y1={c.y - 11} x2={c.x + 8} y2={c.y - 11} />
    </g>
  );
}

/** 001 · the loading edge: a low ramp off the plinth. */
function Pallet({ u, v }: { u: number; v: number }) {
  return <Box u={u} v={v} a={0.7} b={0.5} h={3} cls="floor__pallet" />;
}

/** 002 · a run of ledger rows, two of them pushed out of line. */
function Ledger({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__ledger">
      <Box u={u} v={v} a={0.5} b={0.62} h={9} />
      {Array.from({ length: 7 }, (_, k) => (
        <line
          key={k}
          className="floor__ledger-row"
          data-off={k === 2 || k === 5 || undefined}
          x1={c.x - 7 + (k === 2 || k === 5 ? 3 : 0)}
          y1={c.y - 9 - k * 1.5}
          x2={c.x + 7}
          y2={c.y - 9 - k * 1.5}
        />
      ))}
    </g>
  );
}

/** 002 · the safe: one heavy cube with a dial. */
function Safe({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__safe">
      <Box u={u} v={v} a={0.46} b={0.46} h={14} lit={lit} />
      <circle className="floor__safe-dial" cx={c.x + 5} cy={c.y - 7} r={2.4} />
    </g>
  );
}

/** 004 · the counter someone stands behind. */
function Counter({ u, v }: { u: number; v: number }) {
  return <Box u={u} v={v} a={1.1} b={0.32} h={10} cls="floor__counter" />;
}

/** 004 · the pigeonhole wall behind it. */
function Pigeonhole({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__holes">
      <Box u={u} v={v} a={0.9} b={0.16} h={20} />
      {Array.from({ length: 8 }, (_, k) => (
        <rect
          key={k}
          className="floor__hole"
          x={c.x - 12 + (k % 4) * 6.4}
          y={c.y - 19 + Math.floor(k / 4) * 6}
          width={4.6}
          height={4.4}
          rx={0.6}
        />
      ))}
    </g>
  );
}

/** 004 · the printer, with one sheet in the tray. */
function Printer({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__printer">
      <Box u={u} v={v} a={0.4} b={0.34} h={7} />
      <rect className="floor__printer-sheet" x={c.x - 3} y={c.y - 10} width={6} height={4} rx={0.6} />
    </g>
  );
}

/** 003 · the easel the work goes up on. */
function Easel({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__easel">
      <line className="floor__easel-leg" x1={c.x - 5} y1={c.y} x2={c.x - 3} y2={c.y - 22} />
      <line className="floor__easel-leg" x1={c.x + 5} y1={c.y} x2={c.x + 3} y2={c.y - 22} />
      <rect className="floor__easel-face" data-lit={lit || undefined}
            x={c.x - 9} y={c.y - 34} width={18} height={14} rx={1} />
    </g>
  );
}

/** 003 · one of the three queued panels, leaning. */
function Panel({ u, v, i }: { u: number; v: number; i: number }) {
  const c = px(u, v);
  return (
    <rect className="floor__panelboard" x={c.x - 6} y={c.y - 15} width={12} height={15} rx={1}
          transform={`rotate(${-6 + i * 5} ${c.x} ${c.y})`} />
  );
}

/** 003 · the light on its stand. */
function LightStand({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__light">
      <line className="floor__light-post" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 26} />
      <circle className="floor__light-head" cx={c.x} cy={c.y - 29} r={4} />
    </g>
  );
}

/** 007 · the shift wall: a grid of pegged blocks, one column short. */
function PegWall({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__peg">
      <Box u={u} v={v} a={1.0} b={0.16} h={22} />
      {Array.from({ length: 14 }, (_, k) => {
        const col = k % 5;
        const row = Math.floor(k / 5);
        if (col === 4 && row === 2) return null;
        return (
          <rect key={k} className="floor__peg-block" data-lit={lit && k === 7 ? "" : undefined}
                x={c.x - 13 + col * 5.4} y={c.y - 20 + row * 5.2}
                width={4} height={3.8} rx={0.6} />
        );
      })}
    </g>
  );
}

/** 007 · the clock the roster is drafted against. */
function ClockPost({ u, v }: { u: number; v: number }) {
  const c = px(u, v);
  return (
    <g className="floor__clockpost">
      <line className="floor__light-post" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 24} />
      <circle className="floor__clock-face" cx={c.x} cy={c.y - 28} r={5} />
      <line className="floor__clock-hand" x1={c.x} y1={c.y - 28} x2={c.x} y2={c.y - 31.5} />
      <line className="floor__clock-hand" x1={c.x} y1={c.y - 28} x2={c.x + 2.6} y2={c.y - 28} />
    </g>
  );
}

/** 006 · a round top in the room. `lit` is the one being held. */
function Top({ u, v, lit }: { u: number; v: number; lit?: boolean }) {
  const c = px(u, v);
  return (
    <g className="floor__top" data-lit={lit || undefined}>
      <line className="floor__top-stem" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 8} />
      <ellipse className="floor__top-face" cx={c.x} cy={c.y - 9} rx={9} ry={5} />
      {lit ? <ellipse className="floor__top-ring" cx={c.x} cy={c.y - 9} rx={13} ry={7.4} /> : null}
    </g>
  );
}

/** 006 · the host stand at the door. */
function HostStand({ u, v }: { u: number; v: number }) {
  return <Box u={u} v={v} a={0.34} b={0.28} h={13} cls="floor__host" />;
}

export function Prop({ kind, u, v, label, own, lit, i }: {
  kind: PropKind; u: number; v: number;
  label?: string; own?: boolean; lit?: boolean; i: number;
}): React.ReactElement | null {
  switch (kind) {
    case "desk":       return <Desk u={u} v={v} own={own} label={label ?? ""} i={i} />;
    case "plant":      return <Plant u={u} v={v} />;
    case "crate":      return <Crate u={u} v={v} lit={lit} />;
    case "pallet":     return <Pallet u={u} v={v} />;
    case "ledger":     return <Ledger u={u} v={v} />;
    case "safe":       return <Safe u={u} v={v} lit={lit} />;
    case "counter":    return <Counter u={u} v={v} />;
    case "pigeonhole": return <Pigeonhole u={u} v={v} />;
    case "printer":    return <Printer u={u} v={v} />;
    case "easel":      return <Easel u={u} v={v} lit={lit} />;
    case "panel":      return <Panel u={u} v={v} i={i} />;
    case "lightstand": return <LightStand u={u} v={v} />;
    case "pegwall":    return <PegWall u={u} v={v} lit={lit} />;
    case "clockpost":  return <ClockPost u={u} v={v} />;
    case "hoststand":  return <HostStand u={u} v={v} />;
    case "top":        return <Top u={u} v={v} lit={lit} />;
  }
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
