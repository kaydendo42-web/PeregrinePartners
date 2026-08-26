"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Reveal } from "./ui/motion-primitives";
import { SectionLabel } from "./ui/section-label";
import { process } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The deployment cycle: a framed illustration beside a four-step accordion.
 * One step is open at a time and the column height is fixed by the frame, so
 * opening a step never moves the block.
 */
export function Process() {
  const [open, setOpen] = useState(0);

  return (
    <div id="process" className="w-full">
      <SectionLabel label={process.label} tone="dark" align="right" ruleWidth={1205} />

      <Reveal delay={0.04}>
        <h2 className="t-display mt-[52px] max-w-[800px] text-white">{process.heading}</h2>
      </Reveal>

      <div className="mt-[50px] flex flex-col gap-[10px] xl:flex-row">
        <Reveal className="w-full shrink-0 xl:w-[400px]">
          <Frame />
        </Reveal>

        <div className="flex w-full flex-col gap-[10px]">
          {process.steps.map((s, i) => (
            <Reveal key={s.n} delay={0.05 + i * 0.06} className="w-full">
              <Step {...s} open={open === i} onOpen={() => setOpen(i)} />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-[50px] flex flex-col items-start justify-between gap-[32px] lg:flex-row lg:items-center">
        <Reveal>
          <p
            className="max-w-[600px] uppercase text-white"
            style={{
              fontFamily: "var(--font-mono-ui), ui-monospace, monospace",
              fontSize: 12,
              lineHeight: "20.4px",
              fontWeight: 200,
            }}
          >
            {process.note}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <Button href={process.cta.href} variant="secondary" gap={43} minWidth={232}>
            {process.cta.label}
          </Button>
        </Reveal>
      </div>
    </div>
  );
}

/** The illustration card: a printed plate with the model object floating on it. */
function Frame() {
  return (
    <motion.div
      className="relative flex h-[445px] w-full shrink-0 items-center justify-center overflow-hidden xl:w-[400px]"
      style={{ borderRadius: 20, padding: 30 }}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <img
        src={process.frame}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <motion.img
        src={process.frameInner}
        alt=""
        aria-hidden
        className="relative h-[300px] w-[300px] object-cover"
        variants={{ rest: { y: 0, scale: 1 }, hover: { y: -10, scale: 1.03 } }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </motion.div>
  );
}

function Step({
  n,
  tag,
  title,
  body,
  open,
  onOpen,
}: {
  n: string;
  tag: string;
  title: string;
  body: string;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.div
      className="w-full overflow-hidden"
      style={{ borderRadius: 20, boxShadow: "inset 0 0 0 1px var(--paper-10)" }}
      animate={{ backgroundColor: open ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0)" }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start gap-[30px] p-[30px] text-left"
      >
        <span
          className="shrink-0"
          style={{ fontSize: 14, lineHeight: "21px", fontWeight: 300, letterSpacing: "0.28px", color: "var(--paper-40)" }}
        >
          {`// ${n}`}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex h-[20px] items-start justify-between gap-[10px]">
            <span
              className="min-w-0 flex-1 text-white"
              style={{ fontSize: 18, lineHeight: "19.8px", fontWeight: 500, letterSpacing: "-0.72px" }}
            >
              {title}
            </span>

            <AnimatePresence initial={false}>
              {open && (
                <motion.span
                  key="tag"
                  className="hidden shrink-0 items-center bg-white sm:flex"
                  style={{ borderRadius: 100, padding: "4px 12px" }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <span
                    className="uppercase"
                    style={{
                      fontFamily: "var(--font-mono-ui), ui-monospace, monospace",
                      fontSize: 10,
                      lineHeight: "16px",
                      fontWeight: 400,
                      color: "var(--ink)",
                    }}
                  >
                    {tag}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <AnimatePresence initial={false}>
            {open && (
              <motion.span
                key="body"
                className="block overflow-hidden pt-[24px]"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <span
                  className="block max-w-[600px] text-white"
                  style={{ fontSize: 15, lineHeight: "22.5px", fontWeight: 300, letterSpacing: "0.3px" }}
                >
                  {body}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>
    </motion.div>
  );
}
