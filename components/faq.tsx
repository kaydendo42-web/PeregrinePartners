"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Reveal } from "./ui/motion-primitives";
import { SectionLabel } from "./ui/section-label";
import { Cite } from "./ui/cite";
import { faq, type SourceKey } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="w-full bg-[color:var(--page)] px-[12px]">
      <div className="band section-card py-[120px] md:py-[192px]">
        <div className="measure flex flex-col gap-[60px] lg:flex-row lg:gap-[68px]">
          {/* left rail */}
          <div className="flex w-full max-w-[600px] flex-col lg:min-h-[620px]">
            <SectionLabel label={faq.label} ruleWidth={323} />

            <Reveal delay={0.05}>
              <p className="t-body mt-[52px] max-w-[500px]">{faq.intro}</p>
            </Reveal>

            <div className="pt-[120px] lg:pt-[234px]">
              <Reveal delay={0.05}>
                <h2 className="t-display max-w-[598px]">{faq.heading}</h2>
              </Reveal>
              <Reveal delay={0.12}>
                <div className="mt-[40px]">
                  <Button href={faq.cta.href} gap={30}>{faq.cta.label}</Button>
                </div>
              </Reveal>
            </div>
          </div>

          {/* accordion */}
          <div className="flex w-full flex-col gap-[6px] lg:max-w-[668px]">
            {faq.items.map((item, i) => (
              <Reveal key={item.q} delay={Math.min(i * 0.05, 0.25)}>
                <FaqRow
                  {...item}
                  open={open === i}
                  onToggle={() => setOpen(open === i ? null : i)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqRow({
  q,
  a,
  cite,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  /** Where the answer's numbers came from. Empty when it makes no claim. */
  cite: SourceKey[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      className="w-full overflow-hidden"
      style={{ background: "var(--ink)", borderRadius: 20 }}
      animate={{
        boxShadow: open ? "rgba(0,0,0,0.18) 0px 8px 13px 3px" : "rgba(0,0,0,0) 0px 8px 13px 3px",
      }}
      transition={{ duration: 0.4 }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-[20px] p-[20px] text-left"
      >
        <span
          className="text-white"
          style={{ fontSize: 20, lineHeight: "28px", fontWeight: 500, letterSpacing: "-0.4px" }}
        >
          {q}
        </span>
        <span className="mt-[4px] flex h-[23px] w-[23px] shrink-0 items-center justify-center text-white">
          <motion.svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: open ? 135 : 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </motion.svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="px-[20px] pb-[20px]">
              <p
                style={{
                  fontSize: 16,
                  lineHeight: "24px",
                  fontWeight: 300,
                  letterSpacing: "0.02em",
                  color: "var(--paper-80)",
                }}
              >
                {a}
              </p>
              {/* The answer's evidence, in the open panel rather than a
                  footnote at the bottom of the page nobody scrolls to. */}
              <Cite keys={cite} tone="dark" className="mt-[14px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
