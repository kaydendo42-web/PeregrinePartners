import { sources, type SourceKey } from "@/lib/content";

/**
 * A source line.
 *
 * Every figure on this site carries one, which is the whole reason the site is
 * allowed to use figures at all — see the note at the top of `lib/content.ts`.
 * Set in the mono face at label scale so it reads as apparatus rather than
 * copy, and always a real link: a citation you cannot follow is decoration.
 */
export function Cite({
  keys,
  tone = "light",
  className = "",
}: {
  keys: SourceKey[] | SourceKey;
  /** `light` = dark type on a light ground. `dark` = white type on a dark one. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 0) return null;

  const color = tone === "dark" ? "var(--paper-50)" : "var(--ink-40)";

  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px] font-mono ${className}`}
      style={{ fontSize: 11, lineHeight: "17px", letterSpacing: "0.02em", color }}
    >
      <span aria-hidden>{"//"}</span>
      {list.map((k, i) => {
        const s = sources[k];
        return (
          <span key={k}>
            <a
              href={s.href}
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-current/30 underline-offset-[3px] transition-colors duration-300 hover:text-current hover:decoration-current"
              style={{ color }}
            >
              {s.label}
            </a>
            {i < list.length - 1 ? <span aria-hidden> ·</span> : null}
          </span>
        );
      })}
    </p>
  );
}
