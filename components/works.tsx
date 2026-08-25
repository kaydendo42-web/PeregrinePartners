"use client";

import { motion } from "motion/react";
import { Marquee, Reveal } from "./ui/motion-primitives";
import { Starburst } from "./ui/starburst";
import { ClientMark } from "./ui/client-mark";
import { works } from "@/lib/content";

export function Works() {
  return (
    <section id="works" className="relative w-full bg-[color:var(--dark)]">
      <div
        className="w-full bg-[color:var(--page)] pb-[180px]"
        style={{ borderRadius: "0 0 20px 20px" }}
      >
        {/* display marquee */}
        <div className="pt-[180px]">
          <Marquee duration={30}>
            <div className="flex shrink-0 items-center gap-[60px] pr-[60px]">
              <h2
                className="t-marquee whitespace-nowrap"
                style={{ letterSpacing: "-0.04em" }}
              >
                {works.title}
              </h2>
              <Starburst />
            </div>
          </Marquee>
        </div>

        {/* case grid */}
        <div className="mx-auto mt-[46px] grid w-full max-w-[1440px] grid-cols-1 gap-x-[52px] gap-y-[42px] px-[24px] md:grid-cols-2 md:px-[56px] xl:grid-cols-3">
          {works.cases.map((c, i) => (
            <Reveal key={c.brand} delay={(i % 3) * 0.06}>
              <CaseCard {...c} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseCard({
  tag,
  brand,
  funds,
  growth,
  roi,
  partners,
}: {
  tag: string;
  brand: string;
  funds: string;
  growth: string;
  roi: string;
  partners: string;
}) {
  const stats = [
    { v: funds, l: "Funds raised" },
    { v: growth, l: "Social growth" },
    { v: roi, l: "ATH ROI" },
    { v: partners, l: "Partnerships" },
  ];

  return (
    <motion.article
      className="group flex w-full flex-col overflow-hidden"
      style={{ background: "var(--ink-03)", borderRadius: 20, padding: 1, gap: 1 }}
      whileHover="hover"
    >
      {/* media */}
      <div
        className="relative flex h-[302px] w-full items-start overflow-hidden p-[10px]"
        style={{ background: "#fff", borderRadius: "19px 19px 10px 10px" }}
      >
        <motion.div
          className="absolute inset-0"
          variants={{ hover: { scale: 1.06 } }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <CaseArt seed={brand.length} />
        </motion.div>

        <span
          className="relative z-10 flex items-center bg-white"
          style={{ borderRadius: 100, padding: "8px 16px 7px" }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 10, lineHeight: "16px", letterSpacing: 0 }}
          >
            {tag}
          </span>
        </span>

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <ClientMark name={brand} />
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2" style={{ gap: 1 }}>
        {stats.map((s) => (
          <div
            key={s.l}
            className="flex flex-col justify-center"
            style={{ background: "#fff", borderRadius: 10, padding: "14px 11px 15px 15px", gap: 4, minHeight: 72 }}
          >
            <p
              className="font-mono"
              style={{ fontSize: 16, lineHeight: "22.4px", fontWeight: 500, color: "var(--ink-70)" }}
            >
              {s.v}
            </p>
            <p style={{ fontSize: 12, lineHeight: "16.8px", fontWeight: 300, letterSpacing: "0.01em", color: "var(--ink-70)" }}>
              {s.l}
            </p>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

/** Abstract cover art so every case card carries its own visual. */
function CaseArt({ seed }: { seed: number }) {
  const hue = 40 + ((seed * 13) % 30);
  return (
    <svg viewBox="0 0 440 330" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`g${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 6% 93%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 5% 78%)`} />
        </linearGradient>
      </defs>
      <rect width="440" height="330" fill={`url(#g${seed})`} />
      <g stroke={`hsl(${hue} 8% 58%)`} strokeWidth="0.6" opacity="0.4" fill="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <ellipse key={i} cx="220" cy="165" rx={40 + i * 22} ry={26 + i * 13} />
        ))}
      </g>
      <circle cx="220" cy="165" r="70" fill="#fff" opacity="0.75" />
    </svg>
  );
}
