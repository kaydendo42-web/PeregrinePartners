/**
 * House mark — a chevron drawn on a 10×5 pixel grid with two corner accents,
 * traced off the reference at a 3px pitch with a hairline between cells.
 */
const CELLS: Array<[number, number]> = [
  [0, 0], [9, 0],
  [0, 1], [1, 1],
  [1, 2], [2, 2],
  [0, 3], [1, 3],
  [0, 4], [9, 4],
];

export function Mark({ className = "", size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size / 2}
      viewBox="0 0 30 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g fill="currentColor">
        {CELLS.map(([c, r]) => (
          <rect key={`${c}-${r}`} x={c * 3 + 0.15} y={r * 3 + 0.15} width="2.7" height="2.7" />
        ))}
      </g>
    </svg>
  );
}

/**
 * Capsule logo lockup used in the nav and the footer: a 6px ring, not a
 * filled pill — 60×34 outside, 48×22 inside.
 */
export function LogoPill({ dark = true }: { dark?: boolean }) {
  const ring = dark ? "var(--ink)" : "#ffffff";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: 60, height: 34, background: ring }}
      aria-label="Peregrine"
    >
      <span
        className="block rounded-full"
        style={{ width: 48, height: 22, background: dark ? "#fff" : "var(--dark)" }}
      />
    </div>
  );
}
