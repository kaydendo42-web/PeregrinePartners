"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Mark } from "./mark";

type Variant = "primary" | "secondary" | "light" | "small";

const styles: Record<
  Variant,
  { shell: React.CSSProperties; slot: React.CSSProperties; text: React.CSSProperties; mark: string }
> = {
  /* dark pill, white icon slot — used on light sections */
  primary: {
    shell: { background: "var(--ink)", borderRadius: "var(--r-btn)", padding: "3px 24px 3px 3px", gap: 16 },
    slot: { width: 65, height: 59, background: "#fff", borderRadius: "var(--r-btn-inner)" },
    text: { color: "#fff", fontSize: 16, lineHeight: "24px", fontWeight: 400 },
    mark: "text-[color:var(--ink)]",
  },
  /* raised dark pill on dark sections */
  secondary: {
    shell: { background: "var(--dark-2)", borderRadius: "var(--r-btn)", padding: "3px 24px 3px 3px", gap: 16 },
    slot: { width: 65, height: 59, background: "var(--dark)", borderRadius: "var(--r-btn-inner)" },
    text: { color: "#fff", fontSize: 16, lineHeight: "24px", fontWeight: 400 },
    mark: "text-white",
  },
  /* white pill with dark icon slot */
  light: {
    shell: { background: "#fff", borderRadius: "var(--r-btn)", padding: "3px 24px 3px 3px", gap: 16 },
    slot: { width: 65, height: 59, background: "var(--ink)", borderRadius: "var(--r-btn-inner)" },
    text: { color: "var(--ink)", fontSize: 16, lineHeight: "24px", fontWeight: 400 },
    mark: "text-white",
  },
  /* compact nav-scale pill */
  small: {
    shell: { background: "#fff", borderRadius: "var(--r-chip)", padding: "3px 10px 3px 3px", gap: 6 },
    slot: { width: 40, height: 36, background: "var(--ink)", borderRadius: "var(--r-chip-inner)" },
    text: { color: "var(--ink)", fontSize: 14, lineHeight: "19.6px", letterSpacing: "0.02em", fontWeight: 400 },
    mark: "text-white",
  },
};

export function Button({
  children,
  href = "#",
  variant = "primary",
  className = "",
  icon,
  type,
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  icon?: ReactNode;
  /** Pass a type to render a real <button> instead of a link. */
  type?: "button" | "submit";
}) {
  const s = styles[variant];
  const inner = (
    <>
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden"
        style={s.slot}
      >
        <span className={`relative flex items-center justify-center ${s.mark}`}>
          <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[130%]">
            {icon ?? <Mark size={30} />}
          </span>
          <span className="absolute block -translate-x-[130%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0">
            {icon ?? <Mark size={30} />}
          </span>
        </span>
      </span>
      <span style={s.text} className="whitespace-nowrap">
        {children}
      </span>
    </>
  );
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`inline-flex ${className}`}
    >
      {type ? (
        <button
          type={type}
          className="group inline-flex cursor-pointer items-center justify-center overflow-hidden"
          style={s.shell}
        >
          {inner}
        </button>
      ) : (
        <Link
          href={href}
          className="group inline-flex items-center justify-center overflow-hidden"
          style={s.shell}
        >
          {inner}
        </Link>
      )}
    </motion.div>
  );
}
