"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* -----------------------------------------------------------------
   Entrance latch.

   IntersectionObserver reports at rendering steps, so a block that
   enters and leaves the viewport between two of them is never seen —
   a fast flick or an anchor jump can leave a headline stuck at
   opacity 0 forever. Latch on the rect instead: once an element's top
   has crossed the trigger line it is revealed and stays revealed, no
   matter how the page got there. One shared, rAF-throttled listener
   drives every element so the cost stays flat.
------------------------------------------------------------------ */
const TRIGGER = 0.88; // fraction of the viewport height
const THROTTLE = 60; // ms between sweeps
const waiting = new Set<() => void>();
let last = 0;

/* Throttled on a clock rather than requestAnimationFrame: a backgrounded or
   headless tab can stop serving frames, and a dropped sweep would strand every
   remaining block. The trigger is monotonic — once past, always past — so a
   late sweep still catches up and nothing is lost. */
function schedule() {
  const now = Date.now();
  if (now - last < THROTTLE) return;
  last = now;
  for (const check of [...waiting]) check();
}

function subscribe(check: () => void) {
  if (waiting.size === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  waiting.add(check);
  return () => {
    waiting.delete(check);
    if (waiting.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

/** True once `ref`'s top has crossed the trigger line. Never resets. */
export function useRevealed(ref: RefObject<HTMLElement | null>) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    let live = true;
    const check = () => {
      if (!live) return;
      if (el.getBoundingClientRect().top < window.innerHeight * TRIGGER) setShown(true);
    };
    check();
    const off = subscribe(check);
    return () => {
      live = false;
      off();
    };
  }, [ref, shown]);
  return shown;
}

/** Entrance: fade + rise, triggered once when the block scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  blur = 6,
  duration = 0.9,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  duration?: number;
  className?: string;
  as?: "div" | "span" | "li";
}) {
  const Cmp = motion[as];
  const ref = useRef<HTMLElement>(null);
  const shown = useRevealed(ref);
  return (
    <Cmp
      ref={ref as never}
      className={className}
      initial={false}
      animate={
        shown
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y, filter: `blur(${blur}px)` }
      }
      transition={shown ? { duration, delay, ease: EASE } : { duration: 0 }}
    >
      {children}
    </Cmp>
  );
}

/** Words rise into place one after another — used for headlines. */
export function RevealWords({
  text,
  className = "",
  delay = 0,
  stagger = 0.035,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRevealed(ref);
  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={false}
            animate={{ y: shown ? 0 : "110%" }}
            transition={
              shown ? { duration: 0.85, delay: delay + i * stagger, ease: EASE } : { duration: 0 }
            }
          >
            {word}
            {" "}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/**
 * Scroll-linked highlight: the paragraph starts washed out and inks in
 * character by character as the block travels through the viewport.
 */
export function ScrollHighlightText({
  text,
  className = "",
  dim = "var(--ink-40)",
  lit = "var(--ink)",
  start = "start 0.85",
  end = "end 0.45",
}: {
  text: string;
  className?: string;
  dim?: string;
  lit?: string;
  start?: string;
  end?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [start, end] as never,
  });
  const words = text.split(" ");
  let charIndex = 0;
  const total = text.replace(/ /g, "").length;

  return (
    <p ref={ref} className={className}>
      {words.map((word, wi) => {
        const chars = word.split("");
        return (
          <span key={`${word}-${wi}`} className="inline-block whitespace-nowrap">
            {chars.map((c, ci) => {
              const i = charIndex++;
              return (
                <Char
                  key={`${c}-${ci}`}
                  char={c}
                  progress={scrollYProgress}
                  range={[i / total, (i + 6) / total]}
                  dim={dim}
                  lit={lit}
                />
              );
            })}
            <span>{" "}</span>
          </span>
        );
      })}
    </p>
  );
}

function Char({
  char,
  progress,
  range,
  dim,
  lit,
}: {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
  dim: string;
  lit: string;
}) {
  const color = useTransform(progress, range, [dim, lit]);
  return (
    <motion.span style={{ color }} className="inline-block">
      {char}
    </motion.span>
  );
}

/** Number that counts up to its target the first time it is seen. */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1.8,
  decimals = 0,
  className = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const value = useMotionValue(0);
  const spring = useSpring(value, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) value.set(to);
  }, [inView, to, value]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
    });
  }, [spring, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={className}>{`${prefix}0${suffix}`}</span>
  );
}

/** Seamless horizontal marquee. Children are duplicated once for the loop. */
export function Marquee({
  children,
  duration = 40,
  reverse = false,
  pauseOnHover = false,
  className = "",
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}) {
  return (
    <div className={`marquee relative w-full overflow-hidden ${className}`}>
      <div
        className="marquee-track"
        data-reverse={reverse}
        data-pause={pauseOnHover}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Subtle parallax: shifts a layer as the section crosses the viewport. */
export function Parallax({
  children,
  distance = 60,
  className = "",
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
