"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * The Floor's cold open.
 *
 * The demo is heavy: an isometric scene, a clock, a request-animation-frame
 * loop and a panel of state, all of it arriving at once on a card that fills
 * the screen. Dropping the reader straight into that is the worst version of
 * it, because the first thing they see is a diagram they have not been given
 * a reason to read yet.
 *
 * So the mascot from the hero comes and stands in front of it for two and a
 * half seconds. Same television, same face: the pixel geometry, the fill and
 * the bloom are lifted from `components/art/screen-face.tsx` rather than
 * redrawn, so this is recognisably the same object the reader met on the home
 * page, off its hill and doing a job.
 *
 * It looks left, it looks right, it comes back to the reader and smiles, and
 * the floor is behind it when it goes. The whole sequence is a held glance:
 * the eyes move fast and the holds are long, because a slow eye reads as a
 * machine sweeping and a fast one reads as something looking.
 */

/* Lifted from ScreenFace. Changing either copy without the other breaks the
   likeness, which is the only thing this component is for. */
const FILL = "#3d2113";
const EYE = {
  left: { x: 4, y: 5 },
  right: { x: 10, y: 5 },
};

/** How far the eyes travel, in screen cells. Wider than the hero's 1.35: the
    hero tracks a pointer and never wants to reach the bezel, this one is
    performing the look and wants to. */
const GAZE = 1.6;

/**
 * The soft edge, as one mask reused wherever the glass meets the page.
 *
 * `mask-composite: intersect` is the standard spelling and `source-in` the
 * WebKit one; both have to be here or the second gradient replaces the first
 * instead of cutting against it, and the feather goes one-directional.
 */
const EDGE =
  "linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%), " +
  "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)";

const FEATHER = {
  maskImage: EDGE,
  maskComposite: "intersect",
  WebkitMaskImage: EDGE,
  WebkitMaskComposite: "source-in",
} as const;

type Phase = "on" | "left" | "right" | "center" | "smile";

const GAZE_X: Record<Phase, number> = {
  on: 0,
  left: -GAZE,
  right: GAZE,
  center: 0,
  smile: 0,
};

/**
 * The morning's whole runtime, in milliseconds from mount.
 *
 * Two and a half seconds is the ceiling. Past that a loader stops being a
 * greeting and starts being the thing between the reader and the demo, and
 * the demo is the entire argument of this page.
 */
const BEATS: ReadonlyArray<readonly [Phase, number]> = [
  ["left", 400],
  ["right", 880],
  ["center", 1360],
  ["smile", 1620],
];
const EXIT_AT = 2120;
const CLEAR_AT = 2620;

/** The saccade. Fast, and the same curve the rest of the site moves on. */
const LOOK = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const };

