import type { Dept } from "./data";
import { px, topFace, sideFaces } from "./geometry";
import { Plant } from "./props";

export function Island({
  dept, waiting, selected, hovered, onEnter, onLeave,
}: {
  dept: Dept;
  waiting: number;
  selected: boolean;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const { u, v, w, d, lift } = dept;
  const sides = sideFaces(u, v, w, d, lift);
  const label =
    dept.labelSide === "e"
      ? px(u + w * 1.28, v + d * 0.1)
      : px(u + w * 0.1, v + d * 1.28);
  const flag = px(u, v - d);
  return (
    <g
      className="floor__isle"
      data-dept={dept.id}
      data-own={dept.own || undefined}
      data-selected={selected || undefined}
      data-hover={hovered || undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-hidden="true"
    >
      <path className="floor__isle-top" d={topFace(u, v, w, d, lift)} />
      <path className="floor__isle-side" d={sides.right} />
      <path className="floor__isle-side floor__isle-side--l" d={sides.left} />
      {/* 0.8 is place()'s clamp margin. The old 0.55 was tuned against square
          islands and puts a pot through the rhombus near a sharp corner. These
          become clamped layout placements in the next task. */}
      <Plant u={u - w + 0.8} v={v - d + 0.8} />
      <Plant u={u + w - 0.8} v={v + d - 0.8} />
      {/* TODO(Task 5)
      {dept.layout.map((p, i) => {
        const at = place(dept, p);
        return <Prop key={i} kind={p.kind} u={at.u} v={at.v} label={p.label}
                     own={p.own} lit={p.lit} i={i} />;
      })}
      */}
      <g className="floor__isle-plate">
        <text className="floor__isle-label" x={label.x} y={label.y - lift + 26}>
          {dept.name.toUpperCase()}
          {dept.own ? " · OURS" : ""}
        </text>
        <text className="floor__isle-desks" x={label.x} y={label.y - lift + 40}>
          {dept.desks.length} desks
        </text>
        <line
          className="floor__isle-rule"
          x1={label.x} y1={label.y - lift + 31}
          x2={label.x + 78} y2={label.y - lift + 31}
        />
      </g>
      {waiting > 0 ? (
        <g className="floor__isle-flag">
          <circle cx={flag.x} cy={flag.y - lift - 12} r={8} />
          <text x={flag.x} y={flag.y - lift - 8.6}>
            {waiting}
          </text>
        </g>
      ) : null}
    </g>
  );
}
