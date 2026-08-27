"use client";

import { motion } from "motion/react";
import { about } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The six dollars, drawn.
 *
 * The whole company rests on one ratio, and a ratio is the rare claim that is
 * genuinely better as a picture than as a sentence — seven blocks, one of them
 * the software line and six of them the services line, so the reader sees the
 * proportion before they read the number.
 *
 * The six carry the ink and the one is an outline, not the other way round.
 * Weighting the software block heavier would draw the eye to the small half
 * and quietly argue the opposite of the sentence beside it.
 *
 * Deliberately not a chart. There is no axis, no gridline and no percentage,
 * because there is only one comparison being made and furniture around it
 * would imply a dataset that does not exist.
 */
export function DollarSplit() {
  const [software, services] = about.six.split;

  return (
    <div className="flex w-full flex-col gap-[28px]">
      <Row
        k={software.k}
        v={software.v}
        note={software.note}
        blocks={1}
        solid={false}
        delay={0}
      />
      <Row
        k={services.k}
        v={services.v}
        note={services.note}
        blocks={6}
        solid
        delay={0.25}
      />
    </div>
  );
}

function Row({
  k,
  v,
  note,
  blocks,
  solid,
  delay,
}: {
  k: string;
  v: string;
  note: string;
  blocks: number;
  solid: boolean;
  delay: number;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-baseline gap-[14px]">
        <span
          className="shrink-0 text-white"
          style={{ fontSize: 34, lineHeight: "34px", fontWeight: 500, letterSpacing: "-1.4px" }}
        >
          {k}
        </span>
        <span
          className="font-mono uppercase"
          style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--paper-50)" }}
        >
          {v}
        </span>
      </div>

      <div className="flex flex-wrap gap-[6px]" aria-hidden>
        {Array.from({ length: blocks }).map((_, i) => (
          <motion.span
            key={i}
            className="block h-[42px] w-[42px] sm:h-[54px] sm:w-[54px]"
            style={{
              borderRadius: 8,
              background: solid ? "#ffffff" : "rgba(255,255,255,0.09)",
              boxShadow: solid ? "none" : "inset 0 0 0 1px var(--paper-20)",
            }}
            initial={{ opacity: 0, scaleX: 0, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: delay + i * 0.07, ease: EASE }}
          />
        ))}
      </div>

      <p className="t-body-sm max-w-[420px] text-white/70">{note}</p>
    </div>
  );
}