export function FloorBoot({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("on");
  const [booting, setBooting] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    /* Someone who has asked for less motion has asked for less of exactly
       this. They get the floor, immediately. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBooting(false);
      setRevealed(true);
      return;
    }

    const timers = [
      ...BEATS.map(([next, at]) => window.setTimeout(() => setPhase(next), at)),
      window.setTimeout(() => setRevealed(true), EXIT_AT),
      window.setTimeout(() => setBooting(false), CLEAR_AT),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="relative">
      {/* The floor is mounted the whole time, only hidden. It measures itself
          on mount and runs a clock, and both want to have happened by the
          time the television steps aside. */}
      <motion.div
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ pointerEvents: revealed ? "auto" : "none" }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {booting ? (
          <motion.div
            key="boot"
            aria-hidden
            className="absolute inset-0 z-10 flex items-start justify-center"
            /* The card's own fill, so the overlay has no edge of its own and
               the page reads as one surface that has not woken up yet. */
            style={{ background: "var(--surface)" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* The stage is the overlay's own height, so on desktop the
                television lands dead centre of the card it is standing in
                front of. On a phone the floor becomes a long list and the
                overlay runs well past the fold, so the screen height caps it
                and he stays where the reader is actually looking. */}
            <div className="flex w-full items-center justify-center" style={{ height: "min(100%, 100svh)" }}>
              <BootSet phase={phase} leaving={revealed} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function BootSet({ phase, leaving }: { phase: Phase; leaving: boolean }) {
  const smiling = phase === "smile";

  return (
    <motion.div
      className="relative"
      style={{ width: "clamp(168px, 21vw, 248px)", aspectRatio: "4 / 3" }}
      /* The set turning on: a CRT comes up as a line and opens, it does not
         fade. The overshoot on the way out is the tube flaring as the floor
         takes over, which is why the exit scales up rather than away. */
      initial={{ scaleY: 0.014, opacity: 0.2 }}
      animate={
        leaving
          ? { scaleY: 1, opacity: 0, scale: 1.06 }
          : { scaleY: 1, opacity: 1 }
      }
      transition={
        leaving
          ? { duration: 0.42, ease: [0.4, 0, 1, 1] }
          : { duration: 0.34, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {/* The halo. The hero's television is lit by its own screen against a
          dark hillside; here it is a warm bloom on grey paper, which is the
          only way the glass reads as lit rather than as a white rectangle. */}
      <div
        className="pointer-events-none absolute"
        style={{
          inset: "-22%",
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(255,214,158,0.5) 0%, rgba(255,214,158,0.16) 52%, rgba(255,214,158,0) 100%)",
        }}
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          /* Barrel glass: the horizontal radius is the larger, the way a tube
             is wider than it is tall. Mostly moot under the feather below,
             but it keeps the shape honest if masks ever fail. */
          borderRadius: "14% / 18%",
          background:
            "radial-gradient(62% 66% at 47% 44%, #fffdf7 0%, #fff4e2 58%, #ffe6c6 100%)",
          /* He has no bezel, so a hard edge here is a rectangle of warm light
             sitting on grey paper and the eye goes to the rectangle before it
             goes to the face. Two crossed gradients feather all four sides at
             once, which keeps the tube's silhouette while letting the glass
             dissolve into the card. Sixteen per cent is the most the mask can
             take: the outermost face pixels start at twenty-nine. */
          ...FEATHER,
        }}
      >
        <svg
          className="absolute"
          style={{ left: "9%", top: "9%", width: "82%", height: "82%", mixBlendMode: "multiply" }}
          viewBox="0 0 16 12"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Same softening as the hero. The face is drawn by the tube, so
                nothing on it is allowed a perfect edge. */}
            <filter id="floor-boot-bloom" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="0.13" />
            </filter>
          </defs>

          <g filter="url(#floor-boot-bloom)" opacity="0.88">
            <motion.g animate={{ x: GAZE_X[phase] }} transition={LOOK}>
              <rect x={EYE.left.x} y={EYE.left.y} width="2" height="2" fill={FILL} />
              <rect x={EYE.right.x} y={EYE.right.y} width="2" height="2" fill={FILL} />
            </motion.g>

            {/* The mouth is six cells on one row. Neutral is the flat bar;
                the smile is the two end cells stepping up a row, which lands
                on exactly the shape the hero's face wears. One row of lift,
                not two — the rule from ScreenFace holds here. */}
            <rect x="6" y="9" width="4" height="1" fill={FILL} />
            {/* `y` on a motion element is a transform, not the attribute, so
                the row lives in the attribute and the lift is a translate of
                one cell. */}
            <motion.rect
              x="5"
              y="9"
              width="1"
              height="1"
              fill={FILL}
              initial={{ y: 0 }}
              animate={{ y: smiling ? -1 : 0 }}
              transition={{ type: "spring", stiffness: 620, damping: 26 }}
            />
            <motion.rect
              x="10"
              y="9"
              width="1"
              height="1"
              fill={FILL}
              initial={{ y: 0 }}
              animate={{ y: smiling ? -1 : 0 }}
              transition={{ type: "spring", stiffness: 620, damping: 26, delay: 0.04 }}
            />
          </g>
        </svg>

        {/* Scanlines over the whole glass, at the hero's weight. */}
        <div
          className="absolute inset-0"
          style={{
            mixBlendMode: "multiply",
            opacity: 0.16,
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(74,40,22,0.5) 0px, rgba(74,40,22,0.5) 1px, rgba(74,40,22,0) 1px, rgba(74,40,22,0) 2.5px)",
          }}
        />

        {/* The hot centre, on top of the face, for the same reason as in the
            hero: the glare has to wash out the face too or the face is the
            one object behind the glass. */}
        <div
          className="absolute inset-0"
          style={{
            mixBlendMode: "plus-lighter",
            background:
              "radial-gradient(58% 62% at 47% 45%, rgba(255,246,232,0.42) 0%, rgba(255,238,214,0.16) 55%, rgba(255,232,204,0) 100%)",
          }}
        />
      </div>
    </motion.div>
  );
}
