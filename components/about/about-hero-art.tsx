"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const PIECES = [
  {
    clipPath: "inset(0 0 64% 0)",
    from: { x: 26, y: -20, rotate: 1.4 },
    delay: 0.32,
  },
  {
    clipPath: "inset(31% 0 31% 0)",
    from: { x: -22, y: 34, rotate: -1.8 },
    delay: 0.18,
  },
  {
    clipPath: "inset(64% 0 0 0)",
    from: { x: -36, y: 64, rotate: -3.2 },
    delay: 0.04,
  },
] as const;

/**
 * The About hero's single authored motion: scattered work resolves into one
 * vertical stack. Three clipped copies settle into the same final image, so
 * the animation communicates the page's argument without turning the entire
 * route into a sequence of effects.
 */
export function AboutHeroArt() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      data-about-hero-art
      className="pointer-events-none absolute bottom-[24px] left-[24%] right-0 top-[30px] z-[1] opacity-[0.48] sm:left-[38%] md:bottom-[18px] md:left-[53%] md:right-[1%] md:top-[42px] md:opacity-95"
      aria-hidden="true"
    >
      <motion.div
        className="about-motion-piece absolute inset-[4%_7%_8%_5%] rounded-full border border-white/[0.07]"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.8, delay: 0.14, ease: EASE }
        }
      />

      {PIECES.map((piece, index) => (
        <motion.div
          key={piece.clipPath}
          data-art-piece={index === 0 ? "" : undefined}
          className="about-motion-piece absolute inset-0"
          style={{ clipPath: piece.clipPath }}
          initial={
            reducedMotion
              ? false
              : {
                  opacity: 0,
                  x: piece.from.x,
                  y: piece.from.y,
                  rotate: piece.from.rotate,
                }
          }
          animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.82, delay: piece.delay, ease: EASE }
          }
        >
          <Image
            src="/scene/operations-sculpture.png"
            alt=""
            fill
            preload={index === 0}
            quality={90}
            sizes="(max-width: 767px) 82vw, 47vw"
            className="object-contain object-right"
          />
        </motion.div>
      ))}

      <motion.span
        className="about-motion-piece absolute bottom-[8%] right-[7%] top-[8%] w-px origin-top bg-white/[0.12]"
        initial={reducedMotion ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.65, delay: 0.52, ease: EASE }
        }
      />
    </div>
  );
}
