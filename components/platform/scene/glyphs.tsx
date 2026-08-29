/**
 * One 28px mark per department, in the same isometric line grammar as the
 * floor and the home page's branch art. Small enough that each is a single
 * object rather than a scene: the crate, the ledger, the easel, the handset,
 * the table, the shift wall.
 */
import type { GlyphKey } from "./data";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.2,
            strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const MARKS: Record<GlyphKey, React.ReactElement> = {
  // 001 · a crate, and the line that moved off it
  supply: (
    <>
      <path {...P} d="M4 13 L12 9 L20 13 L12 17 Z" />
      <path {...P} d="M4 13 v5 l8 4 v-5" />
      <path {...P} d="M20 13 v5 l-8 4" />
      <path {...P} d="M17 8 L21 4 M21 4 h-3 M21 4 v3" />
    </>
  ),
  // 002 · a run of rows, two out of line
  books: (
    <>
      <path {...P} d="M4 6 h16 M4 10 h16 M7 14 h13 M4 18 h16 M7 22 h13" />
    </>
  ),
  // 003 · the easel
  marketing: (
    <>
      <rect {...P} x="5" y="4" width="14" height="10" rx="1" />
      <path {...P} d="M8 14 L6 22 M16 14 L18 22 M12 14 v4" />
    </>
  ),
  // 004 · the handset
  reception: (
    <>
      <path {...P} d="M6 5 q6 -2 12 0 v4 q-2 1 -4 0 v-2 q-2 -0.6 -4 0 v2 q-2 1 -4 0 Z" />
      <path {...P} d="M12 11 v8 M8 21 h8" />
    </>
  ),
  // 006 · a table, held
  bookings: (
    <>
      <ellipse {...P} cx="12" cy="11" rx="8" ry="4.5" />
      <path {...P} d="M12 15.5 v5 M8 21 h8" />
      <ellipse {...P} cx="12" cy="11" rx="11" ry="6.6" strokeDasharray="2.5 2.5" />
    </>
  ),
  // 007 · the shift wall, one column short
  roster: (
    <>
      <rect {...P} x="4" y="5" width="4" height="4" />
      <rect {...P} x="10" y="5" width="4" height="4" />
      <rect {...P} x="16" y="5" width="4" height="4" />
      <rect {...P} x="4" y="11" width="4" height="4" />
      <rect {...P} x="10" y="11" width="4" height="4" />
      <rect {...P} x="4" y="17" width="4" height="4" />
      <rect {...P} x="10" y="17" width="4" height="4" />
    </>
  ),
};

export function Glyph({ kind, size = 28 }: { kind: GlyphKey; size?: number }): React.ReactElement {
  return (
    <svg className="floor__glyph" width={size} height={size} viewBox="0 0 24 26" aria-hidden="true">
      {MARKS[kind]}
    </svg>
  );
}
