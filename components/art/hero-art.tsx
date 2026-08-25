"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Hero backdrop, drawn rather than photographed: a hazy sky, two blurred
 * ridges of meadow, and a glowing screen cresting the hill.
 */
export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 880"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f2f2f0" />
              <stop offset="45%" stopColor="#eceae2" />
              <stop offset="78%" stopColor="#e2ddcb" />
              <stop offset="100%" stopColor="#c3cdb4" />
            </linearGradient>
            <radialGradient id="bloom" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#ffe9c0" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffe9c0" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ridgeFar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5d7042" />
              <stop offset="100%" stopColor="#33421f" />
            </linearGradient>
            <linearGradient id="ridgeNear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3d4d26" />
              <stop offset="60%" stopColor="#1d2612" />
              <stop offset="100%" stopColor="#0f150a" />
            </linearGradient>
            <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id="vig" cx="50%" cy="52%" r="72%">
              <stop offset="55%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
            </radialGradient>
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>

          <rect width="1440" height="880" fill="url(#sky)" />
          <ellipse cx="720" cy="470" rx="520" ry="300" fill="url(#bloom)" />

          <path
            d="M-40 640 C 180 560 380 520 720 512 C 1060 520 1280 570 1480 646 L1480 900 L-40 900 Z"
            fill="url(#ridgeFar)"
            filter="url(#soft)"
            opacity="0.85"
          />

          <g transform="translate(646 372)">
            <ellipse cx="86" cy="86" rx="220" ry="150" fill="url(#bloom)" />
            <rect x="4" y="14" width="164" height="136" rx="14" fill="#8f8b83" />
            <rect x="12" y="22" width="148" height="120" rx="12" fill="#6f6b64" />
            <rect x="22" y="32" width="128" height="100" rx="9" fill="#fffdf4" />
            <rect x="22" y="32" width="128" height="100" rx="9" fill="url(#bloom)" />
            <rect x="34" y="150" width="100" height="8" rx="4" fill="#7a766f" />
            <path d="M78 14 L64 -34" stroke="#8f8b83" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M92 14 L124 -22" stroke="#8f8b83" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="86" cy="82" rx="132" ry="96" fill="url(#bloom)" opacity="0.8" />
          </g>

          <path
            d="M-40 700 C 240 606 460 566 760 574 C 1080 584 1300 640 1480 726 L1480 900 L-40 900 Z"
            fill="url(#ridgeNear)"
          />

          <g>
            {Array.from({ length: 220 }).map((_, i) => {
              const x = (i * 71) % 1460;
              const yy = 610 + ((i * 47) % 280);
              const h = 8 + ((i * 13) % 18);
              const lean = ((i % 5) - 2) * 3;
              return (
                <path
                  key={`b${i}`}
                  d={`M${x} ${yy} q${lean} ${-h / 2} ${lean * 1.6} ${-h}`}
                  stroke={i % 7 === 0 ? "#9cb37a" : "#5f7546"}
                  strokeWidth="1.2"
                  fill="none"
                  opacity={0.5 + ((i % 4) * 0.1)}
                />
              );
            })}
            {Array.from({ length: 70 }).map((_, i) => {
              const x = (i * 131) % 1440;
              const yy = 640 + ((i * 59) % 250);
              const warm = i % 3 === 0;
              return (
                <circle
                  key={`f${i}`}
                  cx={x}
                  cy={yy}
                  r={warm ? 2.6 : 1.8}
                  fill={warm ? "#f5a45c" : "#e8e2cf"}
                  opacity={warm ? 0.8 : 0.55}
                />
              );
            })}
          </g>
          <path
            d="M-40 812 C 260 748 520 726 760 736 C 1040 748 1280 792 1480 852 L1480 900 L-40 900 Z"
            fill="#0b1207"
            opacity="0.92"
          />
          <rect width="1440" height="880" filter="url(#grain)" opacity="0.16" />
          <rect width="1440" height="880" fill="url(#vig)" />
        </svg>
      </motion.div>
      <div
        className="absolute inset-x-0 top-0 h-[62%]"
        style={{
          background:
            "linear-gradient(180deg, var(--surface) 18%, rgba(240,240,240,0.72) 58%, rgba(240,240,240,0) 100%)",
        }}
      />
    </div>
  );
}
