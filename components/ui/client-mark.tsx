/**
 * Placeholder client marks. Each name gets a deterministic glyph so the
 * logo strip reads like a row of real wordmarks without borrowing any.
 */
export function ClientMark({
  name,
  tone = "dark",
  scale = 1,
}: {
  name: string;
  tone?: "dark" | "light";
  scale?: number;
}) {
  const color = tone === "light" ? "#ffffff" : "var(--ink)";
  const glyph = name.charCodeAt(0) % 4;

  return (
    <div
      className="flex items-center gap-[12px]"
      style={{ color, transform: `scale(${scale})`, opacity: tone === "light" ? 0.92 : 1 }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
        {glyph === 0 && (
          <path d="M12 2l3.2 6.8L22 12l-6.8 3.2L12 22l-3.2-6.8L2 12l6.8-3.2z" fill="currentColor" />
        )}
        {glyph === 1 && (
          <>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="3.4" fill="currentColor" />
          </>
        )}
        {glyph === 2 && (
          <>
            <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
          </>
        )}
        {glyph === 3 && (
          <path d="M4 18V6l8 6 8-6v12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <span
        style={{
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    </div>
  );
}
