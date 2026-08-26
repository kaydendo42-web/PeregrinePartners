/** Twelve-point asterisk used as a separator inside the display marquees.
 *  Each petal is a wedge: narrow where it meets the centre, wide and
 *  round-tipped at the rim, which is what gives the mark its bloom. */
export function Starburst({ size = 151, color = "var(--ink-10)" }: { size?: number; color?: string }) {
  const petals = Array.from({ length: 12 });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ flexShrink: 0 }}>
      <g fill={color}>
        {petals.map((_, i) => (
          <path
            key={i}
            d="M47.4 45.5 L44.6 13.5 Q50 6.5 55.4 13.5 L52.6 45.5 Q50 48.5 47.4 45.5 Z"
            transform={`rotate(${(i * 360) / petals.length} 50 50)`}
          />
        ))}
      </g>
    </svg>
  );
}
