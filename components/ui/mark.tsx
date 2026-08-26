/**
 * House mark.
 *
 * Read off the reference's own SVG symbol rather than guessed: a 10x5 pixel
 * grid, 3px pitch, holding the same chevron drawn five times two columns
 * apart. Only one is inked at a time and the ink walks left to right, so the
 * mark reads as a chevron marching toward the label. Two fixed accents sit in
 * the far corners. The march is CSS so reduced motion can park it.
 */

/** One chevron, as cell offsets from its left column. */
const CHEVRON: Array<[number, number]> = [
  [0, 0], [1, 0],
  [1, 1], [2, 1],
  [2, 2], [3, 2],
  [1, 3], [2, 3],
  [0, 4], [1, 4],
];

/** Where each copy starts. The outer two run off the grid and get clipped. */
const STARTS = [-1, 1, 3, 5, 7];
const REST = 3; // the copy reduced motion leaves lit

const CORNERS: Array<[number, number]> = [
  [9, 0],
  [9, 4],
];

const cell = (col: number, row: number) => (
  <rect key={`${col}-${row}`} x={col * 3 + 0.15} y={row * 3 + 0.15} width="2.7" height="2.7" />
);

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
        {STARTS.map((start, i) => (
          <g
            key={start}
            className="mark-chevron"
            data-rest={start === REST ? "" : undefined}
            style={{ animationDelay: `${i * 0.48}s` }}
          >
            {CHEVRON.map(([dx, dy]) => {
              const col = start + dx;
              return col < 0 || col > 9 ? null : cell(col, dy);
            })}
          </g>
        ))}
        {CORNERS.map(([col, row]) => cell(col, row))}
      </g>
    </svg>
  );
}

/**
 * Capsule logo lockup used in the nav and the footer: a 6px ring, not a
 * filled pill — 60x34 outside, 48x22 inside.
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
