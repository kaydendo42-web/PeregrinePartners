import type { Booking, FloorPlan, Section, VenueTable } from "@/lib/console/data";

export type TableState = {
  table: VenueTable;
  state: "free" | "booked" | "seated";
  /** Under the table: who has it, or when it is next taken. */
  note?: string;
  /** Hover text. */
  title: string;
  /** Where clicking the table goes, if anywhere. */
  href?: string;
  booking?: Booking;
};

const CHAIR = { w: 0.3, d: 0.13, gap: 0.05 };

/**
 * The room as Jenny drew it, seen from above: sections, walls, back of house,
 * then every table with its chairs, coloured by who has it at the moment.
 * Venue metres throughout; venue y runs up the plan, SVG y runs down it.
 */
export function FloorPlanSvg({
  plan,
  sections,
  tables,
  label,
}: {
  plan: FloorPlan | null | undefined;
  sections: Section[];
  tables: TableState[];
  label: string;
}) {
  const pad = 0.4;
  let box: [number, number, number, number];
  let depth: number;
  if (plan) {
    box = [-pad, -pad, plan.width + pad * 2, plan.depth + pad * 2];
    depth = plan.depth;
  } else {
    // No room on file: frame the tables alone.
    const ts = tables.map((s) => s.table);
    const minX = Math.min(...ts.map((t) => t.x - t.w)) - 1;
    const maxX = Math.max(...ts.map((t) => t.x + t.w)) + 1;
    const minY = Math.min(...ts.map((t) => t.y - t.w)) - 1;
    const maxY = Math.max(...ts.map((t) => t.y + t.w)) + 1;
    depth = maxY;
    box = [minX, 0, maxX - minX, maxY - minY];
  }
  const sy = (y: number) => depth - y;
  const pts = (outline: [number, number][]) => outline.map(([x, y]) => `${x},${sy(y)}`).join(" ");
  const seen = new Set<string>();

  return (
    <div className="console-floorwrap">
      <svg className="console-floor" viewBox={box.join(" ")} role="img" aria-label={label}>
        {plan ? (
          <g aria-hidden="true">
            {plan.zones.map((z) => (
              <polygon key={z.id} points={pts(z.outline)} className={`console-floor__zone${z.open ? " is-open" : ""}`} />
            ))}
            {plan.trees?.map((t, i) => (
              <circle key={i} cx={t.x} cy={sy(t.y)} r={t.r} className="console-floor__tree" />
            ))}
            {plan.fixtures.map((f, i) => {
              // Rooms are named; of the counters, only one big enough to hold a name.
              const named = f.kind === "room" || f.kind === "bathroom" || (f.kind === "counter" && Math.max(f.w, f.d) >= 1.8);
              const showLabel = named && !seen.has(f.label);
              seen.add(f.label);
              return (
                <g key={i}>
                  <rect
                    x={f.x - f.w / 2}
                    y={sy(f.y) - f.d / 2}
                    width={f.w}
                    height={f.d}
                    className={`console-floor__fixture is-${f.kind}`}
                  />
                  {showLabel && f.w > 0.5 && f.d > 0.5 ? (
                    <text x={f.x} y={sy(f.y)} className="console-floor__fixlabel" textAnchor="middle" dominantBaseline="central">
                      {f.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {plan.stairs ? <Stairs s={plan.stairs} sy={sy} /> : null}
            {plan.walls.map((w, i) => (
              <line
                key={i}
                x1={w.from[0]}
                y1={sy(w.from[1])}
                x2={w.to[0]}
                y2={sy(w.to[1])}
                className={`console-floor__wall is-${w.kind}`}
              />
            ))}
            {plan.zones.map((z) => (
              <text key={z.id} x={z.label[0]} y={sy(z.label[1])} className="console-floor__zonelabel" textAnchor="middle">
                {z.name}
              </text>
            ))}
          </g>
        ) : (
          sections.map((s) => {
            const own = tables.filter((t) => t.table.section_id === s.id).map((t) => t.table);
            if (!own.length) return null;
            const cx = own.reduce((n, t) => n + t.x, 0) / own.length;
            const top = Math.max(...own.map((t) => t.y)) + 0.9;
            return (
              <text key={s.id} x={cx} y={sy(top)} className="console-floor__zonelabel" textAnchor="middle">
                {s.name}
              </text>
            );
          })
        )}

        {tables.map((s) => (
          <Table key={s.table.id} s={s} sy={sy} />
        ))}
      </svg>
    </div>
  );
}

function Stairs({ s, sy }: { s: NonNullable<FloorPlan["stairs"]>; sy: (y: number) => number }) {
  const step = (s.x1 - s.x0) / s.treads;
  return (
    <g className="console-floor__stairs">
      <rect x={s.x0} y={sy(s.y1)} width={s.x1 - s.x0} height={s.y1 - s.y0} />
      {Array.from({ length: s.treads - 1 }, (_, i) => (
        <line key={i} x1={s.x0 + step * (i + 1)} y1={sy(s.y1)} x2={s.x0 + step * (i + 1)} y2={sy(s.y0)} />
      ))}
    </g>
  );
}

function Table({ s, sy }: { s: TableState; sy: (y: number) => number }) {
  const t = s.table;
  const turned = t.rot % 180 === 90;
  const W = t.shape === "rect" && turned ? t.d : t.w;
  const D = t.shape === "rect" ? (turned ? t.w : t.d) : t.w;
  const cx = t.x;
  const cy = sy(t.y);
  const reach = t.shape === "diamond" ? (W * Math.SQRT2) / 2 : D / 2;
  // Fit the name across the table; a tall, narrow table carries it upright.
  const across = t.shape === "diamond" ? W * Math.SQRT2 * 0.8 : W;
  const upright = t.shape === "rect" && D > W * 1.8 && t.label.length > 2;
  const room = (upright ? D : across) * 0.92;
  const fs = Math.max(0.2, Math.min(0.3, room / (t.label.length * 0.58)));

  const body = (
    <g className={`console-floor__t is-${s.state}`}>
      <title>{s.title}</title>
      <g transform={`translate(${cx} ${cy})${t.shape === "diamond" ? " rotate(45)" : ""}`}>
        {chairs(t.shape, W, D, t.seats).map((c, i) => (
          <rect key={i} className="console-floor__chair" x={c.x - c.w / 2} y={c.y - c.h / 2} width={c.w} height={c.h} rx={0.04} />
        ))}
        {t.shape === "round" ? (
          <circle className="console-floor__top" r={W / 2} />
        ) : (
          <rect className="console-floor__top" x={-W / 2} y={-D / 2} width={W} height={D} rx={0.03} />
        )}
      </g>
      <text
        x={cx}
        y={cy}
        className="console-floor__label"
        style={{ fontSize: fs }}
        textAnchor="middle"
        dominantBaseline="central"
        transform={upright ? `rotate(-90 ${cx} ${cy})` : undefined}
      >
        {t.label}
      </text>
      {s.note ? (
        <text x={cx} y={cy + reach + CHAIR.d + CHAIR.gap + 0.24} className="console-floor__who" textAnchor="middle">
          {s.note}
        </text>
      ) : null}
    </g>
  );
  return s.href ? <a href={s.href}>{body}</a> : body;
}

type Chair = { x: number; y: number; w: number; h: number };

/**
 * Where a table's chairs go, in its own frame: along the long sides first, then
 * the ends, the way the plan draws them. Round tables ring theirs.
 */
function chairs(shape: VenueTable["shape"], W: number, D: number, seats: number): Chair[] {
  const out = CHAIR.d / 2 + CHAIR.gap;
  if (shape === "round") {
    const r = W / 2 + out;
    return Array.from({ length: seats }, (_, i) => {
      const a = (i / seats) * Math.PI * 2 - Math.PI / 2;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, w: CHAIR.w * 0.85, h: CHAIR.w * 0.85 };
    });
  }
  const cap = (len: number) => (len >= 1.3 ? 3 : len >= 0.85 ? 2 : 1);
  // top, bottom, right, left
  const caps = [cap(W), cap(W), cap(D), cap(D)];
  const n = [0, 0, 0, 0];
  const order = [0, 1, 2, 3];
  let left = seats;
  for (const pair of [[0, 1], [2, 3]]) {
    while (left > 0 && pair.some((i) => n[i] < caps[i])) {
      for (const i of pair) {
        if (left > 0 && n[i] < caps[i]) {
          n[i]++;
          left--;
        }
      }
    }
  }
  for (let k = 0; left > 0; k++, left--) n[order[k % 2]]++;

  const list: Chair[] = [];
  const along = (count: number, len: number) =>
    Array.from({ length: count }, (_, k) => ((k + 0.5) / count - 0.5) * len * (count > 1 ? 0.9 : 1));
  along(n[0], W).forEach((x) => list.push({ x, y: -D / 2 - out, w: CHAIR.w, h: CHAIR.d }));
  along(n[1], W).forEach((x) => list.push({ x, y: D / 2 + out, w: CHAIR.w, h: CHAIR.d }));
  along(n[2], D).forEach((y) => list.push({ x: W / 2 + out, y, w: CHAIR.d, h: CHAIR.w }));
  along(n[3], D).forEach((y) => list.push({ x: -W / 2 - out, y, w: CHAIR.d, h: CHAIR.w }));
  return list;
}
