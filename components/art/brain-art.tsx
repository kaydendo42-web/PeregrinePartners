"use client";

import { motion } from "motion/react";

/**
 * "Digital brain" render for the hero product card — a chrome capsule core
 * with orbiting rings and a scanning readout, drawn in SVG so it stays crisp.
 */
export function BrainArt({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
      <svg viewBox="0 0 320 220" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4f7ff" />
            <stop offset="35%" stopColor="#9fb0c8" />
            <stop offset="60%" stopColor="#e8eef8" />
            <stop offset="100%" stopColor="#5d6b80" />
          </linearGradient>
          <linearGradient id="warm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffb774" />
            <stop offset="50%" stopColor="#fff3e0" />
            <stop offset="100%" stopColor="#8fd4ff" />
          </linearGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bfe6ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0b1020" stopOpacity="0" />
          </radialGradient>
          <filter id="blurSm"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>

        <rect width="320" height="220" fill="#050608" />
        <ellipse cx="160" cy="110" rx="130" ry="80" fill="url(#coreGlow)" />

        {/* wire grid floor */}
        <g stroke="#2b3444" strokeWidth="0.4" opacity="0.7">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={140 + i * 10} x2="320" y2={140 + i * 10} />
          ))}
          {Array.from({ length: 17 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="140" x2={i * 20} y2="220" />
          ))}
        </g>

        {/* core capsule */}
        <g>
          <rect x="96" y="82" width="128" height="56" rx="28" fill="url(#chrome)" />
          <rect x="96" y="82" width="128" height="56" rx="28" fill="url(#warm)" opacity="0.35" />
          <rect x="112" y="94" width="96" height="14" rx="7" fill="#ffffff" opacity="0.55" filter="url(#blurSm)" />
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} x={110 + i * 15} y="82" width="2" height="56" fill="#0b1220" opacity="0.35" />
          ))}
          <circle cx="96" cy="110" r="26" fill="url(#chrome)" />
          <circle cx="224" cy="110" r="26" fill="url(#chrome)" />
          <circle cx="96" cy="110" r="12" fill="#ffcf9a" opacity="0.9" />
          <circle cx="224" cy="110" r="12" fill="#9fdcff" opacity="0.9" />
        </g>

        {/* orbit rings */}
        <motion.g
          style={{ originX: "160px", originY: "110px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          <ellipse cx="160" cy="110" rx="120" ry="42" fill="none" stroke="#7ea6c9" strokeWidth="0.6" opacity="0.5" />
          <ellipse cx="160" cy="110" rx="96" ry="70" fill="none" stroke="#7ea6c9" strokeWidth="0.4" opacity="0.35" />
        </motion.g>

        {/* readout ticks */}
        <g fill="#89a7c4" fontSize="4" fontFamily="monospace" opacity="0.75">
          <text x="16" y="24">NEURAL CORE</text>
          <text x="238" y="24">v4.0.2</text>
          <text x="16" y="204">STATUS / ONLINE</text>
          <text x="232" y="204">LATENCY 42MS</text>
        </g>
      </svg>

      {/* scan line */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-[36%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(190,225,255,0.12) 50%, rgba(255,255,255,0) 100%)",
        }}
        animate={{ y: ["-40%", "150%"] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
