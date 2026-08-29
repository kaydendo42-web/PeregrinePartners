"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Mark } from "./mark";

type Variant = "primary" | "secondary" | "light" | "small";

const styles: Record<
  Variant,
  { shell: React.CSSProperties; slot: React.CSSProperties; text: React.CSSProperties; mark: string }
> = {
  /* dark pill, white icon slot — used on light sections */
  primary: {
    shell: { background: "var(--ink)", borderRadius: "var(--r-btn)", padding: "3px 34px 3px 3px", gap: 26 },
    slot: { width: 65, height: 59, background: "#fff", borderRadius: "var(--r-btn-inner)" },
    text: { color: "#fff", fontSize: 16, lineHeight: "24px", fontWeight: 400 },
    mark: "text-[color:var(--ink)]",
  },
  /* raised dark pill on dark sections */
  secondary: {
    shell: { background: "var(--dark-2)", borderRadius: "var(--r-btn)", padding: "3px 34px 3px 3px", gap: 26 },
    slot: { width: 65, height: 59, background: "var(--dark)", borderRadius: "var(--r-btn-inner)" },
    text: { color: "#fff", fontSize: 16, lineHeight: "24px", fontWeight: 400 },
    mark: "text-white",
  },
  /* white pill with dark icon slot */
  light: {
    shell: { background: "#fff", borderRadius: "var(--r-btn)", padding: "3px 34px 3px 3px", gap: 26 },
    slot: { width: 65, height: 59, background: "var(--ink)", borderRadius: "var(--r-btn-inner)" },
    text: { color: "var(--ink)", fontSize: 16, lineHeight: "24px", fontWeight: 400 },
    mark: "text-white",
  },
  /* compact nav-scale pill */
  small: {
    shell: { background: "#fff", borderRadius: "var(--r-chip)", padding: "3px 19px 3px 3px", gap: 14 },
    slot: { width: 40, height: 36, background: "var(--ink)", borderRadius: "var(--r-chip-inner)" },
    text: { color: "var(--ink)", fontSize: 14, lineHeight: "19.6px", letterSpacing: "0.02em", fontWeight: 400 },
    mark: "text-white",
  },
};

/** Past this share of the track, letting go commits rather than snapping back. */
const COMMIT = 0.72;

export function Button({
  children,
  href = "#",
  variant = "primary",
  className = "",
  type,
  gap,
  minWidth,
  slide = false,
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  /** Pass a type to render a real <button> instead of a link. */
  type?: "button" | "submit";
  /** Override the slot-to-label gap for one-off placements. */
  gap?: number;
  /** The reference sets a few buttons to a fixed width rather than hugging. */
  minWidth?: number;
  /**
   * Make the mark a slider: the reader drags it across the pill and the link
   * follows on release, rather than on a click. Links only, and it never
   * removes the keyboard path (see `guardClick`).
   */
  slide?: boolean;
}) {
  const base = styles[variant];
  const shell = {
    ...base.shell,
    ...(gap == null ? null : { gap }),
    ...(minWidth == null ? null : { minWidth }),
  };
  const s = { ...base, shell };
  if (slide && !type) {
    return (
      <SlideButton
        href={href}
        shell={s.shell}
        slot={s.slot}
        text={s.text}
        mark={s.mark}
        className={className}
      >
        {children}
      </SlideButton>
    );
  }

  const inner = (
    <>
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden"
        style={s.slot}
      >
        <span className={`relative flex items-center justify-center overflow-hidden ${s.mark}`}>
          <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[130%]">
            <Mark size={30} />
          </span>
          <span className="absolute block -translate-x-[130%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0">
            <Mark size={30} />
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
          className="group inline-flex cursor-pointer items-center justify-start overflow-hidden"
          style={s.shell}
        >
          {inner}
        </button>
      ) : (
        <Link
          href={href}
          className="group inline-flex items-center justify-start overflow-hidden"
          style={s.shell}
        >
          {inner}
        </Link>
      )}
    </motion.div>
  );
}

/**
 * Slide to confirm.
 *
 * The mark is dragged from its slot to the far end of the pill and the link is
 * followed on release, not on a click. Three things this has to keep:
 *
 * - **The keyboard path.** It stays a real `<Link>`, so Enter still works and a
 *   screen reader still announces a link to the same href. `guardClick` only
 *   swallows clicks that came from a pointer (`detail > 0`); a keyboard-
 *   generated click reports `detail === 0` and is let through untouched.
 * - **A visible target.** The label carries the instruction until the drag
 *   starts, then fades out from under the mark rather than being covered by it.
 * - **Its own width.** The track is measured rather than assumed, because the
 *   pill hugs its label and the label is different in the nav and in the FAQ.
 */
function SlideButton({
  children,
  href,
  shell,
  slot,
  text,
  mark,
  className,
}: {
  children: ReactNode;
  href: string;
  shell: React.CSSProperties;
  slot: React.CSSProperties;
  text: React.CSSProperties;
  /** The mark inverts against its slot, so the colour travels with the style. */
  mark: string;
  className: string;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const [travel, setTravel] = useState(0);
  const [done, setDone] = useState(false);
  const x = useMotionValue(0);

  /* The label gets out of the way as the mark comes across it. */
  const labelOpacity = useTransform(x, [0, Math.max(travel * 0.55, 1)], [1, 0]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const padL = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const slotW = Number(slot.width) || 0;
      /* The mark rests at `padL` and finishes with the same inset on the right,
         so the gesture ends on a symmetry rather than against the label's own
         larger right padding. */
      setTravel(Math.max(0, el.clientWidth - padL * 2 - slotW));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slot.width, children]);

  const commit = useCallback(() => {
    if (done) return;
    setDone(true);
    router.push(href);
  }, [done, href, router]);

  /* Pointer clicks are the gesture's own; keyboard clicks are the a11y path. */
  const guardClick = (e: React.MouseEvent) => {
    if (e.detail > 0) e.preventDefault();
  };

  return (
    <div className={`inline-flex ${className}`}>
      <Link
        ref={ref}
        href={href}
        onClick={guardClick}
        /* An <a href> is natively draggable, and that native drag swallows the
           pointer before the mark's own drag ever starts. */
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className="group relative inline-flex cursor-grab items-center justify-start overflow-hidden active:cursor-grabbing"
        style={shell}
      >
        <motion.span
          drag="x"
          dragConstraints={{ left: 0, right: travel }}
          dragElastic={0.04}
          dragMomentum={false}
          style={{ ...slot, x }}
          className="relative z-10 flex shrink-0 items-center justify-center overflow-hidden"
          onDragEnd={() => {
            if (travel > 0 && x.get() >= travel * COMMIT) {
              x.set(travel);
              commit();
            } else {
              x.set(0);
            }
          }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className={`flex items-center justify-center ${mark}`}>
            <Mark size={30} />
          </span>
        </motion.span>

        <motion.span style={{ ...text, opacity: labelOpacity }} className="whitespace-nowrap">
          {children}
        </motion.span>
      </Link>
    </div>
  );
}
