"use client";

import { Reveal, ScrollHighlightText } from "./ui/motion-primitives";
import { FloorVignette } from "./art/floor-vignette";
import { vision } from "@/lib/content";

/**
 * Why, in one breath, next to the thing itself.
 *
 * The template put a founder's portrait in the plate on the left, and this
 * block held a street after it. Both were pictures of the company. What sits
 * here now is a picture of the product: the floor before open, with the work
 * that ran overnight drained back into the architecture and one block standing
 * proud of it. The copy claims the design stops and asks. The model shows it.
 *
 * It is also the first place on the site a reader meets the Floor's world, two
 * sections before `/platform` opens on it. The plate is the seam: the site's
 * radius on the outside, the Floor's language and none of its type on the
 * inside. See `handoff/art-direction.md`, and the header of the vignette.
 */
export function Vision() {
  return (
    <section
      id="vision"
      className="w-full bg-[color:var(--dark)] px-[24px] py-[140px] md:px-[40px] md:pb-[160px] md:pt-[250px]"
    >
      <div className="flex w-full flex-col gap-[64px] lg:flex-row lg:items-center lg:justify-between lg:gap-[80px]">
        {/* statement */}
        <div className="w-full max-w-[560px]">
          <div className="flex items-center gap-[20px]">
            <span className="t-mono shrink-0 text-white">{vision.label}</span>
            <span className="h-[1px] w-full max-w-[240px]" style={{ background: "var(--paper-10)" }} />
            <span
              className="block shrink-0 rounded-full"
              style={{ width: 36, height: 18, border: "2px solid #fff" }}
            />
          </div>

          <ScrollHighlightText
            text={vision.text}
            className="t-statement mt-[46px] text-white"
            dim="rgba(255,255,255,0.16)"
            lit="#ffffff"
          />

          <Reveal delay={0.08}>
            <p className="t-body mt-[44px] max-w-[500px] text-white">{vision.body}</p>
          </Reveal>
        </div>

        {/* the case */}
        <Reveal delay={0.12} className="w-full lg:max-w-[540px]">
          <figure>
            <div className="overflow-hidden" style={{ borderRadius: "var(--r-card)" }}>
              <FloorVignette className="block h-auto w-full" />
            </div>
            <figcaption className="t-mono mt-[18px]" style={{ color: "var(--paper-50)" }}>
              {vision.caseCaption}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
