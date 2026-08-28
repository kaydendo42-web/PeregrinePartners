/**
 * The Floor's palette and its three-value face system.
 *
 * `handoff/art-direction.md` §2 and §3 are the specification. The hex values
 * below are copied from it verbatim; everything else in this file is derived
 * from them rather than picked, so the spec stays the single source.
 *
 * This palette does not leave `/platform`. The site's own tokens live in
 * `app/globals.css` and the two languages never mix. See CLAUDE.md.
 */

/* ── §3, verbatim ─────────────────────────────────────────────────── */

/**
 * The mint of §3, kept for the case frame and nowhere else.
 *
 * **Deviation from the spec, on Kayden's call.** §3 puts the scene on a mint
 * sky. The page puts it on the site's own neutral instead, so `/platform` does
 * not open on a band of colour the rest of the site never uses. Everything the
 * mint was doing still gets done:
 *
 * - §3's real rule is that the background and the geometry never share a hue,
 *   and a neutral grey shares nothing with coral, stone or drained.
 * - §6's dissolve is unchanged and better sourced: Reference 6 fades its
 *   distant columns into white fog, which is exactly what this now is.
 * - §10's frame is still `--mv-sky-top`. It reads as a pale mint case around
 *   the room, which on white it could not do while it was also the sky.
 *
 * Do not put the gradient back without asking.
 */
export const SKY_TOP = "#BFE0D2";

/**
 * The ground the whole scene sits on, and the colour distance dissolves into.
 *
 * This is `--light` from `app/globals.css`, which is the surface the reader
 * sees behind the nav on every other page: `--page` white is only ever the
 * 12px gutter around a section card. The nav's own pill is pure white with no
 * border, so a `#ffffff` stage makes it disappear.
 */
export const GROUND = "#f0f0f0";
export const FOG = GROUND;

export const INK = "#3A3247";
export const MARKER = "#2E7D7D";
export const ACCENT = "#F2C230";
export const ACCENT_DARK = "#D9A61C";

/**
 * A solid's three assigned values, in screen order: the top face, the face the
 * camera sees on the left, and the face it sees on the right.
 *
 * There are no lights in this scene, so "light" is a naming convention rather
 * than a calculation, and the direction is global: every object in the frame
 * picks the same side to be dark (§2, acceptance check 3).
 */
export type Faces = readonly [top: string, left: string, right: string];

export const CORAL: Faces = ["#F79C88", "#EE7460", "#CE5341"];
export const DRAINED: Faces = ["#D9CABA", "#CDBCAA", "#BFAB98"];
export const STONE: Faces = ["#F6EFE4", "#E6DCCC", "#D2C6B4"];

/* ── colour maths, so derived values stay derived ─────────────────── */

type HSL = { h: number; s: number; l: number };

export function hexToHsl(hex: string): HSL {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0))
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Drop a triple's saturation without touching its hue or its lightness. */
function desaturate(faces: Faces, factor: number): Faces {
  const out = faces.map((c) => {
    const hsl = hexToHsl(c);
    return hslToHex({ ...hsl, s: hsl.s * factor });
  });
  return out as unknown as Faces;
}

/**
 * §4's middle state: "coral at 55% saturation, sitting between coral and
 * drained". Computed rather than eyedropped so it stays correct if the coral
 * above is ever retuned.
 */
export const CORAL_HALF: Faces = desaturate(CORAL, 0.55);

/**
 * §4's selected state: the top face takes the accent, the sides stay coral.
 * Only ever one object in the frame wears this (acceptance check 4).
 */
export const SELECTED: Faces = [ACCENT, CORAL[1], CORAL[2]];

/* ── the three states the whole site runs on ──────────────────────── */

/**
 * Peregrine's three states, mapped onto §4's depth trick rather than onto a
 * colour legend. Whatever still needs a person advances; whatever was handled
 * recedes into the background architecture. That is the entire system, and it
 * is the same argument `components/art/floor-vignette.tsx` makes on the home
 * page.
 *
 * The site tells these three apart by weight and never by colour (CLAUDE.md).
 * Coral to drained is a desaturation inside one warm family, so this obeys the
 * same rule in the Floor's own language.
 */
export type FloorState = "needs" | "watching" | "done";

export const STATE_FACES: Record<FloorState, Faces> = {
  needs: CORAL,
  watching: CORAL_HALF,
  done: DRAINED,
};

/**
 * How far a state sits forward. Used for the hover lift's resting height and
 * for the ornamental plinth, so the depth reading is reinforced in geometry as
 * well as in value.
 */
export const STATE_LIFT: Record<FloorState, number> = {
  needs: 0.34,
  watching: 0.14,
  done: 0,
};
