"use client";

import { motion, useReducedMotion } from "motion/react";
import { agents } from "@/lib/content";

/**
 * The nine agents, as a row of discs.
 *
 * The template ran a stack of illustrated faces here under a headline count of
 * active agents. The mechanic is worth keeping: an overlapping row of people
 * reads as staff, where a list of automations reads as a settings page. What
 * is not worth keeping is the faces, which were stock illustrations of nobody.
 *
 * So each disc is a branch instead, wearing its own colour and carrying the
 * glyph for the work it does, in the order the two branch sections number
 * them. This is the only colour on the site, and it is doing a job: nine
 * distinct hues make the row read as nine separate hands rather than one
 * process, which is the whole point of counting them.
 *
 * They overlap left to right and lift on hover, so a reader can pick one out.
 */
export function AgentAvatars({ size = 36, overlap = 11 }: { size?: number; overlap?: number }) {
  const still = useReducedMotion();

  return (
    <ul className="flex items-center">
      {agents.roster.map((a, i) => (
        <motion.li
          key={a.n}
          className="relative flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -overlap,
            zIndex: agents.roster.length - i,
            background: a.colour,
            boxShadow: "0 0 0 3px var(--surface)",
          }}
          initial={still ? false : { scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 + i * 0.055, type: "spring", stiffness: 340, damping: 22 }}
          whileHover={{ y: -5, zIndex: 20 }}
          title={`${a.n} ${a.name}`}
        >
          <AgentGlyph kind={a.glyph} size={Math.round(size * 0.5)} />
          <span className="sr-only">{`${a.n} ${a.name}`}</span>
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * One glyph per branch, drawn on a 24 grid at a single stroke weight so nine
 * of them read as one set at 20px rather than nine borrowed icons.
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
      {kind === "roster" ? (
        <>
          <rect x="4" y="6" width="16" height="14" rx="2" {...p} />
          <path d="M4 10h16M8 4v3M16 4v3M9 14h6" {...p} />
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
