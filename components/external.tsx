"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Reveal } from "./ui/motion-primitives";
import { SectionLabel } from "./ui/section-label";
import { BranchArt } from "./art/branch-art";
import { external } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * External branches — 001 to 005.
 *
 * The horizontal accordion is the reference's, but its geometry was hard-coded
 * for exactly three panels (480 open, 90 closed, 680 total). There are five
 * here, so the widths are derived from the count against a fixed total
 * instead: adding a sixth branch later re-fits the row rather than pushing it
 * off the grid. The rail beside it gives up 80px to pay for the extra columns.
 */
const TOTAL = 760;
const CLOSED = 72;
const GAP = 10;

export function External() {
  const [active, setActive] = useState(0);
  const n = external.panels.length;
  const open = TOTAL - (n - 1) * (CLOSED + GAP);

  return (
    <section
      id="external"
      className="w-full bg-[color:var(--dark)] px-[24px] pb-[120px] pt-[250px] md:px-[40px] md:pb-0"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-[60px] lg:flex-row lg:justify-between">
        {/* left rail */}
        <div className="flex w-full max-w-[560px] flex-col">
          <SectionLabel label={external.label} tone="dark" ruleWidth={280} />

          <Reveal delay={0.05}>
            <p className="t-body mt-[52px] max-w-[480px] text-white">{external.intro}</p>
          </Reveal>

          <div className="mt-[220px] max-w-[540px]">
            <Reveal delay={0.05}>
              <h2 className="t-display text-white">{external.heading}</h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="mt-[40px]">
                <Button href={external.cta.href} variant="secondary" gap={32}>
                  {external.cta.label}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* accordion */}
        <Reveal delay={0.1} className="w-full lg:w-[760px] lg:shrink-0">
          <div className="hidden h-[630px] shrink-0 lg:flex" style={{ width: TOTAL, gap: GAP }}>
            {external.panels.map((p, i) => {
              const isOpen = i === active;
              return (
                <motion.button
                  key={p.n}
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={p.title}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="relative flex cursor-pointer flex-col items-center overflow-hidden text-left"
                  style={{ borderRadius: 20, boxShadow: "inset 0 0 0 1px var(--paper-10)" }}
                  animate={{
                    width: isOpen ? open : CLOSED,
                    backgroundColor: isOpen ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.04)",
                  }}
                  transition={{ duration: 0.7, ease: EASE }}
                >
                  <PanelArt open={isOpen} art={p.art} />

                  {/* index */}
                  <span
                    className="absolute top-[16px] z-20 flex items-center justify-center"
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--paper-20)",
                      right: isOpen ? 18 : "auto",
                    }}
                  >
                    <span
                      className="font-mono uppercase"
                      style={{
                        fontSize: 12,
                        lineHeight: "20.4px",
                        fontWeight: 200,
                        color: isOpen ? "#fff" : "var(--paper-80)",
                      }}
                    >
                      {p.n}
                    </span>
                  </span>

                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div
                        key="open"
                        className="relative z-10 flex h-full w-full flex-col px-[26px] pb-[26px] pt-[28px]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
                      >
                        <h3
                          className="max-w-[300px] text-white"
                          style={{
                            fontSize: 26,
                            lineHeight: "33px",
                            fontWeight: 500,
                            letterSpacing: "-0.4px",
                          }}
                        >
                          {p.title}
                        </h3>
                        <p
                          className="mt-[16px] max-w-[350px] text-white"
                          style={{
                            fontSize: 14,
                            lineHeight: "21px",
                            fontWeight: 300,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {p.body}
                        </p>
                        <PanelFacts runsOn={p.runsOn} waits={p.waits} />
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
                            fontSize: 12,
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
                </motion.button>
              );
            })}
          </div>
        </Reveal>

        {/* narrow screens: the same panels, stacked and expandable */}
        <div className="flex w-full flex-col gap-[10px] lg:hidden">
          {external.panels.map((p, i) => {
            const isOpen = i === active;
            return (
              <motion.div
                key={p.n}
                className="relative w-full overflow-hidden"
                style={{ borderRadius: 20, boxShadow: "inset 0 0 0 1px var(--paper-10)" }}
                animate={{
                  backgroundColor: isOpen ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <button
                  type="button"
                  className="w-full cursor-pointer p-[20px] text-left"
                  aria-expanded={isOpen}
                  onClick={() => setActive(i)}
                >
                  {/* On a phone the reference leads with the index in its pill
                      and sets the title as a mono label, not a heading. */}
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
                    {isOpen && (
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
                        <PanelFacts runsOn={p.runsOn} waits={p.waits} />
                        <div className="relative mt-[16px] h-[200px]">
                          <PanelArt open art={p.art} height={200} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** What the branch works through, and what it always stops for. */
function PanelFacts({ runsOn, waits }: { runsOn: string; waits: string }) {
  return (
    <dl
      className="mt-auto flex flex-col gap-[10px] pt-[24px]"
      style={{ borderTop: "1px solid var(--paper-10)" }}
    >
      {[
        ["Runs on", runsOn],
        ["Waits for you", waits],
      ].map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-[16px]">
          <dt
            className="font-mono uppercase"
            style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--paper-40)" }}
          >
            {k}
          </dt>
          <dd
            className="text-right text-white"
            style={{ fontSize: 12, lineHeight: "18px", fontWeight: 300 }}
          >
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Panel backdrop: the plate, with the branch's own object drawn on top. */
function PanelArt({
  open,
  art,
  height = 400,
}: {
  open: boolean;
  art: (typeof external.panels)[number]["art"];
  height?: number;
}) {
  const tall = height >= 300;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height }}
    >
      <motion.img
        src={open ? external.panelBgOpen : external.panelBgClosed}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
      {/* The facts row sits on the floor of the panel, so the object is raised
          clear of it rather than drawn behind it — and a short wash under the
          facts keeps them legible whatever the plate is doing down there. */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: tall ? 128 : 14, width: tall ? 215 : 150 }}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 14 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {open ? <BranchArt kind={art} className="h-auto w-full" /> : null}
      </motion.div>
      {tall && open ? (
        <div
          className="absolute inset-x-0 bottom-0 h-[150px]"
          style={{
            background: "linear-gradient(to bottom, rgba(26,26,26,0) 0%, rgba(26,26,26,0.86) 60%)",
          }}
        />
      ) : null}
    </div>
  );
}
