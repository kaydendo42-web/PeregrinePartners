"use client";

import { Button } from "./ui/button";
import { Reveal, ScrollHighlightText } from "./ui/motion-primitives";
import { vision } from "@/lib/content";

/**
 * Why, in one breath — and then a door to the page that argues it properly.
 *
 * The template put a founder's portrait in the plate on the left. Ours holds a
 * street instead: the three of us are already on this page further down, and a
 * second portrait of one founder would say the company is one person. The
 * street says where the first four floors are, which is the more useful fact
 * and the one an owner in Melbourne actually reacts to.
 */
export function Vision() {
  return (
    <section
      id="vision"
      className="w-full bg-[color:var(--dark)] px-[24px] py-[140px] md:px-[40px] md:pb-[160px] md:pt-[250px]"
    >
      <div className="flex w-full flex-col gap-[60px] lg:flex-row lg:gap-[240px]">
        {/* the street */}
        <Reveal className="order-2 shrink-0 lg:order-1">
          <figure className="w-full max-w-[320px]">
            <div className="relative h-[320px] w-full max-w-[320px] overflow-hidden" style={{ borderRadius: 12 }}>
              <img
                src={vision.scene.photo}
                alt={vision.scene.caption}
                className="h-full w-full object-cover"
              />
              {/* inset frame the corner marks sit on */}
              <span
                className="pointer-events-none absolute"
                style={{ inset: 23, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 4 }}
              />
              {[
                { top: 23, left: 23, rot: 0 },
                { top: 23, right: 23, rot: 90 },
                { bottom: 23, right: 23, rot: 180 },
                { bottom: 23, left: 23, rot: 270 },
              ].map((pos, i) => (
                <svg
                  key={i}
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  className="absolute"
                  style={{ ...pos, transform: `rotate(${pos.rot}deg)` }}
                  aria-hidden
                >
                  <path d="M0 11V0h11" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="none" />
                </svg>
              ))}
            </div>
            <figcaption className="mt-[29px]">
              <p className="t-mono text-white">{vision.scene.caption}</p>
              <p
                className="mt-[6px]"
                style={{
                  fontSize: 12,
                  lineHeight: "16.8px",
                  fontWeight: 300,
                  letterSpacing: "0.12px",
                  color: "var(--paper-70)",
                }}
              >
                {vision.scene.sub}
              </p>
            </figcaption>
          </figure>
        </Reveal>

        {/* statement */}
        <div className="order-1 w-full max-w-[640px] lg:order-2">
          <div className="flex items-center gap-[20px]">
            <span className="t-mono shrink-0 text-white">{vision.label}</span>
            <span className="h-[1px] w-full max-w-[352px]" style={{ background: "var(--paper-10)" }} />
            <span
              className="block shrink-0 rounded-full"
              style={{ width: 36, height: 18, border: "2px solid #fff" }}
            />
          </div>

          <ScrollHighlightText
            text={vision.text}
            className="t-statement mt-[46px] max-w-[560px] text-white"
            dim="rgba(255,255,255,0.16)"
            lit="#ffffff"
          />

          <Reveal delay={0.08}>
            <p className="t-body mt-[44px] max-w-[500px] text-white">{vision.body}</p>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-[36px]">
              <Button href={vision.cta.href} variant="secondary" gap={30}>
                {vision.cta.label}
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
