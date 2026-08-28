/**
 * A window into the Floor, on the home page.
 *
 * The Vision block lost its photograph, and a stock street said nothing the
 * copy was not already saying. This says the product instead: the floor before
 * open, with the work that was handled overnight drained back into the
 * architecture and the one thing that needs a person standing proud of it.
 * That is the whole state system, argued spatially and needing no legend.
 *
 * Built to `handoff/art-direction.md`, which is a specification and not a mood
 * board. The pieces of it that bind here:
 *
 * - True isometric. `iso` below is the 35.264°/45° projection an orthographic
 *   camera at [20,20,20] gives, so edges parallel in plan stay parallel on
 *   screen (§1, acceptance check 1).
 * - No lights exist, so light is assigned: every solid gets three values of
 *   one hue, top lightest, and every object darkens on the same side (§2,
 *   checks 2 and 3). Flat fills only, no gradient touches any face.
 * - State is depth, not a colour legend. Handled work is drained and low
 *   contrast so it recedes into the background; the thing that needs you is
 *   full coral with the accent on its top face, and it is the only accent in
 *   the frame (§4, checks 4 and 6).
 * - Ornament sits under 12% lightness contrast against the surface beneath, so
 *   it resolves on a close look and never at a glance (§7).
 * - The worlds are still (§9). Nothing here moves, which also means there is
 *   nothing to suppress for `prefers-reduced-motion`.
 *
 * It is SVG rather than react-three-fiber on purpose. This is a still frame in
 * a marketing block, so it costs a few hundred polygons and no runtime. The
 * Floor itself, which rotates and is picked from, is the r3f job.
 *
 * The frame is the seam. Outside it the site's 20px radius; inside it the
 * Floor's zero. Neither language leaks across.
 */

/* ── the palette, verbatim from the spec ──────────────────────────── */
const SKY_TOP = "#BFE0D2";
const SKY_BOTTOM = "#94C4B4";
const INK = "#3A3247";

/** Top, then the screen-left face, then the screen-right face. */
type Faces = readonly [string, string, string];

const CORAL: Faces = ["#F79C88", "#EE7460", "#CE5341"];
const DRAINED: Faces = ["#D9CABA", "#CDBCAA", "#BFAB98"];
const STONE: Faces = ["#F6EFE4", "#E6DCCC", "#D2C6B4"];
/** Selected: the top face takes the accent, the sides stay coral. */
const NEEDS: Faces = ["#F2C230", "#EE7460", "#CE5341"];

const MARKER = "#2E7D7D";

/* ── projection ───────────────────────────────────────────────────── */

/**
 * World units to px, and where the world origin lands in the viewBox.
 *
 * Not eyeballed. The scene's extreme projected points are the far corner of
 * the plinth, its near corner, and the crenellated wall top; OX and OY put the
 * box those three describe in the middle of the plate with even margin. Move
 * anything tall or anything at the plinth edge and these want recomputing.
 */
const K = 30;
const OX = 270;
const OY = 135;

/**
 * The isometric projection, derived rather than eyeballed: a camera on the
 * [1,1,1] axis puts +X down-right and +Z down-left at exactly 30° from the
 * horizon, and +Y straight up.
 */
function iso(x: number, y: number, z: number): [number, number] {
  return [
    OX + (x - z) * 0.70711 * K,
    OY + ((x + z) * 0.40825 - y * 0.8165) * K,
  ];
}

type P3 = readonly [number, number, number];

function poly(...corners: P3[]) {
  return corners
    .map((c) => {
      const [sx, sy] = iso(c[0], c[1], c[2]);
      return `${sx.toFixed(2)},${sy.toFixed(2)}`;
    })
    .join(" ");
}

/* ── the kit ──────────────────────────────────────────────────────── */

type BoxProps = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  c: Faces;
};

/**
 * A rectangular prism, three visible faces.
 *
 * +X lands on the right of the object on screen and +Z on the left, so the
 * face assignment is fixed here once and every solid in the scene inherits it.
 * That is what makes the whole frame darken on one side.
 */
