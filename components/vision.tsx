"use client";

import { Reveal, ScrollHighlightText } from "./ui/motion-primitives";
import { vision } from "@/lib/content";

export function Vision() {
  return (
    <section
      id="vision"
      className="w-full bg-[color:var(--dark)] px-[24px] py-[180px] md:px-[60px]"
    >
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-[60px] lg:flex-row lg:gap-[320px]">
        {/* portrait */}
        <Reveal className="shrink-0">
          <figure className="w-[320px]">
            <div className="relative h-[320px] w-[320px] overflow-hidden" style={{ borderRadius: 12 }}>
              <PortraitArt />
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
            <figcaption className="mt-[38px]">
              <p className="t-mono text-white">{vision.person.name}</p>
              <p
                className="mt-[6px]"
                style={{ fontSize: 12, lineHeight: "16.8px", fontWeight: 300, color: "var(--paper-70)" }}
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
            className="t-statement mt-[46px] text-white"
            dim="rgba(255,255,255,0.16)"
            lit="#ffffff"
          />

          <Reveal delay={0.08}>
            <p className="t-body mt-[62px] max-w-[500px] text-white">{vision.body}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Warm abstract portrait plate — a stand-in, not a photograph. */
function PortraitArt() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="pt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c98a4b" />
          <stop offset="45%" stopColor="#7a5a34" />
          <stop offset="100%" stopColor="#20241a" />
        </linearGradient>
        <radialGradient id="ptGlow" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffd9a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="320" fill="url(#pt)" />
      <rect width="320" height="320" fill="url(#ptGlow)" />
      <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1">
        <circle cx="160" cy="132" r="52" />
        <path d="M64 300c14-58 48-88 96-88s82 30 96 88" />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M0 ${200 + i * 18} H320`} opacity={0.25} />
        ))}
      </g>
    </svg>
  );
}
