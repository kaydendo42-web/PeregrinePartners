"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Reveal } from "./ui/motion-primitives";
import { SectionLabel } from "./ui/section-label";
import { external, internal } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Internal branches — 006 to 009.
 *
 * Numbered on from the external five rather than restarting at 01, which is
 * the one thing the numbering has to say: these are not two product lines, they
 * are one index of nine, split by where the work points. The plate to the left
 * carries the whole index so the claim is visible rather than asserted.
 *
 * The reference's four-step accordion is unchanged underneath — one row open at
 * a time, the column height fixed by the plate so opening a row never moves the
 * block.
 */
export function Internal() {
  const [open, setOpen] = useState(0);

  return (
    <div id="internal" className="w-full">
      <SectionLabel label={internal.label} tone="dark" align="right" ruleWidth={1205} />

      <Reveal delay={0.04}>
        <h2 className="t-display mt-[52px] max-w-[800px] text-white">{internal.heading}</h2>
      </Reveal>

      <div className="mt-[50px] flex flex-col gap-[10px] xl:flex-row">
        <Reveal className="w-full shrink-0 xl:w-[400px]">
          <BranchIndex />
        </Reveal>

        <div className="flex w-full flex-col gap-[10px]">
          {internal.steps.map((s, i) => (
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
            {internal.note}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <Button href={internal.cta.href} variant="secondary" gap={43} minWidth={232}>
            {internal.cta.label}
          </Button>
        </Reveal>
      </div>
    </div>
  );
}

/**
 * The plate: all nine branches, in one column, with the internal four lit.
 *
 * This replaces the template's rendered object, which was decoration. A list
 * of nine rows is a duller picture and a truer one — the argument the section
 * is making is about the shape of the set, and the set is the picture.
 */
function BranchIndex() {
  const all = [
    ...external.panels.map((p) => ({ n: p.n, title: p.title, lit: false })),
    ...internal.steps.map((s) => ({ n: s.n, title: s.title.split(",")[0].trim(), lit: true })),
  ];

  return (
    <div
      className="relative flex h-[445px] w-full shrink-0 flex-col justify-between overflow-hidden xl:w-[400px]"
      style={{ borderRadius: 20, padding: 30, boxShadow: "inset 0 0 0 1px var(--paper-10)" }}
    >
      <p
        className="font-mono uppercase"
        style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--paper-40)" }}
      >
        The index
      </p>

      <ul className="flex flex-col gap-[2px]">
        {all.map((b, i) => (
          <motion.li
            key={b.n}
            className="flex items-center gap-[14px] py-[6px]"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--paper-06)" }}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 + i * 0.05, ease: EASE }}
          >
            <span
              className="font-mono shrink-0"
              style={{
                fontSize: 11,
                letterSpacing: "0.04em",
                color: b.lit ? "#ffffff" : "var(--paper-40)",
              }}
            >
              {b.n}
            </span>
            <span
              className="min-w-0 truncate"
              style={{
                fontSize: 13,
                lineHeight: "19px",
                fontWeight: b.lit ? 500 : 300,
                color: b.lit ? "#ffffff" : "var(--paper-40)",
              }}
            >
              {b.title}
            </span>
            {b.lit ? (
              <span
                className="ml-auto block h-[5px] w-[5px] shrink-0 rounded-full"
                style={{ background: "#fff" }}
              />
            ) : null}
          </motion.li>
        ))}
      </ul>

      <p
        className="font-mono uppercase"
        style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--paper-40)" }}
      >
        005 external · 004 internal
      </p>
    </div>
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
          style={{
            fontSize: 14,
            lineHeight: "21px",
            fontWeight: 300,
            letterSpacing: "0.28px",
            color: "var(--paper-40)",
          }}
        >
          {`// ${n}`}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-start justify-between gap-[10px] sm:h-[20px]">
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
