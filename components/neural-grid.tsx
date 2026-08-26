"use client";

import { motion } from "motion/react";
import { Reveal } from "./ui/motion-primitives";
import { Button } from "./ui/button";
import { neural } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export function NeuralGrid() {
  return (
    <section
      id="neural"
      className="w-full bg-[color:var(--dark)] px-[24px] py-[180px] md:px-[60px]"
    >
      <div className="w-full">
        {/* top row */}
        <div className="flex flex-col items-start gap-[40px] lg:flex-row lg:items-center lg:justify-between">
          <Reveal>
            <p
              className="max-w-[380px] font-mono uppercase text-white"
              style={{ fontSize: 12, lineHeight: "20.4px", fontWeight: 200 }}
            >
              {neural.mono}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <ModelCluster />
          </Reveal>

          <Reveal delay={0.14}>
            <Button href="#faq" variant="secondary">
              {neural.chip}
            </Button>
          </Reveal>
        </div>

        {/* feature grid */}
        <div className="mt-[80px] grid grid-cols-1 gap-x-[50px] gap-y-[64px] sm:grid-cols-2 xl:grid-cols-4">
          {neural.features.map((f, i) => (
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
                <p className="t-body-sm mt-[31px] max-w-[210px] text-white">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Four overlapping model badges with a soft left-cast shadow. */
function ModelCluster() {
  return (
    <div className="flex items-center">
      {neural.models.map((src, i) => (
        <motion.span
          key={src}
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
        >
          {/* The marks ship as white glyphs on transparent — drawn for a dark
              ground. On the white badge they need inverting to read at all. */}
          <img
            src={src}
            alt=""
            aria-hidden
            className="h-[21px] w-[21px] object-contain"
            style={{ filter: "invert(1)" }}
          />
        </motion.span>
      ))}
    </div>
  );
}


/** The four capability marks, each carrying its own small loop. */
function FeatureIcon({ kind }: { kind: string }) {
  if (kind === "search") return <SearchIcon />;
  if (kind === "orbit") return <OrbitIcon />;
  if (kind === "faders") return <FaderIcon />;
  return <LanguageIcon />;
}

function SearchIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden>
      <circle cx="20" cy="18" r="12" stroke="#fff" strokeWidth="1.4" />
      <path d="M11.6 27.2L4 44" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <motion.g
        animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "34px 8px", transformBox: "view-box" }}
      >
        <path d="M34 3l1.5 3.8L39 8l-3.5 1.4L34 13l-1.4-3.6L29 8l3.6-1.2z" fill="#fff" />
      </motion.g>
      <path d="M40 18l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#fff" opacity="0.85" />
    </svg>
  );
}

function OrbitIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden>
      <circle cx="26" cy="28" r="17" stroke="#fff" strokeWidth="1.3" />
      <circle cx="26" cy="28" r="7" fill="#fff" />
      <motion.g
        style={{ transformOrigin: "26px 28px", transformBox: "view-box" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="26" cy="11" r="4" fill="#fff" />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "26px 28px", transformBox: "view-box" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="43" cy="28" r="2.6" fill="#fff" opacity="0.85" />
      </motion.g>
    </svg>
  );
}

function FaderIcon() {
  const rails = [0, 1, 2, 3];
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden>
      {rails.map((i) => (
        <g key={i}>
          <rect x={12 + i * 8} y="6" width="1" height="44" fill="#fff" />
          <motion.rect
            x={9 + i * 8}
            width="7"
            height="3"
            fill="#fff"
            animate={{ y: [10 + i * 6, 34 - i * 5, 10 + i * 6] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        </g>
      ))}
    </svg>
  );
}

function LanguageIcon() {
  const codes = ["ZH", "HI", "ES", "FR", "AR", "BN", "PT", "RU", "EN", "DE"];
  return (
    <div className="relative flex h-[44px] w-[40px] flex-col items-center justify-center">
      <svg width="10" height="6" viewBox="0 0 10 6" className="mb-[3px]" aria-hidden>
        <path d="M0 0h10L5 6z" fill="#fff" />
      </svg>
      <div
        className="relative flex h-[26px] w-[34px] items-center overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)",
        }}
      >
        <span className="absolute left-0 top-0 h-full w-[1px] bg-white/70" />
        <span className="absolute right-0 top-0 h-full w-[1px] bg-white/70" />
        <motion.div
          className="flex items-center whitespace-nowrap"
          animate={{ x: ["0px", "-260px"] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        >
          {[...codes, ...codes].map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="shrink-0 text-center text-white"
              style={{
                fontFamily: "var(--font-mono-ui), ui-monospace, monospace",
                fontSize: 15,
                lineHeight: "19.2px",
                letterSpacing: "0.02em",
                width: 21,
              }}
            >
              {c}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
