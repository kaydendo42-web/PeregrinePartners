"use client";

import { Reveal, ScrollHighlightText } from "./ui/motion-primitives";
import { vision } from "@/lib/content";

/**
 * Why, at the size of the claim.
 *
 * This block used to be a column of type beside a picture of the floor, under
 * the standard eyebrow. Both came off on Kayden's call: the eyebrow because a
 * sentence this size does not need a label telling the reader it is important,
 * and the vignette because the argument is the sentence. The reader's first
 * meeting with the Floor's world is now `/platform`, which is the page built
 * to hold it, rather than a thumbnail two sections early.
 *
 * So the statement takes the hero ramp and the whole measure, and the body
 * drops to the bottom right as the aside it always was. Nothing else is in
 * here. The 250 opening is the deliberate one that starts the dark run.
 *
 * `components/art/floor-vignette.tsx` is unused as of this change. It is kept
 * because it is the only drawing of the floor outside `/platform` itself.
 */
export function Vision() {
  return (
    <section
      id="vision"
      className="band-bleed w-full bg-[color:var(--dark)] py-[140px] md:pb-[160px] md:pt-[250px]"
    >
      <div className="measure">
        <ScrollHighlightText
          text={vision.text}
          className="t-hero text-white"
          dim="rgba(255,255,255,0.16)"
          lit="#ffffff"
        />

        {/* the aside, sitting under the tail of the statement */}
        <div className="mt-[56px] flex justify-end md:mt-[72px]">
          <Reveal delay={0.08}>
            <p className="t-body-sm max-w-[440px]" style={{ color: "var(--paper-70)" }}>
              {vision.body}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
