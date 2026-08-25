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
              <h2 className="t-marquee whitespace-nowrap" style={{ letterSpacing: "-0.04em" }}>
                {works.title}
              </h2>
              <Starburst />
            </div>
          </Marquee>
        </div>

        {/* case grid */}
        <div className="mx-auto mt-[46px] grid w-full max-w-[1440px] grid-cols-1 gap-x-[52px] gap-y-[42px] px-[24px] md:grid-cols-2 md:px-[56px] xl:grid-cols-3">
          {works.cases.map((c, i) => (
            <Reveal key={c.tag + i} delay={(i % 3) * 0.06}>
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
  cover,
  logo,
  funds,
  growth,
  roi,
  partners,
}: {
  tag: string;
  cover: string;
  logo: string | null;
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
        <motion.img
          src={cover}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          variants={{ hover: { scale: 1.06 } }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        <span
          className="relative z-10 flex items-center bg-white"
          style={{ borderRadius: 100, padding: "8px 16px 7px" }}
        >
          <span className="font-mono uppercase" style={{ fontSize: 10, lineHeight: "16px" }}>
            {tag}
          </span>
        </span>

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt="" aria-hidden className="h-[57px] w-[189px] object-contain" />
          ) : (
            <span className="h-[57px] w-[189px]" />
          )}
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
