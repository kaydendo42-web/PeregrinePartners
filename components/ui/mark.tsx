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

/**
 * The house glyph: a peregrine in a stoop.
 *
 * Chosen because `Mark()` above is already a chevron — read off the source's
 * own symbol — and a falcon at terminal velocity is a chevron. Same shape,
 * one carrying the brand and the other carrying motion, so the pair reads as
 * a family rather than two unrelated marks.
 *
 * Drawn hard-edged rather than curved to sit with the site's mono furniture:
 * wings swept into a delta, a spine, and a forked tail. Every vertex is on a
 * 0.2 grid so it stays crisp at 16px, which is the smallest it ever renders.
 */
export function Falcon({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M16 1.6 17.9 8.4 30.4 21.2 26.4 20.4 17.7 14.2 17.4 24.2 20.4 30.4 16 27.4 11.6 30.4 14.6 24.2 14.3 14.2 5.6 20.4 1.6 21.2 14.1 8.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * The lockup: the real artwork, not a typed approximation.
 *
 * `public/brand/wordmark.png` is the Peregrine Partners logo, a stacked serif
 * wordmark with a mint pentagon over the "i", navy on transparent. Setting the
 * name in Inter beside a drawn mark was a stand-in while there was no artwork;
 * there is artwork, so the artwork goes in.
 *
 * Stacked rather than horizontal means it wants height more than width, which
 * suits the nav pill: 34px of lockup inside 5px of padding is exactly the 44px
 * the reference measured. Over a dark ground it is knocked out to white rather
 * than kept as a second file to fall out of sync.
 */
export function Logo({ tone = "dark", height = 34 }: { tone?: "dark" | "light"; height?: number }) {
  const onDark = tone === "light";
  return (
    <img
      src="/brand/wordmark.png"
      alt="Peregrine Partners"
      className="w-auto shrink-0 object-contain object-left"
      style={{
        height,
        filter: onDark ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}
