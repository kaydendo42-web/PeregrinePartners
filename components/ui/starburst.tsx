/** Twelve-point asterisk used as a separator inside the display marquees. */
export function Starburst({ size = 151, color = "var(--ink-10)" }: { size?: number; color?: string }) {
  const petals = Array.from({ length: 12 });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ flexShrink: 0 }}>
      <g fill={color}>
        {petals.map((_, i) => (
          <rect
            key={i}
            x="44.5"
            y="3"
            width="11"
            height="45"
            rx="5.5"
            transform={`rotate(${(i * 360) / petals.length} 50 50)`}
          />
        ))}
      </g>
    </svg>
  );
}
