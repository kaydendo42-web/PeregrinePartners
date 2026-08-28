"use client";

import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Reveal, RevealWords } from "./ui/motion-primitives";
import { team } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The three of us.
 *
 * Two changes from the template that matter more than they look.
 *
 * The row is a three-column grid rather than a scrolling strip of four fixed
 * cards. Four 330px cards were sized to fill a 1360 box; three of them leave a
 * third of the row empty, which reads as a team with a vacancy rather than a
 * company that is deliberately three people.
 *
 * And the hover panel carries what each of them does rather than a quotation.
 * The template's version put a paragraph of invented opinion in each person's
 * mouth. These are real people with real names on a real page — the only text
 * that has any business next to their faces is text they would recognise.
 */
export function Team() {
  return (
    /* Sits inside the dark run's padded column, so it carries no gutter of
       its own — only the 90px lead-in the reference gives the headline. */
    <section id="team" className="w-full pt-[90px]">
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

      <div className="mt-[50px] lg:pl-[680px]">
        <Reveal delay={0.06}>
          <p className="t-body max-w-[420px] text-white">{team.body}</p>
        </Reveal>
      </div>

      <div className="mt-[50px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
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
  school,
  does,
}: {
  name: string;
  role: string;
  photo: string;
  school: string;
  does: string;
}) {
  return (
    <motion.div className="relative w-full" initial="rest" whileHover="hover" animate="rest">
      {/* portrait */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "330 / 402", borderRadius: "0px 20px 20px 20px" }}
      >
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover object-top"
        />
        <span
          className="pointer-events-none absolute rounded-full"
          style={{ top: 20, right: 24, width: 28, height: 16, border: "2px solid rgba(255,255,255,0.9)" }}
        />

        {/* what they do, over the portrait */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex flex-col justify-between overflow-hidden bg-white"
          style={{ borderRadius: "0px 20px 20px 20px", padding: "28px 28px 24px 32px" }}
          variants={{ rest: { x: "-102%", opacity: 0 }, hover: { x: 0, opacity: 1 } }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <img
            src={team.panelTexture}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-[0.06]"
          />

          <span
            className="relative font-mono uppercase"
            style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-40)" }}
          >
            {role}
          </span>

          <p
            className="relative max-w-[280px]"
            style={{ fontSize: 19, lineHeight: "26px", fontWeight: 400, color: "var(--ink)" }}
          >
            {does}
          </p>

          <div className="relative flex items-start gap-[10px]">
            <span
              className="mt-[1px] block h-[41px] w-[3px] shrink-0"
              style={{ background: "rgba(0,0,0,0.1)", borderRadius: 10 }}
            />
            <div>
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-plex), monospace",
                  fontSize: 13,
                  lineHeight: "20.8px",
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.81)",
                }}
              >
                {name}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-plex), monospace",
                  fontSize: 11,
                  lineHeight: "16.5px",
                  fontWeight: 400,
                  letterSpacing: "-0.33px",
                  color: "rgba(0,0,0,0.7)",
                }}
              >
                {school}
              </p>
            </div>
          </div>
        </motion.div>
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
            style={{
              fontFamily: "var(--font-plex), monospace",
              fontSize: 13,
              lineHeight: "20.8px",
              fontWeight: 500,
            }}
          >
            {name}
          </h5>
          <p
            style={{
              fontSize: 12,
              lineHeight: "16.8px",
              fontWeight: 300,
              letterSpacing: "0.12px",
              color: "var(--paper-50)",
            }}
          >
            {role} · {school}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
