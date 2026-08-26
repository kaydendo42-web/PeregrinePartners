"use client";

import { motion } from "motion/react";

/**
 * The recurring eyebrow: a capsule, a hairline rule that draws itself in,
 * and a monospaced caption.
 */
export function SectionLabel({
  label,
  tone = "light",
  ruleWidth = 323,
  align = "left",
}: {
  label: string;
  tone?: "light" | "dark";
  ruleWidth?: number;
  align?: "left" | "right";
}) {
  const ink = tone === "dark" ? "#fff" : "var(--ink)";
  const rule = tone === "dark" ? "var(--paper-10)" : "var(--ink-20)";

  const capsule = (
    <span
      className="block shrink-0 rounded-full"
      style={{ width: 36, height: 18, border: `2px solid ${ink}` }}
    />
  );

  const line = (
    <motion.span
      className="block h-[1px] shrink"
      style={{ background: rule, maxWidth: ruleWidth, width: "100%" }}
      initial={{ scaleX: 0, originX: align === "left" ? 0 : 1 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    />
  );

  const text = (
    <span className="t-mono shrink-0" style={{ color: ink }}>
      {label}
    </span>
  );

  return (
    <div className="flex w-full items-center gap-[20px]">
      {align === "left" ? (
        <>
          {capsule}
          {line}
          {text}
        </>
      ) : (
        <>
          {text}
          {line}
          {capsule}
        </>
      )}
    </div>
  );
}
