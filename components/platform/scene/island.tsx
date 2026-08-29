import type { Dept } from "./data";
import { px, topFace, sideFaces, deskSpots, ISLE_LIFT } from "./geometry";
import { Desk, Plant } from "./props";

export function Island({ dept, waiting, selected }: { dept: Dept; waiting: number; selected: boolean }) {
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
