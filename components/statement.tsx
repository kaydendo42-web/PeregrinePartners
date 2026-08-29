"use client";

import { motion, useReducedMotion } from "motion/react";
import { CountUp, Reveal, ScrollHighlightText } from "./ui/motion-primitives";
import { StateMark } from "./ui/state-mark";
import { Cite } from "./ui/cite";
import { AgentAvatars } from "./art/agent-avatars";
import { agents, statement, states } from "@/lib/content";

/**
 * The thesis, then the evidence for it.
 *
 * The mosaic keeps the reference's measured geometry exactly — 339 / 291 /
 * 339 / 339 across four columns — but every cell now carries either a market
 * rate with its source or a labelled model. Nothing in here is a claim about
 * a customer, because there is not one we could honestly make yet.
 */
export function Statement() {
  return (
    <section className="w-full bg-[color:var(--page)] px-[12px]">
      <div className="band section-card pb-[120px] pt-[120px] md:pb-[172px] md:pt-[208px]">
        {/*
          A measure, so the block has the same air on both sides.
          
          The mosaic columns were fixed pixels, which is right at the 1440 the
          design was measured at and wrong above it: the cards stopped at 1338
          and every extra pixel of a wide screen piled up on the right, so the
          block sat 40px from the left edge and 550 from the right. The columns
          are ratios now and the whole section stops at the mosaic's own full
          width, centred. Nothing else on the home page carries a measure yet.
        */}
        <div className="measure">
          <ScrollHighlightText
            text={statement.text}
            className="t-statement max-w-[1030px]"
            dim="var(--ink-10)"
            lit="var(--ink)"
          />

          <Reveal delay={0.05}>
            <p className="t-body mt-[34px] max-w-[600px]">{statement.sub}</p>
          </Reveal>

          {/* metric mosaic, at the reference's 339 / 291 / 339 / 339 proportions */}
          <div className="mt-[40px] grid grid-cols-1 gap-[12px] md:grid-cols-2 xl:grid-cols-[339fr_291fr_339fr_339fr]">
            <CostCard />
            <div className="flex flex-col gap-[12px]">
              <AgentsCard />
              <StatesCard />
            </div>
            <ApprovalCard />
            <WorkedCard />
          </div>
        </div>
      </div>
    </section>
  );
}

const CARD = "relative overflow-hidden";
const R = 20;

