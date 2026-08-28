"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Marquee } from "./ui/motion-primitives";
import { ClientMark } from "./ui/client-mark";
import { FloorCard } from "./art/floor-card";
import { hero } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The opening sheet, and it fills whatever screen it opens on.
 *
 * The reference measured 876px here, which the rebuild carried as a hard
 * `md:min-h`. That capped the hero: on anything taller than about 900px the
 * card stopped short and the section below it started peeking over the fold,
 * which reads as a page that has already begun rather than one about to. The
 * 876 stays as a floor so a short laptop never crushes the headline, the card
 * and the rail into each other; above that the viewport wins.
 *
 * `svh` rather than `vh` because on a phone `vh` is the height with the
 * browser chrome retracted, so the rail sits under the address bar until the
 * reader scrolls.
 */
export function Hero() {
  return (
    <section id="top" className="w-full bg-[color:var(--page)] p-[12px]">
      <div className="section-card relative flex min-h-[calc(100svh_-_24px)] flex-col justify-between px-[24px] pb-[40px] pt-[130px] md:min-h-[max(876px,calc(100svh_-_24px))] md:px-[40px] md:pt-[190px]">
        {/* Backdrop. The reference holds this dead still through the whole
            scroll — a parallax here is the one difference the eye catches
            first, because the horizon moves against the fixed nav. */}
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 20 }}>
          <img
            src={hero.bgFront}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
          />
          {/* The plate's own dark grass is what the white trust line and the
              rail sit on. Now that the card grows with the viewport, the crop
              shifts and that ground slides up out from under them. This puts a
              floor back under the bottom fifth and touches nothing above it,
              so the photograph still reads as itself. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]"
            style={{ background: "linear-gradient(to bottom, rgba(12,14,12,0) 0%, rgba(12,14,12,0.5) 100%)" }}
          />
        </div>

        {/* headline row */}
        <div className="relative flex w-full flex-1 flex-col items-start justify-between gap-[40px] lg:flex-row lg:gap-8">
          <div className="w-full max-w-[660px]">
            <h1 className="t-hero">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  style={{ color: "var(--ink-40)" }}
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: EASE, delay: 0.05 }}
                >
                  {hero.headlineDim.map((line) => (
                    <span key={line} className="inline md:block">
                      {line}{" "}
                    </span>
                  ))}
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: EASE, delay: 0.16 }}
                >
                  {/* The rag in `content` is set for the desktop card, where a
                      television in the photograph puts a hard ceiling on line
                      width. A phone is narrower than any of those lines, so it
                      reflows on its own rather than orphaning a word. */}
                  {hero.headlineLit.map((line) => (
                    <span key={line} className="inline md:block">
                      {line}{" "}
                    </span>
                  ))}
                </motion.span>
              </span>
            </h1>

            <motion.div
              className="mt-[36px]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.42 }}
            >
              <Button href={hero.cta.href}>{hero.cta.label}</Button>
            </motion.div>
          </div>

          {/* the platform card — the one thing on this page you can go and use */}
          <motion.div
            className="w-full shrink-0 sm:w-[224px]"
            initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: EASE, delay: 0.3 }}
          >
            <Link
              href={hero.card.href}
              className="group flex w-full flex-col overflow-hidden"
              style={{ background: "var(--ink)", borderRadius: 18, padding: 5 }}
            >
              <div
                className="h-[154px] w-full overflow-hidden"
                style={{ borderRadius: 14, background: "var(--dark)" }}
              >
                <FloorCard />
              </div>
              <div
                className="mt-[5px] flex items-center justify-between gap-[8px] px-[12px] py-[11px]"
                style={{ background: "#fff", borderRadius: 14 }}
              >
                <div className="min-w-0">
                  <p style={{ color: "var(--ink)", fontSize: 13, lineHeight: "18px" }}>
                    {hero.card.title}
                  </p>
                  <p
                    style={{
                      color: "var(--ink-70)",
                      fontSize: 10.5,
                      lineHeight: "15px",
                      fontWeight: 300,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {hero.card.meta}
                  </p>
                </div>
                <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-[color:var(--ink)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[4px]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 12h13M12 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* the floor line and the connection rail */}
        <div className="relative">
          <motion.p
            className="t-label max-w-[420px] text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}
          >
            {hero.trust}
          </motion.p>

          <motion.p
            className="mt-[16px] font-mono uppercase text-white/50"
            style={{ fontSize: 11, lineHeight: "18px", letterSpacing: "0.08em" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.85 }}
          >
            {hero.railLabel}
          </motion.p>

          {/* The products' own symbols, white on the photograph. They identify
              what Peregrine connects to; the label above them keeps the claim
              to what the reader already pays for rather than to a partnership
              none of these companies has agreed to. */}
          <div className="mt-[10px] -mx-[24px] md:-mx-[40px]">
            <Marquee duration={44}>
              {hero.rail.map((name, i) => (
                <div
                  key={`${name}-${i}`}
                  className="flex h-[57px] shrink-0 items-center justify-center px-[28px]"
                >
                  <ClientMark name={name} tone="light" scale={0.82} />
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
