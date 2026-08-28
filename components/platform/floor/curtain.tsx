"use client";

/**
 * The way in.
 *
 * The decision on the page was: no preamble, no loading screen, a transition.
 * White screen, the site's own "The Floor" marquee moving across it, and then a
 * hand-off into the demo. So this is the last thing the site says in its own
 * voice before the Floor's world takes the screen, and it is the seam made
 * visible rather than hidden.
 *
 * Three rules it has to obey:
 *
 * - It is never a gate. The scene mounts and loads underneath it from the
 *   first frame, so the curtain is spending time the WebGL context was going
 *   to take anyway rather than adding any.
 * - It leaves on its own and cannot be waited on. If anything below it fails,
 *   the timer still fires and the reader still gets the page.
 * - `prefers-reduced-motion` skips it entirely, which §9 requires and which
 *   also means the acceptance-check screenshots are never taken through it.
 */

import { useEffect, useState } from "react";
import { Marquee } from "@/components/ui/motion-primitives";
import { Starburst } from "@/components/ui/starburst";
import { platform } from "@/lib/content";
import { useMedia } from "./use-media";

/** Long enough to read the word once, short enough not to be a loading screen. */
const HOLD = 1150;
const FADE = 620;

export function Curtain() {
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [phase, setPhase] = useState<"up" | "going" | "gone">("up");

  useEffect(() => {
    if (reduced !== false) return;
    const a = window.setTimeout(() => setPhase("going"), HOLD);
    const b = window.setTimeout(() => setPhase("gone"), HOLD + FADE);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [reduced]);

  if (phase === "gone" || reduced === true) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        background: "var(--page)",
        opacity: phase === "going" ? 0 : 1,
        transform: phase === "going" ? "scale(1.04)" : "none",
        transition: `opacity ${FADE}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${FADE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        pointerEvents: phase === "going" ? "none" : "auto",
      }}
    >
      <Marquee duration={16}>
        <div className="flex shrink-0 items-center gap-[60px] pr-[60px]">
          <h2 className="t-marquee whitespace-nowrap">{platform.marquee}</h2>
          <Starburst />
        </div>
      </Marquee>
    </div>
  );
}