/** What the branch it replaces already costs, at a rate you can check. */
function CostCard() {
  return (
    <Reveal className="h-full" delay={0.02}>
      <div
        className={`${CARD} flex h-[378px] flex-col p-[24px]`}
        style={{ background: "var(--ink)", borderRadius: R }}
      >
        <div
          className="flex h-[60px] w-[60px] items-center justify-center"
          style={{ background: "#fff", borderRadius: "var(--r-btn-inner)" }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <rect
              x="2"
              y="6"
              width="20"
              height="12"
              rx="2.4"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            <path
              d="M5.5 9.5v5M18.5 9.5v5"
              stroke="var(--ink)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p
          className="mt-[14px] block h-[43px] text-white"
          style={{
            fontSize: 43,
            lineHeight: "43px",
            letterSpacing: "-2px",
            fontWeight: 400,
          }}
        >
          <CountUp
            to={statement.cost.value}
            prefix={statement.cost.prefix}
            duration={1.8}
          />
        </p>

        <p className="t-label mt-auto max-w-[349px] text-white">
          {statement.cost.caption}
        </p>
        <Cite keys={statement.cost.source} tone="dark" className="mt-[12px]" />
      </div>
    </Reveal>
  );
}

/**
 * The nine agents.
 *
 * Sits where the template put its avatar stack, and does the same job: an
 * owner should see a team here, not a feature list. Ours are branches rather
 * than stock faces, and they carry the only colour on the page.
 */
function AgentsCard() {
  return (
    <Reveal delay={0.06}>
      <div
        className={`${CARD} flex h-[252px] flex-col justify-between p-[24px]`}
        style={{ background: "#fff", borderRadius: R }}
      >
        <p
          style={{
            fontSize: 20,
            lineHeight: "27px",
            fontWeight: 500,
            letterSpacing: "-0.4px",
          }}
        >
          {agents.heading}
        </p>

        <AgentAvatars />

        <p className="t-label" style={{ color: "var(--ink-60)" }}>
          {agents.caption}
        </p>
      </div>
    </Reveal>
  );
}

/**
 * The signature device, stated once and plainly.
 *
 * Three marks and three words in the short slot. It makes no numeric claim, so
 * it is the one card that needs no source line — which is exactly why it can
 * live in the 95px row that has no space for one.
 */
function StatesCard() {
  return (
    <Reveal delay={0.1}>
      <div
        className={`${CARD} flex h-[114px] flex-col justify-center gap-[12px] px-[24px]`}
        style={{ borderRadius: R, border: "1px dashed var(--ink-20)" }}
      >
        <p
          style={{
            fontSize: 15,
            lineHeight: "20px",
            fontWeight: 500,
            letterSpacing: "-0.2px",
          }}
        >
          {statement.statesCard.heading}
        </p>
        <ul className="flex flex-wrap items-center gap-x-[16px] gap-y-[6px]">
          {states.map((st, i) => (
            <motion.li
              key={st.key}
              className="flex items-center gap-[7px]"
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.1 + i * 0.09,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <StateMark state={st.key} tone="light" size="sm" />
              <span
                style={{
                  fontSize: 12,
                  lineHeight: "16px",
                  fontWeight: 400,
                  color: "var(--ink-60)",
                }}
              >
                {st.label}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/**
 * How the agents are built, argued with someone else's guidance, not ours.
 *
 * The dial runs rather than resolves. Forty-eight ticks go round and a sweep
 * travels them, over and over, and every pass halts dead at the one tick that
 * needs a person. It never reaches the ticks past it. That is the card's
 * sentence drawn instead of written: the work runs on its own until it meets
 * the thing it is not allowed to decide, and then it waits, and then it goes
 * again. A dial that filled would say the opposite.
 *
 * It loops because the departments do. A once-on-scroll animation said this
 * happened one night; a loop says it happens every night.
 */
function ApprovalCard() {
  const still = useReducedMotion();
  const ticks = Array.from({ length: 48 });

  /* One pass, in seconds: the sweep out to the stop, then a hold on it. Every
     tick shares the cycle length and is offset by its own delay, so the
     stagger is what makes the sweep travel rather than the timing. */
  const STOP = 34;
  const STEP = 0.045;
  const FLASH = 0.5;
  const HOLD = 1.4;
  const CYCLE = STOP * STEP + FLASH + HOLD;

  return (
    <Reveal delay={0.14} className="h-full">
      <div
        className={`${CARD} flex h-[378px] flex-col justify-between p-[24px]`}
        style={{ background: "var(--ink-06)", borderRadius: R }}
      >
        <div className="relative mx-auto mt-[2px] flex h-[140px] w-[149px] items-center justify-center">
          <svg
            viewBox="0 0 160 160"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {ticks.map((_, i) => {
              const angle = (i / ticks.length) * Math.PI * 2 - Math.PI / 2;
              const inner = 48;
              const stop = i === STOP;
              const len = stop ? 26 : 13 + ((i * 5) % 9);
              const r2 = (n: number) => Number(n.toFixed(2));
              const x1 = r2(80 + Math.cos(angle) * inner);
              const y1 = r2(80 + Math.sin(angle) * inner);
              const x2 = r2(80 + Math.cos(angle) * (inner + len));
              const y2 = r2(80 + Math.sin(angle) * (inner + len));

              /* Past the stop the sweep never arrives, so those ticks sit at
                 the floor value and stay there. */
              const swept = i < STOP;

              return (
                <motion.line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--ink)"
                  strokeWidth={stop ? "2.4" : "1.1"}
                  strokeLinecap="round"
                  initial={{ opacity: stop ? 1 : 0.14 }}
                  whileInView={
                    still || stop
                      ? { opacity: stop ? 1 : 0.14 }
                      : swept
                        ? { opacity: [0.14, 0.72, 0.14] }
                        : { opacity: 0.14 }
                  }
                  viewport={{ once: true }}
                  transition={
                    still || !swept
                      ? { duration: 0.3 }
                      : {
                          duration: FLASH,
                          delay: i * STEP,
                          repeat: Infinity,
                          repeatDelay: CYCLE - FLASH,
                          ease: "easeOut",
                        }
                  }
                />
              );
            })}

            {/* The ring the sweep throws off when it lands on the stop. It is
                the only thing on the card that reads as an arrival. */}
            {still ? null : (
              <motion.circle
                cx="80"
                cy="80"
                r="30"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: [0, 0.32, 0], scale: [0.8, 1.5, 1.5] }}
                viewport={{ once: true }}
                style={{ transformOrigin: "80px 80px" }}
                transition={{
                  duration: 1.1,
                  delay: STOP * STEP,
                  repeat: Infinity,
                  repeatDelay: CYCLE - 1.1,
                  ease: "easeOut",
                }}
              />
            )}
          </svg>

          <div
            className="flex h-[56px] w-[56px] items-center justify-center rounded-full"
            style={{ background: "var(--ink)" }}
          >
            <StateMark state="brief" size="lg" tone="dark" />
          </div>
        </div>

        <div>
          <h4
            style={{
              fontSize: 20,
              lineHeight: "28px",
              letterSpacing: "-0.4px",
              color: "var(--ink-80)",
            }}
          >
            {statement.approval.title}
          </h4>
          <p
            className="t-label mt-[8px] max-w-[349px]"
            style={{ color: "var(--ink-60)" }}
          >
            {statement.approval.caption}
          </p>
          <Cite keys={statement.approval.source} className="mt-[10px]" />
        </div>
      </div>
    </Reveal>
  );
}

/**
 * The worked example, in the form it leaves the product in.
 *
 * This is the strongest evidence on the site, and it used to be a sentence.
 * Set as supplier lines it makes the same argument twice over: the saving is
 * the figure at the bottom, and the mechanic is right there in the two state
 * marks, one routine move handled and one decision left standing. The card
 * language is the site's, not the floor's. This is still the home page.
 */
function WorkedCard() {
  const { label, lines, figure, attribution } = statement.worked;
  return (
    <Reveal delay={0.18} className="h-full">
      <div
        className={`${CARD} flex h-[378px] flex-col p-[24px]`}
        style={{ background: "#fff", borderRadius: R }}
      >
        <div className="flex items-center justify-between">
          <span className="t-mono" style={{ color: "var(--ink-40)" }}>
            {label}
          </span>
          {/* the brief: both states at once, which is what this card holds */}
          <StateMark state="brief" size="md" tone="light" />
        </div>

        <ul className="mt-[12px] flex flex-col">
          {lines.map((l) => (
            <li
              key={l.item}
              className="flex flex-col gap-[4px] py-[11px]"
              style={{ borderTop: "1px solid var(--ink-10)" }}
            >
              <div className="flex items-baseline justify-between gap-[10px]">
                <span
                  style={{
                    fontSize: 16,
                    lineHeight: "22px",
                    fontWeight: 500,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {l.item}
                </span>
                <span
                  className="font-mono shrink-0"
                  style={{
                    fontSize: 14,
                    lineHeight: "20px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {l.move}
                </span>
              </div>
              <div className="flex items-center justify-between gap-[10px]">
                <span className="t-label" style={{ color: "var(--ink-60)" }}>
                  {l.action}
                </span>
                <StateMark state={l.state} size="sm" tone="light" />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <p
            style={{
              fontSize: 21,
              lineHeight: "27px",
              fontWeight: 500,
              letterSpacing: "-0.5px",
            }}
          >
            {figure}
          </p>
          <p
            className="t-label mt-[8px] flex items-start gap-[8px]"
            style={{ color: "var(--ink-60)" }}
          >
            <span
              className="mt-[7px] inline-block h-[4px] w-[4px] shrink-0 rounded-full"
              style={{ background: "var(--ink-40)" }}
            />
            {attribution}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
