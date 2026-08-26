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
      className="w-full bg-[color:var(--dark)] px-[24px] pb-[120px] pt-[250px] md:px-[40px] md:pb-0"
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
                <Button href={capabilities.cta.href} variant="secondary" gap={32}>
                  {capabilities.cta.label}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* accordion */}
        <Reveal delay={0.1} className="w-full lg:w-[680px] lg:shrink-0">
          <div className="hidden h-[630px] w-[680px] shrink-0 gap-[10px] lg:flex">
            {capabilities.panels.map((p, i) => {
              const open = i === active;
              return (
                <motion.div
                  key={p.n}
                  onHoverStart={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="relative flex cursor-pointer flex-col items-center overflow-hidden"
                  style={{ borderRadius: 20, boxShadow: "inset 0 0 0 1px var(--paper-10)" }}
                  animate={{
                    width: open ? 480 : 90,
                    backgroundColor: open ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.04)",
                  }}
                  transition={{ duration: 0.7, ease: EASE }}
                >
                  <PanelArt open={open} object={p.object} />

                  {/* index */}
                  <span
                    className="absolute top-[16px] z-20 flex items-center justify-center"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--paper-20)",
                      right: open ? 18 : "auto",
                    }}
                  >
                    <span
                      className="font-mono uppercase"
                      style={{
                        fontSize: 12,
                        lineHeight: "20.4px",
                        fontWeight: 200,
                        color: open ? "#fff" : "var(--paper-80)",
                      }}
                    >
                      {p.n}
                    </span>
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
                        className="relative z-10 flex h-full items-end justify-center pb-[18px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        <span
                          className="font-mono uppercase"
                          style={{
                            fontSize: 13,
                            lineHeight: "normal",
                            padding: 10,
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
                <div className="relative z-10 p-[20px]">
                  {/* On a phone the reference leads with the index in its
                      pill and sets the title as a mono label, not a heading. */}
                  <div className="flex items-center gap-[18px]">
                    <span
                      className="flex shrink-0 items-center justify-center"
                      style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--paper-20)" }}
                    >
                      <span
                        className="font-mono uppercase"
                        style={{ fontSize: 12, lineHeight: "20.4px", fontWeight: 200, color: "var(--paper-80)" }}
                      >
                        {p.n}
                      </span>
                    </span>
                    <h3
                      className="font-mono uppercase text-white"
                      style={{ fontSize: 12, lineHeight: "20.4px", fontWeight: 300, letterSpacing: "0.04em" }}
                    >
                      {p.title}
                    </h3>
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
                          <PanelArt open object={p.object} height={220} />
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


/** Panel backdrop: the source artwork, with the object riding on top when open. */
function PanelArt({
  open,
  object,
  height = 430,
}: {
  open: boolean;
  object: string;
  /** The stacked panels give it a shorter box than the desktop columns. */
  height?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height }}
    >
      <motion.img
        src={open ? capabilities.panelBgOpen : capabilities.panelBgClosed}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
      <motion.img
        src={object}
        alt=""
        aria-hidden
        className="absolute left-1/2 w-[270px] -translate-x-1/2 object-contain"
        style={{ top: height * 0.23, height: Math.round(height * 0.47) }}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 14 }}
        transition={{ duration: 0.7, ease: EASE }}
      />
    </div>
  );
}
