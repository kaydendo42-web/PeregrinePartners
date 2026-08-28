"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function OriginVisual({
  src,
  caption,
}: {
  src: string;
  caption: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.figure
      className="about-origin-motion min-w-0"
      initial={reducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.72, delay: 0.08, ease: EASE }
      }
    >
      <motion.div
        data-about-origin-visual
        className="about-origin-motion relative aspect-[16/10] min-h-[300px] w-full overflow-hidden lg:aspect-[4/3] lg:min-h-[560px]"
        style={{ borderRadius: "0 var(--r-card) var(--r-card) var(--r-card)" }}
        initial={reducedMotion ? false : { clipPath: "inset(0 0 0 18%)" }}
        whileInView={{ clipPath: "inset(0 0 0 0%)" }}
        viewport={{ once: true, amount: 0.18 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.88, delay: 0.1, ease: EASE }
        }
      >
        <motion.div
          className="about-origin-motion absolute inset-0"
          initial={reducedMotion ? false : { scale: 1.055 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 1.15, delay: 0.08, ease: EASE }
          }
        >
          <Image
            src={src}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>

        <div
          className="absolute inset-x-0 bottom-0 h-[34%]"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,10,0.38), rgba(10,10,10,0))",
          }}
          aria-hidden="true"
        />
      </motion.div>

      <figcaption className="t-mono-xs mt-[18px] flex items-center gap-[12px] font-mono uppercase text-white/40">
        <span className="h-px w-[32px] bg-white/20" aria-hidden="true" />
        {caption}
      </figcaption>
    </motion.figure>
  );
}
