"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { brand, footer } from "@/lib/content";

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
      className="sticky bottom-0 z-0 flex min-h-[760px] w-full flex-col justify-end overflow-hidden bg-[#0d1410] md:min-h-[1140px]"
    >
      <div className="pointer-events-none absolute inset-0">
        <img src={footer.bg} alt="" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(8,18,10,0.28)" }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-[24px] pb-[40px] md:px-[40px] md:pb-[113px]">
        <div className="flex flex-col gap-[60px] lg:flex-row lg:justify-start lg:gap-[262px]">
          {/* brand block */}
          <div className="w-full max-w-[400px]">
            <div className="flex flex-col items-start gap-[17px]">
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 60, height: 32, border: "4px solid #fff" }}
                aria-hidden
              />
              {brand.wordmarkSrc ? (
                <img src={brand.wordmarkSrc} alt={brand.name} className="h-[42px] w-[155px] object-contain" />
              ) : (
                <span
                  className="text-white"
                  style={{ fontSize: 38, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.045em" }}
                >
                  {brand.name}
                </span>
              )}
            </div>

            <p className="t-body-sm mt-[15px] text-white">{footer.blurb}</p>

            <form
              onSubmit={submit}
              className="mt-[20px] flex w-full max-w-[400px] items-center gap-[8px] backdrop-blur-[6px]"
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
              <Button variant="small" type="submit" gap={20} className="shrink-0">
                {sent ? "Sent" : "Subscribe"}
              </Button>
            </form>

            <p className="t-mono mt-[30px] text-white">Follow Us:</p>
            <div className="mt-[10px] flex items-center gap-[10px]">
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
                className="w-[200px] pl-[35px]"
                style={{ borderLeft: "1px solid var(--paper-20)" }}
              >
                <p
                  className="font-mono text-white"
                  style={{ fontSize: 16, lineHeight: "22.4px", fontWeight: 500 }}
                >
                  {col.title}
                </p>
                <ul className="mt-[26px] flex flex-col gap-[12px]">
                  {col.links.map((l) => (
                    <li key={l.label} className="group/link flex h-[21px] items-center">
                      {/* the marker hangs in the 35px indent, as in the reference */}
                      <span
                        className="-ml-[35px] mr-[20px] block h-[1px] w-[15px] shrink-0 transition-[width] duration-300 group-hover/link:w-[24px]"
                        style={{ background: "var(--paper-40)" }}
                      />
                      <Link
                        href={l.href}
                        className="block text-white transition-opacity duration-300 hover:opacity-60"
                        style={{ fontSize: 14, lineHeight: "21px", fontWeight: 300, letterSpacing: "0.28px" }}
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
        <div className="relative mt-[19px] h-[190px] overflow-hidden md:h-[398px]">
          <motion.p
            className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-white"
            style={{
              fontSize: "min(26.3vw, 379px)",
              lineHeight: 0.92,
              fontWeight: 600,
              letterSpacing: "-0.05em",
              mixBlendMode: "screen",
            }}
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {brand.name}
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
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="currentColor"
        />
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
