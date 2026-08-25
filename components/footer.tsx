"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { LogoPill } from "./ui/mark";
import { footer } from "@/lib/content";

const SOCIALS = ["x", "in", "yt", "ig"] as const;

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    setEmail("");
  };

  return (
    <footer
      id="footer"
      className="sticky bottom-0 z-0 flex min-h-[1050px] w-full flex-col justify-end overflow-hidden bg-[#0d1410]"
    >
      <GardenArt />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-[24px] pb-[40px] md:px-[40px]">
        <div className="flex flex-col gap-[60px] lg:flex-row lg:justify-between">
          {/* brand block */}
          <div className="w-full max-w-[400px]">
            <div className="flex items-center gap-[12px]">
              <LogoPill dark={false} />
              <span
                className="text-white"
                style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.04em" }}
              >
                peregrine
              </span>
            </div>

            <p className="t-body-sm mt-[22px] text-white">{footer.blurb}</p>

            <form
              onSubmit={submit}
              className="mt-[26px] flex w-full max-w-[400px] items-center gap-[8px] backdrop-blur-[6px]"
              style={{ background: "rgba(255,255,255,0.2)", borderRadius: 17, padding: 6 }}
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent px-[12px] text-white outline-none placeholder:text-white/60"
                style={{ fontSize: 15, height: 42 }}
              />
              <Button variant="small" type="submit" className="shrink-0">
                {sent ? "Sent" : "Subscribe"}
              </Button>
            </form>

            <p className="t-mono mt-[34px] text-white">Follow Us:</p>
            <div className="mt-[16px] flex items-center gap-[10px]">
              {SOCIALS.map((s) => (
                <motion.a
                  key={s}
                  href="#footer"
                  aria-label={s}
                  className="flex h-[34px] w-[34px] items-center justify-center text-white"
                  style={{ background: "var(--paper-10)", borderRadius: 6 }}
                  whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.22)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                >
                  <SocialGlyph kind={s} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* link columns */}
          <div className="flex flex-wrap gap-y-[40px]">
            {footer.columns.map((col) => (
              <div
                key={col.title}
                className="w-[200px] pl-[16px]"
                style={{ borderLeft: "1px solid var(--paper-10)" }}
              >
                <p
                  className="font-mono text-white"
                  style={{ fontSize: 16, lineHeight: "22.4px", fontWeight: 500 }}
                >
                  {col.title}
                </p>
                <ul className="mt-[26px] flex flex-col gap-[12px]">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="inline-block text-white transition-opacity duration-300 hover:opacity-60"
                        style={{ fontSize: 14, lineHeight: "21px", fontWeight: 300 }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* oversized wordmark, cropped by the page edge */}
        <div className="relative mt-[70px] h-[150px] overflow-hidden md:h-[200px]">
          <motion.p
            className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-white"
            style={{
              fontSize: "clamp(140px, 24vw, 360px)",
              lineHeight: 0.78,
              fontWeight: 600,
              letterSpacing: "-0.05em",
              mixBlendMode: "screen",
            }}
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {footer.wordmark}
          </motion.p>
        </div>
      </div>
    </footer>
  );
}

function SocialGlyph({ kind }: { kind: (typeof SOCIALS)[number] }) {
  const p = { stroke: "currentColor", strokeWidth: 1.5, fill: "none" } as const;
  if (kind === "x")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 4l16 16M20 4L4 20" {...p} strokeLinecap="round" />
      </svg>
    );
  if (kind === "in")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" {...p} />
        <path d="M8 10v7M8 7.4v.1M12 17v-4a2.6 2.6 0 015 0v4" {...p} strokeLinecap="round" />
      </svg>
    );
  if (kind === "yt")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...p} />
        <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...p} />
      <circle cx="12" cy="12" r="4" {...p} />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

/** Night-garden backdrop with a lit plinth — drawn, not photographed. */
function GardenArt() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 1440 1050" className="h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <defs>
          <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e1a12" />
            <stop offset="45%" stopColor="#1d3324" />
            <stop offset="100%" stopColor="#12200f" />
          </linearGradient>
          <radialGradient id="plinth" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#d8ffe4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#d8ffe4" stopOpacity="0" />
          </radialGradient>
          <filter id="bushBlur"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>

        <rect width="1440" height="1050" fill="url(#night)" />
        <ellipse cx="720" cy="700" rx="520" ry="330" fill="url(#plinth)" opacity="0.5" />

        {/* lit plinth */}
        <g transform="translate(560 520)">
          <path d="M0 90 L160 30 L320 90 L320 300 L0 300 Z" fill="#f7fff9" opacity="0.92" />
          <path d="M0 90 L160 30 L320 90 L160 150 Z" fill="#ffffff" />
          <path d="M0 90 L160 150 L160 400 L0 340 Z" fill="#e7f7ec" opacity="0.55" />
          <path d="M320 90 L160 150 L160 400 L320 340 Z" fill="#cfe8d6" opacity="0.4" />
          <path d="M0 90 L160 30 L320 90" stroke="#ffd9a0" strokeWidth="2" fill="none" />
        </g>

        {/* foliage banks */}
        {[
          { cx: 180, cy: 830, rx: 320, ry: 150, fill: "#2b5230" },
          { cx: 1290, cy: 820, rx: 330, ry: 160, fill: "#25401f" },
          { cx: 640, cy: 930, rx: 420, ry: 170, fill: "#1c3a1f" },
          { cx: 1080, cy: 960, rx: 380, ry: 150, fill: "#16301a" },
        ].map((b, i) => (
          <ellipse key={i} {...b} filter="url(#bushBlur)" opacity="0.95" />
        ))}

        {/* blossoms */}
        <g>
          {Array.from({ length: 160 }).map((_, i) => {
            const x = (i * 137) % 1440;
            const y = 780 + ((i * 61) % 260);
            const warm = i % 6 === 0;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={warm ? 3 : 2}
                fill={warm ? "#ff8a5b" : "#7fc98a"}
                opacity={warm ? 0.85 : 0.4}
              />
            );
          })}
        </g>
        <rect width="1440" height="1050" fill="#0a1a10" opacity="0.28" />
      </svg>
    </div>
  );
}
