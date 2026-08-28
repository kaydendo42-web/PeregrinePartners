import { Jost, Karla } from "next/font/google";

/**
 * The Floor's two faces, and the reason they are declared here rather than in
 * `app/layout.tsx`.
 *
 * `handoff/art-direction.md` §8 specifies Jost 300 for display and Karla 400
 * for body and data. Neither belongs anywhere else on the site: CLAUDE.md is
 * explicit that the Floor's type does not propagate out of `/platform`, and
 * the site's own Inter Display / Geist Mono pairing does not come in. Loading
 * them from the route rather than the root layout is what enforces that in the
 * build as well as in the review.
 */

export const jost = Jost({
  variable: "--mv-display",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const karla = Karla({
  variable: "--mv-body",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
