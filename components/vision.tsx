"use client";

import { Reveal, ScrollHighlightText } from "./ui/motion-primitives";
import { vision } from "@/lib/content";

export function Vision() {
  return (
    <section
      id="vision"
      className="w-full bg-[color:var(--dark)] px-[24px] py-[140px] md:px-[40px] md:pb-[160px] md:pt-[250px]"
    >
      <div className="flex w-full flex-col gap-[60px] lg:flex-row lg:gap-[360px]">
        {/* portrait */}
        <Reveal className="shrink-0">
          <figure className="w-[320px]">
            <div className="relative h-[320px] w-[320px] overflow-hidden" style={{ borderRadius: 12 }}>
              <img
                src={vision.person.photo}
                alt={vision.person.name}
                className="h-full w-full object-cover"
              />
              {/* inset frame the corner marks sit on */}
              <span
                className="pointer-events-none absolute"
                style={{
                  inset: 23,
                  border: "1px solid rgba(255,255,255,0.28)",
                  borderRadius: 4,
                }}
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
              <p className="t-mono text-white">{vision.person.name}</p>
              <p
                className="mt-[6px]"
                style={{ fontSize: 12, lineHeight: "16.8px", fontWeight: 300, letterSpacing: "0.12px", color: "var(--paper-70)" }}
              >
                {vision.person.role}
              </p>
            </figcaption>
          </figure>
        </Reveal>

        {/* statement */}
        <div className="w-full max-w-[640px]">
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
            className="t-statement mt-[46px] max-w-[545px] text-white"
            dim="rgba(255,255,255,0.16)"
            lit="#ffffff"
          />

          <Reveal delay={0.08}>
            <p className="t-body mt-[44px] max-w-[500px] text-white">{vision.body}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

