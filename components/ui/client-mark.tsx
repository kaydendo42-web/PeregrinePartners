import { brandMarks } from "./brand-marks";

/**
 * A name in the site's type, with its mark beside it.
 *
 * Two jobs in one component, because the two cases must not be confused.
 *
 * The connection rail names products we read and write through, and those get
 * their real symbols from `brand-marks`. They are trademarks used to identify
 * a product, not to borrow its credibility: the rail is labelled "runs on what
 * you already pay for", which is a statement about the reader's bills and not
 * a claim of partnership.
 *
 * Everything else, the roster's client venues among them, falls through to a
 * deterministic neutral glyph. A client with no artwork gets a placeholder,
 * never a stand-in logo, because a made up mark for a real business is a
 * different thing entirely from a real mark for a real product.
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
  const brand = brandMarks[name];

  /* One optical height for every mark. Width follows the tight box's ratio,
     so a wide symbol stays wide and a square one stays square rather than all
     of them being squeezed into the same box. */
  const H = 24;

  return (
    <div
      className="flex items-center gap-[10px]"
      style={{ color, transform: `scale(${scale})`, opacity: tone === "light" ? 0.92 : 1 }}
    >
      {brand ? (
        <svg
          height={H}
          width={Math.round(H * brand.ratio)}
          viewBox={brand.viewBox}
          fill="currentColor"
          className="shrink-0"
          aria-hidden
        >
          <path d={brand.d} />
        </svg>
      ) : (
        <NeutralGlyph name={name} />
      )}

      {brand?.nameInMark ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span
          style={{
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}

/** The placeholder, for a name with no artwork we are entitled to use. */
function NeutralGlyph({ name }: { name: string }) {
  const glyph = name.charCodeAt(0) % 4;
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
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
  );
}
