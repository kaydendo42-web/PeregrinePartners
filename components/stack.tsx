"use client";

import { motion } from "motion/react";
import { Reveal } from "./ui/motion-primitives";
import { Button } from "./ui/button";
import { stack } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * What it runs on, and the four things that are true of all nine branches.
 *
 * The template used this slot to show off frontier model logos, which is an
 * argument aimed at engineers. The person reading this owns a café, so the
 * four cells answer their questions instead: what can it touch, can I check
 * it, when does it run, and do I have to take all of it.
 */
export function Stack() {
  return (
    <section id="stack" className="w-full bg-[color:var(--dark)] px-[24px] py-[120px] md:py-[180px] md:px-[40px]">
      <div className="w-full">
        {/* top row */}
        <div className="flex flex-col items-start gap-[40px] lg:flex-row lg:items-center lg:justify-between">
          <Reveal>
            <p
              className="max-w-[420px] font-mono uppercase text-white"
              style={{ fontSize: 12, lineHeight: "20.4px", fontWeight: 200 }}
            >
              {stack.mono}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <SystemCluster />
          </Reveal>

        </div>

        {/* feature grid */}
        <div className="mt-[80px] grid grid-cols-1 gap-x-[50px] gap-y-[64px] sm:grid-cols-2 xl:grid-cols-4">
          {stack.features.map((f, i) => (
            <Reveal key={f.icon} delay={i * 0.08}>
              <div className="flex w-full max-w-[293px] flex-col">
                <div className="flex h-[55px] items-end">
                  <FeatureIcon kind={f.icon} />
                </div>
                <motion.span
                  className="mt-[30px] block h-[1px] w-full"
                  style={{ background: "var(--paper-10)" }}
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.08 }}
                />
                <p className="t-body-sm mt-[31px] max-w-[240px] text-white">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The systems, as a stack of accounts.
 *
 * Set as initials rather than the real marks: these are systems we read and
 * write through, and reproducing someone's logo on our own page is a claim of
 * relationship we have not been given. The overlap is the point — they are one
 * pipeline from where the owner sits, not four subscriptions.
 */
function SystemCluster() {
  return (
    <div className="flex items-center">
      {stack.marks.map((name, i) => (
        <motion.span
          key={name}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white"
          style={{
            marginLeft: i === 0 ? 0 : -14,
            zIndex: i,
            boxShadow: `rgba(0,0,0,${i === 0 ? 0.08 : 0.12}) -7px 0px 5px 1px`,
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 340, damping: 22 }}
          whileHover={{ y: -4 }}
          title={name}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
            }}
          >
            {name.slice(0, 2)}
          </span>
        </motion.span>
      ))}
      <span className="sr-only">{`Runs on ${stack.marks.join(", ")} and others`}</span>
    </div>
  );
}

function FeatureIcon({ kind }: { kind: string }) {
  if (kind === "search") return <ReadWriteIcon />;
  if (kind === "orbit") return <TraceIcon />;
  if (kind === "faders") return <NightIcon />;
  return <IndexIcon />;
}

/** Reads freely, writes only through a gate that a person opens. */
function ReadWriteIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden>
      <line x1="2" y1="16" x2="34" y2="16" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M28 10l6 6-6 6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line
        x1="2"
        y1="36"
        x2="34"
        y2="36"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 4"
        opacity="0.5"
      />
      {/* the gate: shut until a person opens it */}
      <motion.g
        animate={{ opacity: [1, 0.45, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="40" y="28" width="10" height="8" rx="1.6" fill="#fff" />
        <path d="M42 28v-3a3 3 0 016 0" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

/** A figure, and the line back to where it came from. */
function TraceIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden>
      <rect x="2" y="6" width="20" height="26" rx="2.4" stroke="#fff" strokeWidth="1.3" />
      <line x1="7" y1="13" x2="17" y2="13" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
      <line x1="7" y1="19" x2="17" y2="19" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
      <line x1="7" y1="25" x2="13" y2="25" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
      <motion.path
        d="M22 26c10 0 12 8 12 14"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="2 3"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
      />
      <circle cx="40" cy="40" r="9" fill="#fff" />
      <text x="40" y="44" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--dark)">
        $
      </text>
    </svg>
  );
}

/** Close to open: the arc it works inside. */
function NightIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden>
      <line x1="2" y1="42" x2="50" y2="42" stroke="#fff" strokeWidth="1.2" opacity="0.35" />
      <path
        d="M8 42C8 24 16 12 26 12s18 12 18 30"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/*
        The dot travels by translating its group rather than by animating cx
        and cy. Motion reads an SVG geometry attribute's start value off the
        element's style, where it does not live, so keyframing cx directly
        renders one frame of `undefined` and SVG rejects it out loud on every
        mount.
      */}
      <motion.g
        animate={{ x: [8, 17, 26, 35, 44], y: [42, 21, 12, 21, 42] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="0" cy="0" r="4" fill="#fff" />
      </motion.g>
    </svg>
  );
}

/** Nine branches; take three to start. */
function IndexIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => {
        const cx = 8 + (i % 3) * 18;
        const cy = 8 + Math.floor(i / 3) * 18;
        const taken = i < 3;
        return taken ? (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="6"
            fill="#fff"
            initial={{ scale: 0.7, opacity: 0.4 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 320, damping: 20 }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}
          />
        ) : (
          <circle key={i} cx={cx} cy={cy} r="6" stroke="#fff" strokeWidth="1.2" opacity="0.32" />
        );
      })}
    </svg>
  );
}
