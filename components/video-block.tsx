"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Reveal } from "./ui/motion-primitives";
import { video } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Full-bleed still that reads as a film frame: 1440×855 in the reference,
 * caption and runtime up top, the section title anchored to the floor, and a
 * play target dead centre. The still itself does not move — the frame is
 * meant to sit still while the page travels past it.
 *
 * The source template's play mark is inert: a stack of divs with a pointer
 * cursor and nothing behind it. Ours is the same until `video.src` is set,
 * at which point it becomes a real control and plays the film in place —
 * rather than a button that announces itself and then does nothing.
 */
export function VideoBlock() {
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playable = Boolean(video.src);

  return (
    <section
      id="film"
      aria-label={video.heading}
      className="relative w-full overflow-hidden bg-[color:var(--dark)]"
      style={{ borderRadius: "0 0 20px 20px" }}
    >
      <div className="relative h-[560px] w-full sm:h-[660px] xl:h-[855px]">
        {playing && video.src ? (
          <video
            src={video.src}
            className="absolute inset-0 h-full w-full object-cover"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <>
            <motion.img
              src={video.image}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              animate={{ scale: armed ? 1.03 : 1 }}
              transition={{ duration: 1.2, ease: EASE }}
            />

            {/* legibility wash — top and bottom only, so the middle stays clean */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(26,26,26,0.5) 0%, rgba(26,26,26,0) 26%, rgba(26,26,26,0) 62%, rgba(26,26,26,0.68) 100%)",
              }}
            />

            {/* hover fill, matching the reference's 0-opacity dark layer */}
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[color:var(--dark)]"
              animate={{ opacity: armed ? 0.26 : 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            />

            {/* content */}
            <div className="absolute inset-0 flex flex-col justify-between px-[24px] py-[56px] md:px-[40px] md:py-[100px]">
              <div className="flex flex-col gap-[16px] sm:flex-row sm:items-start sm:justify-between sm:gap-[24px]">
                <Reveal y={16} blur={4}>
                  <p className="t-body max-w-[380px] text-white">{video.caption}</p>
                </Reveal>

                <Reveal delay={0.08} y={16} blur={4} className="shrink-0 self-start">
                  <span
                    className="flex shrink-0 items-center"
                    style={{
                      background: "var(--paper-06)",
                      borderRadius: 100,
                      padding: "6px 14px 6px 6px",
                      gap: 6,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <Stopwatch />
                    <span className="t-label whitespace-nowrap text-white">{video.duration}</span>
                  </span>
                </Reveal>
              </div>

              <div className="flex items-end justify-between gap-[24px]">
                <Reveal delay={0.06} y={16} blur={4} className="min-w-0">
                  <h2 className="t-display max-w-[400px] text-white">{video.heading}</h2>
                </Reveal>

                {/* the house capsule, set large on the floor of the frame */}
                <Reveal delay={0.12} y={16} blur={4} className="hidden md:block">
                  <span
                    className="flex items-center justify-center rounded-full bg-white"
                    style={{ width: 135, height: 83 }}
                    aria-hidden
                  >
                    <span
                      className="block rounded-full"
                      style={{ width: 86, height: 38, background: "var(--dark)" }}
                    />
                  </span>
                </Reveal>
              </div>
            </div>

            {/* play target */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <PlayMark
                armed={armed}
                setArmed={setArmed}
                onPlay={playable ? () => setPlaying(true) : undefined}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function PlayMark({
  armed,
  setArmed,
  onPlay,
}: {
  armed: boolean;
  setArmed: (v: boolean) => void;
  /** Absent while there is no film: the mark stays decoration. */
  onPlay?: () => void;
}) {
  const rings = (
    <>
      <motion.span
        className="absolute inset-0 rounded-full border border-white/45"
        animate={{ opacity: armed ? 1 : 0.75, scale: armed ? 1.04 : 1 }}
        transition={{ duration: 0.45, ease: EASE }}
      />
      <motion.span
        className="absolute inset-0 rounded-full border border-white/15"
        animate={{ opacity: armed ? [0.6, 0] : 0, scale: armed ? [1, 1.45] : 1 }}
        transition={{ duration: 1.6, repeat: armed ? Infinity : 0, ease: "easeOut" }}
      />
      <svg width="32" height="38" viewBox="0 0 32 38" aria-hidden className="relative">
        <path
          d="M2 2.6v32.8a1.5 1.5 0 0 0 2.28 1.28l27.3-16.4a1.5 1.5 0 0 0 0-2.56L4.28 1.32A1.5 1.5 0 0 0 2 2.6Z"
          fill="#fff"
        />
      </svg>
    </>
  );

  const shell =
    "pointer-events-auto relative flex h-[96px] w-[96px] items-center justify-center rounded-full";

  if (!onPlay) {
    return (
      <motion.span
        className={`${shell} cursor-pointer`}
        onHoverStart={() => setArmed(true)}
        onHoverEnd={() => setArmed(false)}
        aria-hidden
      >
        {rings}
      </motion.span>
    );
  }

  return (
    <motion.button
      type="button"
      aria-label={`Play — ${video.duration}`}
      onClick={onPlay}
      onHoverStart={() => setArmed(true)}
      onHoverEnd={() => setArmed(false)}
      onFocus={() => setArmed(true)}
      onBlur={() => setArmed(false)}
      className={`${shell} cursor-pointer`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      {rings}
    </motion.button>
  );
}

/* Phosphor "timer", matching the reference's runtime chip. */
function Stopwatch() {
  return (
    <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden className="text-white">
      <path d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z" />
    </svg>
  );
}