function Box({ x, y, z, w, h, d, c }: BoxProps) {
  const [top, left, right] = c;
  return (
    <>
      <polygon
        points={poly([x, y + h, z], [x + w, y + h, z], [x + w, y + h, z + d], [x, y + h, z + d])}
        fill={top}
      />
      <polygon
        points={poly([x, y, z + d], [x + w, y, z + d], [x + w, y + h, z + d], [x, y + h, z + d])}
        fill={left}
      />
      <polygon
        points={poly([x + w, y, z], [x + w, y, z + d], [x + w, y + h, z + d], [x + w, y + h, z])}
        fill={right}
      />
    </>
  );
}

/** A flat tile lying on the floor. Inlays, shadows and ornament all use it. */
function Tile({
  x,
  z,
  w,
  d,
  fill,
  opacity = 1,
  y = 0.004,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  fill: string;
  opacity?: number;
  y?: number;
}) {
  return (
    <polygon
      points={poly([x, y, z], [x + w, y, z], [x + w, y, z + d], [x, y, z + d])}
      fill={fill}
      opacity={opacity}
    />
  );
}

/** The global shadow direction. One offset, every object, hard edged. */
const SH_X = -0.42;
const SH_Z = 0.92;

function Shadow({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return <Tile x={x + SH_X} z={z + SH_Z} w={w} d={d} fill={INK} opacity={0.1} y={0.002} />;
}

/* ── the floor plate and its ornament ─────────────────────────────── */

const FLOOR = 7;
const RIM_IN = 0.16;
const RIM_W = 0.13;
const MOTIF = 0.4;

/**
 * The recessed rim border every reference platform carries.
 *
 * A band one step down in lightness from the floor, with the motif punched
 * back out of it in the floor's own colour. Nine percent of contrast, which is
 * inside the twelve the spec allows and invisible until you look for it.
 */
function Rim() {
  const a = RIM_IN;
  const b = RIM_IN + RIM_W;
  const far = FLOOR - RIM_IN;
  const near = FLOOR - RIM_IN - RIM_W;

  const diamonds: React.ReactElement[] = [];
  const m = MOTIF;
  const s = 0.075;
  const mid = RIM_IN + RIM_W / 2;
  for (let t = a + m / 2; t < FLOOR - a; t += m) {
    diamonds.push(
      <Tile key={`n${t}`} x={t - s} z={mid - s} w={s * 2} d={s * 2} fill={STONE[0]} y={0.006} />,
      <Tile key={`s${t}`} x={t - s} z={FLOOR - mid - s} w={s * 2} d={s * 2} fill={STONE[0]} y={0.006} />,
      <Tile key={`w${t}`} x={mid - s} z={t - s} w={s * 2} d={s * 2} fill={STONE[0]} y={0.006} />,
      <Tile key={`e${t}`} x={FLOOR - mid - s} z={t - s} w={s * 2} d={s * 2} fill={STONE[0]} y={0.006} />,
    );
  }

  return (
    <>
      <Tile x={a} z={a} w={FLOOR - 2 * a} d={RIM_W} fill={STONE[1]} y={0.005} />
      <Tile x={a} z={near} w={FLOOR - 2 * a} d={RIM_W} fill={STONE[1]} y={0.005} />
      <Tile x={a} z={b} w={RIM_W} d={near - b} fill={STONE[1]} y={0.005} />
      <Tile x={far - RIM_W} z={b} w={RIM_W} d={near - b} fill={STONE[1]} y={0.005} />
      {diamonds}
    </>
  );
}

/** Regular square notches along a wall's top edge. */
function Crenellations({ x, z, w, d, y }: { x: number; z: number; w: number; d: number; y: number }) {
  const teeth: React.ReactElement[] = [];
  const step = 0.8;
  for (let t = x + 0.18; t + 0.44 < x + w; t += step) {
    teeth.push(<Box key={t} x={t} y={y} z={z} w={0.44} h={0.16} d={d} c={DRAINED} />);
  }
  return <>{teeth}</>;
}

/** Thin vertical window slits, 1:6, cut into a wall's screen-left face. */
function Slits({ x, z, y, count, step }: { x: number; z: number; y: number; count: number; step: number }) {
  const out: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const sx = x + i * step;
    out.push(
      <polygon
        key={i}
        points={poly([sx, y, z], [sx + 0.13, y, z], [sx + 0.13, y + 0.78, z], [sx, y + 0.78, z])}
        fill={DRAINED[2]}
      />,
    );
  }
  return <>{out}</>;
}

