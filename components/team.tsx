"use client";

import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Reveal, RevealWords } from "./ui/motion-primitives";
import { team } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Team() {
  return (
    /* Sits inside the dark run's padded column, so it carries no gutter of
       its own — only the 90px lead-in the reference gives the headline. */
    <section id="team" className="w-full pt-[90px]">
      {/* headline */}
      <Reveal>
        <h2
          className="t-team max-w-[1200px] text-white"
          style={{
            fontSize: "clamp(44px, 6.94vw, 100px)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontWeight: 500,
          }}
        >
          <RevealWords text={team.heading} />
        </h2>
      </Reveal>

      {/* supporting column, aligned to the right half like the reference */}
      <div className="mt-[50px] lg:pl-[680px]">
        <Reveal delay={0.06}>
          <p className="t-body max-w-[380px] text-white">{team.body}</p>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="mt-[40px]">
            <Button href={team.cta.href} variant="secondary" gap={30} minWidth={202}>
              {team.cta.label}
            </Button>
          </div>
        </Reveal>
      </div>

      {/* roster */}
      <div className="mt-[50px] flex gap-[14px] overflow-x-auto pb-[4px] no-scrollbar xl:overflow-visible">
        {team.members.map((m, i) => (
          <Reveal key={m.name} delay={i * 0.07}>
            <MemberCard {...m} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function MemberCard({
  name,
  role,
  photo,
  quote,
}: {
  name: string;
  role: string;
  photo: string;
  quote: string;
}) {
  return (
    <motion.div
      className="relative w-[330px] shrink-0"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* portrait */}
      <div
        className="relative h-[402px] w-[330px] overflow-hidden"
        style={{ borderRadius: "0px 20px 20px 20px" }}
      >
        <img src={photo} alt={name} className="h-full w-full object-cover" />
        <span
          className="pointer-events-none absolute rounded-full"
          style={{ top: 20, right: 24, width: 28, height: 16, border: "2px solid rgba(255,255,255,0.9)" }}
        />
      </div>

      {/* name plate */}
      <div className="mt-[20px] flex items-start gap-[10px] pl-[10px]">
        <span
          className="mt-[1px] block h-[42px] w-[3px] shrink-0"
          style={{ background: "var(--paper-10)", borderRadius: 10 }}
        />
        <div>
          <h5
            className="uppercase text-white"
            style={{ fontFamily: "var(--font-plex), monospace", fontSize: 13, lineHeight: "20.8px", fontWeight: 500 }}
          >
            {name}
          </h5>
          <p
            style={{ fontSize: 12, lineHeight: "16.8px", fontWeight: 300, letterSpacing: "0.12px", color: "var(--paper-50)" }}
          >
            {role}
          </p>
        </div>
      </div>

      {/* hover panel — slides in from the left over the portrait */}
      <motion.div
        className="pointer-events-none absolute left-0 top-0 flex h-[484px] w-[300px] flex-col justify-between overflow-hidden bg-white"
        style={{ borderRadius: "0px 20px 20px 20px", padding: "24px 24px 20px 40px" }}
        variants={{ rest: { x: -420, opacity: 0 }, hover: { x: 0, opacity: 1 } }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <img
          src={team.panelTexture}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-[0.06]"
        />

        <div className="relative flex items-center gap-[4px]">
          {(["x", "git"] as const).map((k) => (
            <span
              key={k}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-white"
              style={{ background: "var(--ink)" }}
            >
              {k === "x" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
                  <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </span>
          ))}
        </div>

        <p
          className="relative w-[236px]"
          style={{ fontSize: 18, lineHeight: "25.2px", fontWeight: 400, color: "var(--ink)" }}
        >
          {quote}
        </p>

        <div className="relative flex items-start gap-[10px]">
          <span
            className="mt-[1px] block h-[41px] w-[3px] shrink-0"
            style={{ background: "rgba(0,0,0,0.1)", borderRadius: 10 }}
          />
          <div>
            <p
              className="uppercase"
              style={{ fontFamily: "var(--font-plex), monospace", fontSize: 13, lineHeight: "20.8px", fontWeight: 500, color: "rgba(0,0,0,0.81)" }}
            >
              {name}
            </p>
            <p
              style={{ fontFamily: "var(--font-plex), monospace", fontSize: 11, lineHeight: "16.5px", fontWeight: 400, letterSpacing: "-0.33px", color: "rgba(0,0,0,0.7)" }}
            >
              {role}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
