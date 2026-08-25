/** House mark — a stepped chevron pair, sized for button icon slots. */
export function Mark({ className = "", size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size / 2}
      viewBox="0 0 30 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g fill="currentColor">
        <rect x="2" y="6" width="3.4" height="3.4" rx="0.6" />
        <rect x="7" y="2.5" width="3.4" height="3.4" rx="0.6" />
        <rect x="7" y="9.5" width="3.4" height="3.4" rx="0.6" />
        <rect x="12" y="6" width="3.4" height="3.4" rx="0.6" />
        <rect x="18" y="2.5" width="3.4" height="3.4" rx="0.6" />
        <rect x="18" y="9.5" width="3.4" height="3.4" rx="0.6" />
        <rect x="23" y="6" width="3.4" height="3.4" rx="0.6" />
      </g>
    </svg>
  );
}

/** Capsule logo lockup used in the nav and the footer. */
export function LogoPill({ dark = true }: { dark?: boolean }) {
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: 76,
        height: 34,
        background: dark ? "var(--ink)" : "transparent",
        border: dark ? "none" : "2px solid #fff",
      }}
      aria-label="Peregrine"
    >
      <span
        className="block rounded-full"
        style={{
          width: 34,
          height: 14,
          background: dark ? "#fff" : "transparent",
          border: dark ? "none" : "2px solid #fff",
        }}
      />
    </div>
  );
}