/* ── the scene ────────────────────────────────────────────────────── */

/**
 * Drawn back to front. The order is authored rather than sorted, because the
 * scene is fixed and a sort would be a runtime cost for an answer that never
 * changes.
 */
export function FloorVignette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 540 420"
      className={className}
      role="img"
      aria-label="An isometric model of a venue floor before open. The work handled overnight has drained back into the architecture. One block stands proud of it, waiting for a decision."
    >
      <defs>
        <linearGradient id="mv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY_TOP} />
          <stop offset="1" stopColor={SKY_BOTTOM} />
        </linearGradient>
      </defs>

      {/* the case: a thin frame one shade lighter than the world inside it */}
      <rect x="0" y="0" width="540" height="420" fill={SKY_TOP} />
      <rect x="14" y="14" width="512" height="392" fill="url(#mv-sky)" />
      <rect
        x="14.5"
        y="14.5"
        width="511"
        height="391"
        fill="none"
        stroke={INK}
        strokeOpacity="0.12"
        strokeWidth="1"
      />

      {/* the plinth the whole model sits on */}
      <Box x={0} y={-0.6} z={0} w={FLOOR} h={0.6} d={FLOOR} c={STONE} />
      <Rim />

      {/* flush inlays, set into the floor rather than painted on it */}
      <Tile x={2.35} z={2.55} w={0.6} d={0.6} fill={STONE[1]} />
      <Tile x={4.55} z={5.5} w={0.28} d={0.28} fill={MARKER} opacity={0.5} />

      {/* the back arcade, drained: this is architecture, not work */}
      <Shadow x={0.45} z={0.45} w={6.1} d={0.5} />
      <Box x={0.45} y={0} z={0.45} w={6.1} h={1.5} d={0.5} c={DRAINED} />
      <Slits x={1.0} z={0.951} y={0.36} count={5} step={1.1} />
      <Crenellations x={0.45} z={0.45} w={6.1} d={0.5} y={1.5} />

      <Shadow x={0.45} z={0.95} w={0.5} d={3.65} />
      <Box x={0.45} y={0} z={0.95} w={0.5} h={1.1} d={3.65} c={DRAINED} />

      {/* stairs down off the end of that wall, each tread its own box */}
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          x={0.45}
          y={0}
          z={4.6 + i * 0.45}
          w={0.7}
          h={1.1 - i * 0.35}
          d={0.45}
          c={STONE}
        />
      ))}

      {/* handled overnight: drained, contrast compressed, receding */}
      <Shadow x={2.0} z={1.55} w={0.85} d={0.85} />
      <Box x={2.0} y={0} z={1.55} w={0.85} h={0.62} d={0.85} c={DRAINED} />

      <Shadow x={3.5} z={1.35} w={0.8} d={0.8} />
      <Box x={3.5} y={0} z={1.35} w={0.8} h={1.0} d={0.8} c={DRAINED} />

      <Shadow x={5.0} z={2.1} w={0.8} d={0.8} />
      <Box x={5.0} y={0} z={2.1} w={0.8} h={0.5} d={0.8} c={DRAINED} />

      <Shadow x={5.4} z={4.0} w={0.75} d={0.75} />
      <Box x={5.4} y={0} z={4.0} w={0.75} h={0.8} d={0.75} c={DRAINED} />

      {/* watched, not finished: full coral, full contrast, advancing */}
      <Shadow x={4.3} z={3.3} w={0.85} d={0.85} />
      <Box x={4.3} y={0} z={3.3} w={0.85} h={1.15} d={0.85} c={CORAL} />

      {/* the one that needs you. The only accent in the frame, and it stands
          on a plinth 0.08 proud so it reads as an object on the floor. */}
      <Shadow x={2.43} z={4.43} w={1.3} d={1.3} />
      <Box x={2.43} y={0} z={4.43} w={1.3} h={0.08} d={1.3} c={STONE} />
      <Box x={2.55} y={0.08} z={4.55} w={1.06} h={2.7} d={1.06} c={NEEDS} />
    </svg>
  );
}
