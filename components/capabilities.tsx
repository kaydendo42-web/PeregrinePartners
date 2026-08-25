"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Reveal } from "./ui/motion-primitives";
import { SectionLabel } from "./ui/section-label";
import { capabilities } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Capabilities() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="capabilities"
      className="w-full bg-[color:var(--dark)] px-[24px] pb-[160px] pt-[250px] md:px-[40px]"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-[60px] lg:flex-row lg:justify-between">
        {/* left rail */}
        <div className="flex w-full max-w-[640px] flex-col">
          <SectionLabel label={capabilities.label} tone="dark" ruleWidth={338} />

          <Reveal delay={0.05}>
            <p className="t-body mt-[52px] max-w-[500px] text-white">{capabilities.intro}</p>
          </Reveal>

          <div className="mt-[280px] max-w-[600px]">
            <Reveal delay={0.05}>
              <h2 className="t-display text-white">{capabilities.heading}</h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="mt-[40px]">
                <Button href={capabilities.cta.href} variant="secondary">
                  {capabilities.cta.label}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* accordion */}
        <Reveal delay={0.1} className="w-full lg:w-[680px]">
          <div className="hidden h-[630px] w-full gap-[10px] lg:flex">
            {capabilities.panels.map((p, i) => {
              const open = i === active;
              return (
                <motion.div
                  key={p.n}
                  onHoverStart={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="relative flex cursor-pointer flex-col items-center overflow-hidden"
                  style={{ borderRadius: 20 }}
                  animate={{
                    flexGrow: open ? 480 : 90,
                    backgroundColor: open ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.04)",
                  }}
                  transition={{ duration: 0.7, ease: EASE }}
                >
                  <PanelArt open={open} seed={i} />

                  {/* index */}
                  <span
                    className="absolute top-[24px] z-20 font-mono uppercase"
                    style={{
                      fontSize: 12,
                      lineHeight: "20.4px",
                      fontWeight: 200,
                      color: open ? "#fff" : "var(--paper-80)",
                      right: open ? 56 : "auto",
                    }}
                  >
                    {p.n}
                  </span>

                  {/* open content */}
                  <AnimatePresence mode="wait">
                    {open ? (
                      <motion.div
                        key="open"
                        className="relative z-10 w-full px-[30px] pt-[30px]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
                      >
                        <h3
                          className="max-w-[350px] text-white"
                          style={{ fontSize: 28, lineHeight: "39.2px", fontWeight: 500, letterSpacing: "-0.28px" }}
                        >
                          {p.title}
                        </h3>
                        <p
                          className="mt-[20px] max-w-[380px] text-white"
                          style={{ fontSize: 14, lineHeight: "21px", fontWeight: 300, letterSpacing: "0.02em" }}
                        >
                          {p.body}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="closed"
                        className="relative z-10 flex h-full items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        <span
                          className="font-mono uppercase"
                          style={{
                            fontSize: 13,
                            color: "var(--paper-70)",
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.title}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </Reveal>

        {/* narrow screens: the same three panels, stacked and expandable */}
        <div className="flex w-full flex-col gap-[10px] lg:hidden">
          {capabilities.panels.map((p, i) => {
            const open = i === active;
            return (
              <motion.div
                key={p.n}
                onClick={() => setActive(i)}
                className="relative w-full cursor-pointer overflow-hidden"
                style={{ borderRadius: 20 }}
                animate={{ backgroundColor: open ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)" }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <div className="relative z-10 p-[24px]">
                  <div className="flex items-start justify-between gap-[16px]">
                    <h3
                      className="max-w-[320px] text-white"
                      style={{ fontSize: 22, lineHeight: "30px", fontWeight: 500, letterSpacing: "-0.28px" }}
                    >
                      {p.title}
                    </h3>
                    <span
                      className="font-mono uppercase"
                      style={{ fontSize: 12, lineHeight: "20.4px", fontWeight: 200, color: "var(--paper-80)" }}
                    >
                      {p.n}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                      >
                        <p
                          className="pt-[16px] text-white"
                          style={{ fontSize: 14, lineHeight: "21px", fontWeight: 300, letterSpacing: "0.02em" }}
                        >
                          {p.body}
                        </p>
                        <div className="relative mt-[16px] h-[220px]">
                          <PanelArt open seed={i} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Isometric wire scaffold that sits behind each accordion panel. */
function PanelArt({ open, seed }: { open: boolean; seed: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[500px]">
      <motion.svg
        viewBox="0 0 480 500"
        className="h-full w-full"
        preserveAspectRatio="xMidYMax slice"
        animate={{ opacity: open ? 1 : 0.5 }}
        transition={{ duration: 0.6 }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`pg${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* faint isometric lattice */}
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none">
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={`a${i}`} d={`M${-120 + i * 70} 500 L${200 + i * 70} 150`} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={`b${i}`} d={`M${600 - i * 70} 500 L${280 - i * 70} 150`} />
          ))}
        </g>
        <rect width="480" height="500" fill={`url(#pg${seed})`} />

        {/* the object */}
        <motion.g
          animate={{ y: open ? 0 : 20, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <g
            transform="translate(240 300)"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.1"
            fill="none"
            strokeLinejoin="round"
          >
            <path d="M-90 0 L0 -52 L90 0 L0 52 Z" />
            <path d="M-90 0 L-90 40 L0 92 L0 52" />
            <path d="M90 0 L90 40 L0 92" />
            <path d="M-46 -26 L-46 14 M0 -52 L0 -12 M46 -26 L46 14" opacity="0.5" />
            <circle cx="0" cy="-92" r="26" />
            <path d="M0 -66 L0 -52" />
            <path d="M-26 -92 L-92 -60 M26 -92 L92 -60" opacity="0.6" />
            <circle cx="-92" cy="-60" r="5" fill="rgba(255,255,255,0.9)" />
            <circle cx="92" cy="-60" r="5" fill="rgba(255,255,255,0.9)" />
          </g>
        </motion.g>
      </motion.svg>
    </div>
  );
}
