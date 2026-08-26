"use client";

import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Marquee } from "./ui/motion-primitives";
import { ClientMark } from "./ui/client-mark";
import { hero, demoClientLogos, useDemoClientLogos } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;
const PLACEHOLDER = ["Meridian", "Northlake", "Aetheris", "Portway", "Halcyon"];

export function Hero() {
  return (
    <section id="top" className="w-full bg-[color:var(--page)] p-[12px]">
      <div
        className="section-card relative flex min-h-[calc(100svh-24px)] flex-col justify-between px-[24px] pb-[40px] pt-[130px] md:min-h-[876px] md:px-[40px] md:pt-[190px]"
      >
        {/* Backdrop. The reference holds this dead still through the whole
            scroll — a parallax here is the one difference the eye catches
            first, because the horizon moves against the fixed nav. */}
        <div className="absolute inset-0">
          <img
            src={hero.bgFront}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
          />
        </div>

        {/* headline row */}
        <div className="relative flex w-full flex-1 items-start justify-between gap-8">
          <div className="max-w-[560px]">
            <h1 className="t-hero">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  style={{ color: "var(--ink-40)" }}
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: EASE, delay: 0.05 }}
                >
                  {hero.headlineDim}
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: EASE, delay: 0.16 }}
                >
                  {hero.headlineLit}
                </motion.span>
              </span>
            </h1>

            <motion.p
              className="t-body mt-[14px] max-w-[390px]"
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
            >
              {hero.sub}
            </motion.p>

            <motion.div
              className="mt-[26px]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
            >
              <Button href={hero.cta.href}>{hero.cta.label}</Button>
            </motion.div>
          </div>

          {/* product card */}
          <motion.a
            href="#neural"
            className="group hidden w-[320px] shrink-0 flex-col overflow-hidden lg:flex"
            style={{ background: "var(--ink)", borderRadius: 24, padding: 6 }}
            initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: EASE, delay: 0.3 }}
          >
            <div className="h-[220px] w-full overflow-hidden bg-white" style={{ borderRadius: 20 }}>
              <video
                className="h-full w-full object-cover"
                src={hero.card.video}
                poster={hero.card.poster}
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            <div
              className="mt-[6px] flex items-center justify-between px-[14px] py-[14px]"
              style={{ background: "#fff", borderRadius: 20 }}
            >
              <div className="w-[280px]">
                <p style={{ color: "var(--ink)", fontSize: 15, lineHeight: "21px" }}>{hero.card.title}</p>
                <p
                  style={{ color: "var(--ink-70)", fontSize: 12, lineHeight: "16.8px", fontWeight: 300, letterSpacing: "0.01em" }}
                >
                  {hero.card.meta}
                </p>
              </div>
              <span className="flex h-[26px] w-[26px] items-center justify-center text-[color:var(--ink)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[4px]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h13M12 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </motion.a>
        </div>

        {/* trust strip */}
        <div className="relative">
          <motion.p
            className="t-label max-w-[300px] text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}
          >
            {hero.trust}
          </motion.p>

          <div className="mt-[10px] -mx-[24px] md:-mx-[40px]">
            <Marquee duration={38}>
              {(useDemoClientLogos ? demoClientLogos : PLACEHOLDER).map((item, i) => (
                <div
                  key={`${item}-${i}`}
                  className="flex h-[57px] w-[199px] shrink-0 items-center justify-center"
                >
                  {useDemoClientLogos ? (
                    <img src={item} alt="" aria-hidden className="h-[57px] w-[189px] object-contain" />
                  ) : (
                    <ClientMark name={item} tone="light" />
                  )}
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
