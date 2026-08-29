"use client";

import { Marquee } from "./ui/motion-primitives";
import { Starburst } from "./ui/starburst";
import { faq } from "@/lib/content";

/**
 * The display marquee that announces the FAQ.
 *
 * It takes the slot the thin announcement ticker held, so the run into the
 * FAQ has one moving band rather than two. Same treatment as the roster's,
 * down to the page white behind it and the inked starbursts: two display
 * marquees on one page that differ only in their grey is a difference the
 * reader has to explain to themselves. What separates them is direction, so
 * this one runs in reverse.
 *
 * It is a band, not a block, so it does not take `--block-gap`, and it carries
 * no card of its own. The white is what makes it read as the seam between the
 * dark run and the FAQ card rather than a section in its own right.
 *
 * No caption under the word. The reference had one; here `faq.intro` sits
 * 300px below and already says it.
 */
export function FaqMarquee() {
  return (
    <section className="w-full bg-[color:var(--page)] py-[64px] md:py-[80px]">
      <Marquee duration={34} reverse>
        <div className="flex shrink-0 items-center gap-[60px] pr-[60px]">
          <h2 className="t-marquee whitespace-nowrap" style={{ letterSpacing: "-0.04em" }}>
            {faq.marquee}
          </h2>
          <Starburst />
        </div>
      </Marquee>
    </section>
  );
}
