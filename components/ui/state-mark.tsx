/**
 * The three states, as a mark.
 *
 * This is the product's core mechanic and the site's structural grammar: every
 * action a branch takes lands in exactly one of these, and the site says so in
 * the same shape everywhere it comes up.
 *
 * Told apart by **weight, not hue** — the rule `app/platform.css` already
 * follows for the floor. A solid mark is a decision sitting on your desk, a
 * ring is something being watched, a hairline is something already handled.
 * That ordering is deliberate: the heaviest ink is the thing that needs a
 * person, so a page of them reads as a queue at a glance and a page without
 * them reads as a quiet night.
 */

export type StateKey = "needs" | "watching" | "done" | "brief";

const SIZES = { sm: 10, md: 14, lg: 20 } as const;

export function StateMark({
  state,
  size = "md",
  tone = "dark",
  className = "",
}: {
  state: StateKey;
  size?: keyof typeof SIZES;
  /** The ground it sits on: `dark` = white ink, `light` = dark ink. */
  tone?: "dark" | "light";
  className?: string;
}) {
  const s = SIZES[size];
  const ink = tone === "dark" ? "#ffffff" : "var(--ink)";
  const r = s / 2 - 1;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {state === "needs" ? (
        <circle cx={s / 2} cy={s / 2} r={r} fill={ink} />
      ) : state === "watching" ? (
        <circle cx={s / 2} cy={s / 2} r={r} stroke={ink} strokeWidth="1.6" opacity="0.75" />
      ) : state === "done" ? (
        <circle cx={s / 2} cy={s / 2} r={r} stroke={ink} strokeWidth="1" opacity="0.28" />
      ) : (
        /* The brief is the moment the queue is handed over, so it is the solid
           mark held inside a ring — both states at once — rather than a fourth
           shape the reader has to learn. */
        <>
          <circle cx={s / 2} cy={s / 2} r={r} stroke={ink} strokeWidth="1" opacity="0.5" />
          <circle cx={s / 2} cy={s / 2} r={Math.max(r - 3, 1.6)} fill={ink} />
        </>
      )}
    </svg>
  );
}
