"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { agents } from "@/lib/content";

/**
 * The departments, as a row of discs.
 *
 * The template ran a stack of illustrated faces here under a headline count of
 * active agents. The mechanic is worth keeping: an overlapping row of people
 * reads as staff, where a list of automations reads as a settings page. What
 * is not worth keeping is the faces, which were stock illustrations of nobody.
 *
 * So each disc is a department instead, wearing its own colour and carrying
 * the glyph for the work it does, in the order the two department sections
 * number them. This is the only colour on the site, and it is doing a job:
 * distinct hues make the row read as separate hands rather than one process.
 *
 * Pointing at a disc lifts it, drains the others, and names it in the line
 * below. The name goes below rather than in a floating tooltip because the
 * card is 252px tall inside a mosaic: a tooltip would either clip on the card
 * or sit on top of the card next to it. A reserved line cannot do either, and
 * it holds its height whether or not anything is named, so nothing under the
 * row moves when the pointer crosses it.
 */
export function AgentAvatars({ size = 36, overlap = 11 }: { size?: number; overlap?: number }) {
  const still = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  const current = agents.roster.find((a) => a.n === active) ?? null;

  return (
    <div>
      <ul className="flex items-center" onMouseLeave={() => setActive(null)}>
        {agents.roster.map((a, i) => {
          const dim = active !== null && active !== a.n;
          return (
            <motion.li
              key={a.n}
              className="relative flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: size,
                height: size,
                marginLeft: i === 0 ? 0 : -overlap,
                zIndex: active === a.n ? 20 : agents.roster.length - i,
                background: a.colour,
                boxShadow: "0 0 0 3px var(--surface)",
              }}
              initial={still ? false : { scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 + i * 0.055, type: "spring", stiffness: 340, damping: 22 }}
              onMouseEnter={() => setActive(a.n)}
              onFocus={() => setActive(a.n)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              /* The lift and the drain are animated, never the mount state:
                 `animate` here would fight the whileInView entrance above. */
              animate={
                still
                  ? undefined
                  : { y: active === a.n ? -6 : 0, filter: dim ? "saturate(0.15)" : "saturate(1)" }
              }
            >
              <AgentGlyph kind={a.glyph} size={Math.round(size * 0.5)} />
              <span className="sr-only">{`${a.n} ${a.name}`}</span>
            </motion.li>
          );
        })}
      </ul>

      {/* The reserved line. Fixed height, so the row above never shifts. */}
      <div className="mt-[12px] flex h-[18px] items-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current ? (
            <motion.p
              key={current.n}
              className="t-mono flex items-center gap-[8px] whitespace-nowrap"
              initial={still ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <span style={{ color: current.colour }}>{current.n}</span>
              <span style={{ color: "var(--ink)" }}>{current.name}</span>
            </motion.p>
          ) : (
            <motion.p
              key="rest"
              className="t-mono whitespace-nowrap"
              style={{ color: "var(--ink-40)" }}
              initial={still ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={still ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {agents.rowHint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * One glyph per department, drawn on a 24 grid at a single stroke weight so
 * the set reads as one family at 20px rather than nine borrowed icons.
 */
function AgentGlyph({ kind, size }: { kind: string; size: number }) {
  const p = {
    stroke: "#fff",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {kind === "crate" ? (
        <>
          <path d="M4 9l8-4 8 4v6l-8 4-8-4z" {...p} />
          <path d="M4 9l8 4 8-4M12 13v6" {...p} />
        </>
      ) : null}
      {kind === "ledger" ? (
        <>
          <rect x="5" y="4" width="14" height="16" rx="2" {...p} />
          <path d="M9 9h6M9 13h6M9 17h3" {...p} />
        </>
      ) : null}
      {kind === "post" ? (
        <>
          <rect x="4" y="6" width="16" height="12" rx="2.5" {...p} />
          <path d="M8 11h8M8 14.5h5" {...p} />
        </>
      ) : null}
      {kind === "phone" ? (
        <path
          d="M6 4h3l1.6 4-2 1.4a10 10 0 0 0 5.2 5.2L15.2 12l4 1.6V17c0 1.1-.9 2-2 2A13.5 13.5 0 0 1 4 6c0-1.1.9-2 2-2z"
          {...p}
        />
      ) : null}
      {kind === "pin" ? (
        <>
          <path d="M12 21c-3.6-4.4-6-7.3-6-10a6 6 0 1 1 12 0c0 2.7-2.4 5.6-6 10z" {...p} />
          <circle cx="12" cy="11" r="2.2" {...p} />
        </>
      ) : null}
      {kind === "table" ? (
        <>
          <circle cx="12" cy="12" r="4.4" {...p} />
          <path d="M12 4v3.2M12 16.8V20M4 12h3.2M16.8 12H20" {...p} />
        </>
      ) : null}
      {kind === "loyalty" ? (
        <>
          <rect x="3" y="8" width="18" height="12" rx="2" {...p} />
          <path d="M3 12h18" {...p} />
          <circle cx="8" cy="16" r="1.4" {...p} />
          <circle cx="12" cy="16" r="1.4" {...p} />
          <circle cx="16" cy="16" r="1.4" {...p} />
        </>
      ) : null}
      {kind === "file" ? (
        <>
          <path d="M7 4h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" {...p} />
          <path d="M14 4v4h4M9.5 14.5l2 2 3.5-4" {...p} />
        </>
      ) : null}
      {kind === "till" ? (
        <>
          <rect x="4" y="8" width="16" height="11" rx="2" {...p} />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M9 13h6" {...p} />
        </>
      ) : null}
    </svg>
  );
}
