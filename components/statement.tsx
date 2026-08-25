"use client";

import { motion } from "motion/react";
import { CountUp, Reveal, ScrollHighlightText } from "./ui/motion-primitives";
import { ClientMark } from "./ui/client-mark";
import { statement } from "@/lib/content";

export function Statement() {
  return (
    <section className="w-full bg-[color:var(--page)] px-[12px]">
      <div className="section-card px-[24px] pb-[40px] pt-[120px] md:px-[40px] md:pt-[196px]">
        <ScrollHighlightText
          text={statement.text}
          className="t-statement max-w-[1030px]"
          dim="var(--ink-10)"
          lit="var(--ink)"
        />

        <Reveal delay={0.05}>
          <p className="t-body mt-[64px] max-w-[600px]">{statement.sub}</p>
        </Reveal>

        {/* metric mosaic */}
        <div className="mt-[68px] grid grid-cols-1 gap-[10px] md:grid-cols-2 xl:grid-cols-[339px_291px_339px_339px]">
          <RevenueCard />
          <div className="flex flex-col gap-[10px]">
            <AgentsCard />
            <SpeedCard />
          </div>
          <InferenceCard />
          <QuoteCard />
        </div>
      </div>
    </section>
  );
}

const CARD = "relative overflow-hidden";
const R = 30;

function RevenueCard() {
  return (
    <Reveal className="h-full" delay={0.02}>
      <div
        className={`${CARD} flex h-[315px] flex-col justify-between p-[24px]`}
        style={{ background: "var(--ink)", borderRadius: R }}
      >
        <div
          className="flex h-[60px] w-[60px] items-center justify-center"
          style={{ background: "#fff", borderRadius: 16 }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 17l5.5-5.5 3.5 3.5L20 7" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 7h5v5" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p
          className="mt-auto text-white"
          style={{ fontSize: 43, lineHeight: "43px", letterSpacing: "-2px", fontWeight: 400 }}
        >
          <CountUp to={45} prefix="$" suffix="M" duration={2} />
        </p>

        <p className="t-label mt-[16px] max-w-[291px] text-white">
          Revenue generated for our clients through AI-led optimisation.
        </p>
      </div>
    </Reveal>
  );
}

function AgentsCard() {
  const faces = ["#8ec5a1", "#c9b6f2", "#f3c667", "#f0a3a3"];
  return (
    <Reveal delay={0.06}>
      <div
        className={`${CARD} flex h-[205px] flex-col items-center justify-center gap-[16px]`}
        style={{
          borderRadius: R,
          border: "1px dashed var(--ink-20)",
        }}
      >
        <div className="flex items-center">
          {faces.map((c, i) => (
            <motion.span
              key={c}
              className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full ring-[3px] ring-[color:var(--surface)]"
              style={{ background: c, marginLeft: i === 0 ? 0 : -13, zIndex: faces.length - i }}
              initial={{ scale: 0.7, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 320, damping: 22 }}
            >
              <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
                <circle cx="16" cy="12" r="5.4" fill="rgba(0,0,0,0.35)" />
                <path d="M5 30c1.6-6.2 6-9.4 11-9.4S25.4 23.8 27 30z" fill="rgba(0,0,0,0.35)" />
              </svg>
            </motion.span>
          ))}
        </div>
        <p className="t-label" style={{ color: "var(--ink-80)" }}>
          <strong style={{ fontWeight: 700 }}>15,400</strong> active agents
        </p>
      </div>
    </Reveal>
  );
}

function SpeedCard() {
  return (
    <Reveal delay={0.1}>
      <div
        className={`${CARD} flex h-[95px] items-center gap-[26px] px-[27px] py-[20px]`}
        style={{ background: "var(--ink-06)", borderRadius: R }}
      >
        <p style={{ fontSize: 43, lineHeight: "43px", letterSpacing: "-2px", color: "var(--dark-3)" }}>
          <CountUp to={5} suffix="x" duration={1.6} />
        </p>
        <p className="t-label" style={{ color: "var(--ink-60)" }}>
          Faster speed to market.
        </p>
      </div>
    </Reveal>
  );
}

function InferenceCard() {
  const ticks = Array.from({ length: 48 });
  return (
    <Reveal delay={0.14} className="h-full">
      <div
        className={`${CARD} flex h-[315px] flex-col justify-between p-[24px]`}
        style={{ background: "var(--ink-06)", borderRadius: R }}
      >
        <div className="relative mx-auto mt-[6px] flex h-[153px] w-[149px] items-center justify-center">
          <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full" aria-hidden>
            {ticks.map((_, i) => {
              const angle = (i / ticks.length) * Math.PI * 2 - Math.PI / 2;
              const inner = 52;
              const len = 12 + ((i * 7) % 11);
              // rounded so server and client render byte-identical coordinates
              const r2 = (n: number) => Number(n.toFixed(2));
              const x1 = r2(80 + Math.cos(angle) * inner);
              const y1 = r2(80 + Math.sin(angle) * inner);
              const x2 = r2(80 + Math.cos(angle) * (inner + len));
              const y2 = r2(80 + Math.sin(angle) * (inner + len));
              return (
                <motion.line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--ink)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  initial={{ opacity: 0.15 }}
                  whileInView={{ opacity: [0.15, 0.75, 0.35] }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: i * 0.015, ease: "easeOut" }}
                />
              );
            })}
          </svg>
          <div
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full"
            style={{ background: "var(--ink)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3c3 2.2 4.6 5.3 4.6 8.6L18.4 14l-2.6 1.1c-.5 1.3-1.4 2.5-2.4 3.4h-2.8c-1-.9-1.9-2.1-2.4-3.4L5.6 14l1.8-2.4C7.4 8.3 9 5.2 12 3z"
                stroke="#fff"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10.4" r="1.7" fill="#fff" />
            </svg>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 20, lineHeight: "28px", letterSpacing: "-0.4px", color: "var(--ink-80)" }}>
            Inference speed
          </h4>
          <p className="t-label mt-[10px] max-w-[291px]" style={{ color: "var(--ink-60)" }}>
            Real-time processing for enterprise-grade deployments.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function QuoteCard() {
  return (
    <Reveal delay={0.18} className="h-full">
      <div
        className={`${CARD} flex h-[315px] flex-col justify-between p-[24px]`}
        style={{ background: "#fff", borderRadius: R }}
      >
        <div className="flex items-start justify-between">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
            <path
              d="M8 22c0-6 3.4-10.4 8.6-12l1.2 2.6C14.6 14 12.8 16.2 12.6 19H17v9H8zm14 0c0-6 3.4-10.4 8.6-12l1.2 2.6C28.6 14 26.8 16.2 26.6 19H31v9h-9z"
              fill="var(--ink)"
            />
          </svg>
          <div className="opacity-70">
            <ClientMark name="Northlake" scale={0.72} />
          </div>
        </div>

        <p
          className="mt-auto"
          style={{ fontSize: 18, lineHeight: "25.2px", color: "var(--ink-80)" }}
        >
          Twelve weeks in, our support queue is 80% shorter and satisfaction is up — and the model never leaves our own hardware.
        </p>

        <p className="t-label mt-[18px] flex items-center gap-[8px]" style={{ color: "var(--ink-60)" }}>
          <span className="inline-block h-[4px] w-[4px] rounded-full" style={{ background: "var(--ink-40)" }} />
          CTO, Northlake Care
        </p>
      </div>
    </Reveal>
  );
}
